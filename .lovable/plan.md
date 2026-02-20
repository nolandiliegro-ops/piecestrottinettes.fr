
# Amélioration du bandeau Gamification + Section Logistique

## Analyse de la situation actuelle

La table `orders` contient déjà une colonne `loyalty_points_earned` qui stocke les Points Cockpit réels gagnés lors de la commande (règle : 1€ TTC = 1 point, arrondi inférieur). Cette valeur est déjà chargée via `select("*")` dans le webhook — elle est donc disponible immédiatement, sans aucune requête supplémentaire.

Si `loyalty_points_earned` est null (commande invitée ou ancienne), un calcul de fallback `Math.floor(total_ttc)` sera utilisé pour l'affichage dans l'email uniquement.

---

## Modifications apportées à `supabase/functions/stripe-webhook/index.ts`

### 1. Signature de `generateConfirmationHTML` — nouveau paramètre

```typescript
// Avant
generateConfirmationHTML(customerName, orderNumber, totalTTC, items, details)

// Après
generateConfirmationHTML(customerName, orderNumber, totalTTC, items, details, cockpitPoints)
```

Le paramètre `cockpitPoints: number` sera calculé avant l'appel :

```typescript
const cockpitPoints = order.loyalty_points_earned ?? Math.floor(order.total_ttc);
const discountValue = (cockpitPoints * 0.05).toFixed(2).replace(".", ",");
```

---

### 2. Remplacement du bandeau Gamification (texte dynamique)

**Avant (texte fixe) :**
> "Cet achat vous a rapporté des **XP** et des **Points Cockpit** !"

**Après (texte dynamique) :**
> "Félicitations ! Cet achat vous a rapporté **[N] Points Cockpit** !"  
> *(en plus petit)* "Ces points vous offrent une remise de **[N × 0,05] €** sur votre prochaine commande."

Le style reste identique : bandeau vert `#93B5A1`, icône ⚡, texte blanc.

---

### 3. Ajout de la section Logistique (nouveau bloc HTML)

Positionnée **entre les Détails Financiers et le bouton CTA**, cette section comprend :

- **Titre** : `📦 ÉTAPE SUIVANTE` (style label majuscule, gris clair)
- **Texte** : "Nos mécanos préparent votre colis avec soin. Un numéro de suivi vous sera envoyé par email dès que votre commande sera expédiée."
- **Bouton secondaire** : "Suivre ma commande" — style contour (bordure `#2C2C2C`, fond transparent, texte sombre), pointant vers `https://piecestrottinettes.fr/garage`

Le bouton principal vert "Voir mon Garage" reste inchangé juste après.

---

## Structure finale de l'email (dans l'ordre)

```text
┌─────────────────────────────────────┐
│  HEADER VERT #93B5A1               │
│  PIECESTROTTINETTES.FR             │
│  ROULE · RÉPARE · DURE             │
├─────────────────────────────────────┤
│  ✓ PAIEMENT CONFIRMÉ               │
│  Merci [Prénom Nom] !              │
├─────────────────────────────────────┤
│  [Numéro Commande]  [Total TTC]    │
├─────────────────────────────────────┤
│  Détail des articles (avec images) │
├─────────────────────────────────────┤
│  ⚡ GAMIFICATION (dynamique)       │
│  "Vous avez gagné N Points Cockpit"│
│  "Remise de N×0,05 € disponible"  │
├─────────────────────────────────────┤
│  Détails financiers                │
│  + Adresse de livraison            │
├─────────────────────────────────────┤
│  📦 ÉTAPE SUIVANTE                 │
│  Texte suivi de commande           │
│  [Suivre ma commande] (contour)    │
├─────────────────────────────────────┤
│  [Voir mon Garage] (vert)          │
├─────────────────────────────────────┤
│  FOOTER SOMBRE                     │
└─────────────────────────────────────┘
```

---

## Fichier modifié

- `supabase/functions/stripe-webhook/index.ts` : mise à jour de `generateConfirmationHTML` (signature + deux blocs HTML) et de l'appel à cette fonction. Déploiement automatique.

## Ce qui ne change pas

- Aucune modification de la base de données
- Aucune modification de la logique XP existante (`add-experience-points`)
- Expéditeur : `contact@piecestrottinettes.fr`
- Header vert `#93B5A1`, images des produits (44px), tous les blocs existants
