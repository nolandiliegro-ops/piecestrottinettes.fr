import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Plus,
  Bike,
  Check,
  Search as SearchIcon,
  ChevronLeft,
  ChevronRight,
  Star,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAddToGarage, useUserGarage } from "@/hooks/useGarage";
import { useSelectedScooter } from "@/contexts/ScooterContext";
import {
  useCompatibleParts,
  useCompatiblePartsCount,
} from "@/hooks/useScooterData";
import { useCart } from "@/hooks/useCart";
import { getPrimaryImage } from "@/lib/entityImage";

interface ScooterLite {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  year: number | null;
  compatible_parts_count: number | null;
  brand_name: string | null;
}

const useAllScooterModelsLite = () =>
  useQuery({
    queryKey: ["all_scooter_models_lite"],
    queryFn: async (): Promise<ScooterLite[]> => {
      const { data, error } = await supabase
        .from("scooter_models")
        .select(
          `id, name, slug, image_url, year, compatible_parts_count,
           brand:brands(name)`
        )
        .eq("published", true)
        .order("name");
      if (error) throw error;
      return (data || []).map((m) => {
        const brandRaw = (m as { brand?: unknown }).brand;
        let brandName: string | null = null;
        if (brandRaw && typeof brandRaw === "object" && "name" in brandRaw) {
          brandName = (brandRaw as { name: string }).name;
        } else if (Array.isArray(brandRaw) && brandRaw.length > 0) {
          brandName = (brandRaw[0] as { name: string }).name;
        }
        return {
          id: m.id,
          name: m.name,
          slug: m.slug,
          image_url: m.image_url,
          year: m.year,
          compatible_parts_count: m.compatible_parts_count,
          brand_name: brandName,
        };
      });
    },
    staleTime: 5 * 60 * 1000,
  });

const HeroSearchFirst = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: garageItems = [] } = useUserGarage();
  const addToGarage = useAddToGarage();
  const prefersReducedMotion = useReducedMotion();
  const {
    selectedScooter,
    setSelectedScooter,
    selectedBrandColors,
  } = useSelectedScooter();
  const { addItem: addCartItem } = useCart();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [heroIndex, setHeroIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const sugScrollRef = useRef<HTMLDivElement>(null);
  const partsScrollRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({
    canLeft: false,
    canRight: true,
  });
  const [partsScrollState, setPartsScrollState] = useState({
    canLeft: false,
    canRight: true,
  });

  const { data: allScooters = [], isLoading: scootersLoading } =
    useAllScooterModelsLite();

  const { data: compatParts = [], isLoading: compatPartsLoading } =
    useCompatibleParts(selectedScooter?.slug || null, 6);
  const { data: compatCount = 0 } = useCompatiblePartsCount(
    selectedScooter?.slug || null
  );

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 150);
    return () => clearTimeout(t);
  }, [query]);

  const garageIds = useMemo(
    () => new Set(garageItems.map((g) => g.scooter_model_id)),
    [garageItems]
  );

  const bestSellers = useMemo<ScooterLite[]>(
    () =>
      [...allScooters]
        .sort(
          (a, b) =>
            (b.compatible_parts_count ?? 0) - (a.compatible_parts_count ?? 0)
        )
        .slice(0, 6),
    [allScooters]
  );

  const filtered = useMemo<ScooterLite[]>(() => {
    if (debouncedQuery.length === 0) return [];
    const q = debouncedQuery.toLowerCase();
    return allScooters.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        (s.brand_name?.toLowerCase().includes(q) ?? false)
    );
  }, [allScooters, debouncedQuery]);

  const heroPool = useMemo<ScooterLite[]>(
    () =>
      allScooters
        .filter((s) => !!s.image_url)
        .sort(
          (a, b) =>
            (b.compatible_parts_count ?? 0) - (a.compatible_parts_count ?? 0)
        )
        .slice(0, 5),
    [allScooters]
  );

  const selectedDetails = useMemo<ScooterLite | null>(() => {
    if (!selectedScooter) return null;
    return allScooters.find((s) => s.id === selectedScooter.id) || null;
  }, [allScooters, selectedScooter]);

  // Hero rotation — paused when a scooter is selected
  useEffect(() => {
    if (
      prefersReducedMotion ||
      heroPool.length <= 1 ||
      selectedScooter
    )
      return;
    const id = window.setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroPool.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, [heroPool.length, prefersReducedMotion, selectedScooter]);

  useEffect(() => {
    if (heroIndex >= heroPool.length) setHeroIndex(0);
  }, [heroPool.length, heroIndex]);

  const isSearching = debouncedQuery.length > 0;
  const showEmpty = isSearching && filtered.length === 0 && !scootersLoading;
  const visible = isSearching ? filtered : bestSellers;

  const updateScrollState = () => {
    const el = sugScrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setScrollState({
      canLeft: el.scrollLeft > 4,
      canRight: el.scrollLeft < max - 4,
    });
  };

  const updatePartsScrollState = () => {
    const el = partsScrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setPartsScrollState({
      canLeft: el.scrollLeft > 4,
      canRight: el.scrollLeft < max - 4,
    });
  };

  useEffect(() => {
    const id = window.requestAnimationFrame(updateScrollState);
    return () => window.cancelAnimationFrame(id);
  }, [visible.length]);

  useEffect(() => {
    const id = window.requestAnimationFrame(updatePartsScrollState);
    return () => window.cancelAnimationFrame(id);
  }, [compatParts.length, selectedScooter?.id]);

  useEffect(() => {
    const onResize = () => {
      updateScrollState();
      updatePartsScrollState();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const submitFreeText = () => {
    const q = query.trim();
    if (q) navigate(`/catalogue?search=${encodeURIComponent(q)}`);
    else navigate("/catalogue");
  };

  const scrollByDir = (
    ref: React.RefObject<HTMLDivElement>,
    dir: 1 | -1
  ) => {
    const el = ref.current;
    if (!el) return;
    const w = window.innerWidth;
    const card = w >= 1024 ? 296 : 256;
    el.scrollBy({ left: dir * card, behavior: "smooth" });
  };

  const handleSelectModel = (s: ScooterLite) => {
    setSelectedScooter({
      id: s.id,
      name: s.name,
      slug: s.slug,
      brandName: s.brand_name || "",
      imageUrl: s.image_url,
    });
    setQuery("");
    setDebouncedQuery("");
  };

  const handleClearSelection = () => {
    setSelectedScooter(null);
  };

  const handleAddToGarage = (s: ScooterLite, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.info("Connecte-toi pour ajouter à ton garage");
      navigate("/login?redirect=/");
      return;
    }
    if (garageIds.has(s.id)) {
      toast.info(`${s.name} est déjà dans ton garage`);
      return;
    }
    addToGarage.mutate({
      scooterSlug: s.slug,
      isOwned: false,
      scooterName: s.name,
    });
  };

  const handleAddPartToCart = (
    part: (typeof compatParts)[number],
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (part.price === null) return;
    const stock = part.stock_quantity ?? 0;
    if (stock === 0) {
      toast.info("Cette pièce est en rupture de stock");
      return;
    }
    const primaryImage =
      getPrimaryImage(part.images, part.image_url, "") || part.image_url || "";
    addCartItem({
      id: part.id,
      name: part.name,
      price: part.price,
      image_url: primaryImage,
      stock_quantity: stock,
    });
    toast.success(`${part.name} ajouté au panier`);
  };

  const fadeUp = (delay: number) =>
    prefersReducedMotion
      ? { initial: false, animate: { opacity: 1, y: 0 } }
      : {
          initial: { opacity: 0, y: -12 },
          animate: { opacity: 1, y: 0 },
          transition: {
            duration: 0.5,
            delay,
            ease: [0.22, 1, 0.36, 1] as const,
          },
        };

  const heroEntry = prefersReducedMotion
    ? { initial: false, animate: { opacity: 1, scale: 1 } }
    : {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        transition: {
          duration: 0.7,
          delay: 0.8,
          ease: [0.22, 1, 0.36, 1] as const,
        },
      };

  // Displayed hero scooter: selected one (State B) or rotating heroPool (State A)
  const currentHero = heroPool[heroIndex];
  const displayedHero =
    selectedScooter && selectedScooter.imageUrl
      ? {
          id: selectedScooter.id,
          image_url: selectedScooter.imageUrl,
          name: selectedScooter.name,
        }
      : currentHero;

  const brandAccent = selectedScooter
    ? selectedBrandColors.accent
    : "#4A7C59";

  return (
    <section
      className="relative overflow-hidden px-4 pt-10 pb-12 lg:pt-20 lg:pb-20"
      style={{ backgroundColor: "#F5F0E8" }}
    >
      <style>{`
        @keyframes ptMeshMove {
          0%, 100% { background-position: 18% 28%, 82% 70%, 50% 95%, 75% 15%; }
          50%      { background-position: 65% 55%, 30% 45%, 80% 25%, 25% 75%; }
        }
        @keyframes ptHeroFloat {
          0%, 100% { transform: translateY(-8px) rotate(-1deg); }
          50%      { transform: translateY(8px) rotate(1deg); }
        }
        @keyframes ptHeroFloatBig {
          0%, 100% { transform: translateY(-10px) rotate(-1.5deg); }
          50%      { transform: translateY(10px) rotate(1.5deg); }
        }
        @keyframes ptShadowBreath {
          0%, 100% { transform: translateX(-50%) scaleX(0.95); opacity: 0.22; }
          50%      { transform: translateX(-50%) scaleX(1.08); opacity: 0.32; }
        }
        @keyframes ptGlowPulse {
          0%, 100% { opacity: 1;   transform: scale(1); }
          50%      { opacity: 0.55; transform: scale(0.88); }
        }
        .pt-mesh {
          background-color: #F5F0E8;
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
        .pt-hero-float { animation: ptHeroFloat 6s ease-in-out infinite; will-change: transform; }
        .pt-hero-float-big { animation: ptHeroFloatBig 6s ease-in-out infinite; will-change: transform; }
        .pt-shadow-breath { animation: ptShadowBreath 6s ease-in-out infinite; will-change: transform, opacity; }
        .pt-glow-pulse { animation: ptGlowPulse 3s ease-in-out infinite; will-change: opacity, transform; }
        .pt-sug-scroll::-webkit-scrollbar { display: none; }
        .pt-sug-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        @media (prefers-reduced-motion: reduce) {
          .pt-mesh, .pt-hero-float, .pt-hero-float-big, .pt-shadow-breath, .pt-glow-pulse {
            animation: none !important;
          }
        }
      `}</style>

      <div aria-hidden className="pt-mesh absolute inset-0 z-0 pointer-events-none" />

      {/* Brand-tinted overlay when scooter selected */}
      {selectedScooter && (
        <div
          aria-hidden
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: `radial-gradient(55% 55% at 50% 50%, ${brandAccent}22, transparent 70%)`,
          }}
        />
      )}

      {/* Mobile blurred hero — only in State A (bigger blur for impact) */}
      {!selectedScooter && displayedHero?.image_url && (
        <div
          aria-hidden
          className="absolute inset-0 z-0 flex items-center justify-center lg:hidden pointer-events-none overflow-hidden"
        >
          <img
            src={displayedHero.image_url}
            alt=""
            className="h-[450px] w-auto max-w-none object-contain"
            style={{
              opacity: 0.22,
              filter: "blur(6px)",
              transform: "scale(1.15)",
            }}
            loading="lazy"
          />
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-6xl">
        <AnimatePresence mode="wait" initial={false}>
          {!selectedScooter ? (
            /* ============ STATE A — default hero ============ */
            <motion.div
              key="state-a"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-center lg:min-h-[650px] xl:min-h-[750px]">
                <div className="lg:col-span-7 text-center lg:text-left">
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
                  style={{
                    color: "#4A7C59",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Compatibilité garantie
                </span>
              </motion.div>

              <motion.h1
                {...fadeUp(0.15)}
                className="text-[44px] leading-[0.95] sm:text-6xl lg:text-7xl xl:text-8xl mb-5 lg:mb-7"
                style={{
                  fontFamily: "'Anton', sans-serif",
                  color: "#1A1A1A",
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
                  color: "#6B7280",
                  fontWeight: 500,
                  lineHeight: 1.5,
                }}
              >
                Sélectionne ton modèle — on filtre tout pour toi.
              </motion.p>

              <motion.div
                {...fadeUp(0.45)}
                className="relative max-w-2xl mx-auto lg:mx-0"
              >
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
                      style={{ color: "#6B7280" }}
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
                      aria-label="Rechercher un modèle de trottinette ou une pièce"
                      aria-autocomplete="list"
                      aria-controls="hero-search-suggestions"
                      role="combobox"
                      aria-expanded="true"
                      className="w-full min-h-[56px] lg:min-h-[64px] pl-12 pr-5 lg:pr-6 rounded-xl border border-gray-300 bg-white text-base lg:text-lg focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 shadow-sm"
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        color: "#1A1A1A",
                        ["--tw-ring-color" as string]: "#4A7C59",
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    aria-label="Rechercher"
                    className="min-w-[56px] lg:min-w-[64px] min-h-[56px] lg:min-h-[64px] rounded-xl text-white flex items-center justify-center transition-colors shadow-md"
                    style={{ backgroundColor: "#1A1A1A" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#000000")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "#1A1A1A")
                    }
                  >
                    <ArrowRight
                      className="w-5 h-5 lg:w-6 lg:h-6"
                      strokeWidth={2.5}
                    />
                  </button>
                </form>
              </motion.div>

              <motion.div
                {...fadeUp(0.6)}
                id="hero-search-suggestions"
                role="listbox"
                aria-label={
                  isSearching ? "Résultats de recherche" : "Modèles populaires"
                }
                className="mt-4 lg:mt-5 max-w-2xl mx-auto lg:mx-0 rounded-2xl bg-white border border-gray-200 shadow-xl text-left p-5"
              >
                {showEmpty ? (
                  <div className="py-6 flex flex-col items-center text-center">
                    <p
                      className="text-sm mb-3"
                      style={{
                        color: "#1A1A1A",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      Aucun modèle trouvé pour{" "}
                      <span style={{ color: "#4A7C59" }}>"{debouncedQuery}"</span>.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate("/catalogue")}
                      className="inline-flex items-center gap-1 text-sm font-semibold underline decoration-1 underline-offset-4 hover:decoration-2"
                      style={{
                        color: "#1A1A1A",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      Voir le catalogue complet
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <p
                        className="text-xs lg:text-sm font-bold uppercase tracking-wider inline-flex items-center gap-1.5"
                        style={{
                          color: "#1A1A1A",
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}
                      >
                        {!isSearching ? (
                          <>
                            <Star
                              className="w-3.5 h-3.5 fill-current"
                              style={{ color: "#FF6600" }}
                            />
                            Top du moment
                          </>
                        ) : (
                          <>
                            {filtered.length} modèle
                            {filtered.length > 1 ? "s" : ""} trouvé
                            {filtered.length > 1 ? "s" : ""}
                          </>
                        )}
                      </p>
                      {isSearching && filtered.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/catalogue?search=${encodeURIComponent(
                                debouncedQuery
                              )}`
                            )
                          }
                          className="text-xs lg:text-sm font-semibold inline-flex items-center gap-1 underline decoration-1 underline-offset-4 hover:decoration-2"
                          style={{
                            color: "#1A1A1A",
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                          }}
                        >
                          Voir tous ({filtered.length})
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => scrollByDir(sugScrollRef, -1)}
                        aria-label="Précédent"
                        disabled={!scrollState.canLeft}
                        className="hidden lg:flex absolute left-1 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full items-center justify-center bg-white shadow-lg hover:shadow-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-gray-100"
                        style={{ color: "#1A1A1A" }}
                      >
                        <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollByDir(sugScrollRef, 1)}
                        aria-label="Suivant"
                        disabled={!scrollState.canRight}
                        className="hidden lg:flex absolute right-1 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full items-center justify-center bg-white shadow-lg hover:shadow-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-gray-100"
                        style={{ color: "#1A1A1A" }}
                      >
                        <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
                      </button>

                      <div
                        ref={sugScrollRef}
                        onScroll={updateScrollState}
                        className="pt-sug-scroll flex gap-3 lg:gap-4 overflow-x-auto pb-2"
                        style={{
                          scrollSnapType: "x mandatory",
                          WebkitOverflowScrolling: "touch",
                        }}
                      >
                        {(scootersLoading && visible.length === 0
                          ? Array.from({ length: 4 })
                          : visible
                        ).map((item, idx) => {
                          if (!item) {
                            return (
                              <div
                                key={`sk-${idx}`}
                                className="flex-shrink-0 w-[240px] lg:w-[280px] rounded-2xl bg-white border border-gray-100 shadow-md overflow-hidden animate-pulse"
                                style={{ scrollSnapAlign: "start" }}
                              >
                                <div className="h-40 lg:h-44 bg-gray-100" />
                                <div className="p-3 lg:p-4 space-y-2">
                                  <div className="h-5 bg-gray-100 rounded w-3/4" />
                                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                                  <div className="h-9 bg-gray-100 rounded mt-3" />
                                </div>
                              </div>
                            );
                          }
                          const s = item as ScooterLite;
                          const inGarage = garageIds.has(s.id);
                          return (
                            <div
                              key={s.id}
                              role="option"
                              aria-selected="false"
                              className="flex-shrink-0 w-[240px] lg:w-[280px] rounded-2xl bg-white border border-gray-100 shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden flex flex-col"
                              style={{ scrollSnapAlign: "start" }}
                            >
                              <button
                                type="button"
                                onClick={() => handleSelectModel(s)}
                                aria-label={`Voir ${s.name}`}
                                className="block w-full text-left"
                              >
                                <div
                                  className="h-40 lg:h-44 flex items-center justify-center p-4"
                                  style={{ backgroundColor: "#F5F0E8" }}
                                >
                                  {s.image_url ? (
                                    <img
                                      src={s.image_url}
                                      alt={s.name}
                                      className="max-h-full max-w-full object-contain"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <Bike
                                      className="w-14 h-14 lg:w-16 lg:h-16"
                                      style={{ color: "#6B7280" }}
                                      strokeWidth={1.2}
                                    />
                                  )}
                                </div>
                              </button>

                              <div className="p-3 lg:p-4 flex flex-col flex-1">
                                <h3
                                  className="text-lg lg:text-xl mb-1 leading-tight"
                                  style={{
                                    fontFamily: "'Anton', sans-serif",
                                    color: "#1A1A1A",
                                    letterSpacing: "-0.005em",
                                    textTransform: "uppercase",
                                  }}
                                >
                                  {s.name}
                                </h3>
                                <p
                                  className="text-xs lg:text-sm mb-3"
                                  style={{
                                    color: "#6B7280",
                                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                                  }}
                                >
                                  {s.brand_name || "—"}
                                  {" · "}
                                  {s.compatible_parts_count ?? 0} pièce
                                  {(s.compatible_parts_count ?? 0) > 1 ? "s" : ""}{" "}
                                  compatible
                                  {(s.compatible_parts_count ?? 0) > 1 ? "s" : ""}
                                </p>

                                <div className="mt-auto grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectModel(s);
                                    }}
                                    aria-label={`Voir les pièces de ${s.name}`}
                                    className="inline-flex items-center justify-center gap-1 min-h-[44px] px-3 rounded-lg text-white font-semibold text-sm transition-colors"
                                    style={{
                                      backgroundColor: "#1A1A1A",
                                      fontFamily:
                                        "'Plus Jakarta Sans', sans-serif",
                                    }}
                                    onMouseEnter={(e) =>
                                      (e.currentTarget.style.backgroundColor =
                                        "#000000")
                                    }
                                    onMouseLeave={(e) =>
                                      (e.currentTarget.style.backgroundColor =
                                        "#1A1A1A")
                                    }
                                  >
                                    Pièces
                                    <ArrowRight
                                      className="w-3.5 h-3.5"
                                      strokeWidth={2.5}
                                    />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => handleAddToGarage(s, e)}
                                    disabled={addToGarage.isPending}
                                    aria-label={
                                      inGarage
                                        ? `${s.name} déjà dans le garage`
                                        : `Ajouter ${s.name} au garage`
                                    }
                                    className="inline-flex items-center justify-center gap-1 min-h-[44px] px-2 rounded-lg font-bold text-sm transition-colors disabled:opacity-60"
                                    style={{
                                      backgroundColor: inGarage
                                        ? "rgba(74,124,89,0.12)"
                                        : "#FFFFFF",
                                      color: inGarage ? "#4A7C59" : "#1A1A1A",
                                      border: inGarage
                                        ? "2px solid rgba(74,124,89,0.3)"
                                        : "2px solid #1A1A1A",
                                      fontFamily:
                                        "'Plus Jakarta Sans', sans-serif",
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!inGarage) {
                                        e.currentTarget.style.backgroundColor =
                                          "#1A1A1A";
                                        e.currentTarget.style.color = "white";
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!inGarage) {
                                        e.currentTarget.style.backgroundColor =
                                          "#FFFFFF";
                                        e.currentTarget.style.color = "#1A1A1A";
                                      }
                                    }}
                                  >
                                    {inGarage ? (
                                      <>
                                        <Check
                                          className="w-3.5 h-3.5"
                                          strokeWidth={2.5}
                                        />
                                        Ajouté
                                      </>
                                    ) : (
                                      <>
                                        <Plus
                                          className="w-3.5 h-3.5"
                                          strokeWidth={2.5}
                                        />
                                        Garage
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>

              <motion.button
                {...fadeUp(0.75)}
                type="button"
                onClick={() => navigate("/catalogue")}
                className="mt-6 lg:mt-7 text-sm lg:text-base underline underline-offset-4 transition-colors hover:text-gray-900"
                style={{
                  color: "#6B7280",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 500,
                }}
              >
                Tu connais pas ton modèle ? Voir tout le catalogue →
              </motion.button>
                </div>

                {/* RIGHT col — trotti héros (desktop only, 45%) */}
                <motion.div
                  {...heroEntry}
                  aria-hidden
                  className="hidden lg:flex lg:col-span-5 relative items-center justify-center"
                >
                  <div
                    aria-hidden
                    className="absolute inset-0 m-auto pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(closest-side, rgba(74,124,89,0.12) 0%, transparent 70%)",
                      filter: "blur(120px)",
                    }}
                  />
                  <div
                    aria-hidden
                    className="pt-shadow-breath absolute left-1/2 bottom-12 w-[60%] h-5 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(closest-side, rgba(0,0,0,0.35), transparent 70%)",
                      filter: "blur(40px)",
                    }}
                  />
                  <div
                    aria-hidden
                    className="absolute left-1/2 -translate-x-1/2 bottom-10 w-[72%] pointer-events-none"
                    style={{
                      height: 1,
                      background: "rgba(26,26,26,0.08)",
                    }}
                  />
                  <AnimatePresence mode="wait">
                    {currentHero?.image_url ? (
                      <motion.img
                        key={currentHero.id}
                        src={currentHero.image_url}
                        alt=""
                        initial={prefersReducedMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={prefersReducedMotion ? undefined : { opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className={
                          prefersReducedMotion
                            ? "relative z-10 object-contain w-full max-w-[520px] xl:max-w-[640px] h-[500px] xl:h-[620px]"
                            : "pt-hero-float-big relative z-10 object-contain w-full max-w-[520px] xl:max-w-[640px] h-[500px] xl:h-[620px]"
                        }
                        loading="lazy"
                      />
                    ) : (
                      <motion.div
                        key="fallback"
                        initial={prefersReducedMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={
                          prefersReducedMotion
                            ? "flex justify-center"
                            : "pt-hero-float-big flex justify-center"
                        }
                      >
                        <Bike
                          className="w-40 h-40"
                          style={{ color: "rgba(74,124,89,0.35)" }}
                          strokeWidth={1}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            /* ============ STATE B — scooter selected ============ */
            <motion.div
              key={`state-b-${selectedScooter.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* ====== ZONE 1 — TROTTI HÉROS ====== */}
              <div className="relative">
                {/* Mobile blurred bg scooter image (scoped to zone 1) */}
                {selectedScooter.imageUrl && (
                  <div
                    aria-hidden
                    className="absolute inset-0 lg:hidden flex items-center justify-center pointer-events-none overflow-hidden"
                  >
                    <img
                      src={selectedScooter.imageUrl}
                      alt=""
                      className="w-full max-w-md object-contain"
                      style={{
                        opacity: 0.18,
                        filter: "blur(8px)",
                        transform: "scale(1.1)",
                      }}
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Close / change scooter — top-right of zone 1 */}
                <button
                  type="button"
                  onClick={handleClearSelection}
                  aria-label="Changer de trottinette"
                  className="absolute top-0 right-0 z-30 inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold bg-white/85 backdrop-blur-sm hover:bg-white transition-colors border border-gray-100 shadow-sm"
                  style={{
                    color: "#6B7280",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    minHeight: 36,
                  }}
                >
                  <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                  <span className="hidden sm:inline">Changer de trottinette</span>
                </button>

                {/* 2-col grid (desktop), single col (mobile) */}
                <div className="lg:grid lg:grid-cols-5 lg:gap-8 lg:items-center">
                  {/* LEFT — info text (40%) */}
                  <div className="relative z-10 lg:col-span-2 pr-14 sm:pr-0 py-4 lg:py-8">
                    <div className="inline-flex items-center gap-2 mb-4 lg:mb-5">
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
                        style={{
                          color: "#4A7C59",
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}
                      >
                        Votre trotti · 100% compatible
                      </span>
                    </div>

                    <h1
                      className="text-3xl lg:text-5xl leading-[0.95]"
                      style={{
                        fontFamily: "'Anton', sans-serif",
                        color: "#1A1A1A",
                        letterSpacing: "-0.01em",
                        textTransform: "uppercase",
                      }}
                    >
                      Pour votre
                    </h1>

                    <p
                      className="text-6xl lg:text-8xl my-1 lg:my-2 leading-[0.9] break-words"
                      style={{
                        fontFamily: "'Anton', sans-serif",
                        color: brandAccent,
                        letterSpacing: "-0.02em",
                        textTransform: "uppercase",
                        textShadow: `0 4px 24px ${brandAccent}40`,
                      }}
                    >
                      {selectedScooter.brandName || "—"}
                    </p>

                    <p
                      className="text-3xl lg:text-5xl leading-[0.95] break-words"
                      style={{
                        fontFamily: "'Anton', sans-serif",
                        color: "#1A1A1A",
                        letterSpacing: "-0.01em",
                        textTransform: "uppercase",
                      }}
                    >
                      {selectedScooter.name}
                      {selectedDetails?.year ? (
                        <span
                          className="text-base lg:text-xl ml-2 align-middle"
                          style={{
                            color: "#6B7280",
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontWeight: 500,
                            textTransform: "none",
                          }}
                        >
                          · {selectedDetails.year}
                        </span>
                      ) : null}
                    </p>

                    <p
                      className="mt-4 lg:mt-5 text-sm lg:text-base font-bold uppercase"
                      style={{
                        color: "#4A7C59",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        letterSpacing: "0.12em",
                      }}
                    >
                      {compatCount} pièce{compatCount > 1 ? "s" : ""} compatible
                      {compatCount > 1 ? "s" : ""}
                    </p>

                    {compatCount > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/scooter/${selectedScooter.slug}`)
                        }
                        className="mt-6 lg:mt-8 w-full inline-flex items-center justify-center gap-2 min-h-[52px] lg:min-h-[60px] px-5 rounded-xl text-white font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{
                          backgroundColor: "#1A1A1A",
                          fontFamily: "'Anton', sans-serif",
                          letterSpacing: "0.04em",
                          fontSize: "16px",
                          textTransform: "uppercase",
                          boxShadow: "0 8px 24px -6px rgba(0,0,0,0.35)",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "#000000")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = "#1A1A1A")
                        }
                      >
                        Voir toutes les {compatCount} pièces
                        <ArrowRight
                          className="w-5 h-5 lg:w-6 lg:h-6"
                          strokeWidth={2.5}
                        />
                      </button>
                    )}
                  </div>

                  {/* RIGHT — big scooter image (desktop only, 60%) */}
                  <div className="hidden lg:flex lg:col-span-3 relative items-center justify-center min-h-[440px] xl:min-h-[560px]">
                    <div
                      aria-hidden
                      className="absolute inset-0 m-auto pointer-events-none"
                      style={{
                        background: `radial-gradient(closest-side, ${brandAccent}33 0%, transparent 70%)`,
                        filter: "blur(80px)",
                      }}
                    />
                    <div
                      aria-hidden
                      className="pt-shadow-breath absolute left-1/2 bottom-6 w-[60%] h-14 pointer-events-none"
                      style={{
                        background:
                          "radial-gradient(closest-side, rgba(0,0,0,0.45), transparent 70%)",
                        filter: "blur(40px)",
                      }}
                    />
                    {selectedScooter.imageUrl ? (
                      <img
                        src={selectedScooter.imageUrl}
                        alt={`${selectedScooter.brandName} ${selectedScooter.name}`}
                        className={
                          prefersReducedMotion
                            ? "relative z-10 object-contain h-[400px] xl:h-[560px] max-w-full"
                            : "pt-hero-float-big relative z-10 object-contain h-[400px] xl:h-[560px] max-w-full"
                        }
                        loading="lazy"
                      />
                    ) : (
                      <Bike
                        className="relative z-10 w-40 h-40"
                        style={{ color: "rgba(74,124,89,0.5)" }}
                        strokeWidth={1}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* ====== ZONE 2 — PIÈCES COMPATIBLES ====== */}
              <div
                className="mt-8 lg:mt-14 pt-8 lg:pt-12 -mx-4 px-4 lg:-mx-8 lg:px-8 border-t border-gray-200/70"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(245,240,232,0.4) 0%, rgba(255,255,255,0.5) 100%)",
                }}
              >
                {compatPartsLoading ? (
                  <div className="flex gap-3 lg:gap-4 overflow-x-hidden pb-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={`pk-${i}`}
                        className="flex-shrink-0 w-[160px] md:w-[200px] lg:w-[220px] rounded-2xl bg-white border border-gray-100 shadow-md overflow-hidden animate-pulse"
                      >
                        <div className="h-32 lg:h-40 bg-gray-100" />
                        <div className="p-3 space-y-2">
                          <div className="h-4 bg-gray-100 rounded w-3/4" />
                          <div className="h-6 bg-gray-100 rounded w-1/2 mt-3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : compatCount === 0 || compatParts.length === 0 ? (
                  <div
                    className="rounded-2xl border-2 border-dashed p-6 lg:p-8 text-center"
                    style={{
                      borderColor: "rgba(26,26,26,0.15)",
                      backgroundColor: "rgba(245,240,232,0.5)",
                    }}
                  >
                    <p
                      className="text-sm lg:text-base mb-3"
                      style={{
                        color: "#1A1A1A",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      Aucune pièce compatible recensée pour l'instant.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate("/catalogue")}
                      className="inline-flex items-center gap-1 text-sm lg:text-base font-semibold underline decoration-1 underline-offset-4 hover:decoration-2"
                      style={{
                        color: "#1A1A1A",
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      Voir le catalogue complet
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-end justify-between gap-3 mb-5 lg:mb-7">
                      <h2
                        className="text-2xl lg:text-3xl leading-none"
                        style={{
                          fontFamily: "'Anton', sans-serif",
                          color: "#1A1A1A",
                          letterSpacing: "-0.005em",
                          textTransform: "uppercase",
                        }}
                      >
                        Pièces compatibles
                      </h2>
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/scooter/${selectedScooter.slug}`)
                        }
                        className="text-xs lg:text-sm font-semibold inline-flex items-center gap-1 underline decoration-1 underline-offset-4 hover:decoration-2 whitespace-nowrap"
                        style={{
                          color: "#1A1A1A",
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}
                      >
                        Voir tout ({compatCount})
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => scrollByDir(partsScrollRef, -1)}
                        aria-label="Précédent"
                        disabled={!partsScrollState.canLeft}
                        className="hidden lg:flex absolute -left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full items-center justify-center bg-white shadow-lg hover:shadow-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-gray-100"
                        style={{ color: "#1A1A1A" }}
                      >
                        <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollByDir(partsScrollRef, 1)}
                        aria-label="Suivant"
                        disabled={!partsScrollState.canRight}
                        className="hidden lg:flex absolute -right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full items-center justify-center bg-white shadow-lg hover:shadow-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-gray-100"
                        style={{ color: "#1A1A1A" }}
                      >
                        <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
                      </button>

                      <div
                        ref={partsScrollRef}
                        onScroll={updatePartsScrollState}
                        className="pt-sug-scroll flex gap-3 lg:gap-4 overflow-x-auto pb-3"
                        style={{
                          scrollSnapType: "x mandatory",
                          WebkitOverflowScrolling: "touch",
                        }}
                      >
                        {compatParts.slice(0, 6).map((part, idx) => {
                          const partImg =
                            getPrimaryImage(part.images, part.image_url, "") ||
                            part.image_url;
                          const outOfStock =
                            (part.stock_quantity ?? 0) === 0 ||
                            part.price === null;
                          const badgeBg =
                            idx < 2 ? "#FF6600" : idx < 4 ? "#4A7C59" : "#1A1A1A";
                          return (
                            <div
                              key={part.id}
                              className="relative flex-shrink-0 w-[160px] md:w-[200px] lg:w-[220px] rounded-2xl bg-white border border-gray-100 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col"
                              style={{ scrollSnapAlign: "start" }}
                            >
                              {part.category?.name && (
                                <span
                                  className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                  style={{
                                    backgroundColor: badgeBg,
                                    color: "white",
                                    fontFamily:
                                      "'Plus Jakarta Sans', sans-serif",
                                  }}
                                >
                                  {part.category.name}
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => navigate(`/piece/${part.slug}`)}
                                aria-label={`Voir ${part.name}`}
                                className="block w-full text-left"
                              >
                                <div
                                  className="h-32 lg:h-40 flex items-center justify-center p-3"
                                  style={{ backgroundColor: "#FFFFFF" }}
                                >
                                  {partImg ? (
                                    <img
                                      src={partImg}
                                      alt={part.name}
                                      className="max-h-full max-w-full object-contain"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <Bike
                                      className="w-10 h-10"
                                      style={{ color: "#6B7280" }}
                                      strokeWidth={1.2}
                                    />
                                  )}
                                </div>
                              </button>

                              <div className="p-3 pr-14 flex flex-col flex-1">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/piece/${part.slug}`)}
                                  className="text-left mb-2"
                                >
                                  <p
                                    className="text-sm lg:text-base font-bold leading-tight"
                                    style={{
                                      fontFamily:
                                        "'Plus Jakarta Sans', sans-serif",
                                      color: "#1A1A1A",
                                      display: "-webkit-box",
                                      WebkitBoxOrient: "vertical",
                                      WebkitLineClamp: 2,
                                      overflow: "hidden",
                                    }}
                                  >
                                    {part.name}
                                  </p>
                                </button>

                                <span
                                  className="mt-auto text-xl lg:text-2xl leading-none"
                                  style={{
                                    fontFamily: "'Anton', sans-serif",
                                    color: "#1A1A1A",
                                  }}
                                >
                                  {part.price !== null
                                    ? `${part.price.toFixed(2)} €`
                                    : "—"}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => handleAddPartToCart(part, e)}
                                disabled={outOfStock}
                                aria-label={`Ajouter ${part.name} au panier`}
                                className="absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all hover:scale-[1.05] active:scale-[0.95] disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                                style={{ backgroundColor: "#1A1A1A" }}
                                onMouseEnter={(e) => {
                                  if (!outOfStock)
                                    e.currentTarget.style.backgroundColor =
                                      "#000000";
                                }}
                                onMouseLeave={(e) => {
                                  if (!outOfStock)
                                    e.currentTarget.style.backgroundColor =
                                      "#1A1A1A";
                                }}
                              >
                                <Plus className="w-5 h-5" strokeWidth={2.5} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default HeroSearchFirst;
