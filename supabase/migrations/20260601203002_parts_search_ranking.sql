-- =====================================================================
-- Affinage du RANKING de search_parts_fuzzy (option B : exact vs related)
--   Remplace UNIQUEMENT la fonction (CREATE OR REPLACE).
--   Ne touche pas : trigger, helper part_search_text, colonne search_document.
--   Ranking pondéré par champ : nom (fort) > compat (moyen) > doc (faible).
--   Nouvelle colonne match_type : 'exact' (mot dans le nom) | 'related' (ailleurs).
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
  category_id uuid, category jsonb, rank real, match_type text
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
  ),
  scored AS (
    -- Scores par champ (chacun dans [0,1]) :
    --  - score_nom : word_similarity sur le nom, OU 1.0 si sous-chaîne exacte dans le nom.
    --  - score_compat : word_similarity sur les modèles compatibles.
    --  - score_doc : word_similarity sur le document complet (description + sku + specs).
    SELECT
      p.id, p.name, p.slug, p.price, p.image_url, p.images,
      p.stock_quantity, p.is_featured, p.created_at, p.category_id,
      CASE WHEN c2.id IS NULL THEN NULL ELSE jsonb_build_object(
        'id', c2.id, 'name', c2.name, 'slug', c2.slug,
        'icon', c2.icon, 'color', c2.color) END AS category,
      GREATEST(
        word_similarity(v_q, public.f_unaccent(lower(p.name))),
        CASE WHEN public.f_unaccent(lower(p.name)) ILIKE '%'||v_q||'%'
             THEN 1.0::real ELSE 0::real END
      ) AS score_nom,
      coalesce(word_similarity(v_q, cp.compat_doc), 0::real)        AS score_compat,
      coalesce(word_similarity(v_q, p.search_document), 0::real)    AS score_doc
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
  ),
  ranked AS (
    SELECT s.*,
      -- rank pondéré : nom prioritaire, puis compat, puis reste du document.
      CASE WHEN v_q = '' THEN 1::real
           ELSE (s.score_nom * 3 + s.score_compat * 1.5 + s.score_doc * 1)::real
      END AS rank_val,
      -- match_type : 'exact' si le mot est dans le nom, 'related' sinon.
      CASE WHEN v_q = '' OR s.score_nom > 0 THEN 'exact' ELSE 'related' END AS match_type_val
    FROM scored s
  )
  SELECT r.id, r.name, r.slug, r.price, r.image_url, r.images,
         r.stock_quantity, r.is_featured, r.created_at, r.category_id,
         r.category, r.rank_val AS rank, r.match_type_val AS match_type
  FROM ranked r
  ORDER BY (r.match_type_val = 'exact') DESC,  -- 'exact' avant 'related'
           r.rank_val DESC,
           r.is_featured DESC NULLS LAST,
           r.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_parts_fuzzy(text, uuid, uuid[], int, int)
  TO anon, authenticated;
