import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Search as SearchIcon } from "lucide-react";
import { useHeroScooters } from "@/hooks/useHeroScooters";
import { useSelectedScooter } from "@/contexts/ScooterContext";
import HeroCenterCarousel from "@/components/home/HeroCenterCarousel";
import HeroMiniCards from "@/components/home/HeroMiniCards";

const HeroSearchFirst = () => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const { setSelectedScooter } = useSelectedScooter();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Strict 300ms debounce — keeps both carousels from re-filtering on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { scooters, total, isLoading } = useHeroScooters(debouncedQuery);
  const isSearching = debouncedQuery.length > 0;

  const handleSelect = (slug: string) => {
    const s = scooters.find((x) => x.slug === slug);
    if (s) {
      setSelectedScooter({
        id: s.id,
        name: s.name,
        slug: s.slug,
        brandName: s.brand_name ?? "Unknown",
        imageUrl: s.image_url,
      });
    }
    navigate(`/scooter/${slug}`);
  };

  const submitFreeText = () => {
    const q = query.trim();
    navigate(q ? `/catalogue?search=${encodeURIComponent(q)}` : "/catalogue");
  };

  const miniTitle = isSearching
    ? `${total} résultat${total > 1 ? "s" : ""} ${debouncedQuery}`.toUpperCase()
    : "TOP DU MOMENT";

  const fadeUp = (delay: number) =>
    prefersReducedMotion
      ? { initial: false as const, animate: { opacity: 1, y: 0 } }
      : {
          initial: { opacity: 0, y: -12 },
          animate: { opacity: 1, y: 0 },
          transition: {
            duration: 0.5,
            delay,
            ease: [0.22, 1, 0.36, 1] as const,
          },
        };

  const heroImage = scooters[0]?.image_url ?? null;

  return (
    <section
      className="relative overflow-hidden px-4 pt-10 pb-12 lg:pt-20 lg:pb-20"
      style={{ backgroundColor: "var(--token-global-background, #FAFAF8)" }}
    >
      <style>{`
        @keyframes ptMeshMove {
          0%, 100% { background-position: 18% 28%, 82% 70%, 50% 95%, 75% 15%; }
          50%      { background-position: 65% 55%, 30% 45%, 80% 25%, 25% 75%; }
        }
        @keyframes ptGlowPulse {
          0%, 100% { opacity: 1;   transform: scale(1); }
          50%      { opacity: 0.55; transform: scale(0.88); }
        }
        .pt-mesh {
          background-color: var(--token-global-background, #FAFAF8);
          background-image:
            radial-gradient(45% 45% at 50% 50%, rgba(74,124,89,0.08), transparent 70%),
            radial-gradient(40% 40% at 50% 50%, rgba(255,102,0,0.06), transparent 70%),
            radial-gradient(35% 35% at 50% 50%, rgba(74,124,89,0.05), transparent 70%),
            radial-gradient(30% 30% at 50% 50%, rgba(255,102,0,0.04), transparent 70%);
          background-size: 80% 80%, 70% 70%, 60% 60%, 55% 55%;
          background-position: 18% 28%, 82% 70%, 50% 95%, 75% 15%;
          background-repeat: no-repeat;
          animation: ptMeshMove 40s ease-in-out infinite;
          will-change: background-position;
        }
        @media (max-width: 767px) {
          .pt-mesh {
            background-image: radial-gradient(60% 60% at 30% 30%, rgba(74,124,89,0.08), transparent 70%);
            background-size: 100% 100%;
            background-position: 0 0;
            animation: none;
          }
        }
        .pt-glow-pulse { animation: ptGlowPulse 3s ease-in-out infinite; will-change: opacity, transform; }
        @media (prefers-reduced-motion: reduce) {
          .pt-mesh, .pt-glow-pulse { animation: none !important; }
        }
      `}</style>

      <div aria-hidden className="pt-mesh absolute inset-0 z-0 pointer-events-none" />

      {/* Mobile blurred backdrop of the first scooter for warmth */}
      {heroImage && (
        <div
          aria-hidden
          className="absolute inset-0 z-0 flex items-center justify-center lg:hidden pointer-events-none overflow-hidden"
        >
          <img
            src={heroImage}
            alt=""
            className="h-[450px] w-auto max-w-none object-contain"
            style={{ opacity: 0.18, filter: "blur(6px)", transform: "scale(1.15)" }}
            loading="lazy"
          />
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* ZONE 1 + ZONE 2 */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-10 lg:items-center lg:min-h-[520px]">
          {/* ZONE 1 — slogan + search */}
          <div className="text-center lg:text-left">
            <motion.div
              {...fadeUp(0)}
              className="inline-flex items-center gap-2 mb-5 lg:mb-7"
            >
              <span className="relative flex h-2 w-2">
                <span
                  className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
                  style={{ backgroundColor: "#4A7C59" }}
                />
                <span
                  className="relative inline-flex h-2 w-2 rounded-full"
                  style={{ backgroundColor: "#4A7C59" }}
                />
              </span>
              <span
                className="text-xs lg:text-sm font-bold tracking-[0.18em] uppercase"
                style={{ color: "#4A7C59", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Compatibilité garantie
              </span>
            </motion.div>

            <motion.h1
              {...fadeUp(0.15)}
              className="text-[44px] leading-[0.95] sm:text-6xl lg:text-7xl xl:text-8xl mb-5 lg:mb-7"
              style={{
                fontFamily: "'Anton', sans-serif",
                color: "var(--token-global-text-primary, #1A1A1A)",
                letterSpacing: "-0.02em",
                textTransform: "uppercase",
              }}
            >
              Plus jamais la{" "}
              <span className="relative inline-block align-baseline">
                <span
                  aria-hidden
                  className="pt-glow-pulse absolute -inset-x-4 -inset-y-2 z-0 rounded-full"
                  style={{
                    background:
                      "radial-gradient(closest-side, rgba(74,124,89,0.55), rgba(74,124,89,0) 70%)",
                    filter: "blur(18px)",
                  }}
                />
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-1 lg:bottom-2 h-3 lg:h-5 z-[1] rounded-sm"
                  style={{ backgroundColor: "rgba(74,124,89,0.28)" }}
                />
                <span className="relative z-[2]" style={{ color: "#4A7C59" }}>
                  mauvaise
                </span>
              </span>{" "}
              pièce.
            </motion.h1>

            <motion.p
              {...fadeUp(0.3)}
              className="text-base sm:text-lg lg:text-xl mb-8 lg:mb-10 max-w-2xl mx-auto lg:mx-0"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: "var(--token-global-text-secondary, #6B7280)",
                fontWeight: 500,
                lineHeight: 1.5,
              }}
            >
              Sélectionne ton modèle — on filtre tout pour toi.
            </motion.p>

            <motion.div {...fadeUp(0.45)} className="relative max-w-2xl mx-auto lg:mx-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitFreeText();
                }}
                className="flex items-stretch gap-2"
                role="search"
              >
                <div className="relative flex-1">
                  <SearchIcon
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
                    style={{ color: "var(--token-global-text-secondary, #6B7280)" }}
                    strokeWidth={2}
                    aria-hidden
                  />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") inputRef.current?.blur();
                    }}
                    placeholder="Dualtron, Kaabo, Ninebot..."
                    aria-label="Rechercher un modèle de trottinette"
                    className="w-full min-h-[56px] lg:min-h-[64px] pl-12 pr-5 lg:pr-6 rounded-xl border border-gray-300 bg-white text-base lg:text-lg focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 shadow-sm"
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      color: "var(--token-global-text-primary, #1A1A1A)",
                      ["--tw-ring-color" as string]: "#4A7C59",
                    }}
                  />
                </div>
                <button
                  type="submit"
                  aria-label="Rechercher"
                  className="min-w-[56px] lg:min-w-[64px] min-h-[56px] lg:min-h-[64px] rounded-xl text-white flex items-center justify-center transition-colors shadow-md"
                  style={{ backgroundColor: "#1A1A1A" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#000000")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1A1A1A")}
                >
                  <ArrowRight className="w-5 h-5 lg:w-6 lg:h-6" strokeWidth={2.5} />
                </button>
              </form>

              <motion.button
                {...fadeUp(0.6)}
                type="button"
                onClick={() => navigate("/catalogue")}
                className="mt-4 text-xs font-bold uppercase tracking-wider underline underline-offset-4 transition-colors"
                style={{ color: "var(--token-global-text-secondary, #6B7280)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--token-global-text-primary, #1A1A1A)";
                  e.currentTarget.style.textDecorationThickness = "2px";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--token-global-text-secondary, #6B7280)";
                  e.currentTarget.style.textDecorationThickness = "";
                }}
              >
                Tu connais pas ton modèle ? Voir tout le catalogue
              </motion.button>
            </motion.div>
          </div>

          {/* ZONE 2 — center carousel (desktop only) */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:flex items-center justify-center mt-2"
          >
            <HeroCenterCarousel scooters={scooters} onSelect={handleSelect} />
          </motion.div>
        </div>

        {/* ZONE 3 — mini cards (mobile + desktop) */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 lg:mt-16"
        >
          <HeroMiniCards
            scooters={scooters}
            title={miniTitle}
            onSelect={handleSelect}
            isLoading={isLoading}
            showStar={!isSearching}
          />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSearchFirst;
