/**
 * 28/10/2026 (Nolan) — photo produit « loupe » :
 *  - appui long (≈ 280 ms) sur la photo → une loupe ronde ×2,5 apparaît au-dessus du doigt et suit le doigt ;
 *    on relâche, elle disparaît. Plus de menu « Enregistrer l'image / Ouvrir dans un onglet » d'iOS ou Chrome.
 *  - simple tap → visionneuse plein écran (onOpen), pincer pour zoomer, glisser pour changer de photo.
 *  - ordinateur : maintenir le clic = loupe ; clic simple = visionneuse.
 * La loupe charge une version 1600 px (Supabase render) seulement au premier appui : zéro poids en plus au chargement.
 */
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

const HOLD_MS = 280;
const MOVE_TOL = 9;
const ZOOM = 2.5;

interface Props {
  src: string;
  hiSrc: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  decoding?: "async" | "auto" | "sync";
  onOpen?: () => void;
}

type Lens = { cx: number; cy: number; px: number; py: number; w: number; h: number };

const ZoomableImage = ({ src, hiSrc, alt, className = "", style, decoding = "async", onOpen }: Props) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [lens, setLens] = useState<Lens | null>(null);
  const [hiReady, setHiReady] = useState(false);
  const active = useRef(false);
  const timer = useRef<number | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => { setHiReady(false); }, [hiSrc]);

  const preloadHi = useCallback(() => {
    if (hiReady) return;
    const im = new Image();
    im.onload = () => setHiReady(true);
    im.src = hiSrc;
  }, [hiSrc, hiReady]);

  const place = useCallback((x: number, y: number) => {
    const el = imgRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const px = Math.min(Math.max(x - r.left, 0), r.width);
    const py = Math.min(Math.max(y - r.top, 0), r.height);
    setLens({ cx: x, cy: y, px, py, w: r.width, h: r.height });
  }, []);

  const clearTimer = () => { if (timer.current !== null) { window.clearTimeout(timer.current); timer.current = null; } };
  const stop = useCallback(() => { clearTimer(); start.current = null; if (active.current) { active.current = false; setLens(null); } }, []);

  const begin = useCallback((x: number, y: number) => {
    start.current = { x, y };
    preloadHi();
    clearTimer();
    timer.current = window.setTimeout(() => {
      active.current = true;
      suppressClick.current = true;
      try { navigator.vibrate?.(8); } catch { /* iOS : pas de vibration */ }
      place(x, y);
    }, HOLD_MS);
  }, [place, preloadHi]);

  const move = useCallback((x: number, y: number) => {
    if (active.current) { place(x, y); return true; }
    const s = start.current;
    if (s && Math.hypot(x - s.x, y - s.y) > MOVE_TOL) { clearTimer(); start.current = null; }
    return false;
  }, [place]);

  // Écouteurs tactiles natifs NON passifs : une fois la loupe active, on bloque le défilement de la page.
  useEffect(() => {
    const el = imgRef.current; if (!el) return;
    const ts = (e: TouchEvent) => { if (e.touches.length !== 1) { stop(); return; } const t = e.touches[0]; begin(t.clientX, t.clientY); };
    const tm = (e: TouchEvent) => { if (e.touches.length !== 1) { stop(); return; } const t = e.touches[0]; if (move(t.clientX, t.clientY) && e.cancelable) e.preventDefault(); };
    const te = (e: TouchEvent) => { if (active.current && e.cancelable) e.preventDefault(); stop(); };
    el.addEventListener("touchstart", ts, { passive: true });
    el.addEventListener("touchmove", tm, { passive: false });
    el.addEventListener("touchend", te, { passive: false });
    el.addEventListener("touchcancel", stop);
    return () => {
      el.removeEventListener("touchstart", ts);
      el.removeEventListener("touchmove", tm);
      el.removeEventListener("touchend", te);
      el.removeEventListener("touchcancel", stop);
    };
  }, [begin, move, stop]);

  useEffect(() => () => clearTimer(), []);

  // Souris (ordinateur) : maintenir le clic = loupe.
  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    begin(e.clientX, e.clientY);
    const mm = (ev: MouseEvent) => move(ev.clientX, ev.clientY);
    const mu = () => { window.removeEventListener("mousemove", mm); window.removeEventListener("mouseup", mu); stop(); };
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", mu);
  };

  const onClick = () => {
    if (suppressClick.current) { suppressClick.current = false; return; }
    onOpen?.();
  };

  const L = typeof window !== "undefined" && window.innerWidth >= 768 ? 190 : 150;
  const lensStyle: CSSProperties | undefined = lens ? (() => {
    const left = Math.min(Math.max(lens.cx - L / 2, 6), window.innerWidth - L - 6);
    const above = lens.cy - L - 34;
    const top = above >= 6 ? above : lens.cy + 34;
    return {
      position: "fixed", left, top, width: L, height: L, zIndex: 80, borderRadius: "50%", pointerEvents: "none",
      backgroundColor: "#FFFFFF",
      backgroundImage: `url("${hiReady ? hiSrc : src}")`,
      backgroundRepeat: "no-repeat",
      backgroundSize: `${lens.w * ZOOM}px ${lens.h * ZOOM}px`,
      backgroundPosition: `${L / 2 - lens.px * ZOOM}px ${L / 2 - lens.py * ZOOM}px`,
      boxShadow: "0 0 0 3px #FFFFFF, 0 0 0 5px #4A7C59, 0 14px 34px rgba(26,26,26,0.35)",
    };
  })() : undefined;

  return (
    <>
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        decoding={decoding}
        draggable={false}
        onClick={onClick}
        onMouseDown={onMouseDown}
        onContextMenu={(e) => e.preventDefault()}
        className={`${className} cursor-zoom-in select-none`}
        style={{ ...style, WebkitTouchCallout: "none", WebkitUserSelect: "none", userSelect: "none" } as CSSProperties}
      />
      {lens && createPortal(<div aria-hidden style={lensStyle} />, document.body)}
    </>
  );
};

export default ZoomableImage;
