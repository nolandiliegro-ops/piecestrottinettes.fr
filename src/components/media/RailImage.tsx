/**
 * 28/10/2026 — image d'un rail horizontal (gamme, modèles voisins).
 * Mesuré sur /scooter/navee-gt5-pro : les deux rails chargeaient 47 photos dès l'ouverture (loading="eager" pour
 * l'un, et le lazy natif des navigateurs ne tient pas compte du défilement horizontal pour l'autre) ≈ 1,3 Mo.
 * Ici : l'image ne se charge que lorsqu'elle approche de la partie visible du rail (une largeur d'écran d'avance).
 */
import { useEffect, useRef, useState, type CSSProperties } from "react";

const scroller = (el: HTMLElement | null): HTMLElement | null => {
  let p = el?.parentElement ?? null;
  while (p && p !== document.body) {
    const o = getComputedStyle(p).overflowX;
    if (o === "auto" || o === "scroll") return p;
    p = p.parentElement;
  }
  return null;
};

interface Props { src: string; alt?: string; className?: string; style?: CSSProperties; draggable?: boolean }

const RailImage = ({ src, alt = "", className, style, draggable }: Props) => {
  const ref = useRef<HTMLImageElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setShow(true); return; }
    const root = scroller(el);
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setShow(true); io.disconnect(); } },
      { root, rootMargin: root ? "0px 100% 0px 100%" : "300px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <img ref={ref} src={show ? src : "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="}
      alt={alt} decoding="async" draggable={draggable} className={className}
      style={{ ...style, opacity: show ? 1 : 0, transition: "opacity 200ms, transform 300ms" }} />
  );
};

export default RailImage;
