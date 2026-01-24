-- TEMPORAIRE - À RÉACTIVER IMMÉDIATEMENT APRÈS TEST
-- Désactivation RLS pour confirmer que le problème vient bien des policies

ALTER TABLE public.brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scooter_models DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.part_compatibility DISABLE ROW LEVEL SECURITY;