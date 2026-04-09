

# Plan — 4 corrections messagerie

## Migration SQL

`order_id` sur `order_messages` est NOT NULL. Pour permettre les messages sans commande, il faut le rendre nullable et ajuster les RLS :

```sql
ALTER TABLE public.order_messages ALTER COLUMN order_id DROP NOT NULL;

-- Client: voir ses messages directs (sans order_id)
CREATE POLICY "Users can view own direct messages" ON public.order_messages
  FOR SELECT TO authenticated
  USING (order_id IS NULL AND user_id = auth.uid());

-- Client: insérer des messages directs
CREATE POLICY "Users can insert direct messages" ON public.order_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_type = 'client' AND user_id = auth.uid() AND order_id IS NULL
  );
```

## Fichiers modifiés (5 fichiers + 1 migration + 1 edge function redéployée)

### 1. `src/components/garage/GarageMessages.tsx`
- Ajouter bouton "✉️ Envoyer un message" en haut qui toggle un formulaire inline
- Formulaire : sujet (input texte), message (textarea), sélecteur de commande optionnel (dropdown avec les commandes du user)
- L'envoi insère dans `order_messages` avec `order_id` null si pas de commande sélectionnée
- Adapter `ConversationList` pour afficher aussi les conversations sans order (groupées par messages directs)

### 2. `src/hooks/useOrderMessages.ts`
- Adapter `useOrderConversations` pour inclure les messages avec `order_id IS NULL`
- Adapter `useSendMessage` pour accepter `orderId` nullable

### 3. `supabase/functions/send-message-notification/index.ts`
- Refactorer pour supporter deux destinataires : `recipient: 'client' | 'admin'`
- Template client (admin → client) : header vert sauge, titre "💬 Nouveau message de notre équipe", message complet dans bloc encadré, numéro de commande si applicable, bouton CTA "RÉPONDRE DANS MON GARAGE" → `https://piecestrottinettes.fr/garage?tab=messages`, footer
- Template admin (client → admin) : envoi à `contact@piecestrottinettes.fr`, affiche nom client, email, numéro de commande si applicable, message complet
- URL du CTA corrigée : `piecestrottinettes.fr` au lieu de `.lovable.app`

### 4. `src/components/garage/GarageMessages.tsx` (suite)
- Quand le client envoie un message → appeler `send-message-notification` avec `recipient: 'admin'` + infos client

### 5. `src/components/admin/ContactMessagesManager.tsx`
- Ajouter des onglets "Contact" / "Garage" avec Tabs
- Onglet "Garage" : fetch `order_messages` WHERE `sender_type = 'client'` avec jointure sur `orders` pour `order_number`, `customer_email`, `customer_first_name`
- Afficher : nom, email, numéro de commande, message, date
- Bouton "Répondre" : input texte + envoi → insert `order_messages` sender_type='admin' + appel edge function `send-message-notification` recipient='client'

## Ordre d'exécution

```text
1. Migration — order_id nullable + RLS            (5 min)
2. Edge function — dual recipient + templates     (15 min)
3. useOrderMessages — support nullable orderId    (10 min)
4. GarageMessages — bouton nouveau message        (15 min)
5. ContactMessagesManager — onglet Garage         (15 min)
```

**Total estimé : ~1h**

