/**
 * Squelette « Atelier » commun aux pages listes (maquette du 17/10/2026, ?vue=atelier).
 * Constat de Nolan : /catalogue, /trottinettes et /marques ont « trois natures différentes ».
 * Ici, UN seul gabarit — celui de /catalogue, le plus racing — et chaque page n'y change que son contenu :
 *   1. En-tête : titre Unbounded italique à gauche, compteur à droite, recherche à flèche noire.
 *   2. Rangée de vignettes photo bord à bord, coin coupé, nombre en haut à gauche, nom en blanc.
 *      Catégories sur /catalogue, marques (photos de marque) sur /trottinettes et /marques.
 *   3. Filtres en plaques, puis la grille.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, LayoutGrid, Search, X } from "lucide-react";
import { BRAND_PHOTOS } from "@/config/brandIdentity";
import { optimizedImage, responsiveImage } from "@/lib/imageTransform";

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const LINE = "#E2DCD0";
const CHAMFER = "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)";

/** Photo de marque : photo générée (prime, retour Nolan 17/10), sinon photo posée en admin, sinon null. */
export const brandPhoto = (b: { slug: string; hero_image_url?: string | null }) => BRAND_PHOTOS[b.slug] || b.hero_image_url || null;

export const AtelierHead = ({ title, n, unit, query, onQuery, placeholder }: {
  title: string; n: number | null; unit: string; query: string; onQuery: (v: string) => void; placeholder: string;
}) => {
  const [v, setV] = useState(query);
  useEffect(() => setV(query), [query]);
  useEffect(() => { if (v === query) return; const t = setTimeout(() => onQuery(v), 250); return () => clearTimeout(t); }, [v]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div>
      {/* 20/10 : « TROTTINETTES » + « 440 MODÈLES » débordaient de 38 px sur téléphone (scroll horizontal) → retour à la ligne permis */}
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <h1 className="min-w-0 text-[28px] sm:text-3xl md:text-5xl uppercase leading-none" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.03em", color: CARBON }}>{title}</h1>
        <span className="flex items-baseline gap-1.5 shrink-0" style={{ fontFamily: FONT }}>
          <span className="text-2xl md:text-3xl" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>{n ?? "…"}</span>
          <span className="text-sm font-bold uppercase tracking-wider text-gray-500">{unit}</span>
        </span>
      </div>
      <div className="mt-4 flex items-stretch h-14 max-w-2xl" style={{ filter: "drop-shadow(0 6px 14px rgba(26,26,26,0.10))" }}>
        <label className="flex-1 flex items-center gap-3 pl-4 pr-3 bg-white" style={{ boxShadow: `inset 0 0 0 1px ${LINE}` }}>
          <Search className="w-5 h-5 shrink-0 text-gray-400" />
          <input type="search" value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} aria-label={placeholder}
            className="w-full h-full bg-transparent outline-none text-base text-carbon placeholder:text-gray-400" style={{ fontFamily: FONT }} />
          {v && <button type="button" onClick={() => { setV(""); onQuery(""); }} aria-label="Effacer" className="w-9 h-9 flex items-center justify-center"><X className="w-4 h-4 text-gray-500" /></button>}
        </label>
        <button type="button" onClick={() => onQuery(v)} aria-label="Lancer la recherche" className="flex items-center justify-center w-16 -ml-2" style={{ background: CARBON, clipPath: "polygon(12px 0, 100% 0, 100% 100%, 0 100%)" }}>
          <ArrowRight className="w-5 h-5 text-white" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

/** Vignette photo bord à bord — même dessin que les catégories de /catalogue. */
export const PhotoTile = ({ img, name, n, logo, on = false, onClick, to, sub, className = "h-[128px] md:h-[140px] w-[150px] md:w-[170px]" }: {
  img?: string | null; name: string; n?: number; logo?: string | null; on?: boolean; onClick?: () => void; to?: string; sub?: string; className?: string;
}) => {
  const inner = (
    <>
      {img ? <img {...responsiveImage(img, [400, 700])} sizes="(min-width: 768px) 340px, 50vw" alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.06]" />
        : <LayoutGrid className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-white" />}
      {img && <span aria-hidden className="absolute inset-x-0 bottom-0 h-[66%]" style={{ background: "linear-gradient(to top, rgba(26,26,26,0.9), rgba(26,26,26,0))" }} />}
      {typeof n === "number" && (
        <span className="absolute left-2 top-2 px-1.5 py-0.5 text-sm leading-none" style={{ fontFamily: UNB, fontStyle: "italic", fontWeight: 900, background: on ? GREEN : "rgba(255,255,255,0.92)", color: on ? "#fff" : CARBON, clipPath: "polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 0 100%)" }}>{n}</span>
      )}
      {logo && (
        <span className="absolute right-2 top-2 w-10 h-10 p-1.5 flex items-center justify-center bg-white" style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)" }}>
          <img src={optimizedImage(logo, 96)} alt="" loading="lazy" decoding="async" className="max-w-full max-h-full object-contain" />
        </span>
      )}
      <span className="absolute left-2.5 right-2 bottom-2">
        <span className="block text-sm md:text-base leading-tight line-clamp-1 uppercase" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: "#fff" }}>{name}</span>
        {sub && <span className="block text-sm text-white/75 truncate" style={{ fontFamily: FONT }}>{sub}</span>}
      </span>
      {on && <span aria-hidden className="absolute inset-x-0 bottom-0 h-1" style={{ background: GREEN }} />}
      {on && <span aria-hidden className="absolute inset-0" style={{ boxShadow: `inset 0 0 0 3px ${CARBON}` }} />}
    </>
  );
  const cls = `group relative shrink-0 overflow-hidden text-left transition-transform hover:-translate-y-0.5 ${className}`;
  const style = { clipPath: CHAMFER, background: img ? "#2A2A2A" : CARBON };
  return to ? <Link to={to} className={cls} style={style}>{inner}</Link>
    : <button type="button" onClick={onClick} aria-pressed={on} className={cls} style={style}>{inner}</button>;
};
