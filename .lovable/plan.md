

# 🔧 Corrections à Appliquer - Doubler la Taille des Produits

## Fichier : `src/components/showcase/GamingCarousel.tsx`

### Correction 1 : minHeight Skeleton (ligne 29)
```typescript
// AVANT
minHeight: "600px",

// APRÈS
minHeight: "800px",
```

### Correction 2 : Doubler getCardWidth (lignes 100-106)
```typescript
// AVANT
const getCardWidth = (distance: number) => {
  if (distance === 0) return "240px";
  if (distance === 1) return "200px";
  if (distance === 2) return "180px";
  return "160px";
};

// APRÈS
const getCardWidth = (distance: number) => {
  if (distance === 0) return "480px";   // Doublé
  if (distance === 1) return "400px";   // Doublé
  if (distance === 2) return "360px";   // Doublé
  return "320px";                        // Doublé
};
```

### Correction 3 : minHeight Container (ligne 113)
```typescript
// AVANT
minHeight: "600px",

// APRÈS
minHeight: "800px",
```

---

## Récapitulatif

| Ligne | Avant | Après |
|-------|-------|-------|
| 29 | `minHeight: "600px"` | `minHeight: "800px"` |
| 102 | `return "240px"` | `return "480px"` |
| 103 | `return "200px"` | `return "400px"` |
| 104 | `return "180px"` | `return "360px"` |
| 105 | `return "160px"` | `return "320px"` |
| 113 | `minHeight: "600px"` | `minHeight: "800px"` |

## Résultat Attendu

- Container central : **480px** × scale 1.6 = **768px** d'espace
- Image centrale : **1000px** pourra s'afficher correctement
- Produits **BEAUCOUP plus grands** et imposants

