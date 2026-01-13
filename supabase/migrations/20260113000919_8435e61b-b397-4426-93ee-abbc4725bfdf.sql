-- Add new columns for scooter detail pages
ALTER TABLE public.scooter_models
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS affiliate_link TEXT;