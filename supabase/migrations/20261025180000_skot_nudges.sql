-- 25/10/2026 — SKOT Étage 2 « il arrive au bon moment » : mesure des interventions proactives (skot-ambition-24-10.md).
-- Additive, idempotente. Écriture par l'Edge Function chat-skot seule (service_role), lecture admin.
-- Règle actée : si plus de 70 % des interventions d'un type sont refermées, ce type saute.
create table if not exists public.skot_nudges (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id text not null,
  kind text not null,
  event text not null check (event in ('shown','opened','closed','replied')),
  page_slug text,
  ip_hash text,
  unique (session_id, kind, event)
);
create index if not exists skot_nudges_kind_idx on public.skot_nudges (kind, created_at desc);
alter table public.skot_nudges enable row level security;
revoke all on public.skot_nudges from anon, authenticated;
grant select on public.skot_nudges to authenticated;
drop policy if exists "admin lit les interventions SKOT" on public.skot_nudges;
create policy "admin lit les interventions SKOT" on public.skot_nudges for select to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role));
