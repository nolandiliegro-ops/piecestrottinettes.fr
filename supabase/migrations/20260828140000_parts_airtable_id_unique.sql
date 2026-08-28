-- parts_airtable_id_unique — identité stable Airtable (M5 #1).
--
-- DÉJÀ APPLIQUÉE à la main dans le SQL editor Lovable. Ce fichier ne fait que
-- versionner l'état en base ; il n'est pas destiné à être rejoué, mais reste
-- 100% idempotent (rejouable sans effet).
--
-- Précondition vérifiée avant application : aucun airtable_id non vide en double
-- dans parts (cf. bloc DO de contrôle ci-dessous, à passer EN PREMIER).
-- Prérequis du match par airtable_id dans bulk-insert-parts (M5 #2) : garantit
-- que le lookup .maybeSingle() ne peut jamais tomber sur 2 lignes — sinon il
-- renvoie PGRST116 et le match se dégrade en silence vers la cascade sku/slug.
--
-- Pas de CONCURRENTLY : le SQL editor Lovable enveloppe en transaction, et
-- CREATE INDEX CONCURRENTLY y est interdit. Contrepartie assumée : verrou
-- ACCESS EXCLUSIVE sur parts le temps de la construction (table de quelques
-- centaines de lignes → quelques millisecondes).

-- (0) Contrôle bloquant. Silence = propre. Exception = ne pas créer l'index.
DO $$
DECLARE dup_count int;
BEGIN
  SELECT count(*) INTO dup_count
  FROM (
    SELECT technical_metadata->>'airtable_id'
    FROM public.parts
    WHERE technical_metadata->>'airtable_id' IS NOT NULL
      AND technical_metadata->>'airtable_id' <> ''
    GROUP BY 1 HAVING count(*) > 1
  ) d;

  IF dup_count > 0 THEN
    RAISE EXCEPTION
      'STOP : % airtable_id en double dans parts — index unique impossible', dup_count;
  END IF;

  RAISE NOTICE 'OK : aucun airtable_id en double, index unique posable.';
END $$;

-- (1) Index unique partiel sur l'expression.
-- Double parenthèses : index sur expression, pas sur colonne.
-- Partiel : les pièces hors Airtable (airtable_id absent) restent hors index.
-- Les deux conditions sont nécessaires — NULL ne collisionne jamais en unique,
-- mais plusieurs chaînes vides collisionneraient.
CREATE UNIQUE INDEX IF NOT EXISTS parts_airtable_id_unique
  ON public.parts ((technical_metadata->>'airtable_id'))
  WHERE technical_metadata->>'airtable_id' IS NOT NULL
    AND technical_metadata->>'airtable_id' <> '';

-- (2) Vérification — IF NOT EXISTS matche sur le NOM seul, pas sur la définition :
-- un index homonyme mal défini ne serait pas remplacé, et l'instruction ne dirait
-- rien. Contrôler l'expression et le WHERE réellement en base :
--   SELECT indexdef FROM pg_indexes
--   WHERE schemaname = 'public' AND indexname = 'parts_airtable_id_unique';
