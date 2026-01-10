import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import Header from "@/components/Header";
import CategoryBentoGrid from "@/components/catalogue/CategoryBentoGrid";
import PartCard from "@/components/parts/PartCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories } from "@/hooks/useScooterData";
import { useAllParts } from "@/hooks/useCatalogueData";

// Skeleton grid for loading state
const SkeletonGrid = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="bg-white/40 backdrop-blur-md rounded-2xl p-5 border border-white/20">
        <Skeleton className="aspect-square rounded-xl mb-4" />
        <Skeleton className="h-5 w-3/4 mb-3" />
        <Skeleton className="h-6 w-1/2 mb-3" />
        <Skeleton className="h-4 w-full" />
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
      AUCUNE PIÈCE TROUVÉE
    </h3>
    <p className="text-muted-foreground mb-6">
      Aucune pièce ne correspond à cette catégorie
    </p>
    <Button
      onClick={onClear}
      className="rounded-full px-6 bg-mineral text-white hover:bg-mineral-dark"
    >
      Effacer les filtres
    </Button>
  </motion.div>
);

const Catalogue = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: parts = [], isLoading: partsLoading } = useAllParts(activeCategory);

  return (
    <div className="min-h-screen bg-greige">
      {/* Fixed Header */}
      <Header />

      {/* Main content area */}
      <main className="pt-16 lg:pt-20">
        {/* Title Section - COMPACT for above the fold */}
        <section className="container mx-auto px-4 py-6 lg:py-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-5xl md:text-6xl lg:text-7xl text-carbon tracking-[0.2em] uppercase"
          >
            CATALOGUE
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground mt-2 font-light tracking-widest text-sm uppercase"
          >
            Roule. Répare. Dure.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-mineral font-montserrat font-semibold mt-2"
          >
            {partsLoading ? "Chargement..." : `${parts.length} pièces disponibles`}
          </motion.div>
        </section>

        {/* Category Bento Grid */}
        <section className="container mx-auto px-4 pb-6">
          <CategoryBentoGrid
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            isLoading={categoriesLoading}
          />
        </section>

        {/* Product Grid - visible above the fold */}
        <section className="container mx-auto px-4 py-6">
          <AnimatePresence mode="wait">
            {partsLoading ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <SkeletonGrid />
              </motion.div>
            ) : parts.length > 0 ? (
              <motion.div
                key={activeCategory || "all"}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
              >
                {parts.map((part, index) => (
                  <PartCard key={part.id} part={part} index={index} />
                ))}
              </motion.div>
            ) : (
              <EmptyState onClear={() => setActiveCategory(null)} />
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
};

export default Catalogue;
