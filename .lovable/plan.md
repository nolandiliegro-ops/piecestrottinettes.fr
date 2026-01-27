

# Amplification des Animations du Carrousel Scooter

## Résumé

Les animations actuelles sont trop subtiles. Ce plan amplifie significativement toutes les animations pour un effet visuel beaucoup plus impressionnant et dynamique.

## Modifications Détaillées

### Fichier : `src/components/hero/ScooterCarousel.tsx`

---

### 1. Transitions Entre Slides - Plus Longues et Visibles

**Lignes 59-62** : Modifier `premiumTransition`

```typescript
// AVANT
const premiumTransition = {
  duration: 0.8,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
};

// APRÈS - Durée 1s, effet plus dramatique
const premiumTransition = {
  duration: 1,
  ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number], // easeOutQuart - plus fluide
};
```

---

### 2. Animations Stagger des Specs - Plus Visibles

**Lignes 29-56** : Modifier les variants avec slide de 80px et bounce très visible

```typescript
// AVANT
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
  hidden: { opacity: 0, x: 20, scale: 0.95 },
  visible: { 
    opacity: 1, x: 0, scale: 1,
    transition: { type: "spring" as const, damping: 15, stiffness: 200 }
  }
};

// APRÈS - Slide de 80px, délai de 0.2s entre chaque, bounce TRÈS visible
const specsContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2, // 0.2s entre chaque (au lieu de 0.1s)
      delayChildren: 0.4,   // Délai initial plus long
    }
  }
};

const specItemVariants = {
  hidden: { 
    opacity: 0, 
    x: 80,        // 80px au lieu de 20px - TRÈS visible
    scale: 0.8    // Plus petit pour effet plus dramatique
  },
  visible: { 
    opacity: 1, 
    x: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      damping: 8,       // Moins amorti = plus de bounce (au lieu de 15)
      stiffness: 120,   // Moins rigide = bounce plus long (au lieu de 200)
      mass: 1.2,        // Plus lourd = effet de rebond plus visible
    }
  }
};
```

---

### 3. Effet Parallax Scooter - Déplacement de 100px

**Lignes 574-589** (Container) et **Lignes 611-626** (Image) : Amplifier le parallax

```typescript
// Container - Lignes 574-589
initial={{ 
  opacity: 0, 
  scale: 0.9,                                    // Plus petit (0.9 au lieu de 0.95)
  x: slideDirection === 'right' ? 100 : -100     // 100px au lieu de 60px
}}
animate={{ 
  opacity: 1, 
  scale: 1,
  x: 0
}}
exit={{ 
  opacity: 0, 
  scale: 0.9,
  x: slideDirection === 'right' ? -80 : 80      // 80px au lieu de 40px
}}

// Image avec parallax - Lignes 611-626
initial={{ 
  x: slideDirection === 'right' ? 150 : -150,   // 150px au lieu de 80px
  opacity: 0,
  scale: 0.95                                    // Ajout scale
}}
animate={{ 
  x: 0,
  opacity: 1,
  scale: 1
}}
exit={{ 
  x: slideDirection === 'right' ? -100 : 100,   // 100px au lieu de 50px
  opacity: 0,
  scale: 0.95
}}
transition={{ 
  duration: 1.2,                                 // Plus lent que container = PARALLAX
  ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
}}
```

---

### 4. Indicateurs de Navigation - Scale 1.5x et Glow Intense

**Lignes 482-502** : Amplifier hover et glow

```typescript
// AVANT
whileHover={{ scale: 1.2 }}
whileTap={{ scale: 0.9 }}
animate={{
  boxShadow: isActive 
    ? "0 0 20px hsl(var(--mineral) / 0.6)" 
    : "0 0 0px transparent"
}}
transition={{ duration: 0.3 }}

// APRÈS - Scale 1.5x, glow TRÈS visible
whileHover={{ scale: 1.5 }}    // 1.5 au lieu de 1.2
whileTap={{ scale: 0.85 }}     // Plus petit au clic
animate={{
  scale: isActive ? 1.1 : 1,   // Actif légèrement plus grand
  boxShadow: isActive 
    ? "0 0 30px 8px hsl(var(--mineral) / 0.7), 0 0 60px 16px hsl(var(--mineral) / 0.3)" 
    : "0 0 0px transparent"    // Double glow - interne + externe
}}
transition={{ 
  duration: 0.3,
  type: "spring",
  stiffness: 300,
  damping: 15
}}
```

---

### 5. Indicateur de Progression Circulaire - Plus Grand et Visible

**Lignes 75-106** : Agrandir le cercle et améliorer le style

```typescript
// AVANT
<div className="relative w-8 h-8 lg:w-10 lg:h-10">

// APRÈS - Plus grand
<div className="relative w-10 h-10 lg:w-14 lg:h-14">

// Modifier strokeWidth et ajouter glow
<circle
  ...
  strokeWidth="3"              // 3 au lieu de 2
/>
<motion.circle
  ...
  strokeWidth="3"
  style={{ 
    transformOrigin: "center",
    filter: "drop-shadow(0 0 6px hsl(var(--mineral) / 0.8))"  // Glow effect
  }}
/>

// Icons plus grands
<Play className="w-4 h-4 lg:w-5 lg:h-5 text-mineral" />      // Plus grand
<Pause className="w-4 h-4 lg:w-5 lg:h-5 text-mineral/60" />  // Plus grand + plus visible
```

---

### 6. Flèches de Navigation - Plus Réactives

**Lignes 289-302 et 305-318** : Amplifier les animations des flèches

```typescript
// AVANT
whileHover={{ scale: 1.1 }}
whileTap={{ scale: 0.9 }}

// APRÈS - Plus réactives avec rotation subtile
whileHover={{ 
  scale: 1.2, 
  rotate: -5,                   // Légère rotation
  boxShadow: "0 8px 25px rgba(147,181,161,0.4)"
}}
whileTap={{ 
  scale: 0.85,
  rotate: 0
}}
transition={{ type: "spring", stiffness: 400, damping: 17 }}
```

---

## Résumé des Changements

| Élément | Avant | Après |
|---------|-------|-------|
| Transition slide | 0.8s | **1s** |
| Slide distance (container) | 60px | **100px** |
| Slide distance (image/parallax) | 80px | **150px** |
| Stagger delay specs | 0.1s | **0.2s** |
| Slide specs | 20px | **80px** |
| Spring damping (bounce) | 15 | **8** (plus de rebond) |
| Nav dots hover scale | 1.2x | **1.5x** |
| Nav dots glow | 20px simple | **30px + 60px double** |
| Cercle progression | w-10/h-10 | **w-14/h-14** |

## Résultat Attendu

1. **Transitions dramatiques** : Les slides glissent sur 100px avec un fondu visible
2. **Parallax marqué** : L'image de la trottinette glisse 50% plus lentement que le container
3. **Specs en cascade** : Chaque spec arrive avec 0.2s de décalage et un bounce très visible
4. **Navigation réactive** : Les dots grossissent de 50% au survol avec double glow
5. **Progression visible** : Cercle plus grand avec effet lumineux

