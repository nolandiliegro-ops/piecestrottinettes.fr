import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Zap, Gauge, Battery } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScooterModel } from "@/data/scooterData";
import useEmblaCarousel from "embla-carousel-react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedNumber from "@/components/ui/animated-number";
import FavoriteButton from "@/components/garage/FavoriteButton";
import GarageButton from "@/components/garage/GarageButton";

// Centralized image mapping
import { scooterImages } from "@/lib/scooterImageMapping";

interface ScooterCarouselProps {
  models: ScooterModel[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  totalModels?: number;
  currentIndex?: number;
}

// Parse spec value to number (e.g., "300W" -> 300)
const parseSpecValue = (spec: string): number => {
  return parseInt(spec.replace(/[^\d]/g, "")) || 0;
};

const ScooterCarousel = ({ 
  models, 
  activeIndex, 
  onSelect,
  onNavigatePrev,
  onNavigateNext,
  totalModels = 0,
  currentIndex = 0,
}: ScooterCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    skipSnaps: false,
  });

  const [prevActiveId, setPrevActiveId] = useState<string | null>(null);
  const activeModel = models[activeIndex] || models[0];

  // Track model changes for animation trigger
  useEffect(() => {
    if (activeModel && activeModel.id !== prevActiveId) {
      setPrevActiveId(activeModel.id);
    }
  }, [activeModel, prevActiveId]);

  useEffect(() => {
    if (emblaApi) {
      emblaApi.on("select", () => {
        onSelect(emblaApi.selectedScrollSnap());
      });
    }
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (emblaApi && activeIndex !== emblaApi.selectedScrollSnap()) {
      emblaApi.scrollTo(activeIndex);
    }
  }, [emblaApi, activeIndex]);

  const scrollPrev = () => {
    emblaApi?.scrollPrev();
    onNavigatePrev?.();
  };
  
  const scrollNext = () => {
    emblaApi?.scrollNext();
    onNavigateNext?.();
  };

  if (models.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <div className="text-6xl mb-4">🔍</div>
        <p className="text-lg text-muted-foreground text-center">
          Aucun modèle trouvé
        </p>
        <p className="text-sm text-muted-foreground/70 text-center mt-2">
          Essayez une autre recherche
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center h-full w-full">
      {/* Background Text Effect - TROTTINETTE - Studio depth effect */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none">
        <span 
          className="font-display text-[6rem] sm:text-[8rem] lg:text-[12rem] xl:text-[16rem] 
                     text-muted-foreground/[0.03] tracking-[0.2em] whitespace-nowrap uppercase"
          style={{ transform: 'translateY(-5%)' }}
        >
          TROTTINETTE
        </span>
      </div>

      {/* Subtle background accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
        <div 
          className="absolute inset-0 bg-gradient-to-b from-mineral/20 via-transparent to-transparent"
        />
      </div>

      {/* Soft spotlight effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 50% 35% at 50% 50%, rgba(147,181,161,0.08) 0%, transparent 70%)"
        }}
      />

      {/* Navigation Arrow LEFT - Outside carousel */}
      <motion.div 
        className="absolute left-0 lg:-left-4 xl:-left-8 top-1/2 -translate-y-1/2 z-20"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={scrollPrev}
          className="rounded-full w-12 h-12 lg:w-14 lg:h-14 bg-white/90 backdrop-blur-sm border-mineral/20 hover:border-mineral hover:bg-white shadow-lg hover:shadow-xl transition-all"
        >
          <ChevronLeft className="w-6 h-6 text-carbon" />
        </Button>
      </motion.div>

      {/* Navigation Arrow RIGHT - Outside carousel */}
      <motion.div 
        className="absolute right-0 lg:-right-4 xl:-right-8 top-1/2 -translate-y-1/2 z-20"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={scrollNext}
          className="rounded-full w-12 h-12 lg:w-14 lg:h-14 bg-white/90 backdrop-blur-sm border-mineral/20 hover:border-mineral hover:bg-white shadow-lg hover:shadow-xl transition-all"
        >
          <ChevronRight className="w-6 h-6 text-carbon" />
        </Button>
      </motion.div>

      {/* Counter at bottom center */}
      <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 z-20">
        <span className="text-sm text-muted-foreground font-medium bg-white/80 px-4 py-1.5 rounded-full backdrop-blur-sm shadow-sm border border-mineral/10">
          {currentIndex + 1} / {totalModels}
        </span>
      </div>

      {/* Main Layout: Carousel */}
      <div className="relative flex items-center justify-center w-full h-full px-16 lg:px-20">
        {/* Carousel Container - BIGGER scooter */}
        <div className="relative w-full max-w-5xl overflow-hidden" ref={emblaRef}>
          <div className="flex items-center">
            {models.map((model, index) => {
              const isActive = index === activeIndex;
              const distance = Math.abs(index - activeIndex);
              const scale = isActive ? 1 : Math.max(0.7, 1 - distance * 0.15);
              const opacity = isActive ? 1 : Math.max(0.3, 1 - distance * 0.25);

              // Get the image from our mapping, fallback to model.image
              const imageSrc = scooterImages[model.id] || model.image;

              return (
                <div
                  key={model.id}
                  className="flex-shrink-0 w-full flex items-center justify-center px-4"
                  style={{
                    transform: `scale(${scale})`,
                    opacity,
                    transition: "transform 0.5s ease-out, opacity 0.5s ease-out",
                  }}
                >
                  {/* MUCH BIGGER Scooter Container */}
                  <div className="relative w-full max-w-[650px] mx-auto h-[500px] lg:h-[580px] flex items-center justify-center">
                    {/* Favorite & Garage Buttons */}
                    <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                      <FavoriteButton
                        scooterSlug={model.id}
                        scooterName={`${model.brand} ${model.name}`}
                      />
                      <GarageButton
                        scooterSlug={model.id}
                        scooterName={`${model.brand} ${model.name}`}
                      />
                    </div>
                    
                    {/* Elegant Reveal Animation - Subtle */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={model.id}
                        className="relative w-full h-full"
                        initial={{ 
                          opacity: 0, 
                          scale: 0.95,
                          y: 10
                        }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1,
                          y: 0
                        }}
                        exit={{ 
                          opacity: 0, 
                          scale: 0.95,
                          y: -10
                        }}
                        transition={{ 
                          duration: 0.5, 
                          ease: [0.25, 0.46, 0.45, 0.94]
                        }}
                      >
                        {/* Subtle glow effect */}
                        <div
                          className="absolute inset-0 blur-2xl opacity-20"
                          style={{
                            background: "radial-gradient(ellipse at center, rgba(147,181,161,0.3) 0%, transparent 60%)"
                          }}
                        />
                        
                        <img
                          src={imageSrc}
                          alt={`${model.brand} ${model.name}`}
                          className="relative w-full h-[78%] object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.15)]"
                        />
                        
                        {/* Mirror Reflection Effect */}
                        <div className="absolute bottom-0 left-0 right-0 h-[22%] overflow-hidden pointer-events-none">
                          <img
                            src={imageSrc}
                            alt=""
                            className="w-full h-[355%] object-contain opacity-[0.15] blur-[1px]"
                            style={{
                              transform: 'scaleY(-1) translateY(72%)',
                              maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 80%)',
                              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 80%)'
                            }}
                          />
                        </div>
                      </motion.div>
                    </AnimatePresence>

                    {/* Floating Spec Badges */}
                    {isActive && (
                      <>
                        {/* Power Badge - Top Left */}
                        <motion.div
                          key={`power-${model.id}`}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                          className="absolute left-4 top-[28%] bg-white/90 backdrop-blur-sm border border-mineral/20 rounded-xl px-3 py-2 shadow-lg z-10"
                        >
                          <div className="flex items-center gap-1.5">
                            <Zap className="w-4 h-4 text-mineral" />
                            <span className="font-display text-lg text-carbon">
                              {parseSpecValue(model.specs.power)}
                            </span>
                            <span className="text-xs text-muted-foreground font-medium">W</span>
                          </div>
                        </motion.div>

                        {/* Speed Badge - Middle Right */}
                        <motion.div
                          key={`speed-${model.id}`}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                          className="absolute right-4 top-[35%] bg-white/90 backdrop-blur-sm border border-mineral/20 rounded-xl px-3 py-2 shadow-lg z-10"
                        >
                          <div className="flex items-center gap-1.5">
                            <Gauge className="w-4 h-4 text-mineral" />
                            <span className="font-display text-lg text-carbon">
                              {parseSpecValue(model.specs.maxSpeed)}
                            </span>
                            <span className="text-xs text-muted-foreground font-medium">km/h</span>
                          </div>
                        </motion.div>

                        {/* Range Badge - Above reflection */}
                        <motion.div
                          key={`range-${model.id}`}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                          className="absolute left-1/2 -translate-x-1/2 bottom-[28%] bg-white/90 backdrop-blur-sm border border-mineral/20 rounded-xl px-3 py-2 shadow-lg z-10"
                        >
                          <div className="flex items-center gap-1.5">
                            <Battery className="w-4 h-4 text-mineral" />
                            <span className="font-display text-lg text-carbon">
                              {parseSpecValue(model.specs.range)}
                            </span>
                            <span className="text-xs text-muted-foreground font-medium">km</span>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScooterCarousel;
