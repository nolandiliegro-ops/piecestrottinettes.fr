-- PALIER 1 : categories devient la SOURCE CANONIQUE de l'image et de ses métadonnées (R1 de l'audit).
-- Migre alt_text / seo_name depuis category_images vers categories + aligne image_url.
-- category_images N'EST PAS supprimée (rollback) : drop reporté au Palier 2.
-- Idempotent. À exécuter via le SQL editor Lovable (non appliqué par CLI).
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS alt_text text,
  ADD COLUMN IF NOT EXISTS seo_name text;

COMMENT ON COLUMN public.categories.alt_text IS 'Texte alternatif SEO de l''image de catégorie (migré depuis category_images, Palier 1).';
COMMENT ON COLUMN public.categories.seo_name IS 'Nom de fichier SEO de l''image de catégorie (migré depuis category_images, Palier 1).';

-- 1) Backfill alt_text / seo_name : ne touche que les lignes encore NULL côté categories,
--    et n'écrit que des valeurs non vides (NULLIF TRIM '' → NULL).
UPDATE public.categories c
SET alt_text = COALESCE(c.alt_text, NULLIF(TRIM(ci.alt_text), '')),
    seo_name = COALESCE(c.seo_name, NULLIF(TRIM(ci.seo_name), ''))
FROM public.category_images ci
WHERE ci.category_id = c.id;

-- 2) Backfill image_url : category_images GAGNE sur divergence (décision Palier 1, GO global).
--    Garde-fou : on n'écrase JAMAIS une image categories par un NULL/vide.
UPDATE public.categories c
SET image_url = ci.image_url
FROM public.category_images ci
WHERE ci.category_id = c.id
  AND NULLIF(TRIM(ci.image_url), '') IS NOT NULL
  AND ci.image_url IS DISTINCT FROM c.image_url;
