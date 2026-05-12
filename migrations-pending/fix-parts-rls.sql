-- ============================================================
-- FIX RLS : table public.parts
-- Remplace "Public can read parts" (USING true) par deux policies
-- granulaires : lecture publique limitée aux published=true,
-- et lecture totale pour les admins via has_role().
-- ============================================================

-- A) Suppression de la policy existante non filtrée
DROP POLICY IF EXISTS "Public can read parts" ON public.parts;

-- B) Lecture publique : anon + authenticated, uniquement published=true
CREATE POLICY "Public can read published parts"
ON public.parts
FOR SELECT
TO anon, authenticated
USING (published = true);

-- C) Lecture totale pour les admins (drafts inclus)
CREATE POLICY "Admins can read all parts"
ON public.parts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
