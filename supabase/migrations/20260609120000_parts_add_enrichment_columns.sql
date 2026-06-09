-- Lot 4a : 3 colonnes d'enrichissement fournisseur sur la table parts.
-- Alimentées par le futur push Airtable → Supabase (champs écrits par enrich.js :
-- EAN, Caractéristiques, Compatibilité source).
-- Additif uniquement : aucune colonne existante n'est modifiée, toutes nullable.
-- Exécutée à la main dans le SQL editor Lovable ; ce fichier assure la traçabilité repo.
ALTER TABLE public.parts
  ADD COLUMN IF NOT EXISTS ean text,
  ADD COLUMN IF NOT EXISTS characteristics text,
  ADD COLUMN IF NOT EXISTS compatibility_source text;

COMMENT ON COLUMN public.parts.ean IS
  'Code EAN/GTIN de la pièce, extrait de la fiche fournisseur (Airtable « EAN », nullable).';
COMMENT ON COLUMN public.parts.characteristics IS
  'Caractéristiques techniques brutes de la fiche fournisseur (Airtable « Caractéristiques », nullable).';
COMMENT ON COLUMN public.parts.compatibility_source IS
  'Compatibilité telle qu''annoncée par le fournisseur, texte de référence non normalisé (Airtable « Compatibilité source », nullable).';
