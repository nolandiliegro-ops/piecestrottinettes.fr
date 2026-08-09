-- part_slug_aliases — alias de slug + enregistrement automatique (M2 #4/#5).
--
-- DÉJÀ APPLIQUÉE à la main dans le SQL editor Lovable. Ce fichier ne fait que
-- versionner l'état en base ; il n'est pas destiné à être rejoué, mais reste
-- 100% idempotent (rejouable sans effet).
--
-- Complète le gel du slug (8166257, f23d25d, 4cc444b) : le gel empêche une URL
-- indexée de bouger, cette table rattrape celles qui ont bougé avant lui.

-- (1) Table
CREATE TABLE IF NOT EXISTS public.part_slug_aliases (
  alias      text PRIMARY KEY,
  part_id    uuid NOT NULL REFERENCES public.parts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_part_slug_aliases_part_id
  ON public.part_slug_aliases (part_id);

-- (2) RLS — lecture publique seule (le front résout un alias sans être authentifié).
ALTER TABLE public.part_slug_aliases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read slug aliases" ON public.part_slug_aliases;
CREATE POLICY "Public can read slug aliases"
  ON public.part_slug_aliases
  FOR SELECT
  USING (true);

-- (3) Enregistrement de l'alias au renommage d'un slug déjà verrouillé.
-- ON CONFLICT : un alias peut être réattribué si le slug repasse d'une pièce à
-- une autre. Le DELETE final empêche un alias égal au slug courant de survivre,
-- ce qui produirait une redirection sur elle-même.
CREATE OR REPLACE FUNCTION public.record_part_slug_alias()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.part_slug_aliases (alias, part_id)
  VALUES (OLD.slug, NEW.id)
  ON CONFLICT (alias) DO UPDATE SET part_id = EXCLUDED.part_id;

  DELETE FROM public.part_slug_aliases WHERE alias = NEW.slug;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_record_part_slug_alias ON public.parts;
CREATE TRIGGER trg_record_part_slug_alias
  AFTER UPDATE OF slug ON public.parts
  FOR EACH ROW
  WHEN (OLD.slug IS DISTINCT FROM NEW.slug AND OLD.slug_locked_at IS NOT NULL)
  EXECUTE FUNCTION public.record_part_slug_alias();
