import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { Skeleton } from "@/components/ui/skeleton";
import GamingCarouselCard from "./GamingCarouselCard";

interface Part {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  image_url: string | null;
  stock_quantity: number | null;
  difficulty_level: number | null;
}

interface GamingCarouselProps {
  parts: Part[];
  activeModelName?: string;
  isLoading?: boolean;
}

const GamingCarouselSkeleton = () => (
  <div 
    className="relative w-full py-16 md:py-20"
    style={{
      background: "linear-gradient(180deg, #FAFAF8 0%, #F5F3F0 100%)",
      minHeight: "600px",
    }}
  >
    <div className="flex items-center justify-center gap-8 md:gap-10 lg:gap-12 px-5 md:px-10 lg:px-20">
      {[0.85, 0.9, 1, 1.4, 1, 0.9, 0.85].map((scale, i) => (
        <Skeleton 
          key={i} 
          className="rounded-2xl bg-white/30 flex-shrink-0"
          style={{
            width: scale === 1.4 ? "240px" : scale === 1 ? "200px" : scale === 0.9 ? "180px" : "160px",
            height: scale === 1.4 ? "400px" : "320px",
            opacity: scale === 1.4 ? 1 : scale === 1 ? 0.8 : scale === 0.9 ? 0.6 : 0.5,
          }}
        />
      ))}
    </div>
  </div>
);

const GamingCarousel = ({ parts, activeModelName, isLoading }: GamingCarouselProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    slidesToScroll: 1,
    containScroll: false,
    skipSnaps: false,
  });

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

  if (isLoading) {
    return <GamingCarouselSkeleton />;
  }

  if (parts.length === 0) {
    return (
      <div 
        className="relative w-full overflow-hidden flex flex-col items-center justify-center py-20"
        style={{
          background: "linear-gradient(180deg, #F5F3F0 0%, #D5D3CE 100%)",
          minHeight: "400px",
        }}
      >
        <Sparkles className="w-16 h-16 text-mineral mb-4" />
        <p className="text-carbon/60 text-lg">Aucune pièce compatible trouvée</p>
      </div>
    );
  }

  // Calculate dynamic width based on distance from center
  const getCardWidth = (distance: number) => {
    if (distance === 0) return "240px";   // Central - will be 336px with 1.4 scale
    if (distance === 1) return "200px";   // Adjacent
    if (distance === 2) return "180px";   // Éloigné proche
    return "160px";                        // Très éloigné
  };

  return (
    <div 
      className="relative w-full gaming-carousel-container"
      style={{
        background: "linear-gradient(180deg, #FAFAF8 0%, #F5F3F0 100%)",
        minHeight: "600px",
      }}
    >
      {/* Subtle Grid Background */}
      <div className="gaming-grid-bg-light" />

      {/* Header with model name */}
      {activeModelName && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pt-10 pb-6 relative z-10"
        >
          <span className="text-carbon/50 text-sm uppercase tracking-widest">
            Pour votre
          </span>
          <h3 className="text-carbon font-display text-xl md:text-2xl tracking-wide">
            {activeModelName}
          </h3>
        </motion.div>
      )}

      {/* Navigation Arrow Left - 80px glassmorphism */}
      <motion.button
        onClick={scrollPrev}
        className="absolute left-4 md:left-8 lg:left-10 top-1/2 -translate-y-1/2 z-20"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Produit précédent"
      >
        <div 
          className="nav-arrow-glass w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 flex items-center justify-center rounded-full transition-all duration-300"
          style={{
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.4)",
            boxShadow: "0 8px 32px rgba(26, 26, 26, 0.12), 0 0 0 1px rgba(147, 181, 161, 0.1)",
          }}
        >
          <ChevronLeft className="w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-carbon" />
        </div>
      </motion.button>

      {/* Navigation Arrow Right - 80px glassmorphism */}
      <motion.button
        onClick={scrollNext}
        className="absolute right-4 md:right-8 lg:right-10 top-1/2 -translate-y-1/2 z-20"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Produit suivant"
      >
        <div 
          className="nav-arrow-glass w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 flex items-center justify-center rounded-full transition-all duration-300"
          style={{
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.4)",
            boxShadow: "0 8px 32px rgba(26, 26, 26, 0.12), 0 0 0 1px rgba(147, 181, 161, 0.1)",
          }}
        >
          <ChevronRight className="w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-carbon" />
        </div>
      </motion.button>

      {/* Carousel - overflow visible for edge-cut products */}
      <div className="py-8 md:py-10 lg:py-12 px-5 md:px-10 lg:px-20">
        <div 
          className="overflow-visible" 
          ref={emblaRef}
          style={{
            clipPath: "inset(-100px 0)",
          }}
        >
          <div className="flex gap-8 md:gap-10 lg:gap-12 items-center justify-center">
            {parts.map((part, index) => {
              const distanceFromCenter = Math.abs(index - selectedIndex);
              const wrappedDistance = Math.min(
                distanceFromCenter,
                parts.length - distanceFromCenter
              );
              
              return (
                <div 
                  key={part.id} 
                  className="flex-shrink-0 transition-all duration-[600ms] ease-out"
                  style={{
                    width: getCardWidth(wrappedDistance),
                  }}
                >
                  <GamingCarouselCard
                    part={part}
                    isCenter={wrappedDistance === 0}
                    distanceFromCenter={wrappedDistance}
                    index={index}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-2 pb-10">
        {parts.slice(0, Math.min(parts.length, 10)).map((_, index) => (
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
        {parts.length > 10 && (
          <span className="text-carbon/40 text-xs ml-2">+{parts.length - 10}</span>
        )}
      </div>

      {/* Counter */}
      <div className="absolute bottom-4 right-6 text-carbon/30 text-sm font-mono">
        {selectedIndex + 1} / {parts.length}
      </div>
    </div>
  );
};

export default GamingCarousel;
