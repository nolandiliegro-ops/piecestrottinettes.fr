-- 24/10/2026 (Nolan, « go Atelier », plan claude/PT-lot-atelier-hub.md, A2/A3/A6) :
-- questions des visiteurs à l'atelier. Le visiteur pose (RPC ask_atelier), l'atelier répond dans l'admin,
-- la question n'est publique qu'une fois répondue (vue rider_questions_publiques, SANS l'email).
-- Distinct de public.atelier_questions (file interne de compat pour Georges).
create table if not exists public.rider_questions (
  id uuid primary key default gen_random_uuid(),
  slug text unique check (slug is null or slug ~ '^[a-z0-9-]{3,100}$'),
  scooter_slug text check (scooter_slug is null or char_length(scooter_slug) <= 120),
  scooter_name text check (scooter_name is null or char_length(scooter_name) <= 120),
  question text not null check (char_length(btrim(question)) between 10 and 1000),
  email text check (email is null or (char_length(email) <= 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  user_id uuid,
  ip_hash text,
  statut text not null default 'en_attente' check (statut in ('en_attente','repondue','refusee')),
  titre text check (titre is null or char_length(titre) between 5 and 140),
  reponse text check (reponse is null or char_length(reponse) between 20 and 4000),
  brouillon text,
  repondu_par text,
  repondu_le timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint repondue_complete check (statut <> 'repondue' or (reponse is not null and slug is not null and titre is not null))
);
create index if not exists rider_questions_statut_idx on public.rider_questions (statut, created_at desc);
create index if not exists rider_questions_ip_idx on public.rider_questions (ip_hash, created_at desc);

alter table public.rider_questions enable row level security;
revoke all on public.rider_questions from anon, authenticated;
grant select, insert, update, delete on public.rider_questions to authenticated;
drop policy if exists "admin gère les questions riders" on public.rider_questions;
create policy "admin gère les questions riders" on public.rider_questions for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Anti-spam côté BASE (pas dans le code) : 1 question par minute et 5 par jour par adresse IP.
create or replace function public.rider_questions_rate_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.ip_hash is not null then
    if exists (select 1 from public.rider_questions where ip_hash = new.ip_hash and created_at > now() - interval '1 minute') then
      raise exception 'trop_rapide' using errcode = 'P0001';
    end if;
    if (select count(*) from public.rider_questions where ip_hash = new.ip_hash and created_at > now() - interval '1 day') >= 5 then
      raise exception 'limite_jour' using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_rider_questions_rate_limit on public.rider_questions;
create trigger trg_rider_questions_rate_limit before insert on public.rider_questions
  for each row execute function public.rider_questions_rate_limit();

-- Seule porte d'entrée publique : la fonction ask_atelier (l'IP est lue dans les en-têtes, hachée).
create or replace function public.ask_atelier(p_question text, p_scooter_slug text default null, p_scooter_name text default null, p_email text default null)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare
  v_ip text := split_part(coalesce(current_setting('request.headers', true)::json->>'x-forwarded-for', ''), ',', 1);
  v_id uuid;
begin
  insert into public.rider_questions (question, scooter_slug, scooter_name, email, user_id, ip_hash)
  values (btrim(p_question), nullif(btrim(p_scooter_slug), ''), nullif(btrim(p_scooter_name), ''), nullif(lower(btrim(p_email)), ''), auth.uid(),
          case when v_ip = '' then null else encode(digest(v_ip || 'pt-atelier', 'sha256'), 'hex') end)
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.ask_atelier(text, text, text, text) from public;
grant execute on function public.ask_atelier(text, text, text, text) to anon, authenticated;

-- Lecture publique : uniquement les questions répondues, sans email ni IP ni utilisateur.
create or replace view public.rider_questions_publiques with (security_barrier = true) as
  select slug, titre, question, reponse, scooter_slug, scooter_name, repondu_par, repondu_le, created_at
  from public.rider_questions where statut = 'repondue';
revoke all on public.rider_questions_publiques from anon, authenticated;
grant select on public.rider_questions_publiques to anon, authenticated;
