

# Correction de l'alignement du carrousel — Start-aligned avec focus sur la première carte

## Probleme constate

Avec `align: "center"`, Embla centre la carte selectionnee au milieu du viewport, ce qui laisse un grand vide a gauche au chargement. L'utilisateur veut que les produits remplissent l'espace des le depart, alignes a gauche avec un padding coherent.

## Modifications

### 1. `src/components/showcase/GamingCarousel.tsx`

**Config Embla :**
- `align: "center"` → `align: "start"`
- `containScroll: false` → `containScroll: "trimSnaps"` (evite les espaces vides en fin de scroll)
- `loop: true` reste en place pour le scroll infini

**Padding du container de scroll :**
- Le container Embla recoit `pl-5 md:pl-10 lg:pl-20` pour aligner le premier produit avec les marges du site (identique au padding horizontal existant du container parent)

**Suppression du `clipPath: "inset(-100px 0)"` :** plus necessaire avec l'alignement start + containScroll

**Fleches de navigation :** restent positionnees en absolu (inchangees)

### 2. `src/components/showcase/GamingCarouselCard.tsx`

**Logique de focus :**
- La carte au `selectedIndex` (snap actif d'Embla, qui sera la carte la plus a gauche visible) conserve le scale 1.15, l'opacite 1 et le blur 0
- Le hover sur n'importe quelle carte applique egalement un leger scale 1.05 pour le feedback visuel
- La `isCenter` prop continue de fonctionner car c'est le parent qui calcule `distanceFromCenter` par rapport a `selectedIndex` — le changement d'align ne casse pas cette logique, seul le snap point change

**Pas de changement de props :** la carte recoit toujours `isCenter` et `distanceFromCenter` du parent, la semantique est juste "carte active" plutot que "carte au centre visuel"

### 3. Ajustements visuels mineurs

- `getCardWidth` : toutes les cartes a **280px** (uniforme) car avec l'alignement start, les variations de largeur creent des sauts visuels
- La carte active (`distance === 0`) garde son scale 1.15 qui la rend naturellement plus grande
- Skeleton mis a jour avec les nouvelles dimensions uniformes

## Ce qui ne change PAS

- Structure Embla (loop, slidesToScroll)
- QuickViewModal et ses interactions
- Clic carte active → QuickViewModal
- Clic carte non-active → scrollTo
- Filtres par categorie
- Bouton panier sur toutes les cartes
- Design glassmorphism des cartes

## Fichiers modifies

- `src/components/showcase/GamingCarousel.tsx` — config Embla, padding, card widths
- `src/components/showcase/GamingCarouselCard.tsx` — ajustement mineur du hover scale

