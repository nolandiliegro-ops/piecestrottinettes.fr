

# Auto-play Intelligent - Désactivation au Scroll

## Résumé

Implémentation d'un auto-play intelligent qui se désactive automatiquement lorsque l'utilisateur scrolle vers le bas (> 200px) pour consulter les pièces certifiées. L'auto-play se réactive si l'utilisateur remonte en haut de page (< 100px).

---

## Fichiers à Modifier

| Fichier | Action |
|---------|--------|
| `src/components/HeroSection.tsx` | MODIFIER - Ajouter détection scroll + prop autoPlayEnabled |
| `src/components/hero/ScooterCarousel.tsx` | MODIFIER - Recevoir autoPlayEnabled en prop |

---

## Architecture

```text
Index.tsx
    └── HeroSection.tsx
            ├── Détecte le scroll (window scroll listener)
            ├── scrollY > 200px → autoPlayEnabled = false
            ├── scrollY < 100px → autoPlayEnabled = true
            └── ScooterCarousel.tsx
                    └── Reçoit autoPlayEnabled en prop
                    └── Désactive l'intervalle auto-play si false
```

---

## 1. HeroSection.tsx - Détection du Scroll

**Nouveaux States et Effect** :

```typescript
import { useState, useMemo, useEffect, useCallback } from "react";

const HeroSection = ({ onActiveModelChange }: HeroSectionProps) => {
  // ... existing states ...
  
  // Auto-play control based on scroll position
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);

  // Scroll detection effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      if (scrollY > 200 && autoPlayEnabled) {
        // User scrolled down - disable auto-play
        setAutoPlayEnabled(false);
      } else if (scrollY < 100 && !autoPlayEnabled) {
        // User scrolled back to top - re-enable auto-play
        setAutoPlayEnabled(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [autoPlayEnabled]);

  // ... rest of component ...
};
```

**Passer la prop au ScooterCarousel** :

```typescript
<ScooterCarousel
  models={filteredModels}
  activeIndex={activeIndex}
  onSelect={setActiveIndex}
  onNavigatePrev={() => setActiveIndex((prev) => (prev > 0 ? prev - 1 : filteredModels.length - 1))}
  onNavigateNext={() => setActiveIndex((prev) => (prev < filteredModels.length - 1 ? prev + 1 : 0))}
  totalModels={filteredModels.length}
  currentIndex={activeIndex}
  autoPlayEnabled={autoPlayEnabled}  // NEW PROP
/>
```

---

## 2. ScooterCarousel.tsx - Recevoir et Utiliser autoPlayEnabled

**Interface Props Mise à Jour** :

```typescript
interface ScooterCarouselProps {
  models: ScooterModel[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  totalModels?: number;
  currentIndex?: number;
  autoPlayEnabled?: boolean;  // NEW PROP - default true
}
```

**Destructurer la Prop** :

```typescript
const ScooterCarousel = ({ 
  models, 
  activeIndex, 
  onSelect,
  onNavigatePrev,
  onNavigateNext,
  totalModels = 0,
  currentIndex = 0,
  autoPlayEnabled = true,  // Default to true
}: ScooterCarouselProps) => {
```

**Modifier l'Effect Auto-play** :

L'effect actuel (lignes 196-213) :

```typescript
// AVANT
useEffect(() => {
  if (isHovered || models.length <= 1) {
    return;
  }
  
  const startTime = Date.now();
  const interval = setInterval(() => {
    // ...
  }, 50);
  
  return () => clearInterval(interval);
}, [isHovered, models.length, scrollNext, activeIndex]);
```

Devient :

```typescript
// APRÈS
useEffect(() => {
  // Disable auto-play if:
  // - User hovers the carousel
  // - Only one model
  // - Auto-play disabled by scroll
  if (isHovered || models.length <= 1 || !autoPlayEnabled) {
    setAutoPlayProgress(0); // Reset progress when disabled
    return;
  }
  
  const startTime = Date.now();
  const interval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / autoPlayDuration, 1);
    setAutoPlayProgress(progress);
    
    if (progress >= 1) {
      scrollNext();
    }
  }, 50);
  
  return () => clearInterval(interval);
}, [isHovered, models.length, scrollNext, activeIndex, autoPlayEnabled]);
```

**Modifier le CircularProgress (Feedback Visuel)** :

Le composant affiche déjà un état "paused" quand `isHovered` est true. On peut étendre ce comportement :

```typescript
<CircularProgress 
  duration={autoPlayDuration} 
  isPaused={isHovered || !autoPlayEnabled}  // Paused if hover OR scroll disabled
  progress={autoPlayProgress}
/>
```

---

## 3. Comportement UX Final

| Situation | Auto-play | Feedback Visuel |
|-----------|-----------|-----------------|
| Page chargée, scroll = 0 | ACTIF | Progress circulaire anime |
| Hover sur carousel | PAUSE | Icône Play visible |
| Scroll > 200px | DÉSACTIVÉ | Icône Play visible, progress = 0 |
| Retour scroll < 100px | RÉACTIVÉ | Progress reprend |
| Navigation manuelle (flèches) | Toujours possible | Progress reset à 0 |

---

## 4. Optimisation Performance

**Throttle optionnel pour le scroll listener** :

Si nécessaire pour les performances, on peut throttler :

```typescript
useEffect(() => {
  let ticking = false;
  
  const handleScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        
        if (scrollY > 200 && autoPlayEnabled) {
          setAutoPlayEnabled(false);
        } else if (scrollY < 100 && !autoPlayEnabled) {
          setAutoPlayEnabled(true);
        }
        
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, [autoPlayEnabled]);
```

---

## Résultat Attendu

1. **Au chargement** : Auto-play actif (5s par slide), animation visible
2. **Scroll vers le bas (> 200px)** : Auto-play désactivé silencieusement
3. **Consultation des pièces** : L'utilisateur garde le contrôle, pas de changement surprise
4. **Navigation manuelle** : Toujours disponible via flèches
5. **Retour en haut (< 100px)** : Auto-play se réactive pour capter l'attention
6. **Feedback visuel** : L'indicateur circulaire montre l'état (actif/pause)

