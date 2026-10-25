/**
 * La trott posée sur l'estrade du wallpaper (25/10/2026, demande de Nolan : « les wallpapers ont toujours une estrade au
 * milieu… la trottinette posée sur l'estrade »). Les 18 wallpapers ont l'estrade centrée, son plateau vers 83 % de la
 * hauteur de l'image (mesuré sur les 18 le 25/10). Le fond est en `object-cover` centré et fixe : on recalcule où tombe
 * l'estrade dans la fenêtre, et la trott est elle aussi fixe (elle fait partie du décor ; le contenu défile par-dessus).
 *
 * 25/10 soir (Nolan : « il faut vraiment que la trottinette soit sur l'estrade… toujours au même endroit… avec un effet
 * de flottaison, qu'elle flotte, un bel effet ») : téléphone compris, la trott flotte au-dessus du plateau (elle monte et
 * descend, son ombre se resserre quand elle monte, un halo de lumière derrière elle). Elle s'efface quand le contenu
 * remonte sur elle : sinon on la voyait par morceaux entre les blocs. Repère : le bloc `[data-stand-anchor]` visible
 * (l'espace libre au-dessus de l'estrade) ; sans repère, elle reste affichée.
 * z-index négatif = sous le contenu de la page, au-dessus du wallpaper.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { optimizedImage } from "@/lib/imageTransform";

const IMG_RATIO = 1824 / 1017; // format majoritaire des wallpapers
const ESTRADE_Y = 0.845; // milieu du plateau de l'estrade (bord arrière ≈ 0,81, bord avant ≈ 0,87), en part de la hauteur de l'image
const TROTT_H = 0.38; // hauteur de la trott, en part de la hauteur de l'image affichée (ordinateur)
const TROTT_H_TEL = 0.34; // téléphone (image affichée = hauteur de l'écran, la trott serait sinon plus large que lui)
const LIFT = 0.035; // la trott flotte à 3,5 % de sa hauteur au-dessus du plateau

type Pos = { x: number; y: number; h: number; vw: number; vh: number };

const calc = (): Pos | null => {
  if (typeof window === "undefined") return null;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const dispH = Math.max(vw / IMG_RATIO, vh); // hauteur affichée de l'image (object-cover)
  const offsetY = (vh - dispH) / 2;
  const h = Math.min((vw < 1024 ? TROTT_H_TEL : TROTT_H) * dispH, vw * 0.78 / 1.2);
  return { x: vw / 2, y: offsetY + ESTRADE_Y * dispH, h, vw, vh };
};

export const useEstrade = () => {
  const [pos, setPos] = useState(calc);
  useEffect(() => {
    // Téléphone : la barre d'adresse qui se replie change innerHeight → on ne recale que sur un vrai changement de largeur
    // ou une rotation, sinon la trott sauterait à chaque défilement.
    let w = window.innerWidth;
    const on = () => {
      if (window.innerWidth < 1024 && window.innerWidth === w) return;
      w = window.innerWidth;
      setPos(calc());
    };
    window.addEventListener("resize", on);
    window.addEventListener("orientationchange", on);
    return () => {
      window.removeEventListener("resize", on);
      window.removeEventListener("orientationchange", on);
    };
  }, []);
  return pos;
};

const FLOAT_CSS = `
@keyframes pt-stand-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4.5%)}}
@keyframes pt-stand-shadow{0%,100%{transform:scaleX(1);opacity:.55}50%{transform:scaleX(.78);opacity:.32}}
@keyframes pt-stand-halo{0%,100%{opacity:.55}50%{opacity:.8}}
@media (prefers-reduced-motion: reduce){.pt-stand-anim{animation:none!important}}
`;

const StandTrott = ({ src, alt }: { src: string | null | undefined; alt: string }) => {
  const pos = useEstrade();
  const [fade, setFade] = useState(1);
  const raf = useRef(0);

  useEffect(() => {
    if (!pos) return;
    const update = () => {
      raf.current = 0;
      const anchor = Array.from(document.querySelectorAll<HTMLElement>("[data-stand-anchor]")).find((el) => el.offsetParent !== null);
      if (!anchor) return setFade(1);
      const bottom = anchor.getBoundingClientRect().bottom; // = haut du contenu qui suit l'espace libre
      const top = pos.y - pos.h * (1 + LIFT); // haut de la trott
      const v = (bottom - (top + pos.h * 0.35)) / (pos.h * 0.45);
      setFade(Math.max(0, Math.min(1, v)));
    };
    const on = () => { if (!raf.current) raf.current = requestAnimationFrame(update); };
    update();
    // L'espace libre se mesure après le premier rendu : un 2e calage un peu plus tard.
    const t = window.setTimeout(update, 400);
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      window.clearTimeout(t);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [pos]);

  if (!src || !pos) return null;
  const { x, y, h } = pos;
  const w = h * 1.2;
  return (
    <div aria-hidden className="fixed inset-0 pointer-events-none transition-opacity duration-200" style={{ zIndex: -1, opacity: fade }}>
      <style>{FLOAT_CSS}</style>
      {/* halo de lumière posé sur l'estrade, derrière la trott */}
      <span className="pt-stand-anim absolute rounded-[50%]" style={{ left: x - h * 0.75, top: y - h * 0.95, width: h * 1.5, height: h * 1.05, background: "radial-gradient(closest-side, rgba(255,244,222,0.42), rgba(255,244,222,0.12) 55%, rgba(255,244,222,0) 100%)", animation: "pt-stand-halo 3.6s ease-in-out infinite" }} />
      {/* ombre au sol : se resserre quand la trott monte */}
      <span className="pt-stand-anim absolute rounded-[50%]" style={{ left: x - h * 0.4, top: y - h * 0.04, width: h * 0.8, height: h * 0.08, background: "radial-gradient(closest-side, rgba(0,0,0,0.6), transparent)", animation: "pt-stand-shadow 3.6s ease-in-out infinite" }} />
      <div className="pt-stand-anim absolute" style={{ left: x - w / 2, top: y - h * (1 + LIFT), width: w, height: h, animation: "pt-stand-float 3.6s ease-in-out infinite" }}>
        {/* 26/10 (Nolan : « quand on arrive sur le garage… il n'y a pas la trott ») : plus d'apparition en fondu. Si le
            navigateur ne fait pas tourner l'animation (onglet en arrière-plan, économie d'énergie), elle restait figée à
            opacité 0 : trott invisible (mesuré : animation « enter » bloquée à 0 ms). Et l'image servie en 900 px (36 Ko)
            au lieu du PNG d'origine (427 Ko) : en 4G elle mettait longtemps à arriver. */}
        <img
          key={src}
          src={optimizedImage(src, 900)}
          alt={alt}
          decoding="async"
          className="w-full h-full object-contain"
          style={{ objectPosition: "center bottom", filter: "drop-shadow(0 22px 20px rgba(0,0,0,0.38))" }}
        />
      </div>
    </div>
  );
};

/** L'espace libre au-dessus de l'estrade : il descend jusqu'au plateau, le contenu qui suit commence juste dessous.
 *  Ce qu'on y met (nom, flèches) s'affiche en haut. Sert de repère à StandTrott pour s'effacer quand on défile. */
export const StandSpace = ({ children, className = "", min = 260 }: { children?: ReactNode; className?: string; min?: number }) => {
  const pos = useEstrade();
  const ref = useRef<HTMLDivElement>(null);
  const [hgt, setHgt] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !pos) return;
    const measure = () => {
      const topDoc = el.getBoundingClientRect().top + window.scrollY;
      setHgt(Math.max(min, Math.round(pos.y + pos.h * 0.06 - topDoc)));
    };
    measure();
    const t = window.setTimeout(measure, 300);
    return () => window.clearTimeout(t);
  }, [pos, min]);
  return (
    <div ref={ref} data-stand-anchor className={`relative ${className}`} style={{ height: hgt ?? undefined, minHeight: hgt ? undefined : min }}>
      {children}
    </div>
  );
};

export default StandTrott;
