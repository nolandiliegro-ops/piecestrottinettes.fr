import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScooterModel } from "@/data/scooterData";
import useEmblaCarousel from "embla-carousel-react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedNumber from "@/components/ui/animated-number";

// Import scooter images
import xiaomiMiPro2 from "@/assets/scooters/xiaomi-mi-pro-2.png";
import xiaomiMiEssential from "@/assets/scooters/xiaomi-mi-essential.png";
import xiaomiMi3 from "@/assets/scooters/xiaomi-mi-3.png";
import ninebotG30Max from "@/assets/scooters/ninebot-g30-max.png";
import ninebotF40 from "@/assets/scooters/ninebot-f40.png";
import segwayP100s from "@/assets/scooters/segway-p100s.png";
import segwayNinebotMaxG2 from "@/assets/scooters/segway-ninebot-max-g2.png";
import dualtronThunder from "@/assets/scooters/dualtron-thunder.png";
import dualtronVictor from "@/assets/scooters/dualtron-victor.png";
import kaaboMantisPro from "@/assets/scooters/kaabo-mantis-pro.png";
import kaaboWolfWarrior from "@/assets/scooters/kaabo-wolf-warrior.png";

// Image mapping for scooter models
const scooterImages: Record<string, string> = {
  "mi-pro-2": xiaomiMiPro2,
  "mi-essential": xiaomiMiEssential,
  "mi-3": xiaomiMi3,
  "g30-max": ninebotG30Max,
  "f40": ninebotF40,
  "p100s": segwayP100s,
  "ninebot-max-g2": segwayNinebotMaxG2,
  "thunder": dualtronThunder,
  "victor": dualtronVictor,
  "mantis-pro": kaaboMantisPro,
  "wolf-warrior": kaaboWolfWarrior,
};

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
    <div className="relative flex flex-col items-center justify-center h-full -translate-x-12 lg:-translate-x-20">
      {/* Arc Background */}
      <div className="absolute inset-0 arc-gradient pointer-events-none" />

      {/* Carousel */}
      <div className="relative w-full max-w-lg lg:max-w-xl overflow-hidden" ref={emblaRef}>
        <div className="flex items-center">
          {models.map((model, index) => {
            const isActive = index === activeIndex;
            const distance = Math.abs(index - activeIndex);
            const scale = isActive ? 1 : Math.max(0.6, 1 - distance * 0.15);
            const opacity = isActive ? 1 : Math.max(0.4, 1 - distance * 0.25);

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
                <div className="relative w-96 h-96 lg:w-[480px] lg:h-[480px] xl:w-[580px] xl:h-[580px] flex items-center justify-center -ml-8 lg:-ml-16">
                  {/* Luxury Reveal Animation */}
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={model.id}
                      src={imageSrc}
                      alt={`${model.brand} ${model.name}`}
                      className="w-full h-full object-contain drop-shadow-2xl"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ 
                        duration: 0.4, 
                        ease: [0.25, 0.46, 0.45, 0.94] // easeOutQuad
                      }}
                    />
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className="flex items-center justify-center gap-4 mt-2">
        <Button
          variant="outline"
          size="icon"
          onClick={scrollPrev}
          className="rounded-full w-10 h-10 border-foreground/20 hover:border-primary hover:bg-primary/10"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        {/* Pagination Dots */}
        <div className="flex items-center gap-2">
          {models.slice(0, Math.min(5, models.length)).map((_, index) => (
            <button
              key={index}
              onClick={() => onSelect(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === activeIndex 
                  ? "w-6 bg-primary" 
                  : "bg-foreground/20 hover:bg-foreground/40"
              }`}
            />
          ))}
          {models.length > 5 && (
            <span className="text-xs text-muted-foreground ml-1">+{models.length - 5}</span>
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={scrollNext}
          className="rounded-full w-10 h-10 border-foreground/20 hover:border-primary hover:bg-primary/10"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Active Model Info with Animated Numbers */}
      {activeModel && (
        <motion.div 
          key={activeModel.id}
          className="mt-2 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.p 
            className="text-xs text-muted-foreground font-medium tracking-wide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {activeModel.brand}
          </motion.p>
          <motion.h3 
            className="font-display text-2xl lg:text-3xl text-foreground"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            {activeModel.name}
          </motion.h3>
          
          {/* Animated Specs */}
          <motion.div 
            className="flex items-center justify-center gap-4 mt-1 text-xs text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="flex items-center gap-1">
              <AnimatedNumber 
                value={parseSpecValue(activeModel.specs.power)} 
                suffix="W" 
                className="font-medium text-foreground"
              />
            </span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
            <span className="flex items-center gap-1">
              <AnimatedNumber 
                value={parseSpecValue(activeModel.specs.maxSpeed)} 
                suffix="km/h" 
                className="font-medium text-foreground"
              />
            </span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
            <span className="flex items-center gap-1">
              <AnimatedNumber 
                value={parseSpecValue(activeModel.specs.range)} 
                suffix="km" 
                className="font-medium text-foreground"
              />
            </span>
          </motion.div>

          <motion.p 
            className="text-primary font-medium text-sm mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            <AnimatedNumber value={activeModel.compatibleParts} /> pièces compatibles
          </motion.p>

          {/* CTA - Specific to selected model with smooth scroll */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button 
              variant="outline"
              onClick={() => {
                document.getElementById('bento-discovery')?.scrollIntoView({ 
                  behavior: 'smooth' 
                });
              }}
              className="mt-2 rounded-full px-4 py-2 font-display text-base tracking-wide gap-2 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all"
            >
              VOIR LES {activeModel.compatibleParts} PIÈCES
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ScooterCarousel;
