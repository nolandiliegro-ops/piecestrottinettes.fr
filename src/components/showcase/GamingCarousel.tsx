import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, RotateCcw } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { Skeleton } from "@/components/ui/skeleton";
import GamingCarouselCard from "./GamingCarouselCard";
import QuickViewModal from "./QuickViewModal";
import { useIsCompatibleWithSelected } from "@/hooks/useIsCompatibleWithSelected";

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

interface GamingCarouselProps {
  parts: Part[];
  activeModelName?: string;
  activeBrandSlug?: string;
  isLoading?: boolean;
}

const CATEGORIES = ["Tous", "Freinage", "Pneus", "Chambres à Air", "Batteries", "Chargeurs", "Accessoires"];

const GamingCarouselSkeleton = () => (
  <div 
    className="relative w-full py-16 md:py-20" 
    style={{
      background: "linear-gradient(180deg, #FAFAF8 0%, #F5F3F0 100%)",
      minHeight: "600px"
    }}
  >
    <div className="flex items-center justify-center gap-6 md:gap-8 px-5 md:px-10 lg:px-20">
      {[0.9, 1, 1.15, 1, 0.9].map((scale, i) => (
        <Skeleton 
          key={i} 
          className="rounded-3xl bg-white/30 flex-shrink-0" 
          style={{
            width: scale >= 1.1 ? "320px" : scale === 1 ? "280px" : "260px",
            height: scale >= 1.1 ? "420px" : "380px",
            opacity: scale >= 1.1 ? 1 : scale === 1 ? 0.8 : 0.6
          }} 
        />
      ))}
    </div>
  </div>
);

const GamingCarousel = ({
  parts,
  activeModelName,
  activeBrandSlug,
  isLoading
}: GamingCarouselProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [showQuickView, setShowQuickView] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Tous");

  // Filter parts by category (must be before embla init for shouldLoop)
  const filteredParts = useMemo(() => {
    if (activeCategory === "Tous") return parts;
    return parts.filter(p => p.category?.name === activeCategory);
  }, [parts, activeCategory]);
  
  const shouldLoop = filteredParts.length > 1;

  // Virtual loop: duplicate slides when too few to fill viewport
  const displayParts = useMemo(() => {
    if (filteredParts.length > 0 && filteredParts.length < 8) {
      return [...filteredParts, ...filteredParts];
    }
    return filteredParts;
  }, [filteredParts]);
  
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: shouldLoop,
    align: "center",
    slidesToScroll: 1,
    containScroll: false,
    skipSnaps: false
  });

  const { isCompatible, selectedScooter } = useIsCompatibleWithSelected(selectedPart?.id || "");

  // Reset carousel on category change
  const handleCategoryChange = useCallback((cat: string) => {
    setActiveCategory(cat);
    setSelectedIndex(0);
    // Small delay to let the DOM update before scrolling
    setTimeout(() => emblaApi?.scrollTo(0), 50);
  }, [emblaApi]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Force re-mount handled by key prop on embla container

  const handleCardClick = useCallback((index: number, part: Part) => {
    const realIndex = index % filteredParts.length;
    if (index === selectedIndex) {
      setSelectedPart(part);
      setShowQuickView(true);
    } else {
      emblaApi?.scrollTo(index);
    }
  }, [emblaApi, selectedIndex, filteredParts.length]);

  const handleQuickView = useCallback((part: Part) => {
    setSelectedPart(part);
    setShowQuickView(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowQuickView(false);
    setSelectedPart(null);
  }, []);

  if (isLoading) {
    return <GamingCarouselSkeleton />;
  }

  if (parts.length === 0) {
    return (
      <div 
        className="relative w-full overflow-hidden flex flex-col items-center justify-center py-20" 
        style={{
          background: "linear-gradient(180deg, #F5F3F0 0%, #D5D3CE 100%)",
          minHeight: "400px"
        }}
      >
        <Sparkles className="w-16 h-16 text-mineral mb-4" />
        <p className="text-carbon/60 text-lg">Aucune pièce compatible trouvée</p>
      </div>
    );
  }

  const getCardWidth = () => "280px";

  return (
    <div 
      className="relative w-full overflow-hidden gaming-carousel-container" 
      style={{
        background: "linear-gradient(180deg, #FAFAF8 0%, #F5F3F0 100%)",
      }}
    >
      <div className="gaming-grid-bg-light" />

      {/* Category Filters */}
      <div className="flex items-center justify-center gap-2 flex-wrap px-5 pt-8 pb-4">
        {CATEGORIES.map((cat) => (
          <motion.button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              activeCategory === cat
                ? "bg-mineral text-white shadow-[0_4px_16px_rgba(147,181,161,0.4)]"
                : "text-carbon/70 hover:text-carbon"
            }`}
            style={activeCategory !== cat ? {
              background: "rgba(255, 255, 255, 0.6)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "1px solid rgba(26, 26, 26, 0.08)",
            } : undefined}
          >
            {cat}
          </motion.button>
        ))}
      </div>

      {/* Empty filtered state */}
      {filteredParts.length === 0 && parts.length > 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Sparkles className="w-12 h-12 text-mineral/40" />
          <p className="text-carbon/50 text-base">Aucune pièce dans cette catégorie</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleCategoryChange("Tous")}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-mineral/10 text-mineral text-sm font-medium hover:bg-mineral/20 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Réinitialiser
          </motion.button>
        </div>
      ) : (
        <>
          {/* Navigation Arrows - hidden for single product */}
          {filteredParts.length > 1 && (
          <motion.button 
            onClick={scrollPrev} 
            className="absolute left-4 md:left-8 lg:left-10 top-1/2 -translate-y-1/2 z-20"
            whileHover={{ scale: 1.1 }} 
            whileTap={{ scale: 0.95 }} 
            aria-label="Produit précédent"
          >
            <div 
              className="nav-arrow-glass w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full transition-all duration-300" 
              style={{
                background: "rgba(255, 255, 255, 0.85)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(255, 255, 255, 0.4)",
                boxShadow: "0 8px 32px rgba(26, 26, 26, 0.12), 0 0 0 1px rgba(147, 181, 161, 0.1)"
              }}
            >
              <ChevronLeft className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-carbon" />
            </div>
          </motion.button>
          )}

          {/* Navigation Arrow Right */}
          {filteredParts.length > 1 && (
          <motion.button
            onClick={scrollNext} 
            className="absolute right-4 md:right-8 lg:right-10 top-1/2 -translate-y-1/2 z-20" 
            whileHover={{ scale: 1.1 }} 
            whileTap={{ scale: 0.95 }} 
            aria-label="Produit suivant"
          >
            <div 
              className="nav-arrow-glass w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full transition-all duration-300" 
              style={{
                background: "rgba(255, 255, 255, 0.85)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(255, 255, 255, 0.4)",
                boxShadow: "0 8px 32px rgba(26, 26, 26, 0.12), 0 0 0 1px rgba(147, 181, 161, 0.1)"
              }}
            >
              <ChevronRight className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-carbon" />
            </div>
          </motion.button>
          )}

          {/* Carousel */}
          <div className="py-20 md:py-20 lg:py-24 px-5 md:px-10 lg:px-20 overflow-hidden">
            <div 
              className="overflow-hidden"
              ref={emblaRef}
              key={`${activeCategory}-${filteredParts.length}`}
            >
              <div className="flex gap-6 md:gap-8 lg:gap-10 items-center">
                {displayParts.map((part, index) => {
                  const distanceFromCenter = Math.abs(index - selectedIndex);
                  const wrappedDistance = Math.min(distanceFromCenter, displayParts.length - distanceFromCenter);
                  
                  return (
                    <div 
                      key={`${part.id}-${index}`} 
                      className="flex-shrink-0 transition-all duration-[600ms] ease-out" 
                      style={{ width: getCardWidth() }}
                    >
                      <GamingCarouselCard 
                        part={part} 
                        isCenter={wrappedDistance === 0} 
                        distanceFromCenter={wrappedDistance} 
                        index={index}
                        onCardClick={handleCardClick}
                        onQuickView={() => handleQuickView(part)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Pagination Dots - hidden for single product */}
          {filteredParts.length > 1 && (
          <div className="flex justify-center gap-2 pb-8">
            {filteredParts.slice(0, Math.min(filteredParts.length, 10)).map((_, index) => (
              <button 
                key={index} 
                onClick={() => emblaApi?.scrollTo(index)} 
                className={`transition-all duration-300 rounded-full ${
                  index === selectedIndex 
                    ? "w-8 h-2 bg-mineral shadow-[0_0_12px_rgba(147,181,161,0.6)]" 
                    : "w-2 h-2 bg-carbon/20 hover:bg-carbon/40"
                }`} 
                aria-label={`Aller au produit ${index + 1}`} 
              />
            ))}
            {filteredParts.length > 10 && (
              <span className="text-carbon/40 text-xs ml-2">+{filteredParts.length - 10}</span>
            )}
          </div>
          )}

          {/* Counter */}
          {filteredParts.length > 1 && (
          <div className="absolute bottom-4 right-6 text-carbon/30 text-sm font-mono">
            {selectedIndex + 1} / {filteredParts.length}
          </div>
          )}
        </>
      )}

      {/* Shared Quick View Modal */}
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

export default GamingCarousel;
