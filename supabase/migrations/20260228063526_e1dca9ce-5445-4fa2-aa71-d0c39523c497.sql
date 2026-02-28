
-- Add card configuration columns to category_images
ALTER TABLE public.category_images
  ADD COLUMN IF NOT EXISTS object_fit text NOT NULL DEFAULT 'cover',
  ADD COLUMN IF NOT EXISTS object_position text NOT NULL DEFAULT 'center',
  ADD COLUMN IF NOT EXISTS col_span integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS row_span integer NOT NULL DEFAULT 1;
