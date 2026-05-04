
-- 1) Sanitize new user signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  clean_name text;
BEGIN
  clean_name := COALESCE(
    NULLIF(TRIM(new.raw_user_meta_data ->> 'display_name'), ''),
    'Rider'
  );
  IF length(clean_name) > 50 THEN
    clean_name := substring(clean_name, 1, 50);
  END IF;
  -- Strip HTML/script-injection chars
  clean_name := regexp_replace(clean_name, '[<>"''`]', '', 'g');

  INSERT INTO public.profiles (id, display_name, performance_points)
  VALUES (new.id, clean_name, 200);
  RETURN new;
END;
$$;

-- Enforce length at column level for defense-in-depth
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_display_name_length'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_display_name_length
      CHECK (display_name IS NULL OR length(display_name) <= 50) NOT VALID;
  END IF;
END $$;

-- 2) Restrict promo code visibility to authenticated users
DROP POLICY IF EXISTS "Public read active promo codes" ON public.promo_codes;
CREATE POLICY "Authenticated users can read active promo codes"
ON public.promo_codes
FOR SELECT
TO authenticated
USING (active = true);
