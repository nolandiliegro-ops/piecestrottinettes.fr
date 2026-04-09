
-- Add published column to scooter_models
ALTER TABLE public.scooter_models ADD COLUMN published boolean NOT NULL DEFAULT true;

-- Update search_scooter_fuzzy to only return published models
CREATE OR REPLACE FUNCTION public.search_scooter_fuzzy(search_query text)
 RETURNS TABLE(id uuid, name text, slug text, brand_name text, similarity real)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT 
    sm.id,
    sm.name,
    sm.slug,
    b.name AS brand_name,
    GREATEST(
      similarity(b.name || ' ' || sm.name, search_query),
      similarity(sm.name, search_query),
      COALESCE(similarity(sm.search_terms, search_query), 0)
    ) AS similarity
  FROM scooter_models sm
  JOIN brands b ON sm.brand_id = b.id
  WHERE 
    sm.published = true
    AND (
      (b.name || ' ' || sm.name) % search_query
      OR sm.name % search_query
      OR sm.search_terms % search_query
    )
  ORDER BY similarity DESC
  LIMIT 5;
$function$;
