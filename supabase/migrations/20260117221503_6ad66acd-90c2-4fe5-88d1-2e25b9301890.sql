-- Create tutorials table for The Academy
CREATE TABLE public.tutorials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Core Content
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  youtube_video_id TEXT NOT NULL,
  
  -- Metadata
  difficulty INTEGER NOT NULL DEFAULT 1,
  duration_minutes INTEGER NOT NULL DEFAULT 10,
  
  -- Relation to scooter model
  scooter_model_id UUID REFERENCES public.scooter_models(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create constraint for difficulty using trigger instead of CHECK (for restoration compatibility)
CREATE OR REPLACE FUNCTION public.validate_tutorial_difficulty()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.difficulty < 1 OR NEW.difficulty > 5 THEN
    RAISE EXCEPTION 'difficulty must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_tutorials_difficulty
  BEFORE INSERT OR UPDATE ON public.tutorials
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_tutorial_difficulty();

-- Enable RLS
ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can read tutorials" ON public.tutorials
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert tutorials" ON public.tutorials
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update tutorials" ON public.tutorials
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete tutorials" ON public.tutorials
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_tutorials_updated_at
  BEFORE UPDATE ON public.tutorials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();