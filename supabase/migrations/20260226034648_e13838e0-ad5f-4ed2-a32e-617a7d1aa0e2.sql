
-- Table scan_validations pour la boucle HITL
CREATE TABLE public.scan_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  image_url TEXT,
  ai_brand TEXT NOT NULL,
  ai_model TEXT NOT NULL,
  ai_confidence TEXT DEFAULT 'medium',
  matched_model_id UUID REFERENCES public.scooter_models(id) ON DELETE SET NULL,
  is_validated BOOLEAN,
  corrected_model_id UUID REFERENCES public.scooter_models(id) ON DELETE SET NULL,
  corrected_text TEXT,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scan_validations ENABLE ROW LEVEL SECURITY;

-- RLS avec subquery optimisé (SELECT auth.uid())
CREATE POLICY "Users can view own scans"
ON public.scan_validations
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own scans"
ON public.scan_validations
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own scans"
ON public.scan_validations
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Admins can view all scans"
ON public.scan_validations
FOR SELECT
TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'));

CREATE POLICY "Admins can update all scans"
ON public.scan_validations
FOR UPDATE
TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'));

CREATE POLICY "Admins can delete scans"
ON public.scan_validations
FOR DELETE
TO authenticated
USING (public.has_role((SELECT auth.uid()), 'admin'));

-- Index GIN trigram sur scooter_models pour recherche floue performante
CREATE INDEX IF NOT EXISTS idx_scooter_models_name_trgm
ON public.scooter_models USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_scooter_models_search_terms_trgm
ON public.scooter_models USING GIN (search_terms gin_trgm_ops);

-- Index sur scan_validations pour les requêtes admin de confusions
CREATE INDEX idx_scan_validations_user_id ON public.scan_validations(user_id);
CREATE INDEX idx_scan_validations_is_validated ON public.scan_validations(is_validated);
CREATE INDEX idx_scan_validations_matched_model ON public.scan_validations(matched_model_id);
