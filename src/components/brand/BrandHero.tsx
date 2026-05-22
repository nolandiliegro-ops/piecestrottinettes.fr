import { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getBrandColors } from "@/contexts/ScooterContext";
import type { BrandData, BrandNavItem } from "@/hooks/useBrandData";

const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];
const FONT = "'Plus Jakarta Sans', sans-serif";

const MotionLink = motion(Link);

interface Props {
  brand: BrandData;
  modelCount: number;
  prev?: BrandNavItem | null;
  next?: BrandNavItem | null;
}

const BrandHero = ({ brand, modelCount, prev = null, next = null }: Props) => {
  const reduce = useReducedMotion();
  const navigate = useNavigate();
  const accent = brand.accent_color || getBrandColors(brand.name).accent;

  const meta = [
    brand.country,
    brand.founded_year ? `Depuis ${brand.founded_year}` : null,
    modelCount > 0 ? `${modelCount} modèle${modelCount > 1 ? "s" : ""}` : null,
  ].filter(Boolean) as string[];

  const fade = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, ease: EASE, delay },
  });

  // Mobile swipe → previous / next brand. Only acts on clearly horizontal gestures.
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
      if (dx < 0 && next) navigate(`/marque/${next.slug}`);
      else if (dx > 0 && prev) navigate(`/marque/${prev.slug}`);
    }
  };

  return (
    <section
      className="relative overflow-hidden min-h-[88dvh] flex items-center px-4 pt-24 pb-16 lg:px-8 lg:pt-32 lg:pb-24"
      style={{ background: `linear-gradient(135deg, ${accent}1f 0%, #F5F0E8 60%)` }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Brand accent glow */}
      <div
        aria-hidden
        className="absolute -top-32 -right-24 w-[480px] h-[480px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(closest-side, ${accent}33 0%, transparent 70%)`, filter: "blur(80px)" }}
      />

      {/* Ghost watermark — previous brand (desktop only, peeking at the left edge) */}
      {prev && (
        <MotionLink
          to={`/marque/${prev.slug}`}
          aria-label={`Marque précédente : ${prev.name}`}
          className="group hidden lg:block absolute left-0 top-1/2 z-0 select-none rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]"
          style={{ x: "-40%", y: "-50%" }}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={reduce ? undefined : { x: "-36%" }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.3 }}
        >
          <span
            className="block whitespace-nowrap leading-none text-[10rem] xl:text-[14rem] tracking-tighter opacity-10 group-hover:opacity-[0.28] transition-opacity duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{
              fontFamily: "'Anton', sans-serif",
              color: prev.accent_color || getBrandColors(prev.name).accent,
              textTransform: "uppercase",
            }}
          >
            {prev.name}
          </span>
        </MotionLink>
      )}

      {/* Ghost watermark — next brand (desktop only, peeking at the right edge) */}
      {next && (
        <MotionLink
          to={`/marque/${next.slug}`}
          aria-label={`Marque suivante : ${next.name}`}
          className="group hidden lg:block absolute right-0 top-1/2 z-0 select-none rounded-2xl text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]"
          style={{ x: "40%", y: "-50%" }}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={reduce ? undefined : { x: "36%" }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.3 }}
        >
          <span
            className="block whitespace-nowrap leading-none text-[10rem] xl:text-[14rem] tracking-tighter opacity-10 group-hover:opacity-[0.28] transition-opacity duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
            style={{
              fontFamily: "'Anton', sans-serif",
              color: next.accent_color || getBrandColors(next.name).accent,
              textTransform: "uppercase",
            }}
          >
            {next.name}
          </span>
        </MotionLink>
      )}

      {/* Main editorial content */}
      <div className="relative z-10 mx-auto max-w-6xl w-full grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Left — logo + typography */}
        <div className="text-center lg:text-left">
          {brand.logo_url && (
            <motion.img
              {...fade(0)}
              src={brand.logo_url}
              alt={`${brand.name} logo`}
              loading="eager"
              className="h-auto max-h-[120px] w-auto object-contain mb-6 mx-auto lg:mx-0"
            />
          )}

          {meta.length > 0 && (
            <motion.div {...fade(0.05)} className="flex flex-wrap justify-center lg:justify-start gap-2 mb-6">
              {meta.map((m) => (
                <span
                  key={m}
                  className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold"
                  style={{ color: "#1A1A1A", backgroundColor: "rgba(26,26,26,0.06)", fontFamily: FONT }}
                >
                  {m}
                </span>
              ))}
            </motion.div>
          )}

          <motion.h1
            {...fade(0.1)}
            className="text-6xl sm:text-7xl lg:text-8xl leading-[0.9]"
            style={{
              fontFamily: "'Anton', sans-serif",
              color: "#1A1A1A",
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
            }}
          >
            {brand.name}
          </motion.h1>

          {brand.tagline && (
            <motion.p
              {...fade(0.2)}
              className="mt-5 text-lg lg:text-2xl max-w-xl mx-auto lg:mx-0"
              style={{ color: "#6B7280", fontFamily: FONT }}
            >
              {brand.tagline}
            </motion.p>
          )}
        </div>

        {/* Right — hero image, or massive name echo (logo now lives on the left) */}
        <motion.div {...fade(0.3)} className="flex items-center justify-center">
          {brand.hero_image_url ? (
            <img
              src={brand.hero_image_url}
              alt={`${brand.name}${brand.tagline ? ` — ${brand.tagline}` : ""}`}
              loading="eager"
              className="w-full max-h-[60dvh] object-contain drop-shadow-2xl rounded-[2rem]"
            />
          ) : (
            <span
              aria-hidden
              className="text-7xl lg:text-9xl select-none"
              style={{
                fontFamily: "'Anton', sans-serif",
                color: accent,
                textTransform: "uppercase",
                letterSpacing: "-0.03em",
                opacity: 0.18,
              }}
            >
              {brand.name}
            </span>
          )}
        </motion.div>
      </div>

      {/* Discrete chevrons — positioned relative to the content width (mobile + desktop) */}
      {(prev || next) && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          <div className="relative mx-auto max-w-6xl h-full px-2 sm:px-4">
            {prev && (
              <button
                type="button"
                onClick={() => navigate(`/marque/${prev.slug}`)}
                aria-label={`Marque précédente : ${prev.name}`}
                className="pointer-events-auto absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center bg-white/90 shadow-lg border border-black/5 transition-transform duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]"
                style={{ color: "#1A1A1A" }}
              >
                <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
              </button>
            )}
            {next && (
              <button
                type="button"
                onClick={() => navigate(`/marque/${next.slug}`)}
                aria-label={`Marque suivante : ${next.name}`}
                className="pointer-events-auto absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center bg-white/90 shadow-lg border border-black/5 transition-transform duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]"
                style={{ color: "#1A1A1A" }}
              >
                <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default BrandHero;
