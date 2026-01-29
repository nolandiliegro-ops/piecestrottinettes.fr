import { useState, useRef, useEffect } from "react";
import { Search, Scan, Home } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Brand, ScooterModel } from "@/data/scooterData";
import { useSearchScooters } from "@/hooks/useScooterData";
import SearchDropdown from "./SearchDropdown";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedNumber from "@/components/ui/animated-number";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getBrandColors } from "@/contexts/ScooterContext";

interface CommandPanelProps {
  brands: Brand[];
  selectedBrand: string | null;
  onBrandSelect: (brandId: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onModelSelect?: (modelSlug: string) => void;
  activeModel?: ScooterModel | null;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  totalModels?: number;
  currentIndex?: number;
}

const CommandPanel = ({
  brands,
  selectedBrand,
  onBrandSelect,
  searchQuery,
  onSearchChange,
  onModelSelect,
  activeModel,
}: CommandPanelProps) => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  const { data: searchResults = [], isLoading } = useSearchScooters(searchQuery);

  // Get centralized brand colors for the active model
  const activeBrandColors = getBrandColors(activeModel?.brandId);

  // Show dropdown when query is long enough and we have focus
  useEffect(() => {
    setShowDropdown(searchQuery.length >= 2);
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleModelSelect = (slug: string) => {
    setShowDropdown(false);
    onSearchChange("");
    onModelSelect?.(slug);
  };

  return (
    <div className="flex flex-col justify-start h-full space-y-2 lg:space-y-4">
      {/* FIRST: Active Model Info - Priority placement with synchronized transitions */}
      <AnimatePresence mode="wait">
        {activeModel && (
          <motion.div 
            key={activeModel.id}
            className="text-center lg:text-left"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Brand Badge with Dynamic Color - NO DELAY */}
            <motion.div
              className="inline-block px-2.5 py-1 lg:px-3 lg:py-1.5 rounded-full backdrop-blur-sm mb-2 shadow-sm text-white"
              style={{ backgroundColor: activeBrandColors.accent }}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.15, delay: 0 }}
            >
              <p className="text-[10px] lg:text-xs font-bold tracking-wide uppercase">
                {activeModel.brand}
              </p>
            </motion.div>

            {/* Model Name - Black/Carbon color */}
            <motion.h3 
              className="font-display text-3xl md:text-4xl lg:text-5xl xl:text-6xl mb-1 lg:mb-3 tracking-tighter leading-none uppercase text-carbon"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, delay: 0 }}
            >
              {activeModel.name}
            </motion.h3>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Separator - Hidden on mobile for cleaner look */}
      <div className="hidden lg:block border-t border-mineral/10" />

      {/* Section Title - Hidden on mobile */}
      <div className="hidden lg:block animate-fade-in">
        <p className="text-xs tracking-[0.2em] text-muted-foreground font-medium mb-1">
          RECHERCHER
        </p>
        <h2 className="font-display text-lg lg:text-xl text-foreground">
          Identifiez votre trottinette
        </h2>
      </div>

      {/* Search Bar with Dropdown - Now visible on mobile */}
      <div 
        ref={searchContainerRef}
        className="relative animate-fade-in" 
        style={{ animationDelay: "0.1s" }}
      >
        <div className="glass rounded-full p-0.5 md:p-1 border-[0.5px] border-white/30">
          <div className="relative">
            <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
              className="pl-10 md:pl-12 pr-4 py-2 md:py-2.5 text-sm md:text-base bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60 placeholder:tracking-wider min-h-[44px]"
            />
          </div>
        </div>
        
        {/* Predictive Search Dropdown */}
        <SearchDropdown
          results={searchResults}
          isVisible={showDropdown}
          isLoading={isLoading}
          onSelect={handleModelSelect}
        />
      </div>

      {/* Brand Selection - Horizontal scroll on mobile */}
      <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
        <p className="text-xs text-muted-foreground mb-2 hidden md:block">Ou sélectionnez une marque</p>
        <div className="flex gap-1.5 overflow-x-auto pb-2 md:flex-wrap md:overflow-visible scrollbar-none">
          {/* All Brands Option */}
          <button
            onClick={() => onBrandSelect(null)}
            className={`flex-shrink-0 px-2.5 py-1.5 md:py-1 rounded-full text-xs font-medium transition-all min-h-[36px] md:min-h-0 ${
              selectedBrand === null
                ? "bg-carbon text-greige"
                : "bg-white/80 backdrop-blur-xl border-[0.5px] border-mineral/20 text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Tous
          </button>
          {brands.map((brand) => {
            const brandColorConfig = getBrandColors(brand.id);
            const isSelected = selectedBrand === brand.id;
            
            return (
              <button
                key={brand.id}
                onClick={() => onBrandSelect(brand.id)}
                className={`flex-shrink-0 px-2.5 py-1.5 md:py-1 rounded-full text-xs font-medium transition-all min-h-[36px] md:min-h-0 ${
                  isSelected
                    ? "text-white"
                    : "bg-white/80 backdrop-blur-xl border-[0.5px] border-mineral/20 text-muted-foreground hover:bg-muted/80"
                }`}
                style={isSelected ? { backgroundColor: brandColorConfig.accent } : undefined}
              >
                {brand.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* SCANNER & GARAGE Buttons - Desktop Only (moved to ExpertJourneySection on mobile) */}
      <div className="hidden lg:block animate-fade-in pt-4" style={{ animationDelay: "0.3s" }}>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center justify-start gap-3 px-0 group cursor-pointer"
        >
          <Scan className="w-8 h-8 text-carbon group-hover:text-mineral transition-colors duration-300" />
          <span className="font-display text-xl text-carbon tracking-wide group-hover:text-mineral transition-colors duration-300 uppercase">
            Scanner ma Trottinette
          </span>
        </motion.button>
        
        {/* Mon Garage */}
        <motion.button
          onClick={() => navigate(user ? '/garage' : '/login')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          className="mt-4 flex items-center justify-start gap-2 px-5 py-2.5 rounded-full 
                     bg-garage/10 border border-garage/50 
                     hover:bg-garage hover:border-garage
                     active:bg-garage/80
                     transition-all duration-300 group cursor-pointer"
        >
          {user ? (
            <div className="w-5 h-5 rounded-full bg-garage/30 group-hover:bg-white/20 flex items-center justify-center text-xs font-semibold text-garage group-hover:text-white transition-colors">
              {profile?.display_name?.charAt(0).toUpperCase() || 'R'}
            </div>
          ) : (
            <Home className="w-4 h-4 text-garage group-hover:text-white transition-colors" />
          )}
          <span className="font-display text-base tracking-wide text-garage group-hover:text-white transition-colors uppercase">
            Mon Garage
          </span>
        </motion.button>
      </div>
    </div>
  );
};

export default CommandPanel;
