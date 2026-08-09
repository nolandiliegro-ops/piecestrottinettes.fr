-- parts.slug_locked_at — verrou write-once du slug des pièces publiées (commit #8).
--
-- Ferme la fenêtre dépublication → republication laissée ouverte par le critère
-- published===true du gel (8166257) : une pièce dépubliée perdait son gel alors que
-- son URL /piece/<slug> reste indexée. Critère élargi côté bulk-insert-parts :
--   freezeSlug = (published === true OU slug_locked_at != null) && !allowsOverwrite(part, "slug")
--
-- À exécuter dans le SQL editor Lovable, AVANT le déploiement de l'Edge Function
-- (les lookups de bulk-insert-parts ignorent `error` : colonne absente du select
-- → existing=null partout → tout traité en INSERT → rafale de rejets unique).
-- 100% idempotente : rejouable sans effet. Aucun CONCURRENTLY, aucune commande
-- hors transaction (le SQL editor enveloppe tout en transaction).

-- (1) Colonne
ALTER TABLE public.parts ADD COLUMN IF NOT EXISTS slug_locked_at timestamptz;

COMMENT ON COLUMN public.parts.slug_locked_at IS
  'Date de premier passage a published=true. Write-once (trigger trg_set_slug_locked_at). '
  'Non NULL => slug gele par bulk-insert-parts, meme piece depubliee.';

-- (2) Backfill des pièces déjà publiées, à now() — PAS updated_at (aplati par le
-- sync du 09/08, la valeur ne signifie plus rien).
-- update_parts_updated_at (BEFORE UPDATE, toutes colonnes) est neutralisé LE TEMPS
-- DU BACKFILL pour ne pas bumper updated_at sur ~187 lignes (dette lastmod du
-- sitemap : gen-sitemap.mjs émet lastmod = updated_at). Transactionnel : un échec
-- rollback tout, trigger réactivé compris.
-- ACCESS EXCLUSIVE lock le temps du backfill (~192 lignes) ; si le SQL editor
-- renvoie 'must be owner of relation parts', supprimer les deux ALTER et accepter
-- le bump updated_at.
ALTER TABLE public.parts DISABLE TRIGGER update_parts_updated_at;

UPDATE public.parts
SET slug_locked_at = now()
WHERE published = true
  AND slug_locked_at IS NULL;

ALTER TABLE public.parts ENABLE TRIGGER update_parts_updated_at;

-- (3) Fonction + trigger. Write-once et monotone : la valeur ne peut jamais être
-- effacée ni reculée — même si un payload envoie slug_locked_at = null, même si
-- published repasse à false. Pas de SECURITY DEFINER (la fonction ne touche que
-- NEW/OLD, aucune table) ; SET search_path conservé (anti-hijack + linter).
CREATE OR REPLACE FUNCTION public.set_slug_locked_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- INSERT publié : verrou immédiat. Une valeur fournie (restauration de dump)
    -- est conservée.
    IF NEW.published IS TRUE THEN
      NEW.slug_locked_at := COALESCE(NEW.slug_locked_at, now());
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE. Surensemble volontaire de la transition published false→true :
  -- toute ligne publiée sans verrou est verrouillée au premier UPDATE qui la
  -- touche (auto-guérison d'une ligne qui aurait raté le backfill).
  IF OLD.slug_locked_at IS NOT NULL THEN
    NEW.slug_locked_at := OLD.slug_locked_at;
  ELSIF NEW.published IS TRUE THEN
    NEW.slug_locked_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_slug_locked_at ON public.parts;
CREATE TRIGGER trg_set_slug_locked_at
  BEFORE INSERT OR UPDATE ON public.parts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_slug_locked_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- REQUÊTES DE CONTRÔLE — à jouer à la main, ne font pas partie de la migration.
--
-- AVANT
--   select count(*) from parts where published = true;
--   select count(distinct updated_at), max(updated_at) from parts;
--   select id, slug, sku, published, technical_metadata->>'airtable_id' as airtable_id
--     from parts where published = false order by slug;   -- <- sélection du cobaye
-- APRES
--   select count(*) from parts where published = true and slug_locked_at is null;   -- 0
--   select count(*) from parts where published = false and slug_locked_at is not null; -- 0
--   select count(distinct slug_locked_at) from parts where slug_locked_at is not null; -- 1
--   select count(distinct updated_at), max(updated_at) from parts;  -- identique a AVANT
--   select tgname, tgenabled from pg_trigger
--     where tgrelid = 'public.parts'::regclass and not tgisinternal;  -- tgenabled = 'O'
-- WRITE-ONCE UNITAIRE (a jouer dans une transaction avec ROLLBACK final, non destructif)
--   begin;
--     update parts set slug_locked_at = null where slug = '<cobaye>';        -- doit survivre
--     update parts set published = false where slug = '<cobaye>';            -- doit rester
--     update parts set published = true  where slug = '<cobaye>';            -- date d'origine
--     select slug, published, slug_locked_at from parts where slug = '<cobaye>';
--   rollback;
