/**
 * Carrousel « Gamme <marque> » de la fiche trottinette — 5 propositions (16/10/2026), ?gal=1..5.
 * Commun aux 5 : flèches de navigation (≥ 44 px), barre de progression, modèle affiché centré à l'ouverture,
 * photo en « mix-blend-multiply » sur fond clair (un fond blanc mal détouré disparaît au lieu de faire un carré).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Bike } from "lucide-react";
import { optimizedImage } from "@/lib/imageTransform";
import RailImage from "@/components/media/RailImage";
import type { ShowroomCarouselScooter } from "@/hooks/useShowroomData";

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";

export type GalStyle = 1 | 2 | 3 | 4 | 5;
export const GAL_NAMES: Record<GalStyle, string> = { 1: "Vitrine", 2: "Podium", 3: "Carbone", 4: "Plaque", 5: "Paddock" };

const shortName = (m: ShowroomCarouselScooter) =>
  m.name.replace(new RegExp(`^${(m.brand_name ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`, "i"), "");
const specLine = (m: ShowroomCarouselScooter) =>
  [m.power_watts ? `${m.power_watts} W` : null, m.max_speed_kmh ? `${m.max_speed_kmh} km/h` : null, m.range_km ? `${m.range_km} km` : null].filter(Boolean).join(" · ");

const Photo = ({ m, h, blend = true, big = false }: { m: ShowroomCarouselScooter; h: string; blend?: boolean; big?: boolean }) => (
  <div className={`relative w-full flex items-end justify-center ${h}`}>
    {m.image_url ? (
      <RailImage src={optimizedImage(m.image_url, big ? 480 : 360)} alt={m.name} draggable={false}
        className="relative z-[1] max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.04]"
        style={blend ? { mixBlendMode: "multiply" } : { filter: "drop-shadow(0 14px 14px rgba(26,26,26,0.18))" }} />
    ) : (
      <Bike className="w-12 h-12 text-gray-300 mb-6" strokeWidth={1.2} />
    )}
    {/* ombre au sol */}
    <span aria-hidden className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-3 rounded-[50%]" style={{ background: "radial-gradient(closest-side, rgba(26,26,26,0.22), transparent)" }} />
  </div>
);

export const GammeCarousel = ({ models, current, brand, style, brandBar }: { models: ShowroomCarouselScooter[]; current: string; brand: string; style: GalStyle; brandBar?: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const [active, setActive] = useState(0);
  const dark = style === 3;

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max > 0 ? el.scrollLeft / max : 1);
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < max - 4);
    // élément le plus proche du centre (Podium)
    const mid = el.scrollLeft + el.clientWidth / 2;
    let best = 0, bestD = Infinity;
    Array.from(el.children).forEach((c, i) => {
      const n = c as HTMLElement;
      const d = Math.abs(n.offsetLeft + n.offsetWidth / 2 - mid);
      if (d < bestD) { bestD = d; best = i; }
    });
    setActive(best);
  }, []);

  // Le modèle affiché est centré à l'ouverture.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const i = models.findIndex((m) => m.slug === current);
    const n = el.children[i] as HTMLElement | undefined;
    el.scrollLeft = n ? Math.max(0, n.offsetLeft - (el.clientWidth - n.offsetWidth) / 2) : 0;
    update();
  }, [current, models, update]);

  const go = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.8, 200), behavior: "smooth" });
  };

  const arrow = (dir: 1 | -1, enabled: boolean) => (
    <button type="button" onClick={() => go(dir)} disabled={!enabled} aria-label={dir < 0 ? "Modèles précédents" : "Modèles suivants"}
      className="w-11 h-11 lg:w-12 lg:h-12 inline-flex items-center justify-center -skew-x-12 transition-all disabled:opacity-30 hover:-translate-y-0.5"
      style={{ backgroundColor: dark ? "#fff" : CARBON, color: dark ? CARBON : "#fff", borderRadius: 4, boxShadow: enabled ? `3px 3px 0 ${GREEN}` : "none" }}>
      <span className="skew-x-12">{dir < 0 ? <ChevronLeft className="w-5 h-5" strokeWidth={2.75} /> : <ChevronRight className="w-5 h-5" strokeWidth={2.75} />}</span>
    </button>
  );

  const header = (
    <div className="flex items-end justify-between gap-3 mb-4">
      <div>
        <h2 className="text-xl lg:text-3xl uppercase leading-none" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em", color: dark ? "#fff" : CARBON }}>
          Gamme {brand}
        </h2>
        <div className="mt-1.5 text-sm font-bold uppercase tracking-wider" style={{ fontFamily: FONT, color: dark ? "rgba(255,255,255,0.6)" : "#6B7280" }}>
          {models.length} modèles · glisse ou utilise les flèches
        </div>
      </div>
      <div className="flex gap-2.5 flex-shrink-0">{arrow(-1, canPrev)}{arrow(1, canNext)}</div>
    </div>
  );
  const headerWithBar = brandBar ? <>{brandBar}{header}</> : header;

  const track = (children: React.ReactNode, extra = "") => (
    <div ref={ref} onScroll={update}
      className={`flex overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${extra}`}>
      {children}
    </div>
  );

  const bar = (
    <div className="mt-4 h-1 rounded-full overflow-hidden" style={{ backgroundColor: dark ? "rgba(255,255,255,0.12)" : "rgba(26,26,26,0.08)" }}>
      <div className="h-full rounded-full transition-[width] duration-200" style={{ width: `${Math.max(8, progress * 100)}%`, backgroundColor: GREEN }} />
    </div>
  );

  let items: React.ReactNode;

  if (style === 1) {
    // VITRINE — grandes cartes blanches, projecteur + ombre au sol
    items = track(models.map((m) => {
      const on = m.slug === current;
      return (
        <Link key={m.slug} to={`/scooter/${m.slug}`} className="group snap-start flex-shrink-0 w-[62%] sm:w-56 lg:w-60 mr-3 rounded-2xl bg-white overflow-hidden transition-shadow hover:shadow-xl"
          style={{ border: on ? `2px solid ${GREEN}` : "1px solid #ECE7DD", boxShadow: "0 10px 24px -18px rgba(26,26,26,0.45)" }}>
          <div className="px-4 pt-4" style={{ background: "radial-gradient(70% 60% at 50% 55%, #fff 0%, #F1EEE7 100%)" }}>
            <Photo m={m} h="h-44 lg:h-48" />
          </div>
          <div className="px-4 py-3">
            <div className="text-base uppercase leading-tight" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>{shortName(m)}</div>
            <div className="mt-1 text-sm text-gray-500" style={{ fontFamily: FONT }}>{specLine(m)}</div>
            {on && <div className="mt-2 inline-block text-sm font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ backgroundColor: `${GREEN}1a`, color: GREEN, fontFamily: FONT }}>Modèle affiché</div>}
          </div>
        </Link>
      );
    }), "pb-1");
  } else if (style === 2) {
    // PODIUM — défilement centré, l'élément du milieu en grand, les voisins en retrait
    items = track(models.map((m, i) => {
      const on = m.slug === current;
      const focus = i === active;
      return (
        <Link key={m.slug} to={`/scooter/${m.slug}`} className="group snap-center flex-shrink-0 w-[58%] sm:w-60 lg:w-64 px-2 text-center transition-all duration-300"
          style={{ transform: `scale(${focus ? 1 : 0.84})`, opacity: focus ? 1 : 0.55 }}>
          <div className="relative rounded-[28px] pt-6 px-4" style={{ background: focus ? "radial-gradient(60% 55% at 50% 60%, #fff, #EFEBE3)" : "transparent" }}>
            <Photo m={m} h="h-52 lg:h-60" big />
          </div>
          <div className="mt-3 text-lg uppercase leading-tight" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>{shortName(m)}</div>
          <div className="mt-1 text-sm text-gray-500" style={{ fontFamily: FONT }}>{specLine(m)}</div>
          {on && <div className="mt-1 text-sm font-bold uppercase tracking-wider" style={{ color: GREEN, fontFamily: FONT }}>● Modèle affiché</div>}
        </Link>
      );
    }), "px-[21%] sm:px-[calc(50%-120px)] lg:px-[calc(50%-128px)] py-2");
  } else if (style === 3) {
    // CARBONE — fond carbone, chaque trottinette sur un disque clair (scène)
    items = track(models.map((m) => {
      const on = m.slug === current;
      return (
        <Link key={m.slug} to={`/scooter/${m.slug}`} className="group snap-start flex-shrink-0 w-[60%] sm:w-56 lg:w-60 mr-3 rounded-2xl p-3 transition-colors"
          style={{ backgroundColor: on ? "#2A2A2A" : "#222", boxShadow: on ? `inset 0 -4px 0 ${GREEN}` : "none" }}>
          <div className="relative rounded-xl overflow-hidden pt-4 px-3" style={{ background: "radial-gradient(75% 70% at 50% 60%, #FFFFFF 0%, #E9E6DF 100%)" }}>
            <Photo m={m} h="h-40 lg:h-44" />
          </div>
          <div className="px-1 pt-3 pb-1">
            <div className="text-base uppercase leading-tight text-white" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic" }}>{shortName(m)}</div>
            <div className="mt-1 text-sm text-white/60" style={{ fontFamily: FONT }}>{specLine(m)}</div>
          </div>
        </Link>
      );
    }), "pb-1");
  } else if (style === 4) {
    // PLAQUE — la trottinette déborde de la carte par le haut, numéro de course en filigrane
    items = track(models.map((m, i) => {
      const on = m.slug === current;
      return (
        <Link key={m.slug} to={`/scooter/${m.slug}`} className="group snap-start flex-shrink-0 w-[62%] sm:w-56 lg:w-60 mr-4 pt-10">
          <div className="relative rounded-2xl overflow-visible" style={{ backgroundColor: on ? GREEN : "#fff", border: on ? "none" : "1px solid #ECE7DD", boxShadow: "0 12px 26px -18px rgba(26,26,26,0.5)" }}>
            <span aria-hidden className="absolute right-3 top-2 text-6xl leading-none select-none" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: on ? "rgba(255,255,255,0.18)" : "rgba(26,26,26,0.06)" }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span aria-hidden className="absolute left-0 top-0 h-full w-2 rounded-l-2xl" style={{ backgroundImage: `repeating-linear-gradient(180deg, ${on ? "#fff" : CARBON} 0 8px, transparent 8px 16px)`, opacity: 0.5 }} />
            <div className="-mt-10 px-4">
              <Photo m={m} h="h-48 lg:h-52" blend={!on} big />
            </div>
            <div className="px-5 pb-4 pt-2">
              <div className="text-base uppercase leading-tight" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: on ? "#fff" : CARBON }}>{shortName(m)}</div>
              <div className="mt-1 text-sm" style={{ fontFamily: FONT, color: on ? "rgba(255,255,255,0.8)" : "#6B7280" }}>{specLine(m)}</div>
            </div>
          </div>
        </Link>
      );
    }), "pb-1");
  } else {
    // PADDOCK — pas de carte : les trottinettes alignées comme au stand, nom sous la roue
    items = track(models.map((m) => {
      const on = m.slug === current;
      return (
        <Link key={m.slug} to={`/scooter/${m.slug}`} className="group snap-start flex-shrink-0 w-[46%] sm:w-44 lg:w-48 mr-2 text-center">
          <div className="relative px-2 pt-2 rounded-2xl transition-colors" style={{ backgroundColor: on ? "#fff" : "transparent" }}>
            <Photo m={m} h="h-40 lg:h-44" />
          </div>
          <div className="mt-2 mx-auto h-1 w-10 -skew-x-12" style={{ backgroundColor: on ? GREEN : "transparent" }} />
          <div className="mt-2 text-sm uppercase leading-tight" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>{shortName(m)}</div>
          <div className="mt-0.5 text-sm text-gray-500" style={{ fontFamily: FONT }}>{m.power_watts ? `${m.power_watts} W` : ""}</div>
        </Link>
      );
    }), "pb-1 border-b-2 border-dashed border-[#E2DCCF]");
  }

  return (
    <section className="px-4 py-10" style={{ backgroundColor: dark ? CARBON : "#F5F0E8" }}>
      <div className="mx-auto max-w-6xl">
        {headerWithBar}
        {items}
        {bar}
      </div>
    </section>
  );
};

export default GammeCarousel;
