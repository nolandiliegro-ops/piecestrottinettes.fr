
-- 1. Add technical_signature JSONB to scooter_models
ALTER TABLE public.scooter_models 
  ADD COLUMN IF NOT EXISTS technical_signature jsonb DEFAULT '{}';

-- 2. Create ai_learning_logs table
CREATE TABLE public.ai_learning_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_validation_id uuid REFERENCES public.scan_validations(id) ON DELETE SET NULL,
  detected_markers jsonb NOT NULL DEFAULT '{}',
  confirmed_model_id uuid REFERENCES public.scooter_models(id) ON DELETE SET NULL,
  image_url text,
  confidence_score real,
  promoted boolean DEFAULT false,
  promoted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_learning_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on learning logs"
  ON public.ai_learning_logs FOR ALL
  USING (has_role((SELECT auth.uid()), 'admin'::app_role))
  WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Users can insert learning logs"
  ON public.ai_learning_logs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.scan_validations sv
    WHERE sv.id = ai_learning_logs.scan_validation_id
    AND sv.user_id = (SELECT auth.uid())
  ));

-- 3. Create asset_requests table for Expert Capture Studio
CREATE TABLE public.asset_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES public.scooter_models(id) ON DELETE CASCADE NOT NULL,
  component_type text NOT NULL,
  priority_score integer DEFAULT 50,
  status text NOT NULL DEFAULT 'pending',
  instructions text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.asset_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on asset_requests"
  ON public.asset_requests FOR ALL
  USING (has_role((SELECT auth.uid()), 'admin'::app_role))
  WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Authenticated users can read asset_requests"
  ON public.asset_requests FOR SELECT
  USING ((SELECT auth.uid()) IS NOT NULL);
