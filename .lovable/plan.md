
# Correction de l'Affichage des Prix dans OrderDetailSheet

## Problème Identifié

Dans le panneau de détails de commande admin, les montants du récapitulatif financier (Sous-total HT, TVA, Livraison, Total TTC) sont tronqués et invisibles sans scroll horizontal. Les prix des articles s'affichent correctement, mais le récapitulatif financier en bas est coupé.

## Causes du Problème

1. **ScrollArea avec padding asymétrique** : Le `pr-4` crée un espace qui pousse le contenu vers la gauche mais les montants à droite sont coupés par la scrollbar
2. **Structure flex sans contrainte** : Les lignes `justify-between` n'ont pas de `min-w-0` pour empêcher le débordement
3. **Montants sans `text-right` ou `shrink-0`** : Les spans des prix peuvent être compressés

## Solution

Restructurer le récapitulatif financier avec une meilleure gestion de la largeur et ajouter des contraintes pour éviter le débordement.

## Modifications à Apporter

### Fichier : `src/components/admin/OrderDetailSheet.tsx`

**Changement 1 - ScrollArea (ligne 182)**

Ajuster le padding pour éviter le conflit avec la scrollbar :
```typescript
// AVANT
<ScrollArea className="h-[calc(100vh-180px)] pr-4">

// APRÈS  
<ScrollArea className="h-[calc(100vh-180px)]">
  <div className="pr-4">
```

**Changement 2 - Récapitulatif financier (lignes 352-385)**

Restructurer avec des contraintes de largeur explicites :
```typescript
// Wrapper du récapitulatif avec contrainte de largeur
<div className="space-y-3 pt-4 border-t border-border/20 w-full">
  
  {/* Sous-total HT */}
  <div className="flex justify-between items-center text-sm w-full">
    <span className="text-muted-foreground flex-shrink-0">Sous-total HT</span>
    <span className="text-foreground font-medium text-right flex-shrink-0">
      {formatPrice(order.subtotal_ht)}
    </span>
  </div>
  
  {/* TVA */}
  <div className="flex justify-between items-center text-sm w-full">
    <span className="text-muted-foreground flex-shrink-0">TVA (20%)</span>
    <span className="text-foreground font-medium text-right flex-shrink-0">
      {formatPrice(order.tva_amount)}
    </span>
  </div>
  
  {/* Livraison - toujours afficher */}
  <div className="flex justify-between items-center text-sm w-full">
    <span className="text-muted-foreground flex-shrink-0">
      Livraison {order.delivery_method ? `(${deliveryMethodConfig[order.delivery_method]?.label || order.delivery_method})` : ''}
    </span>
    <span className="text-foreground font-medium text-right flex-shrink-0">
      {order.delivery_price && order.delivery_price > 0 
        ? formatPrice(order.delivery_price) 
        : order.delivery_price === 0 
          ? <span className="text-green-500">Gratuit</span>
          : '—'}
    </span>
  </div>
  
  {/* Séparateur */}
  <div className="h-px bg-border/30 my-2" />
  
  {/* Total TTC - style premium */}
  <div className="flex justify-between items-baseline w-full">
    <span className="font-semibold text-foreground">Total TTC</span>
    <span className="text-2xl font-bold text-primary">
      {formatPrice(order.total_ttc)}
    </span>
  </div>
</div>
```

**Changement 3 - Affichage Livraison conditionnel amélioré**

Toujours afficher la ligne "Livraison" dans le récapitulatif (même si 0€ ou non définie) pour une meilleure clarté, avec le type entre parenthèses si disponible.

## Résultat Attendu

Après correction, le panneau affichera clairement :

```
┌────────────────────────────────────────┐
│ Sous-total HT                  27.00 € │
│ TVA (20%)                       5.40 € │
│ Livraison (Express 24-48h)      9.90 € │
│ ────────────────────────────────────── │
│ Total TTC                      42.30 € │
└────────────────────────────────────────┘
```

## Fichiers Impactés

| Fichier | Action |
|---------|--------|
| `src/components/admin/OrderDetailSheet.tsx` | Modifier structure ScrollArea et récapitulatif |

## Validation

1. Ouvrir le panneau de détails d'une commande
2. Vérifier que tous les montants sont visibles sans scroll horizontal
3. Vérifier sur mobile que le panneau est scrollable verticalement
4. Confirmer que les prix s'affichent dans le format français (X.XX €)
