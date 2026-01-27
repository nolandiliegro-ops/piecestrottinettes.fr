
# Carrousel Premium "Pièces Certifiées" - Showcase Ultra-Design

## Résumé

Transformation de la section "Pièces Certifiées" en carrousel horizontal premium avec effet de profondeur, 5 produits visibles sur desktop, card centrale en focus (scale 1.1), navigation élégante, et synchronisation avec le Hero scooter selector.

---

## Fichiers à Créer / Modifier

| Fichier | Action |
|---------|--------|
| `src/components/carousel/PremiumCarousel.tsx` | CRÉER - Composant carrousel réutilisable |
| `src/components/carousel/PremiumProductCard.tsx` | CRÉER - Card produit premium pour carrousel |
| `src/components/CompatiblePartsSection.tsx` | MODIFIER - Intégrer le nouveau carrousel |

---

## Architecture du Carrousel

```text
+------------------------------------------------------------------+
|              7 PIÈCES CERTIFIÉES    [100% Compatible]             |
|                  Pour votre Xiaomi Mi Pro 2                       |
+------------------------------------------------------------------+
|                                                                    |
|  [←]  [Card] [Card] [ CARD FOCUS ] [Card] [Card]  [→]            |
|         0.9   0.95     1.1 scale    0.95   0.9                    |
|                                                                    |
|                    • • • ● • • •                                   |
+------------------------------------------------------------------+
```

---

## 1. PremiumCarousel.tsx - Composant Réutilisable

Hook Embla avec configuration premium :

```typescript
const [emblaRef, emblaApi] = useEmblaCarousel({
  loop: true,
  align: "center",
  slidesToScroll: 1,
  containScroll: false, // Allow partial slides
  dragFree: false,
});
```

**Props Interface** :

```typescript
interface PremiumCarouselProps {
  children: React.ReactNode;
  itemsCount: number;
  onSlideChange?: (index: number) => void;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
}
```

**Responsive Configuration** :

| Breakpoint | Cards Visibles | Card Width |
|------------|----------------|------------|
| Desktop (lg) | 5 | 20% viewport |
| Tablet (md) | 3 | 33% viewport |
| Mobile | 1.5 | 70% viewport |

**Navigation Arrows** :

- Position : Absolue, centrée verticalement
- Style : Glassmorphism circulaire (50x50px)
- Background : `rgba(255,255,255,0.95)` + `backdrop-blur-sm`
- Border : `1px solid rgba(147,181,161,0.3)`
- Hover : `scale(1.1)` + glow Mineral Green
- Icons : ChevronLeft / ChevronRight (Lucide)

**Pagination Dots** :

- Position : Centré, sous le carrousel (mt-8)
- Active : `w-8 h-2` pill shape, `bg-mineral`
- Inactive : `w-2 h-2` circle, `bg-mineral/30`
- Transition : `0.3s ease-out`

---

## 2. PremiumProductCard.tsx - Card Showcase

**Dimensions et Position** :

```typescript
// Scale dynamique basé sur la position
const getScale = (distanceFromCenter: number) => {
  if (distanceFromCenter === 0) return 1.1;  // Focus card
  if (distanceFromCenter === 1) return 0.95;
  return 0.9;
};

// Opacity parallax
const getOpacity = (distanceFromCenter: number) => {
  if (distanceFromCenter === 0) return 1;
  if (distanceFromCenter === 1) return 0.85;
  return 0.7;
};
```

**Styles de la Card** :

```typescript
style={{
  background: "rgba(255, 255, 255, 0.9)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(147, 181, 161, 0.2)",
  borderRadius: "20px",
  padding: "24px",
  boxShadow: "0 8px 32px rgba(26, 26, 26, 0.08)",
}}
```

**Image Container** :

```typescript
<motion.div 
  className="relative w-[200px] h-[200px] mx-auto"
  whileHover={{ 
    scale: 1.05, 
    rotate: 2,
    transition: { duration: 0.4, ease: "easeOut" }
  }}
>
  <img 
    src={product.image_url} 
    alt={product.name}
    className="w-full h-full object-contain"
    style={{ background: "transparent" }}
  />
</motion.div>
```

**Informations Produit** :

| Élément | Style |
|---------|-------|
| Nom | `font-weight: 600`, `font-size: 14px`, `line-clamp-2` |
| Prix | `font-size: 20px`, `font-weight: 700`, `color: #93B5A1` |
| Badge COMPATIBLE | Glassmorphism, Mineral Green, pulse animation |
| Stock | Badge avec dot animé |

**Interactions Hover** :

```typescript
<motion.div
  whileHover={{ 
    y: -8,
    boxShadow: "0 16px 48px rgba(147, 181, 161, 0.25)"
  }}
  transition={{ duration: 0.4, ease: "easeOut" }}
>
```

---

## 3. Modifications CompatiblePartsSection.tsx

**Avant** : Grid 4 colonnes avec PartCard

**Après** : PremiumCarousel avec PremiumProductCard

**Changements Clés** :

1. Importer les nouveaux composants
2. Remplacer le grid par le carrousel
3. Garder le header existant (titre dynamique + badge)
4. Augmenter le limit de pièces (8 → 12 pour le carousel)
5. Ajouter AnimatePresence pour les transitions modèle

**Code Structure** :

```typescript
{isLoading ? (
  <CarouselSkeleton />
) : parts.length > 0 ? (
  <AnimatePresence mode="wait">
    <motion.div
      key={activeModelSlug}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <PremiumCarousel itemsCount={parts.length}>
        {parts.map((part, index) => (
          <PremiumProductCard 
            key={part.id}
            part={part}
            index={index}
            isCenter={/* calculated */}
          />
        ))}
      </PremiumCarousel>
    </motion.div>
  </AnimatePresence>
) : (
  <EmptyState />
)}
```

---

## 4. Animations et Transitions

**Transition entre slides** :

```typescript
transition: {
  duration: 0.6,
  ease: [0.25, 0.46, 0.45, 0.94] // easeOutQuart
}
```

**Effet Parallax** :

- Cards éloignées du centre se déplacent légèrement plus lentement
- Créé par le scale différentiel + opacity

**Fade-in au chargement** :

```typescript
initial={{ opacity: 0, scale: 0.95 }}
animate={{ opacity: 1, scale: 1 }}
transition={{ 
  duration: 0.5, 
  delay: index * 0.1,
  ease: "easeOut"
}}
```

**Transition Modèle** (quand scooter change) :

```typescript
// AnimatePresence avec mode="wait"
exit: { opacity: 0, x: -50 }
enter: { opacity: 0, x: 50 }
```

---

## 5. Responsive Breakpoints

**Desktop (≥1024px)** :

- 5 cards visibles
- Card width : ~220px
- Gap : 24px
- Navigation arrows : visibles en permanence
- Dots : 12 max visibles

**Tablet (≥768px, <1024px)** :

- 3 cards visibles
- Card width : ~240px
- Gap : 16px
- Navigation arrows : visibles
- Dots : 8 max visibles

**Mobile (<768px)** :

- 1.5 cards visibles (suggère swipe)
- Card width : 70vw
- Gap : 16px
- Navigation arrows : cachés ou petits
- Swipe enabled
- Dots : 6 max visibles

---

## 6. Swipe Mobile

Configuration Embla pour mobile :

```typescript
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

const emblaOptions = {
  loop: true,
  align: "center",
  dragFree: isMobile, // Free drag on mobile
  containScroll: isMobile ? "trimSnaps" : false,
};
```

Touch events :

- `touchstart`, `touchmove`, `touchend` natifs via Embla
- Threshold minimal pour activer le swipe

---

## 7. CSS Classes Utilitaires

Ajouter dans `index.css` :

```css
/* Premium Carousel Styles */
.premium-carousel-container {
  perspective: 1000px;
  perspective-origin: center;
}

.premium-card-focus {
  z-index: 10;
  filter: drop-shadow(0 12px 24px rgba(147, 181, 161, 0.2));
}

.premium-card-side {
  filter: grayscale(10%);
}

/* Carousel Navigation */
.carousel-nav-btn {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.carousel-nav-btn:hover {
  box-shadow: 0 8px 30px rgba(147, 181, 161, 0.4);
}
```

---

## Résumé des Interactions

| Élément | Action | Animation |
|---------|--------|-----------|
| Card centrale | Focus | `scale(1.1)`, full opacity, z-index élevé |
| Cards latérales | Background | `scale(0.9-0.95)`, opacity réduite |
| Hover card | Lift | `translateY(-8px)` + glow Mineral |
| Image hover | Zoom+Rotate | `scale(1.05)` + `rotate(2deg)` |
| Navigation | Click | Slide 0.6s ease-out |
| Swipe mobile | Drag | Native Embla avec momentum |
| Changement modèle | Transition | Fade-out/Fade-in avec AnimatePresence |
| Dots | Click | Jump to slide avec transition |

---

## Couleurs et Tokens

| Élément | Valeur |
|---------|--------|
| Card background | `rgba(255, 255, 255, 0.9)` |
| Card blur | `blur(20px)` |
| Card border | `1px solid rgba(147, 181, 161, 0.2)` |
| Card radius | `20px` |
| Card shadow | `0 8px 32px rgba(26, 26, 26, 0.08)` |
| Focus shadow | `0 16px 48px rgba(147, 181, 161, 0.25)` |
| Price color | `#93B5A1` (Mineral Green) |
| Transition duration | `0.6s` |
| Transition easing | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` |

---

## Résultat Attendu

1. **Showcase Premium** : Cards avec effet de profondeur, focus central visible
2. **Navigation fluide** : Flèches élégantes + dots + swipe mobile
3. **Connexion Hero** : Mise à jour automatique quand le scooter change
4. **Responsive parfait** : 5 → 3 → 1.5 cards selon la taille d'écran
5. **Micro-interactions** : Lift, glow, zoom image au hover
6. **Performance** : Embla Carousel optimisé, animations GPU-accelerated
