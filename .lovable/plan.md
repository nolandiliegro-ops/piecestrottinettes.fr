

## Diagnostic

**Header.tsx** : Le badge `totalUnread` est **déjà implémenté** correctement :
- L37 : `useOrderConversations` est appelé
- L38 : `totalUnread` calculé via reduce
- L321-325 : Badge rouge sur le bouton "Mon Garage" desktop
- L382-386 : Badge rouge sur le lien "Mon Garage" mobile

→ Style actuel : `bg-red-500 text-white text-[10px] font-bold rounded-full min-w-5 h-5`. **Pas d'`animate-pulse`** et pas exactement le style demandé. À harmoniser.

**Garage.tsx** : Le bouton de l'onglet MESSAGES (L188-199) **n'a aucun badge**. Le hook `useOrderConversations` n'est pas non plus importé dans ce fichier.

## Fix chirurgical

### `src/pages/Garage.tsx` (3 modifs)
1. **Import du hook** : `import { useOrderConversations } from '@/hooks/useOrderMessages';`
2. **Calcul totalUnread** dans le composant : `const { data: convs = [] } = useOrderConversations(); const totalUnread = convs.reduce((s, c) => s + c.unread_count, 0);`
3. **Badge sur bouton MESSAGES** (L188-199) : ajouter `relative` à la className et insérer un `<span>` badge rouge en `-top-1 -right-1` avec `animate-pulse` quand `totalUnread > 0`, affichant `9+` si > 9.

### `src/components/Header.tsx` (2 modifs harmonisation)
- L321-325 (desktop) et L382-386 (mobile) : ajouter `animate-pulse` au span badge et ajuster vers le style demandé : `min-w-[18px] h-[18px] text-xs`.

## Style final unifié des deux badges
```tsx
<span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center animate-pulse border-2 border-background">
  {totalUnread > 9 ? '9+' : totalUnread}
</span>
```

## Fichiers touchés

| Fichier | Action |
|---|---|
| `src/pages/Garage.tsx` | +1 import, +2 lignes hook, +badge sur bouton MESSAGES (+ `relative` className) |
| `src/components/Header.tsx` | +`animate-pulse` et harmonisation style sur 2 badges existants |

## Garanties
- 0 régression : badges existants restent visibles, juste stylisés
- Aucune modif des autres onglets, du flux navigation ou des hooks
- Réutilisation 1:1 du hook `useOrderConversations` déjà éprouvé

