

## Diagnostic

**1. Garage.tsx (L162)** : `overflow-x-auto` sur le conteneur d'onglets → cause le scroll horizontal disgracieux. Les onglets sont en `flex-shrink-0` avec padding variable.

**2. GarageMessages.tsx ConversationList (L317-376)** : style "carte" avec ombres, bordures, espacement `space-y-3` — pas un style messagerie moderne. Manque avatars ronds, statuts en puces sur avatar, séparateurs fins.

**3. Header messagerie (L695-708)** : Titre `font-display tracking-wide MAJUSCULES` + texte support basique. Pas le style iMessage demandé.

## Plan d'exécution

### A. `src/pages/Garage.tsx` — onglets fixes (L162-209)

Remplacer le bloc onglets actuel par un **layout grid 3 colonnes égales** dans un conteneur `bg-carbon/5 rounded-full p-1` (style segmented control iOS) :
- Conteneur : `grid grid-cols-3 gap-1 w-full md:w-auto md:max-w-md bg-carbon/[0.04] rounded-full p-1`
- Suppression de `overflow-x-auto`, `flex-shrink-0`
- Chaque onglet : `flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs md:text-sm transition-all min-h-[40px]`
- Actif : `bg-white text-carbon shadow-sm`
- Inactif : `text-carbon/50 hover:text-carbon`
- Icônes conservées, libellés visibles toujours, badge unread inchangé

### B. `src/components/garage/GarageMessages.tsx` — Header messagerie (L695-708)

Nouveau header propre :
```tsx
<div className="flex items-center justify-between mb-6 px-1">
  <div>
    <h2 className="text-2xl font-bold text-carbon tracking-tight">Messages</h2>
    <p className="text-sm text-carbon/50 mt-0.5">
      {conversations.length} conversation{conversations.length > 1 ? 's' : ''}
    </p>
  </div>
  <Button onClick={...} className="rounded-full bg-carbon hover:bg-carbon/90 text-white gap-2 px-4 h-10 text-sm font-medium shadow-sm">
    <Plus className="w-4 h-4" /> Nouveau
  </Button>
</div>
```

### C. `src/components/garage/GarageMessages.tsx` — ConversationList refonte (L317-375)

Style **iMessage/WhatsApp** :
- Conteneur : `bg-white rounded-2xl overflow-hidden divide-y divide-gray-100`
- Plus de `space-y-3`, plus de cartes individuelles avec ombres
- Chaque ligne : `w-full text-left px-4 py-3.5 hover:bg-gray-50/80 transition-colors flex items-center gap-3`

**Avatar rond (52px)** :
- Gradient sauge : `bg-gradient-to-br from-mineral to-mineral-dark text-white`
- Initiales : `PT` pour commande (depuis `order_number`) ou `M` pour Message général
- `rounded-full w-13 h-13 flex items-center justify-center font-bold text-base relative shrink-0`

**Indicateurs sur avatar** :
- `unread_count > 0` → cercle rouge top-right : `absolute -top-0.5 -right-0.5 min-w-[20px] h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white`
- Statut "Répondu" (`!isPending`) → puce verte bottom-right : `absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white`
- Statut "En attente" (`isPending`) → puce orange animée pulse : même position, `bg-orange-500 animate-pulse`

**Contenu central (flex-1 min-w-0)** :
- Ligne 1 : badge PT-XXXX vert pill compact `inline-flex px-2 py-0.5 rounded-md bg-mineral/10 text-mineral text-[11px] font-mono font-semibold` + nom en gras `font-semibold text-carbon text-sm truncate` (ou "Message général" pour direct)
- Ligne 2 : aperçu message `text-sm text-carbon/50 truncate mt-0.5`

**Date à droite** (shrink-0) :
- `text-[11px] text-carbon/40 whitespace-nowrap self-start mt-1`
- Format court : `formatDistanceToNow` raccourci ou `format(date, 'HH:mm')` si aujourd'hui sinon `dd/MM`

Suppression : badges textuels "Répondu/En attente" (remplacés par puces sur avatar), ChevronRight, bordures lourdes, ombres `shadow-sm/lg`.

## Fichiers touchés

| Fichier | Action |
|---|---|
| `src/pages/Garage.tsx` | Refonte conteneur onglets L162-209 → grid 3 cols segmented control |
| `src/components/garage/GarageMessages.tsx` | Refonte ConversationList L317-375 + Header L695-708 |

## Garanties
- 0 régression : `useOrderConversations`, `onSelect`, `unread_count`, `last_sender_type` réutilisés tels quels
- Onglets toujours visibles, plus aucun scroll horizontal
- Badge messages non lus + sync URL préservés
- Aucune modif du ChatView, NewMessageForm, ou hooks
- Mobile-first : segmented control 3 cols full width sous md, max-w-md auto au-dessus

