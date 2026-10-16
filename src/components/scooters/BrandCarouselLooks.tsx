/**
 * Carrousel des marques de la page /trottinettes — 2e tour (16/10/2026, ~23h30), ?marques=1..5.
 * Choix de Nolan au 1er tour : base « Vitrine » (trottinette inclinée qui sort de la carte),
 * tuile « Toutes » = 3 belles trottinettes de 3 marques en éventail + un vrai bouton. Demande : plus moderne.
 * Sans paramètre : l'ancien carrousel (BrandBentoGrid) reste affiché tant que Nolan n'a pas choisi.
 * Commun : défilement au doigt, flèches ≥ 44 px, barre de progression.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { optimizedImage } from "@/lib/imageTransform";

export type MarquesLook = 1 | 2 | 3 | 4 | 5;
export const MARQUES_NAMES: Record<MarquesLook, string> = { 1: "Vitrine Air", 2: "Projecteur", 3: "Socle", 4: "Duo", 5: "Studio" };

const UNB = "'Unbounded', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";

export interface LookBrand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  accent_color?: string | null;
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

// Teinte douce par marque : la couleur officielle si elle existe, sinon une teinte stable tirée du nom.
const SOFT = ["#E8F0EA", "#EAEFF6", "#F4ECE4", "#EFEAF5", "#F5F0E1", "#E6F2F1", "#F6E9EC"];
const DEEP = ["#4A7C59", "#3B5B8C", "#A0612B", "#6B4E99", "#8A7322", "#2F7D78", "#9C3D55"];
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const tone = (b: LookBrand) => {
  const i = hash(b.slug) % SOFT.length;
  return { deep: b.accent_color || DEEP[i], soft: b.accent_color ? `${b.accent_color}1F` : SOFT[i] };
};

const Img = ({ src, className, style, w = 360 }: { src?: string; className?: string; style?: React.CSSProperties; w?: number }) =>
  src ? (
    <img src={optimizedImage(src, w)} alt="" loading="lazy" decoding="async" draggable={false}
      className={cn("object-contain pointer-events-none select-none transition-transform duration-500 ease-out", className)} style={style} />
  ) : null;

const DROP = "drop-shadow(0 18px 16px rgba(26,26,26,0.22))";

/** 3 trottinettes en éventail (tuile « Toutes ») */
const Fan = ({ srcs, h = "h-40", spread = 40 }: { srcs: string[]; h?: string; spread?: number }) => {
  const rot = [-14, -2, 12];
  return (
    <>
      {srcs.slice(0, 3).map((src, k) => (
        <Img key={k} src={src} w={300}
          className={cn("absolute bottom-0 left-1/2 w-auto max-w-[70%] origin-bottom", h, k === 1 ? "group-hover:-translate-y-2" : "")}
          style={{ transform: `translateX(-50%) translateX(${(k - 1) * spread}px) rotate(${rot[k]}deg)`, zIndex: k === 1 ? 3 : 1, filter: DROP }} />
      ))}
    </>
  );
};

/**
 * « Toutes » de Vitrine Air (16/10, demande de Nolan) : une seule trottinette à la fois, qui défile marque après marque
 * (glisse depuis la droite, s'incline, repart à gauche) avec le logo de la marque en cours. Arrêt si l'utilisateur
 * a demandé moins d'animations (prefers-reduced-motion) ; pause au survol.
 */
const SPIN_CSS = `
@keyframes ptSpinIn { from { opacity: 0; transform: translateX(-50%) translateX(70px) rotate(4deg) scale(.9); } to { opacity: 1; transform: translateX(-50%) rotate(-12deg) scale(1); } }
@keyframes ptSpinOut { from { opacity: 1; transform: translateX(-50%) rotate(-12deg) scale(1); } to { opacity: 0; transform: translateX(-50%) translateX(-80px) rotate(-22deg) scale(.88); } }
@keyframes ptFade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
`;
const AllSpinner = ({ items }: { items: { src: string; logo?: string | null; name: string }[] }) => {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (items.length < 2 || paused) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setI((v) => (v + 1) % items.length), 1700);
    return () => window.clearInterval(t);
  }, [items.length, paused]);
  if (!items.length) return null;
  const cur = items[i % items.length];
  const prev = items[(i - 1 + items.length) % items.length];
  const next = items[(i + 1) % items.length];
  return (
    <div className="absolute inset-0" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <style>{SPIN_CSS}</style>
      {i > 0 && (
        <img key={`o${i}`} src={optimizedImage(prev.src, 360)} alt="" aria-hidden draggable={false}
          className="absolute left-1/2 -top-12 h-48 md:h-52 w-auto max-w-[86%] object-contain pointer-events-none"
          style={{ animation: "ptSpinOut .6s ease-in forwards", filter: DROP }} />
      )}
      <img key={`i${i}`} src={optimizedImage(cur.src, 360)} alt="" aria-hidden draggable={false}
        className="absolute left-1/2 -top-12 h-48 md:h-52 w-auto max-w-[86%] object-contain pointer-events-none"
        style={{ animation: i > 0 ? "ptSpinIn .7s cubic-bezier(.22,1,.36,1) forwards" : undefined, transform: "translateX(-50%) rotate(-12deg)", filter: DROP }} />
      {/* préchargement de la suivante */}
      <img src={optimizedImage(next.src, 360)} alt="" aria-hidden className="hidden" />
      <div key={`l${i}`} className="absolute right-4 top-4 h-7 px-2.5 rounded-full bg-white/90 shadow-sm flex items-center gap-1.5" style={{ animation: "ptFade .5s ease-out" }}>
        {cur.logo ? <img src={cur.logo} alt={cur.name} className="h-4 w-auto max-w-[84px] object-contain" /> : <span className="text-sm font-bold uppercase text-carbon">{cur.name}</span>}
      </div>
    </div>
  );
};

/** Bouton de la tuile « Toutes » */
const AllButton = ({ total, active, light = false }: { total: number; active: boolean; light?: boolean }) => (
  <span className={cn("inline-flex items-center gap-2 h-11 pl-4 pr-1.5 rounded-full text-sm font-bold uppercase tracking-wide transition-colors")}
    style={active ? { background: GREEN, color: "#fff" } : light ? { background: "#fff", color: CARBON } : { background: CARBON, color: "#fff" }}>
    Toutes
    <span className="tabular-nums opacity-70 normal-case font-semibold">{total}</span>
    <span className="w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-0.5"
      style={{ background: active ? "rgba(255,255,255,0.2)" : light ? "#F5F0E8" : "rgba(255,255,255,0.14)" }}>
      <ArrowRight className="w-4 h-4" />
    </span>
  </span>
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

  const base = "group relative shrink-0 snap-start text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-mineral rounded-3xl";
  const modeles = (n: number) => `${n} modèle${n > 1 ? "s" : ""}`;
  const allActive = activeBrand === null;

  // ─── Tuile « Toutes » : même gabarit que les marques, éventail de 3 trottinettes + bouton ───
  const allTile = () => {
    if (look === 2) {
      return (
        <button key="all" type="button" onClick={() => onBrandChange(null)} aria-pressed={allActive} className={cn(base, "w-64 md:w-72 pt-8")}>
          <div className="relative h-60 rounded-3xl overflow-hidden" style={{ background: `radial-gradient(80% 70% at 50% 45%, #FFFFFF 0%, #EDE7DC 100%)` }}>
            <div className="absolute inset-x-6 top-6 bottom-16"><Fan srcs={allPicks} h="h-[86%]" spread={46} /></div>
            <div className="absolute left-4 right-4 bottom-4 flex justify-start"><AllButton total={total} active={allActive} /></div>
          </div>
        </button>
      );
    }
    if (look === 5) {
      return (
        <button key="all" type="button" onClick={() => onBrandChange(null)} aria-pressed={allActive} className={cn(base, "w-64 md:w-72 pt-10")}>
          <div className="relative h-56">
            <div className="absolute inset-x-0 bottom-0 h-[70%] rounded-3xl" style={{ background: allActive ? GREEN : CARBON }} />
            <div className="absolute inset-x-6 top-0 bottom-16"><Fan srcs={allPicks} h="h-[92%]" spread={46} /></div>
            <div className="absolute left-4 bottom-4"><AllButton total={total} active={allActive} light /></div>
          </div>
        </button>
      );
    }
    if (look === 1) {
      const items = brands.map((b) => ({ src: picks[b.slug]?.[0], logo: b.logo_url, name: b.name })).filter((x) => x.src) as { src: string; logo?: string | null; name: string }[];
      return (
        <button key="all" type="button" onClick={() => onBrandChange(null)} aria-pressed={allActive} className={cn(base, "w-60 md:w-64 pt-10")}>
          <div className={cn("relative h-56 md:h-60 rounded-3xl transition-shadow", allActive ? "shadow-xl" : "shadow-md group-hover:shadow-xl")}
            style={{ background: "linear-gradient(160deg, #1F2A22 0%, #2F4A37 55%, #4A7C59 100%)", ...(allActive ? { boxShadow: `0 0 0 2px ${GREEN}, 0 18px 40px -20px rgba(26,26,26,0.45)` } : {}) }}>
            <div className="absolute inset-0 rounded-3xl overflow-hidden">
              <span className="absolute -left-10 -bottom-16 w-56 h-56 rounded-full blur-3xl opacity-40" style={{ background: "#9BD3A8" }} />
            </div>
            <AllSpinner items={items} />
            <div className="absolute left-4 bottom-4"><AllButton total={total} active={false} light /></div>
          </div>
        </button>
      );
    }
    return (
      <button key="all" type="button" onClick={() => onBrandChange(null)} aria-pressed={allActive}
        className={cn(base, "w-64 md:w-72 pt-10")}>
        <div className={cn("relative h-56 md:h-60 rounded-3xl bg-white transition-shadow", allActive ? "shadow-xl" : "shadow-md group-hover:shadow-xl")}
          style={allActive ? { boxShadow: `0 0 0 2px ${GREEN}, 0 18px 40px -20px rgba(26,26,26,0.35)` } : undefined}>
          <div className="absolute inset-0 rounded-3xl" style={{ background: "linear-gradient(160deg, #F1ECE2 0%, #FFFFFF 65%)" }} />
          <div className="absolute inset-x-6 -top-8 bottom-16"><Fan srcs={allPicks} h="h-[94%]" spread={46} /></div>
          <div className="absolute left-4 bottom-4"><AllButton total={total} active={allActive} /></div>
        </div>
      </button>
    );
  };

  const tile = (b: LookBrand) => {
    const active = activeBrand === b.slug;
    const ph = picks[b.slug] ?? [];
    const n = counts[b.slug] ?? 0;
    const t = tone(b);
    const click = () => onBrandChange(active ? null : b.slug);
    const ring = active ? { boxShadow: `0 0 0 2px ${GREEN}, 0 18px 40px -20px rgba(26,26,26,0.35)` } : undefined;

    // 1 — VITRINE AIR : carte blanche, halo à la teinte de la marque, trottinette inclinée qui sort par le haut, nom + pastille de compte
    if (look === 1) {
      return (
        <button key={b.id} type="button" onClick={click} aria-pressed={active} className={cn(base, "w-44 md:w-52 pt-10")}>
          <div className={cn("relative h-56 md:h-60 rounded-3xl bg-white transition-shadow", !active && "shadow-md group-hover:shadow-xl")} style={ring}>
            <div className="absolute inset-0 rounded-3xl overflow-hidden">
              <span className="absolute -right-10 -top-10 w-44 h-44 rounded-full blur-2xl opacity-90" style={{ background: t.soft }} />
            </div>
            <Img src={ph[0]} className="absolute left-1/2 -top-10 h-44 md:h-48 w-auto max-w-[96%] -translate-x-1/2 -rotate-[12deg] group-hover:-rotate-3 group-hover:-translate-y-1" style={{ filter: DROP }} />
            <div className="absolute left-4 right-4 bottom-4 flex items-end justify-between gap-2">
              <span className="min-w-0 flex items-center gap-2">
                {b.logo_url && <img src={b.logo_url} alt="" loading="lazy" className="h-5 w-auto max-w-[52px] shrink-0 object-contain" />}
                <span className="font-black uppercase text-[15px] leading-tight text-carbon truncate" style={{ fontFamily: UNB }}>{b.name}</span>
              </span>
              <span className="shrink-0 h-7 min-w-[28px] px-2 rounded-full text-sm font-bold flex items-center justify-center" style={active ? { background: GREEN, color: "#fff" } : { background: t.soft, color: t.deep }}>{n}</span>
            </div>
          </div>
        </button>
      );
    }

    // 2 — PROJECTEUR : fond en dégradé radial (studio photo), cercle de lumière à la teinte de la marque derrière la trottinette
    if (look === 2) {
      return (
        <button key={b.id} type="button" onClick={click} aria-pressed={active} className={cn(base, "w-44 md:w-52 pt-8")}>
          <div className={cn("relative h-60 rounded-3xl overflow-hidden transition-shadow", !active && "group-hover:shadow-xl")}
            style={{ background: `radial-gradient(80% 70% at 50% 45%, #FFFFFF 0%, #EDE7DC 100%)`, ...(ring ?? {}) }}>
            <span className="absolute left-1/2 top-8 -translate-x-1/2 w-32 h-32 rounded-full transition-transform duration-500 group-hover:scale-110" style={{ background: `radial-gradient(closest-side, ${t.deep}40, ${t.deep}00)` }} />
            <Img src={ph[0]} className="absolute left-1/2 top-4 h-40 w-auto max-w-[92%] -translate-x-1/2 -rotate-[10deg] group-hover:rotate-0" style={{ filter: DROP }} />
            <div className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-8" style={{ background: "linear-gradient(transparent, rgba(255,255,255,0.92) 45%)" }}>
              <span className="block font-black uppercase text-[15px] text-carbon truncate" style={{ fontFamily: UNB }}>{b.name}</span>
              <span className="block text-sm" style={{ color: active ? GREEN : "#6B7280" }}>{modeles(n)}</span>
            </div>
          </div>
        </button>
      );
    }

    // 3 — SOCLE : trottinette posée sur un socle elliptique (plateau tournant), elle pivote au survol
    if (look === 3) {
      return (
        <button key={b.id} type="button" onClick={click} aria-pressed={active} className={cn(base, "w-44 md:w-52 pt-10")}>
          <div className={cn("relative h-56 md:h-60 rounded-3xl bg-white transition-shadow", !active && "shadow-md group-hover:shadow-xl")} style={ring}>
            <span aria-hidden className="absolute left-1/2 bottom-[4.4rem] -translate-x-1/2 w-[78%] h-7 rounded-[50%]"
              style={{ background: `linear-gradient(180deg, ${t.soft} 0%, ${t.deep}33 100%)`, boxShadow: `0 6px 0 ${t.deep}26` }} />
            <Img src={ph[0]} className="absolute left-1/2 bottom-[5.5rem] h-40 md:h-44 w-auto max-w-[88%] -translate-x-1/2 -rotate-[9deg] origin-bottom group-hover:rotate-[6deg]" style={{ filter: "drop-shadow(0 10px 8px rgba(26,26,26,0.2))" }} />
            <div className="absolute left-0 right-0 bottom-4 text-center px-3">
              <span className="block font-black uppercase text-[15px] text-carbon truncate" style={{ fontFamily: UNB }}>{b.name}</span>
              <span className="block text-sm" style={{ color: active ? GREEN : "#6B7280" }}>{modeles(n)}</span>
            </div>
          </div>
        </button>
      );
    }

    // 4 — DUO : le modèle phare devant, un 2e modèle de la marque en retrait derrière (éventail léger, sans fouillis)
    if (look === 4) {
      return (
        <button key={b.id} type="button" onClick={click} aria-pressed={active} className={cn(base, "w-48 md:w-56 pt-10")}>
          <div className={cn("relative h-56 md:h-60 rounded-3xl bg-white transition-shadow", !active && "shadow-md group-hover:shadow-xl")} style={ring}>
            <div className="absolute inset-0 rounded-3xl" style={{ background: `linear-gradient(160deg, ${t.soft} 0%, #FFFFFF 60%)` }} />
            {ph[1] && (
              <Img src={ph[1]} w={260} className="absolute right-2 -top-4 h-36 md:h-40 w-auto max-w-[62%] rotate-[10deg] opacity-60 group-hover:opacity-90 group-hover:rotate-[14deg]" style={{ filter: "grayscale(0.35) drop-shadow(0 10px 10px rgba(26,26,26,0.15))" }} />
            )}
            <Img src={ph[0]} className="absolute left-3 -top-10 h-44 md:h-48 w-auto max-w-[78%] -rotate-[12deg] group-hover:-rotate-6 group-hover:-translate-y-1" style={{ filter: DROP }} />
            <div className="absolute left-4 right-4 bottom-4">
              <span className="block font-black uppercase text-[15px] text-carbon truncate" style={{ fontFamily: UNB }}>{b.name}</span>
              <span className="flex items-center gap-2 text-sm" style={{ color: active ? GREEN : "#6B7280" }}>
                <span className="w-5 h-1 rounded-full" style={{ background: t.deep }} />{modeles(n)}
              </span>
            </div>
          </div>
        </button>
      );
    }

    // 5 — STUDIO : pas de carte au-dessus, la trottinette flotte au-dessus d'un bloc coloré (style boutique sport)
    return (
      <button key={b.id} type="button" onClick={click} aria-pressed={active} className={cn(base, "w-44 md:w-52 pt-10")}>
        <div className="relative h-56">
          <div className="absolute inset-x-0 bottom-0 h-[70%] rounded-3xl transition-colors" style={{ background: active ? GREEN : t.soft }} />
          <Img src={ph[0]} className="absolute left-1/2 -top-2 h-44 w-auto max-w-[96%] -translate-x-1/2 -rotate-[12deg] group-hover:-rotate-3 group-hover:-translate-y-2" style={{ filter: DROP }} />
          <div className="absolute left-4 right-4 bottom-4 flex items-end justify-between gap-2">
            <span className="font-black uppercase text-[15px] truncate" style={{ fontFamily: UNB, color: active ? "#fff" : CARBON }}>{b.name}</span>
            <span className="shrink-0 text-sm font-bold" style={{ color: active ? "rgba(255,255,255,0.8)" : t.deep }}>{n}</span>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="relative">
      <div ref={ref} onScroll={update}
        className="flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory pb-4 px-1 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}>
        {allTile()}
        {brands.map((b) => tile(b))}
      </div>
      <div className="flex items-center gap-3 mt-1">
        <div className="relative h-1 flex-1 rounded-full overflow-hidden bg-carbon/10">
          <span className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-200" style={{ width: `${Math.max(8, progress * 100)}%`, background: GREEN }} />
        </div>
        <button type="button" aria-label="Marques précédentes" onClick={() => go(-1)} disabled={!canPrev}
          className="w-11 h-11 rounded-full flex items-center justify-center bg-carbon text-white transition-opacity disabled:opacity-30">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button type="button" aria-label="Marques suivantes" onClick={() => go(1)} disabled={!canNext}
          className="w-11 h-11 rounded-full flex items-center justify-center bg-carbon text-white transition-opacity disabled:opacity-30">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default BrandCarouselLooks;
