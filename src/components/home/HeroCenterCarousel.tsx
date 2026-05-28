import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Bike, ChevronLeft, ChevronRight } from "lucide-react";
import { getBrandColors } from "@/contexts/ScooterContext";
import type { ScooterHero } from "@/hooks/useHeroScooters";

interface Props {
  scooters: ScooterHero[];
  onSelect: (slug: string) => void;
}

const spec = (value: number | null, suffix: string) =>
  value != null ? `${value} ${suffix}` : "—";

const HeroCenterCarousel = ({ scooters, onSelect }: Props) => {
  const prefersReducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  // Reset to first whenever the list changes (e.g. live search filtering)
  useEffect(() => {
    setIndex(0);
  }, [scooters]);

  if (scooters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center min-h-[440px] w-full">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
          style={{ backgroundColor: "rgba(26,26,26,0.06)" }}
        >
          <Bike className="w-10 h-10" style={{ color: "var(--token-global-text-secondary, #6B7280)" }} strokeWidth={1.2} />
        </div>
        <p
          className="text-xl"
          style={{
            fontFamily: "'Anton', sans-serif",
            color: "var(--token-global-text-primary, #1A1A1A)",
            textTransform: "uppercase",
            letterSpacing: "-0.01em",
          }}
        >
          Aucune trottinette trouvée
        </p>
        <p
          className="mt-2 text-sm"
          style={{ color: "var(--token-global-text-secondary, #6B7280)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Essaie un autre modèle ou une autre marque.
        </p>
      </div>
    );
  }

  const len = scooters.length;
  const safeIndex = index % len;
  const current = scooters[safeIndex];
  const prev = scooters[(safeIndex - 1 + len) % len];
  const next = scooters[(safeIndex + 1) % len];
  const brand = getBrandColors(current.brand_name);

  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + len) % len);

  return (
    <div className="relative w-full select-none">
      <div
        aria-hidden
        className="absolute inset-0 m-auto pointer-events-none"
        style={{
          background: `radial-gradient(closest-side, ${brand.accent}1f 0%, transparent 70%)`,
          filter: "blur(90px)",
        }}
      />

      <div className="relative flex items-center justify-center">
        {/* Adjacent previews (desktop xl only) */}
        {len > 1 && prev.id !== current.id && (
          <div
            aria-hidden
            className="absolute left-0 z-0 hidden xl:block pointer-events-none"
            style={{ opacity: 0.3, transform: "scale(0.75)" }}
          >
            {prev.image_url ? (
              <img src={prev.image_url} alt="" className="h-[260px] w-auto object-contain" loading="lazy" />
            ) : (
              <Bike className="w-28 h-28" style={{ color: "rgba(107,114,128,0.4)" }} strokeWidth={1} />
            )}
          </div>
        )}
        {len > 1 && next.id !== current.id && (
          <div
            aria-hidden
            className="absolute right-0 z-0 hidden xl:block pointer-events-none"
            style={{ opacity: 0.3, transform: "scale(0.75)" }}
          >
            {next.image_url ? (
              <img src={next.image_url} alt="" className="h-[260px] w-auto object-contain" loading="lazy" />
            ) : (
              <Bike className="w-28 h-28" style={{ color: "rgba(107,114,128,0.4)" }} strokeWidth={1} />
            )}
          </div>
        )}

        {/* Main image */}
        <button
          type="button"
          onClick={() => onSelect(current.slug)}
          aria-label={`Voir ${current.name}`}
          className="relative z-10 block"
        >
          <div className="aspect-[4/3] w-[320px] xl:w-[420px] flex items-center justify-center p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={prefersReducedMotion ? false : { opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, x: -40 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="w-full h-full flex items-center justify-center"
              >
                {current.image_url ? (
                  <img
                    src={current.image_url}
                    alt={current.name}
                    className="max-h-full max-w-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  <Bike className="w-32 h-32" style={{ color: "rgba(74,124,89,0.4)" }} strokeWidth={1} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </button>

        {/* Arrows */}
        {len > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Trottinette précédente"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center bg-white shadow-lg hover:shadow-xl transition-all border border-gray-100"
              style={{ color: "var(--token-global-text-primary, #1A1A1A)" }}
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Trottinette suivante"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center bg-white shadow-lg hover:shadow-xl transition-all border border-gray-100"
              style={{ color: "var(--token-global-text-primary, #1A1A1A)" }}
            >
              <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </>
        )}
      </div>

      {/* Info */}
      <div className="relative z-10 mt-4 text-center">
        {current.brand_name && (
          <span
            className="inline-block rounded-full px-3 py-1 text-xs text-white font-bold uppercase tracking-wider mb-3"
            style={{ backgroundColor: brand.accent, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {current.brand_name}
          </span>
        )}
        <button type="button" onClick={() => onSelect(current.slug)} className="block w-full">
          <h3
            className="text-4xl xl:text-5xl leading-none"
            style={{
              fontFamily: "'Anton', sans-serif",
              color: "var(--token-global-text-primary, #1A1A1A)",
              letterSpacing: "-0.01em",
              textTransform: "uppercase",
            }}
          >
            {current.name}
          </h3>
        </button>
        <p
          className="mt-3 text-sm font-semibold inline-flex items-center justify-center gap-2"
          style={{ color: "var(--token-global-text-secondary, #6B7280)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          <span>{spec(current.max_speed_kmh, "km/h")}</span>
          <span style={{ color: "rgba(26,26,26,0.25)" }}>·</span>
          <span>{spec(current.range_km, "km")}</span>
          <span style={{ color: "rgba(26,26,26,0.25)" }}>·</span>
          <span>{spec(current.power_watts, "W")}</span>
        </p>
      </div>
    </div>
  );
};

export default HeroCenterCarousel;
