

# Fix carrousel : symétrie loop, clipping des cartes, produit unique

## Problèmes identifiés (screenshot)

1. **Vide à gauche** : `loop: true` est déjà configuré mais `containScroll: false` avec `align: "center"` ne suffit pas — Embla ne wrappe pas visuellement les derniers éléments à gauche du premier quand il n'y a pas assez de slides pour remplir le viewport. Le problème vient du fait que le nombre de slides est trop faible pour que le loop fonctionne visuellement.
2. **Cartes coupées** : le `overflow-hidden` sur le viewport Embla (ligne 263) tronque le scale 1.15 de la carte centrale (badge catégorie coupé en haut, bas de carte coupé).
3. **Produit unique** : avec `loop: true` et 1 seul slide, Embla peut avoir un comportement erratique.

## Modifications — `src/components/showcase/GamingCarousel.tsx`

### Fix 1 : Loop conditionnel
- `loop` passe à `filteredParts.length > 1` au lieu de `true` statique. Cela résout le cas du produit unique ET permet au loop de fonctionner quand il y a plusieurs produits.
- Comme Embla ne peut pas changer ses options dynamiquement, on force un re-mount du carrousel via une `key` dynamique sur le container Embla : `key={activeCategory + filteredParts.length}`. Cela force React à détruire/recréer l'instance Embla quand le filtre change.

### Fix 2 : Overflow visible pour le scale
- Le div `overflow-hidden` (ref={emblaRef}, ligne 263) est obligatoire pour Embla sur l'axe X. On ne peut pas le retirer.
- Solution : ajouter `overflow-y: visible` en style inline sur ce même div, et `overflow: visible` sur le container parent (py-6 div, ligne 261). Cela permet au scale 1.15 de déborder verticalement sans être coupé tout en gardant le masquage horizontal pour le scroll.
- Augmenter le padding vertical du container : `py-12 md:py-14 lg:py-16` (au lieu de py-6/8/10) pour donner de l'espace au zoom.

### Fix 3 : Produit unique centré
- Quand `filteredParts.length === 1`, masquer les flèches de navigation et les dots de pagination.
- Le `align: "center"` garantit déjà que le produit unique sera centré.

### Fix 4 : minHeight ajustée
- Passer le `minHeight` du container principal de `600px` à `auto` et laisser le padding vertical gérer l'espace. Cela évite les espaces vides inutiles quand il y a peu de produits.

## Fichier modifié

- `src/components/showcase/GamingCarousel.tsx`

## Ce qui ne change PAS

- `GamingCarouselCard.tsx` (aucune modification)
- QuickViewModal, filtres, interactions, design glassmorphism

