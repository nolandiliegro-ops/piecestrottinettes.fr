ALTER TABLE public.scooter_models
  ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.parts
  ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.scooter_models.images IS
  'Array de photos détourées. Structure : [{"url": text, "position": int, "is_primary": bool, "alt": text}]. image_url conservé pour rétrocompatibilité.';

COMMENT ON COLUMN public.parts.images IS
  'Array de photos détourées. Structure : [{"url": text, "position": int, "is_primary": bool, "alt": text}]. image_url conservé pour rétrocompatibilité.';

CREATE INDEX IF NOT EXISTS idx_scooter_models_images_gin
  ON public.scooter_models USING GIN (images);

CREATE INDEX IF NOT EXISTS idx_parts_images_gin
  ON public.parts USING GIN (images);