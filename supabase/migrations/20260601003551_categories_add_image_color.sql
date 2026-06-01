-- Fondation "catégories enrichies" : image + couleur par catégorie.
-- Colonnes nullable, sans default → additif, aucun impact sur les lignes existantes.
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS color text;

COMMENT ON COLUMN public.categories.image_url IS
  'Illustration de la catégorie (bucket category-images, sous-dossier tiles/). Optionnelle.';
COMMENT ON COLUMN public.categories.color IS
  'Couleur d''accent hex (ex: #FF6600) pour la tuile catégorie. Optionnelle.';
