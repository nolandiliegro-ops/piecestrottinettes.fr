-- =====================================================================
-- Migration : part_suppliers + auto_suggested compatibility
-- Idempotente (rerunnable safely).
-- =====================================================================

-- 1. Table public.part_suppliers
CREATE TABLE IF NOT EXISTS public.part_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id uuid NOT NULL REFERENCES public.parts(id) ON DELETE CASCADE,
  supplier_name text NOT NULL,
  supplier_sku text,
  supplier_url text,
  buy_price_ht numeric(10, 2),
  stock_supplier integer,
  shipping_time_days integer DEFAULT 2,
  is_primary boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT part_suppliers_supplier_name_check CHECK (
    supplier_name IN (
      'wattiz', 'ewheel', 'voltcorp', 'bluewaycorp',
      'dualtronstore', 'weebot', 'autre'
    )
  )
);

COMMENT ON TABLE public.part_suppliers IS
  'Liaisons multi-fournisseurs B2B pour chaque piece. Acces admin uniquement.';
COMMENT ON COLUMN public.part_suppliers.part_id IS
  'FK vers parts.id, suppression cascade.';
COMMENT ON COLUMN public.part_suppliers.supplier_name IS
  'Nom court du fournisseur, contraint a une whitelist.';
COMMENT ON COLUMN public.part_suppliers.supplier_sku IS
  'Reference produit chez le fournisseur (SKU B2B).';
COMMENT ON COLUMN public.part_suppliers.buy_price_ht IS
  'Prix d''achat HT en euros (marge calculee cote UI).';
COMMENT ON COLUMN public.part_suppliers.is_primary IS
  'Fournisseur principal pour cette piece. Un seul autorise via index unique partiel.';

CREATE INDEX IF NOT EXISTS idx_part_suppliers_part_id
  ON public.part_suppliers(part_id);
CREATE INDEX IF NOT EXISTS idx_part_suppliers_supplier_name
  ON public.part_suppliers(supplier_name);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_part_suppliers_primary
  ON public.part_suppliers(part_id) WHERE is_primary = true;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_part_suppliers_part_supplier
  ON public.part_suppliers(part_id, supplier_name);

ALTER TABLE public.part_suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full access on part_suppliers" ON public.part_suppliers;
CREATE POLICY "Admins full access on part_suppliers"
  ON public.part_suppliers
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP TRIGGER IF EXISTS trg_part_suppliers_updated_at ON public.part_suppliers;
CREATE TRIGGER trg_part_suppliers_updated_at
  BEFORE UPDATE ON public.part_suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. part_compatibility.auto_suggested
ALTER TABLE public.part_compatibility
  ADD COLUMN IF NOT EXISTS auto_suggested boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.part_compatibility.auto_suggested IS
  'true = suggestion auto par bulk-insert-parts (a valider). false = validee manuellement.';

CREATE INDEX IF NOT EXISTS idx_part_compat_auto_suggested
  ON public.part_compatibility(scooter_model_id) WHERE auto_suggested = true;