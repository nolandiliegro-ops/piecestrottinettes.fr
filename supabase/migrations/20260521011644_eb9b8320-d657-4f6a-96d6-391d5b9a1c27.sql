-- Table brand_assets
CREATE TABLE public.brand_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_key text NOT NULL UNIQUE,
  asset_url text NOT NULL DEFAULT '',
  alt_text text,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
CREATE INDEX idx_brand_assets_key ON public.brand_assets(asset_key);

ALTER TABLE public.brand_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read brand assets"
  ON public.brand_assets FOR SELECT USING (true);

CREATE POLICY "Admins can insert brand assets"
  ON public.brand_assets FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update brand assets"
  ON public.brand_assets FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete brand assets"
  ON public.brand_assets FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_brand_assets_updated_at
  BEFORE UPDATE ON public.brand_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.brand_assets (asset_key, description) VALUES
  ('logo_main_light',    'Logo principal (fond clair) — Header desktop & mobile, Footer, Login, Register'),
  ('logo_main_dark',     'Logo principal (fond sombre) — futur dark mode'),
  ('logo_compact_light', 'Logo compact / icône sur fond clair'),
  ('logo_compact_dark',  'Logo compact / icône sur fond sombre'),
  ('favicon',            'Favicon (PNG 32x32 ou 64x64)'),
  ('apple_touch_icon',   'Apple touch icon 180x180'),
  ('og_image',           'Image Open Graph 1200x630 pour partages sociaux'),
  ('watermark_product',  'Watermark appliqué sur photos produits')
ON CONFLICT (asset_key) DO NOTHING;

-- Bucket Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read brand-assets bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'brand-assets');

CREATE POLICY "Admins upload brand-assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'brand-assets' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update brand-assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'brand-assets' AND has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'brand-assets' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete brand-assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'brand-assets' AND has_role(auth.uid(), 'admin'));