DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'brands'
      AND column_name = 'expert_note'
  ) THEN
    ALTER TABLE public.brands RENAME COLUMN expert_note TO editorial_verdict;
  END IF;
END $$;

COMMENT ON COLUMN public.brands.editorial_verdict IS
  'Verdict rédactionnel piecestrottinettes (marque média neutre) — markdown supporté';

ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS faq                 JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS pros                JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS cons                JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS awards              JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS gallery             JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS videos              JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS articles            JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS related_brand_slugs JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS sources             JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS last_verified_at    TIMESTAMPTZ;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS editorial_summary   TEXT;

COMMENT ON COLUMN public.brands.faq IS 'FAQ Schema.org : [{question, answer, sources[]}]. Pas de source = pas affiché.';
COMMENT ON COLUMN public.brands.pros IS 'Points forts sourcés : [{text, source_url}]. Pas de source = pas affiché.';
COMMENT ON COLUMN public.brands.cons IS 'Points faibles sourcés : [{text, source_url}]. Pas de source = pas affiché.';
COMMENT ON COLUMN public.brands.awards IS 'Récompenses : [{name, year, source_url}].';
COMMENT ON COLUMN public.brands.gallery IS 'Galerie photos : [{url, alt, credit}].';
COMMENT ON COLUMN public.brands.videos IS 'Vidéos reviews/tests YouTube : [{youtube_id, title, channel, type}].';
COMMENT ON COLUMN public.brands.articles IS 'Articles presse : [{title, url, source, date}].';
COMMENT ON COLUMN public.brands.related_brand_slugs IS 'Maillage interne : [slug1, slug2, ...] de marques liées (concurrents/voisines).';
COMMENT ON COLUMN public.brands.sources IS 'Sources globales agrégées : [{url, title, used_for}].';
COMMENT ON COLUMN public.brands.last_verified_at IS 'Date de dernière vérification du contenu rédactionnel (NULL si jamais vérifié).';
COMMENT ON COLUMN public.brands.editorial_summary IS 'Résumé éditorial court (1-2 phrases) — cards listing + meta description.';