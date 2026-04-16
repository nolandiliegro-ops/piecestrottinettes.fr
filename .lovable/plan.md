

# Plan : 3 corrections chirurgicales

## PROBLÈME 1 — Bouton "Contacter le support" lié à la commande

**État actuel** (`OrderHistorySection.tsx` ligne 244) : navigate vers `/contact?order=...`. Veut : ouvrir directement la conversation de la commande dans `/garage?tab=messages`.

**Architecture** : `GarageMessages` charge `useOrderConversations()` qui retourne la liste indexée par `order_id` (UUID, pas order_number). Si la commande n'a pas encore de conversation, elle n'est pas dans la liste — il faut créer un message initial automatiquement.

**Solution chirurgicale** :

- **`OrderHistorySection.tsx` ligne 244** : remplacer `navigate('/contact?order=...')` par `navigate(`/garage?tab=messages&orderId=${order.id}&orderNumber=${order.order_number}`)`

- **`GarageMessages.tsx`** (modifications minimes au composant principal `GarageMessages` lignes 549-609 uniquement) :
  - Ajouter `useSearchParams` import
  - Ajouter un `useEffect` qui lit `orderId` + `orderNumber` au mount :
    - Si la conversation existe dans `conversations` → `setSelectedConv(found)`
    - Sinon → construit un `ConversationSummary` éphémère `{order_id, order_number, last_message:'', last_message_at:now, unread_count:0}` et l'utilise comme `selectedConv` (ChatView fonctionne avec un chat vide, le 1er message créera la conversation)
    - Nettoie les query params via `setSearchParams({tab:'messages'}, {replace:true})`

**Fichiers** : `OrderHistorySection.tsx` (1 ligne), `GarageMessages.tsx` (uniquement l'export `GarageMessages` ligne 550-553 + import en tête).

## PROBLÈME 2 — Pré-remplissage Nom/Email sur /contact

**Solution** dans `Contact.tsx` :

- Récupérer `profile?.display_name` via `useProfile()` (déjà utilisé ailleurs) et `user?.email`
- Ajouter `defaultValue={profile?.display_name || ''}` sur l'Input `name`
- Ajouter `defaultValue={user?.email || ''}` sur l'Input `email`
- Ajouter `key` sur ces inputs basé sur user.id pour forcer le re-render quand l'auth se charge tardivement (sinon `defaultValue` reste vide)

**Fichier** : `src/pages/Contact.tsx` (~5 lignes touchées).

## PROBLÈME 3 — Pré-remplissage Sujet via `?order=`

**Déjà implémenté** ligne 110 de `Contact.tsx` :
```tsx
defaultValue={orderNumber ? `Question sur ma commande ${orderNumber}` : ''}
```
✅ Aucune modification nécessaire. Je vérifierai juste que ça fonctionne après les changements du problème 2.

## Récapitulatif des fichiers touchés

| Fichier | Modifications |
|---|---|
| `src/components/garage/OrderHistorySection.tsx` | 1 ligne (navigate vers garage messages au lieu de /contact) |
| `src/components/garage/GarageMessages.tsx` | Import `useSearchParams` + useEffect dans le composant principal `GarageMessages` (lignes 550-553) pour auto-ouvrir la conversation |
| `src/pages/Contact.tsx` | useProfile() + defaultValue sur Inputs name/email + key pour force-rerender |

## Garanties
- Aucune réécriture complète de `Garage.tsx`, `GarageMessages.tsx` (seulement le composant export `GarageMessages` final), ni `OrderHistorySection.tsx`
- Aucun changement schéma DB ni RLS
- Pas de nouveau hook créé — réutilisation de `useOrderConversations`, `useProfile`, `useAuth` existants
- Le flow client guest checkout (sans user_id) reste intact car le bouton support n'apparaît que dans le garage authentifié

