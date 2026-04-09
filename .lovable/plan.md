

# Diagnostic et plan — Finalisation messagerie

## Diagnostic actuel

### Ce qui fonctionne
- **Edge function `send-message-notification`** : 3 templates (client, admin, client-ack) avec header vert sauge, CTA vers `/garage?tab=messages` — OK
- **Contact.tsx** : passe `user_id` si connecté — OK
- **`send-contact-email`** : insert dans `order_messages` si `user_id` fourni — OK
- **GarageMessages.tsx** : formulaire "Nouveau message" avec sujet + dropdown commandes — OK
- **Realtime** : subscription sur `order_messages` — OK

### Problemes identifies

1. **Admin Garage : pas de groupement par client**
   - `ContactMessagesManager.tsx` affiche chaque message client comme une ligne séparée (ligne 260-317)
   - Pas de vue conversation/thread — juste un expand avec le message unique + textarea réponse
   - Le nom affiché est `customer_name` qui vient de `orders.customer_first_name` — les messages sans commande (direct) n'ont ni nom ni email (lignes 84-90 : `customer_email` et `customer_name` sont mappés uniquement si `order_id` existe)
   - Pour les messages directs (order_id null), il faut fetcher le profil via `user_id` → `profiles.display_name` et l'email via `auth.users`

2. **Double email quand le client envoie un message**
   - `GarageMessages.tsx` envoie DEUX emails : `recipient: 'admin'` + `recipient: 'client-ack'` (lignes 67-93 dans NewMessageForm ET lignes 293-320 dans ChatView)
   - Règle demandée : un seul email par message. L'accusé de réception est redondant puisque le client voit son message dans le garage

3. **Lien garage dans emails de commande**
   - `stripe-webhook/index.ts` : les liens pointent vers `/garage` sans `?tab=messages` (lignes 191, 199)
   - `send-order-email` : aucun lien vers le garage

4. **Admin reply : pas de user_id sur le message**
   - `ContactMessagesManager.tsx` ligne 126 : `user_id: null` quand admin répond — mais l'admin ne sait pas quel `user_id` associer au client. Il faut fetcher le `user_id` du client depuis ses messages existants

5. **Admin : pas d'historique conversation**
   - Quand on clique sur un message dans l'onglet Garage, on voit juste ce message — pas tout l'historique du fil

## Plan de correction — 3 fichiers + 1 redéploiement

### 1. `src/components/admin/ContactMessagesManager.tsx` — Refonte onglet Garage

**Grouper par client** : fetcher TOUS les messages de `order_messages`, grouper par `user_id`. Chaque ligne = un client avec son nom, email, dernier message, nombre de messages non lus.

**Résoudre le nom du client** :
- Fetcher `profiles` pour obtenir `display_name` par `user_id`
- Fetcher `auth.users` n'est pas possible côté client → utiliser `orders.customer_first_name + customer_last_name` si le client a des commandes, sinon `profiles.display_name`
- Pour l'email : `orders.customer_email` ou fallback sur le profil

**Vue conversation** : quand on clique sur un client, afficher TOUT l'historique (messages client ET admin) chronologiquement, style iMessage. Champ de réponse en bas.

**Reply admin** : quand l'admin répond, insérer avec `user_id` du client (récupéré depuis les messages existants du fil) pour que le client voie la réponse dans son garage.

### 2. `src/components/garage/GarageMessages.tsx` — Supprimer le double email

- Dans `NewMessageForm.handleSend` : supprimer l'appel `recipient: 'client-ack'` (lignes 82-93). Garder uniquement `recipient: 'admin'`.
- Dans `ChatView.handleSend` : supprimer l'appel `recipient: 'client-ack'` (lignes 308-320). Garder uniquement `recipient: 'admin'`.
- Le client voit son message dans le garage — pas besoin d'accusé par email.

### 3. `supabase/functions/stripe-webhook/index.ts` — Liens garage

- Ligne 191 : remplacer `https://piecestrottinettes.fr/garage` par `https://piecestrottinettes.fr/garage?tab=messages`
- Ligne 199 : idem

### 4. Redéployer `send-message-notification`

La fonction est déjà correcte (templates OK, CTA OK). Pas de modification nécessaire. Juste s'assurer qu'elle est déployée.

## Ordre d'exécution

```text
1. ContactMessagesManager — refonte groupement + conversation    (25 min)
2. GarageMessages — supprimer double email                       (5 min)
3. stripe-webhook — liens garage?tab=messages                    (2 min)
4. Redéploiement edge functions                                  (2 min)
```

**Total estimé : ~35 min**

