# Plan — Home : espacements harmonisés & rythme visuel

## Constat
Le squiggle orange pointe le vide entre la grille **TOP DU MOMENT** (`ScooterCarousel`) et la suite. En auditant `src/pages/Index.tsx`, chaque section gère son propre padding vertical de façon incohérente :

| Section | Padding vertical actuel |
|---|---|
| `HeroSearchFirst` | (interne) |
| `ShopByCompatibility` | `my-12 lg:my-16` (≈ 48/64px **chaque côté**) |
| `BrandCarousel` | interne |
| `GarageRiderCard` | interne |
| `Divider` | `py-2 lg:py-4` |
| `ScooterCarousel` | `py-10 lg:py-14` |
| `FavoritesSection` | `py-8` (masquée si non connecté → **gros vide** entre Scooters et TrustStrip) |
| `TrustStrip` | interne |

Deux problèmes :
1. **Doublons de spacing** : `my-16` d'une section + `py-14` de la suivante = ~120px de vide.
2. **Section conditionnelle vide** (`FavoritesSection` cachée pour les invités) qui ne compense pas.

## Objectif
Un rythme vertical **unique et cohérent** sur toute la home, façon éditorial premium (style Apple / Aesop) : transitions douces, respirations égales, alignement parfait des largeurs max.

## Changements proposés (UI uniquement, aucun changement de logique)

### 1. Tokenisation du rythme vertical
Créer une convention unique : chaque section utilise **`py-12 lg:py-20`** (sans `my-*`). Suppression des marges externes pour éviter le cumul.

Fichiers touchés :
- `src/components/home/ShopByCompatibility/index.tsx` → remplacer `my-12 lg:my-16` par `py-10 lg:py-16` sur le wrapper `<section>`.
- `src/components/home/ScooterCarousel.tsx` → `py-10 lg:py-14` → `py-12 lg:py-16` (alignement).
- `src/components/home/FavoritesSection.tsx` → `py-8` → `py-12 lg:py-16` ; ajouter `return null` propre quand vide (au lieu de section vide qui crée un trou).
- `src/components/home/BrandCarousel.tsx`, `GarageRiderCard.tsx`, `TrustStrip.tsx`, `HeroSearchFirst.tsx` : harmoniser padding vertical à la même échelle (lecture rapide nécessaire avant édition).

### 2. Divider redessiné
`src/components/home/Divider.tsx` actuellement = simple trait gris.
Le remplacer par un **espaceur typographique discret** : ornement central minimaliste (point central + filets fins de chaque côté, couleur `rgba(26,26,26,0.12)`), padding `py-6 lg:py-10`. Donne du souffle sans paraître vide.

### 3. Fond unifié
Aujourd'hui : `Index` = `#FAFAF8`, `ScooterCarousel` = `#FAFAF8`, `ShopByCompatibility` = carte blanche `#FFFFFF` posée sur `#FAFAF8`. Garder ce pattern mais **standardiser le radius** des cartes section (`rounded-3xl`) et le `border` (`0.5px solid rgba(0,0,0,0.04)`) pour les sections qui utilisent une « carte » (ShopByCompatibility, GarageRiderCard).

### 4. Largeur max cohérente
Toutes les sections de contenu : `max-w-7xl mx-auto px-4 lg:px-8`. Vérifier que `BrandCarousel`, `ScooterCarousel`, `FavoritesSection`, `TrustStrip` respectent cette grille.

### 5. Ordre des sections (optionnel — à valider)
Ordre actuel : Hero → ShopByCompatibility → BrandCarousel → GarageRiderCard → Divider → ScooterCarousel → Favorites → Trust.

Proposition (plus narratif) :
Hero → **ScooterCarousel** (top du moment, visuel fort) → **ShopByCompatibility** (conversion) → BrandCarousel → GarageRiderCard → Favorites → Divider → Trust.

> Ce point est **optionnel** : si tu préfères ne pas toucher à l'ordre, je l'omets.

### 6. Pastille fixe « Roule · Répare · Dure »
Visible bottom-left dans le screenshot, parfois en superposition gênante sur les CTA. Ajouter `lg:bottom-6` pour la remonter légèrement et `opacity-90` pour l'adoucir. (Optionnel.)

## Périmètre exact
**Frontend uniquement, présentation uniquement.** Aucune modification :
- des hooks de données
- des routes / logiques
- des schémas Supabase
- des composants admin

## Fichiers modifiés (estimé)
1. `src/components/home/ShopByCompatibility/index.tsx`
2. `src/components/home/ScooterCarousel.tsx` (padding section uniquement)
3. `src/components/home/FavoritesSection.tsx`
4. `src/components/home/Divider.tsx` (refonte visuelle)
5. `src/components/home/BrandCarousel.tsx` (padding)
6. `src/components/home/GarageRiderCard.tsx` (padding)
7. `src/components/home/TrustStrip.tsx` (padding)
8. `src/pages/Index.tsx` (réordonnancement **si** option 5 validée, sinon non touché)

Aucun fichier créé, aucun supprimé.

## Questions avant GO BUILD
1. Tu valides l'**option 5 (réordonner les sections)** ou je garde l'ordre actuel ?
2. Tu veux que je propose **3 directions visuelles rendues** (via design directions) pour le nouveau Divider et le rythme global avant d'implémenter, ou j'applique direct ?
3. La pastille fixe « Roule · Répare · Dure » : je la garde telle quelle, je l'adoucis, ou je la supprime ?
