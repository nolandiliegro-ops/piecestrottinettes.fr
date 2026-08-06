Refonte de la grille de catégories sur Catalogue et ajustement des espacements Landing

Objectif
- Transformer le conteneur actuellement en `flex-wrap` du sélecteur de catégories sur `/catalogue` en une grille CSS responsive stricte.
- Augmenter l'espacement vertical du bloc sombre "POUR TA KUKIRIN" sur la page d'accueil pour fluidifier la transition entre les sections beiges.

Fichiers concernés
1. `src/components/catalogue/CategoryBentoGrid.tsx`
2. `src/components/home/ShopByCompatibility/index.tsx`

Analyse de l'existant

`CategoryBentoGrid.tsx`
- Conteneur actuel : `flex flex-wrap justify-center gap-3`.
- Chaque tuile ("Toutes" + catégories) a une largeur fixe : `w-24 md:w-28 lg:w-32 aspect-[4/5]`.
- L'image est animée en hover sur un `motion.div` interne.
- Un lien secondaire `ArrowUpRight` est positionné en absolu dans chaque tuile.
- 8 tuiles au total sont attendues : "Toutes", Plaquettes, Disques, Accessoires Divers, Pneus Gonflables, Pneus Pleins, Chambres à Air, Chargeurs.

`ShopByCompatibility/index.tsx`
- Le bloc sombre est le `section` racine qui a un padding vertical actuel de `py-8 lg:py-12` (ligne 211).
- C'est le wrapper qui contient le titre "Pour ta KUKIRIN" et la recherche de pièces compatibles.
- Sur `Index.tsx`, ce bloc est inséré entre `HeroSearchFirst` et `BrandWallSection`.

Plan de modification

1. Grille de catégories (`CategoryBentoGrid.tsx`)

Remplacer le conteneur `flex flex-wrap justify-center gap-3` par une grille CSS responsive :
```
grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4
```
- Supprimer les largeurs fixes (`w-24 md:w-28 lg:w-32`) et la classe `aspect-[4/5]` des tuiles individuelles.
- Remplacer par une hauteur/ratio cohérent en grid : par exemple `aspect-[4/5]` conservé au niveau de chaque cellule, ou une hauteur fixe `h-32 sm:h-36 lg:h-40` pour garantir l'alignement horizontal des lignes.
- Supprimer `flex-shrink-0` devenu inutile.
- Garder le bouton "Toutes" et les 7 catégories dans la même grille, sans conteneur intermédiaire séparé.
- Maintenir le label en bas à gauche (onglet), l'icône centrée, le lien `ArrowUpRight` en haut à droite, et les états actifs (liseré + ombre).
- Préserver l'animation hover et l'état de chargement skeleton.

Résultat attendu : sur `lg`, 4 colonnes × 2 lignes = 8 cartes exactement, sans orpheline sur une 3ème ligne.

2. Espacement Landing (`ShopByCompatibility/index.tsx`)

Augmenter le padding vertical du conteneur principal (ligne 211) :
- Avant : `py-8 lg:py-12`
- Après : `py-16 lg:py-20`

Vérification préalable : le conteneur interne (`max-w-7xl mx-auto px-4 lg:px-8 ...`) a déjà son propre padding. On ne modifie que le padding vertical du `section` racine, ce qui étend le bloc sombre sans toucher au padding horizontal ni à la capsule interne.

Résultat attendu : une transition plus aérée entre le haut de page beige et le bloc sombre, puis entre le bloc sombre et la section suivante.

Risques et mitigation

- Régression sur l'affichage des images : en passant de flex à grid, le positionnement absolu des overlays et du lien reste identique. Les images en `object-cover` continueront de remplir la tuile.
- Régression sur le skeleton : le skeleton de chargement actuellement en `flex` sera remplacé par la même grille (`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4`) pour préserver l'alignement.
- Régression sur le lien secondaire : il reste positionné en absolu dans la cellule, mais il faut s'assurer que la cellule parente est bien `relative`.
- Régression responsive : le breakpoint `sm` correspond à 640px et `lg` à 1024px. Sur mobile, 2 colonnes permettent d'afficher 4 lignes de 2 cartes.
- Couleur beige : le plan mentionne #F5F0E8 mais le code utilise `var(--token-global-background, #FAFAF8)` ; on ne touche pas à la couleur de fond, seulement à l'espacement.

Plan de test localhost

1. Ouvrir `/catalogue`.
2. Vérifier que les 8 tuiles s'affichent en 4 colonnes × 2 lignes sur desktop (largeur >= 1024px).
3. Vérifier le responsive : 3 colonnes sur tablette (640-1023px), 2 colonnes sur mobile (<640px).
4. Vérifier que le clic sur une catégorie active toujours le filtre et que le lien `ArrowUpRight` naviguera vers `/categorie/:slug`.
5. Ouvrir `/` et vérifier que le bloc sombre "POUR TA KUKIRIN" a plus de marge verticale (`py-16 lg:py-20`).
6. Vérifier que les transitions entre les sections beiges et le bloc sombre sont fluides.

Synthèse des modifications

- `src/components/catalogue/CategoryBentoGrid.tsx` : remplacer `flex-wrap` par une grille CSS responsive, supprimer les largeurs fixes, aligner les tuiles et le skeleton sur la même grille.
- `src/components/home/ShopByCompatibility/index.tsx` : augmenter le padding vertical du `section` racine de `py-8 lg:py-12` à `py-16 lg:py-20`.
