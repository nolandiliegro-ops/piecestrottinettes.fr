# Scan Trott + Admin Optimisé — Plan d'implémentation

## Statut : ✅ IMPLÉMENTÉ

### Ce qui a été fait

#### 1. Migration DB
- Colonne `year` (integer) ajoutée à `scooter_models`
- Colonne `search_terms` (text) ajoutée pour les alias
- Extension `pg_trgm` activée avec index GIN trigram
- Fonction SQL `search_scooter_fuzzy()` créée pour recherche par similarité

#### 2. Edge Function `scan-trott`
- Vision IA via Lovable AI Gateway (`google/gemini-2.5-flash`)
- Prompt avec extraction SN + validation objet (filtre non-trottinette)
- Recherche fuzzy `pg_trgm` avec fallback `ILIKE`
- Gestion erreurs 429/402

#### 3. Composant `ScanTrottButton`
- Bouton "Scanner ma Trott" avec icône Camera
- `<input capture="environment">` pour caméra mobile
- Overlay plein écran avec animation laser scanner (framer-motion)
- États : scanning → success (redirect) / error (retry)

#### 4. Admin `ScootersManager` optimisé
- **Quick Add** : formulaire inline (Nom + Marque + Année)
- **Import CSV** : parsing papaparse, auto-création marques
- **Dupliquer** : bouton copie sur chaque ligne
- **Champs year + search_terms** dans create/edit dialogs
- Export CSV mis à jour avec nouvelles colonnes
