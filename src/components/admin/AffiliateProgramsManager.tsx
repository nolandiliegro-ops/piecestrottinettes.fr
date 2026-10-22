import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ExternalLink, Copy, Wallet, LayoutDashboard, Search, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

/* 23/10/2026 (Nolan, GO « affiliation dans l'admin ») — tous les programmes d'affiliation, codes,
   tableaux de bord et fournisseurs au même endroit. Remplace le tracker Notion (gelé le 23/10).
   Table public.affiliate_programs (RLS admin). JAMAIS d'IBAN, de mot de passe ni de prix d'achat ici :
   les coordonnées bancaires se saisissent sur la plateforme (bouton « Paiements »).
   Le nombre de trottinettes liées est calculé : scooter_models.affiliate_link contient lien_motif. */

export type AffStatut = 'a_faire' | 'contacte' | 'en_attente' | 'relance' | 'actif' | 'refus';
export interface AffiliateProgram {
  id: string; type: 'affiliation' | 'fournisseur'; marque: string; plateforme: string | null; canal: string | null;
  priorite: string | null; statut: AffStatut; commission: string | null; code_ref: string | null; code_client: string | null;
  id_marchand: string | null; lien_motif: string | null; lien_base: string | null; url_tableau_de_bord: string | null;
  url_paiements: string | null; url_inscription: string | null; contact_nom: string | null; contact_email: string | null;
  notes: string | null; updated_at: string;
}
interface ScooterRow { id: string; name: string; slug: string; published: boolean | null; affiliate_link: string | null; brand: string | null }

const STATUTS: { k: AffStatut; label: string; cls: string }[] = [
  { k: 'actif', label: 'Actif', cls: 'bg-[hsl(var(--admin-accent))] text-white' },
  { k: 'en_attente', label: 'En attente', cls: 'bg-amber-100 text-amber-900' },
  { k: 'relance', label: 'Relance', cls: 'bg-orange-100 text-orange-900' },
  { k: 'contacte', label: 'Contacté', cls: 'bg-sky-100 text-sky-900' },
  { k: 'a_faire', label: 'À faire', cls: 'bg-gray-100 text-gray-700' },
  { k: 'refus', label: 'Refusé', cls: 'bg-red-100 text-red-800' },
];
const STATUT = Object.fromEntries(STATUTS.map(s => [s.k, s])) as Record<AffStatut, (typeof STATUTS)[number]>;
const ORDRE: Record<AffStatut, number> = { actif: 0, relance: 1, en_attente: 2, contacte: 3, a_faire: 4, refus: 5 };

// Table absente des types générés : accès non typé.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = () => (supabase as unknown as { from: (t: string) => any }).from('affiliate_programs');

const usePrograms = () => useQuery({
  queryKey: ['affiliate-programs'],
  queryFn: async (): Promise<AffiliateProgram[]> => {
    const { data, error } = await table().select('*').order('marque');
    if (error) throw error;
    return (data || []) as AffiliateProgram[];
  },
});

const useScooters = () => useQuery({
  queryKey: ['affiliate-scooters'],
  staleTime: 60_000,
  queryFn: async (): Promise<ScooterRow[]> => {
    const { data, error } = await supabase.from('scooter_models').select('id, name, slug, published, affiliate_link, brands(name)').order('name');
    if (error) throw error;
    return (data || []).map((s: { id: string; name: string; slug: string; published: boolean | null; affiliate_link: string | null; brands: { name: string } | null }) =>
      ({ id: s.id, name: s.name, slug: s.slug, published: s.published, affiliate_link: s.affiliate_link, brand: s.brands?.name ?? null }));
  },
});

const isLinked = (s: ScooterRow, p: AffiliateProgram) => !!(p.lien_motif && s.affiliate_link?.toLowerCase().includes(p.lien_motif.toLowerCase()));
const scootersOf = (all: ScooterRow[], p: AffiliateProgram) => all.filter(s => s.brand?.toLowerCase() === p.marque.toLowerCase());

const copy = async (text: string, what: string) => {
  try { await navigator.clipboard.writeText(text); toast.success(`${what} copié`); }
  catch { toast.error('Copie impossible : sélectionne le texte à la main'); }
};

const Pill = ({ statut }: { statut: AffStatut }) => (
  <span className={cn('shrink-0 px-2.5 py-1 rounded-full text-xs font-bold', STATUT[statut]?.cls)}>{STATUT[statut]?.label ?? statut}</span>
);

const ActionLink = ({ href, icon: Icon, children }: { href: string; icon: typeof ExternalLink; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
    className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-xl border border-[hsl(var(--admin-border))] bg-white text-sm font-semibold text-[hsl(var(--admin-text))] hover:bg-[hsl(var(--aov03))]">
    <Icon className="w-4 h-4" />{children}
  </a>
);
const ActionButton = ({ onClick, icon: Icon, children }: { onClick: () => void; icon: typeof ExternalLink; children: React.ReactNode }) => (
  <button type="button" onClick={e => { e.stopPropagation(); onClick(); }}
    className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-xl border border-[hsl(var(--admin-border))] bg-white text-sm font-semibold text-[hsl(var(--admin-text))] hover:bg-[hsl(var(--aov03))]">
    <Icon className="w-4 h-4" />{children}
  </button>
);

const ProgramActions = ({ p }: { p: AffiliateProgram }) => (
  <div className="flex flex-wrap gap-2">
    {p.url_tableau_de_bord && <ActionLink href={p.url_tableau_de_bord} icon={LayoutDashboard}>Tableau de bord</ActionLink>}
    {p.url_paiements && <ActionLink href={p.url_paiements} icon={Wallet}>Paiements</ActionLink>}
    {p.code_client && <ActionButton onClick={() => copy(p.code_client!.split(' ')[0], 'Code client')} icon={Copy}>Code {p.code_client.split(' ')[0]}</ActionButton>}
    {p.lien_base && <ActionButton onClick={() => copy(p.lien_base!, 'Lien')} icon={Copy}>Copier le lien</ActionButton>}
    {!p.url_tableau_de_bord && p.url_inscription && <ActionLink href={p.url_inscription} icon={ExternalLink}>Page programme</ActionLink>}
    {p.contact_email && <ActionLink href={`mailto:${p.contact_email}`} icon={Mail}>{p.contact_email}</ActionLink>}
  </div>
);

/* ---------- Fiche détaillée (édition) ---------- */

const FIELDS: { k: keyof AffiliateProgram; label: string; placeholder?: string; multiline?: boolean }[] = [
  { k: 'plateforme', label: 'Plateforme', placeholder: 'Awin, GoAffPro, Direct…' },
  { k: 'commission', label: 'Commission' },
  { k: 'code_ref', label: 'Code de parrainage (ref)' },
  { k: 'code_client', label: 'Code client (remise)', placeholder: 'NOLANDILIEGRO (-10 %)' },
  { k: 'id_marchand', label: 'ID marchand' },
  { k: 'lien_motif', label: 'Motif reconnu dans les liens', placeholder: 'awinmid=22897 ou haloknights.com' },
  { k: 'lien_base', label: 'Lien de base (avec suivi)' },
  { k: 'url_tableau_de_bord', label: 'Tableau de bord' },
  { k: 'url_paiements', label: 'Page paiements' },
  { k: 'url_inscription', label: 'Page programme / inscription' },
  { k: 'contact_nom', label: 'Contact' },
  { k: 'contact_email', label: 'E-mail du contact' },
  { k: 'notes', label: 'Suivi / notes', multiline: true },
];

const ProgramSheet = ({ p, scooters, onClose }: { p: AffiliateProgram; scooters: ScooterRow[]; onClose: () => void }) => {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Partial<AffiliateProgram>>({});
  const save = useMutation({
    mutationFn: async (patch: Partial<AffiliateProgram>) => {
      const { error } = await table().update({ ...patch, updated_at: new Date().toISOString() }).eq('id', p.id);
      if (error) throw error;
    },
    onSuccess: () => toast.success('Enregistré'),
    onError: (e: Error) => toast.error(`Pas enregistré : ${e.message}`),
    onSettled: () => qc.invalidateQueries({ queryKey: ['affiliate-programs'] }),
  });
  const commit = (k: keyof AffiliateProgram) => {
    if (!(k in draft)) return;
    const v = (draft[k] as string | undefined)?.trim() || null;
    if (v !== (p[k] ?? null)) save.mutate({ [k]: v } as Partial<AffiliateProgram>);
  };
  const models = scootersOf(scooters, p);
  const linked = models.filter(s => isLinked(s, p));

  return (
    <Sheet open onOpenChange={o => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto bg-white">
        <SheetHeader className="text-left">
          <SheetTitle className="text-xl font-black uppercase tracking-tight">{p.marque}</SheetTitle>
          <SheetDescription className="text-sm">
            {p.type === 'fournisseur' ? 'Fournisseur' : `Affiliation${p.priorite ? ` · ${p.priorite}` : ''}`}
            {' · '}mis à jour le {new Date(p.updated_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          <div>
            <p className="text-sm font-semibold text-[hsl(var(--admin-text))] mb-2">Statut</p>
            <div className="flex flex-wrap gap-2">
              {STATUTS.map(s => (
                <button key={s.k} type="button" disabled={save.isPending} aria-pressed={p.statut === s.k}
                  onClick={() => p.statut !== s.k && save.mutate({ statut: s.k })}
                  className={cn('min-h-[44px] px-3.5 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-60',
                    p.statut === s.k ? 'bg-[hsl(var(--admin-accent))] text-white border-transparent' : 'bg-white text-[hsl(var(--admin-text))] border-[hsl(var(--admin-border))]')}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <ProgramActions p={p} />

          {p.type === 'affiliation' && (
            <section>
              <p className="text-sm font-semibold text-[hsl(var(--admin-text))] mb-2">
                Trottinettes de la marque · <span className="tabular-nums">{linked.length}/{models.length}</span> avec lien
              </p>
              {models.length ? (
                <ul className="divide-y divide-[hsl(var(--admin-border))] rounded-xl border border-[hsl(var(--admin-border))]">
                  {models.map(s => (
                    <li key={s.id} className="flex items-center justify-between gap-3 px-3 min-h-[44px]">
                      <a href={`/scooter/${s.slug}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[hsl(var(--admin-text))] underline-offset-2 hover:underline">
                        {s.name}{s.published === false && <span className="text-[hsl(var(--admin-text-muted))]"> · non publiée</span>}
                      </a>
                      <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', isLinked(s, p) ? 'bg-[hsl(var(--admin-accent)/0.15)] text-[hsl(var(--admin-accent))]' : s.affiliate_link ? 'bg-amber-100 text-amber-900' : 'bg-gray-100 text-gray-600')}>
                        {isLinked(s, p) ? 'Lien suivi' : s.affiliate_link ? 'Lien sans suivi' : 'Sans lien'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-[hsl(var(--admin-text-muted))]">Aucune trottinette de cette marque au catalogue (revendeur multi-marques).</p>}
            </section>
          )}

          <section className="space-y-3">
            {FIELDS.map(f => {
              const value = (f.k in draft ? draft[f.k] : p[f.k]) as string | null;
              const common = {
                id: `aff-${f.k}`,
                value: value ?? '',
                placeholder: f.placeholder,
                onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(d => ({ ...d, [f.k]: e.target.value })),
                onBlur: () => commit(f.k),
                className: 'bg-white min-h-[44px] text-sm',
              };
              return (
                <div key={f.k}>
                  <label htmlFor={`aff-${f.k}`} className="text-sm font-semibold text-[hsl(var(--admin-text))]">{f.label}</label>
                  {f.multiline ? <Textarea rows={5} {...common} /> : <Input {...common} />}
                </div>
              );
            })}
            <p className="text-sm text-[hsl(var(--admin-text-muted))]">Chaque champ s'enregistre quand tu le quittes. Ne mets jamais d'IBAN ni de mot de passe ici : ils se saisissent sur la plateforme.</p>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
};

/* ---------- Liste ---------- */

const AffiliateProgramsManager = () => {
  const { data: programs = [], isLoading, error } = usePrograms();
  const { data: scooters = [] } = useScooters();
  const [params, setParams] = useSearchParams();
  const type = params.get('type') === 'fournisseur' ? 'fournisseur' : 'affiliation';
  const statut = params.get('statut') as AffStatut | null;
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    if (k === 'type') next.delete('statut');
    setParams(next, { replace: true });
  };

  const ofType = useMemo(() => programs.filter(p => p.type === type), [programs, type]);
  const counts = useMemo(() => Object.fromEntries(STATUTS.map(s => [s.k, ofType.filter(p => p.statut === s.k).length])) as Record<AffStatut, number>, [ofType]);
  const linkedTotal = useMemo(() => scooters.filter(s => programs.some(p => p.type === 'affiliation' && isLinked(s, p))).length, [scooters, programs]);
  const list = ofType
    .filter(p => !statut || p.statut === statut)
    .filter(p => !q.trim() || `${p.marque} ${p.plateforme ?? ''} ${p.notes ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => ORDRE[a.statut] - ORDRE[b.statut] || (a.priorite ?? 'P9').localeCompare(b.priorite ?? 'P9') || a.marque.localeCompare(b.marque));
  const opened = programs.find(p => p.id === openId) ?? null;

  if (isLoading) return <div className="admin-glass-card rounded-2xl p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--admin-text-muted))]" /></div>;
  if (error) return <div className="admin-glass-card rounded-2xl p-4 text-sm text-red-700">Lecture impossible : {(error as Error).message}</div>;

  return (
    <div className="space-y-4">
      <div className="admin-glass-card rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-base font-black uppercase tracking-wide text-[hsl(var(--admin-text))]">Affiliation & fournisseurs</h3>
          {type === 'affiliation' && <span className="text-sm text-[hsl(var(--admin-text-muted))] tabular-nums">{linkedTotal} trottinettes avec lien suivi</span>}
        </div>
        <div className="inline-flex p-1 rounded-xl border border-[hsl(var(--admin-border))] bg-white">
          {(['affiliation', 'fournisseur'] as const).map(t => (
            <button key={t} type="button" onClick={() => setParam('type', t === 'affiliation' ? null : t)} aria-pressed={type === t}
              className={cn('min-h-[44px] px-4 rounded-lg text-sm font-semibold', type === t ? 'bg-[hsl(var(--admin-accent))] text-white' : 'text-[hsl(var(--admin-text-muted))]')}>
              {t === 'affiliation' ? `Programmes (${programs.filter(p => p.type === 'affiliation').length})` : `Fournisseurs (${programs.filter(p => p.type === 'fournisseur').length})`}
            </button>
          ))}
        </div>
        {type === 'affiliation' && (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setParam('statut', null)} aria-pressed={!statut}
              className={cn('min-h-[44px] px-3.5 rounded-xl text-sm font-semibold border', !statut ? 'bg-[hsl(var(--admin-text))] text-white border-transparent' : 'bg-white border-[hsl(var(--admin-border))] text-[hsl(var(--admin-text))]')}>
              Tous · {ofType.length}
            </button>
            {STATUTS.filter(s => counts[s.k] > 0 || s.k === statut).map(s => (
              <button key={s.k} type="button" onClick={() => setParam('statut', statut === s.k ? null : s.k)} aria-pressed={statut === s.k}
                className={cn('min-h-[44px] px-3.5 rounded-xl text-sm font-semibold border tabular-nums', statut === s.k ? 'bg-[hsl(var(--admin-text))] text-white border-transparent' : 'bg-white border-[hsl(var(--admin-border))] text-[hsl(var(--admin-text))]')}>
                {s.label} · {counts[s.k]}
              </button>
            ))}
          </div>
        )}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--admin-text-muted))]" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Chercher une marque, une plateforme, une note…" className="bg-white min-h-[44px] pl-9 text-sm" aria-label="Chercher" />
        </div>
      </div>

      {list.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {list.map(p => {
            const models = scootersOf(scooters, p);
            const linked = models.filter(s => isLinked(s, p)).length;
            return (
              <article key={p.id} role="button" tabIndex={0} onClick={() => setOpenId(p.id)} onKeyDown={e => e.key === 'Enter' && setOpenId(p.id)}
                className="admin-glass-card rounded-2xl p-4 space-y-2.5 cursor-pointer border border-transparent hover:border-[hsl(var(--admin-border))] transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-[15px] font-black uppercase leading-tight text-[hsl(var(--admin-text))]">{p.marque}</h4>
                    <p className="text-sm text-[hsl(var(--admin-text-muted))]">
                      {[p.plateforme, p.commission, p.priorite, p.type === 'fournisseur' ? p.contact_nom : null].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>
                  {p.type === 'affiliation' && <Pill statut={p.statut} />}
                </div>
                {p.type === 'affiliation' && models.length > 0 && (
                  <p className="text-sm text-[hsl(var(--admin-text))] tabular-nums">
                    <strong>{linked}</strong>/{models.length} trottinettes liées
                  </p>
                )}
                {p.code_ref && <p className="text-sm text-[hsl(var(--admin-text-muted))]">Ref <span className="font-mono text-[hsl(var(--admin-text))]">{p.code_ref}</span>{p.id_marchand && <> · ID marchand <span className="font-mono">{p.id_marchand}</span></>}</p>}
                {!p.code_ref && p.id_marchand && <p className="text-sm text-[hsl(var(--admin-text-muted))]">ID marchand <span className="font-mono text-[hsl(var(--admin-text))]">{p.id_marchand}</span></p>}
                {p.notes && <p className="text-sm text-[hsl(var(--admin-text-muted))] line-clamp-2">{p.notes}</p>}
                <ProgramActions p={p} />
              </article>
            );
          })}
        </div>
      ) : <p className="px-1 text-sm text-[hsl(var(--admin-text-muted))]">Rien ne correspond.</p>}

      {opened && <ProgramSheet key={opened.id + opened.updated_at} p={opened} scooters={scooters} onClose={() => setOpenId(null)} />}
    </div>
  );
};

export default AffiliateProgramsManager;
