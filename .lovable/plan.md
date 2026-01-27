
# GamingShowcase - Carrousel Spectaculaire Style Jeu Vidéo

## Résumé

Remplacement du carrousel Premium classique par un showcase immersif style jeu vidéo où chaque pièce devient LA STAR sur fond noir avec effets spectaculaires : spotlight radial, rotation 3D, glow pulsant, grille néon en arrière-plan, et navigation XXL futuriste.

---

## Fichiers à Créer / Modifier

| Fichier | Action |
|---------|--------|
| `src/components/showcase/GamingShowcase.tsx` | CRÉER - Composant principal showcase |
| `src/components/showcase/GamingProductCard.tsx` | CRÉER - Card produit spectaculaire plein écran |
| `src/components/showcase/GamingThumbnails.tsx` | CRÉER - Miniatures navigation en bas |
| `src/components/showcase/GamingStatBar.tsx` | CRÉER - Barre de stats style gaming |
| `src/components/CompatiblePartsSection.tsx` | MODIFIER - Utiliser GamingShowcase |
| `src/index.css` | MODIFIER - Ajouter styles gaming néon |

---

## Architecture du Showcase

```text
+------------------------------------------------------------------+
|                    FOND NOIR + GRILLE NÉON                        |
|                                                                    |
|  [◀]                                                        [▶]   |
|  XXL                     ★ IMAGE 500x500 ★                   XXL  |
|                          SPOTLIGHT RADIAL                          |
|                          GLOW PULSANT                              |
|                          ROTATION 3D HOVER                         |
|                                                                    |
|                    PNEU TUBELESS 10x2.5                           |
|                        49.99 €  [GLOW]                            |
|                                                                    |
|     [████████████ QUALITÉ ████████████] 95%                       |
|     [██████████ COMPATIBILITÉ ██████████] 100%                    |
|     [████████ DURABILITÉ ████████] 85%                            |
|                                                                    |
|                   [ ACHETER MAINTENANT ]                          |
|                                                                    |
|           [○] [○] [●] [○] [○] [○] [○]                            |
|           60x60 miniatures avec glow actif                         |
+------------------------------------------------------------------+
```

---

## 1. GamingShowcase.tsx - Composant Principal

**Props Interface** :

```typescript
interface GamingShowcaseProps {
  parts: CompatiblePart[];
  activeModelName?: string;
  isLoading?: boolean;
}
```

**Structure du Composant** :

- Container plein largeur avec fond noir/gradient
- Zone centrale pour le produit actif (un seul visible)
- Flèches de navigation XXL (80x80px) style futuriste
- Miniatures en bas (5 visibles, 60x60px)
- Transition spectaculaire entre produits

**Fond Spectaculaire** :

```typescript
style={{
  background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)",
  minHeight: "600px",
  position: "relative",
  overflow: "hidden",
}}
```

**Grille Néon en Arrière-plan** :

```css
.gaming-grid-bg {
  background-image: 
    linear-gradient(rgba(147, 181, 161, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(147, 181, 161, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  animation: gridPulse 4s ease-in-out infinite;
}

@keyframes gridPulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}
```

---

## 2. GamingProductCard.tsx - Showcase Plein Écran

**Image STAR - 500x500px** :

```typescript
<motion.div
  className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] lg:w-[500px] lg:h-[500px] mx-auto"
  initial={{ scale: 0.8, opacity: 0 }}
  animate={{ 
    scale: 1, 
    opacity: 1,
    rotateY: [0, 2, 0, -2, 0], // Rotation subtile continue
  }}
  transition={{ 
    scale: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] },
    rotateY: { duration: 6, repeat: Infinity, ease: "easeInOut" }
  }}
  whileHover={{ 
    rotateY: 15,
    scale: 1.05,
  }}
>
```

**Spotlight Radial** :

```typescript
// Derrière l'image
<div 
  className="absolute inset-0 -z-10"
  style={{
    background: "radial-gradient(circle at 50% 50%, rgba(147, 181, 161, 0.3) 0%, rgba(147, 181, 161, 0.1) 30%, transparent 70%)",
    filter: "blur(60px)",
  }}
/>
```

**Glow Pulsant** :

```css
@keyframes glowPulse {
  0%, 100% {
    filter: drop-shadow(0 0 20px rgba(147, 181, 161, 0.4));
  }
  50% {
    filter: drop-shadow(0 0 40px rgba(147, 181, 161, 0.8));
  }
}

.gaming-product-glow {
  animation: glowPulse 2s ease-in-out infinite;
}
```

**Animation d'Entrée "Legendary Item"** :

```typescript
// Flash blanc au changement de produit
<motion.div
  key={currentIndex}
  initial={{ opacity: 1, scale: 1.5 }}
  animate={{ opacity: 0, scale: 2 }}
  transition={{ duration: 0.3 }}
  className="absolute inset-0 bg-white/30 rounded-full pointer-events-none"
/>
```

---

## 3. Informations Style Gaming

**Titre du Produit** :

```typescript
<motion.h2
  className="text-white text-2xl md:text-3xl lg:text-4xl font-bold text-center uppercase tracking-wider"
  style={{ 
    textShadow: "0 0 20px rgba(255,255,255,0.3)",
    fontWeight: 800,
  }}
>
  {part.name}
</motion.h2>
```

**Prix avec Glow** :

```typescript
<motion.div
  className="text-4xl md:text-5xl lg:text-6xl font-black text-center"
  style={{
    color: "#93B5A1",
    textShadow: "0 0 30px rgba(147, 181, 161, 0.6), 0 0 60px rgba(147, 181, 161, 0.3)",
  }}
  animate={{
    textShadow: [
      "0 0 30px rgba(147, 181, 161, 0.6)",
      "0 0 50px rgba(147, 181, 161, 0.9)",
      "0 0 30px rgba(147, 181, 161, 0.6)",
    ]
  }}
  transition={{ duration: 2, repeat: Infinity }}
>
  {formatPrice(part.price)}
</motion.div>
```

**Badge COMPATIBLE - Style Hexagonal Néon** :

```typescript
<div 
  className="inline-flex items-center gap-2 px-4 py-2"
  style={{
    background: "rgba(147, 181, 161, 0.15)",
    border: "1px solid rgba(147, 181, 161, 0.5)",
    clipPath: "polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)", // Hexagonal
    boxShadow: "0 0 20px rgba(147, 181, 161, 0.3), inset 0 0 20px rgba(147, 181, 161, 0.1)",
  }}
>
  <ShieldCheck className="w-5 h-5 text-mineral" />
  <span className="text-mineral font-bold uppercase tracking-wider">
    100% Compatible
  </span>
</div>
```

---

## 4. GamingStatBar.tsx - Barres de Progression

**Stats Affichées** :

| Stat | Valeur | Description |
|------|--------|-------------|
| Qualité | 85-100% | Basé sur note ou par défaut |
| Compatibilité | 100% | Toujours 100% car filtré |
| Durabilité | 70-95% | Basé sur technical_metadata ou par défaut |

**Style des Barres** :

```typescript
<div className="space-y-3 max-w-md mx-auto">
  {stats.map((stat) => (
    <div key={stat.name} className="flex items-center gap-4">
      <span className="text-white/70 text-sm uppercase tracking-wider w-32">
        {stat.name}
      </span>
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, #93B5A1 0%, #a8c5b3 100%)",
            boxShadow: "0 0 10px rgba(147, 181, 161, 0.5)",
          }}
          initial={{ width: 0 }}
          animate={{ width: `${stat.value}%` }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
        />
      </div>
      <span className="text-mineral font-bold w-12 text-right">
        {stat.value}%
      </span>
    </div>
  ))}
</div>
```

---

## 5. Navigation Flèches XXL

**Style Futuriste** :

```typescript
<motion.button
  onClick={goToPrev}
  className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20"
  whileHover={{ scale: 1.1 }}
  whileTap={{ scale: 0.95 }}
>
  <div 
    className="w-16 h-16 lg:w-20 lg:h-20 flex items-center justify-center"
    style={{
      background: "rgba(147, 181, 161, 0.1)",
      border: "2px solid rgba(147, 181, 161, 0.4)",
      borderRadius: "50%",
      boxShadow: "0 0 20px rgba(147, 181, 161, 0.2), inset 0 0 20px rgba(147, 181, 161, 0.1)",
    }}
  >
    <ChevronLeft className="w-8 h-8 lg:w-10 lg:h-10 text-mineral" />
  </div>
</motion.button>
```

**Hover Effect** :

```typescript
whileHover={{
  scale: 1.1,
  boxShadow: "0 0 40px rgba(147, 181, 161, 0.6)",
}}
```

---

## 6. GamingThumbnails.tsx - Miniatures

**Layout** :

- 5 miniatures visibles (60x60px)
- Centrées en bas
- Scroll horizontal si plus de 5

**Style Miniature Active vs Inactive** :

```typescript
// Inactive
style={{
  background: "rgba(255, 255, 255, 0.05)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "8px",
}}

// Active
style={{
  background: "rgba(147, 181, 161, 0.2)",
  border: "2px solid rgba(147, 181, 161, 0.8)",
  borderRadius: "8px",
  boxShadow: "0 0 20px rgba(147, 181, 161, 0.5)",
}}
```

---

## 7. Bouton ACHETER - Style Gaming

```typescript
<motion.button
  className="px-8 py-4 font-bold text-lg uppercase tracking-wider"
  style={{
    background: "linear-gradient(135deg, #93B5A1 0%, #7da38d 100%)",
    border: "none",
    borderRadius: "8px",
    color: "#0a0a0a",
    boxShadow: "0 0 30px rgba(147, 181, 161, 0.4), 0 4px 20px rgba(0,0,0,0.3)",
  }}
  whileHover={{
    scale: 1.05,
    boxShadow: "0 0 50px rgba(147, 181, 161, 0.8), 0 8px 30px rgba(0,0,0,0.4)",
  }}
  whileTap={{ scale: 0.98 }}
>
  ACHETER MAINTENANT
</motion.button>
```

---

## 8. Animations de Transition

**Changement de Produit** :

```typescript
<AnimatePresence mode="wait">
  <motion.div
    key={currentIndex}
    initial={{ opacity: 0, scale: 0.8, x: direction > 0 ? 100 : -100 }}
    animate={{ opacity: 1, scale: 1, x: 0 }}
    exit={{ opacity: 0, scale: 0.8, x: direction > 0 ? -100 : 100 }}
    transition={{ 
      duration: 0.6, 
      ease: [0.25, 0.46, 0.45, 0.94] 
    }}
  >
    <GamingProductCard part={parts[currentIndex]} />
  </motion.div>
</AnimatePresence>
```

---

## 9. CSS Gaming - index.css

```css
/* Gaming Showcase Styles */
.gaming-showcase-container {
  perspective: 2000px;
}

/* Grille Néon Background */
.gaming-grid-bg {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(147, 181, 161, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(147, 181, 161, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  animation: gridPulse 4s ease-in-out infinite;
}

@keyframes gridPulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

/* Glow Pulsant sur Image */
.gaming-product-glow {
  animation: productGlow 2s ease-in-out infinite;
}

@keyframes productGlow {
  0%, 100% {
    filter: drop-shadow(0 0 20px rgba(147, 181, 161, 0.4));
  }
  50% {
    filter: drop-shadow(0 0 40px rgba(147, 181, 161, 0.8));
  }
}

/* Rayons Lumineux */
.gaming-light-rays {
  position: absolute;
  inset: 0;
  background: conic-gradient(
    from 0deg at 50% 50%,
    transparent 0deg,
    rgba(147, 181, 161, 0.05) 10deg,
    transparent 20deg,
    transparent 90deg,
    rgba(147, 181, 161, 0.05) 100deg,
    transparent 110deg,
    transparent 180deg,
    rgba(147, 181, 161, 0.05) 190deg,
    transparent 200deg,
    transparent 270deg,
    rgba(147, 181, 161, 0.05) 280deg,
    transparent 290deg
  );
  animation: raysSpin 20s linear infinite;
}

@keyframes raysSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Navigation Arrows Glow */
.gaming-nav-btn:hover {
  box-shadow: 0 0 40px rgba(147, 181, 161, 0.6);
}
```

---

## 10. Responsive Breakpoints

| Élément | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Image produit | 300x300px | 400x400px | 500x500px |
| Titre | 24px | 28px | 36px |
| Prix | 36px | 48px | 56px |
| Flèches nav | 64x64px | 72x72px | 80x80px |
| Miniatures | 50x50px | 55x55px | 60x60px |
| Container height | 500px | 550px | 650px |

---

## 11. Modifications CompatiblePartsSection.tsx

Remplacer le PremiumCarousel par GamingShowcase :

```typescript
import GamingShowcase from "./showcase/GamingShowcase";

// Dans le JSX
{isLoading ? (
  <GamingShowcaseSkeleton />
) : parts.length > 0 ? (
  <GamingShowcase 
    parts={parts}
    activeModelName={activeModelName}
  />
) : (
  <EmptyState />
)}
```

---

## Résumé des Effets Visuels

| Effet | Animation | Durée |
|-------|-----------|-------|
| Grille néon background | Pulse opacity | 4s infinite |
| Glow pulsant image | Drop-shadow pulse | 2s infinite |
| Rotation subtile image | rotateY 2deg | 6s infinite |
| Flash "Legendary" | White flash on change | 0.3s |
| Rayons lumineux | Rotation lente | 20s infinite |
| Prix glow | Text-shadow pulse | 2s infinite |
| Transition produits | Slide + Scale | 0.6s |

---

## Résultat Attendu

1. **Immersion totale** : Fond noir, grille néon, effets lumineux
2. **Produit en STAR** : Image 500x500px avec spotlight et glow pulsant
3. **UI Gaming** : Stats barres, badge hexagonal, bouton néon
4. **Navigation futuriste** : Flèches XXL avec glow hover
5. **Transitions spectaculaires** : Slide + flash + scale
6. **Responsive parfait** : Adapté mobile avec tailles réduites
