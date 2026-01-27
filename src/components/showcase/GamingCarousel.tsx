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
    className="relative w-full rounded-2xl overflow-hidden py-12"
    style={{
      background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)",
      minHeight: "500px",
    }}
  >
    <div className="flex items-center justify-center gap-4 px-16">
      {[...Array(5)].map((_, i) => (
        <Skeleton 
          key={i} 
          className={`rounded-2xl bg-white/5 flex-shrink-0 ${
            i === 2 ? "w-[280px] h-[400px]" : "w-[240px] h-[360px]"
          }`} 
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
        className="relative w-full rounded-2xl overflow-hidden flex flex-col items-center justify-center py-20"
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)",
          minHeight: "400px",
        }}
      >
        <Sparkles className="w-16 h-16 text-mineral mb-4" />
        <p className="text-white/60 text-lg">Aucune pièce compatible trouvée</p>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full rounded-2xl overflow-hidden gaming-carousel-container"
      style={{
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)",
      }}
    >
      {/* Neon Grid Background */}
      <div className="gaming-grid-bg" />

      {/* Header with model name */}
      {activeModelName && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pt-8 pb-4 relative z-10"
        >
          <span className="text-white/40 text-sm uppercase tracking-widest">
            Pour votre
          </span>
          <h3 className="text-white font-display text-xl md:text-2xl tracking-wide">
            {activeModelName}
          </h3>
        </motion.div>
      )}

      {/* Navigation Arrow Left */}
      <motion.button
        onClick={scrollPrev}
        className="absolute left-2 md:left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 gaming-nav-btn"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Produit précédent"
      >
        <div 
          className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full transition-all duration-300"
          style={{
            background: "rgba(147, 181, 161, 0.1)",
            border: "2px solid rgba(147, 181, 161, 0.4)",
            boxShadow: "0 0 20px rgba(147, 181, 161, 0.2), inset 0 0 20px rgba(147, 181, 161, 0.1)",
          }}
        >
          <ChevronLeft className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-mineral" />
        </div>
      </motion.button>

      {/* Navigation Arrow Right */}
      <motion.button
        onClick={scrollNext}
        className="absolute right-2 md:right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 gaming-nav-btn"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Produit suivant"
      >
        <div 
          className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-full transition-all duration-300"
          style={{
            background: "rgba(147, 181, 161, 0.1)",
            border: "2px solid rgba(147, 181, 161, 0.4)",
            boxShadow: "0 0 20px rgba(147, 181, 161, 0.2), inset 0 0 20px rgba(147, 181, 161, 0.1)",
          }}
        >
          <ChevronRight className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-mineral" />
        </div>
      </motion.button>

      {/* Carousel */}
      <div className="py-8 md:py-12 px-4 md:px-16 lg:px-20">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4 md:gap-6">
            {parts.map((part, index) => {
              // Calculate distance from center for depth effect
              const distanceFromCenter = Math.abs(index - selectedIndex);
              const wrappedDistance = Math.min(
                distanceFromCenter,
                parts.length - distanceFromCenter
              );
              
              return (
                <div 
                  key={part.id} 
                  className="flex-shrink-0 transition-all duration-500"
                  style={{
                    width: "clamp(200px, 22vw, 280px)",
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
      <div className="flex justify-center gap-2 pb-8">
        {parts.slice(0, Math.min(parts.length, 10)).map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={`transition-all duration-300 rounded-full ${
              index === selectedIndex 
                ? "w-8 h-2 bg-mineral shadow-[0_0_10px_rgba(147,181,161,0.6)]" 
                : "w-2 h-2 bg-white/20 hover:bg-white/40"
            }`}
            aria-label={`Aller au produit ${index + 1}`}
          />
        ))}
        {parts.length > 10 && (
          <span className="text-white/40 text-xs ml-2">+{parts.length - 10}</span>
        )}
      </div>

      {/* Counter */}
      <div className="absolute bottom-4 right-4 text-white/30 text-sm font-mono">
        {selectedIndex + 1} / {parts.length}
      </div>
    </div>
  );
};

export default GamingCarousel;
