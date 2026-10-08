-- Pré-lancement : code -20 % personnel par Rider + consentement marketing.
-- APPLIQUÉE EN PROD le 08/10/2026 via le connecteur Lovable (query_database).
-- Fichier versionné pour traçabilité ; idempotent si rejoué.

ALTER TABLE public.promo_codes
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS campaign text,
  ADD COLUMN IF NOT EXISTS max_discount_eur numeric,
  ADD COLUMN IF NOT EXISTS valid_from timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS promo_codes_user_campaign_uniq
  ON public.promo_codes (user_id, campaign) WHERE user_id IS NOT NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS marketing_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_consent_at timestamptz;

-- Avant : tout compte connecté lisait TOUS les codes actifs.
DROP POLICY IF EXISTS "Authenticated users can read active promo codes" ON public.promo_codes;
DROP POLICY IF EXISTS "Users read own or shared active promo codes" ON public.promo_codes;
CREATE POLICY "Users read own or shared active promo codes" ON public.promo_codes
  FOR SELECT TO authenticated
  USING (active = true AND (user_id IS NULL OR user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.issue_rider_launch_code(p_user uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_code text; v_try int := 0;
BEGIN
  SELECT code INTO v_code FROM public.promo_codes WHERE user_id = p_user AND campaign = 'rider_launch';
  IF v_code IS NOT NULL THEN RETURN v_code; END IF;
  LOOP
    v_try := v_try + 1;
    v_code := 'RIDER-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
    BEGIN
      INSERT INTO public.promo_codes (code, discount_type, discount_value, max_uses, current_uses, active, user_id, campaign, max_discount_eur)
      VALUES (v_code, 'percent', 20, 1, 0, true, p_user, 'rider_launch', 30);
      RETURN v_code;
    EXCEPTION WHEN unique_violation THEN
      IF EXISTS (SELECT 1 FROM public.promo_codes WHERE user_id = p_user AND campaign = 'rider_launch') THEN
        SELECT code INTO v_code FROM public.promo_codes WHERE user_id = p_user AND campaign = 'rider_launch';
        RETURN v_code;
      END IF;
      IF v_try >= 5 THEN RAISE; END IF;
    END;
  END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.issue_rider_launch_code(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_rider_launch()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  BEGIN
    PERFORM public.issue_rider_launch_code(new.id);
    IF coalesce((new.raw_user_meta_data ->> 'marketing_consent')::boolean, false) THEN
      UPDATE public.profiles SET marketing_consent = true, marketing_consent_at = now() WHERE id = new.id;
    END IF;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'handle_rider_launch failed for %: %', new.id, SQLERRM;
  END;
  RETURN new;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_rider_launch ON auth.users;
CREATE TRIGGER on_auth_user_rider_launch AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_rider_launch();

DO $$ DECLARE u record; BEGIN
  FOR u IN SELECT id FROM auth.users LOOP PERFORM public.issue_rider_launch_code(u.id); END LOOP;
END $$;
