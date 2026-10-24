-- 24/10/2026 — SKOT, bot client du site (spec claude/skot-bot-passation-24-10.md + claude/skot-ambition-24-10.md).
-- « Branche-moi SKOT » (Nolan, 24/10). Idempotente.
-- Une seule table : skot_messages (une ligne par message). Écrite UNIQUEMENT par l'Edge Function chat-skot (service_role).

create table if not exists public.skot_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  role text not null check (role in ('user','assistant')),
  content text not null check (char_length(content) <= 6000),
  has_image boolean not null default false,
  tool_calls jsonb,
  ip_hash text,
  user_id uuid,
  page_type text,
  page_slug text,
  order_lookup_failed boolean not null default false,
  tokens_in integer,
  tokens_out integer,
  model text,
  escalated boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists skot_messages_conv_idx on public.skot_messages (conversation_id, created_at);
create index if not exists skot_messages_ip_idx on public.skot_messages (ip_hash, created_at desc);
create index if not exists skot_messages_day_idx on public.skot_messages (created_at);

alter table public.skot_messages enable row level security;
revoke all on public.skot_messages from anon, authenticated;
grant select on public.skot_messages to authenticated;
drop policy if exists "admin lit les conversations SKOT" on public.skot_messages;
create policy "admin lit les conversations SKOT" on public.skot_messages for select to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Anti-spam en BASE (gabarit rider_questions_rate_limit) : 20 messages / 10 min et 100 / jour par IP hachée.
create or replace function public.skot_messages_rate_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role = 'user' and new.ip_hash is not null then
    if (select count(*) from public.skot_messages
         where ip_hash = new.ip_hash and role = 'user' and created_at > now() - interval '10 minutes') >= 20 then
      raise exception 'skot_trop_rapide' using errcode = 'P0001';
    end if;
    if (select count(*) from public.skot_messages
         where ip_hash = new.ip_hash and role = 'user' and created_at > now() - interval '1 day') >= 100 then
      raise exception 'skot_limite_jour' using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_skot_messages_rate_limit on public.skot_messages;
create trigger trg_skot_messages_rate_limit before insert on public.skot_messages
  for each row execute function public.skot_messages_rate_limit();
