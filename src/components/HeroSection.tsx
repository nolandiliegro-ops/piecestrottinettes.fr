import { useState, useMemo } from "react";
import HeroBranding from "./hero/HeroBranding";
import ScooterCarousel from "./hero/ScooterCarousel";
import CommandPanel from "./hero/CommandPanel";
import { brands, scooterModels } from "@/data/scooterData";

const HeroSection = () => {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  // Intelligent filtering logic
  const filteredModels = useMemo(() => {
    let result = scooterModels;

    // Filter by brand if selected
    if (selectedBrand) {
      result = result.filter((model) => model.brandId === selectedBrand);
    }

    // Filter by search query (matches brand or model name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (model) =>
          model.name.toLowerCase().includes(query) ||
          model.brand.toLowerCase().includes(query)
      );
    }

    return result;
  }, [selectedBrand, searchQuery]);

  // Reset active index when filters change
  const handleBrandSelect = (brandId: string | null) => {
    setSelectedBrand(brandId);
    setActiveIndex(0);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setActiveIndex(0);
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
            <ScooterCarousel
              models={filteredModels}
              activeIndex={activeIndex}
              onSelect={setActiveIndex}
            />
          </div>

          {/* Right Column - Command Panel */}
          <div className="order-3">
            <CommandPanel
              brands={brands}
              selectedBrand={selectedBrand}
              onBrandSelect={handleBrandSelect}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
