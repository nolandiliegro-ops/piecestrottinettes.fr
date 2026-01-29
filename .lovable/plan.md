

# Transformation du Carrousel en Hub E-commerce Interactif Premium

## Diagnostic Confirme

### Bug 404 Identifie
Le fichier `GamingCarouselCard.tsx` navigue vers `/pieces/${part.slug}` (ligne 61) mais la route definie dans `App.tsx` est `/piece/:slug` (ligne 55 - singulier).

### Architecture Existante
- Le carrousel utilise Embla avec `loop: true` et `align: center`
- Les cartes ont deja des effets de profondeur (scale, opacity, blur)
- Le hook `useCart` et `useFavorites` sont prets a l'emploi
- Les animations CSS `floating-product-center` et `floating-product-image` existent

---

## Vue d'Ensemble de l'Implementation

```text
ARCHITECTURE DES MODIFICATIONS

src/components/showcase/
├── GamingCarousel.tsx        [AMELIORATION MINEURE]
│   └── Ajouter prop onCardClick pour centrer une carte
│
├── GamingCarouselCard.tsx    [REFACTORISATION MAJEURE]
│   ├── Fix 404 : /pieces/ → /piece/
│   ├── Hover Actions Bar (Favori, Apercu, Panier)
│   ├── Bouton "Commander Direct" avec animation
│   └── Integration QuickViewModal
│
└── QuickViewModal.tsx        [NOUVEAU FICHIER]
    └── Modale luxe avec blur backdrop
```

---

## Phase 1 : Correction du Bug 404

### Fichier : `src/components/showcase/GamingCarouselCard.tsx`

Ligne 61 - Modification simple :
```typescript
// AVANT (ligne 61)
navigate(`/pieces/${part.slug}`);

// APRES
navigate(`/piece/${part.slug}`);
```

---

## Phase 2 : UX Interactive Premium

### 2.1 Nouveaux Imports et States

Ajouter en haut du fichier :
```typescript
import { useState } from "react";
import { Heart, Eye, ShoppingCart, Zap, Check, Loader2, Package } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";
```

Ajouter dans le composant :
```typescript
const [isHovered, setIsHovered] = useState(false);
const [isOrdering, setIsOrdering] = useState(false);
const [orderSuccess, setOrderSuccess] = useState(false);
const [showQuickView, setShowQuickView] = useState(false);

const { addItem, setIsOpen } = useCart();
const { isFavorite, toggleFavorite } = useFavorites();
```

### 2.2 Conteneur avec Detection de Hover

Modifier le conteneur principal :
```typescript
<motion.div
  onMouseEnter={() => isCenter && setIsHovered(true)}
  onMouseLeave={() => setIsHovered(false)}
  // ... reste des props existantes
>
```

### 2.3 Barre d'Actions au Survol (Produit Central Uniquement)

Structure visuelle :
```text
+-------------------------------------------------------+
|                                                       |
|                 [ IMAGE PRODUIT ]                     |
|                                                       |
|         +-------------------------------+             |
|         |  [Heart]  [Eye]  [Cart]       |  ActionBar  |
|         +-------------------------------+             |
|                                                       |
+-------------------------------------------------------+
```

Implementation de la barre :
```typescript
{/* Action Bar - Uniquement sur produit central au survol */}
<AnimatePresence>
  {isHovered && isCenter && (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20"
    >
      <div 
        className="flex items-center gap-3 px-4 py-2.5 rounded-2xl"
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(147, 181, 161, 0.2)",
          boxShadow: "0 8px 32px rgba(26, 26, 26, 0.12)"
        }}
      >
        {/* Bouton Favori */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleToggleFavorite}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
          style={{
            background: isFavorite(part.id) 
              ? "rgba(239, 68, 68, 0.1)" 
              : "rgba(26, 26, 26, 0.05)"
          }}
          aria-label={isFavorite(part.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Heart 
            className={`w-5 h-5 transition-colors ${
              isFavorite(part.id) 
                ? "fill-red-500 text-red-500" 
                : "text-carbon/60 hover:text-carbon"
            }`} 
          />
        </motion.button>

        {/* Bouton Apercu Rapide */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleQuickView}
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-carbon/5 hover:bg-carbon/10 transition-colors"
          aria-label="Apercu rapide"
        >
          <Eye className="w-5 h-5 text-carbon/60 hover:text-carbon" />
        </motion.button>

        {/* Bouton Panier */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleAddToCart}
          className="w-10 h-10 rounded-xl flex items-center justify-center bg-mineral/10 hover:bg-mineral/20 transition-colors"
          aria-label="Ajouter au panier"
        >
          <ShoppingCart className="w-5 h-5 text-mineral" />
        </motion.button>
      </div>
    </motion.div>
  )}
</AnimatePresence>
```

### 2.4 Bouton "Commander Direct" (Remplace le Prix au Hover)

Logique de transformation :
```text
ETAT NORMAL                    ETAT HOVER
+----------------+             +----------------------------+
|   35.00 EUR    |     -->     |  [Zap] Commander Direct    |
+----------------+             +----------------------------+
                                       |
                                       v (clic)
                               +----------------------------+
                               |    [Spinner Loading...]    |
                               +----------------------------+
                                       |
                                       v (500ms)
                               +----------------------------+
                               |    [Check] Ajoute !        |
                               +----------------------------+
```

Implementation :
```typescript
{/* Zone Prix / Bouton Commander */}
<AnimatePresence mode="wait">
  {isHovered && isCenter ? (
    <motion.button
      key="order-button"
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -5 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onClick={handleDirectOrder}
      disabled={isOrdering || part.price === null}
      className="w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-300"
      style={{
        background: orderSuccess 
          ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
          : "linear-gradient(135deg, hsl(var(--mineral)) 0%, hsl(var(--mineral-dark)) 100%)",
        boxShadow: orderSuccess
          ? "0 8px 24px rgba(34, 197, 94, 0.4)"
          : "0 8px 24px rgba(147, 181, 161, 0.4)"
      }}
      aria-label="Commander directement"
    >
      {isOrdering ? (
        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
      ) : orderSuccess ? (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" />
          <span>Ajoute !</span>
        </motion.div>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <Zap className="w-4 h-4" />
          <span>Commander Direct</span>
        </span>
      )}
    </motion.button>
  ) : (
    <motion.span
      key="price"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="text-2xl md:text-3xl font-extrabold block"
      style={{ color: "hsl(var(--mineral))" }}
    >
      {formatPrice(part.price || 0)}
    </motion.span>
  )}
</AnimatePresence>
```

### 2.5 Handlers d'Actions

```typescript
// Ajout au panier avec toast visuel
const handleAddToCart = (e: React.MouseEvent) => {
  e.stopPropagation();
  if (part.price === null) return;
  
  addItem({
    id: part.id,
    name: part.name,
    price: part.price,
    image_url: part.image_url,
    stock_quantity: part.stock_quantity || 0,
  });
  
  toast.success(
    <div className="flex items-center gap-3">
      {part.image_url && (
        <img 
          src={part.image_url} 
          alt={part.name}
          className="w-10 h-10 rounded-lg object-contain bg-greige p-1"
        />
      )}
      <div>
        <p className="font-medium text-carbon text-sm">{part.name}</p>
        <p className="text-xs text-muted-foreground">Ajoute au panier</p>
      </div>
    </div>,
    { action: { label: "Voir", onClick: () => setIsOpen(true) } }
  );
};

// Toggle favori
const handleToggleFavorite = (e: React.MouseEvent) => {
  e.stopPropagation();
  toggleFavorite(part.id, part.name);
};

// Apercu rapide
const handleQuickView = (e: React.MouseEvent) => {
  e.stopPropagation();
  setShowQuickView(true);
};

// Commande directe avec animation
const handleDirectOrder = (e: React.MouseEvent) => {
  e.stopPropagation();
  if (isOrdering || part.price === null) return;
  
  setIsOrdering(true);
  
  setTimeout(() => {
    addItem({
      id: part.id,
      name: part.name,
      price: part.price!,
      image_url: part.image_url,
      stock_quantity: part.stock_quantity || 0,
    });
    
    setIsOrdering(false);
    setOrderSuccess(true);
    
    toast.success("Piece ajoutee au panier", {
      action: { label: "Voir le panier", onClick: () => setIsOpen(true) }
    });
    
    setTimeout(() => setOrderSuccess(false), 1500);
  }, 500);
};
```

---

## Phase 3 : Modale Quick View Premium

### Nouveau Fichier : `src/components/showcase/QuickViewModal.tsx`

Structure visuelle :
```text
+----------------------------------------------------------------+
|                    BACKDROP BLUR (8px)                         |
|  +----------------------------------------------------------+  |
|  |                                                    [X]   |  |
|  |  +---------------------+  +--------------------------+   |  |
|  |  |                     |  |  NOM DU PRODUIT          |   |  |
|  |  |    IMAGE PRODUIT    |  |                          |   |  |
|  |  |      (Grande)       |  |  35.00 EUR               |   |  |
|  |  |                     |  |                          |   |  |
|  |  +---------------------+  |  Difficulte:  * * * . .  |   |  |
|  |                           |  Stock: En stock (12)    |   |  |
|  |                           |                          |   |  |
|  |                           |  [  Ajouter au Panier ]  |   |  |
|  |                           |                          |   |  |
|  |                           |  Voir la fiche complete  |   |  |
|  |                           +--------------------------+   |  |
|  +----------------------------------------------------------+  |
+----------------------------------------------------------------+
```

Implementation complete :
```typescript
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, ExternalLink, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "@/lib/formatPrice";
import { useCart } from "@/hooks/useCart";
import DifficultyIndicator from "@/components/parts/DifficultyIndicator";
import { toast } from "sonner";

interface Part {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  image_url: string | null;
  stock_quantity: number | null;
  difficulty_level: number | null;
}

interface QuickViewModalProps {
  part: Part;
  isOpen: boolean;
  onClose: () => void;
}

const QuickViewModal = ({ part, isOpen, onClose }: QuickViewModalProps) => {
  const navigate = useNavigate();
  const { addItem, setIsOpen } = useCart();
  const isInStock = (part.stock_quantity ?? 0) > 0;

  const handleAddToCart = () => {
    if (part.price === null || !isInStock) return;
    
    addItem({
      id: part.id,
      name: part.name,
      price: part.price,
      image_url: part.image_url,
      stock_quantity: part.stock_quantity || 0,
    });
    
    toast.success("Piece ajoutee au panier", {
      action: { label: "Voir", onClick: () => setIsOpen(true) }
    });
    
    onClose();
  };

  const handleViewDetails = () => {
    onClose();
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => navigate(`/piece/${part.slug}`), 150);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop avec blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{
              background: "rgba(26, 26, 26, 0.4)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          />
          
          {/* Modale */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div 
              className="relative w-full max-w-3xl pointer-events-auto rounded-3xl overflow-hidden"
              style={{
                background: "rgba(250, 250, 248, 0.98)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.5)",
                boxShadow: "0 32px 64px rgba(26, 26, 26, 0.2)"
              }}
              role="dialog"
              aria-modal="true"
            >
              {/* Bouton Fermer */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center bg-carbon/5 hover:bg-carbon/10 transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5 text-carbon" />
              </motion.button>

              <div className="grid md:grid-cols-2 gap-0">
                {/* Image Section */}
                <div className="relative aspect-square bg-[#F9F8F6] flex items-center justify-center p-8">
                  {part.image_url ? (
                    <motion.img
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1, duration: 0.4 }}
                      src={part.image_url}
                      alt={part.name}
                      className="w-full h-full object-contain"
                      style={{
                        filter: "drop-shadow(0 20px 40px rgba(26, 26, 26, 0.15))"
                      }}
                    />
                  ) : (
                    <Package className="w-24 h-24 text-carbon/20" />
                  )}
                </div>

                {/* Info Section */}
                <div className="p-8 flex flex-col justify-center space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                  >
                    <h2 className="text-2xl font-semibold text-carbon leading-tight mb-4">
                      {part.name}
                    </h2>
                    
                    <p 
                      className="text-4xl font-extrabold"
                      style={{ color: "hsl(var(--mineral))" }}
                    >
                      {part.price ? formatPrice(part.price) : "Prix sur demande"}
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="space-y-4"
                  >
                    {/* Difficulte */}
                    <div className="flex items-center justify-between py-3 border-b border-carbon/10">
                      <span className="text-sm text-carbon/60">Difficulte</span>
                      <DifficultyIndicator 
                        level={part.difficulty_level} 
                        showLabel 
                        variant="compact"
                      />
                    </div>

                    {/* Stock */}
                    <div className="flex items-center justify-between py-3 border-b border-carbon/10">
                      <span className="text-sm text-carbon/60">Disponibilite</span>
                      <div className="flex items-center gap-2">
                        <div 
                          className={`w-2 h-2 rounded-full ${
                            isInStock ? "bg-green-500 animate-pulse" : "bg-red-500"
                          }`}
                        />
                        <span className={`text-sm font-medium ${
                          isInStock ? "text-green-600" : "text-red-600"
                        }`}>
                          {isInStock 
                            ? `En stock (${part.stock_quantity})` 
                            : "Rupture de stock"
                          }
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.4 }}
                    className="space-y-3 pt-4"
                  >
                    {/* Bouton Ajouter au Panier */}
                    <button
                      onClick={handleAddToCart}
                      disabled={!isInStock || part.price === null}
                      className="w-full py-4 px-6 rounded-xl font-semibold text-white flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: isInStock 
                          ? "linear-gradient(135deg, hsl(var(--mineral)) 0%, hsl(var(--mineral-dark)) 100%)"
                          : "#ccc",
                        boxShadow: isInStock 
                          ? "0 8px 24px rgba(147, 181, 161, 0.4)"
                          : "none"
                      }}
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span>Ajouter au Panier</span>
                    </button>

                    {/* Lien vers fiche complete */}
                    <button
                      onClick={handleViewDetails}
                      className="w-full py-3 text-center text-carbon/70 hover:text-mineral font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <span>Voir la fiche complete</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default QuickViewModal;
```

---

## Phase 4 : Integration dans GamingCarouselCard

Ajouter l'import et le rendu de la modale :
```typescript
import QuickViewModal from "./QuickViewModal";

// Dans le JSX, apres la fermeture du conteneur principal
return (
  <>
    <motion.div /* ... contenu existant ... */ />
    
    {/* Quick View Modal */}
    <QuickViewModal 
      part={part}
      isOpen={showQuickView}
      onClose={() => setShowQuickView(false)}
    />
  </>
);
```

---

## Resume des Fichiers

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/components/showcase/GamingCarouselCard.tsx` | MODIFIER | Correction 404 + Actions hover + Bouton Commander |
| `src/components/showcase/QuickViewModal.tsx` | CREER | Modale apercu rapide avec blur backdrop |

---

## Design Tokens Appliques

| Element | Valeur |
|---------|--------|
| Fond modal | rgba(250, 250, 248, 0.98) - Blanc nacre |
| Backdrop blur | 8px |
| Border radius modaux | 24px (rounded-3xl) |
| Ombre cartes | 0 8px 32px rgba(26, 26, 26, 0.12) |
| Animation duree | 0.25s - 0.35s (ease-out) |
| Couleur CTA | hsl(var(--mineral)) avec gradient |

---

## Checklist de Validation

- Carrousel affiche toujours 3+ produits (gauche, centre, droite) via Embla loop
- Produit central scale 1.6 avec effet breathing
- Produits lateraux scale reduit avec blur progressif
- Clic sur fleches navigue et centre la carte
- Actions bar apparait uniquement sur produit central au hover
- Bouton "Commander Direct" avec animation loading puis succes
- Quick View Modal floute l'arriere-plan (blur 8px)
- Navigation vers `/piece/{slug}` (plus de 404)
- Tous les boutons ont des aria-labels

