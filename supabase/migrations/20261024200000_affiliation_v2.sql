-- 24/10/2026 (Nolan, GO « Cockpit » de l'admin Affiliation v2) — rejouable sans effet de bord.
-- 1) Deux colonnes de suivi sur les programmes (A2) : appliquées le 24/10 par query_database
--    (backup _backup_affiliate_programs_20261024d, 58 lignes).
alter table public.affiliate_programs add column if not exists prochaine_action text
  check (prochaine_action is null or char_length(prochaine_action) <= 160);
alter table public.affiliate_programs add column if not exists relance_le date;

-- 2) Synchro du lien du bouton de fiche avec les offres (A3).
--    scooter_models.affiliate_link = meilleure offre ACTIVE de la trottinette, même ordre que le comparateur
--    (OfferComparator) : Amazon en dernier, rupture après le stock, puis le moins cher, puis la plus ancienne.
--    Aucune offre active → affiliate_link = null (le bouton disparaît, le repli « sans vendeur » prend le relais).
--    Ne se déclenche QUE sur une écriture dans scooter_offers : un lien posé à la main sur une trottinette
--    sans aucune offre n'est jamais touché. Prédiction du 24/10 avant pose : 0 fiche modifiée.
create or replace function public.sync_affiliate_link_from_offers()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare ids uuid[];
begin
  ids := array_remove(array[
    case when tg_op in ('INSERT', 'UPDATE') then new.scooter_model_id end,
    case when tg_op in ('UPDATE', 'DELETE') then old.scooter_model_id end
  ], null);
  update public.scooter_models sm
     set affiliate_link = b.url
    from (
      select m.id,
             (select o.affiliate_url from public.scooter_offers o
               where o.scooter_model_id = m.id and o.is_active
               order by (o.offer_type = 'amazon'), (o.in_stock is false), o.price_eur nulls last, o.created_at
               limit 1) as url
        from unnest(ids) as m(id)
    ) b
   where sm.id = b.id and sm.affiliate_link is distinct from b.url;
  return null;
end $$;

revoke all on function public.sync_affiliate_link_from_offers() from public, anon, authenticated;

drop trigger if exists trg_sync_affiliate_link on public.scooter_offers;
create trigger trg_sync_affiliate_link
  after insert or delete or update of is_active, affiliate_url, in_stock, price_eur, offer_type, scooter_model_id
  on public.scooter_offers
  for each row execute function public.sync_affiliate_link_from_offers();
