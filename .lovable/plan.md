Refonte DA Premium : catégories Catalogue & filtres Home Dark

Objectif
- Catalogue : cartes plus hautes, fond ivoire, image 3D dominante avec ombre portée, texte nu (sans pastille), flèche qui n'apparaît qu'au survol.
- Home (bloc sombre) : un seul accent vert — suppression totale des bordures néon par catégorie.

Fichiers concernés
1. `src/components/catalogue/CategoryBentoGrid.tsx`
2. `src/components/home/ShopByCompatibility/CategoryPills.tsx`

Etat actuel (vérifié)
- `CategoryBentoGrid` : tuiles `h-32 sm:h-36 rounded-2xl bg-white/80`, image dans un `span` de hauteur fixe `h-20`, label + badge décompte inline, flèche `opacity-80` toujours visible. Props : `categories`, `activeCategory`, `onCategoryChange`, `isLoading`, `counts?`.
- `CategoryPills` : cartes glass `h-24 sm:h-28`, accent dynamique par catégorie via `resolveCategoryColor(c.color, c.slug)` + helper local `hexToRgba` (bordure et halo colorés — c'est ce qui produit le rouge/violet/jaune).

1. Catalogue — cartes bento premium
- Carte : `relative h-40 sm:h-44 rounded-3xl bg-[#FAFAF8] border border-neutral-200/60 p-5 shadow-sm hover:shadow-2xl hover:border-neutral-300 transition-all duration-300 group overflow-hidden flex flex-col justify-between`.
- Visuel : image `h-24 sm:h-28 w-auto object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.15)] group-hover:scale-105 group-hover:-translate-y-1.5 transition-all duration-300`, centrée dans la zone haute, sans conteneur carré blanc autour. Fallback icône Lucide (`resolveCategoryIcon`) au même gabarit, même traitement de hover.
- Zone texte basse, sans fond : nom en `text-base font-black text-neutral-900 uppercase tracking-tight` ; sous-titre décompte `text-xs font-semibold text-neutral-500 mt-0.5` affiché uniquement quand `counts?.[id]` est fourni (libellé « N pièces »).
- Flèche : `absolute top-4 right-4 bg-neutral-900 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md`. Reste un `Link` frère du bouton, jamais imbriqué, avec `stopPropagation`. Pour rester atteignable au clavier/tactile, on ajoute `focus-visible:opacity-100`.
- Etat actif conservé : `border-[#4A7C59] border-2 bg-[#4A7C59]/10`.
- Carte « Toutes » : même gabarit `h-40 sm:h-44`, icône `LayoutGrid`, sans flèche.
- Skeleton aligné : `h-40 sm:h-44 rounded-3xl`, grille `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4`.

2. Home Dark — accent vert unique
- Suppression de l'import `resolveCategoryColor`, du helper `hexToRgba` et de tous les inline styles de couleur.
- Carte inactive : `relative h-24 sm:h-28 min-w-[110px] rounded-2xl bg-neutral-900/80 border border-white/10 p-3 flex flex-col items-center justify-between hover:border-white/25 transition-all cursor-pointer group`.
- Carte active : `bg-[#4A7C59]/20 border-2 border-[#4A7C59] shadow-[0_0_20px_rgba(74,124,89,0.3)] text-white`.
- Image : `h-12 sm:h-14 w-auto object-contain drop-shadow-md group-hover:scale-105 transition-transform` ; fallbacks emoji / initiale conservés au même gabarit.
- Label : `text-xs font-bold uppercase tracking-wider text-center text-white line-clamp-1`.
- Badge décompte : `absolute top-2 right-2 bg-white/10 px-1.5 py-0.5 rounded-full text-[10px] text-white/70`.
- Conservés : conteneur scroll mobile / grille `sm:grid-cols-4 lg:grid-cols-7`, `role="checkbox"`, `aria-checked`, `whileTap`, props du composant inchangées.

Risques
- Cartes catalogue plus hautes (+8/32 px) : les produits descendent légèrement, compromis assumé pour la lisibilité du visuel.
- Flèche masquée par défaut : invisible sur mobile (pas de hover) — la navigation vers `/categorie/:slug` reste possible depuis le filtre et le focus clavier.

Plan de test localhost
1. `/catalogue` desktop : 4 colonnes, image 3D sans cadre blanc, ombre portée visible, hover = lift + flèche qui apparaît.
2. `/catalogue` mobile 375 : 2 colonnes, texte non tronqué anormalement, filtre au tap.
3. `/` : aucune bordure rouge/violette/jaune, seul le vert `#4A7C59` sur les cartes actives ; multi-sélection et compteurs intacts.
4. Skeletons sans saut de layout ; catégories sans image en fallback icône.
