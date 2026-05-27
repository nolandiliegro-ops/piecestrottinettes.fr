Plan de migration pour la table `profiles` — profils publics.

## Objectif
Ajouter un mécanisme de visibilité publique sur les profils utilisateurs, et activer le profil `NOLAN2.0` en tant que profil public.

## Étape 1 — Migration structurelle (outil `supabase--migration`)

Sur la table `profiles` :
- **Ajouter** la colonne `is_public` (boolean, valeur par défaut `false`). C'est un interrupteur qui permet à l'utilisateur de rendre son profil visible publiquement.
- **Autoriser** le rôle `anon` (visiteurs non-connectés) à lire la table `profiles`, nécessaire technique pour que les règles de sécurité (RLS) fonctionnent pour les visiteurs.
- **Créer** une règle de sécurité `Public can read public profiles` :
  - Visiteurs non-connectés (`anon`) et utilisateurs connectés (`authenticated`) peuvent consulter les profils **uniquement** si `is_public = true`.
  - Les autres règles existantes restent inchangées (accès propre pour soi-même, accès total pour les admins).

## Étape 2 — Mise à jour des données (outil `supabase--insert`)

- Activer `is_public = true` sur le profil dont le `display_name` est `NOLAN2.0`.

## Étape 3 — Fichiers de code

- **Aucun changement** dans le code source React/TypeScript.
- `src/integrations/supabase/types.ts` est déjà patché manuellement côté repo (sera commit séparément) ; pas de modification ici.

## Impact
- Zéro changement visuel immédiat.
- Seul le profil `NOLAN2.0` devient accessible publiquement via l'API.
- Préparation pour une future fonctionnalité d'affichage de profil public côté frontend.