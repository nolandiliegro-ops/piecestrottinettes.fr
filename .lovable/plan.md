# Corrections finales du GamingCarousel — startIndex au centre, clipping, action bar, animation

## Fichier modifie : `src/components/showcase/GamingCarousel.tsx`

### 1. startIndex au milieu de la liste

Ajouter le calcul du `startIndex` dans la config Embla et synchroniser `selectedIndex` :

```ts
const startIdx = Math.floor(filteredParts.length / 2);

const [emblaRef, emblaApi] = useEmblaCarousel({
  loop: false,
  align: "center",
  containScroll: false,
  slidesToScroll: 1,
  skipSnaps: false,
  startIndex: startIdx,
});
```

Ajouter un `useEffect` pour synchroniser `selectedIndex` quand `filteredParts` change :

```ts
useEffect(() => {
  setSelectedIndex(Math.floor(filteredParts.length / 2));
}, [filteredParts.length]);
```

Mettre a jour `handleCategoryChange` pour scroller vers le milieu de la nouvelle liste filtree (la `key` dynamique force deja le re-mount, donc le `startIndex` sera reapplique).

### 2. Fix clipping & scrollbar

- Container carousel (ligne 259) : changer `py-32 min-h-[500px]` en `py-40 min-h-[450px] md:min-h-[650px]`
- Container parent (ligne 160-161) : remplacer `overflow-hidden` par `overflow-x-hidden` via style inline `overflowX: 'hidden'` pour bloquer la scrollbar horizontale tout en laissant Y libre
- Viewport Embla (ligne 261) : garder `overflow-visible` pour que le zoom et les badges respirent

### 3. Action bar : meilleur espacement

Dans `GamingCarouselCard.tsx`, la barre flottante d'actions (coeur, oeil, panier) est a `bottom-4` — la remonter a `bottom-6` pour la separer du bouton "Commander Direct" qui apparait sous la carte. Cela evite le chevauchement.

### 4. Animation fade-in sur changement de categorie

Envelopper le contenu carousel dans un `motion.div` avec `AnimatePresence` et une `key` liee au filtre actif, pour creer un fade-in/fade-out fluide lors du changement de categorie :

```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={`carousel-${activeCategory}`}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
  >
    {/* carousel content */}
  </motion.div>
</AnimatePresence>
```

## Fichier modifie : `src/components/showcase/GamingCarouselCard.tsx`

### Action bar repositionnement

- Ligne 235 : changer `bottom-4` en `bottom-6` pour espacer la barre flottante du bouton "Commander Direct"

## Resume des changements


| Fichier                  | Changement                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GamingCarousel.tsx`     | `startIndex: Math.floor(filteredParts.length / 2)`, useEffect sync selectedIndex, `py-40 min-h-[450px] md:min-h-[650px]`, `overflowX: 'hidden'` sur parent, AnimatePresence fade-in sur changement de categorie S'assurer que le `py-40` est bien appliqué sur le container qui a l'ID ou la ref embla pour que le clipping disparaisse totalement en haut et en bas. |
| `GamingCarouselCard.tsx` | Action bar `bottom-4` → `bottom-6` Ajouter `nopin="nopin"` sur les balises `img` pour bloquer le bouton Pinterest.- Remonter la barre d'actions à `bottom-8` (au lieu de `bottom-6`) pour une séparation encore plus nette avec le bouton 'Commander Direct'.                                                                                                        |


## Ce qui ne change pas

- Config Embla : `loop: false`, `align: "center"`, `containScroll: false`
- Design glassmorphism, CategoryBadge, QuickViewModal
- Logique clic lateral = centrer, clic central = modale
- Dots et counter bases sur `filteredParts`                                                