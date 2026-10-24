import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

/* 24/10/2026 (Nolan, GO « Cockpit ») — données de l'admin Affiliation v2.
   Programmes : public.affiliate_programs (+ prochaine_action, relance_le, colonnes du 24/10).
   Offres : public.scooter_offers (plusieurs marchands par trottinette). Le lien du bouton de fiche
   (scooter_models.affiliate_link) est tenu à jour par un trigger en base à partir des offres actives :
   l'écran n'écrit JAMAIS affiliate_link lui-même.
   Compteurs : fiches PUBLIÉES seulement (règle admin : un compteur ne mélange pas deux files). */

export type AffStatut = 'a_faire' | 'contacte' | 'relance' | 'en_attente' | 'actif' | 'refus';
export interface Program {
  id: string; type: 'affiliation' | 'fournisseur'; marque: string; plateforme: string | null; canal: string | null;
  priorite: string | null; statut: AffStatut; commission: string | null; code_ref: string | null; code_client: string | null;
  id_marchand: string | null; lien_motif: string | null; lien_base: string | null; url_tableau_de_bord: string | null;
  url_paiements: string | null; url_inscription: string | null; contact_nom: string | null; contact_email: string | null;
  notes: string | null; prochaine_action: string | null; relance_le: string | null; updated_at: string;
}
export interface Scooter { id: string; name: string; slug: string; published: boolean; brand: string | null; logo: string | null }
export interface Offer {
  id: string; scooter_model_id: string; merchant_host: string; offer_type: 'marque' | 'revendeur' | 'amazon';
  affiliate_url: string; product_url: string; price_eur: number | null; in_stock: boolean | null; is_active: boolean;
  price_checked_at: string | null; source_kind: string; notes: string | null;
}

/** Ordre du pipeline : de gauche à droite dans le Kanban, de haut en bas dans la liste. */
export const STATUTS: { k: AffStatut; label: string; dot: string; pill: string }[] = [
  { k: 'a_faire', label: 'À faire', dot: 'bg-gray-400', pill: 'bg-gray-100 text-gray-700' },
  { k: 'contacte', label: 'Contacté', dot: 'bg-sky-600', pill: 'bg-sky-100 text-sky-900' },
  { k: 'relance', label: 'Relance', dot: 'bg-orange-500', pill: 'bg-orange-100 text-orange-900' },
  { k: 'en_attente', label: 'En attente', dot: 'bg-amber-500', pill: 'bg-amber-100 text-amber-900' },
  { k: 'actif', label: 'Actif', dot: 'bg-[hsl(var(--admin-accent))]', pill: 'bg-[hsl(var(--admin-accent))] text-white' },
  { k: 'refus', label: 'Refusé', dot: 'bg-red-500', pill: 'bg-red-100 text-red-800' },
];
export const STATUT = Object.fromEntries(STATUTS.map(s => [s.k, s])) as Record<AffStatut, (typeof STATUTS)[number]>;
export const LIST_ORDER: Record<AffStatut, number> = { actif: 0, relance: 1, en_attente: 2, contacte: 3, a_faire: 4, refus: 5 };

// Colonnes du 24/10 absentes des types générés : accès non typé.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const from = (t: string) => (supabase as unknown as { from: (t: string) => any }).from(t);

export const usePrograms = () => useQuery({
  queryKey: ['aff2-programs'],
  queryFn: async (): Promise<Program[]> => {
    const { data, error } = await from('affiliate_programs').select('*').order('marque');
    if (error) throw error;
    return (data || []) as Program[];
  },
});

export const useScooters = () => useQuery({
  queryKey: ['aff2-scooters'],
  staleTime: 60_000,
  queryFn: async (): Promise<Scooter[]> => {
    const { data, error } = await supabase.from('scooter_models')
      .select('id, name, slug, published, brands!scooter_models_brand_id_fkey(name, logo_url)').order('name');
    if (error) throw error;
    return (data || []).map((s: { id: string; name: string; slug: string; published: boolean | null; brands: { name: string; logo_url: string | null } | null }) =>
      ({ id: s.id, name: s.name, slug: s.slug, published: !!s.published, brand: s.brands?.name ?? null, logo: s.brands?.logo_url ?? null }));
  },
});

export const useOffers = () => useQuery({
  queryKey: ['aff2-offers'],
  queryFn: async (): Promise<Offer[]> => {
    const { data, error } = await from('scooter_offers')
      .select('id, scooter_model_id, merchant_host, offer_type, affiliate_url, product_url, price_eur, in_stock, is_active, price_checked_at, source_kind, notes');
    if (error) throw error;
    return (data || []) as Offer[];
  },
});

export const useClicks30 = () => useQuery({
  queryKey: ['aff2-clicks-30j'],
  queryFn: async (): Promise<number> => {
    const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const { count, error } = await from('affiliate_clicks').select('id', { count: 'exact', head: true }).gte('created_at', since);
    if (error) throw error;
    return count ?? 0;
  },
});

/** Une offre est « suivie » si son lien contient le motif d'un programme (awinmid=…, ?ref=…). */
export const programOfOffer = (o: Offer, programs: Program[]) =>
  programs.find(p => p.type === 'affiliation' && p.lien_motif && o.affiliate_url.toLowerCase().includes(p.lien_motif.toLowerCase())) ?? null;

/** Paramètre de suivi visible dans l'URL (garde-fou de saisie, pas une preuve de commission). */
export const hasTrackingParam = (url: string) => /[?&](awinmid|awc|ref|aff|affiliate|tag|clickref|irclickid)=/i.test(url) || /awin1\.com\/cread/i.test(url);

export const brandKey = (s: string | null | undefined) => (s ?? '').trim().toLowerCase();

export interface Derived {
  byBrand: Map<string, Scooter[]>;
  offersByScooter: Map<string, Offer[]>;
  logoByBrand: Map<string, string>;
  tracked: Set<string>;          // ids de trottinettes publiées avec ≥ 1 offre active suivie
  linked: Set<string>;           // ids de trottinettes publiées avec ≥ 1 offre active
  published: number;
}

export const derive = (scooters: Scooter[], offers: Offer[], programs: Program[]): Derived => {
  const byBrand = new Map<string, Scooter[]>();
  const logoByBrand = new Map<string, string>();
  for (const s of scooters) {
    const k = brandKey(s.brand);
    if (!byBrand.has(k)) byBrand.set(k, []);
    byBrand.get(k)!.push(s);
    if (s.logo && !logoByBrand.has(k)) logoByBrand.set(k, s.logo);
  }
  const offersByScooter = new Map<string, Offer[]>();
  for (const o of offers) {
    if (!offersByScooter.has(o.scooter_model_id)) offersByScooter.set(o.scooter_model_id, []);
    offersByScooter.get(o.scooter_model_id)!.push(o);
  }
  const tracked = new Set<string>(); const linked = new Set<string>();
  let published = 0;
  for (const s of scooters) {
    if (!s.published) continue;
    published++;
    const act = (offersByScooter.get(s.id) || []).filter(o => o.is_active);
    if (act.length) linked.add(s.id);
    if (act.some(o => programOfOffer(o, programs))) tracked.add(s.id);
  }
  return { byBrand, offersByScooter, logoByBrand, tracked, linked, published };
};

/** Fiches publiées de la marque d'un programme, et combien ont au moins une offre active. */
export const coverage = (p: Program, d: Derived) => {
  const models = (d.byBrand.get(brandKey(p.marque)) || []).filter(s => s.published);
  return { total: models.length, linked: models.filter(s => d.linked.has(s.id)).length, hasBrand: d.byBrand.has(brandKey(p.marque)) };
};

/** Journal `notes` découpé par date (« 24/10 : … »), du plus récent au plus ancien. */
export const parseJournal = (notes: string | null) => {
  if (!notes?.trim()) return [] as { date: string | null; text: string }[];
  const out: { date: string | null; text: string }[] = [];
  for (const raw of notes.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s*[:—-]\s*(.*)$/);
    if (m) out.push({ date: m[1], text: m[2] });
    else if (out.length && out[out.length - 1].date) out[out.length - 1].text += ` ${line}`;
    else out.push({ date: null, text: line });
  }
  return out.reverse();
};

export const lastJournal = (notes: string | null) => parseJournal(notes)[0] ?? null;

export const todayFr = () => new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });

export const daysUntil = (iso: string | null) => {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`); const t = new Date(); t.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - t.getTime()) / 86_400_000);
};

export const fmtDate = (iso: string | null) => iso
  ? new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' })
  : '';

export const eur = (v: number | null) => v == null ? '' : `${v.toLocaleString('fr-FR', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 })} €`;

export const copy = async (text: string, what: string) => {
  try { await navigator.clipboard.writeText(text); toast.success(`${what} copié`); }
  catch { toast.error('Copie impossible : sélectionne le texte à la main'); }
};

export const useSaveProgram = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Program> }) => {
      const { error } = await from('affiliate_programs').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => toast.success('Enregistré'),
    onError: (e: Error) => toast.error(`Pas enregistré : ${e.message}`),
    onSettled: () => qc.invalidateQueries({ queryKey: ['aff2-programs'] }),
  });
};

export const useSaveOffer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (arg: { id?: string; insert?: Partial<Offer> & { scooter_model_id: string }; patch?: Partial<Offer> }) => {
      if (arg.id && arg.patch) {
        const { error } = await from('scooter_offers').update({ ...arg.patch, updated_at: new Date().toISOString() }).eq('id', arg.id);
        if (error) throw error;
      } else if (arg.insert) {
        const { error } = await from('scooter_offers').insert({ source_kind: 'manuel', ...arg.insert });
        if (error) throw error;
      }
    },
    onSuccess: () => toast.success('Offre enregistrée'),
    onError: (e: Error) => toast.error(e.message.includes('un_marchand_par_modele')
      ? 'Ce marchand a déjà une offre sur cette trottinette : réactive-la plutôt'
      : `Pas enregistrée : ${e.message}`),
    onSettled: () => { qc.invalidateQueries({ queryKey: ['aff2-offers'] }); qc.invalidateQueries({ queryKey: ['affiliate-scooters'] }); },
  });
};
