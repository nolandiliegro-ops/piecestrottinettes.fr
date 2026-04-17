

# Plan d'exécution étape par étape

## Étape 1 — Migration SQL
Ajouter sur `contact_messages` :
- `status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','replied','closed'))`
- `matched_user_id uuid` (nullable, rempli si email matché à un compte)
- `last_reply_at timestamptz` (pour tri et compteur côté UI)

Ajouter sur `order_messages` :
- `contact_message_id uuid` (nullable, lie une réponse admin à un thread contact quand le client n'a pas de compte)

Index : `CREATE INDEX ON order_messages(contact_message_id)`.

RLS : policy admin existante couvre déjà la lecture/écriture sur les nouvelles colonnes.

## Étape 2 — Refonte `ContactMessagesManager.tsx`

Structure du composant principal réorganisée mais surgicale (pas de réécriture totale, on garde les onglets `Garage` / `Contact` existants) :

**A. `ContactTab` v2 (remplace L65-118)**
- Header : 4 boutons filtres `Tous / En attente / Répondus / Fermés` avec compteurs dynamiques
- Tri : `pending` d'abord, puis `replied`, puis `closed`, par `last_reply_at DESC` (fallback `created_at`)
- Carte par message : avatar initiales + nom + email + sujet + extrait + pill statut (orange/vert/gris) + badge "X réponses" si applicable
- Click carte → `setSelectedContactId(id)` → bascule en mode `ContactConversationView`

**B. Nouveau composant `ContactConversationView`** (~200 lignes, dans le même fichier pour rester chirurgical)
- Header sticky : back arrow + nom/email + pill statut + bouton "Fermer la conversation"
- Zone messages :
  - Bulle initiale (gauche, gris) : sujet en titre + body + timestamp
  - Réponses admin issues de `order_messages` filtrées par :
    - `user_id = matched_user_id` AND `order_id IS NULL` (si user matché)
    - OU `contact_message_id = selectedContactId` (cas guest)
- Zone reply (sticky bottom) :
  - Bouton Paperclip → upload `order-messages-images` bucket (réutilise pattern existant GarageMessages)
  - Textarea + bouton Envoyer
- Logique d'envoi :
  1. Tenter match : `SELECT id FROM auth.users WHERE email = contact.email` via une query indirecte (passer par profiles ou orders.customer_email pour récupérer `user_id`)
  2. Insert dans `order_messages` :
     - `sender_type='admin'`, `order_id=NULL`
     - Si match : `user_id=<matched>`
     - Si pas de match : `user_id=NULL` + `contact_message_id=<contact.id>`
     - `image_url` si attachement
  3. Update `contact_messages` : `status='replied'`, `matched_user_id=<si trouvé>`, `last_reply_at=now()`
  4. Invoke `send-message-notification` avec `recipient='client'`, `customerEmail=contact.email`, `customerName=contact.name`, `messageText`, `imageUrl`, `conversationId=contact.id`
  5. Toast succès + retour à la liste (ou stay)

**C. Bouton "Fermer la conversation"**
- Update `contact_messages.status = 'closed'`
- Toast + invalidate query

## Étape 3 — Edge function `send-message-notification`
**Aucune modif fonctionnelle** — la signature actuelle gère déjà `recipient='client'` + `imageUrl` + `conversationId`. Le bouton CTA pointe déjà vers `/garage?tab=messages` (le client non inscrit sera redirigé vers login, comportement acceptable).

## Étape 4 — Matching email → user_id
Helper inline dans `ContactConversationView` :
```ts
const { data } = await supabase
  .from('orders')
  .select('user_id')
  .eq('customer_email', contact.email)
  .not('user_id', 'is', null)
  .limit(1)
  .maybeSingle();
```
Fallback : pas de match → guest mode avec `contact_message_id`.

## Récapitulatif fichiers touchés

| Fichier | Action |
|---|---|
| Migration SQL | +3 colonnes (`status`, `matched_user_id`, `last_reply_at` sur `contact_messages` ; `contact_message_id` sur `order_messages`) + index |
| `ContactMessagesManager.tsx` | Refonte `ContactTab` + ajout `ContactConversationView` inline (~250 lignes ajoutées, ~50 supprimées) |
| `send-message-notification/index.ts` | **Inchangé** |
| `GarageMessages.tsx` / `Garage.tsx` / `useOrderMessages.ts` | **Non touchés** |
| `GarageTab` / `GarageConversationView` | **Non touchés** |

## Garanties
- Pattern UI 100% identique au flow Garage (cohérence visuelle)
- Pas de table additionnelle (réutilise `order_messages` + colonne de liaison)
- Guest mode supporté via `contact_message_id` (thread retrouvable sans `user_id`)
- Match auto user → conversation visible aussi dans `/garage` du client si compte
- Email envoyé dans tous les cas (CTA `/garage?tab=messages`)
- Aucune régression Garage existant

