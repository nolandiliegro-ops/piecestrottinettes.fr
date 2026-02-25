

# Simplification du carrousel — Zéro doublon, containScroll trimSnaps, fix clipping

## Modifications sur `src/components/showcase/GamingCarousel.tsx`

### 1. Suppression du virtual loop
- Supprimer le `useMemo` de `displayParts` (lignes 79-85)
- Remplacer toutes les références à `displayParts` par `filteredParts` dans le mapping des slides et le calcul de `wrappedDistance`
- Remettre les keys à `part.id` (plus besoin de `-${index}` sans doublons)
- Supprimer `const realIndex = index % filteredParts.length` dans `handleCardClick` (plus nécessaire)

### 2. Embla : loop false + containScroll trimSnaps
- `loop: false` (au lieu de `shouldLoop`)
- `containScroll: "trimSnaps"` (au lieu de `false`) — cela colle proprement aux bords en début/fin de liste, éliminant le vide à gauche
- `align: "center"` reste inchangé
- La variable `shouldLoop` peut être supprimée

### 3. Fix du clipping — padding généreux
- Container du carousel (ligne 270) : passer de `py-20 md:py-20 lg:py-24` à `py-28` pour donner largement l'espace au scale 1.15x
- Ajouter `min-h-[500px]` sur ce même container pour garantir la hauteur minimum
- Garder `overflow-hidden` sur le container pour zéro scrollbar

### 4. Flèches visibles seulement si > 3 produits
- Changer la condition d'affichage des flèches de `filteredParts.length > 1` à `filteredParts.length > 3`
- Les dots et le counter restent visibles dès `> 1`

### Fichier modifié
- `src/components/showcase/GamingCarousel.tsx`

### Aucun changement sur
- `GamingCarouselCard.tsx`, `QuickViewModal`, filtres, interactions

