/**
 * Carrousel des marques de la page /trottinettes — 5 propositions (16/10/2026), ?marques=1..5.
 * Sans paramètre : l'ancien carrousel (BrandBentoGrid) reste affiché tant que Nolan n'a pas choisi.
 * Commun : défilement au doigt, flèches ≥ 44 px, barre de progression, trottinettes inclinées (photos détourées).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { optimizedImage } from "@/lib/imageTransform";

export type MarquesLook = 1 | 2 | 3 | 4 | 5;
export const MARQUES_NAMES: Record<MarquesLook, string> = { 1: "Vitrine", 2: "Pastille", 3: "Paddock", 4: "Éventail", 5: "Plaque" };

const UNB = "'Unbounded', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";

export interface LookBrand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  accent_color?: string | null;
  tagline?: string | null;
  country?: string | null;
}

interface Props {
  look: MarquesLook;
  brands: LookBrand[];
  activeBrand: string | null;
  onBrandChange: (slug: string | null) => void;
  /** slug marque -> jusqu'à 3 photos de ses modèles les plus fournis en pièces */
  picks: Record<string, string[]>;
  counts: Record<string, number>;
  /** 3 photos de marques différentes pour la tuile « Toutes » */
  allPicks: string[];
  total: number;
}

const accentOf = (b: LookBrand) => b.accent_color || GREEN;

const Scooter = ({ src, className, style, w = 320 }: { src?: string; className?: string; style?: React.CSSProperties; w?: number }) =>
  src ? (
    <img src={optimizedImage(src, w)} alt="" loading="lazy" decoding="async" draggable={false}
      className={cn("object-contain pointer-events-none select-none transition-transform duration-500", className)}
      style={style} />
  ) : null;

const Shadow = ({ className }: { className?: string }) => (
  <span aria-hidden className={cn("absolute left-1/2 -translate-x-1/2 h-3 rounded-[50%]", className)}
    style={{ background: "radial-gradient(closest-side, rgba(26,26,26,0.28), transparent)" }} />
);

const BrandCarouselLooks = ({ look, brands, activeBrand, onBrandChange, picks, counts, allPicks, total }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max > 0 ? el.scrollLeft / max : 1);
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < max - 4);
  }, []);
  useEffect(() => { update(); }, [brands, update, look]);

  const go = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.8, 200), behavior: "smooth" });
  };

  const dark = look === 3;
  const items: (LookBrand | null)[] = [null, ...brands];

  const label = (b: LookBrand | null) => (b ? b.name : "Toutes");
  const count = (b: LookBrand | null) => (b ? counts[b.slug] ?? 0 : total);
  const imgs = (b: LookBrand | null) => (b ? picks[b.slug] ?? [] : allPicks);
  const isActive = (b: LookBrand | null) => (b ? activeBrand === b.slug : activeBrand === null);
  const click = (b: LookBrand | null) => onBrandChange(b ? (activeBrand === b.slug ? null : b.slug) : null);
  const modeles = (n: number) => `${n} modèle${n > 1 ? "s" : ""}`;

  const tile = (b: LookBrand | null, i: number) => {
    const active = isActive(b);
    const ph = imgs(b);
    const base = "group relative shrink-0 snap-start text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-mineral rounded-2xl";

    // 1 — VITRINE : carte claire, la trottinette inclinée déborde par le haut
    if (look === 1) {
      const ac = b ? accentOf(b) : CARBON;
      return (
        <button key={b?.id ?? "all"} type="button" onClick={() => click(b)} aria-pressed={active}
          className={cn(base, "w-40 md:w-48 pt-10")}>
          <div className={cn("relative h-52 md:h-60 rounded-2xl overflow-visible bg-white shadow-md transition-shadow group-hover:shadow-xl",
            active && "ring-2 ring-offset-2 ring-offset-greige")} style={active ? { ["--tw-ring-color" as string]: GREEN } : undefined}>
            <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{ background: `linear-gradient(160deg, ${ac}22 0%, #ffffff 60%)` }} />
            {b ? (
              <Scooter src={ph[0]} className="absolute left-1/2 -top-10 h-44 md:h-52 w-auto max-w-none -translate-x-1/2 -rotate-[12deg] group-hover:-rotate-2 group-hover:scale-105"
                style={{ filter: "drop-shadow(0 16px 14px rgba(26,26,26,0.22))" }} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center"><LayoutGrid className="w-12 h-12 text-carbon/70" /></div>
            )}
            <div className="absolute bottom-0 inset-x-0 p-3 rounded-b-2xl" style={active ? { background: GREEN } : { background: "rgba(255,255,255,0.94)" }}>
              <span className="block font-black uppercase text-sm tracking-wide truncate" style={{ fontFamily: UNB, color: active ? "#fff" : CARBON }}>{label(b)}</span>
              <span className={cn("block text-sm", active ? "text-white/85" : "text-gray-500")}>{modeles(count(b))}</span>
            </div>
            {b && <span className="absolute top-3 left-3 w-2.5 h-2.5 rounded-full" style={{ background: ac }} />}
          </div>
        </button>
      );
    }

    // 2 — PASTILLE : rond, la trottinette sort du cercle par le haut (format stories)
    if (look === 2) {
      return (
        <button key={b?.id ?? "all"} type="button" onClick={() => click(b)} aria-pressed={active}
          className={cn(base, "w-28 md:w-36 flex flex-col items-center pt-6")}>
          <div className="relative w-24 h-24 md:w-28 md:h-28">
            <div className={cn("absolute inset-0 rounded-full transition-transform group-hover:scale-105", active ? "" : "bg-white shadow-md")}
              style={active ? { background: GREEN, boxShadow: `0 0 0 3px #F5F0E8, 0 0 0 6px ${GREEN}` } : { boxShadow: "0 6px 18px rgba(26,26,26,0.12)" }} />
            {/* moitié basse découpée dans le cercle, moitié haute qui en sort */}
            {b ? (
              <Scooter src={ph[0]} w={260} className="absolute left-1/2 bottom-4 h-[7.5rem] md:h-[8.5rem] w-auto max-w-[118%] -translate-x-1/2 -rotate-[14deg] group-hover:-rotate-[4deg] group-hover:-translate-y-1"
                style={{ filter: "drop-shadow(0 8px 8px rgba(26,26,26,0.25))" }} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center"><LayoutGrid className={cn("w-10 h-10", active ? "text-white" : "text-carbon/70")} /></div>
            )}
          </div>
          <span className="mt-2 w-full text-center font-black uppercase text-sm truncate" style={{ fontFamily: UNB, color: active ? GREEN : CARBON }}>{label(b)}</span>
          <span className="text-sm text-gray-500">{count(b)}</span>
        </button>
      );
    }

    // 3 — PADDOCK : carte carbone, numéro de course, liseré biseauté à la couleur de la marque
    if (look === 3) {
      const ac = b ? accentOf(b) : "#FFFFFF";
      return (
        <button key={b?.id ?? "all"} type="button" onClick={() => click(b)} aria-pressed={active}
          className={cn(base, "w-44 md:w-52 h-60 md:h-64 overflow-hidden")}
          style={{ background: active ? "#22382A" : "#232323", boxShadow: active ? `0 0 0 2px ${GREEN}` : "0 8px 20px rgba(0,0,0,0.25)" }}>
          <span aria-hidden className="absolute top-0 left-0 h-2 w-2/3" style={{ background: ac, clipPath: "polygon(0 0, 100% 0, 92% 100%, 0 100%)" }} />
          <span aria-hidden className="absolute -right-2 top-3 font-black text-7xl leading-none select-none"
            style={{ fontFamily: UNB, color: "transparent", WebkitTextStroke: "1.5px rgba(255,255,255,0.14)" }}>{String(i).padStart(2, "0")}</span>
          {b ? (
            <>
              <Scooter src={ph[0]} className="absolute left-1/2 top-7 h-36 md:h-40 w-auto max-w-[92%] -translate-x-1/2 -rotate-[10deg] group-hover:rotate-0 group-hover:scale-105"
                style={{ filter: "drop-shadow(0 18px 16px rgba(0,0,0,0.55)) brightness(1.06)" }} />
              <Shadow className="top-[11.5rem] md:top-[12.5rem] w-3/4 opacity-60" />
            </>
          ) : (
            <div className="absolute inset-x-0 top-10 flex justify-center"><LayoutGrid className="w-14 h-14 text-white/70" /></div>
          )}
          <div className="absolute bottom-0 inset-x-0 px-3 py-3">
            <span className="block font-black uppercase text-base text-white truncate" style={{ fontFamily: UNB }}>{label(b)}</span>
            <span className="block text-sm text-white/60">{modeles(count(b))}</span>
          </div>
        </button>
      );
    }

    // 4 — ÉVENTAIL : 3 modèles de la marque en éventail
    if (look === 4) {
      const fan = ph.slice(0, 3);
      const rot = fan.length === 1 ? [-6] : fan.length === 2 ? [-10, 8] : [-16, -4, 12];
      return (
        <button key={b?.id ?? "all"} type="button" onClick={() => click(b)} aria-pressed={active}
          className={cn(base, "w-52 md:w-60 h-56 md:h-60 bg-white shadow-md hover:shadow-xl transition-shadow overflow-hidden",
            active && "ring-2 ring-mineral ring-offset-2 ring-offset-greige")}>
          <div className="absolute inset-x-0 top-3 bottom-16">
            {fan.map((src, k) => (
              <Scooter key={k} src={src} w={260}
                className="absolute bottom-0 left-1/2 h-[86%] w-auto max-w-[62%] object-contain origin-bottom"
                style={{ transform: `translateX(-50%) translateX(${(k - (fan.length - 1) / 2) * 52}px) rotate(${rot[k]}deg)`, zIndex: k === 1 || fan.length === 1 ? 3 : 1,
                  filter: "drop-shadow(0 10px 10px rgba(26,26,26,0.18))", opacity: fan.length === 3 && k !== 1 ? 0.92 : 1 }} />
            ))}
            {!fan.length && <div className="absolute inset-0 flex items-center justify-center"><LayoutGrid className="w-12 h-12 text-carbon/70" /></div>}
          </div>
          <div className={cn("absolute bottom-0 inset-x-0 px-4 py-3 flex items-end justify-between gap-2", active ? "bg-mineral" : "bg-white border-t border-gray-100")}>
            <span className={cn("font-black uppercase text-sm truncate", active ? "text-white" : "text-carbon")} style={{ fontFamily: UNB }}>{label(b)}</span>
            <span className={cn("text-sm shrink-0", active ? "text-white/85" : "text-gray-500")}>{count(b)}</span>
          </div>
        </button>
      );
    }

    // 5 — PLAQUE : grand nom en filigrane derrière, trottinette posée devant, soulignée à la couleur de la marque
    const ac = b ? accentOf(b) : GREEN;
    return (
      <button key={b?.id ?? "all"} type="button" onClick={() => click(b)} aria-pressed={active}
        className={cn(base, "w-56 md:w-64 h-48 md:h-52 overflow-hidden transition-shadow",
          active ? "shadow-xl" : "shadow-md hover:shadow-xl")}
        style={{ background: active ? "#EEF4F0" : "#FFFFFF", boxShadow: active ? `inset 0 0 0 2px ${GREEN}` : undefined }}>
        <span aria-hidden className="absolute left-3 top-2 font-black uppercase leading-[0.85] text-6xl md:text-7xl select-none whitespace-nowrap"
          style={{ fontFamily: UNB, color: "transparent", WebkitTextStroke: `1.5px ${ac}40` }}>{label(b)}</span>
        {b ? (
          <>
            <Scooter src={ph[0]} className="absolute right-0 bottom-9 h-36 md:h-40 w-auto max-w-[70%] -rotate-[10deg] origin-bottom-right group-hover:rotate-0 group-hover:scale-105"
              style={{ filter: "drop-shadow(0 14px 12px rgba(26,26,26,0.2))" }} />
          </>
        ) : (
          <div className="absolute right-6 bottom-12"><LayoutGrid className="w-14 h-14 text-carbon/70" /></div>
        )}
        <div className="absolute left-3 bottom-3 right-3">
          <span className="block font-black uppercase text-base text-carbon truncate" style={{ fontFamily: UNB }}>{label(b)}</span>
          <span className="flex items-center gap-2 text-sm text-gray-500">
            <span className="inline-block w-6 h-1 rounded" style={{ background: ac }} />{modeles(count(b))}
          </span>
        </div>
      </button>
    );
  };

  const arrowCls = dark ? "bg-white text-carbon" : "bg-carbon text-white";
  return (
    <div className={cn("relative", dark && "rounded-3xl p-3 md:p-4")} style={dark ? { background: "#141414" } : undefined}>
      <div ref={ref} onScroll={update}
        className={cn("flex overflow-x-auto snap-x snap-mandatory pb-3 px-1 [&::-webkit-scrollbar]:hidden", look === 2 ? "gap-2 md:gap-4" : "gap-3 md:gap-4")}
        style={{ scrollbarWidth: "none" }}>
        {items.map((b, i) => tile(b, i))}
      </div>
      <div className="flex items-center gap-3 mt-2">
        <div className={cn("relative h-1 flex-1 rounded-full overflow-hidden", dark ? "bg-white/15" : "bg-carbon/10")}>
          <span className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-200" style={{ width: `${Math.max(8, progress * 100)}%`, background: GREEN }} />
        </div>
        <button type="button" aria-label="Marques précédentes" onClick={() => go(-1)} disabled={!canPrev}
          className={cn("w-11 h-11 rounded-full flex items-center justify-center transition-opacity disabled:opacity-30", arrowCls)}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button type="button" aria-label="Marques suivantes" onClick={() => go(1)} disabled={!canNext}
          className={cn("w-11 h-11 rounded-full flex items-center justify-center transition-opacity disabled:opacity-30", arrowCls)}>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default BrandCarouselLooks;
