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
import { cn } from "@/lib/utils";

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
      {/* Background Text Effect - TROTTINETTE - Hidden on mobile */}
      <div className="absolute inset-0 hidden lg:flex items-center justify-center pointer-events-none overflow-hidden select-none">
        <span 
          className="font-display text-[12rem] xl:text-[16rem] 
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

      {/* Navigation Arrow LEFT - Hidden on mobile */}
      <motion.div 
        className="absolute left-8 lg:left-12 xl:left-16 top-1/2 -translate-y-1/2 z-20 hidden lg:block"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={scrollPrev}
          className="rounded-full w-12 h-12 bg-white/90 backdrop-blur-sm border-mineral/20 hover:border-mineral hover:bg-white shadow-lg hover:shadow-xl transition-all"
        >
          <ChevronLeft className="w-5 h-5 text-carbon" />
        </Button>
      </motion.div>

      {/* Navigation Arrow RIGHT - Hidden on mobile */}
      <motion.div 
        className="absolute right-8 lg:right-12 xl:right-16 top-1/2 -translate-y-1/2 z-20 hidden lg:block"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={scrollNext}
          className="rounded-full w-12 h-12 bg-white/90 backdrop-blur-sm border-mineral/20 hover:border-mineral hover:bg-white shadow-lg hover:shadow-xl transition-all"
        >
          <ChevronRight className="w-5 h-5 text-carbon" />
        </Button>
      </motion.div>

      {/* FLOATING SPECS - Centre de l'image de la trottinette */}
      <motion.div 
        key={`specs-floating-${activeModel?.id}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="absolute top-[32%] lg:top-[28%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-30"
      >
        <div className="flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-2.5 
                        bg-white/90 backdrop-blur-md rounded-xl border border-mineral/15 
                        shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
          
          {/* Voltage avec label */}
          <Popover open={voltageOpen} onOpenChange={setVoltageOpen}>
            <PopoverTrigger asChild>
              <button className="flex flex-col items-center gap-1 hover:bg-mineral/5 rounded-lg px-2 py-1 transition-colors group cursor-pointer">
                <span className="text-[9px] lg:text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Volt</span>
                <div className="flex items-center gap-1">
                  <CircuitBoard className="w-4 h-4 lg:w-5 lg:h-5 text-amber-500" />
                  <AnimatedNumber 
                    value={displayVoltage}
                    className="font-display text-lg lg:text-xl text-carbon"
                  />
                  <span className="text-xs text-muted-foreground font-medium">V</span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-carbon transition-colors" />
                </div>
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
          <div className="h-10 w-px bg-mineral/20" />

          {/* Amperage avec label */}
          <Popover open={amperageOpen} onOpenChange={setAmperageOpen}>
            <PopoverTrigger asChild>
              <button className="flex flex-col items-center gap-1 hover:bg-mineral/5 rounded-lg px-2 py-1 transition-colors group cursor-pointer">
                <span className="text-[9px] lg:text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Ah</span>
                <div className="flex items-center gap-1">
                  <BatteryCharging className="w-4 h-4 lg:w-5 lg:h-5 text-green-500" />
                  <AnimatedNumber 
                    value={displayAmperage}
                    className="font-display text-lg lg:text-xl text-carbon"
                  />
                  <span className="text-xs text-muted-foreground font-medium">Ah</span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-carbon transition-colors" />
                </div>
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
          <div className="h-10 w-px bg-mineral/20" />

          {/* Wattage avec label */}
          <div className="flex flex-col items-center gap-1 px-2 py-1">
            <span className="text-[9px] lg:text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Watt</span>
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-500" />
              <AnimatedNumber 
                value={displayWattage}
                className="font-display text-lg lg:text-xl text-carbon"
              />
              <span className="text-xs text-muted-foreground font-medium">W</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* BRIDGE BUTTON - Position de l'ancienne barre de specs (bas centre) */}
      <motion.div 
        className="absolute bottom-[12%] lg:bottom-[14%] left-1/2 -translate-x-1/2 z-40"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <button
          onClick={() => document.getElementById('compatible-parts')?.scrollIntoView({ behavior: 'smooth' })}
          className="group relative flex items-center gap-3 lg:gap-4 
                     px-8 py-4 lg:px-10 lg:py-5 
                     bg-carbon text-greige 
                     font-display text-base lg:text-xl tracking-wide
                     rounded-full border border-white/10
                     shadow-[0_8px_32px_rgba(28,28,28,0.4)]
                     hover:shadow-[0_12px_48px_rgba(28,28,28,0.6)]
                     hover:scale-105 active:scale-100
                     transition-all duration-300"
        >
          {/* Glow Effect */}
          <span className="absolute inset-0 rounded-full bg-gradient-to-r from-mineral/20 to-garage/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity" />
          
          <span className="relative z-10">DÉCOUVRIR LES PIÈCES</span>
          <ChevronDown className="relative z-10 w-5 h-5 lg:w-6 lg:h-6 animate-bounce" />
        </button>
      </motion.div>

      {/* Pagination Dots - PLUS IMPOSANTS avec Dynamic Counter */}
      <motion.div 
        className="absolute bottom-[2%] lg:bottom-[3%] left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 lg:gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {/* Navigation Dots - BIGGER - Show max 7 dots */}
        <div className="flex items-center gap-2 lg:gap-3">
          {Array.from({ length: Math.min(7, models.length) }).map((_, index) => (
            <button
              key={index}
              onClick={() => onSelect(index)}
              className={cn(
                "rounded-full transition-all duration-300",
                index === activeIndex
                  ? "w-8 lg:w-10 h-3 lg:h-4 bg-mineral"
                  : "w-3 h-3 lg:w-4 lg:h-4 bg-mineral/30 hover:bg-mineral/50"
              )}
            />
          ))}
        </div>
        
        {/* Dynamic Counter - BIGGER & BOLDER */}
        {models.length > 7 && (
          <span className="text-lg lg:text-xl font-bold text-carbon ml-1">
            +{models.length - 7}
          </span>
        )}

        {/* Total Badge - More Prominent */}
        <div className="ml-3 px-3 lg:px-4 py-1.5 lg:py-2 rounded-full bg-mineral/15 border border-mineral/25 backdrop-blur-sm">
          <span className="text-sm lg:text-base font-bold text-mineral">
            {models.length} modèle{models.length > 1 ? 's' : ''}
          </span>
        </div>
      </motion.div>

      {/* Watermark piecestrottinettes.fr */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <span className="text-[10px] text-muted-foreground/40 tracking-widest font-medium uppercase">
          piecestrottinettes.fr
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
