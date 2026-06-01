-- PALIER 0 : découpler les attributs visuels du slug (R2 de l'audit catégories)
-- Idempotent. À exécuter via le SQL editor Lovable (non appliqué par CLI).
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS neon_color   text,
  ADD COLUMN IF NOT EXISTS accent_label text,
  ADD COLUMN IF NOT EXISTS lucide_icon  text;

COMMENT ON COLUMN public.categories.neon_color   IS 'Couleur néon (hex) des cartes bento. Distinct de color (accent design-system home).';
COMMENT ON COLUMN public.categories.accent_label IS 'Label d''accent (PERFORMANCE/RACING…) des cartes bento.';
COMMENT ON COLUMN public.categories.lucide_icon  IS 'Nom du composant icône Lucide (ex: Disc) pour les cartes bento catalogue.';

-- 1) accent_label : préserver d'abord toute valeur admin déjà saisie (category_images.subtitle)
UPDATE public.categories c
SET accent_label = NULLIF(TRIM(ci.subtitle), '')
FROM public.category_images ci
WHERE ci.category_id = c.id
  AND NULLIF(TRIM(ci.subtitle), '') IS NOT NULL
  AND c.accent_label IS NULL;

-- 2) Backfill EXACT depuis les maps JS (ne touche que les lignes encore NULL → zéro changement visuel)
UPDATE public.categories AS c SET
  neon_color   = COALESCE(c.neon_color,   v.neon),
  accent_label = COALESCE(c.accent_label, v.label),
  lucide_icon  = COALESCE(c.lucide_icon,  v.icon)
FROM (VALUES
  ('pneus',              '#00BCD4', 'PERFORMANCE',    'Disc'),
  ('disques-plaquettes', '#FF1744', 'RACING',         'Octagon'),
  ('chambres-air',       '#FFB300', 'ENDURANCE',      'CircleDot'),
  ('chargeurs',          '#00E676', 'HAUTE PRÉCISION','Plug'),
  ('batteries',          '#7C4DFF', 'POWER',          'Battery'),
  ('lumieres',           '#FFD600', 'VISIBILITÉ',     NULL),
  ('accessoires',        '#FF9100', 'CUSTOM',         'Backpack')
) AS v(slug, neon, label, icon)
WHERE c.slug = v.slug;
