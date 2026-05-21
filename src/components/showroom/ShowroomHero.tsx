import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Bike, ChevronLeft, ChevronRight } from "lucide-react";
import { getBrandColors } from "@/contexts/ScooterContext";
import type { ScooterDetail } from "@/hooks/useScooterDetail";
import type { ShowroomCarouselScooter } from "@/hooks/useShowroomData";
import ShowroomActionButtons from "@/components/showroom/ShowroomActionButtons";

interface ShowroomHeroProps {
  scooter: ScooterDetail;
  allScooters: ShowroomCarouselScooter[];
  prevSlug: string | null;
  nextSlug: string | null;
}

const spec = (value: number | null | undefined, suffix: string) =>
  value != null ? `${value} ${suffix}` : "—";

const ShowroomHero = ({ scooter, allScooters, prevSlug, nextSlug }: ShowroomHeroProps) => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const brand = getBrandColors(scooter.brand?.name);

  const prevScooter = prevSlug ? allScooters.find((s) => s.slug === prevSlug) : undefined;
  const nextScooter = nextSlug ? allScooters.find((s) => s.slug === nextSlug) : undefined;
  const hasNav = allScooters.length > 1 && !!prevSlug && !!nextSlug && prevSlug !== nextSlug;

  const goTo = (target: string | null) => {
    if (!target || target === scooter.slug) return;
    navigate(`/showroom/${target}`, { replace: true });
  };

  // Horizontal swipe (mobile) — only when clearly horizontal, to avoid hijacking vertical scroll.
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      goTo(dx < 0 ? nextSlug : prevSlug);
    }
  };

  return (
    <section
      className="relative overflow-hidden px-4 pt-24 pb-12 lg:pt-32 lg:pb-16"
      style={{
        background: `linear-gradient(135deg, ${brand.accent}1f 0%, #F5F0E8 100%)`,
      }}
    >
      {/* Soft brand glow behind the image */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-24 mx-auto h-[360px] max-w-3xl pointer-events-none"
        style={{
          background: `radial-gradient(closest-side, ${brand.accent}26 0%, transparent 70%)`,
          filter: "blur(80px)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl">
        {/* Carousel row */}
        <div
          className="relative flex items-center justify-center select-none"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Adjacent previews (desktop only) */}
          {hasNav && prevScooter && (
            <button
              type="button"
              onClick={() => goTo(prevSlug)}
              aria-label={`Voir ${prevScooter.name}`}
              className="absolute left-0 z-0 hidden lg:block"
              style={{ opacity: 0.3, transform: "scale(0.7)" }}
            >
              {prevScooter.image_url ? (
                <img src={prevScooter.image_url} alt="" className="h-[240px] w-auto object-contain" loading="lazy" />
              ) : (
                <Bike className="w-28 h-28" style={{ color: "rgba(107,114,128,0.4)" }} strokeWidth={1} />
              )}
            </button>
          )}
          {hasNav && nextScooter && (
            <button
              type="button"
              onClick={() => goTo(nextSlug)}
              aria-label={`Voir ${nextScooter.name}`}
              className="absolute right-0 z-0 hidden lg:block"
              style={{ opacity: 0.3, transform: "scale(0.7)" }}
            >
              {nextScooter.image_url ? (
                <img src={nextScooter.image_url} alt="" className="h-[240px] w-auto object-contain" loading="lazy" />
              ) : (
                <Bike className="w-28 h-28" style={{ color: "rgba(107,114,128,0.4)" }} strokeWidth={1} />
              )}
            </button>
          )}

          {/* Center image */}
          <div className="relative z-10 w-[280px] sm:w-[360px] lg:w-[440px] aspect-[4/3] flex items-center justify-center p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={scooter.slug}
                initial={reduceMotion ? false : { opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, x: -40 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="w-full h-full flex items-center justify-center"
              >
                {scooter.image_url ? (
                  <img
                    src={scooter.image_url}
                    alt={scooter.name}
                    className="max-h-full max-w-full object-contain drop-shadow-xl"
                  />
                ) : (
                  <Bike className="w-32 h-32" style={{ color: `${brand.accent}66` }} strokeWidth={1} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Arrows */}
          {hasNav && (
            <>
              <button
                type="button"
                onClick={() => goTo(prevSlug)}
                aria-label="Trottinette précédente"
                className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center bg-white shadow-lg hover:shadow-xl transition-all border border-gray-100"
                style={{ color: "#1A1A1A" }}
              >
                <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={() => goTo(nextSlug)}
                aria-label="Trottinette suivante"
                className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center bg-white shadow-lg hover:shadow-xl transition-all border border-gray-100"
                style={{ color: "#1A1A1A" }}
              >
                <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 lg:mt-8 text-center lg:text-left">
          {scooter.brand?.name && (
            <span
              className="inline-block rounded-full px-3 py-1 text-xs text-white font-bold uppercase tracking-wider mb-3"
              style={{ backgroundColor: brand.accent, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {scooter.brand.name}
            </span>
          )}

          <h1
            className="text-5xl lg:text-6xl xl:text-7xl leading-[0.95] mb-3"
            style={{
              fontFamily: "'Anton', sans-serif",
              color: "#1A1A1A",
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
            }}
          >
            {scooter.name}
          </h1>

          <p
            className="text-sm lg:text-base font-semibold inline-flex items-center gap-2 mb-7"
            style={{ color: "#6B7280", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            <span>{spec(scooter.max_speed_kmh, "km/h")}</span>
            <span style={{ color: "rgba(26,26,26,0.25)" }}>·</span>
            <span>{spec(scooter.range_km, "km")}</span>
            <span style={{ color: "rgba(26,26,26,0.25)" }}>·</span>
            <span>{spec(scooter.power_watts, "W")}</span>
          </p>

          <ShowroomActionButtons
            slug={scooter.slug}
            name={scooter.name}
            affiliateLink={scooter.affiliate_link}
          />
        </div>
      </div>
    </section>
  );
};

export default ShowroomHero;
