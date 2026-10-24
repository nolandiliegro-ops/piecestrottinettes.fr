-- 24/10/2026 — Lot livraison (plan claude/PT-lot-livraison.md, GO Nolan A1-A6).
-- Idempotente. Ajouts seulement : aucune colonne existante modifiée.

-- 1) Livraison sur la commande
alter table public.orders add column if not exists delivery_estimate text;   -- délai annoncé à l'achat (snapshot)
alter table public.orders add column if not exists carrier text;             -- transporteur choisi à l'expédition
alter table public.orders add column if not exists tracking_url text;        -- lien de suivi collé à la main (prioritaire sur le gabarit)
alter table public.orders add column if not exists shipped_at timestamptz;
alter table public.orders add column if not exists delivered_at timestamptz;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'orders_carrier_check') then
    alter table public.orders add constraint orders_carrier_check
      check (carrier is null or carrier in ('colissimo','chronopost','mondial_relay','dpd','ups','gls','autre'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'orders_tracking_url_check') then
    alter table public.orders add constraint orders_tracking_url_check
      check (tracking_url is null or (tracking_url ~ '^https://' and char_length(tracking_url) <= 500));
  end if;
end $$;

-- 2) Dates posées par la base au changement de statut (jamais par le front)
create or replace function public.orders_stamp_shipping() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.status = 'shipped' and old.status is distinct from 'shipped' and new.shipped_at is null then
    new.shipped_at := now();
  end if;
  if new.status = 'delivered' and old.status is distinct from 'delivered' then
    if new.delivered_at is null then new.delivered_at := now(); end if;
    if new.shipped_at is null then new.shipped_at := now(); end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_orders_stamp_shipping on public.orders;
create trigger trg_orders_stamp_shipping before update of status on public.orders
  for each row execute function public.orders_stamp_shipping();

-- 3) Rattacher au compte les commandes passées en invité avec le même email — email VÉRIFIÉ uniquement
create or replace function public.link_guest_orders() returns integer
language plpgsql security definer set search_path = public, auth as $$
declare
  v_email text;
  v_count integer := 0;
begin
  if auth.uid() is null then return 0; end if;
  select lower(email) into v_email from auth.users
   where id = auth.uid() and email_confirmed_at is not null;
  if v_email is null then return 0; end if;
  update public.orders set user_id = auth.uid()
   where user_id is null and lower(btrim(customer_email)) = v_email;
  get diagnostics v_count = row_count;
  return v_count;
end $$;
revoke all on function public.link_guest_orders() from public, anon;
grant execute on function public.link_guest_orders() to authenticated;

-- 4) Mail d'expédition envoyé une seule fois (send-shipping-email, sauf renvoi forcé par l'admin)
alter table public.orders add column if not exists shipping_email_sent_at timestamptz;
