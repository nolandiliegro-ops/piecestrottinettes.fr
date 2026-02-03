

# Correction des Bugs du Carrousel Gaming

## Analyse des Bugs

### Bug #1 : Le bouton "Commander Direct" remplace le prix

**Localisation :** `GamingCarouselCard.tsx`, lignes 324-375

**Cause :** Le code utilise une condition ternaire `isHovered ? <button> : <price>` qui affiche SOIT le prix, SOIT le bouton - jamais les deux ensemble.

```typescript
// Code actuel problématique (lignes 325-375)
<AnimatePresence mode="wait">
  {isHovered ? (
    <motion.button key="order-button">Commander Direct</motion.button>
  ) : (
    <motion.span key="price">{formatPrice(part.price)}</motion.span>
  )}
</AnimatePresence>
```

**Impact UX :** L'utilisateur perd de vue le prix au moment crucial de la décision d'achat.

---

### Bug #2 : Le badge de catégorie s'affiche sur tous les produits

**Localisation :** `GamingCarouselCard.tsx`, lignes 198-203

**Cause identifiée :** La condition `isCenter` est correcte dans le code, mais le problème vient du fait que le badge est positionné en `absolute` avec `top-0` et `left-1/2`, ce qui le place en haut de la carte. Cependant, quand les cartes sont à différentes échelles (via `scale`), le positionnement absolu peut créer des chevauchements visuels ou le badge peut sembler appartenir à une autre carte.

De plus, le calcul de `wrappedDistance` pour le loop infini peut créer des situations où plusieurs cartes ont temporairement `wrappedDistance === 0` pendant les transitions.

---

## Solution Proposée

### Fix #1 : Afficher le prix ET le bouton "Commander Direct"

Restructurer la section pour :
1. Afficher **toujours** le prix
2. Faire **apparaître** le bouton en dessous au survol avec une animation

```text
AVANT (hover)           APRÈS (hover)
+----------------+      +----------------+
|                |      |    35.00 €     |  ← Prix toujours visible
| Commander ⚡   |      +----------------+
|                |      | Commander ⚡   |  ← Bouton apparaît en dessous
+----------------+      +----------------+
```

**Modifications à apporter :**

```typescript
// Remplacer les lignes 324-375 par :

{/* Prix - Toujours visible */}
<motion.span
  className="text-2xl md:text-3xl font-extrabold block text-mineral"
  animate={{ 
    scale: isHovered ? 0.9 : 1,  // Légère réduction au survol
    y: isHovered ? -4 : 0        // Remonte légèrement
  }}
  transition={{ duration: 0.25, ease: "easeOut" }}
>
  {formatPrice(part.price || 0)}
</motion.span>

{/* Bouton Commander Direct - Apparaît au survol */}
<AnimatePresence>
  {isHovered && (
    <motion.button
      key="order-button"
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 5, scale: 0.95 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onClick={handleDirectOrder}
      disabled={isOrdering || part.price === null}
      className={`w-full max-w-xs mx-auto py-3 px-6 rounded-xl font-semibold text-white mt-3 ...`}
    >
      {/* Contenu du bouton (Loader, Check, ou Zap + texte) */}
    </motion.button>
  )}
</AnimatePresence>
```

---

### Fix #2 : Renforcer l'isolation du badge de catégorie

Le badge est correctement conditionné par `isCenter`, mais pour éviter tout chevauchement visuel :

1. **Ajouter `pointer-events-none`** sur les cartes non-centrales pour éviter tout artefact
2. **Vérifier le z-index** pour s'assurer que le badge du produit central est toujours au-dessus
3. **Ajouter une condition supplémentaire** pour exclure le rendu du badge pendant les transitions

**Modifications à apporter :**

```typescript
// Ligne 198-203 - Renforcer la condition
{/* Category Badge - Only on center product */}
<AnimatePresence mode="wait">
  {isCenter && part.category?.name && (
    <CategoryBadge categoryName={part.category.name} />
  )}
</AnimatePresence>
```

Le `mode="wait"` sur `AnimatePresence` assure que l'ancien badge disparaît complètement avant que le nouveau n'apparaisse.

**Dans CategoryBadge.tsx**, vérifier le z-index :
```typescript
className="absolute top-0 left-1/2 -translate-x-1/2 mt-4 z-50"  // z-50 au lieu de z-30
```

---

## Résumé des Fichiers à Modifier

| Fichier | Lignes | Action |
|---------|--------|--------|
| `GamingCarouselCard.tsx` | 198-203 | Ajouter `mode="wait"` à AnimatePresence |
| `GamingCarouselCard.tsx` | 324-375 | Restructurer : prix toujours visible + bouton en dessous au survol |
| `CategoryBadge.tsx` | 58 | Augmenter z-index à z-50 |

---

## Résultat Attendu

```text
PRODUIT CENTRAL (APRÈS FIX)
+---------------------------+
|    +---------------+      |
|    | 🛞 PNEUS      |      |  ← Badge uniquement ici
|    +---------------+      |
|                           |
|      [IMAGE PRODUIT]      |
|                           |
|   [❤️] [👁️] [🛒]          |  ← Action bar au survol
|                           |
|   PNEU PLEIN 8,5X2        |
|                           |
|      35.00 €              |  ← Prix TOUJOURS visible
|   +-------------------+   |
|   | ⚡ Commander      |   |  ← Apparaît SOUS le prix
|   +-------------------+   |
|                           |
|   🟢 COMPATIBLE           |
+---------------------------+
```

---

## Checklist de Validation

- [ ] Le prix reste visible au survol du produit central
- [ ] Le bouton "Commander Direct" apparaît EN DESSOUS du prix
- [ ] Le badge de catégorie s'affiche UNIQUEMENT sur le produit central
- [ ] Les transitions sont fluides (0.25s)
- [ ] Pas de chevauchement visuel entre les badges
- [ ] L'animation du bouton est cohérente avec le reste du design

