import { useState } from 'react';
import { Copy, ExternalLink, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { STATUT, type AffStatut, type Offer, type Program, eur, copy, hasTrackingParam, programOfOffer, useSaveOffer, useOffers, gainOf, parseRate } from './data';

/* Briques visuelles de l'admin Affiliation v2 (24/10/2026). */

export const Logo = ({ src, name, size = 36 }: { src?: string | null; name: string; size?: number }) => {
  const [broken, setBroken] = useState(false);
  const box = { width: size, height: size };
  if (src && !broken) return (
    <span style={box} className="shrink-0 rounded-[10px] bg-white border border-[hsl(var(--admin-border))] inline-flex items-center justify-center overflow-hidden">
      <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} className="max-w-[82%] max-h-[72%] object-contain" />
    </span>
  );
  const initials = name.replace(/\(.*\)/, '').replace(/[^A-Za-zÀ-ÿ0-9 ]/g, '').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  return <span style={{ ...box, fontSize: Math.max(14, Math.round(size * 0.4)) }} className="shrink-0 rounded-[10px] bg-[hsl(var(--admin-text))] text-white inline-flex items-center justify-center font-black">{initials}</span>;
};

export const StatusPill = ({ s }: { s: AffStatut }) => (
  <span className={cn('shrink-0 px-2.5 py-0.5 rounded-full text-sm font-bold whitespace-nowrap', STATUT[s]?.pill)}>{STATUT[s]?.label ?? s}</span>
);

export const StatusDot = ({ s }: { s: AffStatut }) => <span aria-hidden className={cn('inline-block w-2.5 h-2.5 rounded-full shrink-0', STATUT[s]?.dot)} />;

export const Gauge = ({ value, total }: { value: number; total: number }) => (
  <div className="h-1.5 rounded-full bg-[#ECE7DC] overflow-hidden" role="img" aria-label={`${value} sur ${total}`}>
    <div className="h-full bg-[hsl(var(--admin-accent))]" style={{ width: `${total ? Math.round((value / total) * 100) : 0}%` }} />
  </div>
);

export const IconBtn = ({ label, onClick, href, children }: { label: string; onClick?: () => void; href?: string; children: React.ReactNode }) => {
  const cls = 'inline-flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-2.5 rounded-xl border border-[hsl(var(--admin-border))] bg-white text-sm font-semibold text-[hsl(var(--admin-text))] hover:bg-[#F3EFE6]';
  return href
    ? <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className={cls}>{children}</a>
    : <button type="button" onClick={onClick} aria-label={label} title={label} className={cls}>{children}</button>;
};

/** Une offre : marchand, prix du jour, stock, suivi + copier / ouvrir / activer. */
export const OfferLine = ({ o, programs }: { o: Offer; programs: Program[] }) => {
  const save = useSaveOffer();
  const prog = programOfOffer(o, programs);
  const gain = gainOf(o.price_eur, parseRate(prog?.commission));
  return (
    <div className={cn('grid gap-2 rounded-xl border border-[hsl(var(--admin-border))] bg-[#FBFAF7] px-3 py-2.5', !o.is_active && 'opacity-60')}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-bold text-sm text-[hsl(var(--admin-text))] break-all">{o.merchant_host.replace(/^www\./, '')}</span>
        {o.offer_type !== 'marque' && <span className="text-sm font-bold uppercase tracking-wide text-[hsl(var(--admin-text-muted))]">{o.offer_type}</span>}
        {o.price_eur != null && <span className="text-sm tabular-nums font-semibold">{eur(o.price_eur)}</span>}
        {o.in_stock != null && <span className={cn('text-sm font-semibold', o.in_stock ? 'text-[#2F6B45]' : 'text-amber-700')}>{o.in_stock ? 'en stock' : 'rupture'}</span>}
        <span className={cn('text-sm font-semibold', prog ? 'text-[#2F6B45]' : 'text-amber-700')}>{prog ? 'suivi ✓' : 'sans suivi'}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {gain
          ? <span className="inline-flex items-baseline gap-1.5 rounded-lg bg-[hsl(var(--admin-accent))] text-white px-2.5 py-1.5">
              <span className="text-sm">Tu gagnes</span><b className="text-base tabular-nums">{gain.label}</b><span className="text-sm opacity-90">par vente · {gain.rate}</span>
            </span>
          : <span className="text-sm text-[hsl(var(--admin-text-muted))]">{prog ? (o.price_eur == null ? 'Gain : prix pas encore relevé' : 'Gain : commission à renseigner dans Programme') : 'Gain : aucun programme reconnu'}</span>}
        <span className="ml-auto flex items-center gap-1.5">
          <button type="button" onClick={() => copy(o.affiliate_url, 'Lien partenaire')}
            className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-xl bg-[hsl(var(--admin-text))] text-white text-sm font-semibold">
            <Copy className="w-4 h-4" />Mon lien
          </button>
          <IconBtn label="Ouvrir la page produit" href={o.product_url}><ExternalLink className="w-4 h-4" /></IconBtn>
          <label className="inline-flex items-center gap-2 min-h-[44px] px-1 text-sm text-[hsl(var(--admin-text-muted))]">
            <Switch checked={o.is_active} disabled={save.isPending} onCheckedChange={v => save.mutate({ id: o.id, patch: { is_active: v } })} aria-label={o.is_active ? 'Désactiver cette offre' : 'Activer cette offre'} />
            <span className="hidden sm:inline">{o.is_active ? 'Active' : 'Coupée'}</span>
          </label>
        </span>
      </div>
    </div>
  );
};

/** Photo de la trottinette (repli : initiales de la marque). */
export const ScooterPhoto = ({ src, name, size = 64 }: { src: string | null; name: string; size?: number }) => {
  const [broken, setBroken] = useState(false);
  return (
    <span style={{ width: size, height: size }} className="shrink-0 rounded-xl bg-white border border-[hsl(var(--admin-border))] inline-flex items-center justify-center overflow-hidden">
      {src && !broken
        ? <img src={src} alt={name} loading="lazy" onError={() => setBroken(true)} className="w-full h-full object-contain p-1" />
        : <span className="text-sm font-black text-[hsl(var(--admin-text-muted))]">{name.slice(0, 2).toUpperCase()}</span>}
    </span>
  );
};

/** Ajout d'une offre sur une trottinette. Le marchand est lu dans l'URL de la page produit. */
export const OfferForm = ({ scooterId, onDone }: { scooterId: string; onDone: () => void }) => {
  const save = useSaveOffer();
  const [aff, setAff] = useState('');
  const [prod, setProd] = useState('');
  const [type, setType] = useState<Offer['offer_type']>('marque');
  const [price, setPrice] = useState('');
  const productUrl = (() => {
    if (prod.trim()) return prod.trim();
    try { const u = new URL(aff.trim()); return u.searchParams.get('ued') || `${u.origin}${u.pathname}`; } catch { return ''; }
  })();
  // Même marchand = même écriture du domaine que les offres existantes (naveetech.fr vs www.naveetech.fr),
  // sinon la contrainte « un marchand par trottinette » laisserait passer un doublon.
  const { data: allOffers = [] } = useOffers();
  let host = '';
  try { host = new URL(productUrl).hostname; } catch { /* saisie en cours */ }
  const bare = host.replace(/^www\./, '');
  const known = allOffers.find(o => o.merchant_host.replace(/^www\./, '') === bare);
  if (host && known) host = known.merchant_host;
  const p = price.trim() ? Number(price.replace(',', '.')) : null;
  const errors = [
    !/^https:\/\//.test(aff.trim()) && 'Le lien partenaire doit commencer par https://',
    productUrl && !/^https:\/\//.test(productUrl) && 'La page produit doit commencer par https://',
    !host && aff.trim() && 'Page produit illisible : colle-la dans le 2e champ',
    p != null && (Number.isNaN(p) || p < 50 || p > 20000) && 'Prix entre 50 et 20 000 €, ou vide',
  ].filter(Boolean) as string[];
  const untracked = aff.trim() && !hasTrackingParam(aff.trim());

  return (
    <form className="grid gap-2.5 rounded-xl border border-dashed border-[hsl(var(--admin-accent))] bg-white p-3"
      onSubmit={e => {
        e.preventDefault();
        if (errors.length || !host) return;
        save.mutate({ insert: { scooter_model_id: scooterId, affiliate_url: aff.trim(), product_url: productUrl, merchant_host: host, offer_type: type, price_eur: p } }, { onSuccess: onDone });
      }}>
      <label className="grid gap-1 text-sm font-semibold">Lien partenaire (avec suivi)
        <Input id={`of-aff-${scooterId}`} value={aff} onChange={e => setAff(e.target.value)} placeholder="https://…?ref=… ou lien Awin" className="min-h-[44px] text-sm bg-white" inputMode="url" />
      </label>
      <label className="grid gap-1 text-sm font-semibold">Page produit (si différente)
        <Input id={`of-prod-${scooterId}`} value={prod} onChange={e => setProd(e.target.value)} placeholder="lue dans le lien si vide" className="min-h-[44px] text-sm bg-white" inputMode="url" />
      </label>
      <div className="flex flex-wrap gap-2">
        {(['marque', 'revendeur', 'amazon'] as const).map(t => (
          <button key={t} type="button" onClick={() => setType(t)} aria-pressed={type === t}
            className={cn('min-h-[44px] px-3.5 rounded-xl text-sm font-semibold border', type === t ? 'bg-[hsl(var(--admin-text))] text-white border-transparent' : 'bg-white border-[hsl(var(--admin-border))]')}>
            {t === 'marque' ? 'Boutique de la marque' : t === 'revendeur' ? 'Revendeur' : 'Amazon'}
          </button>
        ))}
        <Input id={`of-price-${scooterId}`} value={price} onChange={e => setPrice(e.target.value)} placeholder="Prix (optionnel)" inputMode="decimal" className="min-h-[44px] text-sm bg-white w-40" />
      </div>
      {host && <p className="text-sm text-[hsl(var(--admin-text-muted))]">Marchand : <b className="text-[hsl(var(--admin-text))]">{host}</b>. Le robot de prix lira le prix et le stock la nuit suivante si la boutique est lisible.</p>}
      {untracked && <p className="text-sm font-semibold text-amber-800">Aucun paramètre de suivi dans ce lien : il ne rapportera rien. Vérifie le ?ref= ou le lien Awin.</p>}
      {errors.map(er => <p key={er} className="text-sm font-semibold text-red-700">{er}</p>)}
      <div className="flex gap-2">
        <button type="submit" disabled={save.isPending || !!errors.length || !host}
          className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-xl bg-[hsl(var(--admin-accent))] text-white text-sm font-semibold disabled:opacity-50">
          <Plus className="w-4 h-4" />Ajouter l'offre
        </button>
        <button type="button" onClick={onDone} className="min-h-[44px] px-4 rounded-xl border border-[hsl(var(--admin-border))] bg-white text-sm font-semibold">Annuler</button>
      </div>
    </form>
  );
};
