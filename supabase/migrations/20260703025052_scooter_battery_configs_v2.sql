-- =====================================================================
-- scooter_battery_configs v2 — table de reference des voltages reels par modele
-- (variantes batterie, dont bi-voltage type 60/72V). Fondation du matching
-- electrique deterministe.
-- =====================================================================
-- Idempotent / rerunnable. Deja applique en LIVE via le SQL editor Lovable
-- (22 lignes existantes, testé OK) ; ce fichier assure la tracabilite repo.
BEGIN;

-- 0) Garde-fou : la fonction du trigger updated_at doit exister
--    (creee par ailleurs pour part_suppliers). On ne l'ecrase pas si presente.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'update_updated_at_column'
      AND pronamespace = 'public'::regnamespace
  ) THEN
    CREATE FUNCTION public.update_updated_at_column()
    RETURNS trigger LANGUAGE plpgsql AS $fn$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $fn$;
  END IF;
END $$;

-- 1) Colonnes de base additives (capacity_ah AVANT les colonnes generees qui la referencent)
ALTER TABLE public.scooter_battery_configs
  ADD COLUMN IF NOT EXISTS capacity_ah    numeric(5,2),
  ADD COLUMN IF NOT EXISTS connector_type text,
  ADD COLUMN IF NOT EXISTS updated_at     timestamptz NOT NULL DEFAULT now();

-- 2) Backfill non destructif de capacity_ah (ne remplit que les NULL -> rerunnable),
--    AVANT le SET NOT NULL et AVANT l'ajout des colonnes generees.
UPDATE public.scooter_battery_configs
  SET capacity_ah = amperage
  WHERE capacity_ah IS NULL AND amperage IS NOT NULL;

-- 3) capacity_ah NOT NULL (etat LIVE). Idempotent : no-op si deja NOT NULL.
ALTER TABLE public.scooter_battery_configs
  ALTER COLUMN capacity_ah SET NOT NULL;

-- 4) Colonnes GENEREES (expressions 100% IMMUTABLE -> STORED, jamais stale)
--    energy_wh = voltage x capacity_ah (60x40=2400 -> tient dans numeric(7,2))
ALTER TABLE public.scooter_battery_configs
  ADD COLUMN IF NOT EXISTS energy_wh numeric(7,2)
  GENERATED ALWAYS AS (voltage * capacity_ah) STORED;

--    label = "60V 30Ah" / "52V 10.6Ah"
ALTER TABLE public.scooter_battery_configs
  ADD COLUMN IF NOT EXISTS label text
  GENERATED ALWAYS AS (
    voltage::text || 'V ' ||
    CASE WHEN capacity_ah = trunc(capacity_ah)
         THEN trunc(capacity_ah)::int::text
         ELSE rtrim(capacity_ah::text, '0')
    END || 'Ah'
  ) STORED;

COMMENT ON COLUMN public.scooter_battery_configs.capacity_ah IS
  'Capacite reelle de la variante batterie en Ah. Vrai discriminant avec voltage. Remplace amperage (mal nomme).';
COMMENT ON COLUMN public.scooter_battery_configs.amperage IS
  'LEGACY. Ancien champ (Ah mal nomme). Conserve non destructif ; sera retire avec son UNIQUE(scooter_model_id,voltage,amperage) dans une micro-migration dediee APRES B5, une fois capacity_ah fiabilise.';
COMMENT ON COLUMN public.scooter_battery_configs.connector_type IS
  'Type de connecteur de charge, texte libre normalise (ex. GX16-2, GX16-3, GX16-4, XLR-3, DC5525, RCA). CHECK volontairement differe tant que le vocabulaire n''est pas fige.';
COMMENT ON COLUMN public.scooter_battery_configs.energy_wh IS
  'Energie nominale du pack (Wh) = voltage x capacity_ah. Colonne generee STORED, jamais saisie.';
COMMENT ON COLUMN public.scooter_battery_configs.label IS
  'Libelle lisible "VxAh" (ex. "60V 30Ah"). Colonne generee STORED, recalculee a chaque edit -> jamais stale.';
COMMENT ON COLUMN public.scooter_battery_configs.updated_at IS
  'Horodatage de derniere modif, maintenu par trigger trg_scooter_battery_configs_updated_at.';

-- 5) Index
--    (a) VRAI discriminant de variante : (model, voltage, capacity_ah)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_scooter_battery_configs_variant
  ON public.scooter_battery_configs (scooter_model_id, voltage, capacity_ah);
--    (b) un seul is_default par modele
CREATE UNIQUE INDEX IF NOT EXISTS uniq_scooter_battery_configs_default
  ON public.scooter_battery_configs (scooter_model_id) WHERE is_default = true;
--    (c) voltage = discriminant du futur matching electrique
CREATE INDEX IF NOT EXISTS idx_scooter_battery_configs_voltage
  ON public.scooter_battery_configs (voltage);

-- 6) RLS : lecture publique conservee + write admin consolidee (pattern part_suppliers)
ALTER TABLE public.scooter_battery_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read battery configs" ON public.scooter_battery_configs;
CREATE POLICY "Public can read battery configs"
  ON public.scooter_battery_configs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can insert battery configs" ON public.scooter_battery_configs;
DROP POLICY IF EXISTS "Only admins can update battery configs" ON public.scooter_battery_configs;
DROP POLICY IF EXISTS "Only admins can delete battery configs" ON public.scooter_battery_configs;
DROP POLICY IF EXISTS "Admins full access on scooter_battery_configs" ON public.scooter_battery_configs;
CREATE POLICY "Admins full access on scooter_battery_configs"
  ON public.scooter_battery_configs FOR ALL TO authenticated
  USING      (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 7) Trigger updated_at
DROP TRIGGER IF EXISTS trg_scooter_battery_configs_updated_at ON public.scooter_battery_configs;
CREATE TRIGGER trg_scooter_battery_configs_updated_at
  BEFORE UPDATE ON public.scooter_battery_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;
