import { useMemo, useState } from 'react';
import { Copy, Link2, Users, ShoppingBag, Wallet, CalendarClock, Crown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

/* 24/10/2026 — Ambassadeurs en kanban (propositions ?amb=1..5, cf. skill cinq-propositions-rendues).
   Composant de présentation pur : il reçoit les lignes, ne lit rien en base. */

export type AmbStatut = 'prospect' | 'contacte' | 'test' | 'actif' | 'pause';
export interface BoardRow {
  ambassador_id: string; nom: string; handle: string | null; reseau: string | null; avatar_url: string | null;
  abonnes: number | null; statut: AmbStatut; taux_commission: number; codes_actifs: string | null;
  cartes_rider: number; commandes: number; a_verser: number; prochaine_action: string | null; relance_le: string | null;
}

export const COLONNES: { k: AmbStatut; label: string; dot: string; ring: string; chip: string }[] = [
  { k: 'prospect', label: 'À contacter', dot: 'bg-gray-400', ring: 'ring-gray-300', chip: 'bg-gray-100 text-gray-700' },
  { k: 'contacte', label: 'Contacté', dot: 'bg-sky-500', ring: 'ring-sky-400', chip: 'bg-sky-100 text-sky-900' },
  { k: 'test', label: 'En test', dot: 'bg-amber-500', ring: 'ring-amber-400', chip: 'bg-amber-100 text-amber-900' },
  { k: 'actif', label: 'Actif', dot: 'bg-[hsl(var(--admin-accent))]', ring: 'ring-[hsl(var(--admin-accent))]', chip: 'bg-[hsl(var(--admin-accent)/0.15)] text-[hsl(var(--admin-accent))]' },
  { k: 'pause', label: 'Pause / arrêt', dot: 'bg-gray-700', ring: 'ring-gray-600', chip: 'bg-gray-200 text-gray-800' },
];
const COL = Object.fromEntries(COLONNES.map((c) => [c.k, c])) as Record<AmbStatut, (typeof COLONNES)[number]>;

export const eur = (n: number) => `${Number(n || 0).toFixed(2).replace('.', ',')} €`;
export const abonnes = (n: number | null) =>
  n == null ? '—' : n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace('.', ',')} M` : n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1).replace('.', ',')} k` : String(n);
const premierCode = (r: BoardRow) => (r.codes_actifs ?? '').split(',')[0]?.trim() || '';
const enRetard = (d: string | null) => !!d && new Date(d) < new Date(new Date().toDateString());
const dateCourte = (d: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '');

const TEINTES = ['from-emerald-500 to-teal-700', 'from-orange-400 to-rose-600', 'from-sky-500 to-indigo-700', 'from-amber-400 to-orange-600', 'from-fuchsia-500 to-purple-700', 'from-lime-500 to-green-700'];
const teinte = (s: string) => TEINTES[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % TEINTES.length];

export const Avatar = ({ r, size = 44, ring = true }: { r: BoardRow; size?: number; ring?: boolean }) => (
  <span className={cn('relative inline-flex shrink-0 rounded-full', ring && 'ring-2 ring-offset-2 ring-offset-white', ring && COL[r.statut].ring)}
    style={{ width: size, height: size }}>
    {r.avatar_url
      ? <img src={r.avatar_url} alt="" className="w-full h-full rounded-full object-cover" loading="lazy" />
      : <span className={cn('w-full h-full rounded-full bg-gradient-to-br text-white font-black grid place-items-center', teinte(r.nom))}
          style={{ fontSize: Math.max(14, size * 0.38) }}>{r.nom.slice(0, 1).toUpperCase()}</span>}
  </span>
);

type Actions = { onOpen: (id: string) => void; onCopy: (txt: string, quoi: string) => void; lien: (code: string) => string; onAdd?: (s: AmbStatut) => void };

const CodeChip = ({ r, a, dark }: { r: BoardRow; a: Actions; dark?: boolean }) => {
  const code = premierCode(r);
  if (!code) return <span className="text-sm text-amber-700">Pas de code actif</span>;
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn('px-2.5 py-1.5 rounded-lg font-black tracking-wide text-sm', dark ? 'bg-white/10 text-white' : 'bg-[hsl(var(--admin-accent)/0.12)] text-[hsl(var(--admin-accent))]')}>{code}</span>
      <button type="button" aria-label="Copier le code" onClick={(e) => { e.stopPropagation(); a.onCopy(code, 'Code'); }}
        className={cn('w-11 h-11 grid place-items-center rounded-lg', dark ? 'text-white/80 hover:bg-white/10' : 'text-[hsl(var(--admin-text-muted))] hover:bg-[hsl(var(--aov03))]')}><Copy className="w-4 h-4" /></button>
      <button type="button" aria-label="Copier le lien" onClick={(e) => { e.stopPropagation(); a.onCopy(a.lien(code), 'Lien'); }}
        className={cn('w-11 h-11 grid place-items-center rounded-lg', dark ? 'text-white/80 hover:bg-white/10' : 'text-[hsl(var(--admin-text-muted))] hover:bg-[hsl(var(--aov03))]')}><Link2 className="w-4 h-4" /></button>
    </div>
  );
};

const Relance = ({ r }: { r: BoardRow }) => (r.prochaine_action || r.relance_le) ? (
  <p className={cn('flex items-start gap-1.5 text-sm', enRetard(r.relance_le) ? 'text-red-700' : 'text-[hsl(var(--admin-text-muted))]')}>
    <CalendarClock className="w-4 h-4 shrink-0 mt-0.5" />
    <span className="min-w-0">{r.relance_le && <b className="font-bold">{dateCourte(r.relance_le)} · </b>}{r.prochaine_action}</span>
  </p>
) : null;

const Mini = ({ icon: Icon, v, label }: { icon: typeof Users; v: string | number; label: string }) => (
  <span className="inline-flex items-center gap-1 text-sm text-[hsl(var(--admin-text))] tabular-nums" title={label}>
    <Icon className="w-4 h-4 text-[hsl(var(--admin-text-muted))]" />{v}
  </span>
);

const ColHead = ({ c, rows, a }: { c: (typeof COLONNES)[number]; rows: BoardRow[]; a: Actions }) => (
  <div className="flex items-center justify-between gap-2 min-h-[44px]">
    <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-[hsl(var(--admin-text))]">
      <span className={cn('w-2.5 h-2.5 rounded-full', c.dot)} />{c.label}
      <span className="font-bold text-[hsl(var(--admin-text-muted))] tabular-nums">{rows.length}</span>
    </p>
    {a.onAdd && c.k === 'prospect' && (
      <button type="button" onClick={() => a.onAdd?.('prospect')} aria-label="Ajouter un créateur à contacter"
        className="w-11 h-11 grid place-items-center rounded-xl border border-[hsl(var(--admin-border))] bg-white text-[hsl(var(--admin-text))]"><Plus className="w-4 h-4" /></button>
    )}
  </div>
);

const groupe = (rows: BoardRow[]) => Object.fromEntries(COLONNES.map((c) => [c.k, rows.filter((r) => r.statut === c.k)])) as Record<AmbStatut, BoardRow[]>;

/* ── 1 · Cockpit : le kanban de l'affiliation, cartes compactes avec photo ── */
const CarteCockpit = ({ r, a }: { r: BoardRow; a: Actions }) => (
  <li className="rounded-2xl border border-[hsl(var(--admin-border))] bg-white p-3 space-y-2.5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => a.onOpen(r.ambassador_id)}>
    <div className="flex items-center gap-3">
      <Avatar r={r} />
      <div className="min-w-0 flex-1">
        <p className="font-black uppercase tracking-tight text-[hsl(var(--admin-text))] truncate">{r.nom}</p>
        <p className="text-sm text-[hsl(var(--admin-text-muted))] truncate">{r.handle || 'compte à renseigner'} · {abonnes(r.abonnes)}</p>
      </div>
    </div>
    {(r.statut === 'actif' || r.statut === 'test' || r.statut === 'pause') && (
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <Mini icon={Users} v={r.cartes_rider} label="Cartes Rider ramenées" />
        <Mini icon={ShoppingBag} v={r.commandes} label="Commandes" />
        <Mini icon={Wallet} v={eur(r.a_verser)} label="À verser" />
      </div>
    )}
    {r.statut !== 'prospect' && <CodeChip r={r} a={a} />}
    <Relance r={r} />
  </li>
);

const V1 = ({ rows, a }: { rows: BoardRow[]; a: Actions }) => {
  const g = groupe(rows);
  const [col, setCol] = useState<AmbStatut>('actif');
  return (
    <>
      <div className="lg:hidden flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {COLONNES.map((c) => (
          <button key={c.k} type="button" onClick={() => setCol(c.k)}
            className={cn('shrink-0 min-h-[44px] px-3.5 rounded-xl text-sm font-semibold border inline-flex items-center gap-2',
              col === c.k ? 'bg-[hsl(var(--admin-text))] text-white border-transparent' : 'bg-white border-[hsl(var(--admin-border))] text-[hsl(var(--admin-text-muted))]')}>
            <span className={cn('w-2 h-2 rounded-full', c.dot)} />{c.label} <span className="tabular-nums">{g[c.k].length}</span>
          </button>
        ))}
      </div>
      <ul className="lg:hidden space-y-2">{g[col].map((r) => <CarteCockpit key={r.ambassador_id} r={r} a={a} />)}</ul>
      <div className="hidden lg:grid grid-cols-5 gap-3 items-start">
        {COLONNES.map((c) => (
          <section key={c.k} className="rounded-2xl bg-[hsl(var(--aov03,40_20%_96%))] p-2 space-y-2 min-h-[200px]">
            <ColHead c={c} rows={g[c.k]} a={a} />
            <ul className="space-y-2">{g[c.k].map((r) => <CarteCockpit key={r.ambassador_id} r={r} a={a} />)}</ul>
          </section>
        ))}
      </div>
    </>
  );
};

/* ── 2 · Cartes Rider : façon carte de joueur, carbone + vert, grande photo ── */
const CarteRider = ({ r, a }: { r: BoardRow; a: Actions }) => (
  <li className="relative shrink-0 w-[260px] lg:w-auto rounded-2xl bg-[#1A1A1A] text-white p-4 space-y-3 cursor-pointer overflow-hidden snap-start"
    style={{ clipPath: 'polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%)' }} onClick={() => a.onOpen(r.ambassador_id)}>
    <span className={cn('absolute top-3 right-6 text-sm font-black uppercase tracking-wider px-2 py-1 rounded', COL[r.statut].chip)}>{COL[r.statut].label}</span>
    <div className="flex flex-col items-center text-center gap-2 pt-2">
      <Avatar r={r} size={76} />
      <div className="min-w-0 w-full">
        <p className="text-lg font-black uppercase tracking-tight truncate">{r.nom}</p>
        <p className="text-sm text-white/60 truncate">{r.handle || 'compte à renseigner'}</p>
      </div>
    </div>
    <div className="grid grid-cols-3 rounded-xl bg-white/5 divide-x divide-white/10 text-center">
      <div className="py-2"><p className="text-base font-black tabular-nums">{abonnes(r.abonnes)}</p><p className="text-sm text-white/60">abonnés</p></div>
      <div className="py-2"><p className="text-base font-black tabular-nums">{r.commandes}</p><p className="text-sm text-white/60">ventes</p></div>
      <div className="py-2"><p className="text-base font-black tabular-nums text-emerald-400">{Math.round(r.a_verser)} €</p><p className="text-sm text-white/60">à verser</p></div>
    </div>
    <div className="flex justify-center">{r.statut !== 'prospect' ? <CodeChip r={r} a={a} dark /> : <span className="text-sm text-white/60 min-h-[44px] grid place-items-center">{r.prochaine_action || 'À démarcher'}</span>}</div>
  </li>
);

const V2 = ({ rows, a }: { rows: BoardRow[]; a: Actions }) => {
  const g = groupe(rows);
  return (
    <div className="space-y-5 lg:space-y-0 lg:grid lg:grid-cols-5 lg:gap-3 lg:items-start">
      {COLONNES.map((c) => (
        <section key={c.k} className="space-y-2">
          <ColHead c={c} rows={g[c.k]} a={a} />
          {g[c.k].length === 0
            ? <p className="text-sm text-[hsl(var(--admin-text-muted))] px-1">Personne ici.</p>
            : <ul className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible snap-x snap-mandatory -mx-4 px-4 lg:mx-0 lg:px-0 pb-1">{g[c.k].map((r) => <CarteRider key={r.ambassador_id} r={r} a={a} />)}</ul>}
        </section>
      ))}
    </div>
  );
};

/* ── 3 · Chasse : pipeline de démarchage, lignes denses, relances d'abord ── */
const LigneChasse = ({ r, a }: { r: BoardRow; a: Actions }) => (
  <li className="flex items-center gap-3 px-3 py-2 min-h-[60px] cursor-pointer hover:bg-[hsl(var(--aov03))]" onClick={() => a.onOpen(r.ambassador_id)}>
    <Avatar r={r} size={38} ring={false} />
    <div className="min-w-0 flex-1">
      <p className="flex items-center gap-2 min-w-0">
        <span className="font-bold text-[hsl(var(--admin-text))] truncate">{r.nom}</span>
        <span className="shrink-0 text-sm font-bold px-1.5 py-0.5 rounded bg-[hsl(var(--admin-text))] text-white tabular-nums">{abonnes(r.abonnes)}</span>
      </p>
      {r.prochaine_action || r.relance_le
        ? <p className={cn('text-sm truncate', enRetard(r.relance_le) ? 'text-red-700 font-semibold' : 'text-[hsl(var(--admin-text-muted))]')}>
            {r.relance_le && `${enRetard(r.relance_le) ? 'En retard · ' : ''}${dateCourte(r.relance_le)} · `}{r.prochaine_action}</p>
        : <p className="text-sm text-[hsl(var(--admin-text-muted))] truncate">{premierCode(r) || r.handle}</p>}
    </div>
    {r.statut === 'actif' && <span className="shrink-0 text-sm font-black tabular-nums text-[hsl(var(--admin-text))]">{r.commandes} <span className="font-normal text-[hsl(var(--admin-text-muted))]">cmd</span></span>}
  </li>
);

const V3 = ({ rows, a }: { rows: BoardRow[]; a: Actions }) => {
  const g = groupe(rows);
  const retards = rows.filter((r) => enRetard(r.relance_le)).length;
  const audience = rows.filter((r) => r.statut === 'actif').reduce((s, r) => s + (r.abonnes || 0), 0);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="px-3 py-2 rounded-xl bg-red-50 text-red-800 font-semibold">{retards} relance{retards > 1 ? 's' : ''} en retard</span>
        <span className="px-3 py-2 rounded-xl bg-white border border-[hsl(var(--admin-border))] font-semibold tabular-nums">Audience active : {abonnes(audience)}</span>
      </div>
      <div className="lg:hidden flex rounded-xl overflow-hidden h-2.5">
        {COLONNES.map((c) => <span key={c.k} className={c.dot} style={{ flex: Math.max(g[c.k].length, 0.15) }} />)}
      </div>
      <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-5 lg:gap-3 lg:items-start">
        {COLONNES.map((c) => (
          <section key={c.k} className="rounded-2xl border border-[hsl(var(--admin-border))] bg-white overflow-hidden">
            <div className={cn('px-3 border-b border-[hsl(var(--admin-border))]', 'border-t-4', c.k === 'actif' ? 'border-t-[hsl(var(--admin-accent))]' : c.k === 'test' ? 'border-t-amber-500' : c.k === 'contacte' ? 'border-t-sky-500' : c.k === 'pause' ? 'border-t-gray-700' : 'border-t-gray-300')}>
              <ColHead c={c} rows={g[c.k]} a={a} />
            </div>
            <ul className="divide-y divide-[hsl(var(--admin-border))]">{g[c.k].map((r) => <LigneChasse key={r.ambassador_id} r={r} a={a} />)}</ul>
          </section>
        ))}
      </div>
    </div>
  );
};

/* ── 4 · Podium : le classement des créateurs qui vendent, puis le kanban ── */
const V4 = ({ rows, a }: { rows: BoardRow[]; a: Actions }) => {
  const top = useMemo(() => [...rows].filter((r) => r.commandes > 0).sort((x, y) => y.commandes - x.commandes).slice(0, 3), [rows]);
  const ordre = [top[1], top[0], top[2]].filter(Boolean) as BoardRow[];
  const hauteurs = (r: BoardRow) => (r === top[0] ? 'h-24' : r === top[1] ? 'h-16' : 'h-12');
  return (
    <div className="space-y-5">
      {top.length > 0 && (
        <div className="rounded-2xl bg-[#1A1A1A] p-4 pt-5">
          <p className="text-sm font-black uppercase tracking-wide text-white/70 mb-3 flex items-center gap-2"><Crown className="w-4 h-4 text-amber-400" />Top créateurs · ventes</p>
          <div className="flex items-end justify-center gap-3">
            {ordre.map((r) => (
              <button key={r.ambassador_id} type="button" onClick={() => a.onOpen(r.ambassador_id)} className="flex-1 max-w-[150px] flex flex-col items-center gap-2 min-w-0">
                <Avatar r={r} size={r === top[0] ? 72 : 56} />
                <p className="text-sm font-black uppercase text-white truncate w-full text-center">{r.nom}</p>
                <div className={cn('w-full rounded-t-xl grid place-items-center', hauteurs(r), r === top[0] ? 'bg-[hsl(var(--admin-accent))]' : 'bg-white/15')}>
                  <span className="text-lg font-black text-white tabular-nums">{r.commandes}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      <V1 rows={rows} a={a} />
    </div>
  );
};

/* ── 5 · Stories : les photos en ronds façon TikTok en haut, filtre par statut ── */
const V5 = ({ rows, a }: { rows: BoardRow[]; a: Actions }) => {
  const g = groupe(rows);
  const [col, setCol] = useState<AmbStatut | 'tous'>('tous');
  const liste = col === 'tous' ? rows : g[col];
  return (
    <div className="space-y-4">
      <ul className="flex gap-4 overflow-x-auto -mx-4 px-4 pb-2">
        {rows.map((r) => (
          <li key={r.ambassador_id} className="shrink-0">
            <button type="button" onClick={() => a.onOpen(r.ambassador_id)} className="flex flex-col items-center gap-1.5 w-[72px]">
              <span className={cn('p-[3px] rounded-full',
                r.statut === 'actif' ? 'bg-gradient-to-tr from-[#FF6600] via-amber-400 to-[hsl(var(--admin-accent))]' : r.statut === 'test' ? 'bg-amber-400' : r.statut === 'contacte' ? 'bg-sky-400' : 'bg-gray-300')}>
                <span className="block p-[2px] rounded-full bg-white"><Avatar r={r} size={58} ring={false} /></span>
              </span>
              <span className="text-sm text-[hsl(var(--admin-text))] truncate w-full text-center">{r.nom}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
        {[{ k: 'tous' as const, label: 'Tous', dot: 'bg-[hsl(var(--admin-text))]' }, ...COLONNES].map((c) => (
          <button key={c.k} type="button" onClick={() => setCol(c.k)}
            className={cn('shrink-0 min-h-[44px] px-3.5 rounded-full text-sm font-semibold border inline-flex items-center gap-2',
              col === c.k ? 'bg-[hsl(var(--admin-text))] text-white border-transparent' : 'bg-white border-[hsl(var(--admin-border))] text-[hsl(var(--admin-text-muted))]')}>
            <span className={cn('w-2 h-2 rounded-full', c.dot)} />{c.label} <span className="tabular-nums">{c.k === 'tous' ? rows.length : g[c.k].length}</span>
          </button>
        ))}
      </div>
      <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {liste.map((r) => (
          <li key={r.ambassador_id} onClick={() => a.onOpen(r.ambassador_id)}
            className="rounded-2xl border border-[hsl(var(--admin-border))] bg-white p-3 flex flex-col items-center text-center gap-2 cursor-pointer hover:shadow-md min-w-0">
            <Avatar r={r} size={56} />
            <div className="min-w-0 w-full">
              <p className="font-black uppercase tracking-tight truncate text-[hsl(var(--admin-text))]">{r.nom}</p>
              <p className="text-sm text-[hsl(var(--admin-text-muted))] truncate">{abonnes(r.abonnes)} abonnés</p>
            </div>
            <span className={cn('text-sm font-bold px-2 py-1 rounded-full', COL[r.statut].chip)}>{COL[r.statut].label}</span>
            {r.statut === 'actif'
              ? <p className="text-sm tabular-nums"><b>{r.commandes}</b> cmd · <b>{Math.round(r.a_verser)} €</b></p>
              : <p className={cn('text-sm line-clamp-2', enRetard(r.relance_le) ? 'text-red-700' : 'text-[hsl(var(--admin-text-muted))]')}>{r.prochaine_action || '—'}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export const BOARD_VARIANTES = { 1: 'Cockpit', 2: 'Cartes Rider', 3: 'Chasse', 4: 'Podium', 5: 'Stories' } as const;

const AmbassadorsBoard = ({ variant, rows, actions }: { variant: 1 | 2 | 3 | 4 | 5; rows: BoardRow[]; actions: Actions }) => {
  if (variant === 2) return <V2 rows={rows} a={actions} />;
  if (variant === 3) return <V3 rows={rows} a={actions} />;
  if (variant === 4) return <V4 rows={rows} a={actions} />;
  if (variant === 5) return <V5 rows={rows} a={actions} />;
  return <V1 rows={rows} a={actions} />;
};

export default AmbassadorsBoard;
