import { useEffect, useState, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, Zap, CircuitBoard, BatteryCharging, ChevronDown, Pause, Play } from "lucide-react";
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

interface ScooterCarouselProps {
  models: ScooterModel[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  totalModels?: number;
  currentIndex?: number;
  autoPlayEnabled?: boolean;
  compatiblePartsCount?: number;
}

// Animation variants for staggered specs - NO DELAY for instant sync
const specsContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0,  // ⚡ 0 delay for instant display
      delayChildren: 0,    // ⚡ 0 delay to sync with image
    }
  }
};

const specItemVariants = {
  hidden: { 
    opacity: 0, 
    x: 80,      // 80px au lieu de 20px - TRÈS visible
    scale: 0.8  // Plus petit pour effet dramatique
  },
  visible: { 
    opacity: 1, 
    x: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      damping: 8,       // Moins amorti = plus de bounce
      stiffness: 120,   // Moins rigide = bounce plus long
      mass: 1.2,        // Plus lourd = rebond visible
    }
  }
};

// Premium transition config - ULTRA FAST for instant sync
const premiumTransition = {
  duration: 0.15,  // ⚡ 150ms pour synchronisation instantanée
  ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
};

// Circular Progress Component for auto-play
const CircularProgress = ({ 
  duration, 
  isPaused, 
  progress 
}: { 
  duration: number; 
  isPaused: boolean;
  progress: number;
}) => {
  return (
    <div className="relative w-10 h-10 lg:w-14 lg:h-14">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 32 32">
        <circle
          cx="16" 
          cy="16" 
          r="14"
          fill="none"
          stroke="hsl(var(--mineral) / 0.2)"
          strokeWidth="3"
        />
        <motion.circle
          cx="16" 
          cy="16" 
          r="14"
          fill="none"
          stroke="hsl(var(--mineral))"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={88} // 2 * PI * 14
          strokeDashoffset={88 - (progress * 88)}
          style={{ 
            transformOrigin: "center",
            filter: "drop-shadow(0 0 6px hsl(var(--mineral) / 0.8))"
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {isPaused ? (
          <Play className="w-4 h-4 lg:w-5 lg:h-5 text-mineral" />
        ) : (
          <Pause className="w-4 h-4 lg:w-5 lg:h-5 text-mineral/60" />
        )}
      </div>
    </div>
  );
};

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
  autoPlayEnabled = true,
  compatiblePartsCount = 0,
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
  
  // New states for animations
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [isHovered, setIsHovered] = useState(false);
  const [autoPlayProgress, setAutoPlayProgress] = useState(0);
  const autoPlayDuration = 5000; // 5 seconds
  
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

  // Navigation handlers with direction tracking - IMMEDIATE state update
  const scrollPrev = useCallback(() => {
    const newIndex = activeIndex > 0 ? activeIndex - 1 : models.length - 1;
    setSlideDirection('left');
    setAutoPlayProgress(0);
    onSelect(newIndex); // ⚡ IMMEDIATE state update BEFORE animation
    emblaApi?.scrollPrev();
    onNavigatePrev?.();
  }, [emblaApi, onNavigatePrev, activeIndex, models.length, onSelect]);
  
  const scrollNext = useCallback(() => {
    const newIndex = activeIndex < models.length - 1 ? activeIndex + 1 : 0;
    setSlideDirection('right');
    setAutoPlayProgress(0);
    onSelect(newIndex); // ⚡ IMMEDIATE state update BEFORE animation
    emblaApi?.scrollNext();
    onNavigateNext?.();
  }, [emblaApi, onNavigateNext, activeIndex, models.length, onSelect]);

  // Auto-play effect - disabled when user scrolls down
  useEffect(() => {
    // Disable auto-play if: hovering, only one model, or scroll disabled
    if (isHovered || models.length <= 1 || !autoPlayEnabled) {
      setAutoPlayProgress(0);
      return;
    }
    
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / autoPlayDuration, 1);
      setAutoPlayProgress(progress);
      
      if (progress >= 1) {
        scrollNext();
      }
    }, 50);
    
    return () => clearInterval(interval);
  }, [isHovered, models.length, scrollNext, activeIndex, autoPlayEnabled]);

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

  // Keep Embla events ONLY for drag/swipe gestures (not button navigation)
  useEffect(() => {
    if (!emblaApi) return;
    
    let isDragging = false;
    
    const onPointerDown = () => { isDragging = true; };
    const onSettle = () => { isDragging = false; };
    const onSelectEvent = () => {
      // Only update state if this was a drag gesture, not a button click
      if (isDragging) {
        onSelect(emblaApi.selectedScrollSnap());
      }
    };
    
    emblaApi.on("pointerDown", onPointerDown);
    emblaApi.on("settle", onSettle);
    emblaApi.on("select", onSelectEvent);
    
    return () => {
      emblaApi.off("pointerDown", onPointerDown);
      emblaApi.off("settle", onSettle);
      emblaApi.off("select", onSelectEvent);
    };
  }, [emblaApi, onSelect]);

  // ⚡ Force scroll to index 0 on mount (brand filter change triggers remount)
  useEffect(() => {
    if (emblaApi) {
      emblaApi.scrollTo(0, true); // instant, no animation
    }
  }, [emblaApi]);

  // Sync Embla position with activeIndex from parent
  useEffect(() => {
    if (emblaApi && activeIndex !== emblaApi.selectedScrollSnap()) {
      emblaApi.scrollTo(activeIndex);
    }
  }, [emblaApi, activeIndex]);

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
    <div 
      className="relative flex flex-col lg:flex-row items-center justify-center w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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

      {/* Navigation Arrow LEFT - Visible on all screens - AMPLIFIED */}
      <motion.div 
        className="absolute left-1 sm:left-4 lg:left-12 xl:left-16 top-1/2 -translate-y-1/2 z-20"
        whileHover={{ 
          scale: 1.2, 
          rotate: -5,
          boxShadow: "0 8px 25px rgba(147,181,161,0.4)"
        }}
        whileTap={{ 
          scale: 0.85,
          rotate: 0
        }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={scrollPrev}
          className="rounded-full w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white/95 backdrop-blur-sm border-mineral/30 hover:border-mineral hover:bg-white shadow-md hover:shadow-xl transition-all"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-carbon" />
        </Button>
      </motion.div>

      {/* Navigation Arrow RIGHT - Visible on all screens - AMPLIFIED */}
      <motion.div 
        className="absolute right-1 sm:right-4 lg:right-12 xl:right-16 top-1/2 -translate-y-1/2 z-20"
        whileHover={{ 
          scale: 1.2, 
          rotate: 5,
          boxShadow: "0 8px 25px rgba(147,181,161,0.4)"
        }}
        whileTap={{ 
          scale: 0.85,
          rotate: 0
        }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={scrollNext}
          className="rounded-full w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white/95 backdrop-blur-sm border-mineral/30 hover:border-mineral hover:bg-white shadow-md hover:shadow-xl transition-all"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-carbon" />
        </Button>
      </motion.div>

      {/* FLOATING SPECS - Centered below image on mobile, positioned on desktop */}
      <motion.div 
        key={`specs-floating-${activeModel?.id}`}
        initial="hidden"
        animate="visible"
        variants={specsContainerVariants}
        className="relative lg:absolute mt-2 lg:mt-0 lg:top-[26%] lg:left-[52%] lg:-translate-y-1/2 z-30 order-3 lg:order-none"
      >
        <div 
          className="flex items-center justify-center gap-1.5 lg:gap-2.5 px-2 lg:px-3.5 py-1.5 lg:py-2.5 rounded-xl"
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 8px 32px rgba(26, 26, 26, 0.1)",
          }}
        >
          
          {/* Voltage avec label - Animated */}
          <motion.div variants={specItemVariants}>
            <Popover open={voltageOpen} onOpenChange={setVoltageOpen}>
              <PopoverTrigger asChild>
                <button className="flex flex-col items-center gap-0.5 hover:bg-mineral/5 rounded px-1.5 lg:px-2 py-0.5 lg:py-1 transition-colors group cursor-pointer">
                  <span className="text-[7px] lg:text-[9px] text-muted-foreground uppercase tracking-wider font-medium">Volt</span>
                  <div className="flex items-center gap-0.5">
                    <CircuitBoard className="w-3 h-3 lg:w-4 lg:h-4 text-amber-500" />
                    <AnimatedNumber 
                      value={displayVoltage}
                      className="font-display text-sm lg:text-lg text-carbon"
                    />
                    <span className="text-[8px] lg:text-[9px] text-muted-foreground font-medium">V</span>
                    <ChevronDown className="w-2 h-2 lg:w-2.5 lg:h-2.5 text-muted-foreground group-hover:text-carbon transition-colors" />
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-20 p-1 bg-white border border-mineral/20 shadow-lg" align="center" sideOffset={6}>
                <Command>
                  <CommandList>
                    {availableVoltages.map((v) => (
                      <CommandItem
                        key={v}
                        onSelect={() => {
                          setSelectedVoltage(v);
                          setVoltageOpen(false);
                        }}
                        className={`cursor-pointer text-xs ${displayVoltage === v ? 'bg-mineral/10 font-semibold' : ''}`}
                      >
                        {v}V
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </motion.div>

          {/* Divider */}
          <motion.div variants={specItemVariants} className="h-5 lg:h-7 w-px bg-mineral/20" />

          {/* Amperage avec label - Animated */}
          <motion.div variants={specItemVariants}>
            <Popover open={amperageOpen} onOpenChange={setAmperageOpen}>
              <PopoverTrigger asChild>
                <button className="flex flex-col items-center gap-0.5 hover:bg-mineral/5 rounded px-1.5 lg:px-2 py-0.5 lg:py-1 transition-colors group cursor-pointer">
                  <span className="text-[7px] lg:text-[9px] text-muted-foreground uppercase tracking-wider font-medium">Ah</span>
                  <div className="flex items-center gap-0.5">
                    <BatteryCharging className="w-3 h-3 lg:w-4 lg:h-4 text-green-500" />
                    <AnimatedNumber 
                      value={displayAmperage}
                      className="font-display text-sm lg:text-lg text-carbon"
                    />
                    <span className="text-[8px] lg:text-[9px] text-muted-foreground font-medium">Ah</span>
                    <ChevronDown className="w-2 h-2 lg:w-2.5 lg:h-2.5 text-muted-foreground group-hover:text-carbon transition-colors" />
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-20 p-1 bg-white border border-mineral/20 shadow-lg" align="center" sideOffset={6}>
                <Command>
                  <CommandList>
                    {availableAmperages.map((a) => (
                      <CommandItem
                        key={a}
                        onSelect={() => {
                          setSelectedAmperage(a);
                          setAmperageOpen(false);
                        }}
                        className={`cursor-pointer text-xs ${displayAmperage === a ? 'bg-mineral/10 font-semibold' : ''}`}
                      >
                        {a}Ah
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </motion.div>

          {/* Divider */}
          <motion.div variants={specItemVariants} className="h-5 lg:h-7 w-px bg-mineral/20" />

          {/* Wattage avec label - Animated */}
          <motion.div variants={specItemVariants} className="flex flex-col items-center gap-0.5 px-1.5 lg:px-2 py-0.5 lg:py-1">
            <span className="text-[7px] lg:text-[9px] text-muted-foreground uppercase tracking-wider font-medium">Watt</span>
            <div className="flex items-center gap-0.5">
              <Zap className="w-3 h-3 lg:w-4 lg:h-4 text-yellow-500" />
              <AnimatedNumber 
                value={displayWattage}
                className="font-display text-sm lg:text-lg text-carbon"
              />
              <span className="text-[8px] lg:text-[9px] text-muted-foreground font-medium">W</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* BRIDGE BUTTON - Pill Style moderne */}
      <motion.div 
        className="relative lg:absolute mt-2 lg:mt-0 lg:bottom-[20%] lg:left-1/2 lg:-translate-x-1/2 z-40 order-5 lg:order-none flex justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.05, rotate: 2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ delay: 0.4, ...premiumTransition }}
      >
        <button
          onClick={() => document.getElementById('compatible-parts')?.scrollIntoView({ behavior: 'smooth' })}
          className="group relative flex items-center gap-2 lg:gap-3 
                     px-5 py-3 lg:px-8 lg:py-4 
                     bg-transparent text-carbon 
                     font-bold text-xs lg:text-sm tracking-wide uppercase
                     rounded-full border-2 border-carbon
                     hover:bg-carbon hover:text-white
                     transition-all duration-300"
        >
          <span>DÉCOUVRIR LES {compatiblePartsCount} PIÈCES</span>
          <ChevronDown className="w-4 h-4 lg:w-5 lg:h-5 animate-bounce" />
        </button>
      </motion.div>

      {/* Pagination Dots + Circular Progress - Relative on mobile, absolute on desktop */}
      <motion.div 
        className="relative lg:absolute mt-2 lg:mt-0 lg:bottom-[3%] lg:left-1/2 lg:-translate-x-1/2 z-20 flex items-center justify-center gap-2 lg:gap-4 order-4 lg:order-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {/* Circular Progress Indicator */}
        <motion.div
          className="cursor-pointer"
          onClick={() => setIsHovered(!isHovered)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <CircularProgress 
            duration={autoPlayDuration} 
            isPaused={isHovered || !autoPlayEnabled}
            progress={autoPlayProgress}
          />
        </motion.div>

        {/* Navigation Dots - Massive for better UX */}
        <div className="flex items-center gap-2 lg:gap-4">
          {Array.from({ length: Math.min(5, models.length) }).map((_, index) => {
            const isActive = index === activeIndex;
            return (
              <motion.button
                key={index}
                onClick={() => {
                  setAutoPlayProgress(0);
                  onSelect(index);
                }}
                whileHover={{ scale: 1.5 }}
                whileTap={{ scale: 0.85 }}
                animate={{
                  scale: isActive ? 1.1 : 1,
                  boxShadow: isActive 
                    ? "0 0 30px 8px hsl(var(--mineral) / 0.7), 0 0 60px 16px hsl(var(--mineral) / 0.3)" 
                    : "0 0 0px transparent"
                }}
                transition={{ 
                  duration: 0.3,
                  type: "spring",
                  stiffness: 300,
                  damping: 15
                }}
                className={cn(
                  "rounded-full transition-all duration-300",
                  isActive
                    ? "w-6 lg:w-14 h-3 lg:h-5 bg-mineral"
                    : "w-3 h-3 lg:w-6 lg:h-6 bg-mineral/30 hover:bg-mineral/50"
                )}
              />
            );
          })}
        </div>
        
        {/* Dynamic Counter - Massive */}
        {models.length > 5 && (
          <span className="text-lg lg:text-3xl font-black text-carbon ml-2">
            +{models.length - 5}
          </span>
        )}

        {/* Total Badge - Larger */}
        <div className="ml-3 lg:ml-4 px-3 lg:px-6 py-1.5 lg:py-3 rounded-full bg-mineral/15 border border-mineral/25 backdrop-blur-sm">
          <span className="text-sm lg:text-xl font-bold text-mineral">
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
      <div className="relative flex items-center justify-center w-full px-4 lg:px-20 order-2 lg:order-none">
        {/* Carousel Container */}
        <div className="relative w-full max-w-[320px] lg:max-w-5xl overflow-hidden" ref={emblaRef}>
          <div className="flex items-center">
            {models.map((model, index) => {
              const isActive = index === activeIndex;
              const distance = Math.abs(index - activeIndex);
              const scale = isActive ? 1 : Math.max(0.7, 1 - distance * 0.15);
              const opacity = isActive ? 1 : Math.max(0.3, 1 - distance * 0.25);

              // Use image from Supabase database
              const imageSrc = model.image;

              return (
                <motion.div
                  key={model.id}
                  className="flex-shrink-0 w-full flex items-center justify-center px-2 lg:px-4"
                  initial={false}
                  animate={{
                    scale: scale,
                    opacity: opacity,
                    filter: isActive ? "blur(0px)" : "blur(2px)",
                  }}
                  transition={premiumTransition}
                >
                    {/* Scooter Container - Constrained height on mobile */}
                    <div className="relative w-full max-w-[300px] lg:max-w-[950px] mx-auto h-[320px] lg:h-[680px] xl:h-[750px] flex items-center justify-center">
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
                    
                    {/* Elegant Reveal Animation with Parallax */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={model.id}
                        className="relative w-full h-full"
                        initial={{ 
                          opacity: 0, 
                          scale: 0.9,                                    // 0.9 au lieu de 0.95 - plus dramatique
                          x: slideDirection === 'right' ? 100 : -100    // 100px au lieu de 60px
                        }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1,
                          x: 0
                        }}
                        exit={{ 
                          opacity: 0, 
                          scale: 0.9,
                          x: slideDirection === 'right' ? -80 : 80      // 80px au lieu de 40px
                        }}
                        transition={premiumTransition}
                      >
                        {/* Subtle glow effect */}
                        <motion.div
                          className="absolute inset-0 blur-2xl opacity-20"
                          style={{
                            background: "radial-gradient(ellipse at center, rgba(147,181,161,0.3) 0%, transparent 60%)"
                          }}
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                        />
                        
                        {/* Image with AMPLIFIED parallax effect (slower = true parallax) */}
                        <motion.img
                          src={imageSrc}
                          alt={`${model.brand} ${model.name}`}
                          className="relative w-full h-[80%] object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.15)]"
                          style={{
                            maskImage: 'linear-gradient(to bottom, black 75%, transparent 100%)',
                            WebkitMaskImage: 'linear-gradient(to bottom, black 75%, transparent 100%)'
                          }}
                          initial={{ 
                            x: slideDirection === 'right' ? 150 : -150,   // 150px au lieu de 80px
                            opacity: 0,
                            scale: 0.95
                          }}
                          animate={{ 
                            x: 0,
                            opacity: 1,
                            scale: 1
                          }}
                          exit={{ 
                            x: slideDirection === 'right' ? -100 : 100,   // 100px au lieu de 50px
                            opacity: 0,
                            scale: 0.95
                          }}
                          transition={{ 
                            duration: 0.2,                                 // ⚡ 200ms pour éliminer le ghosting
                            ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
                          }}
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
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScooterCarousel;
