

# Fix carrousel : virtual loop + suppression scrollbar + padding vertical

## Problemes actuels

1. **Vide a gauche** : Embla `loop: true` ne duplique pas visuellement les slides quand il y en a trop peu pour remplir le viewport. Le premier produit reste donc seul a gauche avec du vide.
2. **Scrollbar verticale** : le `overflow-y: visible` (ligne 264) + `overflow: visible` sur le parent (ligne 261) laissent le contenu scale deborder et creent une scrollbar sur la page.
3. **Cartes toujours legerement coupees** : le padding vertical `py-12` n'est pas suffisant pour le scale 1.15.

## Modifications — `src/components/showcase/GamingCarousel.tsx`

### 1. Virtual loop : doubler les slides si < 8

Apres le calcul de `filteredParts`, creer `displayParts` :
```ts
const displayParts = filteredParts.length > 0 && filteredParts.length < 8
  ? [...filteredParts, ...filteredParts]
  : filteredParts;
```

- Utiliser `displayParts` pour le mapping des slides (ligne 269)
- Utiliser `displayParts.length` pour le calcul de `wrappedDistance`
- `shouldLoop` reste `filteredParts.length > 1` (inchange)
- Les dots de pagination et le counter restent bases sur `filteredParts` (pas `displayParts`) pour eviter de montrer les doublons a l'utilisateur
- La `key` de chaque slide devient `${part.id}-${index}` (au lieu de `part.id` seul) car les IDs sont maintenant dupliques
- Le `handleCardClick` utilise `index % filteredParts.length` pour retrouver la vraie part dans `filteredParts`

### 2. Suppression de la scrollbar verticale

- Sur le container parent (ligne 261, `py-12...`) : remplacer `style={{ overflow: "visible" }}` par `className="overflow-hidden"` pour empecher la scrollbar. Le overflow-hidden sur ce container ne coupe PAS les cartes car c'est le padding interne qui donne l'espace.
- Sur le viewport Embla (ligne 263) : retirer `style={{ overflowY: "visible" }}`. Laisser le `overflow-hidden` standard d'Embla.
- A la place, augmenter le padding vertical du container a `py-20 md:py-20 lg:py-24` pour que le scale 1.15 ait largement l'espace de respirer DANS le container, sans deborder.

### 3. Container principal

- Ajouter `overflow-hidden` sur le container principal (ligne 162, `relative w-full`) pour garantir zero scrollbar quoi qu'il arrive.

## Ce qui ne change PAS

- `GamingCarouselCard.tsx` — aucune modification
- Config Embla : `align: "center"`, `loop: shouldLoop`, `containScroll: false`
- QuickViewModal, filtres, fleches, dots
- Le fix du clic lateral (closest button)

## Fichier modifie

- `src/components/showcase/GamingCarousel.tsx`

