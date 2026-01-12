-- Migration: Add model_variant and battery_ah to scooter_models
-- Date: 2026-01-12
-- Description: Add columns for model variant (e.g., "Pro 2") and battery amperage (e.g., 10.6 Ah)

-- Add model_variant column for model variations (Pro, Pro 2, Max, etc.)
ALTER TABLE public.scooter_models 
ADD COLUMN IF NOT EXISTS model_variant TEXT;

-- Add battery_ah column for battery capacity in Ampere-hours
ALTER TABLE public.scooter_models 
ADD COLUMN IF NOT EXISTS battery_ah DECIMAL(5,2);

-- Add comment for documentation
COMMENT ON COLUMN public.scooter_models.model_variant IS 'Model variant name (e.g., Pro, Pro 2, Max)';
COMMENT ON COLUMN public.scooter_models.battery_ah IS 'Battery capacity in Ampere-hours (Ah)';

-- Update existing records with sample data (optional, can be removed if data will be added manually)
-- Example: Xiaomi Pro 2 with 36V and 10.6Ah battery
UPDATE public.scooter_models 
SET 
  model_variant = 'Pro 2',
  battery_ah = 10.6
WHERE name ILIKE '%pro%' AND voltage = 36;

-- Example: Ninebot models
UPDATE public.scooter_models 
SET 
  model_variant = 'Max',
  battery_ah = 15.0
WHERE name ILIKE '%max%' AND voltage = 36;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_scooter_models_variant ON public.scooter_models(model_variant);
