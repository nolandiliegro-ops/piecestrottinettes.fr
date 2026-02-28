
-- Add subtitle column to site_assets
ALTER TABLE public.site_assets ADD COLUMN subtitle text DEFAULT '';

-- Also add subtitle to category_images for bento category cards
ALTER TABLE public.category_images ADD COLUMN subtitle text DEFAULT '';
