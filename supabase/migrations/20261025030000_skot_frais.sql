-- 25/10/2026 — SKOT : questions fraîches inventées chaque nuit (2e job, séparé du banc pour rester sous la durée max d'une Edge Function).
-- Idempotente. Aucune donnée modifiée.
alter table public.skot_eval_runs drop constraint if exists skot_eval_runs_kind_check;
alter table public.skot_eval_runs add constraint skot_eval_runs_kind_check check (kind in ('banc','nuit','frais'));
create unique index if not exists skot_eval_runs_un_frais_par_jour on public.skot_eval_runs (run_day) where kind = 'frais';
do $$
begin
  perform cron.unschedule('skot-frais') where exists (select 1 from cron.job where jobname = 'skot-frais');
  perform cron.schedule('skot-frais', '11 2 * * *', $cmd$
    select net.http_post(
      url := 'https://kqsxscjtlipregkrmucg.supabase.co/functions/v1/chat-skot',
      body := '{"action":"frais_nuit"}'::jsonb,
      headers := '{"Content-Type":"application/json"}'::jsonb,
      timeout_milliseconds := 300000
    );
  $cmd$);
end $$;
