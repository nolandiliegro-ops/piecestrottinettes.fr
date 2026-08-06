Refonte Design Premium & Glassmorphism des catégories (Home & Catalogue)

Objectif
- Home (bloc sombre) : remplacer les mini-chips gris par des cartes glassmorphic 3D avec photo produit et accent de couleur par catégorie.
- Catalogue : remplacer les bandeaux plats par des tuiles bento « float » premium avec photo détourée et flèche en pastille sombre.

Fichiers concernés
1. `src/components/home/ShopByCompatibility/CategoryPills.tsx` (rendu uniquement, props inchangées)
2. `src/components/catalogue/CategoryBentoGrid.tsx` (rendu uniquement, props inchangées)

Analyse de l'existant (vérifié)
- `CategoryPills` reçoit `categories: CategoryGroupV2[]`, `selectedSlugs: Set<string>`, `onToggle(slug)`. Chaque groupe porte `name`, `slug`, `count`, `image_url`, `icon`, `color`. Aucun changement d'interface : la multi-sélection et les compteurs restent intacts.
- `resolveCategoryColor(dbColor, slug)` (`src/lib/categoryColors.ts`) renvoie un HEX : on passe `c.color` puis fallback slug. Pour l'ombre/le fond translucide, conversion HEX → RGB en inline style (Tailwind ne peut pas interpoler une valeur dynamique).
- `CategoryBentoGrid` : props `categories`, `activeCategory`, `onCategoryChange`, `isLoading`, `counts?`. Images via `useCategoryImages()` (map par id, `image_url`/`alt_text`), fallback icône via `resolveCategoryIcon(lucide_icon, slug)`. Le `Link` `ArrowUpRight` est un frère du bouton (jamais imbriqué) — ce point est conservé.

1. Home — cartes glassmorphic (`CategoryPills.tsx`)
- Conteneur : `flex gap-3 overflow-x-auto pb-4` + scrollbar masquée (style local déjà présent), puis `sm:grid sm:grid-cols-4 lg:grid-cols-7 sm:overflow-visible`.
- Carte inactive : `relative h-24 sm:h-28 rounded-2xl bg-neutral-900/60 backdrop-blur-md border border-white/10 p-3 flex flex-col items-center justify-between hover:border-white/20 hover:-translate-y-1 transition-all`, `min-w-[104px]` en mode scroll mobile.
- Carte active : `border-2 bg-neutral-900/90` avec `borderColor` = accent et `boxShadow: 0 0 20px rgba(accent, 0.35)` en inline style, texte blanc.
- Visuel interne : `image_url` en `h-12 sm:h-14 w-auto object-contain drop-shadow-md`. Sans image : emoji `icon` en `text-2xl`, sinon initiale du nom dans un cercle neutre — même gabarit de hauteur pour éviter tout saut de layout.
- Label bas : `text-xs font-bold text-white uppercase tracking-wider text-center line-clamp-1`.
- Badge décompte : pill translucide en absolu haut-droite (`absolute top-2 right-2 bg-white/10 backdrop-blur px-1.5 py-0.5 rounded-full text-[10px] text-white/80`).
- Conservés : `role="checkbox"`, `aria-checked`, `whileTap`, touch target ≥ 44px (h-24 = 96px).
- Supprimés : chips h-11, avatar rond 28px, badge inline sombre.

2. Catalogue — tuiles bento float (`CategoryBentoGrid.tsx`)
- Grille : `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4` (skeletons alignés `h-32 sm:h-36 rounded-2xl`).
- Tuile : `relative h-32 sm:h-36 rounded-2xl bg-white/80 backdrop-blur-sm border border-neutral-200/80 p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden group flex flex-col justify-between items-start`.
- Visuel : photo `h-20 w-auto object-contain group-hover:scale-105 transition-transform`, centrée horizontalement dans la zone haute ; fallback icône Lucide même hauteur.
- Label : `text-sm font-black text-neutral-900 uppercase tracking-tight line-clamp-2` en bas ; badge `counts?.[id]` conservé à côté du label quand fourni.
- État actif : `border-[#4A7C59] border-2 bg-[#4A7C59]/10`.
- Flèche : `Link` en absolu haut-droite, `bg-neutral-900 text-white p-1.5 rounded-full opacity-80 group-hover:opacity-100`, z-index au-dessus du bouton, `stopPropagation` conservé.
- Carte « Toutes » : même gabarit, icône `LayoutGrid`, sans flèche.

Risques et vérifications
- `overflow-hidden` sur la tuile + `hover:-translate-y-1` : la translation est sur la tuile elle-même, pas de clipping de l'ombre car l'ombre est portée par le même élément (pas de parent `overflow-hidden` ajouté).
- Couleur dynamique : passer par inline style, jamais par classes Tailwind interpolées.
- `ShopByCompatibility/index.tsx` non modifié → logique de filtrage et compteurs inchangés.

Plan de test localhost
1. `/` desktop 1280 : 7 colonnes de cartes glass, photo visible, active = bordure colorée + halo ; multi-sélection cumulable, compteurs corrects.
2. `/` mobile 375 : scroll horizontal fluide, une carte partiellement visible, tap unique = toggle.
3. `/catalogue` : 4 colonnes ≥1024, 3 en sm, 2 en mobile ; hover = lift + zoom photo ; clic tuile = filtre, clic flèche = `/categorie/:slug`.
4. Skeletons sans saut de layout ; catégories sans image → fallback icône propre.
