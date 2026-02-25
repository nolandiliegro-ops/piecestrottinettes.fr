import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { Skeleton } from "@/components/ui/skeleton";
import StudioCarouselCard from "./StudioCarouselCard";
import QuickViewModal from "./QuickViewModal";
import { useIsCompatibleWithSelected } from "@/hooks/useIsCompatibleWithSelected";
import { cn } from "@/lib/utils";

interface Part {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  image_url: string | null;
  stock_quantity: number | null;
  difficulty_level: number | null;
  description?: string | null;
  category?: {
    id: string;
    name: string;
    icon: string | null;
    slug: string;
  } | null;
}

interface StudioProductCarouselProps {
  parts: Part[];
  activeModelName?: string;
  activeBrandSlug?: string;
  isLoading?: boolean;
}

const FILTER_CATEGORIES = [
  { label: "Tous", value: null },
  { label: "Freinage", value: "Freinage" },
  { label: "Pneus", value: "Pneus" },
  { label: "Chambres à Air", value: "Chambres à Air" },
  { label: "Batteries", value: "Batteries" },
  { label: "Chargeurs", value: "Chargeurs" },
  { label: "Accessoires", value: "Accessoires" },
];

const StudioCarouselSkeleton = () => (
  <div className="relative w-full py-12" style={{ minHeight: "560px" }}>
    <div className="flex items-center justify-center gap-6 px-5 md:px-10 lg:px-20">
      {[0.85, 0.95, 1, 0.95, 0.85].map((s, i) => (
        <Skeleton
          key={i}
          className="rounded-2xl bg-white/30 flex-shrink-0"
          style={{
            width: s === 1 ? "280px" : "240px",
            height: s === 1 ? "380px" : "340px",
            opacity: s,
          }}
        />
      ))}
    </div>
  </div>
);

const StudioProductCarousel = ({
  parts,
  activeModelName,
  activeBrandSlug,
  isLoading,
}: StudioProductCarouselProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [showQuickView, setShowQuickView] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [carouselKey, setCarouselKey] = useState(0);

  // Filter parts
  const filteredParts = useMemo(() => {
    if (!activeFilter) return parts;
    return parts.filter(
      (p) => p.category?.name?.toLowerCase() === activeFilter.toLowerCase()
    );
  }, [parts, activeFilter]);

  // Re-init carousel when filter changes
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: filteredParts.length > 3,
    align: "center",
    slidesToScroll: 1,
    containScroll: false,
    skipSnaps: false,
  });

  const { isCompatible, selectedScooter } = useIsCompatibleWithSelected(
    selectedPart?.id || ""
  );

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  // Reset carousel on filter change
  useEffect(() => {
    setCarouselKey((k) => k + 1);
    setSelectedIndex(0);
  }, [activeFilter]);

  const handleCardClick = useCallback(
    (index: number, part: Part) => {
      if (index === selectedIndex) {
        setSelectedPart(part);
        setShowQuickView(true);
      } else {
        emblaApi?.scrollTo(index);
      }
    },
    [emblaApi, selectedIndex]
  );

  const handleCloseModal = useCallback(() => {
    setShowQuickView(false);
    setSelectedPart(null);
  }, []);

  const handleFilterChange = (value: string | null) => {
    setActiveFilter(value);
  };

  if (isLoading) return <StudioCarouselSkeleton />;

  if (parts.length === 0) {
    return (
      <div
        className="relative w-full flex flex-col items-center justify-center py-20"
        style={{ minHeight: "400px" }}
      >
        <Sparkles className="w-16 h-16 text-mineral mb-4" />
        <p className="text-carbon/60 text-lg">Aucune pièce compatible trouvée</p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Filter Bar */}
      <div className="flex justify-center px-4 mb-6 lg:mb-8">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {FILTER_CATEGORIES.map((cat) => {
            const isActive = activeFilter === cat.value;
            return (
              <motion.button
                key={cat.label}
                onClick={() => handleFilterChange(cat.value)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all duration-300",
                  isActive
                    ? "bg-mineral text-white shadow-[0_4px_16px_rgba(147,181,161,0.4)]"
                    : "text-carbon/60 hover:text-carbon/90"
                )}
                style={
                  !isActive
                    ? {
                        background: "rgba(255,255,255,0.6)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(255,255,255,0.4)",
                      }
                    : undefined
                }
              >
                {cat.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Carousel with AnimatePresence */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`carousel-${activeFilter ?? "all"}`}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative"
          style={{ minHeight: "480px" }}
        >
          {filteredParts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-carbon/40 text-sm">Aucune pièce dans cette catégorie</p>
            </div>
          ) : (
            <>
              {/* Nav Left */}
              <motion.button
                onClick={scrollPrev}
                className="absolute left-2 md:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-20 hidden md:block"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Produit précédent"
              >
                <div
                  className="w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center rounded-full"
                  style={{
                    background: "rgba(255,255,255,0.85)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255,255,255,0.4)",
                    boxShadow: "0 8px 32px rgba(26,26,26,0.1)",
                  }}
                >
                  <ChevronLeft className="w-6 h-6 lg:w-7 lg:h-7 text-carbon" />
                </div>
              </motion.button>

              {/* Nav Right */}
              <motion.button
                onClick={scrollNext}
                className="absolute right-2 md:right-6 lg:right-8 top-1/2 -translate-y-1/2 z-20 hidden md:block"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Produit suivant"
              >
                <div
                  className="w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center rounded-full"
                  style={{
                    background: "rgba(255,255,255,0.85)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255,255,255,0.4)",
                    boxShadow: "0 8px 32px rgba(26,26,26,0.1)",
                  }}
                >
                  <ChevronRight className="w-6 h-6 lg:w-7 lg:h-7 text-carbon" />
                </div>
              </motion.button>

              {/* Embla Carousel */}
              <div className="px-4 md:px-12 lg:px-20">
                <div
                  className="overflow-visible"
                  ref={emblaRef}
                  key={carouselKey}
                  style={{ clipPath: "inset(-60px 0)" }}
                >
                  <div className="flex gap-5 md:gap-6 lg:gap-8 items-center">
                    {filteredParts.map((part, index) => {
                      const distanceFromCenter = Math.abs(index - selectedIndex);
                      const wrappedDistance = Math.min(
                        distanceFromCenter,
                        filteredParts.length - distanceFromCenter
                      );

                      return (
                        <div
                          key={part.id}
                          className="flex-shrink-0 transition-all duration-500 ease-out"
                          style={{ width: "280px" }}
                        >
                          <StudioCarouselCard
                            part={part}
                            isCenter={wrappedDistance === 0}
                            distanceFromCenter={wrappedDistance}
                            index={index}
                            onCardClick={handleCardClick}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Pagination Dots */}
              <div className="flex justify-center gap-2 mt-6">
                {filteredParts.slice(0, Math.min(filteredParts.length, 10)).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => emblaApi?.scrollTo(i)}
                    className={cn(
                      "transition-all duration-300 rounded-full",
                      i === selectedIndex
                        ? "w-8 h-2 bg-mineral shadow-[0_0_12px_rgba(147,181,161,0.5)]"
                        : "w-2 h-2 bg-carbon/15 hover:bg-carbon/30"
                    )}
                    aria-label={`Aller au produit ${i + 1}`}
                  />
                ))}
                {filteredParts.length > 10 && (
                  <span className="text-carbon/30 text-xs ml-1">
                    +{filteredParts.length - 10}
                  </span>
                )}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Quick View Modal */}
      {selectedPart && (
        <QuickViewModal
          part={selectedPart}
          isOpen={showQuickView}
          onClose={handleCloseModal}
          isCompatible={isCompatible}
          selectedScooterName={selectedScooter?.name}
          heroScooterName={activeModelName}
          heroBrandSlug={activeBrandSlug}
        />
      )}
    </div>
  );
};

export default StudioProductCarousel;
