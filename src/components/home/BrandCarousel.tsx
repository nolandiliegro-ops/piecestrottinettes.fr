import { motion, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";
import { useBrandsList } from "@/hooks/useBrandsList";
import { useBrandFavorites } from "@/hooks/useBrandFavorites";
import BrandCard from "./BrandCard";

const FONT = "'Plus Jakarta Sans', sans-serif";

/**
 * Editorial "héros + mini-cards" composition (no longer a horizontal carousel).
 * The brand with the smallest display_order (brands[0]) is the hero; every other
 * published brand is a stacked mini-card. Order is fully data-driven — change the
 * admin display_order and the hero changes. No slug hardcoding.
 */
const BrandCarousel = () => {
  const { data: brands = [], isLoading } = useBrandsList();
  const { favorites, isFavorite, toggle } = useBrandFavorites();
  const reduce = useReducedMotion();

  // Hide the whole section once we know there is nothing published.
  if (!isLoading && brands.length === 0) return null;

  const hero = brands[0];
  const minis = brands.slice(1);
  const hasMinis = minis.length > 0;

  return (
    <section className="px-4 py-10 lg:py-14" style={{ backgroundColor: "#F5F0E8" }}>
      <div className="mx-auto max-w-6xl">
        {/* ── Header ── */}
        <div className="flex items-end justify-between gap-4 mb-7 lg:mb-10">
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.25em] mb-2"
              style={{ color: "#6B7280", fontFamily: FONT }}
            >
              — OU EXPLORE PAR MARQUE
            </p>
            <h2
              className="text-3xl lg:text-5xl leading-none tracking-tight uppercase"
              style={{ fontFamily: "'Anton', sans-serif", color: "#1A1A1A" }}
            >
              Choisis ta marque
            </h2>
          </div>

          {favorites.length > 0 && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
              style={{
                backgroundColor: "rgba(225,29,72,0.1)",
                color: "#E11D48",
                fontFamily: FONT,
              }}
            >
              <Heart className="w-3.5 h-3.5" fill="currentColor" strokeWidth={2} />
              {favorites.length} favori{favorites.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* ── Hero + mini-cards ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-3 lg:h-[540px]">
            <div className="h-[400px] lg:h-full rounded-[1.25rem] bg-black/5 animate-pulse" />
            <div className="grid gap-2 h-full" style={{ gridTemplateRows: "repeat(4, minmax(64px, 1fr))" }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={`mini-skeleton-${i}`} className="rounded-[0.875rem] bg-black/5 animate-pulse min-h-[64px]" />
              ))}
            </div>
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 gap-3 lg:h-[540px] ${
              hasMinis ? "lg:grid-cols-[1.4fr_1fr]" : ""
            }`}
          >
            {/* Hero */}
            <motion.div
              className="min-w-0 h-full"
              initial={reduce ? false : { opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <BrandCard
                brand={hero}
                isStar
                isHero
                isFavorite={isFavorite(hero.slug)}
                onToggleFavorite={toggle}
              />
            </motion.div>

            {/* Mini-cards stack */}
            {hasMinis && (
              <div
                className="grid gap-2 h-full"
                style={{ gridTemplateRows: `repeat(${minis.length}, minmax(64px, 1fr))` }}
              >
                {minis.map((brand, idx) => (
                  <motion.div
                    key={brand.slug}
                    className="min-w-0 h-full"
                    initial={reduce ? false : { opacity: 0, x: 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: idx * 0.08 }}
                  >
                    <BrandCard
                      brand={brand}
                      isStar={false}
                      isHero={false}
                      isFavorite={isFavorite(brand.slug)}
                      onToggleFavorite={toggle}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default BrandCarousel;
