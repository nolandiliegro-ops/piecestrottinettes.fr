-- Clé « prise de charge » côté trottinette (décision Nolan 11/10/2026).
-- Un chargeur ne s'affiche que si le modèle a le bon voltage ET une prise servie
-- par le chargeur. Plusieurs prises possibles par modèle (ex. Dualtron GX16 ou LP16
-- selon la série). Prise inconnue → aucun chargeur proposé.
-- Idempotent : relançable sans effet.

create table if not exists public.fitment_charge_connectors (
  code text primary key,
  label_client text not null,
  note text
);
alter table public.fitment_charge_connectors enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'fitment_charge_connectors' and policyname = 'Public can read fitment_charge_connectors') then
    create policy "Public can read fitment_charge_connectors" on public.fitment_charge_connectors for select using (true);
  end if;
end $$;
revoke insert, update, delete on public.fitment_charge_connectors from anon, authenticated;

insert into public.fitment_charge_connectors (code, label_client, note) values
  ('GX16-3',     'GX16 rond 3 broches',            'Prise la plus courante (Kaabo, Zero, Vsett, Dualtron anciennes séries)'),
  ('GX16-4',     'GX16 rond 4 broches',            null),
  ('GX12-3',     'GX12 rond 3 broches',            null),
  ('LP16-3',     'LP16 étanche 3 broches',         'Minimotors / Dualtron récentes ; ne s''accouple pas avec GX16'),
  ('DC5.5x2.1',  'Jack DC 5,5 x 2,1 mm',           'Petits modèles (Urbanglide…)'),
  ('DC5.5x2.5',  'Jack DC 5,5 x 2,5 mm',           'Se confond avec 2,1 : seul le trou central diffère (Wispeed…)'),
  ('RCA',        'Rond 8 mm type Xiaomi (dit RCA)','Xiaomi M365/Pro 2/Essential/Mi 3, port externe Ninebot Max ; nom du catalogue PT'),
  ('XIAOMI-MAG', 'Magnétique Xiaomi',              'Xiaomi Electric Scooter 4 Pro (mi.com)'),
  ('NIU',        'Prise NIU',                      'Prise propre NIU ; chargeurs KQi3 ≠ KQi Air / 300'),
  ('INOKIM',     'Prise Inokim',                   'Prise propre Inokim (Light 2, Quick 4, OX)'),
  ('ETWOW-5',    'E-Twow 5 mm (nouvelle gén.)',    null),
  ('ETWOW-8',    'E-Twow 8 mm (ancienne gén.)',    null),
  ('XLR-3',      'XLR 3 broches',                  null),
  ('IEC',        'Câble secteur IEC (chargeur interne)', 'Ninebot Max G30/G2 : chargeur intégré, câble secteur seul'),
  ('XT90',       'XT90',                           null)
on conflict (code) do nothing;

alter table public.scooter_models add column if not exists charge_connectors text[];

-- Garde : chaque prise d'un modèle doit exister au référentiel (pas de faute de frappe silencieuse).
create or replace function public.verifier_charge_connectors()
returns trigger language plpgsql security definer set search_path = public as $$
declare bad text;
begin
  if new.charge_connectors is null then return new; end if;
  select c into bad from unnest(new.charge_connectors) c
   where not exists (select 1 from public.fitment_charge_connectors f where f.code = c) limit 1;
  if bad is not null then
    raise exception 'Prise de charge inconnue « % » pour %, codes valides dans fitment_charge_connectors', bad, new.slug
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

drop trigger if exists trg_verifier_charge_connectors on public.scooter_models;
create trigger trg_verifier_charge_connectors
  before insert or update of charge_connectors on public.scooter_models
  for each row execute function public.verifier_charge_connectors();
