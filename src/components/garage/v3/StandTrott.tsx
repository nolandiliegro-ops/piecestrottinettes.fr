/**
 * La trott posée sur l'estrade du wallpaper (ordinateur uniquement — 25/10/2026, demande de Nolan :
 * « les wallpapers ont toujours une estrade au milieu… la trottinette posée sur l'estrade »).
 * Les 18 wallpapers ont l'estrade centrée, son plateau vers 82 % de la hauteur de l'image (mesuré sur les 18 le 25/10).
 * Le fond est en `object-cover` centré et fixe : on recalcule où tombe l'estrade dans la fenêtre, et la trott
 * est elle aussi fixe (elle fait partie du décor ; le contenu défile par-dessus). z-index négatif = sous le contenu
 * du garage, au-dessus du wallpaper.
 */
import { useEffect, useState } from "react";

const IMG_RATIO = 1824 / 1017; // format majoritaire des wallpapers
const ESTRADE_Y = 0.83; // plateau de l'estrade, en part de la hauteur de l'image
const TROTT_H = 0.38; // hauteur de la trott, en part de la hauteur de l'image affichée

const useEstrade = () => {
  const calc = () => {
    if (typeof window === "undefined") return null;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scale = Math.max(vw / IMG_RATIO, vh); // hauteur affichée de l'image (object-cover)
    const dispH = scale;
    const offsetY = (vh - dispH) / 2;
    return { x: vw / 2, y: offsetY + ESTRADE_Y * dispH, h: TROTT_H * dispH, vw };
  };
  const [pos, setPos] = useState(calc);
  useEffect(() => {
    const on = () => setPos(calc());
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return pos;
};

const StandTrott = ({ src, alt }: { src: string | null | undefined; alt: string }) => {
  const pos = useEstrade();
  if (!src || !pos || pos.vw < 1024) return null;
  return (
    <div aria-hidden className="hidden lg:block fixed inset-0 pointer-events-none" style={{ zIndex: -1 }}>
      {/* ombre au sol */}
      <span className="absolute rounded-[50%]" style={{ left: pos.x - pos.h * 0.42, top: pos.y - pos.h * 0.035, width: pos.h * 0.84, height: pos.h * 0.07, background: "radial-gradient(closest-side, rgba(0,0,0,0.45), transparent)" }} />
      <img
        key={src}
        src={src}
        alt={alt}
        className="absolute object-contain animate-in fade-in duration-500"
        style={{ left: pos.x - pos.h * 0.6, top: pos.y - pos.h, width: pos.h * 1.2, height: pos.h, objectPosition: "center bottom", filter: "drop-shadow(0 18px 18px rgba(0,0,0,0.35))" }}
      />
    </div>
  );
};

export default StandTrott;
