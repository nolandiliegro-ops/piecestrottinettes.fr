-- Add confidence_level + suggestion_reason to part_compatibility
ALTER TABLE public.part_compatibility
  ADD COLUMN IF NOT EXISTS confidence_level text NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS suggestion_reason text;

-- Backfill existing rows
UPDATE public.part_compatibility
   SET confidence_level = 'validated'
 WHERE auto_suggested = false AND confidence_level = 'medium';

UPDATE public.part_compatibility
   SET confidence_level = 'high'
 WHERE auto_suggested = true AND confidence_level = 'medium' AND suggestion_reason IS NULL;

-- Validity constraint
ALTER TABLE public.part_compatibility
  DROP CONSTRAINT IF EXISTS part_compat_confidence_check;
ALTER TABLE public.part_compatibility
  ADD CONSTRAINT part_compat_confidence_check
  CHECK (confidence_level IN ('high','medium','low','validated'));

COMMENT ON COLUMN public.part_compatibility.confidence_level IS
  'high=specs match ou IA très sûre. medium=IA probable. low=IA incertain. validated=admin OK.';
COMMENT ON COLUMN public.part_compatibility.suggestion_reason IS
  'Explication courte (IA Passe B). Null pour Passe A.';

-- Partial index for filtering auto suggestions by confidence
CREATE INDEX IF NOT EXISTS idx_part_compat_confidence
  ON public.part_compatibility(confidence_level)
  WHERE auto_suggested = true;