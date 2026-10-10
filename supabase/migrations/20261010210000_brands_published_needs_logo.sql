-- 10/10/2026 — Décision de Nolan : une marque publiée a TOUJOURS un logo (page d'accueil comprise).
-- Garde-fou en base, pas dans le code : publier une marque sans logo_url est refusé.
-- Rollback : alter table public.brands drop constraint if exists brands_publiee_exige_logo;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'brands_publiee_exige_logo') then
    alter table public.brands add constraint brands_publiee_exige_logo
      check (not published or (logo_url is not null and btrim(logo_url) <> ''));
  end if;
end $$;
