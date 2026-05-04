
-- 1. Bucket Storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'garage-themes', 'garage-themes', true,
  10485760,
  ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Table garage_themes
CREATE TABLE IF NOT EXISTS public.garage_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  image_url text NOT NULL,
  thumbnail_url text,
  unlock_type text NOT NULL DEFAULT 'free'
    CHECK (unlock_type IN ('free','xp','paid')),
  required_xp integer NOT NULL DEFAULT 0,
  price_eur numeric(10,2),
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_garage_themes_active_order
  ON public.garage_themes(is_active, display_order);

ALTER TABLE public.garage_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active themes" ON public.garage_themes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins read all themes" ON public.garage_themes
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins insert themes" ON public.garage_themes
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins update themes" ON public.garage_themes
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins delete themes" ON public.garage_themes
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_garage_themes_updated_at
  BEFORE UPDATE ON public.garage_themes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Colonne profiles.active_theme_key
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS active_theme_key text;

-- 4. Storage policies
CREATE POLICY "Public read garage-themes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'garage-themes');

CREATE POLICY "Admins insert garage-themes"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'garage-themes' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins update garage-themes"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'garage-themes' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins delete garage-themes"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'garage-themes' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- 5. Seed default-fallback
INSERT INTO public.garage_themes (key, name, description, image_url, unlock_type, is_active, display_order)
VALUES (
  'default-fallback',
  'Défaut',
  'Fond par défaut, sera remplacé',
  'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1920 1080%22><rect width=%221920%22 height=%221080%22 fill=%22%23F5F0E8%22/></svg>',
  'free',
  true,
  999
)
ON CONFLICT (key) DO NOTHING;
