

# Refonte des cartes du carrousel "Pièces Certifiées" + Filtres par catégorie

## Résumé

Transformer les cartes du carrousel Home pour adopter le style vertical épuré des "Pépites" (glassmorphism, badge catégorie, infos toujours visibles), ajouter des filtres par catégorie au-dessus, et adoucir l'animation de la carte centrale.

---

## Fichiers modifiés

### 1. `src/components/showcase/GamingCarouselCard.tsx` — Refonte complète du design

**Ce qui change :**
- Le design passe d'une "image flottante sans cadre" à une **carte verticale avec cadre glassmorphism** (style Pépites : `bg-white/60 backdrop-blur-md rounded-3xl border border-carbon/10`)
- Structure interne : Image (aspect 3/4) → Badge catégorie (en haut à droite, glassmorphism mineral) → Nom + Prix + Bouton Panier en bas
- **Nom, Prix et bouton "Ajouter au Panier" visibles sur TOUTES les cartes**, pas uniquement la centrale
- Le badge `CategoryBadge` reste affiché uniquement sur la carte centrale (au-dessus de l'image)
- La barre d'actions hover (favoris, œil, panier) reste uniquement sur la carte centrale

**Animation ajustée :**
- `getScale()` : centre = **1.15** (au lieu de 1.6), adjacent = 1.0, distance 2 = 0.95, loin = 0.9
- `getOpacity()` : centre = 1, adjacent = 0.85, distance 2 = 0.7, loin = 0.6
- `getBlur()` : réduit globalement (centre 0, adjacent 0.5, distance 2 1, loin 1.5)
- `getGrayscale()` : réduit (centre 0, adjacent 0.15, distance 2 0.3, loin 0.4)
- Suppression de `getImageSize()` — les tailles seront gérées par la largeur de la carte dans le parent

**Infos visibles sur toutes les cartes :**
- Nom (line-clamp-2, `text-sm` pour latérales, `text-base` pour centre)
- Prix (mineral, `text-lg` pour latérales, `text-xl` pour centre)
- Bouton panier rond (icône ShoppingCart) en bas à droite, toujours visible, style mineral

**Carte centrale uniquement :**
- Badge catégorie via `CategoryBadge` (comme actuellement)
- Barre d'actions hover (favoris, œil, panier)
- Bouton "Commander Direct" au survol
- Badge de compatibilité

### 2. `src/components/showcase/GamingCarousel.tsx` — Ajout des filtres + ajustement des dimensions

**Filtres par catégorie (nouveau bloc HTML) :**
- Ajout d'un state `activeCategory` (défaut: "Tous")
- Liste de catégories identique au Garage : `["Tous", "Freinage", "Pneus", "Chambres à Air", "Batteries", "Chargeurs", "Accessoires"]`
- Barre de boutons pills au-dessus du carrousel, style identique au Garage : `bg-mineral text-white` quand actif, `bg-white/60 backdrop-blur-sm border border-carbon/10` quand inactif
- Animation `motion.button` avec `whileHover scale 1.05` et `whileTap scale 0.95`
- Le filtrage est fait côté client via `useMemo` sur `parts` : filtre par `part.category?.name`
- Quand le filtre change, le carrousel se remet à la position 0 via `emblaApi.scrollTo(0)`

**Ajustement des dimensions des cartes :**
- `getCardWidth()` : centre = **320px** (au lieu de 480px), adjacent = 280px, distance 2 = 260px, loin = 240px
- `minHeight` du container réduit à **600px** (au lieu de 800px) pour s'adapter aux nouvelles proportions
- Skeleton mis à jour avec les nouvelles dimensions

**État vide filtré :**
- Si `filteredParts.length === 0` mais `parts.length > 0`, afficher un message "Aucune pièce dans cette catégorie" avec un bouton "Réinitialiser" (comme dans le Garage)

### 3. `src/components/CompatiblePartsSection.tsx` — Aucun changement structurel

Ce composant passe déjà `parts`, `activeModelName`, `activeBrandSlug` et `isLoading` au `GamingCarousel`. Aucune modification nécessaire.

---

## Ce qui ne change PAS

- Structure Embla Carousel (loop, align center, containScroll)
- `QuickViewModal` et son architecture shared-instance
- Le clic sur carte latérale → center cette carte (zero-friction logic)
- Le clic sur carte centrale → ouvre QuickViewModal
- Flèches de navigation gauche/droite
- Pagination dots
- Hook `useCompatibleParts` dans `useScooterData.ts`

---

## Structure visuelle d'une carte (nouveau design)

```text
┌───────────────────────────┐
│  ┌─────────────────────┐  │
│  │                     │  │
│  │   IMAGE (3/4)       │  │ ← bg-greige, object-contain
│  │              [BADGE]│  │ ← CategoryBadge (centre only)
│  │                     │  │
│  └─────────────────────┘  │
│                           │
│  CATÉGORIE (tiny mineral) │
│  NOM DU PRODUIT           │ ← line-clamp-2
│  29,90 €          [🛒]   │ ← prix + bouton panier rond
│                           │
└───────────────────────────┘
   glassmorphism card
```

