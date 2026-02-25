

# Correction du carrousel — Retour alignement centré + Fix clic latéral

## Problème

1. L'alignement `start` crée un vide disgracieux et un déséquilibre visuel
2. Les boutons "Ajouter au panier" sur les cartes latérales ne fonctionnent pas car le `handleCardClick` parent intercepte le clic avant que `e.stopPropagation()` du bouton ne puisse agir (le `onClick` est sur le `motion.div` wrapper)

## Analyse du bug de clic

Le `handleCardClick` sur le `motion.div` parent (ligne 175) se déclenche AVANT les handlers enfants car l'événement remonte. Bien que `handleAddToCart` appelle `e.stopPropagation()`, le problème est que le `onClick` du parent sur `motion.div` capture l'événement au même niveau. La solution : sur les cartes non-centrales, le parent ne doit pas intercepter le clic si l'utilisateur a cliqué sur un élément interactif (bouton panier, etc.).

## Modifications

### 1. `src/components/showcase/GamingCarousel.tsx`

**Config Embla — retour à center :**
- `align: "start"` → `align: "center"`
- `containScroll: "trimSnaps"` → `containScroll: false` (nécessaire pour que `align: center` fonctionne correctement avec `loop: true`)

**Padding interne du flex container :**
- Retirer le `pl-5 md:pl-10 lg:pl-20` du flex container intérieur (ligne 266) — plus nécessaire avec l'alignement centré

**Skeleton — retour au style centré :**
- Restaurer l'affichage symétrique des skeletons (centre plus gros que les côtés)

### 2. `src/components/showcase/GamingCarouselCard.tsx`

**Fix du clic latéral :**
- Le `handleCardClick` parent (ligne 82) doit vérifier si le clic provient d'un élément interactif (bouton) avant d'appeler `onCardClick`. On ajoute une vérification : si `e.target` est à l'intérieur d'un `<button>`, on ne fait rien (le bouton gère son propre clic).
- Concrètement : dans `handleCardClick`, ajouter `if ((e.target as HTMLElement).closest('button')) return;` avant l'appel à `onCardClick`

**Animation — carte latérale lisible et cliquable :**
- Remonter l'opacité des cartes adjacentes : distance 1 → 0.9 (au lieu de 0.85), distance 2 → 0.8 (au lieu de 0.7)
- Retirer le `whileHover={{ scale: isCenter ? undefined : 1.05 }}` sur le `motion.div` parent (ce scale entre en conflit avec le scale animé du `animate`). Le hover feedback viendra uniquement du boxShadow de la carte glassmorphism.
- Ajouter un hover boxShadow plus fort sur les cartes latérales : quand `isHovered && !isCenter`, appliquer un boxShadow plus prononcé sur la div glassmorphism intérieure

**Aucun changement sur :** les interactions internes (favoris, œil, panier) — ils ont déjà `e.stopPropagation()`

## Fichiers modifiés

- `src/components/showcase/GamingCarousel.tsx` — config Embla center, retrait padding
- `src/components/showcase/GamingCarouselCard.tsx` — fix clic parent, ajustement opacité/hover

