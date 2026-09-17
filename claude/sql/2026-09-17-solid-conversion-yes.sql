-- =====================================================================
-- Décision Nolan 17/09/2026 : solid_conversion = 'yes' sur 7 trottes publiées
-- =====================================================================
-- Dualtron Mini · Zero 9 · Inokim Light 2 · Ninebot G30 Max · Xiaomi Mi 3 ·
-- Xiaomi Mi Essential · Xiaomi Mi Pro 2. Xiaomi 4 / 4 Pro restent NULL (à confirmer).
--
-- Bloc DO atomique : (a) garde — les 7 slugs existent, sont publiés, solid_conversion
-- NULL, sinon RAISE EXCEPTION sans rien écrire ; (b) UPDATE des 7 exactement ;
-- (c) ROW_COUNT = 7 sinon RAISE EXCEPTION (rollback du bloc).
-- Trigger trg_sync_scooter_image_url : BEFORE INSERT OR UPDATE OF images, image_url
-- (migration 20260512045011, l.56-59) → un UPDATE de solid_conversion seul ne le
-- déclenche pas. CHECK en base : IN ('yes','no') et NOT (tire_family='solid' AND 'no').
--
-- À coller dans l'éditeur SQL Lovable EN DEUX FOIS : le bloc DO, puis le SELECT.
-- =====================================================================

DO $$
DECLARE
  slugs    text[] := ARRAY['dualtron-mini', 'zero-9', 'inokim-light-2', 'g30-max',
                           'mi-3', 'mi-essential', 'mi-pro-2'];
  n_found  int;
  n_pub    int;
  n_null   int;
  n_upd    int;
  missing  text;
BEGIN
  -- (a) Garde : existence, publication, solid_conversion NULL
  SELECT count(*),
         count(*) FILTER (WHERE published),
         count(*) FILTER (WHERE solid_conversion IS NULL)
    INTO n_found, n_pub, n_null
    FROM public.scooter_models
   WHERE slug = ANY (slugs);

  IF n_found <> 7 THEN
    SELECT string_agg(s, ', ') INTO missing
      FROM unnest(slugs) AS s
     WHERE NOT EXISTS (SELECT 1 FROM public.scooter_models m WHERE m.slug = s);
    RAISE EXCEPTION 'solid_conversion yes : % slug(s) trouvé(s) sur 7 — manquant(s) : % — rien écrit', n_found, missing;
  END IF;
  IF n_pub <> 7 THEN
    RAISE EXCEPTION 'solid_conversion yes : % trotte(s) publiée(s) sur 7 — rien écrit', n_pub;
  END IF;
  IF n_null <> 7 THEN
    RAISE EXCEPTION 'solid_conversion yes : % trotte(s) à NULL sur 7 (déjà renseignée ?) — rien écrit', n_null;
  END IF;

  -- (b) UPDATE des 7 exactement (aucune autre colonne touchée)
  UPDATE public.scooter_models
     SET solid_conversion = 'yes'
   WHERE slug = ANY (slugs)
     AND published = true
     AND solid_conversion IS NULL;
  GET DIAGNOSTICS n_upd = ROW_COUNT;

  -- (c) Contrôle du nombre de lignes écrites
  IF n_upd <> 7 THEN
    RAISE EXCEPTION 'solid_conversion yes : ROW_COUNT = % au lieu de 7 — rollback', n_upd;
  END IF;

  RAISE NOTICE 'solid_conversion = yes posé sur % trotte(s)', n_upd;
END
$$;


-- =====================================================================
-- CONTRÔLE (à coller séparément) — 7 lignes à 'yes' + total_yes = 7 sur chaque ligne
-- =====================================================================
SELECT m.slug,
       m.solid_conversion,
       m.tire_family,
       m.rim_diameter_code,
       (SELECT count(*) FROM public.scooter_models WHERE solid_conversion = 'yes') AS total_yes
  FROM public.scooter_models m
 WHERE m.slug IN ('dualtron-mini', 'zero-9', 'inokim-light-2', 'g30-max',
                  'mi-3', 'mi-essential', 'mi-pro-2')
 ORDER BY m.slug;
