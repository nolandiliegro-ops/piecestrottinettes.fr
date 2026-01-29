

# Quick View Modal Premium - Hub E-commerce Interactif

## Contexte Actuel

Le composant `QuickViewModal.tsx` existe déjà mais nécessite plusieurs améliorations pour atteindre le niveau "Luxury UX" demandé :

```text
ETAT ACTUEL                          OBJECTIF
+---------------------------+        +----------------------------------+
| Modal basique             |   -->  | Modal Premium avec :             |
| - Backdrop blur 8px       |        | - Backdrop blur 12px + plus dark |
| - Pas de description      |        | - Description technique          |
| - Pas de badge compat.    |        | - Badge compatibilité dynamique  |
| - Pas de touche ESC       |        | - Fermeture ESC                  |
| - Clic image = navigation |        | - Clic image = Quick View        |
+---------------------------+        +----------------------------------+
```

---

## Modifications Requises

### 1. Fichier : `src/components/showcase/GamingCarouselCard.tsx`

**Probleme actuel** : Le clic sur l'image declenche `handleClick()` qui navigue vers `/piece/{slug}`.

**Solution** : Modifier le comportement du clic sur l'image pour ouvrir la Quick View au lieu de naviguer.

```typescript
// AVANT (ligne 170)
onClick={handleClick}

// APRES - Intercepter le clic image pour ouvrir Quick View
const handleImageClick = (e: React.MouseEvent) => {
  e.stopPropagation();
  if (isCenter) {
    setShowQuickView(true);
  } else {
    // Pour les cartes non-centrales, on pourrait scroller vers elles
    // ou les laisser naviguer
    handleClick();
  }
};
```

**Nouveau handler pour container** : Le container principal ne doit plus naviguer directement sur clic.

---

### 2. Fichier : `src/components/showcase/QuickViewModal.tsx`

**Ameliorations a apporter** :

#### 2.1 Interface Part etendue

Ajouter le champ `description` a l'interface Part :

```typescript
interface Part {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  image_url: string | null;
  stock_quantity: number | null;
  difficulty_level: number | null;
  description?: string | null;  // NOUVEAU
}
```

#### 2.2 Props etendues pour compatibilite

Ajouter la possibilite de recevoir les infos de compatibilite :

```typescript
interface QuickViewModalProps {
  part: Part;
  isOpen: boolean;
  onClose: () => void;
  isCompatible?: boolean;           // NOUVEAU
  selectedScooterName?: string;     // NOUVEAU
}
```

#### 2.3 Backdrop ameliore

Augmenter le blur et assombrir le fond :

```typescript
// AVANT
background: "rgba(26, 26, 26, 0.4)",
backdropFilter: "blur(8px)",

// APRES
background: "rgba(0, 0, 0, 0.6)",
backdropFilter: "blur(12px)",
```

#### 2.4 Fermeture avec touche ESC

Ajouter un `useEffect` pour ecouter la touche Escape :

```typescript
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  };
  
  document.addEventListener('keydown', handleEscape);
  return () => document.removeEventListener('keydown', handleEscape);
}, [isOpen, onClose]);
```

#### 2.5 Section Description technique

Ajouter entre le prix et la difficulte :

```typescript
{/* Description technique */}
{part.description && (
  <p className="text-sm text-carbon/70 leading-relaxed line-clamp-3">
    {part.description}
  </p>
)}
```

#### 2.6 Badge de compatibilite

Ajouter avant le CTA :

```typescript
{/* Badge Compatibilite */}
{isCompatible && selectedScooterName && (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.22, duration: 0.4 }}
    className="flex items-center gap-2 px-4 py-3 rounded-xl"
    style={{
      background: "rgba(34, 197, 94, 0.1)",
      border: "1px solid rgba(34, 197, 94, 0.2)",
    }}
  >
    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
    <span className="text-sm font-medium text-green-700">
      Compatible avec votre {selectedScooterName}
    </span>
  </motion.div>
)}
```

#### 2.7 Largeur augmentee

Passer de `max-w-3xl` (768px) a `max-w-4xl` (900px) :

```typescript
// AVANT
className="relative w-full max-w-3xl pointer-events-auto rounded-3xl overflow-hidden"

// APRES
className="relative w-full max-w-4xl pointer-events-auto rounded-3xl overflow-hidden"
```

#### 2.8 Image plus grande

Augmenter le padding et la taille de l'image :

```typescript
// AVANT
<div className="relative aspect-square bg-greige flex items-center justify-center p-8">

// APRES - Fond plus clair, padding ajuste
<div 
  className="relative aspect-square flex items-center justify-center p-10"
  style={{ background: "#F9F9F7" }}
>
```

#### 2.9 Responsive Mobile

Ajouter des classes responsives pour le layout 1 colonne sur mobile :

```typescript
// AVANT
<div className="grid md:grid-cols-2 gap-0">

// APRES - Stack sur mobile, side-by-side sur desktop
<div className="grid grid-cols-1 md:grid-cols-2 gap-0">
```

Et ajuster le padding sur mobile :

```typescript
// AVANT
<div className="p-8 flex flex-col justify-center space-y-6">

// APRES
<div className="p-6 md:p-8 lg:p-10 flex flex-col justify-center space-y-5 md:space-y-6">
```

---

### 3. Integration dans GamingCarouselCard

Passer les props de compatibilite a la modal :

```typescript
// AVANT
<QuickViewModal 
  part={part}
  isOpen={showQuickView}
  onClose={() => setShowQuickView(false)}
/>

// APRES
<QuickViewModal 
  part={part}
  isOpen={showQuickView}
  onClose={() => setShowQuickView(false)}
  isCompatible={isCompatible}
  selectedScooterName={selectedScooter?.name}
/>
```

---

### 4. Enrichir l'interface Part dans GamingCarouselCard

Ajouter `description` a l'interface Part dans `GamingCarouselCard.tsx` :

```typescript
interface Part {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  image_url: string | null;
  stock_quantity: number | null;
  difficulty_level: number | null;
  description?: string | null;  // NOUVEAU
}
```

---

### 5. Enrichir l'interface Part dans GamingCarousel

Meme modification dans `GamingCarousel.tsx` :

```typescript
interface Part {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  image_url: string | null;
  stock_quantity: number | null;
  difficulty_level: number | null;
  description?: string | null;  // NOUVEAU
}
```

---

### 6. S'assurer que la description est chargee

Verifier que le hook qui charge les parts inclut la description. Si les donnees sont chargees dans `CompatiblePartsSection.tsx`, s'assurer que la requete Supabase inclut le champ `description`.

---

## Structure Finale de la Modal

```text
+------------------------------------------------------------------+
|                    BACKDROP BLUR (12px)                          |
|                    background: rgba(0,0,0,0.6)                   |
|                                                                  |
|  +------------------------------------------------------------+  |
|  |                                                      [X]   |  |
|  |                                                            |  |
|  |  +------------------------+  +---------------------------+ |  |
|  |  |                        |  |                           | |  |
|  |  |                        |  |  NOM DU PRODUIT           | |  |
|  |  |     IMAGE PRODUIT      |  |  (24px, font-semibold)    | |  |
|  |  |     (Grande, HD)       |  |                           | |  |
|  |  |                        |  |  35.00 EUR                | |  |
|  |  |   fond: #F9F9F7        |  |  (32px, font-extrabold,   | |  |
|  |  |                        |  |   couleur mineral)        | |  |
|  |  |                        |  |                           | |  |
|  |  +------------------------+  |  Description technique... | |  |
|  |                              |  (14px, 3 lignes max)     | |  |
|  |                              |                           | |  |
|  |                              |  +----------------------+  | |  |
|  |                              |  | [LED] Compatible     |  | |  |
|  |                              |  | avec votre Ninebot   |  | |  |
|  |                              |  +----------------------+  | |  |
|  |                              |                           | |  |
|  |                              |  Difficulte: [* * * . .]  | |  |
|  |                              |  Stock: En stock (12)     | |  |
|  |                              |                           | |  |
|  |                              |  [AJOUTER AU PANIER]      | |  |
|  |                              |  (btn pleine largeur)     | |  |
|  |                              |                           | |  |
|  |                              |  Voir la fiche complete   | |  |
|  |                              +---------------------------+ |  |
|  +------------------------------------------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
```

---

## Flux d'Interaction Final

```text
UTILISATEUR SURVOLE LE CARROUSEL
            |
            v
    +-------+-------+
    |               |
    v               v
CLIC SUR        CLIC SUR
L'IMAGE         L'ICONE OEIL
    |               |
    +-------+-------+
            |
            v
    OUVERTURE QUICK VIEW MODAL
            |
    +-------+-------+-------+
    |       |       |       |
    v       v       v       v
  CLIC    CLIC    CLIC    TOUCHE
  PANIER  FICHE   BACKDROP  ESC
    |       |       |       |
    v       v       v       v
  TOAST  NAVIGUE  FERME   FERME
  +FERME  /piece/  MODAL   MODAL
```

---

## Resume des Fichiers a Modifier

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/components/showcase/QuickViewModal.tsx` | MODIFIER | Ajouter description, badge compat, ESC, backdrop ameliore |
| `src/components/showcase/GamingCarouselCard.tsx` | MODIFIER | Clic image = Quick View, passer props compat a modal |
| `src/components/showcase/GamingCarousel.tsx` | MODIFIER | Ajouter description a interface Part |

---

## Checklist de Validation

- Clic sur la photo du produit central ouvre la modal (pas de redirection)
- Clic sur l'icone oeil ouvre la modal
- La modal affiche : nom, prix, description, badge compat, difficulte, stock
- Le backdrop est floute (12px blur, fond noir 60%)
- Les animations sont fluides (Framer Motion, 0.3s ease-out)
- Le bouton "Ajouter au panier" affiche un toast et ferme la modal
- Le lien "Voir la fiche complete" redirige vers /piece/{slug}
- Le clic sur backdrop ou "X" ferme la modal
- La touche ESC ferme la modal
- Responsive : 1 colonne sur mobile, 2 colonnes sur desktop
- Aucun lien 404 (tous les liens pointent vers /piece/)

