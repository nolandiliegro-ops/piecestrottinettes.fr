

# Plan — 2 corrections messagerie

## Fichiers à modifier (4 fichiers)

### 1. `supabase/functions/send-message-notification/index.ts`
- Rétablir le type `recipient: 'client-ack'` dans l'interface
- Ajouter un template `client-ack` identique au template client mais avec le titre "✅ Votre message a bien été envoyé" au lieu de "💬 Nouveau message de notre équipe"
- Le sujet email sera le même que les autres pour le threading Gmail

### 2. `supabase/functions/send-contact-email/index.ts`
- Supprimer la condition `if (!user_id)` (ligne 115) : envoyer l'accusé de réception à TOUS les utilisateurs, connectés ou non
- Remplacer le template HTML laid de l'accusé par un appel à `send-message-notification` avec `recipient: 'client-ack'` pour les utilisateurs connectés
- Pour les non-connectés, utiliser le même beau template vert sauge inline (pas d'appel à l'edge function car pas de conversationId)

### 3. `src/components/garage/GarageMessages.tsx`
- Dans `NewMessageForm.handleSend` : ajouter un appel `send-message-notification` avec `recipient: 'client-ack'` après la notification admin
- Dans `ChatView.handleSend` : idem, ajouter l'accusé de réception client-ack
- Les conversations sont déjà séparées par order_id (commande) vs null (direct) — **rien à changer** sur le point 2, la logique est déjà correcte dans `useOrderMessages.ts`

### 4. `src/components/admin/ContactMessagesManager.tsx`
- Vérifier que l'onglet Garage affiche bien les 2 types : commandes (order_id non null) et messages directs (order_id null) séparément — actuellement le groupement se fait par `user_id`, ce qui fusionne les 2 types. **À corriger** : grouper par `user_id + order_id` pour créer des fils distincts par commande ET par message direct

## Ordre d'exécution

```text
1. send-message-notification — ajouter template client-ack     (5 min)
2. send-contact-email — accusé pour tous                       (5 min)
3. GarageMessages — ajouter client-ack après envoi             (5 min)
4. ContactMessagesManager — séparer fils par order_id          (10 min)
5. Déployer edge functions                                     (2 min)
```

**Total estimé : ~25 min**

