// Stock boutique — écran d'inventaire « Douchette » (choisi par Nolan le 25/10/2026 sur 5 propositions).
// Le stock réel de ses locaux vit dans parts.stock_boutique, à part de stock_quantity (qui sert au paiement du site).
// Toute écriture passe par les RPC admin (admin_stock_bip / admin_stock_regler) qui tiennent le journal
// stock_boutique_mouvements. Ventes site / pro et « Reçu » (Pros → À commander) le font bouger tout seuls.
// Doc : claude/PT-lot-stock-boutique.md.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, CameraOff, Loader2, Search, ScanBarcode, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { optimizedImage } from '@/lib/imageTransform';

type Piece = { id: string; name: string; sku: string | null; ean: string | null; image_url: string | null; stock_boutique: number };
type Bip = { trouve: boolean; code?: string | null; id?: string; name?: string; sku?: string | null; ean?: string | null; image_url?: string | null; stock_boutique?: number; avant?: number; choix?: Piece[] };
type Ligne = { id: string; name: string; image_url: string | null; stock: number; ajout: number };

const ZXING = 'https://cdn.jsdelivr.net/npm/@zxing/browser@0.1.5/+esm';
const estCode = (s: string) => /^\d{8,14}$/.test(s) || /^[A-Z]{1,4}-[A-Z0-9-]+$/i.test(s);

const Photo = ({ url, size, alt }: { url: string | null; size: number; alt: string }) => (
  <div className="flex-none rounded-xl bg-[#F1EEE7] overflow-hidden flex items-center justify-center" style={{ width: size, height: size }}>
    {url ? <img src={optimizedImage(url, size * 2)} alt={alt} className="w-full h-full object-contain" loading="eager" /> : <ScanBarcode className="w-1/3 h-1/3 text-[hsl(var(--admin-text-muted))]" />}
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
  const input = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<'plus' | 'qte'>('plus');
  const [camera, setCamera] = useState(false);
  const [busy, setBusy] = useState(false);
  const [courante, setCourante] = useState<Piece | null>(null);
  const [saisie, setSaisie] = useState('');
  const [inconnu, setInconnu] = useState<string | null>(null);
  const [choix, setChoix] = useState<{ code: string | null; list: Piece[] } | null>(null);
  const [resultats, setResultats] = useState<Piece[] | null>(null);
  const [session, setSession] = useState<Ligne[]>([]);
  const [flash, setFlash] = useState(0);

  const total = useQuery({
    queryKey: ['admin-stock-boutique'],
    queryFn: async () => {
      const { data, error } = await supabase.from('parts').select('stock_boutique' as never).gt('stock_boutique' as never, 0 as never);
      if (error) throw error;
      const rows = (data ?? []) as unknown as { stock_boutique: number }[];
      return { pieces: rows.reduce((a, r) => a + r.stock_boutique, 0), refs: rows.length };
    },
  });

  const noter = (p: Piece, ajout: number) => {
    setCourante(p); setFlash((x) => x + 1);
    setSession((s) => [{ id: p.id, name: p.name, image_url: p.image_url, stock: p.stock_boutique, ajout: (s.find((l) => l.id === p.id)?.ajout ?? 0) + ajout }, ...s.filter((l) => l.id !== p.id)]);
    try { navigator.vibrate?.(60); } catch { /* pas de vibreur */ }
    qc.invalidateQueries({ queryKey: ['admin-stock-boutique'] });
  };

  const bip = async (c: string | null, opts: { part?: string; qte?: number; fixer?: boolean } = {}) => {
    setBusy(true); setInconnu(null); setChoix(null); setResultats(null);
    const { data, error } = await supabase.rpc('admin_stock_bip' as never, { p_code: c ?? '', p_qte: opts.qte ?? 1, p_fixer: !!opts.fixer, p_part: opts.part ?? null } as never);
    setBusy(false);
    if (error) { toast.error(`Bip non enregistré : ${error.message}`); return; }
    const r = data as unknown as Bip;
    if (r.choix?.length) { setChoix({ code: r.code ?? null, list: r.choix.map((x) => ({ ...x, ean: null, stock_boutique: 0 })) }); return; }
    if (!r.trouve) { setInconnu(r.code ?? c ?? ''); return; }
    const p: Piece = { id: r.id!, name: r.name!, sku: r.sku ?? null, ean: r.ean ?? null, image_url: r.image_url ?? null, stock_boutique: r.stock_boutique ?? 0 };
    noter(p, (r.stock_boutique ?? 0) - (r.avant ?? 0));
  };

  // Mode « je tape la quantité » : le bip montre la pièce sans rien écrire, « Valider » fixe le compte.
  const trouver = async (c: string): Promise<Piece[]> => {
    const { data } = await supabase.from('parts').select('id, name, sku, ean, image_url, stock_boutique' as never)
      .or(`ean.eq.${c},sku.ilike.${c}` as never).limit(20);
    return (data ?? []) as unknown as Piece[];
  };

  const chercher = async (q: string) => {
    const mots = q.trim().split(/\s+/).filter(Boolean).slice(0, 4);
    let req = supabase.from('parts').select('id, name, sku, ean, image_url, stock_boutique' as never);
    for (const m of mots) req = req.ilike('name', `%${m.replace(/[%,()]/g, '')}%`);
    const { data, error } = await req.order('name').limit(12);
    if (error) { toast.error(error.message); return; }
    setResultats((data ?? []) as unknown as Piece[]);
  };

  const envoyer = async (brut: string) => {
    const c = brut.trim();
    setCode('');
    if (!c) return;
    if (!estCode(c)) { await chercher(c); return; }
    if (mode === 'plus') { await bip(c); }
    else {
      const l = await trouver(c);
      setInconnu(null); setChoix(null); setResultats(null);
      if (l.length === 0) setInconnu(c);
      else if (l.length > 1) setChoix({ code: c, list: l });
      else { setCourante(l[0]); setSaisie(''); setFlash((x) => x + 1); }
    }
    input.current?.focus();
  };

  const choisir = async (p: Piece, c: string | null) => {
    if (mode === 'plus') await bip(c, { part: p.id });
    else { setChoix(null); setResultats(null); setCourante(p); setSaisie(''); setFlash((x) => x + 1); }
  };

  const ajuster = async (delta: number) => {
    if (!courante) return;
    setBusy(true);
    const { data, error } = await supabase.rpc('admin_stock_regler' as never, { p_part: courante.id, p_delta: delta, p_motif: 'inventaire' } as never);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    const n = Number(data ?? 0);
    noter({ ...courante, stock_boutique: n }, n - courante.stock_boutique);
  };

  const valider = async () => {
    if (!courante || saisie === '') return;
    await bip(null, { part: courante.id, qte: Number(saisie), fixer: true });
    setSaisie('');
    input.current?.focus();
  };

  const onCamera = useCallback((c: string) => { void envoyer(c); }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="p-3 md:p-5 grid gap-3 max-w-5xl">
      <div className="bg-white border border-[hsl(var(--admin-border))] rounded-xl p-4 grid gap-1">
        <h1 className="font-black uppercase text-xl tracking-tight">Stock boutique</h1>
        <p className="text-sm text-[hsl(var(--admin-text-muted))]">
          <b className="text-green-700">{total.data?.pieces ?? '…'} pièces</b> en boutique · {total.data?.refs ?? '…'} références.
          Ce chiffre est ce que voient les magasins pros (« En boutique » / « Pas en boutique »). Le paiement du site n'en dépend pas.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-3 items-start">
        <div className="grid gap-3">
          <form className="border-2 border-dashed border-green-700 rounded-xl bg-white p-3 grid gap-2" onSubmit={(e) => { e.preventDefault(); void envoyer(code); }}>
            <label htmlFor="stock-code" className="text-sm font-semibold">Bipe un code-barres, ou tape un nom</label>
            <div className="flex gap-2">
              <input id="stock-code" ref={input} value={code} onChange={(e) => setCode(e.target.value)} autoFocus autoComplete="off" enterKeyHint="go"
                placeholder="3760351013643, CA-33, chambre 10x2.125…" className="flex-1 min-w-0 min-h-[48px] border border-gray-300 rounded-lg px-3 text-[16px] focus:ring-2 focus:ring-green-600 outline-none" />
              <button type="submit" disabled={busy} className="min-h-[48px] min-w-[48px] rounded-lg bg-green-700 hover:bg-green-800 text-white flex items-center justify-center" aria-label="Valider">
                {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              </button>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setCamera((c) => !c)} className="flex-1 min-h-[44px] rounded-lg border border-[hsl(var(--admin-border))] bg-white font-semibold text-sm inline-flex items-center justify-center gap-1.5">
                {camera ? <><CameraOff className="w-4 h-4" />Couper la caméra</> : <><Camera className="w-4 h-4" />Scanner avec la caméra</>}
              </button>
            </div>
            <div className="flex border border-[hsl(var(--admin-border))] rounded-lg overflow-hidden">
              {([['plus', 'Chaque bip = +1'], ['qte', 'Je tape la quantité']] as const).map(([k, l]) => (
                <button key={k} type="button" onClick={() => setMode(k)} className={`flex-1 min-h-[44px] text-sm font-semibold ${mode === k ? 'bg-[#EAF1EC] text-green-800' : 'bg-white text-[hsl(var(--admin-text-muted))]'}`}>{l}</button>
              ))}
            </div>
            {camera && <Camera_ onCode={onCamera} />}
          </form>

          {inconnu !== null && (
            <div className="bg-white border border-red-300 rounded-xl p-3 text-sm">
              <p className="font-semibold text-red-700">Code {inconnu || '(vide)'} inconnu.</p>
              <p className="text-[hsl(var(--admin-text-muted))]">Tape le nom de la pièce pour la retrouver (ex. « chambre 10x2.125 45 »).</p>
            </div>
          )}

          {(choix || resultats) && (
            <div className="bg-white border border-[hsl(var(--admin-border))] rounded-xl overflow-hidden">
              <p className="px-3 py-2 text-sm font-semibold">{choix ? `Ce code correspond à ${choix.list.length} pièces : laquelle as-tu en main ?` : resultats!.length ? 'Laquelle ?' : 'Aucune pièce trouvée.'}</p>
              {(choix?.list ?? resultats ?? []).map((p) => (
                <button key={p.id} type="button" onClick={() => void choisir(p, choix?.code ?? null)} className="w-full flex items-center gap-3 px-3 py-2 border-t border-[#F0EDE6] text-left hover:bg-[#F7F4EE]">
                  <Photo url={p.image_url} size={48} alt={p.name} />
                  <span className="flex-1 min-w-0 text-sm font-medium">{p.name}<span className="block text-[hsl(var(--admin-text-muted))]">{p.sku}</span></span>
                </button>
              ))}
            </div>
          )}

          {courante ? (
            <div key={flash} className="bg-white border border-[hsl(var(--admin-border))] rounded-xl p-3 flex gap-3 items-center animate-in fade-in duration-300">
              <Photo url={courante.image_url} size={120} alt={courante.name} />
              <div className="flex-1 min-w-0 grid gap-1">
                <p className="font-semibold text-[15px] leading-snug">{courante.name}</p>
                <p className="text-sm text-[hsl(var(--admin-text-muted))] tabular-nums">{courante.sku}{courante.ean ? ` · ${courante.ean}` : ''}</p>
                {mode === 'plus' ? (
                  <div className="flex items-center gap-3 mt-1">
                    <span className="font-black text-4xl text-green-800 tabular-nums">{courante.stock_boutique}</span>
                    <div className="flex border border-[hsl(var(--admin-border))] rounded-lg overflow-hidden">
                      <button type="button" disabled={busy} onClick={() => void ajuster(-1)} className="w-11 h-11 text-xl font-bold text-green-800" aria-label="Retirer un">−</button>
                      <button type="button" disabled={busy} onClick={() => void ajuster(1)} className="w-11 h-11 text-xl font-bold text-green-800 border-l border-[hsl(var(--admin-border))]" aria-label="Ajouter un">+</button>
                    </div>
                  </div>
                ) : (
                  <form className="flex items-center gap-2 mt-1" onSubmit={(e) => { e.preventDefault(); void valider(); }}>
                    <label htmlFor="stock-qte" className="sr-only">Quantité sur l'étagère</label>
                    <input id="stock-qte" inputMode="numeric" autoFocus value={saisie} onChange={(e) => setSaisie(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder={String(courante.stock_boutique)} className="w-20 min-h-[48px] border border-gray-300 rounded-lg text-center text-xl font-bold" />
                    <button type="submit" disabled={busy || saisie === ''} className="min-h-[48px] px-4 rounded-lg bg-green-700 hover:bg-green-800 text-white font-semibold disabled:opacity-50">Valider</button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[hsl(var(--admin-border))] rounded-xl p-3 text-sm text-[hsl(var(--admin-text-muted))]">
              Bipe ta première pièce : elle s'affiche ici en grand, avec sa photo, pour vérifier que c'est la bonne valve, la bonne taille.
            </div>
          )}
        </div>

        <div className="bg-white border border-[hsl(var(--admin-border))] rounded-xl overflow-hidden">
          <p className="px-3 py-2 text-sm font-semibold flex justify-between"><span>Cette session</span><span className="text-[hsl(var(--admin-text-muted))]">{session.length} pièce{session.length > 1 ? 's' : ''}</span></p>
          {session.length === 0 && <p className="px-3 pb-3 text-sm text-[hsl(var(--admin-text-muted))]">Rien bipé pour l'instant.</p>}
          {session.map((l) => (
            <button key={l.id} type="button" onClick={() => setCourante({ id: l.id, name: l.name, image_url: l.image_url, sku: null, ean: null, stock_boutique: l.stock })}
              className="w-full flex items-center gap-3 px-3 py-2 border-t border-[#F0EDE6] text-left hover:bg-[#F7F4EE]">
              <Photo url={l.image_url} size={44} alt={l.name} />
              <span className="flex-1 min-w-0 text-sm">{l.name}</span>
              <span className="text-sm font-bold text-green-800 tabular-nums whitespace-nowrap">{l.ajout > 0 ? `+${l.ajout} · ` : l.ajout < 0 ? `${l.ajout} · ` : ''}{l.stock}</span>
            </button>
          ))}
          {courante && mode === 'plus' && (
            <button type="button" disabled={busy} onClick={() => void ajuster(-1)} className="w-full min-h-[44px] border-t border-[#F0EDE6] text-sm text-[hsl(var(--admin-text-muted))] inline-flex items-center justify-center gap-1.5">
              <Undo2 className="w-4 h-4" />Annuler le dernier bip ({courante.name.slice(0, 32)}{courante.name.length > 32 ? '…' : ''})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockBoutique;
