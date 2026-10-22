-- 23/10/2026 (Nolan, GO « affiliation dans l'admin ») : programmes d'affiliation + fournisseurs.
-- Remplace le tracker Notion « Démarchage affiliation — 50 marques » (gelé le 23/10).
-- Admin uniquement. JAMAIS de mot de passe, d'IBAN ni de prix d'achat dans cette table.
-- Le nombre de modèles liés n'est pas stocké : l'admin le calcule en lisant scooter_models.affiliate_link
-- (contient lien_motif, ex. 'awinmid=22897' ou 'haloknights.com').
create table if not exists public.affiliate_programs (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'affiliation' check (type in ('affiliation','fournisseur')),
  marque text not null,
  plateforme text,
  canal text,
  priorite text check (priorite is null or priorite in ('P1','P2','P3')),
  statut text not null default 'a_faire'
    check (statut in ('a_faire','contacte','en_attente','relance','actif','refus')),
  commission text,
  code_ref text,
  code_client text,
  id_marchand text,
  lien_motif text,
  lien_base text,
  url_tableau_de_bord text,
  url_paiements text,
  url_inscription text,
  contact_nom text,
  contact_email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (type, marque)
);
alter table public.affiliate_programs enable row level security;
revoke all on public.affiliate_programs from anon, authenticated;
grant select, insert, update, delete on public.affiliate_programs to authenticated;
drop policy if exists "admin gère les programmes d'affiliation" on public.affiliate_programs;
create policy "admin gère les programmes d'affiliation" on public.affiliate_programs for all
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));
