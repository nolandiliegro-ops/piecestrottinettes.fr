
-- Create site_assets table
CREATE TABLE public.site_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_key text UNIQUE NOT NULL,
  asset_url text NOT NULL DEFAULT '',
  label text NOT NULL DEFAULT '',
  section text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_assets ENABLE ROW LEVEL SECURITY;

-- SELECT for everyone
CREATE POLICY "Public can view site assets"
  ON public.site_assets FOR SELECT
  USING (true);

-- Admin-only mutations
CREATE POLICY "Admins can insert site assets"
  ON public.site_assets FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update site assets"
  ON public.site_assets FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete site assets"
  ON public.site_assets FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_site_assets_updated_at
  BEFORE UPDATE ON public.site_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial data
INSERT INTO public.site_assets (asset_key, asset_url, label, section) VALUES
  ('catalogue_hero_image', '', 'Image Hero Catalogue', 'catalogue'),
  ('product_fallback_image', '', 'Image par défaut produit', 'produits'),
  ('garage_background', '', 'Fond du cockpit Garage', 'garage');

-- Create public bucket for site assets
INSERT INTO storage.buckets (id, name, public) VALUES ('site-assets', 'site-assets', true);

-- Storage policies for site-assets bucket
CREATE POLICY "Public can view site assets files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-assets');

CREATE POLICY "Admins can upload site assets files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update site assets files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete site assets files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));
