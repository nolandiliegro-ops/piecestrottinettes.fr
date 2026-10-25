// Comptoir Pro — onglet « Grille des prix » (C8, 25/10/2026) : règle de Nolan = prix magasin ÷ 2, moins cher en volume.
// Visible uniquement dans l'admin (prix d'achat = part_suppliers, lecture admin seule). Les magasins ne voient jamais cet écran.
// Calcul = public.pro_prix(part, quantité), recopié ici pour l'aperçu :
//   1) prix tapé à la main pour la pièce (pro_prix_main) — toutes quantités, garde-fous compris
//   2) sinon prix magasin de la pièce (pro_prix_magasin, CSV Wattiz) ou, à défaut, prix du site ÷ ratio de la famille (pro_familles)
//      × coefficient du dernier seuil de quantité atteint (pro_grille_qte : 1 pièce, dès 5, dès 10…)
//   Garde-fous : jamais sous achat × plancher (1,20), jamais sous achat + gain mini de la famille, jamais au-dessus du prix du site.
// Toutes les modifications s'affichent en aperçu ; rien ne change pour les magasins avant « Enregistrer ».
import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, Pencil, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { optimizedImage } from '@/lib/imageTransform';
import { eurFR } from '@/lib/pro';

type Famille = { id: string; nom: string; ratio: number; gain: number | null };
type Seuil = { min: number; coef: number };
type Piece = { id: string; name: string; price: number; image_url: string | null; catId: string | null; cat: string; achat: number | null };

const r2 = (v: number) => Math.round(v * 100) / 100;
const num = (s: string) => Number(String(s).replace(',', '.').trim());
const fr = (v: number) => String(r2(v)).replace('.', ',');

function useGrille() {
  return useQuery({
    queryKey: ['admin-pro-grille'],
    queryFn: async () => {
      const [s, p, f, g, pm, m] = await Promise.all([
        supabase.from('pro_settings').select('plancher_coef').limit(1).maybeSingle(),
        supabase.from('parts').select('id, name, price, image_url, category_id, categories(name), part_suppliers(buy_price_ht)').eq('published', true).gt('price', 0).order('name').limit(2000),
        supabase.from('pro_familles' as never).select('category_id, ratio_site_magasin, gain_min_eur, categories(name)'),
        supabase.from('pro_grille_qte' as never).select('category_id, min_qte, coef'),
        supabase.from('pro_prix_magasin' as never).select('part_id, prix_magasin'),
        supabase.from('pro_prix_main' as never).select('part_id, prix'),
      ]);
      for (const x of [s, p, f, g, pm, m]) if (x.error) throw x.error;
      const pieces: Piece[] = ((p.data ?? []) as unknown as { id: string; name: string; price: number; image_url: string | null; category_id: string | null; categories: { name: string } | null; part_suppliers: { buy_price_ht: number | null }[] }[]).map((x) => {
        const achats = (x.part_suppliers ?? []).map((v) => Number(v.buy_price_ht)).filter((v) => v > 0);
        return { id: x.id, name: x.name, price: Number(x.price), image_url: x.image_url, catId: x.category_id, cat: x.categories?.name ?? 'Sans famille', achat: achats.length ? Math.min(...achats) : null };
      });
      const familles: Famille[] = ((f.data ?? []) as unknown as { category_id: string; ratio_site_magasin: number; gain_min_eur: number | null; categories: { name: string } | null }[])
        .map((x) => ({ id: x.category_id, nom: x.categories?.name ?? '?', ratio: Number(x.ratio_site_magasin), gain: x.gain_min_eur == null ? null : Number(x.gain_min_eur) }))
        .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
      const seuils: Record<string, Seuil[]> = {};
      for (const r of (g.data ?? []) as unknown as { category_id: string; min_qte: number; coef: number }[]) (seuils[r.category_id] ??= []).push({ min: Number(r.min_qte), coef: Number(r.coef) });
      for (const k of Object.keys(seuils)) seuils[k].sort((a, b) => a.min - b.min);
      const magasin: Record<string, number> = {};
      for (const r of (pm.data ?? []) as unknown as { part_id: string; prix_magasin: number }[]) magasin[r.part_id] = Number(r.prix_magasin);
      const manuels: Record<string, number> = {};
      for (const r of (m.data ?? []) as unknown as { part_id: string; prix: number }[]) manuels[r.part_id] = Number(r.prix);
      return { plancher: Number((s.data as { plancher_coef?: number } | null)?.plancher_coef ?? 1.2), pieces, familles, seuils, magasin, manuels };
    },
  });
}

// Brouillons : chaîne vide = « retirer », absent = « inchangé ».
type Brouillon = Record<string, string>;

const GrillePrix = () => {
  const qc = useQueryClient();
  const q = useGrille();
  const [bFam, setBFam] = useState<Brouillon>({});      // `${cat}|ratio` / `${cat}|gain`
  const [bSeuil, setBSeuil] = useState<Brouillon>({});  // `${cat}|${min}` → % du prix magasin
  const [bMag, setBMag] = useState<Brouillon>({});      // part → prix magasin
  const [bMan, setBMan] = useState<Brouillon>({});      // part → prix à la main
  const [ajout, setAjout] = useState<Record<string, { min: string; pct: string }>>({});
  const [edition, setEdition] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [famille, setFamille] = useState('');
  const [tri, setTri] = useState<'famille' | 'marge' | 'manuel'>('famille');

  const d = q.data;
  const plancher = d?.plancher ?? 1.2;

  const famVal = (f: Famille) => ({
    ratio: `${f.id}|ratio` in bFam && bFam[`${f.id}|ratio`] !== '' ? num(bFam[`${f.id}|ratio`]) / 100 : f.ratio,
    gain: `${f.id}|gain` in bFam ? (bFam[`${f.id}|gain`] === '' ? null : num(bFam[`${f.id}|gain`])) : f.gain,
  });
  const seuilsDe = (catId: string | null): Seuil[] => {
    if (!catId || !d) return [];
    const base = new Map((d.seuils[catId] ?? []).map((s) => [s.min, s.coef]));
    for (const [k, v] of Object.entries(bSeuil)) {
      const [c, min] = k.split('|');
      if (c !== catId) continue;
      if (v === '') base.delete(Number(min)); else base.set(Number(min), num(v) / 100);
    }
    return [...base.entries()].map(([min, coef]) => ({ min, coef })).sort((a, b) => a.min - b.min);
  };
  const magasinDe = (p: Piece, f: Famille | undefined): { prix: number | null; estime: boolean } => {
    if (p.id in bMag && bMag[p.id] !== '') return { prix: num(bMag[p.id]), estime: false };
    if (!(p.id in bMag) && d?.magasin[p.id] != null) return { prix: d.magasin[p.id], estime: false };
    if (!f) return { prix: null, estime: true };
    return { prix: p.price / famVal(f).ratio, estime: true };
  };
  const manuelDe = (p: Piece): number | null => (p.id in bMan ? (bMan[p.id] === '' ? null : num(bMan[p.id])) : d?.manuels[p.id] ?? null);

  const calc = (p: Piece, qte: number, sansManuel = false): { prix: number; garde: boolean; manuel: boolean } => {
    const f = d?.familles.find((x) => x.id === p.catId);
    const gain = f ? famVal(f).gain : null;
    const floors = p.achat == null ? 0 : Math.max(p.achat * plancher, gain != null ? p.achat + gain : 0);
    const man = sansManuel ? null : manuelDe(p);
    if (man != null && man > 0) return { prix: r2(Math.max(man, floors)), garde: man < floors, manuel: true };
    const ss = seuilsDe(p.catId).filter((s) => s.min <= Math.max(1, qte));
    const mag = magasinDe(p, f).prix;
    if (!f || !ss.length || mag == null) return { prix: r2(p.price), garde: false, manuel: false };
    const brut = mag * ss[ss.length - 1].coef;
    return { prix: r2(Math.min(Math.max(brut, floors), p.price)), garde: brut < floors, manuel: false };
  };

  const resume = useMemo(() => (d?.familles ?? []).map((f) => {
    const ps = (d?.pieces ?? []).filter((p) => p.catId === f.id && p.achat != null);
    let vente = 0, cout = 0, garde = 0;
    for (const p of ps) { const c = calc(p, 1); vente += c.prix; cout += p.achat!; if (c.garde) garde++; }
    return { id: f.id, n: (d?.pieces ?? []).filter((p) => p.catId === f.id).length, marge: vente ? (100 * (vente - cout)) / vente : 0, gainMoy: ps.length ? (vente - cout) / ps.length : 0, garde };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [d, bFam, bSeuil, bMag, bMan, plancher]);

  const lignes = useMemo(() => {
    const s = recherche.trim().toLowerCase();
    let ps = (d?.pieces ?? []).filter((p) => (!famille || p.catId === famille) && (!s || p.name.toLowerCase().includes(s)));
    if (tri === 'manuel') ps = ps.filter((p) => manuelDe(p) != null);
    if (tri === 'marge') {
      const mg = (p: Piece) => (p.achat == null ? Infinity : calc(p, 999).prix - p.achat);
      ps = [...ps].sort((a, b) => mg(a) - mg(b));
    } else ps = [...ps].sort((a, b) => a.cat.localeCompare(b.cat, 'fr') || a.name.localeCompare(b.name, 'fr'));
    return ps;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, recherche, famille, tri, bFam, bSeuil, bMag, bMan, plancher]);

  const nbChangements = Object.keys(bFam).length + Object.keys(bSeuil).length + Object.keys(bMag).length + Object.keys(bMan).length;
  const annuler = () => { setBFam({}); setBSeuil({}); setBMag({}); setBMan({}); setAjout({}); setEdition(null); };

  const ajouterSeuil = (catId: string) => {
    const a = ajout[catId];
    const min = Math.round(num(a?.min ?? ''));
    const pct = num(a?.pct ?? '');
    if (!(min >= 2 && min <= 999) || !(pct > 0 && pct <= 100)) { toast.error('Seuil : une quantité de 2 à 999 et un pourcentage du prix magasin entre 1 et 100.'); return; }
    setBSeuil({ ...bSeuil, [`${catId}|${min}`]: String(pct) });
    setAjout({ ...ajout, [catId]: { min: '', pct: '' } });
  };

  const enregistrer = async () => {
    if (!d) return;
    for (const [k, v] of Object.entries(bFam)) {
      if (k.endsWith('|ratio') && !(num(v) > 0 && num(v) <= 150)) { toast.error('Prix du site en % du prix magasin : entre 1 et 150.'); return; }
      if (k.endsWith('|gain') && v !== '' && !(num(v) >= 0)) { toast.error('Gain minimum : un montant positif, ou vide.'); return; }
    }
    for (const [k, v] of Object.entries(bSeuil)) if (v !== '' && !(num(v) > 0 && num(v) <= 100)) { toast.error(`Seuil ${k.split('|')[1]} : entre 1 et 100 % du prix magasin.`); return; }
    for (const v of [...Object.values(bMag), ...Object.values(bMan)]) if (v !== '' && !(num(v) > 0)) { toast.error('Prix : un montant positif, ou vide pour revenir au calcul automatique.'); return; }
    setBusy(true);
    try {
      const fams = new Set(Object.keys(bFam).map((k) => k.split('|')[0]));
      for (const id of fams) {
        const f = d.familles.find((x) => x.id === id)!;
        const v = famVal(f);
        const { error } = await supabase.from('pro_familles' as never).update({ ratio_site_magasin: v.ratio, gain_min_eur: v.gain, updated_at: new Date().toISOString() } as never).eq('category_id', id);
        if (error) throw error;
      }
      for (const [k, v] of Object.entries(bSeuil)) {
        const [category_id, min] = k.split('|');
        const { error } = v === ''
          ? await supabase.from('pro_grille_qte' as never).delete().eq('category_id', category_id).eq('min_qte', Number(min))
          : await supabase.from('pro_grille_qte' as never).upsert({ category_id, min_qte: Number(min), coef: num(v) / 100, updated_at: new Date().toISOString() } as never);
        if (error) throw error;
      }
      for (const [part_id, v] of Object.entries(bMag)) {
        const { error } = v === ''
          ? await supabase.from('pro_prix_magasin' as never).delete().eq('part_id', part_id)
          : await supabase.from('pro_prix_magasin' as never).upsert({ part_id, prix_magasin: r2(num(v)), source: 'admin', updated_at: new Date().toISOString() } as never);
        if (error) throw error;
      }
      for (const [part_id, v] of Object.entries(bMan)) {
        const { error } = v === ''
          ? await supabase.from('pro_prix_main' as never).delete().eq('part_id', part_id)
          : await supabase.from('pro_prix_main' as never).upsert({ part_id, prix: r2(num(v)), updated_at: new Date().toISOString() } as never);
        if (error) throw error;
      }
      annuler();
      await qc.invalidateQueries({ queryKey: ['admin-pro-grille'] });
      toast.success('Prix pro enregistrés : les magasins les voient à leur prochaine ouverture.');
    } catch (e) {
      toast.error(`Enregistrement interrompu : ${(e as Error).message}. Recharge la page pour voir ce qui est passé.`);
    } finally { setBusy(false); }
  };

  if (q.isLoading) return <div className="py-10 grid place-items-center"><Loader2 className="w-6 h-6 animate-spin" aria-label="Chargement" /></div>;
  if (q.isError || !d) return <p className="text-red-600">Grille illisible : {(q.error as Error)?.message}</p>;

  const champ = 'min-h-[44px] w-[76px] rounded-lg border border-gray-300 px-2 text-base text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-green-600';

  return (
    <div className="grid gap-4 pb-24">
      {/* Règles par famille */}
      <div className="bg-white border border-[hsl(var(--admin-border))] rounded-xl p-4 grid gap-3">
        <p className="text-sm text-[hsl(var(--admin-text-muted))]">
          Un magasin paie <strong>un pourcentage du prix magasin</strong> de la pièce (50 % = prix magasin ÷ 2), et moins quand il en prend plusieurs. Prix magasin = prix conseillé Wattiz quand on l'a, sinon il est déduit du prix du site.
          Garde-fous : jamais sous ton prix d'achat + {Math.round((plancher - 1) * 100)} % (acheté 5 € → {(5 * plancher).toFixed(2).replace('.', ',')} €), jamais sous le gain minimum de la famille, jamais plus cher que le site. Écran réservé à l'admin.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          {d.familles.map((f) => {
            const r = resume.find((x) => x.id === f.id);
            const v = famVal(f);
            const ss = seuilsDe(f.id);
            return (
              <div key={f.id} className="border border-[hsl(var(--admin-border))] rounded-lg p-3 grid gap-2">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-black uppercase">{f.nom}</p>
                  <p className="text-sm text-[hsl(var(--admin-text-muted))]">{r?.n ?? 0} pièces</p>
                </div>
                <div className="grid gap-1">
                  {ss.map((s) => (
                    <label key={s.min} className="flex items-center gap-2 text-sm">
                      <span className="w-[92px] font-semibold">{s.min === 1 ? '1 pièce' : `dès ${s.min}`}</span>
                      <input id={`seuil-${f.id}-${s.min}`} inputMode="decimal" className={champ}
                        value={`${f.id}|${s.min}` in bSeuil ? bSeuil[`${f.id}|${s.min}`] : fr(s.coef * 100)}
                        onChange={(e) => setBSeuil({ ...bSeuil, [`${f.id}|${s.min}`]: e.target.value })} />
                      % du prix magasin
                      {s.min > 1 && (
                        <button type="button" aria-label={`Retirer le seuil dès ${s.min}`} onClick={() => setBSeuil({ ...bSeuil, [`${f.id}|${s.min}`]: '' })}
                          className="ml-auto inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-[hsl(var(--admin-border))] bg-white"><X className="w-4 h-4" /></button>
                      )}
                    </label>
                  ))}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-[92px] font-semibold">+ seuil dès</span>
                    <input aria-label={`Quantité du nouveau seuil ${f.nom}`} inputMode="numeric" className={champ} placeholder="20" value={ajout[f.id]?.min ?? ''} onChange={(e) => setAjout({ ...ajout, [f.id]: { min: e.target.value, pct: ajout[f.id]?.pct ?? '' } })} />
                    <input aria-label={`Pourcentage du nouveau seuil ${f.nom}`} inputMode="decimal" className={champ} placeholder="40" value={ajout[f.id]?.pct ?? ''} onChange={(e) => setAjout({ ...ajout, [f.id]: { pct: e.target.value, min: ajout[f.id]?.min ?? '' } })} />
                    %
                    <button type="button" aria-label={`Ajouter un seuil ${f.nom}`} onClick={() => ajouterSeuil(f.id)} className="ml-auto inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-[hsl(var(--admin-border))] bg-white"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-2 text-sm">
                  <label className="flex items-center gap-2">Gain mini
                    <input id={`gain-${f.id}`} inputMode="decimal" className={champ} placeholder="—"
                      value={`${f.id}|gain` in bFam ? bFam[`${f.id}|gain`] : f.gain == null ? '' : fr(f.gain)} onChange={(e) => setBFam({ ...bFam, [`${f.id}|gain`]: e.target.value })} /> €
                  </label>
                  <label className="flex items-center gap-2">Site =
                    <input id={`ratio-${f.id}`} inputMode="decimal" className={champ}
                      value={`${f.id}|ratio` in bFam ? bFam[`${f.id}|ratio`] : fr(f.ratio * 100)} onChange={(e) => setBFam({ ...bFam, [`${f.id}|ratio`]: e.target.value })} /> % magasin
                  </label>
                </div>
                <p className="text-sm">À l'unité, tu gagnes en moyenne <strong className="text-green-800">{eurFR(r?.gainMoy ?? 0)}</strong> ({Math.round(r?.marge ?? 0)} % de marge){v.gain != null ? ` · au moins ${eurFR(v.gain)} par pièce` : ''}.</p>
                {(r?.garde ?? 0) > 0 && <p className="text-sm text-orange-700 font-semibold">{r!.garde} pièce{r!.garde > 1 ? 's' : ''} tenue{r!.garde > 1 ? 's' : ''} par un garde-fou</p>}
              </div>
            );
          })}
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
          {d.familles.map((f) => <option key={f.id} value={f.id}>{f.nom}</option>)}
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
              <th className="p-3 font-semibold text-right">Prix magasin</th>
              <th className="p-3 font-semibold text-right">1 pièce</th>
              <th className="p-3 font-semibold text-right">En volume</th>
              <th className="p-3"><span className="sr-only">Modifier</span></th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((p) => {
              const enEdition = edition === p.id;
              const f = d.familles.find((x) => x.id === p.catId);
              const mag = magasinDe(p, f);
              const c1 = calc(p, 1);
              const marge = p.achat == null ? null : c1.prix - p.achat;
              const vols = c1.manuel ? [] : seuilsDe(p.catId).filter((s) => s.min > 1).map((s) => ({ min: s.min, prix: calc(p, s.min).prix })).filter((v) => v.prix < c1.prix);
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
                  <td className="p-3 text-right">
                    {enEdition ? (
                      <label className="inline-flex items-center gap-1 justify-end">
                        <span className="sr-only">Prix magasin de {p.name}</span>
                        <input id={`mag-${p.id}`} inputMode="decimal" placeholder={mag.prix == null ? '' : fr(mag.prix)} className={champ}
                          value={p.id in bMag ? bMag[p.id] : d.magasin[p.id] != null ? fr(d.magasin[p.id]) : ''} onChange={(e) => setBMag({ ...bMag, [p.id]: e.target.value })} /> €
                      </label>
                    ) : mag.prix == null ? '—' : <p>{eurFR(mag.prix)}</p>}
                    {mag.estime && mag.prix != null && <p className="text-[hsl(var(--admin-text-muted))]">estimé</p>}
                  </td>
                  <td className="p-3 text-right">
                    {enEdition ? (
                      <label className="inline-flex items-center gap-1 justify-end">
                        <span className="sr-only">Prix à la main de {p.name}</span>
                        <input id={`man-${p.id}`} inputMode="decimal" placeholder={fr(calc(p, 1, true).prix)} className={champ}
                          value={p.id in bMan ? bMan[p.id] : d.manuels[p.id] != null ? fr(d.manuels[p.id]) : ''} onChange={(e) => setBMan({ ...bMan, [p.id]: e.target.value })} /> €
                      </label>
                    ) : <p className="font-bold">{eurFR(c1.prix)}</p>}
                    {marge == null
                      ? <p className="text-orange-700">achat inconnu</p>
                      : <p className={marge < 1 ? 'text-red-600' : 'text-green-800'}>+{eurFR(marge)} · {Math.round((100 * marge) / c1.prix)} %</p>}
                    {c1.manuel && <p className="font-semibold underline decoration-dotted">prix à la main</p>}
                    {c1.garde && <p className="text-orange-700 font-semibold">garde-fou</p>}
                  </td>
                  <td className="p-3 text-right">
                    {vols.length === 0 ? <span className="text-[hsl(var(--admin-text-muted))]">—</span> : vols.map((v) => <p key={v.min}>dès {v.min} : <strong>{eurFR(v.prix)}</strong></p>)}
                  </td>
                  <td className="p-3 text-right">
                    <button type="button" onClick={() => setEdition(enEdition ? null : p.id)} aria-label={enEdition ? 'Fermer' : `Modifier les prix de ${p.name}`}
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
