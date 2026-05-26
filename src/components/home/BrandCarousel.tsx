import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { useBrandsList, type BrandListItem } from "@/hooks/useBrandsList";
import { useBrandFavorites } from "@/hooks/useBrandFavorites";
import BrandCard from "./BrandCard";
import { useState } from "react";

const FONT = "'Plus Jakarta Sans', sans-serif";

/**
 * Horizontal scroll-snap carousel of compact brand cards — same mechanics as the
 * production ScooterCarousel (overflow-x scroll, snap, hidden scrollbar, desktop
 * chevrons, edge-aware enable/disable). Order is data-driven (display_order asc);
 * the first brand carries the ★ STAR badge. Cards always link to /marque/:slug.
 *
 * Desktop enhancements:
 * - Cards scale up at xl/2xl breakpoints
 * - Lateral overlay arrows appear on carousel hover
 * - Mouse drag to scroll (coexists with native touch swipe)
 */
const BrandCarousel = () => {
  const { data: brands = [], isLoading } = useBrandsList();
  const { favorites, isFavorite, toggle } = useBrandFavorites();
  const reduce = useReducedMotion();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({ canLeft: false, canRight: true });

  // Drag refs — using refs (not state) to avoid stale closure issues in event handlers.
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const scrollStartLeftRef = useRef(0);
  const dragDistanceRef = useRef(0);

  const updateState = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setScrollState({
      canLeft: el.scrollLeft > 4,
      canRight: el.scrollLeft < max - 4,
    });
  };

  useEffect(() => {
    updateState();
    const el = scrollRef.current;
    if (!el) return;
    const onResize = () => updateState();
    window.addEventListener("resize", onResize);
    el.addEventListener("scrollend", updateState);
    return () => {
      window.removeEventListener("resize", onResize);
      el.removeEventListener("scrollend", updateState);
    };
  }, [brands.length]);

  const scrollByDir = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const w = window.innerWidth;
    const card =
      w >= 1536 ? 280 : w >= 1280 ? 260 : w >= 1024 ? 220 : w >= 768 ? 180 : 160;
    el.scrollBy({ left: dir * (card + 12) * 2, behavior: "smooth" });
  };

  // ── Mouse drag handlers ──────────────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDraggingRef.current = true;
    dragStartXRef.current = e.pageX;
    scrollStartLeftRef.current = scrollRef.current.scrollLeft;
    dragDistanceRef.current = 0;
    scrollRef.current.style.cursor = "grabbing";
    scrollRef.current.style.userSelect = "none";
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    e.preventDefault();
    const dx = e.pageX - dragStartXRef.current;
    dragDistanceRef.current = Math.abs(dx);
    scrollRef.current.scrollLeft = scrollStartLeftRef.current - dx;
  };

  const onMouseUpOrLeave = () => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    isDraggingRef.current = false;
    scrollRef.current.style.cursor = "grab";
    scrollRef.current.style.userSelect = "auto";
  };

  // Capture phase: block Link clicks when the interaction was actually a drag (> 5px).
  const onClickCapture = (e: React.MouseEvent) => {
    if (dragDistanceRef.current > 5) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Hide the whole section once we know there is nothing published.
  if (!isLoading && brands.length === 0) return null;

  // Arrows only matter once the row can actually overflow (> 4 cards on desktop).
  const arrowsEnabled = brands.length > 4;

  return (
    <section className="py-10 lg:py-14" style={{ backgroundColor: "#F5F0E8" }}>
      <style>{`
        .pt-brand-carousel::-webkit-scrollbar { display: none; }
        .pt-brand-carousel { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="mx-auto max-w-6xl xl:max-w-7xl 2xl:max-w-screen-2xl">
        {/* ── Header ── */}
        <div className="px-4 lg:px-0 flex items-end justify-between gap-4 mb-7 lg:mb-10">
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

          {/* Favorites counter — arrows moved to lateral overlay */}
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

        {/* ── Carousel + Lateral Arrows Overlay ── */}
        <div className="relative group/carousel">
          {/* Left lateral arrow */}
          {arrowsEnabled && (
            <button
              type="button"
              onClick={() => scrollByDir(-1)}
              aria-label="Précédent"
              className={`hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 w-12 h-12 rounded-full bg-white shadow-xl items-center justify-center text-[#1A1A1A] hover:scale-110 transition-all duration-300 border border-gray-100 ${
                scrollState.canLeft
                  ? "opacity-0 group-hover/carousel:opacity-100 cursor-pointer"
                  : "opacity-0 cursor-not-allowed pointer-events-none"
              }`}
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
            </button>
          )}

          {/* Right lateral arrow */}
          {arrowsEnabled && (
            <button
              type="button"
              onClick={() => scrollByDir(1)}
              aria-label="Suivant"
              className={`hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20 w-12 h-12 rounded-full bg-white shadow-xl items-center justify-center text-[#1A1A1A] hover:scale-110 transition-all duration-300 border border-gray-100 ${
                scrollState.canRight
                  ? "opacity-0 group-hover/carousel:opacity-100 cursor-pointer"
                  : "opacity-0 cursor-not-allowed pointer-events-none"
              }`}
            >
              <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
            </button>
          )}

          {/* ── Horizontal scroll-snap carousel ── */}
          <div
            ref={scrollRef}
            onScroll={updateState}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUpOrLeave}
            onMouseLeave={onMouseUpOrLeave}
            onClickCapture={onClickCapture}
            className="pt-brand-carousel flex gap-3 overflow-x-auto pb-3 pl-4 lg:pl-0 pr-4 lg:pr-0"
            style={{
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
              scrollPaddingLeft: "1rem",
              cursor: "grab",
            }}
          >
            {(isLoading ? Array.from({ length: 5 }) : brands).map((item, idx) => {
              if (!item) {
                return (
                  <div
                    key={`brand-skeleton-${idx}`}
                    className="flex-shrink-0 w-[160px] md:w-[180px] lg:w-[220px] xl:w-[260px] 2xl:w-[280px] aspect-[3/4] rounded-2xl bg-black/5 animate-pulse"
                    style={{ scrollSnapAlign: "start" }}
                  />
                );
              }
              const brand = item as BrandListItem;
              return (
                <motion.div
                  key={brand.slug}
                  className="flex-shrink-0 w-[160px] md:w-[180px] lg:w-[220px] xl:w-[260px] 2xl:w-[280px]"
                  style={{ scrollSnapAlign: "start" }}
                  initial={reduce ? false : { opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: idx * 0.08 }}
                >
                  <BrandCard
                    brand={brand}
                    isStar={idx === 0}
                    isFavorite={isFavorite(brand.slug)}
                    onToggleFavorite={toggle}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandCarousel;
