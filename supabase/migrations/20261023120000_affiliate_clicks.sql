-- 23/10/2026 (Nolan, GO « tout cette semaine » sur le lot SEO) : compteur des clics vers les partenaires.
-- Chaque clic sur un lien rel="sponsored" du site (fiche trottinette, showroom, article de blog) écrit une ligne.
-- Le lien reste direct vers le partenaire (pas de redirection /go/ : aucun saut de page, le suivi Awin/GoAffPro
-- reste intact) ; le clic est enregistré en parallèle par src/lib/affiliateClicks.ts.
-- Visiteurs : INSERT seulement (aucune lecture). Admin : lecture.
create table if not exists public.affiliate_clicks (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  page_path text not null check (char_length(page_path) between 1 and 300),
  target_host text not null check (char_length(target_host) between 1 and 120),
  shop_host text check (shop_host is null or char_length(shop_host) <= 120),
  scooter_slug text check (scooter_slug is null or char_length(scooter_slug) <= 120),
  placement text check (placement is null or char_length(placement) <= 40)
);
create index if not exists affiliate_clicks_created_idx on public.affiliate_clicks (created_at desc);
create index if not exists affiliate_clicks_scooter_idx on public.affiliate_clicks (scooter_slug);

alter table public.affiliate_clicks enable row level security;
revoke all on public.affiliate_clicks from anon, authenticated;
grant insert on public.affiliate_clicks to anon, authenticated;
grant select on public.affiliate_clicks to authenticated;

drop policy if exists "tout visiteur enregistre un clic partenaire" on public.affiliate_clicks;
create policy "tout visiteur enregistre un clic partenaire" on public.affiliate_clicks for insert
  to anon, authenticated with check (true);

drop policy if exists "admin lit les clics partenaires" on public.affiliate_clicks;
create policy "admin lit les clics partenaires" on public.affiliate_clicks for select
  to authenticated using (public.has_role(auth.uid(), 'admin'::public.app_role));
