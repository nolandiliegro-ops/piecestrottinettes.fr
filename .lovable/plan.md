Refonte des filtres de catégories — Home (bloc sombre) et Catalogue

Objectif
- Remplacer les tuiles carrées blanches du bloc sombre "POUR TA ..." par des chips sombres (segmented pills), sans coche ni liseré coloré.
- Réduire fortement la hauteur des cartes de catégories du Catalogue pour remonter les produits au-dessus de la ligne de flottaison.

Fichiers concernés
1. `src/components/home/ShopByCompatibility/CategoryPills.tsx` (refonte du rendu, API du composant inchangée)
2. `src/components/catalogue/CategoryBentoGrid.tsx` (format des cartes)

Analyse de l'existant (vérifié)
- `CategoryPills` reçoit `categories: CategoryGroupV2[]`, `selectedSlugs: Set<string>`, `onToggle(slug)`. Chaque groupe porte `name`, `slug`, `count`, `image_url`, `icon`, `color`. Il est rendu depuis `ShopByCompatibility/index.tsx` — aucun changement d'interface nécessaire, donc la logique multi-sélection et le calcul des compteurs restent intacts.
- Rendu actuel : tuiles verticales 96×116px, fond blanc/teinté, bordure accent, barre de couleur en haut, pastille de coche, label + compteur. C'est ce visuel qui est supprimé.
- `CategoryBentoGrid` (page `/catalogue`) : grille `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4`, tuiles `aspect-[4/5]` avec image plein cadre, icône centrée, label en onglet bas-gauche, lien `ArrowUpRight` en absolu. Pas de badge de décompte dans ce composant aujourd'hui : les compteurs ne sont pas dans les props (`categories`, `activeCategory`, `onCategoryChange`, `isLoading`).

1. Home — Filter Chips sombres (`CategoryPills.tsx`)

Structure d'un chip (bouton, `role="checkbox"`, `aria-checked` conservés) :
- Conteneur : scroll horizontal conservé (`flex gap-2 overflow-x-auto`, scrollbar masquée, snap), passage en `flex-wrap` à partir de `sm` pour éviter un scroll inutile sur desktop.
- Inactif : `bg-neutral-800/70 border border-neutral-700/60 text-neutral-300 hover:bg-neutral-700/50 rounded-full px-4 py-2.5 flex items-center gap-2.5 transition-all`
- Actif : `bg-[#4A7C59]/20 border border-[#4A7C59] text-white font-medium shadow-[0_0_12px_rgba(74,124,89,0.3)]`
- Contenu : avatar rond 28×28 (image `image_url` en `object-cover`, sinon emoji `icon`, sinon initiale sur fond neutre) + nom (`text-sm`, `whitespace-nowrap`) + badge compteur `bg-neutral-900/80 px-2 py-0.5 rounded-full text-xs`.
- Supprimés : barre d'accent supérieure, pastille de coche SVG, bordure teintée par couleur de marque, `resolveCategoryColor` (import retiré s'il devient inutile).
- Conservé : `whileTap` léger, hauteur mini ≥ 44px pour le tactile.

2. Catalogue — bandeaux compacts (`CategoryBentoGrid.tsx`)

- Tuiles passées de `aspect-[4/5]` à `h-16 sm:h-20 rounded-xl`, en gardant la grille `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3`.
- Nouvelle disposition en flux (plus d'image plein cadre) : miniature carrée à gauche (`h-full aspect-square`, `object-cover`, fallback icône Lucide via `resolveCategoryIcon` sur fond carbon), nom au centre (`text-sm font-semibold`, `line-clamp-2`), zone droite pour le lien `ArrowUpRight`.
- Badge décompte à droite : les compteurs ne sont pas disponibles dans les props actuelles. Deux options — je retiens (a) par défaut :
  (a) rendre le badge conditionnel via une prop optionnelle `counts?: Record<string, number>` non fournie pour l'instant : le slot est prêt, aucun chiffre affiché tant que la page ne le passe pas ;
  (b) brancher `useCategoryPartsCount()` dans le composant pour afficher un vrai décompte (ajoute une requête, à valider).
- État actif : fond `bg-mineral/15` + `border-mineral` + halo léger, au lieu du `ring` + `boxShadow` verts actuels (moins lourd sur un bandeau bas).
- Skeleton aligné : même grille, `h-16 sm:h-20 rounded-xl`.
- Le lien `ArrowUpRight` reste un frère du bouton (jamais imbriqué), positionné en absolu à droite, cellule parente `relative`.

Risques et vérifications
- `ShopByCompatibility/index.tsx` n'est pas modifié : props et logique de filtrage inchangées, aucun risque sur les compteurs ou la sélection cumulée.
- Contraste sur le bloc sombre : le vert `#4A7C59` sur fond `#2A2A2A` reste lisible ; le texte actif passe en blanc.
- Catalogue : la baisse de hauteur supprime l'effet de zoom hover sur l'image plein cadre — remplacé par un simple hover de fond, plus adapté à un bandeau.

Plan de test localhost
1. `/` : chips sombres, aucun carré blanc, aucune coche ; sélection multiple cumulable ; compteurs corrects ; scroll horizontal mobile OK.
2. `/` mobile 375px : chips sur une ligne scrollable, touch target ≥ 44px.
3. `/catalogue` : 8 bandeaux compacts, produits visibles plus haut ; 4 colonnes ≥1024px, 3 en `sm`, 2 en mobile.
4. Clic catégorie = filtre appliqué ; clic `ArrowUpRight` = navigation `/categorie/:slug`.
5. Skeleton sans saut de layout.
