// Comptoir Pro — admin (25/10/2026). Trois onglets :
//  · À préparer : commandes des magasins (en préparation → prête → retirée et payée), WhatsApp « c'est prêt » en 1 tap.
//  · À commander : paniers de la semaine + commandes non retirées, moins le stock magasin, rangés par fournisseur.
//  · Magasins : créer un magasin, lui envoyer son lien sur WhatsApp, forcer un palier, couper un lien.
// Doc : claude/PT-lot-comptoir-pro.md. Les prix pro sont calculés en base (jamais ici).
import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Store, PackageCheck, ClipboardList, Loader2, MessageCircle, Copy, RefreshCw, Plus, Pause, Play } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { optimizedImage } from '@/lib/imageTransform';
import { numeroWhatsApp } from '@/lib/ambassadorKit';
import { eurFR, jourFR, PRO_STATUS_LABEL } from '@/lib/pro';
import SectionTabs from '../sections/SectionTabs';

const SITE = 'https://piecestrottinettes.fr';
const lienPro = (token: string) => `${SITE}/pro/${token}`;
const ouvrirWhatsApp = (tel: string | null, texte: string) => {
  const n = numeroWhatsApp(tel);
  if (!n) { toast.error('Ajoute d’abord un numéro de téléphone à ce magasin.'); return; }
  window.open(`https://wa.me/${n}?text=${encodeURIComponent(texte)}`, '_blank', 'noopener');
};
const copier = async (t: string, ok: string) => {
  try { await navigator.clipboard.writeText(t); toast.success(ok); } catch { toast.error('Copie refusée par le navigateur : sélectionne le texte à la main.'); }
};
const prenom = (s: string | null) => (s ?? '').trim().split(/\s+/)[0] || '';

type Tier = { code: string; nom: string; remise_pct: number; seuil_ca_ht: number; ordre: number };
type Magasin = {
  id: string; nom_magasin: string; contact_nom: string | null; telephone: string | null; email: string | null; adresse: string | null; siret: string | null;
  palier_force: string | null; palier_auto: string; ca_12m_ht: number; statut: 'invite' | 'actif' | 'pause'; access_token: string; last_seen_at: string | null; created_at: string;
};
type Ligne = { part_id: string | null; part_name: string; part_image_url: string | null; quantity: number; unit_price: number };
type CmdPro = {
  id: string; order_number: string; status: string; created_at: string; retrait_prevu: string | null; subtotal_ht: number; total_ttc: number;
  notes: string | null; payment_method: string | null; pro_account_id: string; order_items: Ligne[];
};
type ACommander = { part_id: string; name: string; sku: string | null; stock: number; qte_paniers: number; qte_commandes: number; besoin: number; manque: number; fournisseur: string | null; ref_fournisseur: string | null; magasins: string };

const Carte = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white border border-[hsl(var(--admin-border))] rounded-xl p-4 ${className}`}>{children}</div>
);
const Btn = ({ children, onClick, kind = 'ghost', disabled }: { children: React.ReactNode; onClick: () => void; kind?: 'ghost' | 'green' | 'orange'; disabled?: boolean }) => (
  <button type="button" disabled={disabled} onClick={onClick}
    className={`inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 rounded-lg text-sm font-semibold disabled:opacity-50 ${
      kind === 'green' ? 'bg-green-700 hover:bg-green-800 text-white' : kind === 'orange' ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'border border-[hsl(var(--admin-border))] bg-white hover:bg-gray-50 text-[hsl(var(--admin-text))]'
    }`}>{children}</button>
);

function useMagasins() {
  return useQuery({
    queryKey: ['admin-pros'],
    queryFn: async () => {
      const [{ data: m, error: e1 }, { data: t, error: e2 }] = await Promise.all([
        supabase.from('pro_accounts').select('id, nom_magasin, contact_nom, telephone, email, adresse, siret, palier_force, palier_auto, ca_12m_ht, statut, access_token, last_seen_at, created_at').order('nom_magasin'),
        supabase.from('pro_tiers').select('code, nom, remise_pct, seuil_ca_ht, ordre').order('ordre'),
      ]);
      if (e1) throw e1; if (e2) throw e2;
      return { magasins: (m ?? []) as Magasin[], tiers: (t ?? []) as Tier[] };
    },
  });
}

/* ---------------- À préparer ---------------- */
const APreparer = () => {
  const qc = useQueryClient();
  const pros = useMagasins();
  const [paiement, setPaiement] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const cmds = useQuery({
    queryKey: ['admin-pro-orders'],
    queryFn: async () => {
      const { data, error } = await supabase.from('orders')
        .select('id, order_number, status, created_at, retrait_prevu, subtotal_ht, total_ttc, notes, payment_method, pro_account_id, order_items(part_id, part_name, part_image_url, quantity, unit_price)')
        .not('pro_account_id', 'is', null).order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as CmdPro[];
    },
  });
  const mag = useMemo(() => new Map((pros.data?.magasins ?? []).map((m) => [m.id, m])), [pros.data]);

  const passer = async (c: CmdPro, status: string, payment_method?: string) => {
    setBusy(c.id);
    const patch: Record<string, string> = { status };
    if (payment_method) patch.payment_method = payment_method;
    const { error } = await supabase.from('orders').update(patch as never).eq('id', c.id);
    setBusy(null);
    if (error) { toast.error(error.message.includes('mode de paiement') ? 'Choisis le mode de paiement avant d’encaisser.' : error.message); return; }
    toast.success(status === 'prete' ? 'Commande prête.' : status === 'retiree_payee' ? 'Encaissée : stock et palier mis à jour.' : 'Commande annulée.');
    qc.invalidateQueries({ queryKey: ['admin-pro-orders'] }); qc.invalidateQueries({ queryKey: ['admin-pros'] }); qc.invalidateQueries({ queryKey: ['admin-pro-acommander'] });
    if (status === 'prete') {
      const m = mag.get(c.pro_account_id);
      ouvrirWhatsApp(m?.telephone ?? null, `Salut ${prenom(m?.contact_nom ?? null)} 👋 Ta commande ${c.order_number} est prête au magasin : ${eurFR(c.total_ttc)}, à régler sur place (espèces, carte ou virement). À tout de suite !`);
    }
  };

  if (cmds.isLoading) return <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--admin-accent))]" />;
  const actives = (cmds.data ?? []).filter((c) => c.status === 'a_regler_retrait' || c.status === 'prete');
  const finies = (cmds.data ?? []).filter((c) => c.status === 'retiree_payee' || c.status === 'cancelled').slice(0, 20);

  const bloc = (c: CmdPro) => {
    const m = mag.get(c.pro_account_id);
    return (
      <Carte key={c.id} className="grid gap-3">
        <div className="flex flex-wrap justify-between gap-2 items-baseline">
          <div className="min-w-0">
            <p className="font-bold text-[15px]">{m?.nom_magasin ?? 'Magasin'} · {c.order_number}</p>
            <p className="text-sm text-[hsl(var(--admin-text-muted))]">Passée le {new Date(c.created_at).toLocaleDateString('fr-FR')} · retrait {jourFR(c.retrait_prevu)}</p>
          </div>
          <span className={`text-sm font-bold px-2 py-0.5 rounded ${c.status === 'prete' ? 'bg-orange-100 text-orange-700' : c.status === 'retiree_payee' ? 'bg-green-100 text-green-800' : c.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
            {PRO_STATUS_LABEL[c.status] ?? c.status}{c.payment_method ? ` · ${c.payment_method === 'cb_tpe' ? 'carte' : c.payment_method}` : ''}
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {c.order_items.map((l, i) => (
            <div key={i} className="flex-none w-[150px] grid gap-1">
              <div className="h-[84px] bg-white border border-[hsl(var(--admin-border))] rounded-lg grid place-items-center relative">
                {l.part_image_url && <img src={optimizedImage(l.part_image_url, 160)} alt="" className="max-h-[72px] max-w-[90%] object-contain" loading="lazy" />}
                <span className="absolute top-1 right-1 bg-[#1A1A1A] text-white text-sm font-bold rounded-full min-w-7 h-7 px-1.5 grid place-items-center">{l.quantity}</span>
              </div>
              <p className="text-sm leading-tight line-clamp-2">{l.part_name}</p>
            </div>
          ))}
        </div>
        {c.notes && <p className="text-sm bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">📝 {c.notes}</p>}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-bold">{eurFR(c.total_ttc)} <span className="text-sm font-normal text-[hsl(var(--admin-text-muted))]">· pas de TVA (293 B)</span></p>
          {c.status === 'a_regler_retrait' && (
            <div className="flex flex-wrap gap-2">
              <Btn onClick={() => passer(c, 'cancelled')} disabled={busy === c.id}>Annuler</Btn>
              <Btn kind="green" onClick={() => passer(c, 'prete')} disabled={busy === c.id}><MessageCircle className="w-4 h-4" />Prête → prévenir</Btn>
            </div>
          )}
          {c.status === 'prete' && (
            <div className="flex flex-wrap gap-2 items-center">
              <label className="sr-only" htmlFor={`pm-${c.id}`}>Mode de paiement</label>
              <select id={`pm-${c.id}`} value={paiement[c.id] ?? ''} onChange={(e) => setPaiement((s) => ({ ...s, [c.id]: e.target.value }))}
                className="min-h-[44px] rounded-lg border border-[hsl(var(--admin-border))] px-2 text-sm bg-white">
                <option value="">Payé comment ?</option><option value="especes">Espèces</option><option value="cb_tpe">Carte (TPE)</option><option value="virement">Virement</option>
              </select>
              <Btn kind="orange" disabled={!paiement[c.id] || busy === c.id} onClick={() => passer(c, 'retiree_payee', paiement[c.id])}>Retirée et payée</Btn>
              <Btn onClick={() => ouvrirWhatsApp(m?.telephone ?? null, `Salut ${prenom(m?.contact_nom ?? null)}, petit rappel : ta commande ${c.order_number} t'attend au magasin (${eurFR(c.total_ttc)}).`)}><MessageCircle className="w-4 h-4" />Relancer</Btn>
            </div>
          )}
        </div>
      </Carte>
    );
  };

  return (
    <div className="grid gap-3 max-w-4xl">
      {actives.length === 0 && <Carte><p className="text-[hsl(var(--admin-text-muted))]">Aucune commande pro en cours. Elles arrivent ici, et sur Telegram + mail, dès qu'un magasin valide son panier.</p></Carte>}
      {actives.map(bloc)}
      {finies.length > 0 && <h3 className="text-sm font-bold uppercase tracking-wide text-[hsl(var(--admin-text-muted))] pt-3">Dernières terminées</h3>}
      {finies.map(bloc)}
    </div>
  );
};

/* ---------------- À commander ---------------- */
const AComm = () => {
  const q = useQuery({
    queryKey: ['admin-pro-acommander'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_pro_a_commander');
      if (error) throw error;
      return (data ?? []) as unknown as ACommander[];
    },
  });
  if (q.isLoading) return <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--admin-accent))]" />;
  if (q.isError) return <Carte><p className="text-red-600">Lecture impossible : {String((q.error as Error)?.message)}</p></Carte>;
  const rows = q.data ?? [];
  const groupes = new Map<string, ACommander[]>();
  for (const r of rows) { const k = r.fournisseur || 'Sans fournisseur'; (groupes.get(k) ?? groupes.set(k, []).get(k)!).push(r); }
  return (
    <div className="grid gap-3 max-w-4xl">
      <Carte><p className="text-sm text-[hsl(var(--admin-text-muted))]">Paniers de la semaine (pas encore validés) + commandes validées non retirées, moins ton stock magasin. « Manque » = à commander chez le fournisseur.</p></Carte>
      {rows.length === 0 && <Carte><p className="text-[hsl(var(--admin-text-muted))]">Rien en cours chez les pros.</p></Carte>}
      {[...groupes.entries()].map(([f, list]) => {
        const manquants = list.filter((r) => r.manque > 0);
        const texte = manquants.map((r) => `${r.manque} × ${r.ref_fournisseur ?? r.sku ?? ''} — ${r.name}`).join('\n');
        return (
          <Carte key={f} className="grid gap-2">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <p className="font-bold text-[15px]"><span className="capitalize">{f}</span> · {manquants.length} à commander</p>
              {manquants.length > 0 && <Btn onClick={() => copier(texte, 'Liste copiée.')}><Copy className="w-4 h-4" />Copier la liste</Btn>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-[hsl(var(--admin-text-muted))]"><th className="py-1 pr-2">Pièce</th><th className="pr-2">Réf.</th><th className="pr-2 text-right">Paniers</th><th className="pr-2 text-right">Validées</th><th className="pr-2 text-right">Stock</th><th className="pr-2 text-right">Manque</th><th>Magasins</th></tr></thead>
                <tbody>
                  {list.map((r) => (
                    <tr key={r.part_id} className="border-t border-[hsl(var(--admin-border))]">
                      <td className="py-1.5 pr-2 min-w-[180px]">{r.name}</td><td className="pr-2 whitespace-nowrap">{r.ref_fournisseur ?? r.sku ?? '—'}</td>
                      <td className="pr-2 text-right tabular-nums">{r.qte_paniers}</td><td className="pr-2 text-right tabular-nums">{r.qte_commandes}</td>
                      <td className="pr-2 text-right tabular-nums">{r.stock}</td><td className={`pr-2 text-right tabular-nums font-bold ${r.manque > 0 ? 'text-red-600' : 'text-green-700'}`}>{r.manque}</td>
                      <td className="min-w-[140px]">{r.magasins}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Carte>
        );
      })}
    </div>
  );
};

/* ---------------- Magasins ---------------- */
const VIDE = { nom_magasin: '', contact_nom: '', telephone: '', email: '', adresse: '', siret: '', palier_force: '' };
const Magasins = () => {
  const qc = useQueryClient();
  const q = useMagasins();
  const [form, setForm] = useState<typeof VIDE | null>(null);
  const [saving, setSaving] = useState(false);
  const tiers = q.data?.tiers ?? [];
  const nomPalier = (c: string) => tiers.find((t) => t.code === c);
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-pros'] });

  const msgLien = (m: Magasin) =>
    `Salut ${prenom(m.contact_nom)} 👋 Voici ton comptoir pro piecestrottinettes.fr : ${lienPro(m.access_token)}\n\nTu choisis tes pièces en photo, tu valides avant mardi 12 h, tu récupères le vendredi au magasin et tu règles sur place. Tes prix pro sont déjà dedans.\n\nGarde ce lien, il est à toi (tu peux l'ajouter à ton écran d'accueil).`;

  const creer = async () => {
    if (!form) return;
    if (form.nom_magasin.trim().length < 2) { toast.error('Nom du magasin requis.'); return; }
    if (!form.telephone.trim() && !form.email.trim()) { toast.error('Il faut au moins un téléphone (WhatsApp) ou un email.'); return; }
    setSaving(true);
    const { error } = await supabase.from('pro_accounts').insert({
      nom_magasin: form.nom_magasin.trim(), contact_nom: form.contact_nom.trim() || null, telephone: form.telephone.trim() || null,
      email: form.email.trim() || null, adresse: form.adresse.trim() || null, siret: form.siret.trim() || null,
      palier_force: form.palier_force || null, statut: 'invite',
    } as never);
    setSaving(false);
    if (error) { toast.error(error.message.includes('null value') ? 'La base demande encore un email : migration C3a pas encore passée.' : error.message); return; }
    toast.success('Magasin créé. Envoie-lui son lien sur WhatsApp.'); setForm(null); refresh();
  };

  const maj = async (m: Magasin, patch: Partial<Magasin>, ok: string) => {
    const { error } = await supabase.from('pro_accounts').update(patch as never).eq('id', m.id);
    if (error) { toast.error(error.message); return; }
    toast.success(ok); refresh();
  };

  const nouveauLien = async (m: Magasin) => {
    const { data, error } = await supabase.rpc('admin_pro_nouveau_lien', { p_pro: m.id });
    if (error) { toast.error(error.message); return; }
    toast.success('Nouveau lien créé : l’ancien ne marche plus.'); refresh();
    if (data) ouvrirWhatsApp(m.telephone, msgLien({ ...m, access_token: String(data) }));
  };

  if (q.isLoading) return <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--admin-accent))]" />;
  const magasins = q.data?.magasins ?? [];

  return (
    <div className="grid gap-3 max-w-4xl">
      {!form && <div><Btn kind="green" onClick={() => setForm({ ...VIDE })}><Plus className="w-4 h-4" />Nouveau magasin</Btn></div>}
      {form && (
        <Carte className="grid gap-3">
          <p className="font-bold">Nouveau magasin</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {([['nom_magasin', 'Nom du magasin *'], ['contact_nom', 'Prénom et nom du contact'], ['telephone', 'Téléphone WhatsApp *'], ['email', 'Email (facultatif)'], ['adresse', 'Adresse (facture)'], ['siret', 'SIRET (facture)']] as const).map(([k, lab]) => (
              <label key={k} className="grid gap-1 text-sm font-semibold">{lab}
                <Input id={`pro-${k}`} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} inputMode={k === 'telephone' ? 'tel' : k === 'email' ? 'email' : 'text'} />
              </label>
            ))}
            <label className="grid gap-1 text-sm font-semibold">Palier
              <select id="pro-palier" value={form.palier_force} onChange={(e) => setForm({ ...form, palier_force: e.target.value })} className="min-h-[40px] rounded-md border border-[hsl(var(--admin-border))] px-2 bg-white font-normal">
                <option value="">Automatique (selon ses achats)</option>
                {tiers.map((t) => <option key={t.code} value={t.code}>Forcer {t.nom} −{Number(t.remise_pct)} %</option>)}
              </select>
            </label>
          </div>
          <div className="flex gap-2"><Btn kind="green" onClick={creer} disabled={saving}>{saving ? 'Création…' : 'Créer'}</Btn><Btn onClick={() => setForm(null)}>Annuler</Btn></div>
        </Carte>
      )}
      {magasins.length === 0 && !form && <Carte><p className="text-[hsl(var(--admin-text-muted))]">Aucun magasin. Crée le premier, puis envoie-lui son lien sur WhatsApp.</p></Carte>}
      {magasins.map((m) => {
        const eff = nomPalier(m.palier_force ?? m.palier_auto);
        return (
          <Carte key={m.id} className="grid gap-3">
            <div className="flex flex-wrap justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-[15px]">{m.nom_magasin}</p>
                <p className="text-sm text-[hsl(var(--admin-text-muted))]">{[m.contact_nom, m.telephone, m.email].filter(Boolean).join(' · ') || 'Aucun contact'}</p>
                <p className="text-sm text-[hsl(var(--admin-text-muted))]">{m.statut === 'invite' ? 'Lien pas encore ouvert' : m.statut === 'pause' ? 'En pause' : `Actif${m.last_seen_at ? ` · vu le ${new Date(m.last_seen_at).toLocaleDateString('fr-FR')}` : ''}`}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{eff?.nom} −{Number(eff?.remise_pct ?? 0)} %{m.palier_force ? ' (forcé)' : ''}</p>
                <p className="text-sm text-[hsl(var(--admin-text-muted))]">{eurFR(Number(m.ca_12m_ht))} d'achats sur 12 mois</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Btn kind="green" onClick={() => ouvrirWhatsApp(m.telephone, msgLien(m))}><MessageCircle className="w-4 h-4" />Envoyer son lien</Btn>
              <Btn onClick={() => ouvrirWhatsApp(m.telephone, `Salut ${prenom(m.contact_nom)} 👋 Petit rappel : ton panier pro se ferme aujourd'hui à 12 h pour un retrait vendredi. ${lienPro(m.access_token)}`)}><MessageCircle className="w-4 h-4" />Rappel du mardi</Btn>
              <Btn onClick={() => copier(lienPro(m.access_token), 'Lien copié.')}><Copy className="w-4 h-4" />Copier le lien</Btn>
              <Btn onClick={() => nouveauLien(m)}><RefreshCw className="w-4 h-4" />Nouveau lien</Btn>
              {m.statut === 'pause'
                ? <Btn onClick={() => maj(m, { statut: 'actif' }, 'Compte réactivé.')}><Play className="w-4 h-4" />Réactiver</Btn>
                : <Btn onClick={() => maj(m, { statut: 'pause' }, 'Compte en pause : son lien ne marche plus.')}><Pause className="w-4 h-4" />Pause</Btn>}
              <label className="sr-only" htmlFor={`palier-${m.id}`}>Palier</label>
              <select id={`palier-${m.id}`} value={m.palier_force ?? ''} onChange={(e) => maj(m, { palier_force: e.target.value || null }, 'Palier mis à jour.')}
                className="min-h-[44px] rounded-lg border border-[hsl(var(--admin-border))] px-2 text-sm bg-white">
                <option value="">Palier automatique</option>
                {tiers.map((t) => <option key={t.code} value={t.code}>Forcer {t.nom}</option>)}
              </select>
            </div>
          </Carte>
        );
      })}
      {tiers.length > 0 && (
        <Carte><p className="text-sm text-[hsl(var(--admin-text-muted))]">Paliers : {tiers.map((t) => `${t.nom} −${Number(t.remise_pct)} % dès ${eurFR(Number(t.seuil_ca_ht))} d'achats`).join(' · ')}. Prix pro jamais sous le prix d'achat × 1,15.</p></Carte>
      )}
    </div>
  );
};

const ProsSection = () => (
  <SectionTabs
    title="Pros"
    base="/admin/pros"
    defaultTab="preparer"
    tabs={[
      { id: 'preparer', label: 'À préparer', icon: PackageCheck, content: <APreparer /> },
      { id: 'commander', label: 'À commander', icon: ClipboardList, content: <AComm /> },
      { id: 'magasins', label: 'Magasins', icon: Store, content: <Magasins /> },
    ]}
  />
);

export default ProsSection;
