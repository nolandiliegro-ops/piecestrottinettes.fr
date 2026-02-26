
-- Enable pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add year column to scooter_models
ALTER TABLE public.scooter_models ADD COLUMN IF NOT EXISTS year integer;

-- Add search_terms column for alternative names/aliases
ALTER TABLE public.scooter_models ADD COLUMN IF NOT EXISTS search_terms text;

-- Create GIN trigram indexes for fuzzy search performance
CREATE INDEX IF NOT EXISTS idx_scooter_models_name_trgm ON public.scooter_models USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_scooter_models_search_terms_trgm ON public.scooter_models USING GIN (search_terms gin_trgm_ops);
