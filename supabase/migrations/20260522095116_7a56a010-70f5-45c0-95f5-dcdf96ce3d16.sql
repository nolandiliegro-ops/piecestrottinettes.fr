-- Migration : Extension table brands pour pages marques éditoriales

ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS accent_color TEXT;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS hero_image_url TEXT;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS youtube_video_id TEXT;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS expert_note TEXT;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS founded_year INTEGER;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.brands.description IS 'Story éditoriale longue, markdown supporté, affichée sur /marque/:slug';
COMMENT ON COLUMN public.brands.tagline IS 'Accroche courte (3-6 mots) affichée sous le logo';
COMMENT ON COLUMN public.brands.accent_color IS 'Couleur hex (ex: #DC2626) utilisée pour glow/pastilles';
COMMENT ON COLUMN public.brands.hero_image_url IS 'Image bannière page marque, optionnelle';
COMMENT ON COLUMN public.brands.youtube_video_id IS 'ID YouTube vidéo présentation marque (ex: dQw4w9WgXcQ)';
COMMENT ON COLUMN public.brands.expert_note IS 'Avis expert Steedy Trott — markdown supporté';
COMMENT ON COLUMN public.brands.country IS 'Pays d''origine (ex: Corée du Sud)';
COMMENT ON COLUMN public.brands.founded_year IS 'Année de fondation';
COMMENT ON COLUMN public.brands.website_url IS 'Site officiel de la marque';
COMMENT ON COLUMN public.brands.published IS 'Marque visible sur le site (page + index + grille home)';
COMMENT ON COLUMN public.brands.display_order IS 'Ordre d''affichage sur la home et /marques (ASC)';

INSERT INTO public.brands (name, slug, published, display_order)
VALUES ('Kukirin', 'kukirin', false, 5)
ON CONFLICT (slug) DO NOTHING;

UPDATE public.brands SET accent_color='#DC2626', tagline='Performance extrême sans compromis', country='Corée du Sud', founded_year=1999, display_order=1, published=true WHERE slug='dualtron';
UPDATE public.brands SET accent_color='#1F2937', tagline='Tout-terrain, sans limites', country='Chine', founded_year=2013, display_order=2, published=true WHERE slug='kaabo';
UPDATE public.brands SET accent_color='#2563EB', tagline='Urbain intelligent', country='Chine', founded_year=1999, display_order=3, published=true WHERE slug='segway';
UPDATE public.brands SET accent_color='#FF6B35', tagline='Le daily abordable', country='Chine', founded_year=2010, display_order=4, published=true WHERE slug='xiaomi';
UPDATE public.brands SET accent_color='#8B5CF6', tagline='Gaming, vitesse, style', country='Chine', founded_year=2018, display_order=5 WHERE slug='kukirin';
UPDATE public.brands SET accent_color='#10B981', tagline='Compact, pratique, fiable', country='Chine', founded_year=2012, display_order=6, published=true WHERE slug='ninebot';