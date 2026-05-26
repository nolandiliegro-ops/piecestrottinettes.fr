import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Bike, LayoutGrid, ArrowRight, ChevronLeft, ChevronRight, Plus, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useAddToGarage, useUserGarage } from "@/hooks/useGarage";
import FavoriteButton from "@/components/garage/FavoriteButton";
import { getBrandColors } from "@/contexts/ScooterContext";

interface PopularScooter {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  year: number | null;
  compatible_parts_count: number | null;
  brand_name: string | null;
}

const usePopularScooters = () =>
  useQuery({
    queryKey: ["popular_scooters_home"],
    queryFn: async (): Promise<PopularScooter[]> => {
      const SELECT = `id, name, slug, image_url, year, compatible_parts_count, brand:brands(name)`;

      const { data: featured, error: e1 } = await supabase
        .from("scooter_models")
        .select(SELECT)
        .eq("published", true)
        .eq("is_featured_home", true)
        .order("created_at", { ascending: false });

      if (e1) throw e1;

      let data = featured;
      if (!data || data.length === 0) {
        const { data: fallback, error: e2 } = await supabase
          .from("scooter_models")
          .select(SELECT)
          .eq("published", true)
          .order("created_at", { ascending: false })
          .limit(8);
        if (e2) throw e2;
        data = fallback;
      }

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

const usePublishedPartsCount = () =>
  useQuery({
    queryKey: ["published_parts_count_home"],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("parts")
        .select("*", { count: "exact", head: true })
        .eq("published", true);
      if (error) throw error;
      return count || 0;
    },
    staleTime: 5 * 60 * 1000,
  });

const ScooterCarousel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: garageItems = [] } = useUserGarage();
  const addToGarage = useAddToGarage();
  const { data: scooters = [], isLoading } = usePopularScooters();
  const { data: partsCount, isLoading: partsCountLoading } =
    usePublishedPartsCount();

  const goToScooter = (s: PopularScooter) => navigate(`/showroom/${s.slug}`);

  const garageIds = useMemo(
    () => new Set(garageItems.map((g) => g.scooter_model_id)),
    [garageItems]
  );

  const handleAddToGarage = (s: PopularScooter, e: React.MouseEvent) => {
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

  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({
    progress: 0,
    canLeft: false,
    canRight: true,
  });

  const updateState = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const progress = max > 0 ? el.scrollLeft / max : 0;
    setScrollState({
      progress,
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
    return () => window.removeEventListener("resize", onResize);
  }, [scooters.length]);

  const scrollByDir = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const w = window.innerWidth;
    const card = w >= 1024 ? 340 : w >= 768 ? 300 : 272;
    el.scrollBy({ left: dir * card * 2, behavior: "smooth" });
  };

  return (
    <section className="py-10 lg:py-14" style={{ backgroundColor: "#FAFAF8" }}>
      <style>{`
        .pt-carousel::-webkit-scrollbar { display: none; }
        .pt-carousel { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="mx-auto max-w-6xl">
        <div className="px-4 mb-6 lg:mb-10 flex items-end justify-between gap-4">
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl"
            style={{
              fontFamily: "'Anton', sans-serif",
              color: "#1A1A1A",
              letterSpacing: "-0.01em",
              textTransform: "uppercase",
            }}
          >
            Les plus populaires
          </h2>
          <button
            onClick={() => navigate("/trottinettes")}
            className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold underline decoration-1 underline-offset-4 hover:decoration-2"
            style={{
              color: "#1A1A1A",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Tous les modèles
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="relative">
          {/* Arrow buttons - desktop only (touch handles itself on mobile) */}
          <button
            type="button"
            onClick={() => scrollByDir(-1)}
            aria-label="Précédent"
            disabled={!scrollState.canLeft}
            className="hidden lg:flex absolute -left-2 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full items-center justify-center bg-white shadow-md hover:shadow-xl transition-all duration-200 motion-safe:hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-100"
            style={{ color: "#1A1A1A" }}
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={() => scrollByDir(1)}
            aria-label="Suivant"
            disabled={!scrollState.canRight}
            className="hidden lg:flex absolute -right-2 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full items-center justify-center bg-white shadow-md hover:shadow-xl transition-all duration-200 motion-safe:hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-100"
            style={{ color: "#1A1A1A" }}
          >
            <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
          </button>

          <div
            ref={scrollRef}
            onScroll={updateState}
            className="pt-carousel flex gap-3 lg:gap-5 px-4 overflow-x-auto pb-3"
            style={{
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
              scrollPaddingLeft: "1rem",
            }}
          >
            {(isLoading ? Array.from({ length: 4 }) : scooters).map(
              (scooter, idx) => {
                if (!scooter) {
                  return (
                    <div
                      key={`skeleton-${idx}`}
                      className="flex-shrink-0 w-[260px] md:w-[280px] lg:w-[320px] rounded-2xl bg-white shadow-md p-4 animate-pulse"
                      style={{ scrollSnapAlign: "start", minHeight: 460 }}
                    >
                      <div className="h-5 w-24 bg-gray-200 rounded-full mb-3" />
                      <div className="h-[220px] lg:h-[280px] bg-gray-200 rounded-xl mb-3" />
                      <div className="h-6 bg-gray-200 rounded mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                    </div>
                  );
                }
                const s = scooter as PopularScooter;
                const brandColors = getBrandColors(s.brand_name);
                const brandLabel = (s.brand_name || "").trim();
                const inGarage = garageIds.has(s.id);
                const partsCount = s.compatible_parts_count ?? 0;
                return (
                  <div
                    key={s.id}
                    className="relative flex-shrink-0 w-[260px] md:w-[280px] lg:w-[320px] rounded-2xl bg-white shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden flex flex-col motion-safe:hover:-translate-y-0.5"
                    style={{ scrollSnapAlign: "start" }}
                  >
                    <div className="absolute top-3 right-3 z-10">
                      <FavoriteButton scooterSlug={s.slug} scooterName={s.name} />
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(`/showroom/${s.slug}`)}
                      aria-label={`Voir ${s.name}`}
                      className="block w-full text-left"
                    >
                      <div className="px-4 pt-4">
                        {brandLabel && (
                          <span
                            className="inline-block rounded-full px-3 py-1 text-xs text-white font-bold uppercase tracking-wider"
                            style={{
                              backgroundColor: brandColors.accent,
                              fontFamily: "'Plus Jakarta Sans', sans-serif",
                            }}
                          >
                            {brandLabel}
                          </span>
                        )}
                      </div>
                      <div className="h-[220px] lg:h-[280px] flex items-center justify-center px-4 py-3">
                        {s.image_url ? (
                          <img
                            src={s.image_url}
                            alt={s.name}
                            className="max-h-full max-w-full object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <Bike
                            className="w-16 h-16 lg:w-20 lg:h-20"
                            style={{ color: "#6B7280" }}
                            strokeWidth={1.2}
                          />
                        )}
                      </div>
                    </button>

                    <div className="px-4 pb-4 flex flex-col flex-1">
                      <h3
                        className="text-xl lg:text-2xl xl:text-3xl mb-1 leading-tight"
                        style={{
                          fontFamily: "'Anton', sans-serif",
                          color: "#1A1A1A",
                          letterSpacing: "-0.02em",
                          textTransform: "uppercase",
                        }}
                      >
                        {s.name}
                      </h3>
                      <p
                        className="text-sm mb-4"
                        style={{
                          color: "#6B7280",
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}
                      >
                        {partsCount > 0
                          ? `${partsCount} pièce${partsCount > 1 ? "s" : ""} compatible${partsCount > 1 ? "s" : ""}`
                          : "Pièces à venir"}
                        {s.year ? ` · ${s.year}` : ""}
                      </p>

                      <div className="mt-auto grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            goToScooter(s);
                          }}
                          aria-label={`Voir les pièces compatibles de ${s.name}`}
                          className="inline-flex items-center justify-center gap-1 min-h-[44px] px-2 rounded-lg text-white font-semibold text-sm transition-colors"
                          style={{
                            backgroundColor: "#1A1A1A",
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = "#000000")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = "#1A1A1A")
                          }
                        >
                          <span>Pièces</span>
                          {s.compatible_parts_count != null &&
                            s.compatible_parts_count > 0 && (
                              <span className="px-1 py-0.5 rounded bg-white/25 text-[10px] font-bold">
                                {s.compatible_parts_count}
                              </span>
                            )}
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
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                          }}
                          onMouseEnter={(e) => {
                            if (!inGarage) {
                              e.currentTarget.style.backgroundColor = "#1A1A1A";
                              e.currentTarget.style.color = "white";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!inGarage) {
                              e.currentTarget.style.backgroundColor = "#FFFFFF";
                              e.currentTarget.style.color = "#1A1A1A";
                            }
                          }}
                        >
                          {inGarage ? (
                            <>
                              <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                              Ajouté
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                              Garage
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
            )}

            {/* Bypass catalogue card */}
            <button
              onClick={() => navigate("/catalogue")}
              className="flex-shrink-0 w-[260px] md:w-[280px] lg:w-[320px] rounded-2xl p-5 flex flex-col items-center justify-center text-center motion-safe:hover:-translate-y-0.5 transition-all duration-200"
              style={{
                scrollSnapAlign: "start",
                backgroundColor: "transparent",
                border: "2px dashed #1A1A1A",
                minHeight: 460,
              }}
              aria-label="Voir tout le catalogue"
            >
              <div
                className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: "#1A1A1A" }}
              >
                <LayoutGrid className="w-7 h-7 text-white" strokeWidth={2} />
              </div>
              <h3
                className="text-xl lg:text-2xl mb-2"
                style={{
                  fontFamily: "'Anton', sans-serif",
                  color: "#1A1A1A",
                  letterSpacing: "-0.005em",
                  textTransform: "uppercase",
                }}
              >
                Tout voir
              </h3>
              <p
                className="text-xs lg:text-sm mb-4 max-w-[180px]"
                style={{
                  color: "#6B7280",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  lineHeight: 1.4,
                }}
              >
                Browse l'intégralité du catalogue sans sélectionner
              </p>
              <div
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold"
                style={{
                  backgroundColor: "#1A1A1A",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                <span>
                  {partsCountLoading || partsCount == null
                    ? "Catalogue complet"
                    : `Catalogue complet ${partsCount}`}
                </span>
                <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </div>
            </button>
          </div>

          {/* Progress bar */}
          <div className="mx-4 mt-3 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(26,26,26,0.08)" }}>
            <div
              className="h-full rounded-full transition-[width] duration-200 ease-out"
              style={{
                width: `${Math.max(8, Math.min(100, scrollState.progress * 100))}%`,
                backgroundColor: "#1A1A1A",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScooterCarousel;
