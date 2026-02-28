
-- Add alt_text and seo_name columns to site_assets
ALTER TABLE public.site_assets ADD COLUMN IF NOT EXISTS alt_text text DEFAULT '';
ALTER TABLE public.site_assets ADD COLUMN IF NOT EXISTS seo_name text DEFAULT '';

-- Add alt_text and seo_name columns to category_images
ALTER TABLE public.category_images ADD COLUMN IF NOT EXISTS alt_text text DEFAULT '';
ALTER TABLE public.category_images ADD COLUMN IF NOT EXISTS seo_name text DEFAULT '';
