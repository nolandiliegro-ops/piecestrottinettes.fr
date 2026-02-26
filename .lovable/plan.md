# Scan Trott v2 — Boucle HITL + Integration Garage Premium

## Statut : ✅ IMPLÉMENTÉ

### Ce qui a été fait

#### 1. Migration DB — `scan_validations`
- Table `scan_validations` créée (id, user_id, image_url, ai_brand, ai_model, ai_confidence, matched_model_id, is_validated, corrected_model_id, corrected_text, validated_at)
- RLS optimisé avec `(SELECT auth.uid())` pour performance
- Index GIN trigram sur `scooter_models.name` et `scooter_models.search_terms`
- Index sur `scan_validations` (user_id, is_validated, matched_model_id)

#### 2. Edge Function `scan-trott` v2
- Prompt dynamique : requête les 10 confusions les plus fréquentes depuis `scan_validations` et les injecte dans le prompt système
- Retourne `ai_brand` et `ai_model` dans tous les cas (match ou pas)
- Gestion erreurs 429/402

#### 3. Composant `ScanTrottButton` — Boucle HITL
- Resize client Canvas (1200px max, JPEG 80%) pour détail Gemini
- État `validating` au lieu de redirect auto
- Upload photo validée dans bucket `scooter-photos/scans/{userId}/{timestamp}.jpg`
- Insert dans `scan_validations` avec correction ou validation
- Redirect vers `/garage?scan_model=SLUG`

#### 4. `ScanValidationCard` — UI Glassmorphism
- Carte glassmorphism (`bg-white/10 backdrop-blur-2xl border border-white/20`)
- Badge confiance dynamique (vert/orange/rouge)
- Animations spring Framer Motion (stiffness 260, damping 22)
- Boutons : "C'est exact" / "Ce n'est pas le bon modèle" / "Signaler"

#### 5. `ScooterSearchSelect` — Dropdown correction
- Recherche ILIKE temps réel dans `scooter_models` + `brands`
- Debounce 300ms
- UI glassmorphism cohérente

#### 6. Dashboard Admin `ScansManager`
- Onglet "Scans" dans Admin.tsx
- Compteurs : Total / Validés / Corrigés / En attente
- Confusions fréquentes avec bouton "Enrichir"
- Modèles les plus demandés (non référencés)
- Tableau des scans récents avec photo, réponse IA, confiance, statut

#### 7. Intégration Garage
- Query param `?scan_model=SLUG` géré dans `Garage.tsx`
- Sélection automatique du scooter correspondant dans le carousel
