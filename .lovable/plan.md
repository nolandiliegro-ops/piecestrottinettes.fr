

# Amélioration du Carrousel Scooter avec Framer Motion

## Résumé

Ajout d'animations premium au carrousel de la Hero Section : transitions fluides, effet parallax, animations stagger sur les specs, auto-play intelligent avec progression circulaire, et indicateurs de navigation améliorés.

## Modifications Prévues

### Fichier Principal : `src/components/hero/ScooterCarousel.tsx`

#### 1. Transitions Fluides entre Slides (0.8s cubic-bezier)

Améliorer les animations existantes sur les slides avec une courbe cubic-bezier premium :

```typescript
// Transition améliorée pour les slides
transition={{ 
  duration: 0.8, 
  ease: [0.16, 1, 0.3, 1], // Cubic-bezier premium "expo.out"
  filter: { duration: 0.4 }
}}
```

#### 2. Effet Parallax sur l'Image de la Trottinette

Ajouter un effet de parallax subtil basé sur la direction de navigation :

```typescript
// Nouveau state pour tracker la direction
const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

// Animation parallax sur l'image
<motion.img
  initial={{ x: slideDirection === 'right' ? 50 : -50, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  exit={{ x: slideDirection === 'right' ? -30 : 30, opacity: 0 }}
  transition={{ 
    duration: 0.8, 
    ease: [0.16, 1, 0.3, 1],
    x: { duration: 1, ease: [0.16, 1, 0.3, 1] } // Parallax plus lent
  }}
/>
```

#### 3. Animations Stagger sur les Specs (60V, 35A, 5400W)

Modifier le bloc FLOATING SPECS avec des animations stagger :

```typescript
// Container avec stagger children
<motion.div
  key={`specs-floating-${activeModel?.id}`}
  initial="hidden"
  animate="visible"
  variants={{
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
  }}
>
  {/* Chaque spec avec animation individuelle */}
  <motion.div
    variants={{
      hidden: { opacity: 0, x: 20 },
      visible: { 
        opacity: 1, 
        x: 0,
        transition: {
          type: "spring",
          damping: 15,
          stiffness: 200, // Bounce subtil
        }
      }
    }}
  >
    {/* Voltage spec */}
  </motion.div>
</motion.div>
```

#### 4. Indicateurs de Navigation Animés

Améliorer les dots de pagination avec scale au hover et glow actif :

```typescript
// Dot de navigation amélioré
<motion.button
  whileHover={{ scale: 1.2 }}
  whileTap={{ scale: 0.9 }}
  animate={{
    scale: isActive ? 1 : 1,
    boxShadow: isActive 
      ? "0 0 20px rgba(147,181,161,0.6)" // Glow effect
      : "none"
  }}
  className={cn(
    "rounded-full transition-all duration-300",
    isActive
      ? "w-6 lg:w-14 h-3 lg:h-5 bg-mineral"
      : "w-3 h-3 lg:w-6 lg:h-6 bg-mineral/30 hover:bg-mineral/50"
  )}
/>
```

#### 5. Auto-play avec Pause au Hover

Ajouter un système d'auto-play intelligent :

```typescript
// State pour auto-play
const [isHovered, setIsHovered] = useState(false);
const [isPaused, setIsPaused] = useState(false);
const autoPlayInterval = 5000; // 5 secondes

// Effect pour auto-play
useEffect(() => {
  if (isHovered || isPaused || models.length <= 1) return;
  
  const timer = setInterval(() => {
    onNavigateNext?.();
  }, autoPlayInterval);
  
  return () => clearInterval(timer);
}, [isHovered, isPaused, models.length, onNavigateNext]);

// Container avec onMouseEnter/Leave
<div 
  onMouseEnter={() => setIsHovered(true)}
  onMouseLeave={() => setIsHovered(false)}
>
```

#### 6. Indicateur de Progression Circulaire

Nouveau composant pour visualiser la progression de l'auto-play :

```typescript
// Composant CircularProgress
const CircularProgress = ({ duration, isPaused }: { duration: number; isPaused: boolean }) => {
  return (
    <svg className="w-8 h-8" viewBox="0 0 32 32">
      <circle
        cx="16" cy="16" r="14"
        fill="none"
        stroke="rgba(147,181,161,0.2)"
        strokeWidth="2"
      />
      <motion.circle
        cx="16" cy="16" r="14"
        fill="none"
        stroke="rgba(147,181,161,1)"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: isPaused ? undefined : 1 }}
        transition={{ 
          duration: duration / 1000, 
          ease: "linear",
          repeat: Infinity 
        }}
        style={{
          rotate: -90,
          transformOrigin: "center"
        }}
      />
    </svg>
  );
};
```

## Structure des Animations

```text
┌─────────────────────────────────────────────────────────────────┐
│                        SLIDE TRANSITION                          │
│  ┌─────────────┐    0.8s cubic-bezier    ┌─────────────┐        │
│  │   Slide 1   │  ───────────────────►   │   Slide 2   │        │
│  │   (exit)    │      parallax: x±30     │  (enter)    │        │
│  └─────────────┘                         └─────────────┘        │
├─────────────────────────────────────────────────────────────────┤
│                        SPECS STAGGER                             │
│  ┌──────┐  ┌──────┐  ┌──────┐                                   │
│  │ 60V  │  │ 35A  │  │5400W │   delay: 0.1s entre chaque        │
│  └──────┘  └──────┘  └──────┘   spring bounce: stiffness 200    │
│    t+0.3s   t+0.4s    t+0.5s                                    │
├─────────────────────────────────────────────────────────────────┤
│                     NAVIGATION DOTS                              │
│     ○    ●    ○    ○    ○                                       │
│          ↑ glow: 0 0 20px mineral                               │
│     hover: scale(1.2)                                           │
├─────────────────────────────────────────────────────────────────┤
│                   AUTO-PLAY + PROGRESS                           │
│  ┌────────────┐                                                 │
│  │ ◐ 5s timer │  Pause on hover                                │
│  │  progress  │  Resume on leave                                │
│  └────────────┘                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Fichiers Impactés

| Fichier | Action |
|---------|--------|
| `src/components/hero/ScooterCarousel.tsx` | Ajouter toutes les animations |

## Résultat Attendu

1. **Transitions fluides** : Les slides glissent avec une courbe "expo.out" premium
2. **Parallax** : L'image de la trottinette se déplace légèrement plus lentement que le reste
3. **Stagger specs** : Les 3 specs (V, Ah, W) apparaissent en cascade avec un rebond subtil
4. **Dots animés** : Scale au hover + glow vert sur l'indicateur actif
5. **Auto-play intelligent** : Défilement automatique toutes les 5s, pause au survol
6. **Progression circulaire** : Cercle SVG animé montrant le temps restant avant le prochain slide

## Section Technique

### Dépendances Utilisées

Toutes les animations utilisent Framer Motion déjà installé (`framer-motion: ^12.25.0`).

### Variants Stagger Détaillés

```typescript
const specsContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    }
  }
};

const specItemVariants = {
  hidden: { 
    opacity: 0, 
    x: 20,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 200,
    }
  }
};
```

### Gestion du Parallax

```typescript
// Track navigation direction
const handleScrollPrev = () => {
  setSlideDirection('left');
  emblaApi?.scrollPrev();
  onNavigatePrev?.();
};

const handleScrollNext = () => {
  setSlideDirection('right');
  emblaApi?.scrollNext();
  onNavigateNext?.();
};
```

