-- 24/10/2026 — SKOT qui s'améliore : banc d'essai, mine de nuit, 👍/👎 client (skill skot-amelioration-continue).
-- GO de Nolan le 24/10 (« GO, tout le plan »). Idempotente. Aucune donnée existante modifiée.

-- 1. skot_messages : avis client + tokens de cache séparés (coût exact)
alter table public.skot_messages add column if not exists feedback smallint check (feedback in (-1, 1));
alter table public.skot_messages add column if not exists feedback_at timestamptz;
alter table public.skot_messages add column if not exists tokens_cache_read integer;
alter table public.skot_messages add column if not exists tokens_cache_write integer;
create index if not exists skot_messages_page_type_idx on public.skot_messages (page_type, created_at);

-- 2. Runs du banc (à la demande ou de nuit)
create table if not exists public.skot_eval_runs (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('banc','nuit')),
  run_day date,
  version text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  n_cas integer, n_vert integer, n_rouge integer, n_juge_rouge integer,
  tokens integer,
  detail jsonb
);
-- Garde-fou : UNE nuit par jour, garanti par la base (l'action "nuit" est appelable sans authentification).
create unique index if not exists skot_eval_runs_une_nuit_par_jour on public.skot_eval_runs (run_day) where kind = 'nuit';
create index if not exists skot_eval_runs_started_idx on public.skot_eval_runs (started_at desc);

-- 3. Signaux à traiter (détecteurs, juge, 👎 client)
create table if not exists public.skot_flags (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  conversation_id uuid not null,
  message_id uuid not null,
  type text not null,
  source text not null check (source in ('detecteur','juge','client')),
  extrait text,
  traite boolean not null default false,
  note text,
  unique (message_id, type)
);
create index if not exists skot_flags_open_idx on public.skot_flags (traite, created_at desc);

-- RLS : écriture par l'Edge Function seule (service_role), lecture admin
alter table public.skot_eval_runs enable row level security;
alter table public.skot_flags enable row level security;
revoke all on public.skot_eval_runs from anon, authenticated;
revoke all on public.skot_flags from anon, authenticated;
grant select on public.skot_eval_runs to authenticated;
grant select on public.skot_flags to authenticated;
drop policy if exists "admin lit les runs SKOT" on public.skot_eval_runs;
create policy "admin lit les runs SKOT" on public.skot_eval_runs for select to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role));
drop policy if exists "admin lit les signaux SKOT" on public.skot_flags;
create policy "admin lit les signaux SKOT" on public.skot_flags for select to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 4. La nuit : 01:41 UTC (02:41 à Paris l'hiver, 03:41 l'été). Sans lien avec les jobs prix (02:17 / 02:27 UTC).
do $$
begin
  perform cron.unschedule('skot-nuit') where exists (select 1 from cron.job where jobname = 'skot-nuit');
  perform cron.schedule('skot-nuit', '41 1 * * *', $cmd$
    select net.http_post(
      url := 'https://kqsxscjtlipregkrmucg.supabase.co/functions/v1/chat-skot',
      body := '{"action":"nuit"}'::jsonb,
      headers := '{"Content-Type":"application/json"}'::jsonb,
      timeout_milliseconds := 300000
    );
  $cmd$);
end $$;
