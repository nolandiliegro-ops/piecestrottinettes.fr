-- Prix de vente piloté par Airtable, avec override admin prioritaire.
-- price_override = true  → prix piloté manuellement dans l'admin ; le sync Airtable
--                          (bulk-insert-parts) ne doit JAMAIS l'écraser.
-- price_override = false → prix piloté par Airtable (champ "Prix affiché client TTC").
-- Même principe "Option B" que pour les images (n'agir que si la valeur n'est pas déjà posée).

ALTER TABLE public.parts
  ADD COLUMN IF NOT EXISTS price_override BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.parts.price_override IS
  'true = prix piloté manuellement dans l''admin ; le sync Airtable ne doit jamais l''écraser. false = prix piloté par Airtable (Prix affiché client TTC).';
