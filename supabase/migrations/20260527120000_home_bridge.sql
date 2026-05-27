-- =============================================
-- HOME BRIDGE SETTINGS — singleton table
-- Zone de transition home avec filigrane editable depuis l'admin.
-- Une seule row, jamais plus, jamais moins.
-- =============================================

-- 1. Table
CREATE TABLE public.home_bridge_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  watermark_text text NOT NULL DEFAULT 'PIECESTROTTINETTES',
  watermark_opacity numeric NOT NULL DEFAULT 5
    CHECK (watermark_opacity >= 0 AND watermark_opacity <= 15),
  watermark_color_mode text NOT NULL DEFAULT 'auto'
    CHECK (watermark_color_mode IN ('auto', 'dark', 'light')),
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Fonction trigger : refuse d'inserer une 2e row
CREATE OR REPLACE FUNCTION public.enforce_single_home_bridge_row()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.home_bridge_settings) >= 1 THEN
    RAISE EXCEPTION 'home_bridge_settings is singleton: only 1 row allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 3. Seed AVANT activation du trigger singleton
--    (sinon le trigger bloquerait le seed lui-meme)
INSERT INTO public.home_bridge_settings
  (watermark_text, watermark_opacity, watermark_color_mode, is_enabled)
VALUES
  ('PIECESTROTTINETTES', 5, 'auto', true);

-- 4. Trigger singleton — n'autorise plus aucun INSERT apres ce point
CREATE TRIGGER trg_single_home_bridge
  BEFORE INSERT ON public.home_bridge_settings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_single_home_bridge_row();

-- 5. Trigger updated_at (reutilise la fonction existante)
CREATE TRIGGER update_home_bridge_settings_updated_at
  BEFORE UPDATE ON public.home_bridge_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. RLS
ALTER TABLE public.home_bridge_settings ENABLE ROW LEVEL SECURITY;

-- Public SELECT : c'est un texte decoratif, anonyme OK
CREATE POLICY "Public can read home_bridge_settings"
  ON public.home_bridge_settings
  FOR SELECT
  USING (true);

-- Admin UPDATE uniquement (pattern has_role existant)
CREATE POLICY "Only admins can update home_bridge_settings"
  ON public.home_bridge_settings
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Note : pas de policy INSERT/DELETE = bloque par defaut.
-- Combine au trigger singleton, garantit qu'il y a TOUJOURS exactement 1 row.
