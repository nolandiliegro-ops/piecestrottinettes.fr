import { useMemo, useState } from 'react';
import { LayoutDashboard, Wallet, Copy, Plus, ArrowLeft, CalendarClock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  STATUTS, type Program, type Scooter, type Offer, type Derived, brandKey, coverage, parseJournal, todayFr,
  copy, useSaveProgram, programOfOffer, fmtDate, parseRate, gainOf,
} from './data';
import { Logo, StatusPill, OfferLine, OfferForm, ScooterPhoto } from './parts';

/* Fiche d'un programme (marque, revendeur ou fournisseur) — 24/10/2026.
   Ordinateur : panneau à droite de la liste. Téléphone : plein écran (bouton « Marques » pour revenir). */

const linkCls = 'inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-xl border border-[hsl(var(--admin-border))] bg-white text-sm font-semibold text-[hsl(var(--admin-text))] hover:bg-[#F3EFE6]';

/** Une trottinette et ses offres, avec « + Offre ». Partagé avec l'onglet Trottinettes. */
export const ScooterOffersRow = ({ s, offers, programs }: { s: Scooter; offers: Offer[]; programs: Program[] }) => {
  const [adding, setAdding] = useState(false);
  const sorted = [...offers].sort((a, b) => Number(b.is_active) - Number(a.is_active) || (a.price_eur ?? 1e9) - (b.price_eur ?? 1e9));
  return (
    <div className={cn('grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 px-3 sm:px-4 py-3 border-t border-[#F0ECE3] first:border-t-0', !s.published && 'opacity-70')}>
      <ScooterPhoto src={s.image} name={s.name} />
      <div className="grid gap-2 min-w-0">
      <div className="flex items-center justify-between gap-3 min-h-[44px]">
        <a href={`/scooter/${s.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center min-h-[44px] text-sm font-bold text-[hsl(var(--admin-text))] hover:underline underline-offset-2">
          {s.name}{!s.published && <span className="font-normal text-[hsl(var(--admin-text-muted))]"> · non publiée</span>}
        </a>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1 min-h-[44px] px-3 rounded-xl border border-[hsl(var(--admin-border))] bg-white text-sm font-semibold shrink-0">
            <Plus className="w-4 h-4" />Offre
          </button>
        )}
      </div>
      {sorted.length
        ? <div className="grid gap-2">{sorted.map(o => <OfferLine key={o.id} o={o} programs={programs} />)}</div>
        : !adding && <p className="text-sm text-[hsl(var(--admin-text-muted))]">Sans lien.</p>}
      {adding && <OfferForm scooterId={s.id} onDone={() => setAdding(false)} />}
      </div>
    </div>
  );
};

const FIELDS_PROGRAMME: { k: keyof Program; label: string; placeholder?: string }[] = [
  { k: 'plateforme', label: 'Plateforme', placeholder: 'Awin, GoAffPro, Direct…' },
  { k: 'commission', label: 'Commission' },
  { k: 'code_ref', label: 'Code de parrainage (ref)' },
  { k: 'code_client', label: 'Code client (remise)', placeholder: 'NOLANDILIEGRO (-10 %)' },
  { k: 'id_marchand', label: 'ID marchand' },
  { k: 'lien_motif', label: 'Motif reconnu dans les liens', placeholder: 'awinmid=22897 ou ref=abcd' },
  { k: 'lien_base', label: 'Lien de base (avec suivi)' },
  { k: 'url_tableau_de_bord', label: 'Tableau de bord' },
  { k: 'url_paiements', label: 'Page paiements' },
  { k: 'priorite', label: 'Priorité', placeholder: 'P1, P2, P3' },
];
const FIELDS_CONTACT: { k: keyof Program; label: string; placeholder?: string }[] = [
  { k: 'contact_nom', label: 'Contact' },
  { k: 'contact_email', label: 'E-mail du contact' },
  { k: 'url_inscription', label: 'Page programme / inscription' },
];

const Field = ({ p, f, onSave }: { p: Program; f: { k: keyof Program; label: string; placeholder?: string }; onSave: (k: keyof Program, v: string | null) => void }) => {
  const [v, setV] = useState<string>((p[f.k] as string | null) ?? '');
  return (
    <label className="grid gap-1 text-sm font-semibold text-[hsl(var(--admin-text))]">{f.label}
      <Input id={`aff2-${f.k}`} value={v} placeholder={f.placeholder} onChange={e => setV(e.target.value)}
        onBlur={() => { const nv = v.trim() || null; if (nv !== ((p[f.k] as string | null) ?? null)) onSave(f.k, nv); }}
        className="bg-white min-h-[44px] text-sm" />
    </label>
  );
};

interface Props { p: Program; programs: Program[]; scooters: Scooter[]; d: Derived; onBack?: () => void }

const BrandPanel = ({ p, programs, scooters, d, onBack }: Props) => {
  const save = useSaveProgram();
  const setField = (k: keyof Program, v: string | null) => save.mutate({ id: p.id, patch: { [k]: v } as Partial<Program> });
  const cov = coverage(p, d);
  const models = useMemo(() => [...(d.byBrand.get(brandKey(p.marque)) || [])]
    .sort((a, b) => Number(b.published) - Number(a.published) || Number((d.offersByScooter.get(b.id) || []).length > 0) - Number((d.offersByScooter.get(a.id) || []).length > 0) || a.name.localeCompare(b.name)),
  [d, p.marque]);
  // Revendeur multi-marques : ses offres (reconnues par le motif) sur toutes les trottinettes.
  const programOffers = useMemo(() => {
    if (cov.hasBrand || p.type !== 'affiliation') return [];
    const ids = new Set<string>();
    d.offersByScooter.forEach((list, sid) => { if (list.some(o => programOfOffer(o, [p]))) ids.add(sid); });
    return scooters.filter(s => ids.has(s.id));
  }, [cov.hasBrand, d, p, scooters]);
  const journal = parseJournal(p.notes);
  const hasScooterTab = p.type === 'affiliation';
  const [tab, setTab] = useState<'trott' | 'prog' | 'hist' | 'contact'>(hasScooterTab ? 'trott' : 'prog');
  const [nextV, setNextV] = useState(p.prochaine_action ?? '');
  const [entry, setEntry] = useState('');
  const rate = parseRate(p.commission);
  // Gain estimé par vente : offres actives de CE programme (motif), au prix du jour.
  const gains = [...models, ...programOffers].flatMap(s => (d.offersByScooter.get(s.id) || [])
    .filter(o => o.is_active && programOfOffer(o, [p])).map(o => gainOf(o.price_eur, rate)?.hi).filter((g): g is number => g != null));

  const tabs = [
    hasScooterTab && { k: 'trott' as const, label: `Trottinettes ${cov.hasBrand ? models.length : programOffers.length}` },
    { k: 'prog' as const, label: 'Programme' },
    { k: 'hist' as const, label: `Historique ${journal.length}` },
    { k: 'contact' as const, label: 'Contact' },
  ].filter(Boolean) as { k: typeof tab; label: string }[];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
      {onBack && (
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 min-h-[44px] w-max text-sm font-bold text-[hsl(var(--admin-text))]">
          <ArrowLeft className="w-4 h-4" />Marques
        </button>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Logo src={d.logoByBrand.get(brandKey(p.marque))} name={p.marque} size={52} />
          <div className="min-w-0">
            <h3 className="text-xl font-black uppercase tracking-tight leading-tight text-[hsl(var(--admin-text))] break-words">{p.marque}</h3>
            <p className="text-sm text-[hsl(var(--admin-text-muted))]">
              {[p.type === 'fournisseur' ? 'Fournisseur' : p.plateforme, p.commission, p.priorite].filter(Boolean).join(' · ') || 'Aucun programme connu'}
            </p>
          </div>
        </div>
        <StatusPill s={p.statut} />
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Statut">
        {STATUTS.map(s => (
          <button key={s.k} type="button" disabled={save.isPending} aria-pressed={p.statut === s.k}
            onClick={() => p.statut !== s.k && save.mutate({ id: p.id, patch: { statut: s.k } })}
            className={cn('min-h-[44px] px-3 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-60',
              p.statut === s.k ? 'bg-[hsl(var(--admin-text))] text-white border-transparent' : 'bg-white text-[hsl(var(--admin-text))] border-[hsl(var(--admin-border))]')}>
            {s.label}
          </button>
        ))}
      </div>

      {p.type === 'affiliation' && (
        <div className="grid grid-cols-3 gap-2">
          {[[cov.hasBrand ? `${cov.linked}/${cov.total}` : String(programOffers.length), cov.hasBrand ? 'fiches publiées liées' : 'trottinettes couvertes'],
            [rate ? (rate.min == null ? `≤ ${rate.max} %` : rate.min === rate.max ? `${rate.max} %` : `${rate.min}-${rate.max} %`) : '—', 'commission'],
            [gains.length ? `${Math.round(gains.reduce((n, g) => n + g, 0) / gains.length)} €` : '—', gains.length ? `gain moyen par vente (max ${Math.max(...gains)} €)` : 'gain par vente']]
            .map(([a, b]) => (
              <div key={b} className="rounded-xl border border-[hsl(var(--admin-border))] bg-white px-3 py-2 min-w-0">
                <div className="text-xl font-black tabular-nums text-[hsl(var(--admin-text))]">{a}</div>
                <div className="text-sm text-[hsl(var(--admin-text-muted))] leading-tight">{b}</div>
              </div>
            ))}
        </div>
      )}

      <div className="grid gap-2 rounded-xl bg-[#EEF4EF] p-3">
        <label htmlFor="aff2-next" className="text-sm font-bold text-[hsl(var(--admin-text))]">Prochaine action</label>
        <div className="flex flex-wrap gap-2">
          <Input id="aff2-next" value={nextV} maxLength={160} onChange={e => setNextV(e.target.value)} placeholder="Ex. relancer par mail, poser les liens, attendre Awin"
            onBlur={() => { const v = nextV.trim() || null; if (v !== (p.prochaine_action ?? null)) setField('prochaine_action', v); }}
            className="bg-white min-h-[44px] text-sm flex-1 min-w-[200px]" />
          <label className="inline-flex items-center gap-2 min-h-[44px] px-3 rounded-xl border border-[hsl(var(--admin-border))] bg-white text-sm">
            <CalendarClock className="w-4 h-4 text-[hsl(var(--admin-text-muted))]" />
            <span className="sr-only">Date de relance</span>
            <input id="aff2-relance" type="date" value={p.relance_le ?? ''} onChange={e => setField('relance_le', e.target.value || null)} className="bg-transparent text-sm min-h-[40px]" />
          </label>
        </div>
        {p.relance_le && <p className="text-sm text-[hsl(var(--admin-text-muted))]">Relance prévue {fmtDate(p.relance_le)}.</p>}
      </div>

      {/* Kit de vente : tout ce qu'il faut copier pour partager, en un tap. */}
      <div className="grid gap-2.5 rounded-xl border border-[hsl(var(--admin-border))] bg-white p-3">
        <p className="text-sm font-black uppercase tracking-wide text-[hsl(var(--admin-text))]">Mes codes et liens</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {[
            { label: 'Code promo client', value: p.code_client?.split(' ')[0] ?? null, hint: p.code_client?.split(' ').slice(1).join(' ') || null, what: 'Code promo' },
            { label: 'Mon code partenaire (ref)', value: p.code_ref, hint: null, what: 'Code partenaire' },
          ].map(k => (
            <button key={k.label} type="button" disabled={!k.value} onClick={() => k.value && copy(k.value, k.what)}
              className="text-left grid gap-0.5 min-h-[60px] rounded-xl border border-dashed border-[hsl(var(--admin-border))] px-3 py-2 disabled:opacity-60 hover:border-[hsl(var(--admin-accent))]">
              <span className="text-sm text-[hsl(var(--admin-text-muted))]">{k.label}</span>
              <span className="flex items-center justify-between gap-2">
                <b className="font-mono text-base text-[hsl(var(--admin-text))] break-all">{k.value ?? 'Aucun'}</b>
                {k.value && <Copy className="w-4 h-4 shrink-0 text-[hsl(var(--admin-text-muted))]" />}
              </span>
              {k.hint && <span className="text-sm text-[hsl(var(--admin-accent))] font-semibold">{k.hint}</span>}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {p.lien_base && <button type="button" onClick={() => copy(p.lien_base!, 'Lien de la boutique')} className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-xl bg-[hsl(var(--admin-text))] text-white text-sm font-semibold"><Copy className="w-4 h-4" />Lien de la boutique</button>}
          {p.url_tableau_de_bord && <a href={p.url_tableau_de_bord} target="_blank" rel="noopener noreferrer" className={linkCls}><LayoutDashboard className="w-4 h-4" />Tableau de bord</a>}
          {p.url_paiements && <a href={p.url_paiements} target="_blank" rel="noopener noreferrer" className={linkCls}><Wallet className="w-4 h-4" />Paiements</a>}
        </div>
        {!p.code_client && !p.code_ref && !p.lien_base && <p className="text-sm text-[hsl(var(--admin-text-muted))]">Rien à copier pour l'instant : renseigne les codes dans l'onglet Programme dès que le programme est actif.</p>}
      </div>

      <div className="flex gap-1 overflow-x-auto scrollbar-none border-b border-[hsl(var(--admin-border))]" role="tablist">
        {tabs.map(t => (
          <button key={t.k} type="button" role="tab" aria-selected={tab === t.k} onClick={() => setTab(t.k)}
            className={cn('min-h-[44px] px-3.5 text-sm font-semibold whitespace-nowrap', tab === t.k ? 'text-[hsl(var(--admin-text))] shadow-[inset_0_-3px_0_hsl(var(--admin-accent))]' : 'text-[hsl(var(--admin-text-muted))]')}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'trott' && (
        <div className="rounded-xl border border-[hsl(var(--admin-border))] bg-white overflow-hidden">
          {cov.hasBrand
            ? models.map(s => <ScooterOffersRow key={s.id} s={s} offers={d.offersByScooter.get(s.id) || []} programs={programs} />)
            : programOffers.length
              ? programOffers.map(s => <ScooterOffersRow key={s.id} s={s} offers={(d.offersByScooter.get(s.id) || []).filter(o => programOfOffer(o, [p]))} programs={programs} />)
              : <p className="p-4 text-sm text-[hsl(var(--admin-text-muted))]">Aucune offre de ce programme pour l'instant. {p.lien_motif ? '' : 'Renseigne d\'abord le motif reconnu dans les liens (onglet Programme). '}Pour en poser une, ouvre la trottinette dans l'onglet Trottinettes et fais « + Offre ».</p>}
        </div>
      )}

      {tab === 'prog' && (
        <div key={p.updated_at} className="grid gap-3">
          {FIELDS_PROGRAMME.map(f => <Field key={f.k} p={p} f={f} onSave={setField} />)}
          <p className="text-sm text-[hsl(var(--admin-text-muted))]">Chaque champ s'enregistre quand tu le quittes. Jamais d'IBAN ni de mot de passe ici : ils se saisissent sur la plateforme.</p>
        </div>
      )}

      {tab === 'hist' && (
        <div className="grid gap-3">
          <form className="flex flex-wrap gap-2" onSubmit={e => {
            e.preventDefault();
            const t = entry.trim(); if (!t) return;
            const line = `${todayFr()} : ${t}`;
            save.mutate({ id: p.id, patch: { notes: p.notes?.trim() ? `${p.notes.trim()}\n${line}` : line } }, { onSuccess: () => setEntry('') });
          }}>
            <Textarea id="aff2-entry" rows={2} value={entry} onChange={e => setEntry(e.target.value)} placeholder="Ce qui s'est passé aujourd'hui (mail envoyé, réponse, lien posé…)" className="bg-white text-sm flex-1 min-w-[220px]" />
            <button type="submit" disabled={!entry.trim() || save.isPending} className="min-h-[44px] px-4 rounded-xl bg-[hsl(var(--admin-accent))] text-white text-sm font-semibold disabled:opacity-50 self-start">Ajouter au {todayFr()}</button>
          </form>
          {journal.length ? (
            <ol className="grid gap-0 rounded-xl border border-[hsl(var(--admin-border))] bg-white overflow-hidden">
              {journal.map((j, i) => (
                <li key={i} className="grid grid-cols-[64px_1fr] gap-3 px-3 py-2.5 border-t border-[#F0ECE3] first:border-t-0">
                  <span className="text-sm font-bold tabular-nums text-[hsl(var(--admin-text-muted))]">{j.date ?? '—'}</span>
                  <span className="text-sm text-[hsl(var(--admin-text))] break-words">{j.text}</span>
                </li>
              ))}
            </ol>
          ) : <p className="text-sm text-[hsl(var(--admin-text-muted))]">Aucune note pour l'instant.</p>}
        </div>
      )}

      {tab === 'contact' && (
        <div key={p.updated_at} className="grid gap-3">
          {FIELDS_CONTACT.map(f => <Field key={f.k} p={p} f={f} onSave={setField} />)}
          {p.contact_email && <button type="button" onClick={() => copy(p.contact_email!, 'E-mail')} className={linkCls + ' w-max'}><Copy className="w-4 h-4" />Copier {p.contact_email}</button>}
        </div>
      )}
    </div>
  );
};

export default BrandPanel;
