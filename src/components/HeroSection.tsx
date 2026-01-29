import { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import HeroBranding from "./hero/HeroBranding";
import ScooterCarousel from "./hero/ScooterCarousel";
import ScooterCarouselSkeleton from "./hero/ScooterCarouselSkeleton";
import CommandPanel from "./hero/CommandPanel";
import { useBrands, useScooterModels } from "@/hooks/useScooterData";

interface HeroSectionProps {
  onActiveModelChange?: (slug: string | null, name: string | null, brandSlug: string | null) => void;
  compatiblePartsCount?: number;
}

const HeroSection = ({ onActiveModelChange, compatiblePartsCount }: HeroSectionProps) => {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Auto-play control based on scroll position
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);

  // Scroll detection effect with requestAnimationFrame throttle
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          
          if (scrollY > 200 && autoPlayEnabled) {
            setAutoPlayEnabled(false);
          } else if (scrollY < 100 && !autoPlayEnabled) {
            setAutoPlayEnabled(true);
          }
          
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [autoPlayEnabled]);

  // Fetch data from database - Load ALL models without filtering
  const { data: brands = [], isLoading: brandsLoading } = useBrands();
  const { data: scooterModels = [], isLoading: modelsLoading } = useScooterModels(null); // ⚡ Always load ALL models

  const isLoading = brandsLoading || modelsLoading;

  // Transform database models to the format expected by carousel
  const transformedModels = useMemo(() => {
    return scooterModels.map((model) => ({
      id: model.slug,
      name: model.name,
      brandId: model.brand?.slug || "",
      brand: model.brand?.name || "",
      image: model.image_url || "/placeholder.svg",
      compatibleParts: model.compatible_parts_count || 0,
      voltage: model.voltage || 36,
      amperage: model.amperage || 12,
      specs: {
        power: `${model.power_watts || 0}W`,
        range: `${model.range_km || 0}km`,
        maxSpeed: `${model.max_speed_kmh || 0}km/h`,
      },
    }));
  }, [scooterModels]);

  // ⚡ Client-side brand filtering for instant response
  const brandFilteredModels = useMemo(() => {
    if (!selectedBrand) return transformedModels;
    return transformedModels.filter((model) => model.brandId === selectedBrand);
  }, [transformedModels, selectedBrand]);

  // Transform brands for CommandPanel
  const transformedBrands = useMemo(() => {
    return brands.map((brand) => ({
      id: brand.slug,
      name: brand.name,
      logo: "🛴",
    }));
  }, [brands]);

  // Filter by search query (matches brand or model name)
  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return brandFilteredModels;

    const query = searchQuery.toLowerCase().trim();
    return brandFilteredModels.filter(
      (model) =>
        model.name.toLowerCase().includes(query) ||
        model.brand.toLowerCase().includes(query)
    );
  }, [brandFilteredModels, searchQuery]);

  // Get active model and notify parent
  const activeModel = filteredModels[activeIndex] || null;

  useEffect(() => {
    if (onActiveModelChange) {
      onActiveModelChange(
        activeModel?.id || null,
        activeModel ? `${activeModel.brand} ${activeModel.name}` : null,
        activeModel?.brandId || null
      );
    }
  }, [activeModel, onActiveModelChange]);

  // Reset active index when filters change
  const handleBrandSelect = (brandSlug: string | null) => {
    setSelectedBrand(brandSlug);
    setActiveIndex(0);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setActiveIndex(0);
  };

  // Handle model selection from predictive search
  const handleModelSelect = (modelSlug: string) => {
    const index = filteredModels.findIndex((m) => m.id === modelSlug);
    if (index !== -1) {
      setActiveIndex(index);
      setSelectedBrand(null); // Reset brand filter to show all
      setSearchQuery(""); // Clear search
    }
  };

  return (
    <section className="hero-studio-bg relative py-2 lg:py-6 pb-8 lg:pb-4 flex flex-col overflow-hidden lg:max-h-[85vh] lg:min-h-[70vh]">
      <div className="container mx-auto px-4 lg:px-8 flex-1">
        {/* Mobile: Flex Column | Desktop: 12-Column Grid */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-2 lg:gap-6 lg:items-center h-full">
          
          {/* HOOK EN POLE POSITION - Mobile Only */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="order-1 lg:hidden text-center py-4 px-4"
          >
            <p className="font-display uppercase tracking-[0.15em] text-sm text-carbon/90 leading-snug">
              Ne perdez plus de temps<br />
              <span className="text-mineral-dark font-bold">avec des pièces incompatibles</span>
            </p>
          </motion.div>

          {/* LEFT (col-span-3) - Slogan ROULE RÉPARE DURE - Desktop only */}
          <div className="hidden lg:flex lg:order-1 lg:col-span-3">
            <HeroBranding />
          </div>

          {/* MOBILE ORDER 2: Model Info (Name, Brand, Parts count) */}
          <div className="order-2 lg:order-3 lg:col-span-3">
            <CommandPanel
              brands={transformedBrands}
              selectedBrand={selectedBrand}
              onBrandSelect={handleBrandSelect}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              onModelSelect={handleModelSelect}
              activeModel={activeModel}
            />
          </div>

          {/* MOBILE ORDER 3: Scooter Carousel (Image, Specs, Dots, Bridge) */}
          <div className="order-3 lg:order-2 lg:col-span-6 flex items-center justify-center">
            {isLoading ? (
              <ScooterCarouselSkeleton />
            ) : (
              <ScooterCarousel
                key={`carousel-${selectedBrand || 'all'}-${filteredModels[0]?.id || 'empty'}`}
                models={filteredModels}
                activeIndex={activeIndex}
                onSelect={setActiveIndex}
                onNavigatePrev={() => setActiveIndex((prev) => (prev > 0 ? prev - 1 : filteredModels.length - 1))}
                onNavigateNext={() => setActiveIndex((prev) => (prev < filteredModels.length - 1 ? prev + 1 : 0))}
                totalModels={filteredModels.length}
                currentIndex={activeIndex}
                autoPlayEnabled={autoPlayEnabled}
                compatiblePartsCount={compatiblePartsCount}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
