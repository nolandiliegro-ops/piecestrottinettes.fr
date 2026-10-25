-- Carte Rider « Story » (choix de Nolan, 25/10/2026) — lot claude/PT-lot-carte-rider-story.md
-- 1) Emplacements sur la carte : 5 « à moi » + 5 « je kiffe » choisis par le rider.
--    La limite est tenue par la base (borne 1..5 + index unique), pas par le code.
alter table public.user_garage add column if not exists card_slot smallint
  check (card_slot between 1 and 5);
create unique index if not exists user_garage_card_slot_uniq
  on public.user_garage (user_id, is_owned, card_slot) where card_slot is not null;

-- 2) Commentaires sur la carte.
create table if not exists public.rider_card_comments (
  id uuid primary key default gen_random_uuid(),
  card_owner_id uuid not null references public.profiles(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 280),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists rider_card_comments_owner_idx on public.rider_card_comments (card_owner_id, created_at desc);
alter table public.rider_card_comments enable row level security;

drop policy if exists "Commentaires visibles des cartes publiques" on public.rider_card_comments;
create policy "Commentaires visibles des cartes publiques" on public.rider_card_comments
  for select to anon, authenticated
  using (
    (hidden = false and card_owner_id in (select id from public.profiles where is_public = true))
    or auth.uid() = card_owner_id
    or auth.uid() = author_id
    or public.has_role(auth.uid(), 'admin'::app_role)
  );
drop policy if exists "Un rider connecté commente en son nom" on public.rider_card_comments;
create policy "Un rider connecté commente en son nom" on public.rider_card_comments
  for insert to authenticated
  with check (auth.uid() = author_id and hidden = false);
drop policy if exists "Auteur ou propriétaire supprime" on public.rider_card_comments;
create policy "Auteur ou propriétaire supprime" on public.rider_card_comments
  for delete to authenticated
  using (auth.uid() = author_id or auth.uid() = card_owner_id or public.has_role(auth.uid(), 'admin'::app_role));
drop policy if exists "Admin masque" on public.rider_card_comments;
create policy "Admin masque" on public.rider_card_comments
  for update to authenticated
  using (public.has_role(auth.uid(), 'admin'::app_role))
  with check (public.has_role(auth.uid(), 'admin'::app_role));

-- Anti-spam : 10 commentaires par auteur sur 24 h.
create or replace function public.rider_card_comments_rate_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.rider_card_comments
      where author_id = new.author_id and created_at > now() - interval '24 hours') >= 10 then
    raise exception 'Limite atteinte : 10 commentaires par jour';
  end if;
  return new;
end $$;
drop trigger if exists trg_rider_card_comments_rate on public.rider_card_comments;
create trigger trg_rider_card_comments_rate before insert on public.rider_card_comments
  for each row execute function public.rider_card_comments_rate_limit();
