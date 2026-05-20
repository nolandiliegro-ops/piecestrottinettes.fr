ALTER TABLE public.scooter_models
  ADD COLUMN IF NOT EXISTS is_top_moment    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_featured_home BOOLEAN NOT NULL DEFAULT false;