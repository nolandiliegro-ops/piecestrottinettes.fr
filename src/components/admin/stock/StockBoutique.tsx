// Stock boutique — écran d'inventaire (25/10/2026). V2 après le retour de Nolan sur téléphone : « il faut que j'aie
// du visuel par catégorie… trier par taille… facile sur le téléphone, sur l'iPad. Le scan, ça vient après ».
// → familles en photo, tailles en pastilles (lues dans parts.fitment_specs, repli sur le nom), recherche instantanée
//   (sans Entrée), chaque pièce en photo avec − N + ; un tap sur le chiffre pour taper la quantité ; caméra en option.
// Le stock réel vit dans parts.stock_boutique (à part de stock_quantity, qui sert au paiement). Écritures uniquement
// par les RPC admin_stock_regler / admin_stock_bip (journal stock_boutique_mouvements). Doc : claude/PT-lot-stock-boutique.md.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, CameraOff, Loader2, Search, ScanBarcode, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { optimizedImage } from '@/lib/imageTransform';

type Fitment = { rim_diameters?: string[]; tire_sections?: string[]; brake_disc?: { diameters?: string[] }; brake_caliper?: string[] } | null;
type Piece = { id: string; name: string; sku: string | null; ean: string | null; image_url: string | null; stock_boutique: number; category_id: string | null; fitment_specs: Fitment };
type Cat = { id: string; name: string; image_url: string | null; display_order: number | null };

const ZXING = 'https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.5/+esm';
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[×*]/g, 'x').replace(/,/g, '.');
const num = (s: string) => { const m = s.match(/\d+(\.\d+)?/); return m ? parseFloat(m[0]) : 9999; };

/* La « taille » d'une pièce, comme Nolan la dit au comptoir. */
const tailleDe = (p: Piece): string | null => {
  const f = p.fitment_specs ?? {};
  const n = norm(p.name);
  if (f.tire_sections?.length) {
    const propre = (x: string) => x.replace(',', '.').replace(/\d+\.\d+/g, (m) => String(parseFloat(m)));
    const s = propre(f.tire_sections[0]);
    const r = f.rim_diameters?.[0] ? propre(f.rim_diameters[0]) : null;
    return !s.includes('x') && r ? `${s}-${r}` : s;
  }
  if (f.brake_disc?.diameters?.length) return `${f.brake_disc.diameters[0]} mm`;
  if (f.brake_caliper?.length) return f.brake_caliper[0].split('_').map((w) => w.toUpperCase() === w ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' ').replace(/\b(Mt\d+|M\d+)\b/gi, (x) => x.toUpperCase());
  const pneu = n.match(/(\d+(?:\.\d+)?\s?x\s?\d+(?:\.\d+)?)/); if (pneu) return pneu[1].replace(/\s/g, '').replace(/\d+\.\d+/g, (m) => String(parseFloat(m)));
  const iso = n.match(/(\d{2,3}\/\d{2,3}-\d+(?:\.\d+)?)/); if (iso) return iso[1];
  const volt = n.match(/(\d{2}(?:\.\d)?)\s?v\b/); if (volt) return `${volt[1].replace('.', ',')} V`;
  const mm = n.match(/(\d{3})\s?mm/); if (mm) return `${mm[1]} mm`;
  return null;
};

const Photo = ({ url, size, alt }: { url: string | null; size: number; alt: string }) => (
  <div className="flex-none rounded-xl bg-[#F1EEE7] overflow-hidden flex items-center justify-center" style={{ width: size, height: size }}>
    {url ? <img src={optimizedImage(url, size * 2)} alt={alt} className="w-full h-full object-contain" loading="lazy" /> : <ScanBarcode className="w-1/3 h-1/3 text-[hsl(var(--admin-text-muted))]" />}
  </div>
);

/* Caméra : BarcodeDetector quand le navigateur l'a (Chrome Android), sinon ZXing chargé à la demande (iPhone). */
const Camera_ = ({ onCode }: { onCode: (code: string) => void }) => {
  const video = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const dernier = useRef<{ code: string; t: number }>({ code: '', t: 0 });
  const emit = useCallback((code: string) => {
    const now = Date.now();
    if (code === dernier.current.code && now - dernier.current.t < 1800) return;
    dernier.current = { code, t: now };
    onCode(code);
  }, [onCode]);
  useEffect(() => {
    let stop: () => void = () => {};
    let actif = true;
    (async () => {
      try {
        const W = window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> } };
        if (W.BarcodeDetector) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          if (!actif || !video.current) { stream.getTracks().forEach((t) => t.stop()); return; }
          video.current.srcObject = stream; await video.current.play();
          const det = new W.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'] });
          const timer = window.setInterval(async () => {
            if (!video.current || video.current.readyState < 2) return;
            try { const r = await det.detect(video.current); if (r[0]?.rawValue) emit(r[0].rawValue); } catch { /* image suivante */ }
          }, 250);
          stop = () => { window.clearInterval(timer); stream.getTracks().forEach((t) => t.stop()); };
        } else {
          const url = ZXING;
          const mod = await import(/* @vite-ignore */ url);
          if (!actif || !video.current) return;
          const reader = new mod.BrowserMultiFormatReader();
          const controls = await reader.decodeFromVideoDevice(undefined, video.current, (res: { getText: () => string } | undefined) => { if (res) emit(res.getText()); });
          stop = () => controls.stop();
        }
      } catch (e) {
        setErr(e instanceof Error && e.name === 'NotAllowedError' ? 'Caméra refusée : autorise-la dans les réglages du navigateur.' : 'Caméra indisponible ici. Utilise la douchette ou tape le code.');
      }
    })();
    return () => { actif = false; stop(); };
  }, [emit]);
  return (
    <div className="grid gap-2">
      <video ref={video} className="w-full max-h-[260px] rounded-xl bg-black object-cover" muted playsInline />
      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>
  );
};

const StockBoutique = () => {
  const qc = useQueryClient();
  const [fam, setFam] = useState<string | null>(null);
  const [taille, setTaille] = useState<string | null>(null);
  const [filtre, setFiltre] = useState<'tout' | 'en' | 'zero'>('tout');
  const [q, setQ] = useState('');
  const [camera, setCamera] = useState(false);
  const [saisie, setSaisie] = useState<{ id: string; v: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [vu, setVu] = useState<Piece | null>(null);
  const liste = useRef<HTMLDivElement>(null);

  const data = useQuery({
    queryKey: ['admin-stock-boutique'],
    queryFn: async () => {
      const [{ data: c, error: e1 }, { data: p, error: e2 }] = await Promise.all([
        supabase.from('categories').select('id, name, image_url, display_order'),
        supabase.from('parts').select('id, name, sku, ean, image_url, stock_boutique, category_id, fitment_specs' as never).eq('published', true).order('name').limit(2000),
      ]);
      if (e1) throw e1; if (e2) throw e2;
      const pieces = (p ?? []) as unknown as Piece[];
      const n = new Map<string, number>();
      for (const x of pieces) if (x.category_id) n.set(x.category_id, (n.get(x.category_id) ?? 0) + 1);
      const cats = ((c ?? []) as Cat[]).filter((k) => (n.get(k.id) ?? 0) > 0).sort((a, b) => (n.get(b.id) ?? 0) - (n.get(a.id) ?? 0));
      return { cats, pieces, n };
    },
  });
  const pieces = data.data?.pieces ?? [];
  const cats = data.data?.cats ?? [];
  useEffect(() => { if (!fam && cats.length) setFam(cats[0].id); }, [cats, fam]);

  const total = useMemo(() => {
    const en = pieces.filter((p) => p.stock_boutique > 0);
    return { pcs: en.reduce((a, p) => a + p.stock_boutique, 0), refs: en.length };
  }, [pieces]);

  const recherche = norm(q.trim());
  const dansFamille = useMemo(() => pieces.filter((p) => (recherche ? true : p.category_id === fam)), [pieces, fam, recherche]);
  const tailles = useMemo(() => {
    if (recherche) return [];
    const m = new Map<string, number>();
    for (const p of dansFamille) { const t = tailleDe(p); if (t) m.set(t, (m.get(t) ?? 0) + 1); }
    return [...m.entries()].sort((a, b) => num(a[0]) - num(b[0]) || a[0].localeCompare(b[0], 'fr', { numeric: true }));
  }, [dansFamille, recherche]);
  const visibles = useMemo(() => {
    const mots = recherche.split(/\s+/).filter(Boolean);
    return dansFamille
      .filter((p) => !mots.length || mots.every((m) => norm(`${p.name} ${p.sku ?? ''} ${p.ean ?? ''}`).includes(m)))
      .filter((p) => !taille || recherche || tailleDe(p) === taille)
      .filter((p) => filtre === 'tout' || (filtre === 'en' ? p.stock_boutique > 0 : p.stock_boutique === 0))
      .sort((a, b) => num(tailleDe(a) ?? '') - num(tailleDe(b) ?? '') || a.name.localeCompare(b.name, 'fr', { numeric: true }))
      .slice(0, 300);
  }, [dansFamille, recherche, taille, filtre]);

  const poser = (id: string, stock: number) => {
    qc.setQueryData(['admin-stock-boutique'], (old: typeof data.data) => old ? { ...old, pieces: old.pieces.map((p) => (p.id === id ? { ...p, stock_boutique: stock } : p)) } : old);
  };

  const ajuster = async (p: Piece, delta: number) => {
    if (p.stock_boutique + delta < 0) return;
    setBusy(p.id); poser(p.id, p.stock_boutique + delta);
    const { data: r, error } = await supabase.rpc('admin_stock_regler' as never, { p_part: p.id, p_delta: delta, p_motif: 'inventaire' } as never);
    setBusy(null);
    if (error) { poser(p.id, p.stock_boutique); toast.error(`Pas enregistré : ${error.message}`); return; }
    poser(p.id, Number(r ?? 0));
    try { navigator.vibrate?.(30); } catch { /* pas de vibreur */ }
  };

  const fixer = async (p: Piece, v: string) => {
    setSaisie(null);
    if (v === '' || Number(v) === p.stock_boutique) return;
    setBusy(p.id);
    const { data: r, error } = await supabase.rpc('admin_stock_bip' as never, { p_code: '', p_qte: Number(v), p_fixer: true, p_part: p.id } as never);
    setBusy(null);
    if (error) { toast.error(`Pas enregistré : ${error.message}`); return; }
    poser(p.id, Number((r as unknown as { stock_boutique?: number })?.stock_boutique ?? v));
  };

  // Caméra : un code lu → +1 sur la pièce, montrée en haut de la liste.
  const onCode = useCallback(async (code: string) => {
    const { data: r, error } = await supabase.rpc('admin_stock_bip' as never, { p_code: code, p_qte: 1, p_fixer: false, p_part: null } as never);
    if (error) { toast.error(error.message); return; }
    const b = r as unknown as { trouve: boolean; id?: string; stock_boutique?: number; choix?: unknown[] };
    if (b.choix) { setQ(code); toast('Ce code va sur plusieurs pièces : choisis la tienne dans la liste.'); return; }
    if (!b.trouve) { toast.error(`Code ${code} inconnu : cherche la pièce par son nom.`); return; }
    poser(b.id!, b.stock_boutique ?? 0);
    const p = (qc.getQueryData(['admin-stock-boutique']) as typeof data.data)?.pieces.find((x) => x.id === b.id);
    if (p) { setVu({ ...p, stock_boutique: b.stock_boutique ?? 0 }); toast.success(`+1 · ${p.name} → ${b.stock_boutique}`); }
    try { navigator.vibrate?.(60); } catch { /* pas de vibreur */ }
  }, [qc]); // eslint-disable-line react-hooks/exhaustive-deps

  const choisirFam = (id: string) => { setFam(id); setTaille(null); setQ(''); liste.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }); };

  if (data.isLoading) return <div className="p-6"><Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--admin-accent))]" /></div>;
  if (data.isError) return <div className="p-6 text-red-600">Lecture impossible : {String((data.error as Error)?.message)}</div>;

  const ligne = (p: Piece) => {
    const t = tailleDe(p);
    return (
      <div key={p.id} className={`flex items-center gap-3 bg-white border rounded-xl p-2 ${p.stock_boutique > 0 ? 'border-green-700/40' : 'border-[hsl(var(--admin-border))]'}`}>
        <Photo url={p.image_url} size={64} alt={p.name} />
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold leading-snug line-clamp-2">{p.name}</p>
          <p className="text-[14px] text-[hsl(var(--admin-text-muted))] truncate">{t && <span className="font-semibold text-[hsl(var(--admin-text))]">{t}</span>}{t ? ' · ' : ''}{p.sku}</p>
        </div>
        <div className="flex items-center flex-none border border-[hsl(var(--admin-border))] rounded-xl overflow-hidden bg-white">
          <button type="button" disabled={busy === p.id || p.stock_boutique === 0} onClick={() => void ajuster(p, -1)} className="w-11 h-12 text-2xl font-bold text-green-800 disabled:text-gray-300" aria-label={`Retirer un ${p.name}`}>−</button>
          {saisie?.id === p.id ? (
            <input autoFocus inputMode="numeric" value={saisie.v} aria-label="Quantité" onChange={(e) => setSaisie({ id: p.id, v: e.target.value.replace(/\D/g, '').slice(0, 4) })}
              onBlur={() => void fixer(p, saisie.v)} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
              className="w-12 h-12 text-center text-lg font-black border-x border-[hsl(var(--admin-border))] outline-none text-[16px]" />
          ) : (
            <button type="button" onClick={() => setSaisie({ id: p.id, v: '' })} className={`w-12 h-12 text-lg font-black tabular-nums border-x border-[hsl(var(--admin-border))] ${p.stock_boutique ? 'text-green-800' : 'text-gray-400'}`} aria-label="Taper la quantité">
              {busy === p.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : p.stock_boutique}
            </button>
          )}
          <button type="button" disabled={busy === p.id} onClick={() => void ajuster(p, 1)} className="w-11 h-12 text-2xl font-bold text-green-800" aria-label={`Ajouter un ${p.name}`}>+</button>
        </div>
      </div>
    );
  };

  const famCourante = cats.find((c) => c.id === fam);

  return (
    <div className="p-3 md:p-5 grid gap-3 max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-black uppercase text-xl tracking-tight">Stock boutique</h1>
          <p className="text-[14px] text-[hsl(var(--admin-text-muted))]"><b className="text-green-700">{total.pcs} pièce{total.pcs > 1 ? 's' : ''}</b> en boutique · {total.refs} référence{total.refs > 1 ? 's' : ''} sur {pieces.length}</p>
        </div>
        <button type="button" onClick={() => setCamera((c) => !c)} className="min-h-[44px] px-3 rounded-lg border border-[hsl(var(--admin-border))] bg-white font-semibold text-[14px] inline-flex items-center gap-1.5">
          {camera ? <><CameraOff className="w-4 h-4" />Couper le scan</> : <><Camera className="w-4 h-4" />Scanner un code-barres</>}
        </button>
      </div>

      {camera && (
        <div className="bg-white border border-[hsl(var(--admin-border))] rounded-xl p-3 grid gap-2 max-w-md">
          <p className="text-[14px] text-[hsl(var(--admin-text-muted))]">Vise le code-barres de la boîte : chaque lecture ajoute 1.</p>
          <Camera_ onCode={(c) => void onCode(c)} />
          {vu && <div className="flex items-center gap-3"><Photo url={vu.image_url} size={56} alt={vu.name} /><p className="text-[14px] font-semibold flex-1">{vu.name}</p><span className="font-black text-2xl text-green-800">{vu.stock_boutique}</span></div>}
        </div>
      )}

      {/* Familles en photo */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
        {cats.map((c) => (
          <button key={c.id} type="button" onClick={() => choisirFam(c.id)}
            className={`snap-start flex-none w-[104px] md:w-[124px] rounded-xl border-2 bg-white p-1.5 text-left ${fam === c.id && !recherche ? 'border-green-700' : 'border-transparent'}`}>
            <Photo url={c.image_url} size={88} alt={c.name} />
            <p className="text-[14px] font-bold leading-tight mt-1">{c.name}</p>
            <p className="text-[14px] text-[hsl(var(--admin-text-muted))]">{data.data?.n.get(c.id) ?? 0}</p>
          </button>
        ))}
      </div>

      {/* Recherche instantanée */}
      <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 min-h-[48px] focus-within:ring-2 focus-within:ring-green-600">
        <Search className="w-5 h-5 text-[hsl(var(--admin-text-muted))] flex-none" />
        <label htmlFor="stock-q" className="sr-only">Chercher une pièce</label>
        <input id="stock-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher : chambre 10x2.125, magura, 36v…" autoComplete="off"
          className="flex-1 min-w-0 bg-transparent outline-none text-[16px]" />
        {q && <button type="button" onClick={() => setQ('')} className="w-9 h-9 flex items-center justify-center" aria-label="Effacer"><X className="w-5 h-5" /></button>}
      </div>

      <div ref={liste} className="scroll-mt-3 grid gap-2">
        {/* Tailles */}
        {tailles.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button type="button" onClick={() => setTaille(null)} className={`flex-none min-h-[40px] px-3 rounded-full border text-[14px] font-semibold ${!taille ? 'bg-green-700 border-green-700 text-white' : 'bg-white border-[hsl(var(--admin-border))]'}`}>Toutes</button>
            {tailles.map(([t, n]) => (
              <button key={t} type="button" onClick={() => setTaille(t === taille ? null : t)}
                className={`flex-none min-h-[40px] px-3 rounded-full border text-[14px] font-semibold whitespace-nowrap ${taille === t ? 'bg-green-700 border-green-700 text-white' : 'bg-white border-[hsl(var(--admin-border))]'}`}>
                {t} <span className={taille === t ? 'text-white/80' : 'text-[hsl(var(--admin-text-muted))]'}>{n}</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex border border-[hsl(var(--admin-border))] rounded-lg overflow-hidden bg-white max-w-md">
          {([['tout', 'Tout'], ['en', 'En boutique'], ['zero', 'À 0']] as const).map(([k, l]) => (
            <button key={k} type="button" onClick={() => setFiltre(k)} className={`flex-1 min-h-[44px] text-[14px] font-semibold ${filtre === k ? 'bg-[#EAF1EC] text-green-800' : 'text-[hsl(var(--admin-text-muted))]'}`}>{l}</button>
          ))}
        </div>
        <p className="text-[14px] text-[hsl(var(--admin-text-muted))]">
          {recherche ? `${visibles.length} résultat${visibles.length > 1 ? 's' : ''} pour « ${q.trim()} »` : `${famCourante?.name ?? ''}${taille ? ` · ${taille}` : ''} : ${visibles.length} pièce${visibles.length > 1 ? 's' : ''}`}
          {' · '}touche le chiffre pour taper une quantité
        </p>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {visibles.map((p) => ligne(p))}
        </div>
        {visibles.length === 0 && <p className="bg-white border border-[hsl(var(--admin-border))] rounded-xl p-4 text-[14px]">Aucune pièce ici. Essaie un autre mot ou une autre taille.</p>}
      </div>
    </div>
  );
};

export default StockBoutique;
