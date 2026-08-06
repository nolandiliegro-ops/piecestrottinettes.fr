-- Grants manquants sur user_card_likes (table existante sans privilèges Data API)
GRANT SELECT, INSERT, DELETE ON public.user_card_likes TO authenticated;
GRANT SELECT ON public.user_card_likes TO anon;
GRANT ALL ON public.user_card_likes TO service_role;

CREATE INDEX IF NOT EXISTS user_card_likes_owner_idx ON public.user_card_likes (card_owner_id);

-- profiles.username
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;

WITH base AS (
  SELECT id,
         regexp_replace(lower(public.f_unaccent(COALESCE(display_name, 'rider'))), '[^a-z0-9]+', '-', 'g') AS raw
  FROM public.profiles
  WHERE username IS NULL
), cleaned AS (
  SELECT id, COALESCE(NULLIF(btrim(raw, '-'), ''), 'rider') AS slug FROM base
), numbered AS (
  SELECT id, slug, row_number() OVER (PARTITION BY slug ORDER BY id) AS rn FROM cleaned
)
UPDATE public.profiles p
SET username = CASE WHEN n.rn = 1 THEN n.slug ELSE n.slug || '-' || n.rn END
FROM numbered n
WHERE p.id = n.id;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx ON public.profiles (lower(username));

-- user_garage.photo_xp_claimed
ALTER TABLE public.user_garage
  ADD COLUMN IF NOT EXISTS photo_xp_claimed boolean NOT NULL DEFAULT false;

-- Lecture publique des modifications si le profil est public
DROP POLICY IF EXISTS "Public can read modifications of public profiles" ON public.garage_modifications;
CREATE POLICY "Public can read modifications of public profiles"
ON public.garage_modifications FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.user_garage ug
  JOIN public.profiles pr ON pr.id = ug.user_id
  WHERE ug.id = garage_modifications.user_garage_id AND pr.is_public = true
));

-- Durcissement de set_featured_scooter (ignore l'id client, utilise auth.uid())
CREATE OR REPLACE FUNCTION public.set_featured_scooter(p_user_id uuid, p_scooter_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_owner uuid := auth.uid();
BEGIN
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.user_garage WHERE id = p_scooter_id AND user_id = v_owner) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  UPDATE public.user_garage SET is_featured = false WHERE user_id = v_owner AND is_featured = true;
  UPDATE public.user_garage SET is_featured = true WHERE id = p_scooter_id AND user_id = v_owner;
END;
$function$;

REVOKE ALL ON FUNCTION public.set_featured_scooter(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.set_featured_scooter(uuid, uuid) TO authenticated;