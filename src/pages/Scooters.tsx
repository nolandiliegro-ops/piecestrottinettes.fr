import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import Header from "@/components/Header";
import BrandBentoGrid from "@/components/scooters/BrandBentoGrid";
import ScooterModelCard from "@/components/scooters/ScooterModelCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useBrands, useScooterModels } from "@/hooks/useScooterData";

// Skeleton grid for loading state
const SkeletonGrid = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="bg-white/40 backdrop-blur-md rounded-2xl p-5 border border-white/20">
        <Skeleton className="aspect-square rounded-xl mb-4" />
        <Skeleton className="h-5 w-3/4 mb-3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    ))}
  </div>
);

// Empty state component
const EmptyState = ({ onClear }: { onClear: () => void }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center py-20 text-center"
  >
    <div className="w-20 h-20 rounded-full bg-white/40 backdrop-blur-md flex items-center justify-center mb-6">
      <Search className="w-10 h-10 text-muted-foreground" />
    </div>
    <h3 className="font-display text-2xl text-carbon mb-2">
      AUCUN MODÈLE TROUVÉ
    </h3>
    <p className="text-muted-foreground mb-6">
      Aucune trottinette ne correspond à cette marque
    </p>
    <Button
      onClick={onClear}
      className="rounded-full px-6 bg-mineral text-white hover:bg-mineral-dark"
    >
      Afficher toutes les marques
    </Button>
  </motion.div>
);

const Scooters = () => {
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  
  const { data: brands = [], isLoading: brandsLoading } = useBrands();
  const { data: allScooters = [], isLoading: scootersLoading } = useScooterModels();

  // Filter scooters by active brand
  const filteredScooters = useMemo(() => {
    if (!activeBrand) return allScooters;
    return allScooters.filter(scooter => scooter.brand?.slug === activeBrand);
  }, [allScooters, activeBrand]);

  // Get active brand name for display
  const activeBrandName = useMemo(() => {
    if (!activeBrand) return null;
    return brands.find(b => b.slug === activeBrand)?.name;
  }, [brands, activeBrand]);

  return (
    <div className="min-h-screen bg-greige pb-24 md:pb-0">
      {/* Fixed Header */}
      <Header />

      {/* Main content area */}
      <main className="pt-16 lg:pt-20">
        {/* Title Section */}
        <section className="container mx-auto px-4 py-6 lg:py-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-5xl md:text-6xl lg:text-7xl text-carbon tracking-[0.2em] uppercase"
          >
            TROTTINETTES
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground mt-2 font-light tracking-widest text-sm uppercase"
          >
            Trouvez les pièces compatibles avec votre modèle
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-mineral font-montserrat font-semibold mt-2"
          >
            {scootersLoading ? "Chargement..." : `${filteredScooters.length} modèles${activeBrandName ? ` ${activeBrandName}` : ""}`}
          </motion.div>
        </section>

        {/* Brand Bento Grid */}
        <section className="container mx-auto px-4 pb-6">
          <BrandBentoGrid
            brands={brands}
            activeBrand={activeBrand}
            onBrandChange={setActiveBrand}
            isLoading={brandsLoading}
          />
        </section>

        {/* Scooter Models Grid */}
        <section className="container mx-auto px-4 py-6">
          <AnimatePresence mode="wait">
            {scootersLoading ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <SkeletonGrid />
              </motion.div>
            ) : filteredScooters.length > 0 ? (
              <motion.div
                key={activeBrand || "all"}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
              >
                {filteredScooters.map((scooter, index) => (
                  <ScooterModelCard key={scooter.id} scooter={scooter} index={index} />
                ))}
              </motion.div>
            ) : (
              <EmptyState onClear={() => setActiveBrand(null)} />
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
};

export default Scooters;
