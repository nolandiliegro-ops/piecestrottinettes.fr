-- 10/10/2026 — décision de Nolan : l'ampérage garde sa décimale (23,4 Ah) au lieu d'être vide.
-- Déjà appliquée en prod via query_database le 10/10 (backup public._backup_amperage_20261010, RLS activée,
-- 0 valeur modifiée sur 48). Idempotente : sans effet si la colonne est déjà numeric.
do $$ begin
  if (select data_type from information_schema.columns
      where table_schema='public' and table_name='scooter_models' and column_name='amperage') = 'integer' then
    alter table public.scooter_models alter column amperage type numeric using amperage::numeric;
  end if;
end $$;
