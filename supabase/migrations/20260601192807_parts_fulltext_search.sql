-- =====================================================================
-- Recherche full-text parts via pg_trgm
--   D1 trigger build search_document | D3 pg_trgm | D4 unaccent doc+query
--   D2 JOIN compat -> scooter_models -> brands au query-time (aucun trigger compat)
--   D5 RPC unique search_parts_fuzzy | D6 scope parts uniquement
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- D4 : unaccent() est STABLE -> wrapper IMMUTABLE (dictionnaire figé),
--      cohérence document + query.
CREATE OR REPLACE FUNCTION public.f_unaccent(text)
RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE
SET search_path = public, pg_catalog
AS $$ SELECT public.unaccent('public.unaccent', $1) $$;

-- Helper DRY : document de recherche d'une pièce. Réutilisé par le trigger ET le backfill.
-- D1 : name + description + sku + meta_title + meta_description
--      + flatten(technical_metadata) + unaccent + lower.
-- E  : STABLE (string_agg non déterministe) — sans impact car colonne matérialisée.
-- D  : garde-fou jsonb (jsonb_each_text plante sur array/scalaire).
CREATE OR REPLACE FUNCTION public.part_search_text(
  p_name text, p_description text, p_sku text,
  p_meta_title text, p_meta_description text, p_tech jsonb
) RETURNS text
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT public.f_unaccent(lower(
    coalesce(p_name,'')             || ' ' ||
    coalesce(p_description,'')      || ' ' ||
    coalesce(p_sku,'')             || ' ' ||
    coalesce(p_meta_title,'')      || ' ' ||
    coalesce(p_meta_description,'') || ' ' ||
    CASE WHEN jsonb_typeof(p_tech) = 'object'
         THEN coalesce((SELECT string_agg(value, ' ') FROM jsonb_each_text(p_tech)), '')
         ELSE '' END
  ))
$$;

-- Colonne matérialisée (D1 : PAS generated column)
ALTER TABLE public.parts ADD COLUMN IF NOT EXISTS search_document text;

-- Trigger BEFORE INSERT/UPDATE : reconstruit search_document à chaque changement
-- d'un champ source.
CREATE OR REPLACE FUNCTION public.parts_search_document_trigger()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.search_document := public.part_search_text(
    NEW.name, NEW.description, NEW.sku,
    NEW.meta_title, NEW.meta_description, NEW.technical_metadata
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_parts_search_document ON public.parts;
CREATE TRIGGER trg_parts_search_document
  BEFORE INSERT OR UPDATE OF
    name, description, sku, meta_title, meta_description, technical_metadata
  ON public.parts
  FOR EACH ROW EXECUTE FUNCTION public.parts_search_document_trigger();

-- Backfill des pièces existantes (via le helper, sans toucher updated_at)
UPDATE public.parts SET search_document = public.part_search_text(
  name, description, sku, meta_title, meta_description, technical_metadata
);

-- Index GIN trgm sur la colonne matérialisée (colonne, pas expression -> simple)
CREATE INDEX IF NOT EXISTS idx_parts_search_document_trgm
  ON public.parts USING GIN (search_document gin_trgm_ops);

-- NB : index compat (part_id / scooter_model_id) DÉJÀ présents
--      (idx_part_compatibility_part / idx_part_compatibility_model, migration 20260110152102)
--      -> aucun index ajouté ici.

-- =====================================================================
-- D5 : RPC unique de recherche fuzzy
-- =====================================================================
CREATE OR REPLACE FUNCTION public.search_parts_fuzzy(
  q text,
  p_scooter_id uuid DEFAULT NULL,
  p_category_ids uuid[] DEFAULT NULL,
  p_limit int DEFAULT 24,
  p_offset int DEFAULT 0
)
RETURNS TABLE(
  id uuid, name text, slug text, price numeric,
  image_url text, images jsonb, stock_quantity int,
  is_featured boolean, created_at timestamptz,
  category_id uuid, category jsonb, rank real
)
LANGUAGE plpgsql STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_q text := public.f_unaccent(lower(trim(coalesce(q, ''))));
BEGIN
  RETURN QUERY
  WITH compat AS (
    -- D2 : JOIN compat -> scooter_models -> brands au query-time.
    -- E  : LEFT JOIN brands (ne pas perdre compat_doc si brand_id NULL).
    -- DETTE PERF (assumée) : CTE non filtré, calcule compat_doc pour toutes les pièces.
    --                        OK à l'échelle actuelle ; à filtrer plus tard si volume.
    SELECT pc.part_id,
           string_agg(
             public.f_unaccent(lower(
               coalesce(b.name,'') || ' ' || sm.name || ' ' || coalesce(sm.search_terms,'')
             )), ' '
           ) AS compat_doc
    FROM public.part_compatibility pc
    JOIN public.scooter_models sm ON sm.id = pc.scooter_model_id
    LEFT JOIN public.brands b      ON b.id = sm.brand_id
    GROUP BY pc.part_id
  )
  SELECT p.id, p.name, p.slug, p.price, p.image_url, p.images,
         p.stock_quantity, p.is_featured, p.created_at, p.category_id,
         CASE WHEN c2.id IS NULL THEN NULL ELSE jsonb_build_object(
           'id', c2.id, 'name', c2.name, 'slug', c2.slug,
           'icon', c2.icon, 'color', c2.color) END AS category,
         CASE WHEN v_q = '' THEN 1::real ELSE GREATEST(
           word_similarity(v_q, p.search_document),
           coalesce(word_similarity(v_q, cp.compat_doc), 0)
         ) END AS rank
  FROM public.parts p
  LEFT JOIN compat cp            ON cp.part_id = p.id
  LEFT JOIN public.categories c2 ON c2.id = p.category_id
  WHERE p.published = true
    AND (p_scooter_id IS NULL OR EXISTS (
          SELECT 1 FROM public.part_compatibility pc2
          WHERE pc2.part_id = p.id AND pc2.scooter_model_id = p_scooter_id))
    AND (p_category_ids IS NULL OR p.category_id = ANY(p_category_ids))
    AND (
      v_q = ''
      OR word_similarity(v_q, p.search_document) >= 0.3
      OR p.search_document ILIKE '%'||v_q||'%'
      OR word_similarity(v_q, cp.compat_doc) >= 0.3
    )
  ORDER BY rank DESC, p.is_featured DESC NULLS LAST, p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_parts_fuzzy(text, uuid, uuid[], int, int)
  TO anon, authenticated;
