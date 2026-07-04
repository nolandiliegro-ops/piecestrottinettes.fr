-- Parité repo : reflète EXACTEMENT le SQL déjà appliqué en base via le SQL editor Lovable.
-- Non ré-exécuté ici (idempotent : IF NOT EXISTS + UPDATE ciblés par slug).
-- Ajoute categories.spec_type (famille de specs de la catégorie) pour piloter
-- le matching électrique / pneu côté edge functions.

ALTER TABLE categories ADD COLUMN IF NOT EXISTS spec_type text NOT NULL DEFAULT 'generic' CHECK (spec_type IN ('charger','controller','battery','display','tire','generic'));
UPDATE categories SET spec_type = 'charger' WHERE slug = 'chargeurs';
UPDATE categories SET spec_type = 'tire' WHERE slug IN ('pneus-pleins','pneus','chambres-a-air');
