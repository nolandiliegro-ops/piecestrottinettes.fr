

# Batch — Messagerie client intégrée dans /garage

## Migration SQL — Table `order_messages`

```sql
CREATE TABLE public.order_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_type text NOT NULL, -- 'client' ou 'admin'
  message text NOT NULL,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;

-- Client: voir ses messages via orders.user_id
CREATE POLICY "Users can view own order messages" ON public.order_messages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM orders WHERE orders.id = order_messages.order_id AND orders.user_id = auth.uid()
  ));

-- Client: insérer des messages sur ses commandes
CREATE POLICY "Users can insert own order messages" ON public.order_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_type = 'client' AND user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_messages.order_id AND orders.user_id = auth.uid())
  );

-- Client: marquer comme lu ses messages admin
CREATE POLICY "Users can mark messages as read" ON public.order_messages
  FOR UPDATE TO authenticated
  USING (
    sender_type = 'admin' AND
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_messages.order_id AND orders.user_id = auth.uid())
  );

-- Admin full access
CREATE POLICY "Admins full access on order_messages" ON public.order_messages
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_messages;
```

## Fichiers créés/modifiés (7 fichiers + 1 migration + 1 edge function)

### Ordre d'exécution

1. **Migration SQL** — table `order_messages` + RLS + realtime
2. **`supabase/functions/send-message-notification/index.ts`** (nouveau) — Email via Resend quand l'admin envoie un message. Objet : "Nouveau message pour votre commande PT-XXXX". Corps : message + lien vers `/garage`.
3. **`src/components/garage/GarageMessages.tsx`** (nouveau) — Onglet Messages côté client :
   - Liste des conversations groupées par `order_id` avec dernier message, date, badge non lu
   - Vue conversation : bulles chat (client droite, admin gauche), champ texte + bouton Envoyer
   - Marquer `read_at` quand le client ouvre une conversation admin
   - Realtime via `supabase.channel()` pour messages en temps réel
4. **`src/pages/Garage.tsx`** — Ajouter 3ème onglet "MESSAGES" avec icône `MessageSquare`, badge rouge non lus, type `activeTab` étendu à `'garage' | 'orders' | 'messages'`
5. **`src/components/admin/OrderDetailSheet.tsx`** — Ajouter section "Messages" en bas : fil de conversation + champ réponse. Quand l'admin envoie → insert `order_messages` + appel edge function `send-message-notification`
6. **`src/hooks/useOrderMessages.ts`** (nouveau) — Hook partagé pour fetch messages par order_id, envoyer un message, compter non lus, avec abonnement realtime

### Détails techniques

- **Email notification** : Utilise Resend (déjà configuré avec `RESEND_API_KEY`), même pattern que `send-order-email`. Envoi uniquement quand `sender_type = 'admin'`.
- **Badge non lus** : Query `order_messages` WHERE `sender_type = 'admin'` AND `read_at IS NULL` AND order appartient au user. Affiché sur l'onglet Messages.
- **Realtime** : Subscription `postgres_changes` sur `order_messages` pour mise à jour instantanée des conversations.
- **Chat UI** : Style minimaliste cohérent avec le design existant (bulles arrondies, timestamps discrets, input en bas).

### Estimation : ~1h

