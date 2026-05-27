
## Partie 1 — Données BDD (via `supabase--insert`)

Trois `UPDATE` séquentiels sur `public.profiles` :

1. `display_name = 'STEEDY TROTT'` pour l'utilisateur dont l'email auth est `steedytrott@gmail.com` (sous-requête sur `auth.users`).
2. `display_name = 'TUGA TROTT'` pour `team.tugatrott@gmail.com`.
3. `is_public = true` pour les 3 profils : `NOLAN2.0`, `TUGA TROTT`, `STEEDY TROTT`.

Une seule call `supabase--insert` regroupant les 3 statements.

**Pas de migration de schéma** — `display_name` et `is_public` existent déjà.

---

## Partie 2 — UI : champ "Nom de Rider" dans le modal profil

### Fichier modifié
`src/components/garage/RiderProfileEditDialog.tsx` (uniquement)

### Ajout d'un hook dans `src/hooks/useRiderProfile.ts`
Nouvelle mutation `updateDisplayName` :
- Vérifie unicité côté client via `supabase.from('profiles').select('id').eq('display_name', value).neq('id', user.id).maybeSingle()` → si match, throw `"Ce nom est déjà pris"`.
- Update `profiles.display_name` + `updated_at` pour `id = user.id`.
- Invalide le cache profil + `refreshProfile()`.

### Modifications du dialog
- Nouvel état `displayName` initialisé depuis `profile?.display_name`.
- Champ `<Input>` placé **avant** le champ Bio, sous l'avatar.
- Label : "Nom de Rider" + compteur `{displayName.length}/30` aligné à droite (même style que Bio/Location).
- `maxLength={30}`.
- Validation locale au `onChange` ou avant save :
  - Trim non vide.
  - Regex autorisée : `/^[a-zA-Z0-9 ._-]+$/` (lettres, chiffres, espace, point, underscore, tiret).
  - Sinon affichage d'un message d'erreur inline rouge sous l'input + bouton Enregistrer désactivé.
- `handleSave` :
  - Si `displayName` a changé → `tasks.push(updateDisplayName.mutateAsync(displayName.trim()))`.
  - L'erreur d'unicité remonte via le `toast.error` déjà câblé dans `useRiderProfile`.
  - Si succès → fermeture du modal (comportement actuel préservé).

### Cohérence
- `AuthContext.Profile` contient déjà `display_name` → pas de changement de type.
- `handle_new_user()` trigger BDD inchangé.

---

## Partie 3 — Hors-scope confirmé

Aucune modif sur :
- Edge Functions (`create-checkout-session`, `stripe-webhook`, `verify-payment`, `send-order-email`, etc.).
- Pages `/garage` hors `RiderProfileEditDialog`.
- Flux paiement, panier, auth, RLS.

---

## Ordre d'exécution en Build

1. `supabase--insert` (3 UPDATE).
2. Édition `src/hooks/useRiderProfile.ts` (ajout `updateDisplayName`).
3. Édition `src/components/garage/RiderProfileEditDialog.tsx` (champ + validation + save).

Valide pour passer en Build ?
