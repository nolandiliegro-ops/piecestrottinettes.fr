
-- Create expert_captures table for the Expert Capture Studio
CREATE TABLE public.expert_captures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES public.scooter_models(id) ON DELETE CASCADE NOT NULL,
  component_type text NOT NULL,
  image_url text NOT NULL,
  technician_notes text,
  ai_extracted_markers jsonb DEFAULT '{}',
  captured_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expert_captures ENABLE ROW LEVEL SECURITY;

-- Admin full CRUD
CREATE POLICY "Admins full access on expert_captures"
  ON public.expert_captures FOR ALL
  USING (has_role((SELECT auth.uid()), 'admin'::app_role))
  WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));

-- Authenticated users can read
CREATE POLICY "Authenticated users can read expert_captures"
  ON public.expert_captures FOR SELECT
  USING ((SELECT auth.uid()) IS NOT NULL);
