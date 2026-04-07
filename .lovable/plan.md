

# Batch 3 — Conversion & Performance

## Constat préalable
Le bouton "Confirmer" dans `OrderConfirmationModal.tsx` a **déjà** `isSubmitting` + `disabled` + spinner `Loader2` avec texte "REDIRECTION..." (lignes 282-297). Rien à faire ici.

## 3.1 Feedback visuel ajout au panier — PurchaseBlock.tsx

**Fichier** : `src/components/pdp/PurchaseBlock.tsx`

Ajouter un état `isAdding` avec timer 800ms pour simuler le feedback :
- `useState(false)` pour `isAdding`
- Au clic : set `isAdding = true`, exécuter `addItem()`, afficher le toast, puis `setTimeout(() => setIsAdding(false), 800)`
- Bouton : `disabled={!isInStock || isAdding}`, texte conditionnel avec `Loader2 animate-spin` + "AJOUT EN COURS..." quand `isAdding`

## 3.2 Corriger Math.random() — OrderSuccessPage.tsx

**Fichier** : `src/pages/OrderSuccessPage.tsx`

Remplacer le fallback `PT-${Math.random()...}` (ligne 34) par :
- Tenter de lire `searchParams.get('order')` depuis l'URL
- Si absent et pas de `state.orderNumber` : afficher "Commande en cours de traitement" au lieu d'un faux numéro

## 3.3 Lazy loading images

**Fichiers** : `src/components/parts/PartCard.tsx`, `src/components/pdp/MediaGallery.tsx`, `src/components/catalogue/CategoryBentoGrid.tsx`

Ajouter `loading="lazy" decoding="async"` sur toutes les balises `<img>` de ces 3 composants (5 images au total).

## 3.4 Trust signals homepage

**Fichier** : `src/pages/Index.tsx`

Ajouter un composant inline entre le Hero et la section Compatible Parts :
- Barre horizontale fond `bg-white/60 backdrop-blur`, bordure subtile
- 3 éléments en flex row : `Truck` "Expédition sous 24h", `Wrench` "Mécanicien professionnel", `RotateCcw` "Retours 14 jours"
- Icônes Lucide en `text-mineral`, texte en `text-carbon`, typographie `font-display text-xs uppercase tracking-wider`
- Responsive : horizontal sur desktop, vertical stack sur mobile

## Ordre d'exécution
1. PurchaseBlock.tsx (spinner ajout panier)
2. OrderSuccessPage.tsx (fix Math.random)
3. PartCard + MediaGallery + CategoryBentoGrid (lazy loading)
4. Index.tsx (trust signals)

## Fichiers modifiés (6 au total)
- `src/components/pdp/PurchaseBlock.tsx`
- `src/pages/OrderSuccessPage.tsx`
- `src/components/parts/PartCard.tsx`
- `src/components/pdp/MediaGallery.tsx`
- `src/components/catalogue/CategoryBentoGrid.tsx`
- `src/pages/Index.tsx`

