

# Plan — Système de validation des trottinettes importées

## 1. Migration SQL

Ajouter la colonne `published` à `scooter_models` :

```sql
ALTER TABLE public.scooter_models ADD COLUMN published boolean NOT NULL DEFAULT true;
```

Default `true` pour que les trottinettes existantes restent publiées. L'Edge Function forcera `published: false` pour les imports automatiques.

## 2. Edge Function `bulk-insert-scooters`

Modifier le fichier existant pour :
- Forcer `published: false` dans chaque row upsertée (les imports bot arrivent toujours en brouillon)
- Le champ `image_url` est déjà accepté dans l'interface — aucun changement nécessaire

## 3. Requêtes publiques — Filtrer sur `published = true`

Mettre à jour les fichiers qui requêtent `scooter_models` côté public pour ajouter `.eq('published', true)` :
- `src/hooks/useScooterData.ts`
- `src/hooks/useScooterDetail.ts`
- `src/hooks/useUnifiedSearch.ts`
- `src/components/hero/ScooterCarousel.tsx`
- `src/components/scooter/OtherScootersCarousel.tsx`
- La fonction DB `search_scooter_fuzzy` devra être mise à jour pour filtrer `published = true`

Les pages admin (ScootersManager, CompatibilityManager, AdminDashboard) ne filtrent PAS — elles voient tout.

## 4. Admin — Section "En attente de validation"

Ajouter un nouvel onglet dans `AdminInventory.tsx` (à côté de Pièces/Trottinettes) : **"Bot Import"** avec un badge compteur.

Créer un nouveau composant `src/components/admin/PendingScootersManager.tsx` qui affiche :
- Les trottinettes avec `published = false` en carte (nom, marque, specs, image preview)
- Badge "Bot" sur chaque carte
- Bouton "Publier" → `UPDATE published = true`
- Bouton "Supprimer" → `DELETE` (avec confirmation)
- Compteur dans le badge de l'onglet

## 5. Script local `scripts/sync-scooters-example.js`

Mettre à jour pour :
- Afficher "⏳ En attente de validation admin" après insertion réussie
- Documenter le champ `image_url` dans l'exemple

## Fichiers modifiés

| Fichier | Action |
|---------|--------|
| Migration SQL | `ADD COLUMN published boolean DEFAULT true` + update `search_scooter_fuzzy` |
| `supabase/functions/bulk-insert-scooters/index.ts` | Forcer `published: false` |
| `src/components/admin/AdminInventory.tsx` | Ajouter onglet Bot Import |
| `src/components/admin/PendingScootersManager.tsx` | Créer (liste brouillons + publish/delete) |
| `src/hooks/useScooterData.ts` | Filtrer `published = true` |
| `src/hooks/useScooterDetail.ts` | Filtrer `published = true` |
| `src/hooks/useUnifiedSearch.ts` | Filtrer `published = true` |
| `src/components/hero/ScooterCarousel.tsx` | Filtrer `published = true` |
| `src/components/scooter/OtherScootersCarousel.tsx` | Filtrer `published = true` |
| `scripts/sync-scooters-example.js` | Message post-insertion + doc image_url |

