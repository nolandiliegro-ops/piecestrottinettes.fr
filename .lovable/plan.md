# Fix clipping barre d'actions — GamingCarouselCard.tsx

## Problème

La barre d'actions (cœur/œil/panier) est coupée car le conteneur glassmorphism (ligne 183) a `overflow-hidden`, ce qui tronque tout élément qui dépasse les bords arrondis — y compris la barre positionnée en `absolute`.

## Corrections — 1 seul fichier

### `src/components/showcase/GamingCarouselCard.tsx`

**Ligne 183 — Overflow du conteneur glassmorphism :**

- Changer `overflow-hidden` → `overflow-visible`
- Le `rounded-3xl` continue de fonctionner visuellement grâce au background et border, mais les éléments absolus (barre d'actions) ne seront plus tronqués
- Pour que l'image ne déborde pas des coins arrondis, ajouter `overflow-hidden rounded-3xl` sur le conteneur image (le `div` avec `aspect-[3/4]`, ligne ~208)

**Ligne 240 — Réduction de l'encombrement de la barre :**

- Réduire `gap-2.5` → `gap-1.5`
- Réduire `px-3.5` → `px-2.5`

**Lignes 253, 272, 281 — Taille des boutons :**

- Réduire `w-9 h-9` → `w-8 h-8` sur les trois boutons (favoris, œil, panier)

### Résumé


| Élément                 | Avant             | Après                         |
| ----------------------- | ----------------- | ----------------------------- |
| Conteneur card overflow | `overflow-hidden` | `overflow-visible`            |
| Conteneur image         | pas de overflow   | `overflow-hidden rounded-3xl` |
| Gap barre d'actions     | `gap-2.5`         | `gap-1.5`                     |
| Padding barre           | `px-3.5`          | `px-2.5`                      |
| Boutons                 | `w-9 h-9`         | `w-8 h-8`                     |


Aucun autre fichier modifié. Le `nopin`, `z-20`, `bottom-12`, et `shadow-xl` restent inchangés.                            "Le plan est validé. Applique les corrections de clipping sur `GamingCarouselCard.tsx` avec ces précisions pour un rendu parfait :

1. **Libération de l'Affichage** : Change `overflow-hidden` en `overflow-visible` sur le conteneur principal de la carte pour que la barre d'actions ne soit plus jamais tronquée.
2. **Protection de l'Image** : Ajoute `overflow-hidden rounded-3xl` spécifiquement sur le conteneur de l'image (aspect 3/4) pour qu'elle reste propre dans les coins.
3. **Optimisation de la Barre** :
  - Réduis les boutons à `w-8 h-8` avec un padding de `p-2`.
  - Réduis la taille des icônes à l'intérieur à `w-4 h-4` pour qu'elles soient bien centrées.
  - Garde le positionnement à `bottom-12`, le centrage `left-1/2 -translate-x-1/2`, et ajoute un `shadow-xl` pour le relief.
4. **Nettoyage Final** : Assure-toi que l'attribut `nopin="nopin"` est présent sur l'image pour bloquer les boutons Pinterest qui masquent le design.

L'objectif est que la barre d'actions 'flotte' au-dessus de la carte sans aucune coupure visuelle."