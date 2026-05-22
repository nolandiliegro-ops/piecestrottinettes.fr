import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Package } from "lucide-react";
import type { ScooterCompatiblePart } from "@/hooks/useScooterDetail";

const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];
const FONT = "'Plus Jakarta Sans', sans-serif";

interface Props {
  parts: ScooterCompatiblePart[];
  brandName: string;
  brandSlug: string;
}

// Editorial grid of the most-demanded parts across the brand's gamme → /piece/:slug.
// Rendered only when there is at least one aggregated part.
const BrandTopParts = ({ parts, brandName, brandSlug }: Props) => {
  const reduce = useReducedMotion();
  if (parts.length === 0) return null;

  return (
    <section className="px-4 py-16 lg:px-8 lg:py-24" style={{ backgroundColor: "#F5F0E8" }}>
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 lg:mb-10"
        >
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.25em] mb-2"
              style={{ color: "#6B7280", fontFamily: FONT }}
            >
              — ÉQUIPE TA {brandName.toUpperCase()}
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
              Pièces les plus demandées
            </h2>
          </div>

          <Link
            to={`/catalogue?brand=${brandSlug}`}
            aria-label={`Voir toutes les pièces ${brandName}`}
            className="group inline-flex items-center gap-1 text-sm font-bold uppercase tracking-wider underline underline-offset-4"
            style={{ color: "#1A1A1A", fontFamily: FONT }}
          >
            Tout voir
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
          {parts.map((part, i) => (
            <motion.div
              key={part.id}
              initial={reduce ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: EASE, delay: Math.min(i * 0.05, 0.3) }}
            >
              <Link to={`/piece/${part.slug}`} className="group block h-full">
                <motion.div
                  whileHover={reduce ? undefined : { y: -4 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="rounded-2xl bg-white overflow-hidden h-full flex flex-col"
                  style={{ boxShadow: "0 10px 30px -12px rgba(26,26,26,0.18)" }}
                >
                  <div className="aspect-square flex items-center justify-center p-5" style={{ backgroundColor: "#F5F0E8" }}>
                    {part.image_url ? (
                      <img
                        src={part.image_url}
                        alt={part.name}
                        loading="lazy"
                        className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <Package className="w-10 h-10" strokeWidth={1.5} style={{ color: "#6B7280" }} aria-hidden />
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3
                      className="text-sm font-bold leading-tight line-clamp-2 mb-2"
                      style={{ color: "#1A1A1A", fontFamily: FONT }}
                    >
                      {part.name}
                    </h3>
                    {part.price != null && (
                      <p
                        className="mt-auto text-lg"
                        style={{ color: "#1A1A1A", fontFamily: "'Anton', sans-serif" }}
                      >
                        {part.price.toFixed(2)} €
                      </p>
                    )}
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandTopParts;
