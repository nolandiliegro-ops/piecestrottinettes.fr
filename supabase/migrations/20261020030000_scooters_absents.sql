-- 20/10/2026 (Nolan) : « Absentes du site » — trottinettes vues au magasin et absentes du catalogue.
-- Remplit la file d'import ; lue et écrite depuis l'admin (Studio Compat). Admin uniquement.
create table if not exists public.scooters_absents (
  id uuid primary key default gen_random_uuid(),
  brand_name text,
  model_name text not null check (length(trim(model_name)) > 0),
  notes text,
  status text not null default 'a_importer' check (status in ('a_importer', 'importee', 'ecartee')),
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid()
);
-- Pas de doublon marque + modèle (garde-fou en base, pas dans le code)
create unique index if not exists scooters_absents_uniq
  on public.scooters_absents (lower(coalesce(brand_name, '')), lower(model_name));

alter table public.scooters_absents enable row level security;
drop policy if exists "admin gère les absentes" on public.scooters_absents;
create policy "admin gère les absentes" on public.scooters_absents
  for all
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Relevé du 20/10 : gamme actuelle urbanglide.com absente du site
insert into public.scooters_absents (brand_name, model_name, notes) values
  ('Urbanglide', '85 Lite', 'Gamme urbanglide.com, relevé du 20/10'),
  ('Urbanglide', '85 Evo Go', 'Gamme urbanglide.com, relevé du 20/10'),
  ('Urbanglide', '100 Evo Pro', 'Gamme urbanglide.com, relevé du 20/10'),
  ('Urbanglide', 'EON X', 'Gamme urbanglide.com, relevé du 20/10'),
  ('Urbanglide', 'EON X Air', 'Gamme urbanglide.com, relevé du 20/10'),
  ('Urbanglide', 'GT Pro', 'Gamme urbanglide.com, relevé du 20/10'),
  ('Urbanglide', '800 GT', 'Gamme urbanglide.com, relevé du 20/10'),
  ('Urbanglide', '1000GT 2x2', 'Gamme urbanglide.com, relevé du 20/10')
on conflict do nothing;
