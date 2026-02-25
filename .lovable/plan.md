

# Refonte du Carrousel Home -- Style "Studio Garage"

## Analyse de l'existant

Le carrousel actuel de la Home (`CompatiblePartsSection`) delegue l'affichage au `GamingCarousel` (Embla-based, centrage dynamique, scale 1.6x au centre). Les infos produit (prix, bouton panier) ne sont visibles que sur la carte centrale -- les cartes laterales sont floues/desaturees avec uniquement l'image.

Le Garage utilise un composant distinct `CompatiblePartsGrid` (scroll horizontal natif, cartes 280px) avec filtres par categorie, tri, badges stock, bouton panier, indicateur difficulte -- exactement le niveau d'info demande.

Les categories parentes en base sont : Pneus, Chambres a Air, Freinage, Chargeurs (4 seulement). Les filtres "Batteries" et "Accessoires" mentionnes dans le brief n'existent pas encore -- ils seront ajoutes dans la liste statique mais ne filtreront rien tant que ces categories ne sont pas creees en base. "Tous" montrera tout.

## Architecture proposee

### Nouveau composant : `src/components/showcase/StudioProductCarousel.tsx`

Un composant **reutilisable** qui fusionne le meilleur des deux mondes :

- **Structure Embla** du GamingCarousel (loop, align center, navigation fleches glassmorphiques)
- **Cartes "Full Info"** inspirees du Garage CompatiblePartsGrid (stock badge, categorie, nom, prix, bouton panier, difficulte)
- **Barre de filtres** horizontale integree au-dessus du carrousel
- **AnimatePresence** pour le filtrage fluide

### Props du composant

```typescript
interface StudioProductCarouselProps {
  parts: Part[];
  activeModelName?: string;
  activeBrandSlug?: string;
  isLoading?: boolean;
}
```

### Carte produit : `src/components/showcase/StudioCarouselCard.tsx`

Chaque carte affiche TOUTES les infos quel que soit son positionnement :

- Badge stock (haut droite) -- glassmorphism avec bordure coloree (vert/orange/rouge)
- Image produit sur fond `bg-white/60 backdrop-blur-md border-white/40`
- Categorie (micro-caps uppercase tracking-wider)
- Nom produit (font-medium, line-clamp-2)
- Prix (font-bold text-mineral)
- Bouton "Ajouter au panier" (icone ShoppingCart, toujours visible)
- Indicateur difficulte (dots colores)

**Focus dynamique** : la carte centrale a un `scale(1.08)` (plus subtil que 1.6x actuel), les laterales a `scale(0.95)` avec opacite 0.85. PAS de blur ni grayscale -- toutes les infos restent lisibles.

Le clic sur une carte laterale la centre (scrollTo). Le clic sur la carte centrale ouvre le QuickViewModal existant.

### Barre de filtres

Composant inline dans `StudioProductCarousel` :

```text
[Tous] [Freinage] [Pneus] [Chambres à Air] [Batteries] [Chargeurs] [Accessoires]
```

- Style : pills arrondies, `bg-mineral text-white` quand actif, `bg-white/60 backdrop-blur-sm text-carbon/70` sinon
- Filtrage client-side sur `part.category?.name`
- AnimatePresence : quand on change de filtre, les cartes sortent en `opacity: 0, scale: 0.95` et entrent en `opacity: 1, scale: 1`

### Integration dans la Home

`CompatiblePartsSection.tsx` sera modifie pour utiliser `StudioProductCarousel` au lieu de `GamingCarousel`. Le header (compteur pieces, badge compatible, nom modele) reste identique.

### Design System respecte

- Fond : `#F5F3F0` (greige)
- Cartes : glassmorphism `bg-white/60 backdrop-blur-md border border-white/40`
- Typographie : uppercase tracking-wide pour les titres, font-display
- Couleurs : Carbon `#1A1A1A`, Mineral `#93B5A1`
- Hover : lift effect `y: -6, scale: 1.03` avec spring stiffness 400

## Fichiers modifies / crees

1. **CREER** `src/components/showcase/StudioCarouselCard.tsx` -- Carte produit "Full Info" glassmorphique
2. **CREER** `src/components/showcase/StudioProductCarousel.tsx` -- Carrousel Embla + filtres + AnimatePresence
3. **MODIFIER** `src/components/CompatiblePartsSection.tsx` -- Remplacer `GamingCarousel` par `StudioProductCarousel`

## Ce qui ne change pas

- `GamingCarousel` et `GamingCarouselCard` restent intacts (pas de suppression, peuvent etre reutilises ailleurs)
- `QuickViewModal` reutilise tel quel
- Hooks de donnees (`useCompatibleParts`, `useCompatiblePartsCount`) inchanges
- Garage `CompatiblePartsGrid` inchange
- Aucune modification de base de donnees

