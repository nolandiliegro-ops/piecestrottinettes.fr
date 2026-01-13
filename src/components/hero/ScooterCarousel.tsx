import { useEffect, useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Zap, CircuitBoard, BatteryCharging, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScooterModel, voltageOptions, amperageOptions } from "@/data/scooterData";
import useEmblaCarousel from "embla-carousel-react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedNumber from "@/components/ui/animated-number";
import FavoriteButton from "@/components/garage/FavoriteButton";
import GarageButton from "@/components/garage/GarageButton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandItem, CommandList } from "@/components/ui/command";
import { useBatteryConfigs, getAvailableVoltages, getAvailableAmperages, getDefaultConfig } from "@/hooks/useBatteryConfigs";

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
  const [selectedVoltage, setSelectedVoltage] = useState<number | null>(null);
  const [selectedAmperage, setSelectedAmperage] = useState<number | null>(null);
  const [voltageOpen, setVoltageOpen] = useState(false);
  const [amperageOpen, setAmperageOpen] = useState(false);
  
  const activeModel = models[activeIndex] || models[0];
  
  // Fetch battery configs from database for current model
  const { data: batteryConfigs = [] } = useBatteryConfigs(activeModel?.id || null);
  
  // Get available options based on database configs
  const availableVoltages = useMemo(() => {
    if (batteryConfigs.length === 0) return voltageOptions;
    return getAvailableVoltages(batteryConfigs);
  }, [batteryConfigs]);
  
  const availableAmperages = useMemo(() => {
    if (batteryConfigs.length === 0) return amperageOptions;
    const voltage = selectedVoltage ?? activeModel?.voltage ?? availableVoltages[0] ?? 36;
    return getAvailableAmperages(batteryConfigs, voltage);
  }, [batteryConfigs, selectedVoltage, activeModel?.voltage, availableVoltages]);
  
  // Computed display values - use selected or model default or database default
  const defaultConfig = useMemo(() => getDefaultConfig(batteryConfigs), [batteryConfigs]);
  
  const displayVoltage = selectedVoltage ?? defaultConfig?.voltage ?? activeModel?.voltage ?? 36;
  const displayAmperage = useMemo(() => {
    // If amperage is selected, use it if it's valid for current voltage
    if (selectedAmperage && availableAmperages.includes(selectedAmperage)) {
      return selectedAmperage;
    }
    // Otherwise use default or first available
    if (defaultConfig && displayVoltage === defaultConfig.voltage) {
      return defaultConfig.amperage;
    }
    return availableAmperages[0] ?? activeModel?.amperage ?? 12;
  }, [selectedAmperage, availableAmperages, defaultConfig, displayVoltage, activeModel?.amperage]);
  
  const displayWattage = activeModel ? parseSpecValue(activeModel.specs?.power || "0W") : 0;

  // Track model changes for animation trigger + reset selectors
  useEffect(() => {
    if (activeModel && activeModel.id !== prevActiveId) {
      setPrevActiveId(activeModel.id);
      // Reset to model defaults when changing scooter
      setSelectedVoltage(null);
      setSelectedAmperage(null);
    }
  }, [activeModel, prevActiveId]);
  
  // When voltage changes, reset amperage if it's not valid for new voltage
  useEffect(() => {
    if (selectedVoltage && selectedAmperage && !availableAmperages.includes(selectedAmperage)) {
      setSelectedAmperage(null);
    }
  }, [selectedVoltage, selectedAmperage, availableAmperages]);

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

      {/* Navigation Arrow LEFT - Closer to scooter */}
      <motion.div 
        className="absolute left-8 lg:left-12 xl:left-16 top-1/2 -translate-y-1/2 z-20"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={scrollPrev}
          className="rounded-full w-10 h-10 lg:w-12 lg:h-12 bg-white/90 backdrop-blur-sm border-mineral/20 hover:border-mineral hover:bg-white shadow-lg hover:shadow-xl transition-all"
        >
          <ChevronLeft className="w-5 h-5 text-carbon" />
        </Button>
      </motion.div>

      {/* Navigation Arrow RIGHT - Closer to scooter */}
      <motion.div 
        className="absolute right-8 lg:right-12 xl:right-16 top-1/2 -translate-y-1/2 z-20"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={scrollNext}
          className="rounded-full w-10 h-10 lg:w-12 lg:h-12 bg-white/90 backdrop-blur-sm border-mineral/20 hover:border-mineral hover:bg-white shadow-lg hover:shadow-xl transition-all"
        >
          <ChevronRight className="w-5 h-5 text-carbon" />
        </Button>
      </motion.div>

      {/* Dashboard Specs Bar - Compact, positioned to not overlap buttons */}
      <motion.div 
        key={`specs-bar-${activeModel?.id}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="absolute bottom-[8%] lg:bottom-[10%] left-1/2 -translate-x-1/2 z-30"
      >
        <div className="flex items-center gap-2 lg:gap-3 bg-white/95 backdrop-blur-md border border-mineral/20 rounded-xl px-3 lg:px-4 py-2 lg:py-2.5 shadow-lg">
          
          {/* Voltage - INTERACTIVE */}
          <Popover open={voltageOpen} onOpenChange={setVoltageOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1 hover:bg-mineral/5 rounded-md px-1.5 py-0.5 transition-colors group cursor-pointer">
                <CircuitBoard className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-amber-500" />
                <div className="flex items-baseline gap-0.5">
                  <AnimatedNumber 
                    value={displayVoltage}
                    className="font-display text-base lg:text-lg text-carbon"
                  />
                  <span className="text-[10px] text-muted-foreground font-medium">V</span>
                </div>
                <ChevronDown className="w-2.5 h-2.5 text-muted-foreground group-hover:text-carbon transition-colors" />
              </button>
            </PopoverTrigger>
          <PopoverContent className="w-24 p-1 bg-white border border-mineral/20 shadow-lg" align="center" sideOffset={8}>
            <Command>
              <CommandList>
                {availableVoltages.map((v) => (
                  <CommandItem
                    key={v}
                    onSelect={() => {
                      setSelectedVoltage(v);
                      setVoltageOpen(false);
                    }}
                    className={`cursor-pointer text-sm ${displayVoltage === v ? 'bg-mineral/10 font-semibold' : ''}`}
                  >
                    {v}V
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Divider */}
        <div className="h-5 w-px bg-mineral/20" />

        {/* Amperage - INTERACTIVE with dynamic filtering */}
        <Popover open={amperageOpen} onOpenChange={setAmperageOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1 hover:bg-mineral/5 rounded-md px-1.5 py-0.5 transition-colors group cursor-pointer">
              <BatteryCharging className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-green-500" />
              <div className="flex items-baseline gap-0.5">
                <AnimatedNumber 
                  value={displayAmperage}
                  className="font-display text-base lg:text-lg text-carbon"
                />
                <span className="text-[10px] text-muted-foreground font-medium">Ah</span>
              </div>
              <ChevronDown className="w-2.5 h-2.5 text-muted-foreground group-hover:text-carbon transition-colors" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-24 p-1 bg-white border border-mineral/20 shadow-lg" align="center" sideOffset={8}>
            <Command>
              <CommandList>
                {availableAmperages.map((a) => (
                  <CommandItem
                    key={a}
                    onSelect={() => {
                      setSelectedAmperage(a);
                      setAmperageOpen(false);
                    }}
                    className={`cursor-pointer text-sm ${displayAmperage === a ? 'bg-mineral/10 font-semibold' : ''}`}
                  >
                    {a}Ah
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

          {/* Divider */}
          <div className="h-5 w-px bg-mineral/20" />

          {/* Wattage - FIXED (non-interactive) */}
          <div className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-yellow-500" />
            <div className="flex items-baseline gap-0.5">
              <AnimatedNumber 
                value={displayWattage}
                className="font-display text-base lg:text-lg text-carbon"
              />
              <span className="text-[10px] text-muted-foreground font-medium">W</span>
            </div>
          </div>
        </div>
      </motion.div>

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
                  {/* MASSIVE Scooter Container - Maximum Showroom Impact */}
                  <div className="relative w-full max-w-[800px] lg:max-w-[950px] mx-auto h-[560px] lg:h-[680px] xl:h-[750px] flex items-center justify-center">
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
                          className="relative w-full h-[80%] object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.15)]"
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

                    {/* Floating Spec Badges removed - Now in Dashboard bar below */}
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
