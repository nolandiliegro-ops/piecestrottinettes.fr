import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Copy, Link2, Plus, Download, Check, AlertTriangle, Power } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

/* 24/10/2026 (Nolan, GO « programme ambassadeurs ») — les créateurs qui amènent des ventes.
   Un ambassadeur = un code promo -10 % (plafond 30 €) relié à lui (promo_codes.ambassador_id) + un lien ?ref=CODE.
   Commission = taux × (lignes éligibles × 0,9) sur les commandes payées ; acquise après 30 jours (retours).
   Chiffres : vue public.ambassador_stats. Versements : public.ambassador_payouts (1 par mois et par ambassadeur).
   JAMAIS d'IBAN ici : seulement l'adresse PayPal de versement. Doc : claude/PT-lot-ambassadeurs.md. */

const SITE = 'https://piecestrottinettes.fr';
const SEUIL_VERSEMENT = 20;

interface StatRow {
  ambassador_id: string; nom: string; handle: string | null; statut: 'actif' | 'pause' | 'arrete';
  taux_commission: number; email_paypal: string | null; codes_actifs: string | null; cartes_rider: number;
  commandes: number; base_commissionnable_ht: number; commission_acquise: number; commission_en_attente: number; deja_paye: number;
}
interface CodeRow { code: string; active: boolean; created_at: string }
interface OrderRow { id: string; order_number: string; status: string; total_ttc: number; promo_code: string; customer_email: string; created_at: string }

// Tables absentes des types générés : accès non typé.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any; rpc: (f: string, a?: Record<string, unknown>) => any };

const eur = (n: number) => `${Number(n || 0).toFixed(2).replace('.', ',')} €`;
const solde = (r: StatRow) => Math.max(0, Number(r.commission_acquise) - Number(r.deja_paye));
const premierCode = (r: StatRow) => (r.codes_actifs ?? '').split(',')[0]?.trim() || '';
const lien = (code: string) => `${SITE}/?ref=${code}`;
const periodeCourante = () => new Date().toISOString().slice(0, 7);

const STATUTS = [
  { k: 'actif', label: 'Actif', cls: 'bg-[hsl(var(--admin-accent))] text-white' },
  { k: 'pause', label: 'En pause', cls: 'bg-amber-100 text-amber-900' },
  { k: 'arrete', label: 'Arrêté', cls: 'bg-gray-100 text-gray-700' },
] as const;

const copier = async (txt: string, quoi: string) => {
  try { await navigator.clipboard.writeText(txt); toast.success(`${quoi} copié`); }
  catch { toast.error('Copie impossible : sélectionne le texte à la main'); }
};

const useStats = () => useQuery({
  queryKey: ['ambassador-stats'],
  queryFn: async (): Promise<StatRow[]> => {
    const { data, error } = await db.from('ambassador_stats').select('*').order('nom');
    if (error) throw error;
    return (data || []) as StatRow[];
  },
});

const Btn = ({ onClick, icon: Icon, children, disabled, tone = 'base' }: { onClick: () => void; icon: typeof Copy; children: React.ReactNode; disabled?: boolean; tone?: 'base' | 'accent' }) => (
  <button type="button" onClick={onClick} disabled={disabled}
    className={cn('inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-xl border text-sm font-semibold disabled:opacity-50',
      tone === 'accent'
        ? 'bg-[hsl(var(--admin-accent))] border-transparent text-white'
        : 'border-[hsl(var(--admin-border))] bg-white text-[hsl(var(--admin-text))] hover:bg-[hsl(var(--aov03))]')}>
    <Icon className="w-4 h-4" />{children}
  </button>
);

const Chiffre = ({ label, value, strong }: { label: string; value: string | number; strong?: boolean }) => (
  <div className="rounded-xl border border-[hsl(var(--admin-border))] bg-white px-3 py-2">
    <p className="text-sm text-[hsl(var(--admin-text-muted))]">{label}</p>
    <p className={cn('tabular-nums text-[hsl(var(--admin-text))]', strong ? 'text-lg font-black' : 'text-base font-bold')}>{value}</p>
  </div>
);

/* ── Création en 1 geste : le code s'écrit tout seul à partir du nom, modifiable avant de valider ── */
const NouvelAmbassadeur = () => {
  const qc = useQueryClient();
  const [nom, setNom] = useState('');
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeTouche, setCodeTouche] = useState(false);

  const proposer = async (n: string) => {
    if (codeTouche || !n.trim()) return;
    const { data } = await db.rpc('make_ambassador_code', { p_nom: n });
    if (typeof data === 'string') setCode(data);
  };

  const creer = useMutation({
    mutationFn: async () => {
      const { data, error } = await db.rpc('create_ambassador', {
        p_nom: nom.trim(), p_handle: handle.trim() || null, p_email_paypal: email.trim() || null, p_code: code.trim() || null,
      });
      if (error) throw error;
      return (Array.isArray(data) ? data[0] : data) as { code: string };
    },
    onSuccess: (r) => {
      toast.success(`Ambassadeur créé : ${r.code}`);
      copier(lien(r.code), 'Lien');
      setNom(''); setHandle(''); setEmail(''); setCode(''); setCodeTouche(false);
      qc.invalidateQueries({ queryKey: ['ambassador-stats'] });
    },
    onError: (e: Error) => toast.error(e.message.includes('déjà pris') ? e.message : `Création impossible : ${e.message}`),
  });

  return (
    <div className="admin-glass-card rounded-2xl p-4 space-y-3">
      <h4 className="text-sm font-black uppercase tracking-wide text-[hsl(var(--admin-text))]">Nouvel ambassadeur</h4>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="amb-nom" className="text-sm font-semibold text-[hsl(var(--admin-text))]">Prénom ou pseudo *</label>
          <Input id="amb-nom" value={nom} onChange={(e) => setNom(e.target.value)} onBlur={() => proposer(nom)} placeholder="Karim" className="min-h-[44px] text-base" />
        </div>
        <div className="space-y-1">
          <label htmlFor="amb-code" className="text-sm font-semibold text-[hsl(var(--admin-text))]">Code (auto, modifiable)</label>
          <Input id="amb-code" value={code} onChange={(e) => { setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setCodeTouche(true); }}
            placeholder="KARIM10" className="min-h-[44px] text-base font-bold tracking-wide" />
        </div>
        <div className="space-y-1">
          <label htmlFor="amb-handle" className="text-sm font-semibold text-[hsl(var(--admin-text))]">Compte TikTok / Insta</label>
          <Input id="amb-handle" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@karim.ride" className="min-h-[44px] text-base" />
        </div>
        <div className="space-y-1">
          <label htmlFor="amb-email" className="text-sm font-semibold text-[hsl(var(--admin-text))]">Email PayPal (versements)</label>
          <Input id="amb-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="facultatif, à remplir plus tard" className="min-h-[44px] text-base" />
        </div>
      </div>
      <Btn icon={creer.isPending ? Loader2 : Plus} tone="accent" disabled={!nom.trim() || creer.isPending} onClick={() => creer.mutate()}>
        Créer et copier son lien
      </Btn>
    </div>
  );
};

/* ── Fiche d'un ambassadeur ── */
const Fiche = ({ row, onClose }: { row: StatRow; onClose: () => void }) => {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['ambassador-stats'] });
    qc.invalidateQueries({ queryKey: ['ambassador-codes', row.ambassador_id] });
  };

  const { data: codes = [] } = useQuery({
    queryKey: ['ambassador-codes', row.ambassador_id],
    queryFn: async (): Promise<CodeRow[]> => {
      const { data, error } = await db.from('promo_codes').select('code, active, created_at').eq('ambassador_id', row.ambassador_id).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
  const tousCodes = codes.map((c) => c.code);

  const { data: commandes = [] } = useQuery({
    queryKey: ['ambassador-orders', row.ambassador_id, tousCodes.join(',')],
    enabled: tousCodes.length > 0,
    queryFn: async (): Promise<OrderRow[]> => {
      const { data, error } = await supabase.from('orders').select('id, order_number, status, total_ttc, promo_code, customer_email, created_at')
        .in('promo_code', tousCodes).order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return (data || []) as OrderRow[];
    },
  });
  const auto = commandes.filter((o) => row.email_paypal && o.customer_email?.toLowerCase() === row.email_paypal.toLowerCase());

  const maj = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const { error } = await db.from('ambassadors').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', row.ambassador_id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Enregistré'); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const basculerCode = useMutation({
    mutationFn: async (c: CodeRow) => {
      const { error } = await db.from('promo_codes').update({ active: !c.active }).eq('code', c.code).eq('ambassador_id', row.ambassador_id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });

  const [nouveauCode, setNouveauCode] = useState('');
  const ajouterCode = useMutation({
    mutationFn: async () => {
      const code = nouveauCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (code.length < 3) throw new Error('Code trop court (3 caractères minimum)');
      const { error } = await db.from('promo_codes').insert({
        code, discount_type: 'percent', discount_value: 10, active: true, max_uses: null, current_uses: 0,
        campaign: 'ambassadeur', max_discount_eur: 30, ambassador_id: row.ambassador_id,
      });
      if (error) throw new Error(error.code === '23505' ? `Le code ${code} existe déjà` : error.message);
    },
    onSuccess: () => { toast.success('Code ajouté (les anciens restent reliés : ses ventes passées sont gardées)'); setNouveauCode(''); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const champ = (k: 'nom' | 'handle' | 'email_paypal' | 'notes', label: string, type = 'text') => (
    <div className="space-y-1">
      <label htmlFor={`amb-f-${k}`} className="text-sm font-semibold text-[hsl(var(--admin-text))]">{label}</label>
      <Input id={`amb-f-${k}`} type={type} defaultValue={(row as unknown as Record<string, string | null>)[k] ?? ''}
        onBlur={(e) => { const v = e.target.value.trim() || null; if (v !== ((row as unknown as Record<string, string | null>)[k] ?? null)) maj.mutate({ [k]: v }); }}
        className="min-h-[44px] text-base" />
    </div>
  );

  return (
    <Sheet open onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto bg-white">
        <SheetHeader className="text-left">
          <SheetTitle className="text-xl font-black uppercase tracking-tight">{row.nom}</SheetTitle>
          <SheetDescription className="text-sm">{row.handle || 'Compte non renseigné'} · {row.taux_commission} % de commission</SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          <div className="grid grid-cols-2 gap-2">
            <Chiffre label="Cartes Rider ramenées" value={row.cartes_rider} />
            <Chiffre label="Commandes" value={row.commandes} />
            <Chiffre label="En attente (< 30 j)" value={eur(row.commission_en_attente)} />
            <Chiffre label="À verser" value={eur(solde(row))} strong />
          </div>

          {auto.length > 0 && (
            <p className="flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-800">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              {auto.length} commande(s) passée(s) avec son propre email PayPal : à retirer de la commission avant de verser.
            </p>
          )}

          <section className="space-y-2">
            <p className="text-sm font-semibold text-[hsl(var(--admin-text))]">Statut</p>
            <div className="flex flex-wrap gap-2">
              {STATUTS.map((s) => (
                <button key={s.k} type="button" onClick={() => maj.mutate({ statut: s.k })}
                  className={cn('min-h-[44px] px-3.5 rounded-xl text-sm font-semibold border',
                    row.statut === s.k ? cn(s.cls, 'border-transparent') : 'bg-white border-[hsl(var(--admin-border))] text-[hsl(var(--admin-text-muted))]')}>
                  {s.label}
                </button>
              ))}
            </div>
            <p className="text-sm text-[hsl(var(--admin-text-muted))]">Le statut ne coupe pas le code : pour l'arrêter net, désactive le code ci-dessous.</p>
          </section>

          <section className="space-y-2">
            <p className="text-sm font-semibold text-[hsl(var(--admin-text))]">Codes</p>
            <ul className="divide-y divide-[hsl(var(--admin-border))] rounded-xl border border-[hsl(var(--admin-border))]">
              {codes.map((c) => (
                <li key={c.code} className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 min-h-[44px]">
                  <span className={cn('font-bold tracking-wide', !c.active && 'line-through text-[hsl(var(--admin-text-muted))]')}>{c.code}</span>
                  <div className="flex flex-wrap gap-2">
                    {c.active && <Btn icon={Link2} onClick={() => copier(lien(c.code), 'Lien')}>Lien</Btn>}
                    <Btn icon={Power} onClick={() => basculerCode.mutate(c)}>{c.active ? 'Couper' : 'Réactiver'}</Btn>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <Input value={nouveauCode} onChange={(e) => setNouveauCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="Nouveau code (ex. son code habituel)" className="min-h-[44px] text-base font-bold" />
              <Btn icon={Plus} disabled={!nouveauCode || ajouterCode.isPending} onClick={() => ajouterCode.mutate()}>Ajouter</Btn>
            </div>
          </section>

          <section className="space-y-3">
            {champ('nom', 'Prénom ou pseudo')}
            {champ('handle', 'Compte TikTok / Insta')}
            {champ('email_paypal', 'Email PayPal (versements)', 'email')}
            <div className="space-y-1">
              <label htmlFor="amb-f-taux" className="text-sm font-semibold text-[hsl(var(--admin-text))]">Commission (%)</label>
              <Input id="amb-f-taux" type="number" min={0} max={50} step={1} defaultValue={row.taux_commission}
                onBlur={(e) => { const v = Number(e.target.value); if (!Number.isNaN(v) && v !== Number(row.taux_commission)) maj.mutate({ taux_commission: v }); }}
                className="min-h-[44px] text-base w-32" />
            </div>
            {champ('notes', 'Notes')}
            <p className="text-sm text-[hsl(var(--admin-text-muted))]">Chaque champ s'enregistre quand tu le quittes. Jamais d'IBAN ici.</p>
          </section>

          <section className="space-y-2">
            <p className="text-sm font-semibold text-[hsl(var(--admin-text))]">Dernières commandes avec ses codes</p>
            {commandes.length === 0
              ? <p className="text-sm text-[hsl(var(--admin-text-muted))]">Aucune commande pour l'instant.</p>
              : (
                <ul className="divide-y divide-[hsl(var(--admin-border))] rounded-xl border border-[hsl(var(--admin-border))]">
                  {commandes.map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-2 px-3 min-h-[44px] text-sm">
                      <span className="font-semibold">{o.order_number}</span>
                      <span className="text-[hsl(var(--admin-text-muted))]">{new Date(o.created_at).toLocaleDateString('fr-FR')} · {o.status}</span>
                      <span className="tabular-nums font-semibold">{eur(o.total_ttc)}</span>
                    </li>
                  ))}
                </ul>
              )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
};

/* ── Écran principal ── */
const AmbassadorsManager = () => {
  const qc = useQueryClient();
  const { data: rows = [], isLoading, error } = useStats();
  const [ouvert, setOuvert] = useState<string | null>(null);
  const fiche = rows.find((r) => r.ambassador_id === ouvert) ?? null;

  const aVerser = useMemo(
    () => rows.filter((r) => Number(r.taux_commission) > 0 && r.email_paypal && solde(r) >= SEUIL_VERSEMENT),
    [rows],
  );
  const totaux = useMemo(() => ({
    actifs: rows.filter((r) => r.statut === 'actif').length,
    riders: rows.reduce((s, r) => s + Number(r.cartes_rider), 0),
    commandes: rows.reduce((s, r) => s + Number(r.commandes), 0),
    attente: rows.reduce((s, r) => s + Number(r.commission_en_attente), 0),
    verser: aVerser.reduce((s, r) => s + solde(r), 0),
  }), [rows, aVerser]);

  // Fichier pour PayPal → Paiements groupés : email, montant, devise, référence, note (une ligne par ambassadeur, sans en-tête)
  const exporter = () => {
    const p = periodeCourante();
    const lignes = aVerser.map((r) => [r.email_paypal, solde(r).toFixed(2), 'EUR', `PT-${p}-${r.ambassador_id.slice(0, 8)}`,
      `Commission piecestrottinettes.fr ${p} - merci ${r.nom} !`].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const blob = new Blob([lignes.join('\n') + '\n'], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `paypal-ambassadeurs-${p}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const marquerPaye = useMutation({
    mutationFn: async () => {
      const p = periodeCourante();
      const lignes = aVerser.map((r) => ({ ambassador_id: r.ambassador_id, periode: p, montant: Number(solde(r).toFixed(2)), paye_le: new Date().toISOString() }));
      const { error } = await db.from('ambassador_payouts').insert(lignes);
      if (error) throw new Error(error.code === '23505' ? 'Un versement de ce mois est déjà enregistré pour un de ces ambassadeurs' : error.message);
      return lignes.length;
    },
    onSuccess: (n) => { toast.success(`${n} versement(s) enregistré(s)`); qc.invalidateQueries({ queryKey: ['ambassador-stats'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="admin-glass-card rounded-2xl p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--admin-text-muted))]" /></div>;
  if (error) return <div className="admin-glass-card rounded-2xl p-4 text-sm text-red-700">Lecture impossible : {(error as Error).message}</div>;

  return (
    <div className="space-y-4">
      <div className="admin-glass-card rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-base font-black uppercase tracking-wide text-[hsl(var(--admin-text))]">Ambassadeurs</h3>
          <span className="text-sm text-[hsl(var(--admin-text-muted))]">-10 % pour leur public · commission sur les commandes payées, acquise après 30 jours</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Chiffre label="Actifs" value={totaux.actifs} />
          <Chiffre label="Cartes Rider ramenées" value={totaux.riders} />
          <Chiffre label="Commandes" value={totaux.commandes} />
          <Chiffre label={`À verser (≥ ${SEUIL_VERSEMENT} €)`} value={eur(totaux.verser)} strong />
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn icon={Download} disabled={aVerser.length === 0} onClick={exporter}>Fichier PayPal ({aVerser.length})</Btn>
          <Btn icon={marquerPaye.isPending ? Loader2 : Check} disabled={aVerser.length === 0 || marquerPaye.isPending}
            onClick={() => { if (window.confirm(`Marquer ${aVerser.length} versement(s) comme payés (${eur(totaux.verser)}) ?`)) marquerPaye.mutate(); }}>
            Marquer payé
          </Btn>
        </div>
        {totaux.attente > 0 && <p className="text-sm text-[hsl(var(--admin-text-muted))] tabular-nums">En attente des 30 jours : {eur(totaux.attente)}</p>}
      </div>

      <NouvelAmbassadeur />

      {rows.length === 0
        ? <div className="admin-glass-card rounded-2xl p-4 text-sm text-[hsl(var(--admin-text-muted))]">Aucun ambassadeur.</div>
        : (
          <ul className="grid gap-3 lg:grid-cols-2">
            {rows.map((r) => {
              const code = premierCode(r);
              const st = STATUTS.find((s) => s.k === r.statut);
              return (
                <li key={r.ambassador_id} className="admin-glass-card rounded-2xl p-4 space-y-3">
                  <button type="button" onClick={() => setOuvert(r.ambassador_id)} className="w-full text-left min-h-[44px] flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-black uppercase tracking-tight text-[hsl(var(--admin-text))] truncate">{r.nom}</p>
                      <p className="text-sm text-[hsl(var(--admin-text-muted))] truncate">{r.handle || 'compte non renseigné'} · {r.taux_commission} %</p>
                    </div>
                    <span className={cn('shrink-0 px-2.5 py-1 rounded-full text-xs font-bold', st?.cls)}>{st?.label}</span>
                  </button>
                  <div className="grid grid-cols-3 gap-2">
                    <Chiffre label="Cartes Rider" value={r.cartes_rider} />
                    <Chiffre label="Commandes" value={r.commandes} />
                    <Chiffre label="À verser" value={eur(solde(r))} />
                  </div>
                  {code
                    ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-2 rounded-xl bg-[hsl(var(--admin-accent)/0.12)] text-[hsl(var(--admin-accent))] font-black tracking-wide">{code}</span>
                        <Btn icon={Copy} onClick={() => copier(code, 'Code')}>Code</Btn>
                        <Btn icon={Link2} onClick={() => copier(lien(code), 'Lien')}>Lien</Btn>
                      </div>
                    )
                    : <p className="text-sm text-amber-800">Aucun code actif : ses ventes ne sont plus suivies.</p>}
                  {!r.email_paypal && Number(r.taux_commission) > 0 && <p className="text-sm text-[hsl(var(--admin-text-muted))]">Email PayPal manquant : il sera exclu du fichier de versement.</p>}
                </li>
              );
            })}
          </ul>
        )}

      {fiche && <Fiche row={fiche} onClose={() => setOuvert(null)} />}
    </div>
  );
};

export default AmbassadorsManager;
