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
}

// Parse spec value to number (e.g., "300W" -> 300)
const parseSpecValue = (spec: string): number => {
  return parseInt(spec.replace(/[^\d]/g, "")) || 0;
};

const ScooterCarousel = ({ models, activeIndex, onSelect }: ScooterCarouselProps) => {
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

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

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
    <div className="relative flex flex-col items-center justify-center h-full">
      {/* Subtle background accent - no racing grid */}
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

      {/* Carousel Container - Simple and elegant */}
      <div className="relative w-full max-w-3xl overflow-hidden px-4" ref={emblaRef}>
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
                <div className="relative w-full max-w-[420px] mx-auto h-[380px] lg:h-[420px] flex items-center justify-center">
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
                        ease: [0.25, 0.46, 0.45, 0.94] // easeOutQuad
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
                        className="relative w-full h-[75%] object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.15)]"
                      />
                      
                      {/* Mirror Reflection Effect */}
                      <div className="absolute bottom-0 left-0 right-0 h-[25%] overflow-hidden pointer-events-none">
                        <img
                          src={imageSrc}
                          alt=""
                          className="w-full h-[300%] object-contain opacity-[0.15] blur-[1px]"
                          style={{
                            transform: 'scaleY(-1) translateY(67%)',
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
                        className="absolute left-0 top-1/4 bg-white/90 backdrop-blur-sm border border-mineral/20 rounded-xl px-3 py-2 shadow-lg z-10"
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
                        className="absolute right-0 top-1/3 bg-white/90 backdrop-blur-sm border border-mineral/20 rounded-xl px-3 py-2 shadow-lg z-10"
                      >
                        <div className="flex items-center gap-1.5">
                          <Gauge className="w-4 h-4 text-mineral" />
                          <span className="font-display text-lg text-carbon">
                            {parseSpecValue(model.specs.maxSpeed)}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">km/h</span>
                        </div>
                      </motion.div>

                      {/* Range Badge - Bottom Center */}
                      <motion.div
                        key={`range-${model.id}`}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                        className="absolute left-1/2 -translate-x-1/2 bottom-4 bg-white/90 backdrop-blur-sm border border-mineral/20 rounded-xl px-3 py-2 shadow-lg z-10"
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

      {/* Refined Navigation */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            className="rounded-full w-11 h-11 bg-white/80 border-mineral/20 hover:border-mineral/40 hover:bg-white backdrop-blur-sm transition-all"
          >
            <ChevronLeft className="w-5 h-5 text-carbon" />
          </Button>
        </motion.div>

        {/* Elegant Dots */}
        <div className="flex items-center gap-2">
          {models.slice(0, Math.min(7, models.length)).map((_, index) => (
            <motion.button
              key={index}
              onClick={() => onSelect(index)}
              className={`rounded-full transition-all ${
                index === activeIndex 
                  ? "w-7 h-2.5 bg-mineral" 
                  : "w-2.5 h-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
            />
          ))}
          {models.length > 7 && (
            <span className="text-xs text-muted-foreground ml-1">+{models.length - 7}</span>
          )}
        </div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            className="rounded-full w-11 h-11 bg-white/80 border-mineral/20 hover:border-mineral/40 hover:bg-white backdrop-blur-sm transition-all"
          >
            <ChevronRight className="w-5 h-5 text-carbon" />
          </Button>
        </motion.div>
      </div>

      {/* Refined Info Panel - Clean and Professional */}
      {activeModel && (
        <motion.div 
          key={activeModel.id}
          className="mt-4 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          {/* Brand Badge - Subtle */}
          <motion.div
            className="inline-block px-3 py-0.5 rounded-full bg-white/70 border border-mineral/20 backdrop-blur-sm mb-2"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
              {activeModel.brand}
            </p>
          </motion.div>

          {/* Model Name - Elegant */}
          <motion.h3 
            className="font-display text-2xl lg:text-3xl text-carbon mb-2 tracking-wide"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            {activeModel.name}
          </motion.h3>
          

          {/* Compatible Parts Badge - Refined */}
          <motion.div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 border border-mineral/15 backdrop-blur-sm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 }}
          >
            <span className="text-muted-foreground text-xs">Pièces compatibles:</span>
            <AnimatedNumber 
              value={activeModel.compatibleParts} 
              className="text-mineral font-semibold text-sm"
            />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ScooterCarousel;
