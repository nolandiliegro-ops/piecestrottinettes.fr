-- Palier 3 : colonne description éditoriale pour la page catégorie front /categorie/:slug.
-- Exécutée à la main dans le SQL editor Lovable ; ce fichier assure la traçabilité repo.
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS description text;

COMMENT ON COLUMN public.categories.description IS
  'Texte éditorial long de la page catégorie front /categorie/:slug (Palier 3, nullable).';
