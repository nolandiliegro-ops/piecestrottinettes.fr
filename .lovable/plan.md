

# Corrections Critiques : Carrousel Intelligent + Quick View Modal

## Diagnostic des Problemes

### Probleme 1 : Modal Coupee sur les Cotes
**Cause identifiee** : La modal utilise `z-index: 50` ce qui peut etre insuffisant selon le contexte. Le positionnement est correct (`fixed inset-0 flex items-center justify-center`) mais le composant `QuickViewModal` est rendu **a l'interieur** de chaque `GamingCarouselCard`, ce qui peut causer des problemes de stacking context.

**Solution** : Remonter la modal au niveau du `GamingCarousel` et augmenter le z-index a 9999.

---

### Probleme 2 : Navigation Unidirectionnelle
**Cause identifiee** : Le code Embla semble correct avec `loop: true`, mais la configuration actuelle avec `containScroll: false` peut causer des comportements inattendus. Les fleches `scrollPrev` et `scrollNext` sont bien implementees.

**Verification** : Le probleme pourrait venir de l'interaction entre le scroll et le clic sur les cartes.

---

### Probleme 3 : Clic sur Produit Lateral = Redirection (BUG CRITIQUE)
**Cause identifiee dans GamingCarouselCard.tsx** :
- Ligne 181 : `onClick={handleClick}` sur le container principal → navigue **toujours** vers `/piece/{slug}`
- Ligne 88-95 : `handleImageClick` intercepte le clic sur l'image, mais le container parent capte aussi le clic

```text
FLUX ACTUEL (BUGUE)
+-----------------------------------+
|  <motion.div onClick={handleClick}  |  ← Capte TOUS les clics
|                                     |
|    <motion.div onClick={handleImageClick}  |  ← Capte le clic image
|                                     |
+-----------------------------------+
```

Le `handleClick` du container parent est toujours execute car le `stopPropagation` dans `handleImageClick` ne l'empeche pas quand on clique ailleurs sur la carte.

---

## Architecture de la Solution

```text
AVANT                                    APRES
+----------------------------------+     +----------------------------------+
| GamingCarousel                   |     | GamingCarousel                   |
|   +----------------------------+ |     |   +----------------------------+ |
|   | GamingCarouselCard #1      | |     |   | GamingCarouselCard #1      | |
|   |   <QuickViewModal />       | |     |   | (pas de modal ici)         | |
|   +----------------------------+ |     |   +----------------------------+ |
|   | GamingCarouselCard #2      | |     |   | GamingCarouselCard #2      | |
|   |   <QuickViewModal />       | |     |   | (pas de modal ici)         | |
|   +----------------------------+ |     |   +----------------------------+ |
|                                  |     |   <QuickViewModal />            |
|                                  |     |   (UNE seule modal partagee)    |
+----------------------------------+     +----------------------------------+
```

---

## Modifications Fichier par Fichier

### 1. `GamingCarousel.tsx` - Refactorisation Majeure

#### 1.1 Ajouter un state pour la modal partagee
```typescript
const [selectedPart, setSelectedPart] = useState<Part | null>(null);
const [showQuickView, setShowQuickView] = useState(false);
```

#### 1.2 Creer un handler pour le clic sur les cartes
```typescript
const handleCardClick = useCallback((index: number, part: Part) => {
  if (index === selectedIndex) {
    // Produit central : ouvre la modal
    setSelectedPart(part);
    setShowQuickView(true);
  } else {
    // Produit lateral : centre ce produit
    emblaApi?.scrollTo(index);
  }
}, [emblaApi, selectedIndex]);
```

#### 1.3 Passer le handler aux cartes
```typescript
<GamingCarouselCard 
  part={part} 
  isCenter={wrappedDistance === 0} 
  distanceFromCenter={wrappedDistance} 
  index={index}
  onCardClick={handleCardClick}  // NOUVEAU
  onQuickView={() => {           // NOUVEAU
    setSelectedPart(part);
    setShowQuickView(true);
  }}
/>
```

#### 1.4 Ajouter la modal partagee a la fin du composant
```typescript
{/* Quick View Modal - Une seule instance partagee */}
{selectedPart && (
  <QuickViewModal 
    part={selectedPart}
    isOpen={showQuickView}
    onClose={() => {
      setShowQuickView(false);
      setSelectedPart(null);
    }}
  />
)}
```

---

### 2. `GamingCarouselCard.tsx` - Simplification

#### 2.1 Modifier l'interface des props
```typescript
interface GamingCarouselCardProps {
  part: Part;
  isCenter: boolean;
  distanceFromCenter: number;
  index: number;
  onCardClick: (index: number, part: Part) => void;  // NOUVEAU
  onQuickView: () => void;                           // NOUVEAU
}
```

#### 2.2 Supprimer la modal interne
Retirer completement l'import et le rendu de `QuickViewModal` dans ce composant.

#### 2.3 Modifier le handler du container
```typescript
// AVANT
onClick={handleClick}

// APRES
onClick={(e) => {
  e.stopPropagation();
  onCardClick(index, part);
}}
```

#### 2.4 Modifier le handler de l'image
```typescript
const handleImageClick = (e: React.MouseEvent) => {
  e.stopPropagation();
  if (isCenter) {
    onQuickView();
  } else {
    onCardClick(index, part);
  }
};
```

#### 2.5 Modifier le handler de l'icone oeil
```typescript
onClick={(e) => {
  e.stopPropagation();
  onQuickView();
}}
```

---

### 3. `QuickViewModal.tsx` - Amelioration du z-index

#### 3.1 Augmenter le z-index
```typescript
// AVANT (ligne 87)
className="fixed inset-0 z-50"

// APRES
className="fixed inset-0 z-[9999]"
```

```typescript
// AVANT (ligne 101)
className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"

// APRES
className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
```

---

## Flux d'Interaction Final

```text
UTILISATEUR CLIQUE SUR LE CARROUSEL
                |
        +-------+-------+
        |               |
        v               v
   PRODUIT           PRODUIT
   LATERAL           CENTRAL
        |               |
        v               |
  emblaApi.scrollTo     +-------+-------+
  (centre ce produit)   |       |       |
        |               v       v       v
        |            PHOTO   OEIL    AUTRE
        |               |       |       |
        v               v       v       v
   PRODUIT           MODAL   MODAL   MODAL
   CENTRE              ↓       ↓       ↓
                    (meme modal partagee)
```

---

## Resume des Fichiers a Modifier

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/components/showcase/GamingCarousel.tsx` | MODIFIER | Ajouter state modal + handler clic intelligent + modal partagee |
| `src/components/showcase/GamingCarouselCard.tsx` | MODIFIER | Supprimer modal interne + accepter callbacks + simplifier handlers |
| `src/components/showcase/QuickViewModal.tsx` | MODIFIER | Augmenter z-index a 9999 |

---

## Checklist de Validation

- Modal toujours centree a l'ecran (jamais coupee) grace au z-index 9999
- Fleches gauche/droite fonctionnent dans les deux sens (deja OK)
- Swipe tactile fonctionne (Embla gere nativement)
- Clic sur produit lateral → Centre ce produit dans le carrousel
- Clic sur produit central (photo/oeil/carte) → Ouvre la Quick View Modal
- Clic sur "Ajouter au panier" (modal) → Toast + Ferme la modal
- Clic sur "Voir la fiche complete" (modal) → Redirige vers /piece/slug
- Clic sur backdrop/X/ESC → Ferme la modal
- Produits lateraux semi-transparents (opacity 0.6-0.8)
- Produit central mis en avant (scale 1.6, opacity 1)
- Plus de redirection directe depuis les cartes du carrousel

