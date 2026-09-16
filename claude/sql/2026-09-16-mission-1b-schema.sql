-- =====================================================================
-- Mission 1b — LOT 1 — schéma pneus pleins (largeur de jante + solid_conversion)
-- =====================================================================
-- À coller dans l'éditeur SQL Lovable EN DEUX FOIS :
--   1) le bloc DO $$ … $$ ci-dessous (une seule instruction, atomique, idempotent,
--      aucun UPDATE, aucun DELETE) ;
--   2) la requête de CONTRÔLE tout en bas (SELECT seul, une ligne).
-- L'éditeur avale les statements enchaînés : ne pas coller les deux d'un coup.
--
-- ⚠ Policy RLS : la policy SELECT de fitment_rim_diameters n'est définie dans
-- aucune migration versionnée et n'est pas lisible depuis le repo. On pose donc
-- une policy « lecture publique » EXPLICITE (USING (true)), même effet observé
-- côté anon que sur les autres fitment_* (lues en GET anon le 16/09). Si le
-- dashboard montre une policy nommée autrement sur fitment_rim_diameters,
-- aligner le nom après coup — le comportement est identique.
-- =====================================================================

DO $$
BEGIN
  -- 1. Référentiel largeur de jante (même forme que fitment_rim_diameters)
  CREATE TABLE IF NOT EXISTS public.fitment_rim_widths (
    code         text PRIMARY KEY,
    label_client text,
    note         text
  );

  ALTER TABLE public.fitment_rim_widths ENABLE ROW LEVEL SECURITY;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'fitment_rim_widths'
      AND policyname = 'Public can read fitment_rim_widths'
  ) THEN
    EXECUTE 'CREATE POLICY "Public can read fitment_rim_widths" '
         || 'ON public.fitment_rim_widths FOR SELECT USING (true)';
  END IF;

  -- 2. Seed : 44mm seul (décision Q5). 34/35 mm après mesure atelier.
  INSERT INTO public.fitment_rim_widths (code, label_client, note)
  VALUES ('44mm', '44 mm', 'largeur jante — pneu plein 10x2.50 (PP-23), Wattiz 87703, 16/09/2026')
  ON CONFLICT (code) DO NOTHING;

  -- 3. Trotte : largeur de jante (clé de montage, valeur canonique)
  ALTER TABLE public.scooter_models
    ADD COLUMN IF NOT EXISTS rim_width_code text;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'scooter_models_rim_width_code_fkey'
  ) THEN
    ALTER TABLE public.scooter_models
      ADD CONSTRAINT scooter_models_rim_width_code_fkey
      FOREIGN KEY (rim_width_code) REFERENCES public.fitment_rim_widths (code);
  END IF;

  -- 4. Trotte : passe en pneu plein ? 'yes' | 'no' | NULL (inconnu)
  ALTER TABLE public.scooter_models
    ADD COLUMN IF NOT EXISTS solid_conversion text;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'scooter_models_solid_conversion_check'
  ) THEN
    ALTER TABLE public.scooter_models
      ADD CONSTRAINT scooter_models_solid_conversion_check
      CHECK (solid_conversion IN ('yes', 'no'));
  END IF;

  -- 5. Garde anti-contradiction (décision Q1) : une trotte d'origine en plein
  --    ne peut pas être déclarée « ne passe pas en plein ».
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'scooter_models_solid_conversion_coherent'
  ) THEN
    ALTER TABLE public.scooter_models
      ADD CONSTRAINT scooter_models_solid_conversion_coherent
      CHECK (NOT (tire_family = 'solid' AND solid_conversion = 'no'));
  END IF;
END
$$;


-- =====================================================================
-- CONTRÔLE (à coller séparément) — une seule ligne, tout doit être true / 1
-- =====================================================================
SELECT
  to_regclass('public.fitment_rim_widths') IS NOT NULL                        AS table_ok,
  (SELECT count(*) FROM public.fitment_rim_widths)                            AS ref_rows,
  EXISTS (SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'scooter_models'
            AND column_name = 'rim_width_code')                               AS col_rim_width_ok,
  EXISTS (SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'scooter_models'
            AND column_name = 'solid_conversion')                             AS col_solid_conversion_ok,
  EXISTS (SELECT 1 FROM pg_constraint
          WHERE conname = 'scooter_models_solid_conversion_check')            AS check_values_ok,
  EXISTS (SELECT 1 FROM pg_constraint
          WHERE conname = 'scooter_models_solid_conversion_coherent')         AS check_coherent_ok,
  EXISTS (SELECT 1 FROM pg_constraint
          WHERE conname = 'scooter_models_rim_width_code_fkey')               AS fk_ok,
  EXISTS (SELECT 1 FROM pg_policies
          WHERE schemaname = 'public' AND tablename = 'fitment_rim_widths'
            AND policyname = 'Public can read fitment_rim_widths')            AS policy_ok;
