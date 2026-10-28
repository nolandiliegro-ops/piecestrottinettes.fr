/**
 * 28/10/2026 (Nolan) — visionneuse plein écran des photos produit (trottinettes et pièces).
 * Téléphone : pincer pour zoomer (×1 à ×4), double-tap = zoom ×2,5 là où on tape, glisser pour se déplacer dans la
 * photo zoomée, glisser à gauche/droite pour changer de photo, glisser vers le bas ou bouton retour du téléphone = fermer.
 * Ordinateur : molette = zoom, double-clic, flèches du clavier, Échap.
 * Photos en 1600 px (Supabase render), chargées seulement à l'ouverture.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { optimizedImage } from "@/lib/imageTransform";

export interface ViewerPhoto { url: string; alt?: string | null }

interface Props {
  photos: ViewerPhoto[];
  index: number;
  name: string;
  onIndex: (i: number) => void;
  onClose: () => void;
}

const MAX = 4;
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);

const PhotoViewer = ({ photos, index, name, onIndex, onClose }: Props) => {
  const stage = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const [s, setS] = useState(1);
  const [t, setT] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [anim, setAnim] = useState(false);
  const st = useRef({ s: 1, t: { x: 0, y: 0 } });
  st.current = { s, t };
  const n = photos.length;
  const cur = photos[index];

  // Les gestes lisent st.current : on le met à jour TOUT DE SUITE (sans attendre le rendu React), sinon un pincement
  // suivi d'un lâcher dans la même image d'écran lit l'ancien zoom et le remet à 1.
  const apply = useCallback((ns: number, nt: { x: number; y: number }) => { st.current = { s: ns, t: nt }; setS(ns); setT(nt); }, []);
  const reset = useCallback(() => { apply(1, { x: 0, y: 0 }); setDrag({ x: 0, y: 0 }); }, [apply]);
  useEffect(() => { reset(); }, [index, reset]);

  const go = useCallback((d: number) => { if (n > 1) onIndex((index + d + n) % n); }, [index, n, onIndex]);

  // Bouton retour du téléphone = fermer la visionneuse (sans quitter la fiche).
  const closedByPop = useRef(false);
  useEffect(() => {
    try { window.history.pushState({ ...(window.history.state || {}), ptViewer: true }, ""); } catch { /* ignore */ }
    const pop = () => { closedByPop.current = true; onClose(); };
    window.addEventListener("popstate", pop);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("popstate", pop);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const close = useCallback(() => {
    if (!closedByPop.current && window.history.state?.ptViewer) window.history.back();
    else onClose();
  }, [onClose]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") close(); if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [close, go]);

  // Bornes du déplacement : la photo zoomée ne quitte jamais l'écran.
  const bound = useCallback((sc: number, tx: number, ty: number) => {
    const el = img.current, sg = stage.current;
    if (!el || !sg) return { x: 0, y: 0 };
    const mx = Math.max(0, (el.offsetWidth * sc - sg.clientWidth) / 2);
    const my = Math.max(0, (el.offsetHeight * sc - sg.clientHeight) / 2);
    return { x: clamp(tx, -mx, mx), y: clamp(ty, -my, my) };
  }, []);

  // Zoom autour d'un point de l'écran (px, py) : le point sous le doigt reste sous le doigt.
  const zoomAt = useCallback((ns: number, px: number, py: number, s0: number, t0: { x: number; y: number }) => {
    const sg = stage.current; if (!sg) return;
    const r = sg.getBoundingClientRect();
    const cx = px - r.left - r.width / 2, cy = py - r.top - r.height / 2;
    const k = ns / s0;
    const nt = ns <= 1 ? { x: 0, y: 0 } : bound(ns, cx - (cx - t0.x) * k, cy - (cy - t0.y) * k);
    apply(ns, nt);
  }, [bound, apply]);

  const lastTap = useRef(0);
  const g = useRef<{ mode: "none" | "pan" | "pinch" | "swipe"; x0: number; y0: number; t0: { x: number; y: number }; s0: number; d0: number; moved: boolean }>({ mode: "none", x0: 0, y0: 0, t0: { x: 0, y: 0 }, s0: 1, d0: 1, moved: false });

  useEffect(() => {
    const el = stage.current; if (!el) return;
    const dist = (e: TouchEvent) => Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    const mid = (e: TouchEvent) => ({ x: (e.touches[0].clientX + e.touches[1].clientX) / 2, y: (e.touches[0].clientY + e.touches[1].clientY) / 2 });
    const ts = (e: TouchEvent) => {
      setAnim(false);
      const { s: s0, t: t0 } = st.current;
      if (e.touches.length === 2) { g.current = { mode: "pinch", x0: 0, y0: 0, t0, s0, d0: dist(e), moved: true }; return; }
      const p = e.touches[0];
      g.current = { mode: s0 > 1.01 ? "pan" : "swipe", x0: p.clientX, y0: p.clientY, t0, s0, d0: 1, moved: false };
    };
    const tm = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      const G = g.current;
      if (G.mode === "pinch" && e.touches.length === 2) {
        const m = mid(e);
        zoomAt(clamp(G.s0 * dist(e) / G.d0, 1, MAX), m.x, m.y, G.s0, G.t0);
        return;
      }
      if (e.touches.length !== 1) return;
      const p = e.touches[0];
      const dx = p.clientX - G.x0, dy = p.clientY - G.y0;
      if (Math.hypot(dx, dy) > 6) G.moved = true;
      if (G.mode === "pan") apply(st.current.s, bound(st.current.s, G.t0.x + dx, G.t0.y + dy));
      else if (G.mode === "swipe") setDrag({ x: dx, y: Math.max(0, dy) });
    };
    const te = (e: TouchEvent) => {
      const G = g.current;
      if (e.touches.length > 0) { // un doigt reste après un pincement → on repart en déplacement
        const p = e.touches[0];
        g.current = { mode: st.current.s > 1.01 ? "pan" : "swipe", x0: p.clientX, y0: p.clientY, t0: st.current.t, s0: st.current.s, d0: 1, moved: true };
        return;
      }
      setAnim(true);
      if (G.mode === "swipe") {
        const p = e.changedTouches[0];
        const dx = p.clientX - G.x0, dy = p.clientY - G.y0;
        setDrag({ x: 0, y: 0 });
        if (dy > 110 && Math.abs(dy) > Math.abs(dx)) { close(); return; }
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) { go(dx < 0 ? 1 : -1); return; }
      }
      if (st.current.s < 1.05) apply(1, { x: 0, y: 0 });
      if (!G.moved) { // tap : double-tap = zoom / dézoom
        const now = Date.now();
        const p = e.changedTouches[0];
        if (now - lastTap.current < 300) {
          lastTap.current = 0;
          if (st.current.s > 1.01) apply(1, { x: 0, y: 0 }); else zoomAt(2.5, p.clientX, p.clientY, 1, { x: 0, y: 0 });
        } else lastTap.current = now;
      }
    };
    el.addEventListener("touchstart", ts, { passive: true });
    el.addEventListener("touchmove", tm, { passive: false });
    el.addEventListener("touchend", te);
    el.addEventListener("touchcancel", te);
    return () => {
      el.removeEventListener("touchstart", ts);
      el.removeEventListener("touchmove", tm);
      el.removeEventListener("touchend", te);
      el.removeEventListener("touchcancel", te);
    };
  }, [apply, bound, close, go, zoomAt]);

  // Ordinateur : molette + double-clic + glisser à la souris quand zoomé.
  const onWheel = (e: React.WheelEvent) => {
    setAnim(false);
    const { s: s0, t: t0 } = st.current;
    zoomAt(clamp(s0 * (e.deltaY < 0 ? 1.15 : 1 / 1.15), 1, MAX), e.clientX, e.clientY, s0, t0);
  };
  const onDoubleClick = (e: React.MouseEvent) => {
    setAnim(true);
    if (st.current.s > 1.01) apply(1, { x: 0, y: 0 }); else zoomAt(2.5, e.clientX, e.clientY, 1, { x: 0, y: 0 });
  };
  const onMouseDown = (e: React.MouseEvent) => {
    if (st.current.s <= 1.01 || e.button !== 0) return;
    e.preventDefault(); setAnim(false);
    const x0 = e.clientX, y0 = e.clientY, t0 = st.current.t, sc = st.current.s;
    const mm = (ev: MouseEvent) => apply(sc, bound(sc, t0.x + ev.clientX - x0, t0.y + ev.clientY - y0));
    const mu = () => { window.removeEventListener("mousemove", mm); window.removeEventListener("mouseup", mu); };
    window.addEventListener("mousemove", mm); window.addEventListener("mouseup", mu);
  };

  if (!cur) return null;
  const fade = drag.y > 0 ? Math.max(0.4, 1 - drag.y / 400) : 1;

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`Photos ${name}`} className="fixed inset-0 z-[90] flex flex-col select-none"
      style={{ backgroundColor: `rgba(250,250,248,${fade})`, WebkitTouchCallout: "none" } as React.CSSProperties}>
      <div className="flex items-center justify-between px-3 pt-[max(env(safe-area-inset-top),8px)] pb-2">
        <span className="text-sm font-semibold text-gray-500 pl-2 tabular-nums">{n > 1 ? `${index + 1} / ${n}` : ""}</span>
        <span className="hidden md:block text-sm text-gray-500">Molette ou double-clic pour zoomer</span>
        <button type="button" onClick={close} aria-label="Fermer" className="w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center">
          <X className="w-5 h-5 text-[#1A1A1A]" />
        </button>
      </div>

      <div ref={stage} className="relative flex-1 overflow-hidden flex items-center justify-center" style={{ touchAction: "none" }}
        onWheel={onWheel} onDoubleClick={onDoubleClick} onMouseDown={onMouseDown}>
        <img
          ref={img}
          key={cur.url}
          src={optimizedImage(cur.url, 1600, 85)}
          alt={cur.alt || name}
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          className="max-w-[94%] max-h-[94%] object-contain"
          style={{
            transform: `translate(${t.x + drag.x}px, ${t.y + drag.y}px) scale(${s})`,
            transition: anim ? "transform 220ms ease-out" : "none",
            cursor: s > 1.01 ? "grab" : "zoom-in",
            WebkitTouchCallout: "none",
          } as React.CSSProperties}
        />
        {n > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Photo précédente"
              className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white shadow-md items-center justify-center">
              <ChevronLeft className="w-6 h-6 text-[#1A1A1A]" />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Photo suivante"
              className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white shadow-md items-center justify-center">
              <ChevronRight className="w-6 h-6 text-[#1A1A1A]" />
            </button>
          </>
        )}
      </div>

      {n > 1 && (
        <div className="flex justify-center gap-2 overflow-x-auto px-4 pt-2 pb-[max(env(safe-area-inset-bottom),12px)]" style={{ scrollbarWidth: "none" }}>
          {photos.map((p, k) => (
            <button key={p.url + k} type="button" onClick={() => onIndex(k)} aria-label={`Photo ${k + 1}`}
              className="flex-shrink-0 w-14 h-14 rounded-lg bg-white flex items-center justify-center border-2"
              style={{ borderColor: k === index ? "#4A7C59" : "rgba(26,26,26,0.08)" }}>
              <img src={optimizedImage(p.url, 160)} alt="" className="max-w-[82%] max-h-[82%] object-contain" draggable={false} />
            </button>
          ))}
        </div>
      )}
      <p className="text-center text-[14px] text-gray-500 pb-3 md:hidden">Pince pour zoomer · glisse pour changer</p>
    </div>,
    document.body,
  );
};

export default PhotoViewer;
