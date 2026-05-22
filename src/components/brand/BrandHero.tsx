import { motion, useReducedMotion } from "framer-motion";
import { getBrandColors } from "@/contexts/ScooterContext";
import type { BrandData } from "@/hooks/useBrandData";

const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];
const FONT = "'Plus Jakarta Sans', sans-serif";

interface Props {
  brand: BrandData;
  modelCount: number;
}

const BrandHero = ({ brand, modelCount }: Props) => {
  const reduce = useReducedMotion();
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

  return (
    <section
      className="relative overflow-hidden min-h-[88dvh] flex items-center px-4 pt-24 pb-16 lg:px-8 lg:pt-32 lg:pb-24"
      style={{ background: `linear-gradient(135deg, ${accent}1f 0%, #F5F0E8 60%)` }}
    >
      {/* Brand accent glow */}
      <div
        aria-hidden
        className="absolute -top-32 -right-24 w-[480px] h-[480px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(closest-side, ${accent}33 0%, transparent 70%)`, filter: "blur(80px)" }}
      />

      <div className="relative z-10 mx-auto max-w-6xl w-full grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Left — typography */}
        <div className="text-center lg:text-left">
          {meta.length > 0 && (
            <motion.div {...fade(0)} className="flex flex-wrap justify-center lg:justify-start gap-2 mb-6">
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

        {/* Right — hero image, logo, or massive name fallback */}
        <motion.div {...fade(0.3)} className="flex items-center justify-center">
          {brand.hero_image_url ? (
            <img
              src={brand.hero_image_url}
              alt={`${brand.name}${brand.tagline ? ` — ${brand.tagline}` : ""}`}
              loading="eager"
              className="w-full max-h-[60dvh] object-contain drop-shadow-2xl rounded-[2rem]"
            />
          ) : brand.logo_url ? (
            <img
              src={brand.logo_url}
              alt={`${brand.name} logo`}
              loading="eager"
              className="max-h-[40dvh] w-auto object-contain"
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
    </section>
  );
};

export default BrandHero;
