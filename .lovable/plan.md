

# Plan : 2 améliorations messagerie

## AMÉLIORATION 1 — Redesign liste conversations

**Fichier 1 : `src/hooks/useOrderMessages.ts`**
- Ajouter `last_sender_type: 'client' | 'admin'` dans l'interface `ConversationSummary` (L17-23)
- Dans `useOrderConversations` (L207-228), ajouter `last_sender_type: msgs[0].sender_type` (commandes) et `last_sender_type: directMsgs[0].sender_type` (direct)

**Fichier 2 : `src/components/garage/GarageMessages.tsx`** — uniquement `ConversationList` L316-369
- Carte blanche `bg-white shadow-sm hover:shadow-lg rounded-2xl p-5` (au lieu de `bg-white/60 backdrop-blur-md`)
- Badge order vert grand format à gauche : `px-3 py-1.5 rounded-lg bg-green-700 text-white text-sm font-mono font-bold` affichant `PT-XXXX`
- Badge statut à droite du badge order :
  - `last_sender_type === 'client'` → pill orange `bg-orange-100 text-orange-700` "En attente"
  - `last_sender_type === 'admin'` → pill vert `bg-green-100 text-green-700` "Répondu"
- Aperçu message gris `text-sm text-gray-500` sous le badge (60 chars max, déjà présent)
- Date relative à droite (gardée)
- Badge unread rouge (gardé)
- Mobile : full-width naturel via `w-full`

## AMÉLIORATION 2 — Badge unread sur "Mon Garage" navbar

**Fichier 3 : `src/components/Header.tsx`**
- Importer `useOrderConversations` depuis `@/hooks/useOrderMessages`
- Dans le composant : `const { data: convs = [] } = useOrderConversations();` puis `const totalUnread = user ? convs.reduce((s, c) => s + c.unread_count, 0) : 0;`
- Sur le bouton "Mon Garage" desktop (DropdownMenuTrigger) ET mobile : wrapper `relative` + petit badge rouge `absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold` affichant `totalUnread` si > 0 (ou point simple si > 9 → "9+")
- Hook s'auto-désactive si `!user` (déjà géré par `enabled: !!user?.id`)

**Onglet MESSAGES dans Garage** : déjà branché sur `useOrderConversations` selon mémoire — pas de modif nécessaire, juste vérification visuelle au test.

## Récapitulatif

| Fichier | Modifications |
|---|---|
| `src/hooks/useOrderMessages.ts` | +1 champ interface, +2 lignes dans le mapping |
| `src/components/garage/GarageMessages.tsx` | Refonte interne `ConversationList` L316-369 uniquement |
| `src/components/Header.tsx` | +1 import, +2 lignes hook, +badge sur bouton Mon Garage (desktop + mobile) |

## Garanties
- Aucune modif DB / RLS / Edge Function
- `Garage.tsx`, `ChatView`, `useOrderMessages` (autres fonctions) intacts
- Le hook `useOrderConversations` se désactive proprement si user déconnecté (badge invisible)

