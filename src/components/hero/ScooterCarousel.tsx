import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScooterModel } from "@/data/scooterData";
import useEmblaCarousel from "embla-carousel-react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import AnimatedNumber from "@/components/ui/animated-number";
import AddToGarageButton from "@/components/garage/AddToGarageButton";

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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const activeModel = models[activeIndex] || models[0];

  // Motion values for parallax and depth effects
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [5, -5]);
  const rotateY = useTransform(mouseX, [-300, 300], [-5, 5]);

  // Track model changes for animation trigger
  useEffect(() => {
    if (activeModel && activeModel.id !== prevActiveId) {
      setIsTransitioning(true);
      setPrevActiveId(activeModel.id);
      
      // Reset transition state after animation
      const timer = setTimeout(() => setIsTransitioning(false), 600);
      return () => clearTimeout(timer);
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
    setIsTransitioning(true);
    emblaApi?.scrollPrev();
  };
  
  const scrollNext = () => {
    setIsTransitioning(true);
    emblaApi?.scrollNext();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseX.set(x);
    mouseY.set(y);
  };

  if (models.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <div className="text-6xl mb-4">🔍</div>
        <p className="text-lg text-greige/70 text-center">
          Aucun modèle trouvé
        </p>
        <p className="text-sm text-greige/50 text-center mt-2">
          Essayez une autre recherche
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center h-full">
      {/* Forza-style Racing Grid Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(0deg, transparent 24%, rgba(147,181,161,0.1) 25%, rgba(147,181,161,0.1) 26%, transparent 27%, transparent 74%, rgba(147,181,161,0.1) 75%, rgba(147,181,161,0.1) 76%, transparent 77%, transparent),
              linear-gradient(90deg, transparent 24%, rgba(147,181,161,0.1) 25%, rgba(147,181,161,0.1) 26%, transparent 27%, transparent 74%, rgba(147,181,161,0.1) 75%, rgba(147,181,161,0.1) 76%, transparent 77%, transparent)
            `,
            backgroundSize: "50px 50px",
            transform: "perspective(500px) rotateX(60deg)",
            transformOrigin: "center bottom"
          }}
        />
      </div>

      {/* Spotlight Effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(147,181,161,0.15) 0%, transparent 70%)",
            "radial-gradient(ellipse 65% 45% at 50% 50%, rgba(147,181,161,0.2) 0%, transparent 70%)",
            "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(147,181,161,0.15) 0%, transparent 70%)",
          ]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Carousel Container with Parallax */}
      <motion.div
        className="relative w-full max-w-2xl overflow-hidden"
        ref={emblaRef}
        onMouseMove={handleMouseMove}
        style={{
          perspective: "1200px",
        }}
      >
        <div className="flex items-center">
          {models.map((model, index) => {
            const isActive = index === activeIndex;
            const distance = Math.abs(index - activeIndex);
            const scale = isActive ? 1 : Math.max(0.5, 1 - distance * 0.2);
            const opacity = isActive ? 1 : Math.max(0.2, 1 - distance * 0.3);

            // Get the image from our mapping, fallback to model.image
            const imageSrc = scooterImages[model.id] || model.image;

            return (
              <div
                key={model.id}
                className="flex-shrink-0 w-full flex items-center justify-center px-8"
                style={{
                  transform: `scale(${scale})`,
                  opacity,
                  transition: "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.6s ease-out",
                }}
              >
                <motion.div 
                  className="relative w-full h-[500px] flex items-center justify-center"
                  style={{
                    rotateX: isActive ? rotateX : 0,
                    rotateY: isActive ? rotateY : 0,
                  }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                >
                  {/* Add to Garage Button */}
                  <AddToGarageButton
                    scooterId={model.id}
                    scooterName={`${model.brand} ${model.name}`}
                    className="absolute top-4 right-4 z-10 bg-mineral/20 backdrop-blur-md border-mineral/30 hover:bg-mineral/30"
                  />
                  
                  {/* Gran Turismo-style Reveal Animation */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={model.id}
                      className="relative w-full h-full"
                      initial={{ 
                        opacity: 0, 
                        scale: 0.8,
                        rotateY: -30,
                        filter: "blur(10px)"
                      }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1,
                        rotateY: 0,
                        filter: "blur(0px)"
                      }}
                      exit={{ 
                        opacity: 0, 
                        scale: 0.8,
                        rotateY: 30,
                        filter: "blur(10px)"
                      }}
                      transition={{ 
                        duration: 0.7, 
                        ease: [0.34, 1.56, 0.64, 1] // easeOutBack
                      }}
                    >
                      {/* Glow effect behind scooter */}
                      <motion.div
                        className="absolute inset-0 blur-3xl"
                        animate={{
                          background: [
                            "radial-gradient(ellipse at center, rgba(147,181,161,0.3) 0%, transparent 60%)",
                            "radial-gradient(ellipse at center, rgba(147,181,161,0.5) 0%, transparent 60%)",
                            "radial-gradient(ellipse at center, rgba(147,181,161,0.3) 0%, transparent 60%)",
                          ]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                      
                      <img
                        src={imageSrc}
                        alt={`${model.brand} ${model.name}`}
                        className="relative w-full h-full object-contain drop-shadow-[0_20px_60px_rgba(147,181,161,0.4)]"
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* Speed lines effect during transition */}
                  {isTransitioning && isActive && (
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.3, 0] }}
                      transition={{ duration: 0.6 }}
                    >
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute h-[2px] bg-gradient-to-r from-transparent via-mineral to-transparent"
                          style={{
                            top: `${20 + i * 10}%`,
                            left: 0,
                            right: 0,
                          }}
                          initial={{ x: "-100%", opacity: 0 }}
                          animate={{ x: "100%", opacity: [0, 1, 0] }}
                          transition={{
                            duration: 0.5,
                            delay: i * 0.05,
                            ease: "easeOut"
                          }}
                        />
                      ))}
                    </motion.div>
                  )}
                </motion.div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Racing-style Navigation */}
      <div className="flex items-center justify-center gap-6 mt-8">
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            className="rounded-full w-12 h-12 bg-greige/10 border-mineral/30 hover:border-mineral hover:bg-mineral/20 backdrop-blur-md transition-all"
          >
            <ChevronLeft className="w-6 h-6 text-greige" />
          </Button>
        </motion.div>

        {/* Racing Dots */}
        <div className="flex items-center gap-2">
          {models.slice(0, Math.min(7, models.length)).map((_, index) => (
            <motion.button
              key={index}
              onClick={() => onSelect(index)}
              className={`rounded-full transition-all ${
                index === activeIndex 
                  ? "w-8 h-3 bg-mineral shadow-[0_0_20px_rgba(147,181,161,0.6)]" 
                  : "w-3 h-3 bg-greige/30 hover:bg-greige/50"
              }`}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
          {models.length > 7 && (
            <span className="text-xs text-greige/50 ml-2 font-mono">+{models.length - 7}</span>
          )}
        </div>

        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            className="rounded-full w-12 h-12 bg-greige/10 border-mineral/30 hover:border-mineral hover:bg-mineral/20 backdrop-blur-md transition-all"
          >
            <ChevronRight className="w-6 h-6 text-greige" />
          </Button>
        </motion.div>
      </div>

      {/* Gran Turismo-style Info Panel */}
      {activeModel && (
        <motion.div 
          key={activeModel.id}
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Brand Badge */}
          <motion.div
            className="inline-block px-4 py-1 rounded-full bg-mineral/20 border border-mineral/30 backdrop-blur-md mb-3"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-xs text-greige font-medium tracking-widest uppercase">
              {activeModel.brand}
            </p>
          </motion.div>

          {/* Model Name */}
          <motion.h3 
            className="font-display text-4xl lg:text-5xl text-greige mb-4 tracking-wide"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            {activeModel.name}
          </motion.h3>
          
          {/* Performance Stats - Racing HUD Style */}
          <motion.div 
            className="flex items-center justify-center gap-6 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {/* Power */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-mineral">
                <Zap className="w-4 h-4" />
                <AnimatedNumber 
                  value={parseSpecValue(activeModel.specs.power)} 
                  className="font-mono text-xl font-bold"
                />
                <span className="text-sm font-mono">W</span>
              </div>
              <span className="text-xs text-greige/50 uppercase tracking-wide">Power</span>
            </div>

            <div className="w-px h-8 bg-greige/20" />

            {/* Speed */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-mineral">
                <AnimatedNumber 
                  value={parseSpecValue(activeModel.specs.maxSpeed)} 
                  className="font-mono text-xl font-bold"
                />
                <span className="text-sm font-mono">km/h</span>
              </div>
              <span className="text-xs text-greige/50 uppercase tracking-wide">Top Speed</span>
            </div>

            <div className="w-px h-8 bg-greige/20" />

            {/* Range */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-mineral">
                <AnimatedNumber 
                  value={parseSpecValue(activeModel.specs.range)} 
                  className="font-mono text-xl font-bold"
                />
                <span className="text-sm font-mono">km</span>
              </div>
              <span className="text-xs text-greige/50 uppercase tracking-wide">Range</span>
            </div>
          </motion.div>

          {/* Compatible Parts Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-greige/10 border border-greige/20 backdrop-blur-md mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45 }}
          >
            <span className="text-greige/70 text-sm">Pièces compatibles:</span>
            <AnimatedNumber 
              value={activeModel.compatibleParts} 
              className="text-mineral font-bold text-lg"
            />
          </motion.div>

          {/* CTA Button - Forza Style */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button 
              onClick={() => {
                document.getElementById('bento-discovery')?.scrollIntoView({ 
                  behavior: 'smooth' 
                });
              }}
              className="rounded-full px-8 py-6 font-display text-lg tracking-widest gap-3 bg-mineral text-carbon hover:bg-mineral/90 hover:scale-105 transition-all shadow-[0_0_30px_rgba(147,181,161,0.4)] hover:shadow-[0_0_50px_rgba(147,181,161,0.6)]"
            >
              EXPLORER LES PIÈCES
              <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ScooterCarousel;
