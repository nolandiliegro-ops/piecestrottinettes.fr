

`has_role(auth.uid(), 'admin'::app_role)` existe déjà et est largement utilisée dans toutes les policies RLS du projet (visible dans `<db-functions>` et dans toutes les policies admin existantes : `orders`, `parts`, `order_messages`, etc.). Elle s'appuie sur la table `user_roles` avec l'enum `app_role`. C'est la méthode officielle et sécurisée du projet — pas de changement à prévoir.

# Plan final confirmé

## Migration SQL (inchangée)

```sql
-- 1. Policy admin pour marquer messages client comme lus
CREATE POLICY "Admins can mark client messages as read"
ON public.order_messages FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) AND sender_type = 'client');

-- 2. Table conversation_status
CREATE TABLE public.conversation_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  order_id uuid,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','replied','closed')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, order_id)
);
ALTER TABLE public.conversation_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access" ON public.conversation_status
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Users view own status" ON public.conversation_status
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 3. Trigger auto-sync
CREATE OR REPLACE FUNCTION public.sync_conversation_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO conversation_status(user_id, order_id, status, updated_at)
  VALUES (NEW.user_id, NEW.order_id,
    CASE WHEN NEW.sender_type='client' THEN 'pending' ELSE 'replied' END,
    now())
  ON CONFLICT (user_id, order_id) DO UPDATE
    SET status = CASE
      WHEN NEW.sender_type='client' THEN 'pending'
      ELSE 'replied' END,
    updated_at = now();
  RETURN NEW;
END $$;

CREATE TRIGGER trg_sync_conversation_status
  AFTER INSERT ON public.order_messages
  FOR EACH ROW WHEN (NEW.user_id IS NOT NULL)
  EXECUTE FUNCTION public.sync_conversation_status();

-- 4. Backfill historique
INSERT INTO conversation_status(user_id, order_id, status, updated_at)
SELECT DISTINCT ON (user_id, order_id)
  user_id, order_id,
  CASE WHEN sender_type='client' THEN 'pending' ELSE 'replied' END,
  created_at
FROM order_messages WHERE user_id IS NOT NULL
ORDER BY user_id, order_id, created_at DESC, id
ON CONFLICT DO NOTHING;
```

## Modifications `ContactMessagesManager.tsx`

| Zone | Modification |
|---|---|
| Interface `ClientThread` | +`status: 'pending'\|'replied'\|'closed'` |
| `GarageTab.fetchThreads` | Fetch `conversation_status` après build threads, mapper sur chaque thread |
| `GarageConversationView.fetchMessages` | Mark-as-read auto : update `read_at` sur messages client à l'ouverture |
| `GarageTab` rendu | Filtres `Tous / En attente / Répondus / Fermés` avec compteurs + tri pending d'abord |
| Card thread | Pill statut (orange/vert/gris) |
| `GarageConversationView` header | Bouton "Fermer la conversation" → update status='closed' |

## Garanties
- `has_role` confirmé fonctionnel (déjà utilisée partout)
- Aucune modif `GarageMessages.tsx`, `Garage.tsx`, `useOrderMessages.ts`
- Trigger DB = source de vérité, 0 risque de désync
- Backfill préserve l'historique existant
- Réouverture auto si client réécrit après `closed`

