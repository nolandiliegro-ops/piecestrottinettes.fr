-- Migration : Extension table brands pour pages marques éditoriales
-- Date : 2026-05-22
-- Objectif : Ajouter colonnes éditoriales + seed Kukirin manquant + UPDATE 5 marques existantes
-- Rollback : DROP COLUMN x11 + DELETE FROM brands WHERE slug='kukirin'

-- ============================================================================
-- PARTIE 1 : ALTER TABLE brands — ajout colonnes éditoriales
-- ============================================================================

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

-- Commentaires colonnes pour clarté admin/dev
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

-- ============================================================================
-- PARTIE 2 : INSERT Kukirin (marque manquante)
-- ============================================================================

INSERT INTO public.brands (name, slug, published, display_order)
VALUES ('Kukirin', 'kukirin', false, 5)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- PARTIE 3 : UPDATE des 6 marques avec accent_color + tagline + country + founded_year + display_order + published
-- ============================================================================

-- Dualtron (Corée du Sud, MiniMotors, 1999)
UPDATE public.brands
SET
  accent_color = '#DC2626',
  tagline = 'Performance extrême sans compromis',
  country = 'Corée du Sud',
  founded_year = 1999,
  display_order = 1,
  published = true
WHERE slug = 'dualtron';

-- Kaabo (Chine, 2013)
UPDATE public.brands
SET
  accent_color = '#1F2937',
  tagline = 'Tout-terrain, sans limites',
  country = 'Chine',
  founded_year = 2013,
  display_order = 2,
  published = true
WHERE slug = 'kaabo';

-- Segway (USA/Chine, 1999)
UPDATE public.brands
SET
  accent_color = '#2563EB',
  tagline = 'Urbain intelligent',
  country = 'Chine',
  founded_year = 1999,
  display_order = 3,
  published = true
WHERE slug = 'segway';

-- Xiaomi (Chine, 2010)
UPDATE public.brands
SET
  accent_color = '#FF6B35',
  tagline = 'Le daily abordable',
  country = 'Chine',
  founded_year = 2010,
  display_order = 4,
  published = true
WHERE slug = 'xiaomi';

-- Kukirin (Chine, 2018) — reste published=false tant que pas de contenu
UPDATE public.brands
SET
  accent_color = '#8B5CF6',
  tagline = 'Gaming, vitesse, style',
  country = 'Chine',
  founded_year = 2018,
  display_order = 5
WHERE slug = 'kukirin';

-- Ninebot (Chine, 2012 — fusionnée avec Segway en 2015)
UPDATE public.brands
SET
  accent_color = '#10B981',
  tagline = 'Compact, pratique, fiable',
  country = 'Chine',
  founded_year = 2012,
  display_order = 6,
  published = true
WHERE slug = 'ninebot';

-- ============================================================================
-- VÉRIFICATION FINALE (à exécuter manuellement post-migration via Lovable Chat)
-- SELECT slug, name, accent_color, tagline, published, display_order FROM brands ORDER BY display_order;
-- Attendu : 6 lignes, 5 published=true, 1 (kukirin) published=false
-- ============================================================================
