-- =====================================================================
-- Cleanup des fixtures du smoke moteur K (scripts/_smoke-moteur-k.mjs)
-- =====================================================================
-- Tables ÉCRITES par le smoke (lecture du script + des EF appelées, 17/09) :
--   - public.parts              : 6 fixtures, sku TEST-K-* / slug zzz-test-*
--                                 (bulk-insert-parts, insert)
--   - public.part_compatibility : lignes auto des fixtures (moteur K + Passe A
--                                 regex pour TEST-K-LEGACY)
-- Non touchées : scooter_models, scooter_battery_configs, categories (lecture
-- seule ou upsert à l'identique), part_suppliers (aucun supplier envoyé).
-- Le retrigger de la phase 3 porte sur 3 SKU RÉELS (pas des fixtures) : il ne
-- laisse rien à nettoyer (0 ligne avant / 0 après au run du 17/09).
--
-- À coller dans l'éditeur SQL Lovable EN DEUX FOIS : le bloc DO, puis le SELECT.
-- =====================================================================

DO $$
DECLARE
  n_fixtures int;
  n_compat   int;
  n_parts    int;
BEGIN
  -- Garde : le smoke crée exactement 6 fixtures. Plus → quelque chose d'autre
  -- porte un sku TEST-K-*, on n'efface rien (le bloc est atomique).
  SELECT count(*) INTO n_fixtures FROM public.parts WHERE sku LIKE 'TEST-K-%';
  IF n_fixtures > 6 THEN
    RAISE EXCEPTION 'cleanup smoke K : % pièces sku TEST-K-%% (max 6 attendues) — abandon, rien supprimé', n_fixtures;
  END IF;

  DELETE FROM public.part_compatibility pc
  USING public.parts p
  WHERE pc.part_id = p.id
    AND p.sku LIKE 'TEST-K-%';
  GET DIAGNOSTICS n_compat = ROW_COUNT;

  DELETE FROM public.parts
  WHERE sku LIKE 'TEST-K-%';
  GET DIAGNOSTICS n_parts = ROW_COUNT;

  RAISE NOTICE 'cleanup smoke K : % ligne(s) part_compatibility, % pièce(s) supprimée(s)', n_compat, n_parts;
END
$$;


-- =====================================================================
-- CONTRÔLE (à coller séparément) — une ligne, tout doit valoir 0
-- =====================================================================
SELECT
  (SELECT count(*) FROM public.parts WHERE sku LIKE 'TEST-K-%')                       AS parts_test_k,
  (SELECT count(*) FROM public.parts WHERE slug LIKE 'zzz-test-%')                    AS parts_zzz_test,
  (SELECT count(*) FROM public.part_compatibility pc
     JOIN public.parts p ON p.id = pc.part_id
    WHERE p.sku LIKE 'TEST-K-%')                                                      AS compat_fixtures,
  (SELECT count(*) FROM public.part_compatibility pc
    WHERE NOT EXISTS (SELECT 1 FROM public.parts p WHERE p.id = pc.part_id))          AS compat_orphelines;
