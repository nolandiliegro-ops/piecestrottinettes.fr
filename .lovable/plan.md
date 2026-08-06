Home Dark : restauration des couleurs signatures sur les cartes catégories

Objectif
Rendre à chaque carte catégorie sa couleur de marque (bordure + halo) lorsqu'elle est active, et remonter légèrement le gabarit des cartes glassmorphic.

Fichier concerné
`src/components/home/ShopByCompatibility/CategoryPills.tsx` (seul fichier modifié)

État actuel (vérifié)
- Le composant n'utilise plus aucune couleur dynamique : accent vert unique `#4A7C59` codé en dur pour l'état actif.
- Cartes : `h-24 sm:h-28 min-w-[110px]`, image `h-12 sm:h-14`, label `text-xs font-bold`, badge décompte `bg-white/10 px-1.5`.
- `resolveCategoryColor(dbColor, slug)` existe dans `src/lib/categoryColors.ts` et retombe sur la palette par slug si `categories.color` est vide. `CategoryGroupV2` expose bien `color` et `slug`.

Modifications
1. Couleur dynamique
- Réimporter `resolveCategoryColor` et l'appeler avec `(group.color, group.slug)`.
- Helper local `hexToRgba(hex, alpha)` (support `#RGB` et `#RRGGBB`, fallback neutre si format inattendu) pour le halo.
- Carte active : classes `bg-neutral-900/95 text-white border-2` + inline `style={{ borderColor: hex, boxShadow: '0 0 20px ' + hexToRgba(hex, 0.35) }}`. Aucun style inline sur les cartes inactives.

2. Gabarit
- Conteneur inchangé : scroll horizontal mobile, `sm:grid sm:grid-cols-4 lg:grid-cols-7`, scrollbar masquée.
- Carte inactive : `relative h-28 sm:h-32 min-w-[115px] rounded-2xl bg-neutral-900/70 backdrop-blur-md border border-white/10 p-3 flex flex-col items-center justify-between hover:border-white/25 hover:-translate-y-1 transition-all cursor-pointer group`.
- Image : `h-14 sm:h-16 w-auto object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-200`, zone visuelle passée à `h-14 sm:h-16`. Fallbacks emoji / initiale conservés au même gabarit.
- Label : `text-xs font-black uppercase tracking-wider text-center text-white line-clamp-1`.
- Badge décompte : `absolute top-2 right-2 bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-white/90`.

3. Logique conservée
Multi-sélection via `selectedSlugs` / `onToggle`, `role="checkbox"`, `aria-checked`, `whileTap`, props du composant et signature inchangées.

Risques
- Cartes plus hautes (+16 px) : la section sombre gagne un peu de hauteur.
- Certaines couleurs très sombres (ex. guidon `#1A1A1A`) donnent un halo peu visible sur fond noir — acceptable, l'état actif reste lisible via la bordure 2px et le fond plus opaque.

Plan de test localhost
1. `/` desktop 1242 : 7 colonnes, cartes glass, halo coloré uniquement sur les cartes sélectionnées.
2. Sélection multiple : plusieurs cartes actives simultanément, chacune avec sa propre couleur.
3. Mobile 375 : scroll horizontal fluide, pas de troncature du label.
4. Catégories sans image : fallback emoji / initiale au bon gabarit.
