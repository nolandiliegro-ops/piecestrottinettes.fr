

# Système de validation Bot Import pour les pièces

## Vue d'ensemble
Reproduire le workflow de validation des trottinettes (`PendingScootersManager`) pour les pièces détachées, avec colonne `published`, filtrage des requêtes publiques, et nouvel onglet admin.

## Changements

### 1. Migration DB — Ajouter colonne `published` à `parts`
```sql
ALTER TABLE public.parts ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT true;
```
Défaut `true` pour ne pas casser les pièces existantes. Les imports bot mettront `published = false`.

### 2. `src/components/admin/PendingPartsManager.tsx` — Nouveau composant
Calqué sur `PendingScootersManager` (377 lignes). Fonctionnalités :
- **Hook `usePendingParts`** : query `parts` WHERE `published = false`, join `category:categories(id, name)`
- **Carte par pièce** : image preview, badge Bot violet, nom, catégorie, prix HT, specs (difficulté, stock)
- **Sources web** : liens cliquables extraits de `technical_metadata.sources`
- **Bouton image inline** : édition rapide de `image_url`
- **Bouton Éditer** : modale complète avec tous les champs (nom, slug, prix, stock, description, category_id, difficulty_level, youtube_video_id, sku, meta_title, meta_description, image_url)
- **Bouton Publier** : `update({ published: true })`
- **Bouton Supprimer** : avec confirmation AlertDialog
- **Bouton "Tout publier"** : publish all pending en un clic
- Export du hook `usePendingParts` pour le badge compteur

### 3. `src/components/admin/AdminInventory.tsx` — Ajouter onglet
Ajouter un 4ème onglet "Pièces Bot" avec :
- Icône `Bot` + badge compteur violet (comme Bot Import)
- Import de `PendingPartsManager` et `usePendingParts`

### 4. Filtrer `published = true` sur les requêtes publiques
Fichiers à modifier (ajout `.eq('published', true)`) :
- `src/hooks/useCatalogueData.ts` — `useAllParts`
- `src/hooks/usePartDetail.ts` — `usePartDetail` + `useRelatedParts`
- `src/hooks/useCompatibleParts.ts` — query parts par IDs
- `src/hooks/useUnifiedSearch.ts` — recherche globale parts
- `src/components/garage/QuickAddModificationDialog.tsx` — recherche garage

**NE PAS filtrer** dans les composants admin (`PartsManager`, `AdminDashboard`, `CompatibilityManager`, `AdminScanner`) qui doivent voir toutes les pièces.

## Fichiers touchés
| Fichier | Action |
|---------|--------|
| Migration SQL | Ajouter colonne `published` |
| `src/components/admin/PendingPartsManager.tsx` | Nouveau composant |
| `src/components/admin/AdminInventory.tsx` | Ajouter onglet "Pièces Bot" |
| `src/hooks/useCatalogueData.ts` | Filtrer `published = true` |
| `src/hooks/usePartDetail.ts` | Filtrer `published = true` |
| `src/hooks/useCompatibleParts.ts` | Filtrer `published = true` |
| `src/hooks/useUnifiedSearch.ts` | Filtrer `published = true` |
| `src/components/garage/QuickAddModificationDialog.tsx` | Filtrer `published = true` |

