-- 24/10/2026 (Nolan, choix « Écran Blog dans l'admin ») : file éditoriale du blog.
-- Les articles publiés restent des fichiers public/blog/<slug>.json (versionnés, lus par le site).
-- Cette table sert à Nolan pour noter ses observations d'atelier par article et dire « prêt à rédiger » ;
-- la tâche du lundi (et toute conversation) lit les lignes « a_rediger », rédige, publie, passe en « publie ».
-- Admin uniquement.
create table if not exists public.blog_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,90}$'),
  titre text not null check (char_length(titre) between 3 and 140),
  rubrique text not null default 'Guide d''achat'
    check (rubrique in ('Guide d''achat','Comparatif','Choisir dans une gamme','Entretien')),
  statut text not null default 'idee' check (statut in ('idee','a_rediger','publie')),
  notes_atelier text,
  publie_le date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.blog_articles enable row level security;
revoke all on public.blog_articles from anon, authenticated;
grant select, insert, update, delete on public.blog_articles to authenticated;
drop policy if exists "admin gère le blog" on public.blog_articles;
create policy "admin gère le blog" on public.blog_articles for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

insert into public.blog_articles (slug, titre, rubrique, statut, publie_le) values
  ('meilleures-trottinettes-electriques-2026','Meilleures trottinettes électriques 2026 : notre sélection par usage','Guide d''achat','publie','2026-10-23'),
  ('xiaomi-trottinette-quel-modele-choisir','Xiaomi : quel modèle de trottinette choisir','Choisir dans une gamme','publie','2026-10-23'),
  ('chambre-a-air-ou-pneu-plein','Chambre à air ou pneu plein : que choisir','Entretien','publie','2026-10-23'),
  ('trottinette-electrique-moins-de-400-euros','Trottinette électrique à moins de 400 € : laquelle acheter','Guide d''achat','idee',null),
  ('meilleure-trottinette-tout-terrain','Meilleure trottinette tout-terrain : la sélection de l''atelier','Guide d''achat','idee',null),
  ('navee-quel-modele-choisir','Navee : quel modèle choisir','Choisir dans une gamme','idee',null),
  ('xiaomi-6-pro-ou-navee-gt5-pro','Xiaomi 6 Pro ou Navee GT5 Pro : le comparatif de l''atelier','Comparatif','idee',null),
  ('trottinette-10-20-km-par-jour','Quelle trottinette pour 10 à 20 km par jour','Guide d''achat','idee',null),
  ('changer-plaquettes-frein-trottinette','Changer ses plaquettes de frein : quand et comment','Entretien','idee',null),
  ('quel-chargeur-pour-ma-trottinette','Quel chargeur pour ma trottinette : tension, prise, adaptateur','Entretien','idee',null)
on conflict (slug) do nothing;
