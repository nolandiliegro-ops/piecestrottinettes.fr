ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

GRANT SELECT ON public.profiles TO anon;

CREATE POLICY "Public can read public profiles"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (is_public = true);