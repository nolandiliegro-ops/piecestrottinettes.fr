-- 20/10/2026 (Nolan) : « À trancher » alimenté en continu par toutes les conversations Claude et les robots.
-- Chaque question dit d'où elle vient, quelle trottinette elle concerne et quelle clé de MATCHING elle remplit.
alter table public.atelier_questions add column if not exists source text not null default 'claude';
alter table public.atelier_questions add column if not exists scooter_slug text;
alter table public.atelier_questions add column if not exists cle text;
alter table public.atelier_questions drop constraint if exists atelier_questions_famille_check;
alter table public.atelier_questions add constraint atelier_questions_famille_check
  check (famille in ('doublons','200x50','contradictions','variantes','prises','base'));
