import { useState, useMemo, useEffect } from "react";
import HeroBranding from "./hero/HeroBranding";
import ScooterCarousel from "./hero/ScooterCarousel";
import ScooterCarouselSkeleton from "./hero/ScooterCarouselSkeleton";
import CommandPanel from "./hero/CommandPanel";
import { useBrands, useScooterModels } from "@/hooks/useScooterData";

interface HeroSectionProps {
  onActiveModelChange?: (slug: string | null, name: string | null) => void;
}

const HeroSection = ({ onActiveModelChange }: HeroSectionProps) => {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  // Fetch data from database
  const { data: brands = [], isLoading: brandsLoading } = useBrands();
  const { data: scooterModels = [], isLoading: modelsLoading } = useScooterModels(selectedBrand);

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
      specs: {
        power: `${model.power_watts || 0}W`,
        range: `${model.range_km || 0}km`,
        maxSpeed: `${model.max_speed_kmh || 0}km/h`,
      },
    }));
  }, [scooterModels]);

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
    if (!searchQuery.trim()) return transformedModels;

    const query = searchQuery.toLowerCase().trim();
    return transformedModels.filter(
      (model) =>
        model.name.toLowerCase().includes(query) ||
        model.brand.toLowerCase().includes(query)
    );
  }, [transformedModels, searchQuery]);

  // Get active model and notify parent
  const activeModel = filteredModels[activeIndex] || null;

  useEffect(() => {
    if (onActiveModelChange) {
      onActiveModelChange(
        activeModel?.id || null,
        activeModel ? `${activeModel.brand} ${activeModel.name}` : null
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
    <section className="h-screen pt-16 lg:pt-20 pb-4 flex items-center overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8 h-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8 items-center h-full">
          {/* Left Column - Branding */}
          <div className="order-2 lg:order-1">
            <HeroBranding />
          </div>

          {/* Center Column - Carousel */}
          <div className="order-1 lg:order-2 h-full flex items-center">
            {isLoading ? (
              <ScooterCarouselSkeleton />
            ) : (
              <ScooterCarousel
                models={filteredModels}
                activeIndex={activeIndex}
                onSelect={setActiveIndex}
              />
            )}
          </div>

          {/* Right Column - Command Panel */}
          <div className="order-3">
            <CommandPanel
              brands={transformedBrands}
              selectedBrand={selectedBrand}
              onBrandSelect={handleBrandSelect}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              onModelSelect={handleModelSelect}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
