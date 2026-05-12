CREATE OR REPLACE FUNCTION public.sync_scooter_image_url()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_primary_url text;
  v_first_url   text;
  v_images      jsonb;
BEGIN
  IF jsonb_typeof(NEW.images) = 'string' THEN
    BEGIN
      v_images := (NEW.images #>> '{}')::jsonb;
    EXCEPTION WHEN others THEN
      v_images := NULL;
    END;
  ELSE
    v_images := NEW.images;
  END IF;

  IF v_images IS NULL
     OR jsonb_typeof(v_images) <> 'array'
     OR jsonb_array_length(v_images) = 0
  THEN
    RETURN NEW;
  END IF;

  SELECT elem->>'url'
    INTO v_primary_url
  FROM jsonb_array_elements(v_images) elem
  WHERE (elem->>'is_primary')::boolean IS TRUE
    AND COALESCE(elem->>'url', '') <> ''
  LIMIT 1;

  IF v_primary_url IS NULL THEN
    SELECT elem->>'url'
      INTO v_first_url
    FROM jsonb_array_elements(v_images) elem
    WHERE COALESCE(elem->>'url', '') <> ''
    ORDER BY COALESCE((elem->>'position')::int, 999999)
    LIMIT 1;
  END IF;

  IF v_primary_url IS NOT NULL THEN
    NEW.image_url := v_primary_url;
  ELSIF v_first_url IS NOT NULL THEN
    NEW.image_url := v_first_url;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_scooter_image_url ON public.scooter_models;

CREATE TRIGGER trg_sync_scooter_image_url
BEFORE INSERT OR UPDATE OF images, image_url ON public.scooter_models
FOR EACH ROW
EXECUTE FUNCTION public.sync_scooter_image_url();

UPDATE public.scooter_models
SET images = images
WHERE image_url IS NULL
  AND images IS NOT NULL
  AND jsonb_typeof(images) = 'array'
  AND jsonb_array_length(images) > 0;