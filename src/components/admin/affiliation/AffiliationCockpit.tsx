import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Search, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  STATUTS, LIST_ORDER, type AffStatut, type Program, type Derived, type Scooter,
  usePrograms, useScooters, useOffers, useClicks30, derive, coverage, brandKey, lastJournal, daysUntil, fmtDate, programOfOffer, parseRate,
} from './data';
import { Logo, StatusPill, StatusDot, Gauge } from './parts';
import BrandPanel, { ScooterOffersRow } from './BrandPanel';

/* 24/10/2026 (Nolan, GO « Cockpit », 6e proposition) — admin Affiliation v2 :
   chiffres + « Cette semaine » en tête, onglets Marques (liste ou Kanban) · Trottinettes · Fournisseurs,
   fiche de marque à droite (ordinateur) ou plein écran (téléphone). Ancien écran : ?aff=0.
   État dans l'URL : ?vue=marques|trottinettes|fournisseurs, ?statut=, ?mode=kanban, ?marque=<id>, ?filtre=. */

type Vue = 'marques' | 'trottinettes' | 'fournisseurs';
type Filtre = 'toutes' | 'sans-lien' | 'avec-lien' | 'sans-suivi' | 'plusieurs' | 'rupture';
const FILTRES: { k: Filtre; label: string }[] = [
  { k: 'toutes', label: 'Publiées' }, { k: 'sans-lien', label: 'Sans lien' }, { k: 'avec-lien', label: 'Avec lien' },
  { k: 'sans-suivi', label: 'Sans suivi' }, { k: 'plusieurs', label: 'Plusieurs offres' }, { k: 'rupture', label: 'En rupture' },
];

const chip = (on: boolean) => cn('inline-flex items-center gap-2 min-h-[44px] px-3.5 rounded-xl text-sm font-semibold border whitespace-nowrap tabular-nums',
  on ? 'bg-[hsl(var(--admin-text))] text-white border-transparent' : 'bg-white border-[hsl(var(--admin-border))] text-[hsl(var(--admin-text))]');

const rateTxt = (p: Program) => { const r = parseRate(p.commission); return r ? (r.min == null ? `≤ ${r.max} %` : r.min === r.max ? `${r.max} %` : `${r.min}-${r.max} %`) : ''; };
const nextOf = (p: Program) => p.prochaine_action || (lastJournal(p.notes)?.text ?? '');

/* ---------- En-tête : chiffres + cette semaine ---------- */

const Kpi = ({ value, sub, label, onClick, gauge }: { value: string | number; sub?: string; label: string; onClick: () => void; gauge?: [number, number] }) => (
  <button type="button" onClick={onClick} className="text-left rounded-2xl border border-[hsl(var(--admin-border))] bg-white px-3.5 py-3 hover:border-[hsl(var(--admin-accent))] transition-colors min-w-0">
    <div className="font-display text-4xl leading-none tabular-nums text-[hsl(var(--admin-text))]">{value}{sub && <span className="text-xl text-[hsl(var(--admin-text-muted))]">{sub}</span>}</div>
    <div className="text-sm text-[hsl(var(--admin-text-muted))] mt-1">{label}</div>
    {gauge && <div className="mt-2"><Gauge value={gauge[0]} total={gauge[1]} /></div>}
  </button>
);

const Header = ({ programs, d, clicks, go }: { programs: Program[]; d: Derived; clicks?: number; go: (patch: Record<string, string | null>) => void }) => {
  const aff = programs.filter(p => p.type === 'affiliation');
  const week = programs.filter(p => { const n = daysUntil(p.relance_le); return n != null && n <= 7; })
    .sort((a, b) => (a.relance_le ?? '').localeCompare(b.relance_le ?? '') || a.marque.localeCompare(b.marque));
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <Kpi value={d.tracked.size} sub={`/${d.published}`} label="fiches publiées liées et suivies" gauge={[d.tracked.size, d.published]} onClick={() => go({ vue: 'trottinettes', filtre: 'avec-lien', marque: null })} />
        <Kpi value={d.published - d.linked.size} label="fiches publiées sans lien" onClick={() => go({ vue: 'trottinettes', filtre: 'sans-lien', marque: null })} />
        <Kpi value={aff.filter(p => p.statut === 'en_attente').length} label="programmes en attente" onClick={() => go({ vue: null, statut: 'en_attente', mode: null })} />
        <Kpi value={aff.filter(p => p.statut === 'actif').length} label="programmes actifs" onClick={() => go({ vue: null, statut: 'actif', mode: null })} />
      </div>
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-sm font-black uppercase tracking-wide text-[hsl(var(--admin-text))] shrink-0">Cette semaine</span>
        <div className="flex gap-2 overflow-x-auto scrollbar-none -mr-3 pr-3 md:mr-0 md:pr-0">
          {week.length ? week.map(p => {
            const n = daysUntil(p.relance_le)!;
            return (
              <button key={p.id} type="button" onClick={() => go({ vue: p.type === 'fournisseur' ? 'fournisseurs' : null, marque: p.id })}
                className="inline-flex items-center gap-2 min-h-[44px] px-3 rounded-xl border border-[hsl(var(--admin-border))] bg-white text-sm whitespace-nowrap">
                <b className={cn(n < 0 && 'text-red-700')}>{n < 0 ? 'En retard' : n === 0 ? "Aujourd'hui" : fmtDate(p.relance_le)}</b>
                <span className="font-semibold">{p.marque}</span>
                {p.prochaine_action && <span className="text-[hsl(var(--admin-text-muted))] max-w-[260px] truncate">{p.prochaine_action}</span>}
              </button>
            );
          }) : <span className="text-sm text-[hsl(var(--admin-text-muted))]">Rien de daté sur 7 jours. Mets une date de relance dans la fiche d'une marque pour la voir ici.</span>}
        </div>
      </div>
      {clicks != null && <p className="text-sm text-[hsl(var(--admin-text-muted))] tabular-nums">Clics vers les partenaires sur 30 jours : {clicks}</p>}
    </div>
  );
};

/* ---------- Marques : liste et Kanban ---------- */

const BrandRow = ({ p, d, selected, onOpen }: { p: Program; d: Derived; selected: boolean; onOpen: () => void }) => {
  const c = coverage(p, d);
  const next = nextOf(p);
  return (
    <button type="button" onClick={onOpen} aria-current={selected}
      className={cn('w-full text-left grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 px-3 py-2.5 min-h-[60px] border-t border-[#F0ECE3] first:border-t-0 hover:bg-[#FBFAF7]',
        selected && 'bg-[#EEF4EF] shadow-[inset_3px_0_0_hsl(var(--admin-accent))]')}>
      <Logo src={d.logoByBrand.get(brandKey(p.marque))} name={p.marque} size={40} />
      <span className="min-w-0">
        <span className="flex items-center gap-2"><b className="text-sm text-[hsl(var(--admin-text))] truncate">{p.marque}</b><StatusDot s={p.statut} />{rateTxt(p) && <span className="text-sm font-semibold text-[hsl(var(--admin-accent))] whitespace-nowrap">{rateTxt(p)}</span>}</span>
        <span className={cn('block text-sm truncate', p.prochaine_action ? 'text-[hsl(var(--admin-text))]' : 'text-[hsl(var(--admin-text-muted))]')}>
          {p.relance_le && <b className="mr-1.5 text-[hsl(var(--admin-accent))]">{fmtDate(p.relance_le)}</b>}{next || '—'}
        </span>
      </span>
      <span className="flex items-center gap-1 text-sm font-black tabular-nums text-[hsl(var(--admin-text))]">
        {p.type === 'affiliation' ? (c.hasBrand ? `${c.linked}/${c.total}` : 'Revendeur') : ''}
        <ChevronRight className="w-4 h-4 text-[hsl(var(--admin-text-muted))]" />
      </span>
    </button>
  );
};

const KanbanCard = ({ p, d, onOpen }: { p: Program; d: Derived; onOpen: () => void }) => {
  const c = coverage(p, d);
  return (
    <button type="button" onClick={onOpen} className="w-full text-left grid gap-2 rounded-xl border border-[hsl(var(--admin-border))] bg-white p-3 hover:border-[hsl(var(--admin-accent))]">
      <span className="flex items-center gap-2.5 min-w-0">
        <Logo src={d.logoByBrand.get(brandKey(p.marque))} name={p.marque} size={32} />
        <b className="text-sm truncate flex-1">{p.marque}</b>
        {p.relance_le && <span className="text-sm font-bold text-[hsl(var(--admin-accent))] whitespace-nowrap">{fmtDate(p.relance_le)}</span>}
      </span>
      <span className="text-sm text-[hsl(var(--admin-text-muted))] truncate">{[p.plateforme, p.commission].filter(Boolean).join(' · ') || 'Aucun programme connu'}</span>
      {c.hasBrand && c.total > 0 && <span className="flex items-center gap-2"><span className="flex-1"><Gauge value={c.linked} total={c.total} /></span><b className="text-sm tabular-nums">{c.linked}/{c.total}</b></span>}
      {nextOf(p) && <span className="text-sm text-[hsl(var(--admin-text))] line-clamp-2"><span className="text-[hsl(var(--admin-accent))] font-black mr-1">→</span>{nextOf(p)}</span>}
    </button>
  );
};

/* ---------- Trottinettes : toutes les fiches et leurs liens ---------- */

const ScootersView = ({ scooters, programs, d, filtre, setFiltre, q }: { scooters: Scooter[]; programs: Program[]; d: Derived; filtre: Filtre; setFiltre: (f: Filtre) => void; q: string }) => {
  const pub = scooters.filter(s => s.published);
  const act = (s: Scooter) => (d.offersByScooter.get(s.id) || []).filter(o => o.is_active);
  const test: Record<Filtre, (s: Scooter) => boolean> = {
    toutes: () => true,
    'sans-lien': s => !d.linked.has(s.id),
    'avec-lien': s => d.linked.has(s.id),
    'sans-suivi': s => act(s).some(o => !programOfOffer(o, programs)),
    plusieurs: s => act(s).length > 1,
    rupture: s => act(s).some(o => o.in_stock === false),
  };
  const counts = Object.fromEntries(FILTRES.map(f => [f.k, pub.filter(test[f.k]).length])) as Record<Filtre, number>;
  const needle = q.trim().toLowerCase();
  const list = pub.filter(test[filtre]).filter(s => !needle || `${s.name} ${s.brand ?? ''}`.toLowerCase().includes(needle));
  const groups = new Map<string, Scooter[]>();
  for (const s of list) { const k = s.brand ?? 'Sans marque'; if (!groups.has(k)) groups.set(k, []); groups.get(k)!.push(s); }
  const progOf = (brand: string) => programs.find(p => p.type === 'affiliation' && brandKey(p.marque) === brandKey(brand));
  const [limit, setLimit] = useState(12);
  useEffect(() => setLimit(12), [filtre, needle]);
  const entries = [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
      <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-3 px-3 md:mx-0 md:px-0">
        {FILTRES.map(f => <button key={f.k} type="button" onClick={() => setFiltre(f.k)} aria-pressed={filtre === f.k} className={chip(filtre === f.k)}>{f.label} · {counts[f.k]}</button>)}
      </div>
      {entries.slice(0, limit).map(([brand, items]) => {
        const p = progOf(brand);
        const all = pub.filter(s => s.brand === brand);
        return (
          <section key={brand} className="rounded-2xl border border-[hsl(var(--admin-border))] bg-white overflow-hidden">
            <header className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 sm:px-4 py-2.5 bg-[#F3EFE6]">
              <Logo src={d.logoByBrand.get(brandKey(brand))} name={brand} size={32} />
              <b className="uppercase tracking-wide text-sm">{brand}</b>
              {p && <StatusPill s={p.statut} />}
              <span className="ml-auto text-sm tabular-nums text-[hsl(var(--admin-text-muted))]">{all.filter(s => d.linked.has(s.id)).length}/{all.length} liées{p?.prochaine_action ? ` · ${p.prochaine_action}` : ''}</span>
            </header>
            {items.map(s => <ScooterOffersRow key={s.id} s={s} offers={d.offersByScooter.get(s.id) || []} programs={programs} />)}
          </section>
        );
      })}
      {entries.length > limit && (
        <button type="button" onClick={() => setLimit(l => l + 12)} className="min-h-[44px] rounded-xl border border-[hsl(var(--admin-border))] bg-white text-sm font-semibold">
          Afficher 12 marques de plus ({entries.length - limit} restantes)
        </button>
      )}
      {!entries.length && <p className="px-1 text-sm text-[hsl(var(--admin-text-muted))]">Aucune trottinette ne correspond.</p>}
    </div>
  );
};

/* ---------- Écran ---------- */

const AffiliationCockpit = () => {
  const { data: programs = [], isLoading, error } = usePrograms();
  const { data: scooters = [], error: sErr } = useScooters();
  const { data: offers = [], error: oErr } = useOffers();
  const { data: clicks } = useClicks30();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [isLg, setIsLg] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const on = () => setIsLg(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const vue: Vue = params.get('vue') === 'trottinettes' ? 'trottinettes' : (params.get('vue') === 'fournisseurs' || params.get('type') === 'fournisseur') ? 'fournisseurs' : 'marques';
  const statut = params.get('statut') as AffStatut | null;
  const kanban = params.get('mode') === 'kanban';
  const filtre = (FILTRES.some(f => f.k === params.get('filtre')) ? params.get('filtre') : 'toutes') as Filtre;
  const openId = params.get('marque');

  const go = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    next.delete('type');
    for (const [k, v] of Object.entries(patch)) { if (v) next.set(k, v); else next.delete(k); }
    setParams(next, { replace: true });
  };

  const d = useMemo(() => derive(scooters, offers, programs), [scooters, offers, programs]);
  const pType = vue === 'fournisseurs' ? 'fournisseur' : 'affiliation';
  const ofType = programs.filter(p => p.type === pType);
  const needle = q.trim().toLowerCase();
  const matches = (p: Program) => !needle || `${p.marque} ${p.plateforme ?? ''} ${p.prochaine_action ?? ''} ${p.notes ?? ''}`.toLowerCase().includes(needle);
  const list = ofType.filter(p => !statut || p.statut === statut).filter(matches)
    .sort((a, b) => LIST_ORDER[a.statut] - LIST_ORDER[b.statut] || (a.relance_le ?? '9').localeCompare(b.relance_le ?? '9') || a.marque.localeCompare(b.marque));
  const opened = programs.find(p => p.id === openId) ?? null;

  if (isLoading) return <div className="admin-glass-card rounded-2xl p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--admin-text-muted))]" /></div>;
  if (error) return <div className="admin-glass-card rounded-2xl p-4 text-sm text-red-700">Programmes illisibles : {(error as Error).message}</div>;

  const panel = opened && <BrandPanel key={opened.id} p={opened} programs={programs} scooters={scooters} d={d} onBack={isLg ? undefined : () => go({ marque: null })} />;
  const counts = (k: AffStatut) => ofType.filter(p => p.statut === k).length;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      {(sErr || oErr) && <p className="text-sm text-red-700">Lecture incomplète : {((sErr || oErr) as Error).message}. Les compteurs ci-dessous sont faux tant que ce message s'affiche.</p>}
      <Header programs={programs} d={d} clicks={clicks} go={go} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 overflow-x-auto scrollbar-none border-b border-[hsl(var(--admin-border))]" role="tablist">
          {([['marques', `Marques ${programs.filter(p => p.type === 'affiliation').length}`], ['trottinettes', `Trottinettes ${d.published}`], ['fournisseurs', `Fournisseurs ${programs.filter(p => p.type === 'fournisseur').length}`]] as const).map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={vue === k} onClick={() => go({ vue: k === 'marques' ? null : k, statut: null, marque: null, filtre: null })}
              className={cn('min-h-[44px] px-3.5 text-sm font-semibold whitespace-nowrap', vue === k ? 'text-[hsl(var(--admin-text))] shadow-[inset_0_-3px_0_hsl(var(--admin-accent))]' : 'text-[hsl(var(--admin-text-muted))]')}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {vue === 'marques' && (
            <div className="inline-flex p-1 rounded-xl border border-[hsl(var(--admin-border))] bg-white shrink-0">
              {[['liste', 'Liste'], ['kanban', 'Kanban']].map(([k, l]) => (
                <button key={k} type="button" aria-pressed={(k === 'kanban') === kanban} onClick={() => go({ mode: k === 'kanban' ? 'kanban' : null, statut: null })}
                  className={cn('min-h-[40px] px-3.5 rounded-lg text-sm font-semibold', (k === 'kanban') === kanban ? 'bg-[hsl(var(--admin-accent))] text-white' : 'text-[hsl(var(--admin-text-muted))]')}>{l}</button>
              ))}
            </div>
          )}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--admin-text-muted))]" />
            <Input id="aff2-search" value={q} onChange={e => setQ(e.target.value)} placeholder={vue === 'trottinettes' ? 'Chercher une trottinette' : 'Chercher une marque, une note'} aria-label="Chercher" className="bg-white min-h-[44px] pl-9 text-sm" />
          </div>
        </div>
      </div>

      {vue === 'trottinettes' && <ScootersView scooters={scooters} programs={programs} d={d} filtre={filtre} setFiltre={f => go({ filtre: f === 'toutes' ? null : f })} q={q} />}

      {vue !== 'trottinettes' && kanban && vue === 'marques' && (
        <div className="flex lg:grid lg:grid-cols-6 gap-2.5 overflow-x-auto scrollbar-none -mx-3 px-3 md:mx-0 md:px-0 items-start">
          {STATUTS.map(s => {
            const col = ofType.filter(p => p.statut === s.k).filter(matches).sort((a, b) => (a.relance_le ?? '9').localeCompare(b.relance_le ?? '9') || a.marque.localeCompare(b.marque));
            return (
              <div key={s.k} className="grid gap-2 rounded-2xl bg-[#EFEBE2] p-2 w-[260px] lg:w-auto shrink-0">
                <div className="flex items-center justify-between px-1.5 min-h-[32px]"><span className="flex items-center gap-2 text-sm font-black"><StatusDot s={s.k} />{s.label}</span><span className="text-sm font-bold tabular-nums text-[hsl(var(--admin-text-muted))]">{col.length}</span></div>
                {col.map(p => <KanbanCard key={p.id} p={p} d={d} onOpen={() => go({ marque: p.id })} />)}
                {!col.length && <p className="px-1.5 pb-1 text-sm text-[hsl(var(--admin-text-muted))]">Vide</p>}
              </div>
            );
          })}
        </div>
      )}

      {vue !== 'trottinettes' && !(kanban && vue === 'marques') && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
          {vue === 'marques' && (
            <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-3 px-3 md:mx-0 md:px-0">
              <button type="button" onClick={() => go({ statut: null })} aria-pressed={!statut} className={chip(!statut)}>Toutes · {ofType.length}</button>
              {STATUTS.filter(s => counts(s.k) > 0 || s.k === statut).map(s => (
                <button key={s.k} type="button" onClick={() => go({ statut: statut === s.k ? null : s.k })} aria-pressed={statut === s.k} className={chip(statut === s.k)}>
                  <StatusDot s={s.k} />{s.label} · {counts(s.k)}
                </button>
              ))}
            </div>
          )}
          <div className={cn('grid gap-3 items-start', isLg ? 'grid-cols-[360px_minmax(0,1fr)]' : 'grid-cols-[minmax(0,1fr)]')}>
            <div className="rounded-2xl border border-[hsl(var(--admin-border))] bg-white overflow-hidden">
              {list.length ? list.map(p => <BrandRow key={p.id} p={p} d={d} selected={p.id === openId} onOpen={() => go({ marque: p.id })} />)
                : <p className="p-4 text-sm text-[hsl(var(--admin-text-muted))]">Rien ne correspond.</p>}
            </div>
            {isLg && (
              <div className="rounded-2xl border border-[hsl(var(--admin-border))] bg-white p-4 lg:sticky lg:top-3">
                {panel || <p className="text-sm text-[hsl(var(--admin-text-muted))]">Choisis une marque à gauche pour voir ses trottinettes, ses liens et son suivi.</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fiche ouverte depuis le Kanban (toutes tailles) ou depuis la liste sur téléphone / tablette. */}
      {opened && (!isLg || (kanban && vue === 'marques')) && (
        <Sheet open onOpenChange={o => !o && go({ marque: null })}>
          <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto bg-[hsl(var(--admin-bg))] p-4">
            <SheetTitle className="sr-only">{opened.marque}</SheetTitle>
            <SheetDescription className="sr-only">Fiche du programme d'affiliation</SheetDescription>
            {panel}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};

export default AffiliationCockpit;
