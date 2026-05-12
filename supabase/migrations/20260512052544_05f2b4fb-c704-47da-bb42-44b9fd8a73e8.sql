-- 1. Backfill : dépublier les scooters sans image
UPDATE public.scooter_models
SET published = false
WHERE image_url IS NULL OR image_url = '';

-- 2. Inverser le défaut pour les futures insertions manuelles
ALTER TABLE public.scooter_models
ALTER COLUMN published SET DEFAULT false;

-- 3. Index partiel pour optimiser le filtre public
CREATE INDEX IF NOT EXISTS idx_scooter_models_published_true
ON public.scooter_models (published)
WHERE published = true;