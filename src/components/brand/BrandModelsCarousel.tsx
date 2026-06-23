import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Bike } from "lucide-react";
import { getBrandColors } from "@/contexts/ScooterContext";
import type { BrandModel } from "@/hooks/useBrandData";

const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];
const FONT = "'Plus Jakarta Sans', sans-serif";

interface Props {
  models: BrandModel[];
  brandName: string;
  accentColor: string | null;
}

const spec = (v: number | null, suffix: string) => (v != null ? `${v}${suffix}` : null);

// Horizontal native scroll-snap carousel of the brand's models → /scooter/:slug.
// When the brand has no model yet, shows a soft "coming soon" banner instead.
const BrandModelsCarousel = ({ models, brandName, accentColor }: Props) => {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const accent = accentColor || getBrandColors(brandName).accent;

  return (
    <section className="px-4 py-16 lg:px-8 lg:py-24" style={{ backgroundColor: "#F5F0E8" }}>
      <style>{`.brand-carousel::-webkit-scrollbar{display:none}.brand-carousel{-ms-overflow-style:none;scrollbar-width:none}`}</style>
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mb-8 lg:mb-10"
        >
          <p
            className="text-[10px] font-bold uppercase tracking-[0.25em] mb-2"
            style={{ color: "#6B7280", fontFamily: FONT }}
          >
            — LA GAMME{models.length > 0 ? ` · ${models.length} modèle${models.length > 1 ? "s" : ""}` : ""}
          </p>
          <h2
            className="text-3xl lg:text-5xl leading-none"
            style={{
              fontFamily: "'Anton', sans-serif",
              color: "#1A1A1A",
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
            }}
          >
            Les modèles {brandName}
          </h2>
        </motion.div>

        {models.length === 0 ? (
          <div
            className="rounded-[2rem] border border-dashed py-14 text-center"
            style={{ borderColor: "rgba(26,26,26,0.2)" }}
          >
            <Bike className="w-10 h-10 mx-auto mb-4" strokeWidth={1.5} style={{ color: "#6B7280" }} aria-hidden />
            <p className="text-base font-semibold" style={{ color: "#1A1A1A", fontFamily: FONT }}>
              Modèles bientôt disponibles
            </p>
            <p className="text-sm mt-1" style={{ color: "#6B7280", fontFamily: FONT }}>
              La gamme {brandName} arrive très vite.
            </p>
          </div>
        ) : (
          <div
            className="brand-carousel flex gap-4 overflow-x-auto pb-3"
            style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", scrollPaddingLeft: "1rem" }}
            aria-label={`Modèles ${brandName}`}
          >
            {models.map((m) => {
              const specs = [
                spec(m.max_speed_kmh, " km/h"),
                spec(m.range_km, " km"),
                spec(m.power_watts, " W"),
              ].filter(Boolean) as string[];

              return (
                <motion.button
                  key={m.id}
                  type="button"
                  onClick={() => navigate(`/scooter/${m.slug}`)}
                  aria-label={`Voir ${m.name}`}
                  whileHover={reduce ? undefined : { y: -4 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="group flex-shrink-0 w-[260px] sm:w-[300px] rounded-2xl bg-white overflow-hidden flex flex-col text-left"
                  style={{ scrollSnapAlign: "start", boxShadow: "0 10px 30px -12px rgba(26,26,26,0.18)" }}
                >
                  <div className="px-4 pt-4">
                    <span
                      className="inline-block rounded-full px-3 py-1 text-[10px] text-white font-bold uppercase tracking-wider"
                      style={{ backgroundColor: accent, fontFamily: FONT }}
                    >
                      {brandName}
                    </span>
                  </div>

                  <div className="h-[200px] flex items-center justify-center px-5 py-4">
                    {m.image_url ? (
                      <img
                        src={m.image_url}
                        alt={m.name}
                        loading="lazy"
                        className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <Bike className="w-16 h-16" strokeWidth={1.5} style={{ color: "#6B7280" }} aria-hidden />
                    )}
                  </div>

                  <div className="px-5 pb-5 flex flex-col flex-1">
                    <h3
                      className="text-xl lg:text-2xl leading-tight mb-2"
                      style={{
                        fontFamily: "'Anton', sans-serif",
                        color: "#1A1A1A",
                        textTransform: "uppercase",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {m.name}
                    </h3>
                    {specs.length > 0 && (
                      <p className="text-sm mt-auto" style={{ color: "#6B7280", fontFamily: FONT }}>
                        {specs.join(" · ")}
                      </p>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default BrandModelsCarousel;
