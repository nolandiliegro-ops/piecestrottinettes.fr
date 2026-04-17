

## Diagnostic doublon

L'actuel `useClientsData` indexe par `user_id || email`. Pour un user inscrit qui a aussi commandé en guest avant inscription, on crée 2 entrées. **Fix** : indexer **uniquement par email** (lowercased + trim) comme clé canonique. `user_id` devient un attribut fusionnable.

## Plan d'exécution — refonte `ClientsManager.tsx` uniquement

### 1. Nouvelle stratégie de consolidation
- **Clé unique** : `email.toLowerCase().trim()`
- Sources fusionnées dans une `Map<email, Client>` :
  - `profiles` → email récupéré via `orders.customer_email` matché sur `user_id`, OU via `contact_messages.email` matché sur `matched_user_id`
  - `orders` → email direct (`customer_email`)
  - `contact_messages` → email direct
  - `user_garage` → rattaché via `user_id` → email
  - `order_messages` → rattaché via `user_id` → email
- Si un email a plusieurs `user_id` candidats (rare), garder le plus ancien (`profiles.created_at` min).

### 2. Champs enrichis par client
- `phone` (depuis `orders.customer_phone`, premier non-null)
- `firstOrderDate` / `lastOrderDate` (min/max `orders.created_at`)
- `avgCart` = `totalRevenue / orderCount` (0 si pas de commande)
- `loyaltyTier` : 0 cmd → "Aucun", 1 → "Nouveau", 2-4 → "Régulier", 5+ → "VIP"

### 3. UI Table refonte
- Colonnes : Nom · Email · Tél · Commandes · CA · Panier moy. · Fidélité · Dernière activité · Statut
- En-têtes cliquables (sort asc/desc avec icône chevron) : nom, commandes, CA, activité
- Pills filtres :
  - Ligne 1 : Tous / Avec commandes / Sans commande / Actifs / Inactifs
  - Ligne 2 : Tous fidélité / Nouveau / Régulier / VIP

### 4. ClientDetailSheet v2 (panel latéral droit, ~50% largeur)
- **Header** : avatar initiales (gradient sauge) + nom + email + tel + 2 badges (fidélité + source)
- **Stats grid 4 cards** : Commandes, CA Total, Panier moyen, Messages
- **Action principale** : bouton vert "Envoyer un message" (ouvre `SendMessageDialog`)
- **Tabs `shadcn`** : Commandes / Messages / Garage
  - Commandes : liste compacte (#, statut pill, total, date) → click = `setSearchParams({tab:'orders', orderId})`  
  - Messages : 5 derniers (extrait + date + sender pill) → click = `navigate('/admin?tab=messages&garage=true&userId=X')`
  - Garage : cartes scooters (nom + nickname + specs power/range)

### 5. SendMessageDialog (sous-composant inline ~80 lignes)
- Réutilise pattern existant de `ContactConversationView` (déjà dans `ContactMessagesManager.tsx`)
- Champs : message (textarea) + paperclip upload `order-messages-images`
- Sur envoi :
  1. INSERT `order_messages` : `sender_type='admin'`, `order_id=null`, `user_id=clientUserId` (si existe), sinon contact_message_id du dernier contact
  2. Invoke `send-message-notification` `{recipient:'client', customerEmail, customerName, messageText, imageUrl, userId}`
  3. Toast succès + close
- Note : si client n'a pas de `user_id` (jamais inscrit), désactiver le bouton avec tooltip "Client guest — pas de compte"

### 6. Export CSV enrichi
Colonnes : `Nom;Email;Téléphone;Date inscription;Première commande;Dernière commande;Nb commandes;CA total;Panier moyen;Statut fidélité;Trottinettes;Dernière activité;Source;Statut`
UTF-8 BOM + `;` séparateur (déjà en place).

## Tables interrogées (lecture seule, RLS admin déjà OK)
- `profiles`, `orders`, `user_garage`, `order_messages`, `contact_messages`, `scooter_models`, `brands`

**Aucune migration SQL nécessaire** (toutes les colonnes existent : `customer_phone` sur `orders`, `contact_message_id` sur `order_messages`).

## Récap fichiers touchés

| Fichier | Action |
|---|---|
| `src/components/admin/ClientsManager.tsx` | Refonte complète : nouvelle déduplication par email + tri + filtres fidélité + Sheet v2 avec tabs + SendMessageDialog inline + export enrichi |
| `AdminLayout.tsx` | **Inchangé** |
| `Admin.tsx` | **Inchangé** |

## Garanties
- 0 doublon : un email = une fiche
- 0 régression : nav admin et autres onglets non touchés
- Pas de migration SQL
- Réutilisation du pattern messaging existant (storage bucket + edge function `send-message-notification` déjà fonctionnelle)
- Pas de réécriture de composants externes

