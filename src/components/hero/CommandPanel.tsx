import { useState, useRef, useEffect } from "react";
import { Search, Scan, Home, Package, ArrowDown } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Brand, ScooterModel } from "@/data/scooterData";
import { useSearchScooters } from "@/hooks/useScooterData";
import SearchDropdown from "./SearchDropdown";
import { motion } from "framer-motion";
import AnimatedNumber from "@/components/ui/animated-number";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

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

// Brand color mapping - synchronized with filters
const brandColors: Record<string, { bg: string; text: string; border: string }> = {
  dualtron: { bg: "bg-[hsl(43_100%_50%)]", text: "text-yellow-900", border: "border-yellow-500" },
  kaabo: { bg: "bg-[hsl(0_70%_50%)]", text: "text-white", border: "border-red-500" },
  xiaomi: { bg: "bg-[hsl(25_100%_50%)]", text: "text-white", border: "border-orange-500" },
  ninebot: { bg: "bg-[hsl(207_90%_54%)]", text: "text-white", border: "border-blue-500" },
  segway: { bg: "bg-[hsl(145_60%_40%)]", text: "text-white", border: "border-emerald-500" },
};

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

  // Get brand color based on active model's brand
  const getBrandColorClasses = (brandId: string | undefined) => {
    if (!brandId) return { bg: "bg-white/80", text: "text-carbon", border: "border-mineral/20" };
    const colors = brandColors[brandId.toLowerCase()];
    return colors || { bg: "bg-white/80", text: "text-carbon", border: "border-mineral/20" };
  };

  const activeBrandColors = getBrandColorClasses(activeModel?.brandId);

  return (
    <div className="flex flex-col justify-start h-full space-y-3 lg:space-y-4">
      
      {/* MOBILE ONBOARDING MESSAGE - Explains the concept */}
      <motion.div 
        className="lg:hidden text-center px-2 mb-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-sm text-muted-foreground leading-relaxed">
          <span className="font-semibold text-carbon">1.</span> Identifiez votre trottinette ci-dessous
          <br />
          <span className="font-semibold text-carbon">2.</span> Découvrez les <span className="text-mineral font-medium">pièces compatibles</span>
        </p>
        
        {/* OR - View All Parts Button */}
        <div className="flex items-center justify-center gap-3 mt-3">
          <div className="h-px w-12 bg-mineral/20" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">ou</span>
          <div className="h-px w-12 bg-mineral/20" />
        </div>
        
        <motion.button
          onClick={() => navigate('/catalogue')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-full 
                     bg-mineral/10 border border-mineral/30 
                     hover:bg-mineral/20 transition-all"
        >
          <Package className="w-4 h-4 text-mineral" />
          <span className="text-sm font-medium text-mineral">Voir toutes les pièces</span>
        </motion.button>
      </motion.div>
      
      {/* FIRST: Active Model Info - Priority placement */}
      {activeModel && (
        <motion.div 
          key={activeModel.id}
          className="animate-fade-in text-center lg:text-left"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Brand Badge with Dynamic Color */}
          <motion.div
            className={`inline-block px-2.5 py-1 lg:px-3 lg:py-1.5 rounded-full ${activeBrandColors.bg} ${activeBrandColors.text} backdrop-blur-sm mb-2 shadow-sm`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-[10px] lg:text-xs font-bold tracking-wide uppercase">
              {activeModel.brand}
            </p>
          </motion.div>

          {/* Model Name - Reduced on mobile */}
          <motion.h3 
            className="font-display text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-carbon mb-2 lg:mb-3 tracking-tighter leading-none uppercase"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            {activeModel.name}
          </motion.h3>

        </motion.div>
      )}

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
            const brandColor = brandColors[brand.id.toLowerCase()];
            const isSelected = selectedBrand === brand.id;
            
            return (
              <button
                key={brand.id}
                onClick={() => onBrandSelect(brand.id)}
                className={`flex-shrink-0 px-2.5 py-1.5 md:py-1 rounded-full text-xs font-medium transition-all min-h-[36px] md:min-h-0 ${
                  isSelected && brandColor
                    ? `${brandColor.bg} ${brandColor.text}`
                    : isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-white/80 backdrop-blur-xl border-[0.5px] border-mineral/20 text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {brand.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* SCANNER & GARAGE Buttons - Stacked full-width on mobile */}
      <div className="animate-fade-in pt-2 lg:pt-4 flex flex-col w-full gap-2 lg:gap-0 lg:block" style={{ animationDelay: "0.3s" }}>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center justify-center lg:justify-start gap-2 lg:gap-3 py-3 px-4 lg:px-0 
                     w-full lg:w-auto
                     bg-carbon lg:bg-transparent text-white lg:text-carbon
                     rounded-full lg:rounded-none
                     group cursor-pointer"
        >
          {/* Scan icon */}
          <Scan className="w-5 h-5 lg:w-8 lg:h-8 text-white lg:text-carbon group-hover:text-mineral transition-colors duration-300" />
          <span className="font-display text-sm lg:text-xl text-white lg:text-carbon tracking-wide group-hover:text-mineral transition-colors duration-300 uppercase">
            Scanner ma Trottinette
          </span>
        </motion.button>
        
        {/* Mon Garage - Full width on mobile */}
        <motion.button
          onClick={() => navigate(user ? '/garage' : '/login')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          className="mt-0 lg:mt-4 flex items-center justify-center lg:justify-start gap-2 px-5 py-3 lg:py-2.5 rounded-full 
                     w-full lg:w-auto
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
          <span className="font-display text-sm lg:text-base tracking-wide text-garage group-hover:text-white transition-colors uppercase">
            Mon Garage
          </span>
        </motion.button>
      </div>
    </div>
  );
};

export default CommandPanel;
