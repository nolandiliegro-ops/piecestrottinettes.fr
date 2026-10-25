// Comptoir Pro — onglet « Grille des prix » (25/10/2026) : ce que paie un magasin à chaque palier, pièce par pièce, et ce qu'il reste à Nolan.
// Visible uniquement dans l'admin (prix d'achat = part_suppliers, lecture admin seule). Les magasins ne voient jamais cet écran.
// Ordre de calcul = public.pro_prix(part, palier) :
//   1) prix tapé à la main pour la pièce et le palier (pro_part_prices) — plancher aussi (règle de Nolan 25/10 : toujours ≥ 20 % de marge)
//   2) sinon remise de la famille pour ce palier (pro_family_discounts) — plancher achat × coef
//   3) sinon remise générale du palier (pro_tiers) — plancher achat × coef ; pièce sans prix d'achat = prix du site
// Toutes les modifications s'affichent en aperçu ; rien ne change pour les magasins avant « Enregistrer ».
import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { optimizedImage } from '@/lib/imageTransform';
import { eurFR } from '@/lib/pro';

type Tier = { code: string; nom: string; remise_pct: number; seuil_ca_ht: number; ordre: number };
type Piece = { id: string; name: string; price: number; image_url: string | null; catId: string | null; cat: string; achat: number | null };
type Source = 'manuel' | 'famille' | 'palier' | 'sans-achat';

const r2 = (v: number) => Math.round(v * 100) / 100;
const pct = (v: number) => `${Math.round(v)} %`;
const cleF = (cat: string, tier: string) => `${cat}|${tier}`;
const num = (s: string) => Number(String(s).replace(',', '.').trim());

// Le compteur de brouillon : chaîne vide = « retirer la règle », absent = « inchangé ».
type Brouillon = Record<string, string>;

function useGrille() {
  return useQuery({
    queryKey: ['admin-pro-grille'],
    queryFn: async () => {
      const [t, s, p, f, m] = await Promise.all([
        supabase.from('pro_tiers').select('code, nom, remise_pct, seuil_ca_ht, ordre').order('ordre'),
        supabase.from('pro_settings').select('plancher_coef').limit(1).maybeSingle(),
        supabase.from('parts').select('id, name, price, image_url, category_id, categories(name), part_suppliers(buy_price_ht)').eq('published', true).gt('price', 0).order('name').limit(2000),
        supabase.from('pro_family_discounts' as never).select('category_id, tier_code, remise_pct'),
        supabase.from('pro_part_prices' as never).select('part_id, tier_code, prix'),
      ]);
      for (const x of [t, s, p, f, m]) if (x.error) throw x.error;
      const pieces: Piece[] = ((p.data ?? []) as unknown as { id: string; name: string; price: number; image_url: string | null; category_id: string | null; categories: { name: string } | null; part_suppliers: { buy_price_ht: number | null }[] }[]).map((x) => {
        const achats = (x.part_suppliers ?? []).map((s) => Number(s.buy_price_ht)).filter((v) => v > 0);
        return { id: x.id, name: x.name, price: Number(x.price), image_url: x.image_url, catId: x.category_id, cat: x.categories?.name ?? 'Sans famille', achat: achats.length ? Math.min(...achats) : null };
      });
      const familles: Record<string, number> = {};
      for (const r of (f.data ?? []) as unknown as { category_id: string; tier_code: string; remise_pct: number }[]) familles[cleF(r.category_id, r.tier_code)] = Number(r.remise_pct);
      const manuels: Record<string, number> = {};
      for (const r of (m.data ?? []) as unknown as { part_id: string; tier_code: string; prix: number }[]) manuels[cleF(r.part_id, r.tier_code)] = Number(r.prix);
      return {
        tiers: ((t.data ?? []) as Tier[]).map((x) => ({ ...x, remise_pct: Number(x.remise_pct), seuil_ca_ht: Number(x.seuil_ca_ht) })),
        plancher: Number((s.data as { plancher_coef?: number } | null)?.plancher_coef ?? 1.25), pieces, familles, manuels,
      };
    },
  });
}

const GrillePrix = () => {
  const qc = useQueryClient();
  const q = useGrille();
  const [bPaliers, setBPaliers] = useState<Brouillon>({});
  const [bFamilles, setBFamilles] = useState<Brouillon>({});
  const [bManuels, setBManuels] = useState<Brouillon>({});
  const [edition, setEdition] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [famille, setFamille] = useState('');
  const [tri, setTri] = useState<'famille' | 'marge' | 'manuel'>('famille');

  const d = q.data;
  const plancher = d?.plancher ?? 1.25;
  const tiers = useMemo(() => (d?.tiers ?? []).map((t) => ({ ...t, remise_pct: bPaliers[t.code] !== undefined && bPaliers[t.code] !== '' ? num(bPaliers[t.code]) : t.remise_pct })), [d, bPaliers]);
  const listeFamilles = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of d?.pieces ?? []) if (p.catId) m.set(p.catId, p.cat);
    return [...m.entries()].map(([id, nom]) => ({ id, nom, n: (d?.pieces ?? []).filter((p) => p.catId === id).length })).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  }, [d]);

  const remiseFamille = (catId: string | null, tier: string): number | null => {
    if (!catId) return null;
    const k = cleF(catId, tier);
    if (k in bFamilles) return bFamilles[k] === '' ? null : num(bFamilles[k]);
    return d?.familles[k] ?? null;
  };
  const prixManuel = (partId: string, tier: string): number | null => {
    const k = cleF(partId, tier);
    if (k in bManuels) return bManuels[k] === '' ? null : num(bManuels[k]);
    return d?.manuels[k] ?? null;
  };
  const calc = (p: Piece, t: Tier): { prix: number; source: Source; auPlancher: boolean } => {
    const m = prixManuel(p.id, t.code);
    if (m != null && Number.isFinite(m) && m > 0) {
      if (p.achat == null) return { prix: r2(m), source: 'manuel', auPlancher: false };
      return { prix: r2(Math.max(m, p.achat * plancher)), source: 'manuel', auPlancher: m < p.achat * plancher };
    }
    if (p.achat == null) return { prix: r2(p.price), source: 'sans-achat', auPlancher: false };
    const rf = remiseFamille(p.catId, t.code);
    const remise = rf ?? t.remise_pct;
    const brut = p.price * (1 - remise / 100);
    return { prix: r2(Math.max(brut, p.achat * plancher)), source: rf != null ? 'famille' : 'palier', auPlancher: brut < p.achat * plancher };
  };

  // Prix que la pièce aurait sans prix à la main (affiché en grisé dans la case vide).
  const calcAuto = (p: Piece, t: Tier): number => {
    if (p.achat == null) return r2(p.price);
    const remise = remiseFamille(p.catId, t.code) ?? t.remise_pct;
    return r2(Math.max(p.price * (1 - remise / 100), p.achat * plancher));
  };

  const resume = useMemo(() => {
    const ps = (d?.pieces ?? []).filter((p) => p.achat != null);
    return tiers.map((t) => {
      let vente = 0, cout = 0, auPlancher = 0, sousAchat = 0;
      for (const p of ps) { const c = calc(p, t); vente += c.prix; cout += p.achat!; if (c.auPlancher) auPlancher++; if (c.prix < p.achat!) sousAchat++; }
      return { marge: vente ? (100 * (vente - cout)) / vente : 0, auPlancher, sousAchat };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, tiers, bFamilles, bManuels, plancher]);

  const lignes = useMemo(() => {
    const s = recherche.trim().toLowerCase();
    let ps = (d?.pieces ?? []).filter((p) => (!famille || p.catId === famille) && (!s || p.name.toLowerCase().includes(s)));
    const dernier = tiers[tiers.length - 1];
    if (tri === 'manuel') ps = ps.filter((p) => tiers.some((t) => prixManuel(p.id, t.code) != null));
    if (tri === 'marge' && dernier) {
      const mg = (p: Piece) => (p.achat == null ? Infinity : calc(p, dernier).prix - p.achat);
      ps = [...ps].sort((a, b) => mg(a) - mg(b));
    } else ps = [...ps].sort((a, b) => a.cat.localeCompare(b.cat, 'fr') || a.name.localeCompare(b.name, 'fr'));
    return ps;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, recherche, famille, tri, tiers, bFamilles, bManuels, plancher]);

  const nbChangements = Object.keys(bPaliers).filter((k) => bPaliers[k] !== '' && num(bPaliers[k]) !== d?.tiers.find((t) => t.code === k)?.remise_pct).length
    + Object.keys(bFamilles).filter((k) => (bFamilles[k] === '' ? null : num(bFamilles[k])) !== (d?.familles[k] ?? null)).length
    + Object.keys(bManuels).filter((k) => (bManuels[k] === '' ? null : num(bManuels[k])) !== (d?.manuels[k] ?? null)).length;

  const annuler = () => { setBPaliers({}); setBFamilles({}); setBManuels({}); setEdition(null); };

  const enregistrer = async () => {
    if (!d) return;
    const err = (m: string) => { toast.error(m); return false; };
    const okPct = (v: number) => Number.isFinite(v) && v >= 0 && v <= 90;
    for (const [k, v] of Object.entries(bPaliers)) if (v !== '' && !okPct(num(v))) return err(`Remise générale ${k} : entre 0 et 90 %.`);
    for (const [, v] of Object.entries(bFamilles)) if (v !== '' && !okPct(num(v))) return err('Remise de famille : entre 0 et 90 %, ou vide pour la remise générale.');
    for (const [, v] of Object.entries(bManuels)) if (v !== '' && !(num(v) > 0)) return err('Prix à la main : un montant positif, ou vide pour le calcul automatique.');
    setBusy(true);
    try {
      for (const t of d.tiers) {
        const v = bPaliers[t.code];
        if (v !== undefined && v !== '' && num(v) !== t.remise_pct) {
          const { error } = await supabase.from('pro_tiers').update({ remise_pct: num(v) }).eq('code', t.code);
          if (error) throw error;
        }
      }
      for (const [k, v] of Object.entries(bFamilles)) {
        const [category_id, tier_code] = k.split('|');
        const { error } = v === ''
          ? await supabase.from('pro_family_discounts' as never).delete().eq('category_id', category_id).eq('tier_code', tier_code)
          : await supabase.from('pro_family_discounts' as never).upsert({ category_id, tier_code, remise_pct: num(v), updated_at: new Date().toISOString() } as never);
        if (error) throw error;
      }
      for (const [k, v] of Object.entries(bManuels)) {
        const [part_id, tier_code] = k.split('|');
        const { error } = v === ''
          ? await supabase.from('pro_part_prices' as never).delete().eq('part_id', part_id).eq('tier_code', tier_code)
          : await supabase.from('pro_part_prices' as never).upsert({ part_id, tier_code, prix: r2(num(v)), updated_at: new Date().toISOString() } as never);
        if (error) throw error;
      }
      annuler();
      await qc.invalidateQueries({ queryKey: ['admin-pro-grille'] });
      await qc.invalidateQueries({ queryKey: ['admin-pros'] });
      toast.success('Prix pro enregistrés : les magasins les voient à leur prochaine ouverture.');
    } catch (e) {
      toast.error(`Enregistrement interrompu : ${(e as Error).message}. Recharge la page pour voir ce qui est passé.`);
    } finally { setBusy(false); }
    return true;
  };

  if (q.isLoading) return <div className="py-10 grid place-items-center"><Loader2 className="w-6 h-6 animate-spin" aria-label="Chargement" /></div>;
  if (q.isError || !d) return <p className="text-red-600">Grille illisible : {(q.error as Error)?.message}</p>;

  const champ = 'min-h-[44px] w-[76px] rounded-lg border border-gray-300 px-2 text-base text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-green-600';

  return (
    <div className="grid gap-4 pb-24">
      {/* Paliers */}
      <div className="bg-white border border-[hsl(var(--admin-border))] rounded-xl p-4 grid gap-3">
        <p className="text-sm text-[hsl(var(--admin-text-muted))]">
          Ordre de calcul : <strong>ton prix à la main</strong> › <strong>la remise de la famille</strong> › <strong>la remise générale du palier</strong>. Garde-fou : aucun prix pro, même tapé à la main, ne descend sous ton prix d'achat × {String(plancher).replace('.', ',')} (au moins {Math.round(100 - 100 / plancher)} % de marge sur le prix de vente) ; un prix trop bas est remonté automatiquement. Écran réservé à l'admin : les magasins ne voient ni tes prix d'achat ni ta marge.
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
                  Remise générale
                  <input id={`remise-${t.code}`} inputMode="decimal" className={champ}
                    value={bPaliers[t.code] ?? String(d.tiers[i].remise_pct)} onChange={(e) => setBPaliers({ ...bPaliers, [t.code]: e.target.value })} />
                  %
                </label>
                <p className="text-sm">Ta marge moyenne : <strong className="text-green-800">{pct(r?.marge ?? 0)}</strong></p>
                {(r?.auPlancher ?? 0) > 0 && <p className="text-sm text-orange-700 font-semibold">{r.auPlancher} pièce{r.auPlancher > 1 ? 's' : ''} bloquée{r.auPlancher > 1 ? 's' : ''} au plancher</p>}
                {(r?.sousAchat ?? 0) > 0 && <p className="text-sm text-red-600 font-semibold">{r.sousAchat} prix sous ton prix d'achat</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Familles */}
      <div className="bg-white border border-[hsl(var(--admin-border))] rounded-xl p-4 grid gap-3">
        <div>
          <p className="font-black uppercase">Remise par famille</p>
          <p className="text-sm text-[hsl(var(--admin-text-muted))]">Case vide = la remise générale du palier. Ex. chambres à air 40 / 45 / 50 : toutes les chambres à air suivent, sauf celles à qui tu as mis un prix à la main.</p>
        </div>
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead><tr className="text-left">
              <th className="py-2 pr-3 font-semibold">Famille</th>
              {tiers.map((t) => <th key={t.code} className="py-2 pr-3 font-semibold">{t.nom} <span className="font-normal text-[hsl(var(--admin-text-muted))]">(général −{t.remise_pct} %)</span></th>)}
            </tr></thead>
            <tbody>
              {listeFamilles.map((f) => (
                <tr key={f.id} className="border-t border-[hsl(var(--admin-border))]">
                  <td className="py-2 pr-3"><span className="font-semibold">{f.nom}</span> <span className="text-[hsl(var(--admin-text-muted))]">· {f.n}</span></td>
                  {tiers.map((t) => {
                    const k = cleF(f.id, t.code);
                    const val = k in bFamilles ? bFamilles[k] : d.familles[k] != null ? String(d.familles[k]) : '';
                    return (
                      <td key={t.code} className="py-2 pr-3">
                        <label className="inline-flex items-center gap-1">
                          <span className="sr-only">Remise {f.nom} au palier {t.nom}</span>
                          <input id={`fam-${f.id}-${t.code}`} inputMode="decimal" placeholder={String(t.remise_pct)} className={champ}
                            value={val} onChange={(e) => setBFamilles({ ...bFamilles, [k]: e.target.value })} />
                          %
                        </label>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 items-center">
        <label className="relative flex-1 min-w-[200px]">
          <span className="sr-only">Chercher une pièce</span>
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--admin-text-muted))]" aria-hidden />
          <Input id="grille-recherche" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Chercher : 10x2.25, plaquettes M365…" className="pl-9 min-h-[44px] text-base" />
        </label>
        <select id="grille-famille" aria-label="Famille" value={famille} onChange={(e) => setFamille(e.target.value)} className="min-h-[44px] rounded-lg border border-[hsl(var(--admin-border))] px-3 bg-white">
          <option value="">Toutes les familles</option>
          {listeFamilles.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
        </select>
        <select id="grille-tri" aria-label="Tri" value={tri} onChange={(e) => setTri(e.target.value as 'famille' | 'marge' | 'manuel')} className="min-h-[44px] rounded-lg border border-[hsl(var(--admin-border))] px-3 bg-white">
          <option value="famille">Par famille</option>
          <option value="marge">Plus petite marge d'abord</option>
          <option value="manuel">Seulement mes prix à la main</option>
        </select>
        <p className="text-sm text-[hsl(var(--admin-text-muted))]">{lignes.length} pièce{lignes.length > 1 ? 's' : ''}</p>
      </div>

      {/* Grille */}
      <div className="relative overflow-x-auto bg-white border border-[hsl(var(--admin-border))] rounded-xl">
        <table className="w-full min-w-[880px] text-sm tabular-nums">
          <thead className="bg-[#F5F0E8] text-left">
            <tr>
              <th className="p-3 font-semibold">Pièce</th>
              <th className="p-3 font-semibold text-right">Prix site</th>
              <th className="p-3 font-semibold text-right">Ton achat</th>
              {tiers.map((t) => <th key={t.code} className="p-3 font-semibold text-right">{t.nom}</th>)}
              <th className="p-3"><span className="sr-only">Modifier</span></th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((p) => {
              const enEdition = edition === p.id;
              return (
                <tr key={p.id} className={`border-t border-[hsl(var(--admin-border))] align-top ${enEdition ? 'bg-[#FAFAF8]' : ''}`}>
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
                  {tiers.map((t) => {
                    const c = calc(p, t);
                    const marge = p.achat == null ? null : c.prix - p.achat;
                    const k = cleF(p.id, t.code);
                    return (
                      <td key={t.code} className="p-3 text-right">
                        {enEdition ? (
                          <label className="inline-flex items-center gap-1 justify-end">
                            <span className="sr-only">Prix à la main {t.nom}</span>
                            <input id={`man-${p.id}-${t.code}`} inputMode="decimal" placeholder={String(calcAuto(p, t)).replace('.', ',')}
                              className={champ} value={k in bManuels ? bManuels[k] : d.manuels[k] != null ? String(d.manuels[k]).replace('.', ',') : ''}
                              onChange={(e) => setBManuels({ ...bManuels, [k]: e.target.value })} />
                            €
                          </label>
                        ) : <p className="font-bold">{eurFR(c.prix)}</p>}
                        {marge == null
                          ? <p className="text-orange-700">pas de remise</p>
                          : <p className={marge < 0 ? 'text-red-600 font-semibold' : marge < 1 ? 'text-red-600' : 'text-green-800'}>{marge >= 0 ? '+' : ''}{eurFR(marge)} · {pct((100 * marge) / c.prix)}</p>}
                        {c.source === 'manuel' && <p className="font-semibold underline decoration-dotted">prix à la main</p>}
                        {c.source === 'famille' && <p className="text-[hsl(var(--admin-text-muted))]">remise famille</p>}
                        {c.auPlancher && <p className="text-orange-700 font-semibold">plancher</p>}
                      </td>
                    );
                  })}
                  <td className="p-3 text-right">
                    <button type="button" onClick={() => setEdition(enEdition ? null : p.id)} aria-label={enEdition ? 'Fermer' : `Prix à la main pour ${p.name}`}
                      className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-[hsl(var(--admin-border))] bg-white hover:bg-gray-50">
                      {enEdition ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {nbChangements > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 bg-white border-t border-[hsl(var(--admin-border))] shadow-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold flex-1 min-w-[180px]">{nbChangements} changement{nbChangements > 1 ? 's' : ''} en aperçu — rien n'a encore changé pour les magasins.</p>
            <button type="button" disabled={busy} onClick={annuler} className="min-h-[44px] px-4 rounded-lg border border-[hsl(var(--admin-border))] bg-white font-semibold">Annuler</button>
            <button type="button" disabled={busy} onClick={enregistrer} className="min-h-[44px] px-4 rounded-lg bg-green-700 hover:bg-green-800 text-white font-semibold disabled:opacity-50">
              {busy ? 'Enregistrement…' : 'Enregistrer les prix'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrillePrix;
