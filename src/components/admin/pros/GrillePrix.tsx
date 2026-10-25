// Comptoir Pro — onglet « Grille » (25/10/2026) : ce que paie un magasin à chaque palier, pièce par pièce, et ce qu'il reste à Nolan.
// Visible uniquement dans l'admin (prix d'achat = part_suppliers, lecture admin seule). Les magasins ne voient jamais cet écran.
// Le calcul reproduit exactement public.pro_unit_price_ht : sans prix d'achat → prix du site ; sinon max(prix × (1 − remise), achat × plancher).
// Les remises se règlent ici (écrit pro_tiers, droit admin) : la base recalcule les prix pro au prochain affichage des magasins.
import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { optimizedImage } from '@/lib/imageTransform';
import { eurFR } from '@/lib/pro';

type Tier = { code: string; nom: string; remise_pct: number; seuil_ca_ht: number; ordre: number };
type Piece = { id: string; name: string; price: number; image_url: string | null; cat: string; achat: number | null };

const r2 = (v: number) => Math.round(v * 100) / 100;
const prixPro = (p: Piece, remise: number, plancher: number) =>
  p.achat == null ? r2(p.price) : r2(Math.max(p.price * (1 - remise / 100), p.achat * plancher));
const pct = (v: number) => `${Math.round(v)} %`;

function useGrille() {
  return useQuery({
    queryKey: ['admin-pro-grille'],
    queryFn: async () => {
      const [t, s, p] = await Promise.all([
        supabase.from('pro_tiers').select('code, nom, remise_pct, seuil_ca_ht, ordre').order('ordre'),
        supabase.from('pro_settings').select('plancher_coef').limit(1).maybeSingle(),
        supabase.from('parts').select('id, name, price, image_url, categories(name), part_suppliers(buy_price_ht)').eq('published', true).gt('price', 0).order('name').limit(2000),
      ]);
      if (t.error) throw t.error; if (s.error) throw s.error; if (p.error) throw p.error;
      const pieces: Piece[] = ((p.data ?? []) as unknown as { id: string; name: string; price: number; image_url: string | null; categories: { name: string } | null; part_suppliers: { buy_price_ht: number | null }[] }[]).map((x) => {
        const achats = (x.part_suppliers ?? []).map((s) => Number(s.buy_price_ht)).filter((v) => v > 0);
        return { id: x.id, name: x.name, price: Number(x.price), image_url: x.image_url, cat: x.categories?.name ?? 'Sans famille', achat: achats.length ? Math.min(...achats) : null };
      });
      return { tiers: ((t.data ?? []) as Tier[]).map((x) => ({ ...x, remise_pct: Number(x.remise_pct), seuil_ca_ht: Number(x.seuil_ca_ht) })), plancher: Number(s.data?.plancher_coef ?? 1.15), pieces };
    },
  });
}

const GrillePrix = () => {
  const qc = useQueryClient();
  const q = useGrille();
  const [brouillon, setBrouillon] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [famille, setFamille] = useState('');
  const [tri, setTri] = useState<'famille' | 'marge'>('famille');

  const tiers = useMemo(() => (q.data?.tiers ?? []).map((t) => ({ ...t, remise_pct: brouillon[t.code] !== undefined && brouillon[t.code] !== '' ? Number(brouillon[t.code]) : t.remise_pct })), [q.data, brouillon]);
  const plancher = q.data?.plancher ?? 1.15;
  const familles = useMemo(() => [...new Set((q.data?.pieces ?? []).map((p) => p.cat))].sort((a, b) => a.localeCompare(b, 'fr')), [q.data]);

  const resume = useMemo(() => {
    const ps = (q.data?.pieces ?? []).filter((p) => p.achat != null);
    return tiers.map((t) => {
      let vente = 0, cout = 0, auPlancher = 0;
      for (const p of ps) {
        const v = prixPro(p, t.remise_pct, plancher);
        vente += v; cout += p.achat!;
        if (p.price * (1 - t.remise_pct / 100) < p.achat! * plancher) auPlancher++;
      }
      return { code: t.code, marge: vente ? (100 * (vente - cout)) / vente : 0, auPlancher, n: ps.length };
    });
  }, [q.data, tiers, plancher]);

  const lignes = useMemo(() => {
    const s = recherche.trim().toLowerCase();
    let ps = (q.data?.pieces ?? []).filter((p) => (!famille || p.cat === famille) && (!s || p.name.toLowerCase().includes(s)));
    const dernier = tiers[tiers.length - 1];
    if (tri === 'marge' && dernier) ps = [...ps].sort((a, b) => (a.achat == null ? 1 : b.achat == null ? -1 : (prixPro(a, dernier.remise_pct, plancher) - a.achat) - (prixPro(b, dernier.remise_pct, plancher) - b.achat!)));
    else ps = [...ps].sort((a, b) => a.cat.localeCompare(b.cat, 'fr') || a.name.localeCompare(b.name, 'fr'));
    return ps;
  }, [q.data, recherche, famille, tri, tiers, plancher]);

  const modifie = (q.data?.tiers ?? []).some((t) => brouillon[t.code] !== undefined && brouillon[t.code] !== '' && Number(brouillon[t.code]) !== t.remise_pct);
  const enregistrer = async () => {
    const changes = (q.data?.tiers ?? []).filter((t) => brouillon[t.code] !== undefined && brouillon[t.code] !== '' && Number(brouillon[t.code]) !== t.remise_pct);
    for (const t of changes) {
      const v = Number(brouillon[t.code]);
      if (!Number.isFinite(v) || v < 0 || v > 80) { toast.error(`Remise ${t.nom} : entre 0 et 80 %.`); return; }
    }
    setBusy(true);
    try {
      for (const t of changes) {
        const { error } = await supabase.from('pro_tiers').update({ remise_pct: Number(brouillon[t.code]) }).eq('code', t.code);
        if (error) throw error;
      }
      setBrouillon({});
      await qc.invalidateQueries({ queryKey: ['admin-pro-grille'] });
      await qc.invalidateQueries({ queryKey: ['admin-pros'] });
      toast.success('Remises enregistrées : les magasins voient les nouveaux prix à leur prochaine ouverture.');
    } catch (e) {
      toast.error(`Remises non enregistrées : ${(e as Error).message}`);
    } finally { setBusy(false); }
  };

  if (q.isLoading) return <div className="py-10 grid place-items-center"><Loader2 className="w-6 h-6 animate-spin" aria-label="Chargement" /></div>;
  if (q.isError) return <p className="text-red-600">Grille illisible : {(q.error as Error).message}</p>;

  return (
    <div className="grid gap-4">
      <div className="bg-white border border-[hsl(var(--admin-border))] rounded-xl p-4 grid gap-3">
        <p className="text-sm text-[hsl(var(--admin-text-muted))]">
          Prix pro = prix du site − remise du palier, jamais sous ton prix d'achat × {String(plancher).replace('.', ',')}. Écran réservé à l'admin : les magasins ne voient ni tes prix d'achat ni ta marge.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {tiers.map((t, i) => {
            const r = resume[i];
            return (
              <div key={t.code} className="border border-[hsl(var(--admin-border))] rounded-lg p-3 grid gap-2">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-black uppercase">{t.nom}</p>
                  <p className="text-sm text-[hsl(var(--admin-text-muted))]">dès {Math.round(t.seuil_ca_ht).toLocaleString('fr-FR')} €</p>
                </div>
                <label htmlFor={`remise-${t.code}`} className="flex items-center gap-2 text-sm font-semibold">
                  Remise
                  <Input id={`remise-${t.code}`} type="number" inputMode="decimal" min={0} max={80} step={1} className="w-24 min-h-[44px] text-base"
                    value={brouillon[t.code] ?? String(q.data!.tiers[i].remise_pct)} onChange={(e) => setBrouillon({ ...brouillon, [t.code]: e.target.value })} />
                  %
                </label>
                <p className="text-sm">Ta marge moyenne : <strong className="text-green-800">{pct(r?.marge ?? 0)}</strong></p>
                <p className={`text-sm ${r?.auPlancher ? 'text-orange-700 font-semibold' : 'text-[hsl(var(--admin-text-muted))]'}`}>{r?.auPlancher ?? 0} pièce{(r?.auPlancher ?? 0) > 1 ? 's' : ''} bloquée{(r?.auPlancher ?? 0) > 1 ? 's' : ''} au plancher</p>
              </div>
            );
          })}
        </div>
        {modifie && (
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" disabled={busy} onClick={enregistrer} className="min-h-[44px] px-4 rounded-lg bg-green-700 hover:bg-green-800 text-white font-semibold disabled:opacity-50">
              {busy ? 'Enregistrement…' : 'Enregistrer les remises'}
            </button>
            <button type="button" disabled={busy} onClick={() => setBrouillon({})} className="min-h-[44px] px-4 rounded-lg border border-[hsl(var(--admin-border))] bg-white font-semibold">Annuler</button>
            <p className="text-sm text-[hsl(var(--admin-text-muted))]">Aperçu ci-dessous avec les nouvelles remises, rien n'est encore changé pour les magasins.</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <label className="relative flex-1 min-w-[200px]">
          <span className="sr-only">Chercher une pièce</span>
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--admin-text-muted))]" aria-hidden />
          <Input id="grille-recherche" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Chercher : 10x2.25, plaquettes M365…" className="pl-9 min-h-[44px] text-base" />
        </label>
        <select id="grille-famille" aria-label="Famille" value={famille} onChange={(e) => setFamille(e.target.value)} className="min-h-[44px] rounded-lg border border-[hsl(var(--admin-border))] px-3 bg-white">
          <option value="">Toutes les familles</option>
          {familles.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select id="grille-tri" aria-label="Tri" value={tri} onChange={(e) => setTri(e.target.value as 'famille' | 'marge')} className="min-h-[44px] rounded-lg border border-[hsl(var(--admin-border))] px-3 bg-white">
          <option value="famille">Par famille</option>
          <option value="marge">Plus petite marge d'abord</option>
        </select>
        <p className="text-sm text-[hsl(var(--admin-text-muted))]">{lignes.length} pièce{lignes.length > 1 ? 's' : ''}</p>
      </div>

      <div className="overflow-x-auto bg-white border border-[hsl(var(--admin-border))] rounded-xl">
        <table className="w-full min-w-[820px] text-sm tabular-nums">
          <thead className="bg-[#F5F0E8] text-left">
            <tr>
              <th className="p-3 font-semibold">Pièce</th>
              <th className="p-3 font-semibold text-right">Prix site</th>
              <th className="p-3 font-semibold text-right">Ton achat</th>
              {tiers.map((t) => <th key={t.code} className="p-3 font-semibold text-right">{t.nom} −{t.remise_pct} %</th>)}
            </tr>
          </thead>
          <tbody>
            {lignes.map((p) => {
              const prix = tiers.map((t) => prixPro(p, t.remise_pct, plancher));
              return (
                <tr key={p.id} className="border-t border-[hsl(var(--admin-border))] align-top">
                  <td className="p-3">
                    <div className="flex gap-3 items-start min-w-[240px]">
                      {p.image_url ? <img src={optimizedImage(p.image_url, 96)} alt="" width={44} height={44} loading="lazy" className="w-11 h-11 object-contain bg-[#FAFAF8] rounded" /> : <div className="w-11 h-11 rounded bg-[#FAFAF8]" />}
                      <div className="min-w-0">
                        <p className="font-semibold leading-snug">{p.name}</p>
                        <p className="text-[hsl(var(--admin-text-muted))]">{p.cat}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-right">{eurFR(p.price)}</td>
                  <td className="p-3 text-right">{p.achat == null ? <span className="text-orange-700 font-semibold">inconnu</span> : eurFR(p.achat)}</td>
                  {prix.map((v, i) => {
                    const marge = p.achat == null ? null : v - p.achat;
                    const auPlancher = p.achat != null && p.price * (1 - tiers[i].remise_pct / 100) < p.achat * plancher;
                    return (
                      <td key={i} className="p-3 text-right">
                        <p className="font-bold">{eurFR(v)}</p>
                        {marge == null
                          ? <p className="text-orange-700">pas de remise</p>
                          : <p className={marge < 1 ? 'text-red-600 font-semibold' : 'text-green-800'}>+{eurFR(marge)} · {pct((100 * marge) / v)}</p>}
                        {auPlancher && <p className="text-orange-700 font-semibold">plancher</p>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GrillePrix;
