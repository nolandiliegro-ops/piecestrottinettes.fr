

# Batch 10 — 2 corrections

## 1. Statuts de commande — `src/components/garage/OrderHistorySection.tsx`

Ajouter/compléter le `statusConfig` avec les 6 statuts :
- `paid` → badge vert, label "Payé"
- `awaiting_payment` → badge orange, label "En attente de paiement"
- `processing` → badge bleu, label "En préparation"
- `shipped` → badge violet, label "Expédié"
- `delivered` → badge vert foncé, label "Livré"
- `cancelled` → badge rouge, label "Annulé"

## 2. Redirection post-connexion Google — 4 fichiers

### `src/contexts/AuthContext.tsx`
- Dans `onAuthStateChange`, quand `event === 'SIGNED_IN'` : lire `sessionStorage.getItem('returnTo')`, naviguer vers cette URL (ou `/garage` par défaut), puis `sessionStorage.removeItem('returnTo')`

### `src/pages/Login.tsx`
- Lire le query param `?returnTo=` depuis l'URL
- Avant `signInWithGoogle()` : stocker le `returnTo` (query param ou page courante) dans `sessionStorage`
- Après connexion email réussie : naviguer vers `returnTo` ou `/garage` par défaut
- Supprimer le `navigate('/garage')` codé en dur

### `src/pages/Register.tsx`
- Même logique que Login.tsx : stocker `returnTo` dans sessionStorage avant Google OAuth, naviguer vers `returnTo` après inscription email

### `src/components/auth/ProtectedRoute.tsx`
- Changer `<Navigate to="/login" replace />` en `<Navigate to={`/login?returnTo=${location.pathname}`} replace />`
- Importer `useLocation` depuis react-router-dom

## Fichiers modifiés (résumé)
1. `src/components/garage/OrderHistorySection.tsx` — badges statuts
2. `src/contexts/AuthContext.tsx` — redirection post-OAuth
3. `src/pages/Login.tsx` — returnTo logic
4. `src/pages/Register.tsx` — returnTo logic
5. `src/components/auth/ProtectedRoute.tsx` — passer returnTo dans redirect

