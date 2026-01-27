import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, Sparkles, Filter } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import CategoryBentoGrid from "@/components/catalogue/CategoryBentoGrid";
import SubCategoryBar from "@/components/catalogue/SubCategoryBar";
import PartCard from "@/components/parts/PartCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCategories, useScooterModels } from "@/hooks/useScooterData";
import { useAllParts } from "@/hooks/useCatalogueData";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const queryClient = useQueryClient();

  // Get scooter filter from URL params (e.g., ?scooter=uuid)
  const scooterIdFilter = searchParams.get("scooter");
  
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: scooterModels = [] } = useScooterModels();

  // Séparer catégories parentes et sous-catégories
  const parentCategories = useMemo(() => 
    categories.filter(c => !c.parent_id), 
    [categories]
  );

  const subCategories = useMemo(() => 
    activeCategory 
      ? categories.filter(c => c.parent_id === activeCategory)
      : [],
    [categories, activeCategory]
  );

  // Déterminer le nom de la catégorie parente active
  const activeParentName = useMemo(() => {
    if (!activeCategory) return undefined;
    return categories.find(c => c.id === activeCategory)?.name;
  }, [categories, activeCategory]);

  // Logique de filtrage intelligent
  const effectiveCategoryFilter = useMemo(() => {
    // Si une sous-catégorie est sélectionnée, filtrer par celle-ci
    if (activeSubCategory) return activeSubCategory;
    
    // Si une catégorie parente est sélectionnée et a des sous-catégories,
    // on veut afficher TOUTES les pièces des sous-catégories
    if (activeCategory && subCategories.length > 0) {
      // Retourner null pour ne pas filtrer ici, on le fera manuellement
      return null;
    }
    
    // Sinon, filtrer par la catégorie parente directement
    return activeCategory;
  }, [activeCategory, activeSubCategory, subCategories]);

  const { data: allParts = [], isLoading: partsLoading } = useAllParts(effectiveCategoryFilter);

  // Filtrer manuellement si on a une catégorie parente avec sous-catégories
  const parts = useMemo(() => {
    if (activeCategory && subCategories.length > 0 && !activeSubCategory) {
      // Récupérer les IDs de toutes les sous-catégories + la catégorie parente
      const validCategoryIds = new Set([activeCategory, ...subCategories.map(sc => sc.id)]);
      return allParts.filter(p => p.category_id && validCategoryIds.has(p.category_id));
    }
    return allParts;
  }, [allParts, activeCategory, activeSubCategory, subCategories]);

  // Reset sous-catégorie quand on change de catégorie parente
  const handleCategoryChange = (categoryId: string | null) => {
    setActiveCategory(categoryId);
    setActiveSubCategory(null);
  };
  
  // Find the scooter model name for display
  const filteredScooterModel = scooterIdFilter 
    ? scooterModels.find(m => m.id === scooterIdFilter)
    : null;
    
  // Clear scooter filter
  const clearScooterFilter = () => {
    searchParams.delete("scooter");
    setSearchParams(searchParams);
  };

  const handleGenerateAllImages = async () => {
    setShowConfirmModal(false);
    setIsGenerating(true);
    
    let successCount = 0;
    let errorCount = 0;

    for (const category of categories) {
      const toastId = `generating-${category.id}`;
      
      toast.info(`Engineering Visuals: ${category.name} is being rendered...`, {
        id: toastId,
        duration: 60000,
      });

      try {
        const { data, error } = await supabase.functions.invoke(
          "generate-category-image",
          { body: { categoryId: category.id, categorySlug: category.slug } }
        );

        if (error) throw error;

        toast.success(`${category.name}: Visual generated!`, { id: toastId, duration: 3000 });
        successCount++;
        
        queryClient.invalidateQueries({ queryKey: ["category-images"] });
        
      } catch (error: any) {
        const message = error?.message?.includes("429") 
          ? "Rate limit exceeded" 
          : error?.message?.includes("402")
          ? "Credits required"
          : error?.message?.includes("504")
          ? "Generation timeout"
          : "Generation failed";
          
        toast.error(`${category.name}: ${message}`, { id: toastId, duration: 5000 });
        errorCount++;
      }

      // Delay between requests to prevent rate limiting
      if (categories.indexOf(category) < categories.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setIsGenerating(false);
    
    toast.success(
      `Studio Complete: ${successCount}/${categories.length} images rendered`,
      { duration: 5000 }
    );
  };

  return (
    <div className="min-h-screen bg-greige pb-24 md:pb-0">
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
            className="font-display text-5xl md:text-6xl lg:text-7xl text-carbon uppercase cursor-pointer title-underline-animated"
            style={{
              fontWeight: 700,
              letterSpacing: "-0.01em",
            }}
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

          {/* Scooter Filter Banner */}
          {filteredScooterModel && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35 }}
              className="mt-4 inline-flex items-center gap-3 px-5 py-3 rounded-full bg-mineral/10 border border-mineral/20"
            >
              <Filter className="w-4 h-4 text-mineral" />
              <span className="text-carbon font-medium">
                Pièces compatibles avec <span className="text-mineral font-semibold">{filteredScooterModel.name}</span>
              </span>
              <button
                onClick={clearScooterFilter}
                className="ml-2 px-3 py-1 rounded-full bg-white/60 hover:bg-white text-carbon/70 hover:text-carbon text-xs font-medium transition-all"
              >
                Effacer
              </button>
            </motion.div>
          )}
        </section>

        {/* Category Bento Grid - Only parent categories - Centered */}
        <section className="container mx-auto px-4 pb-4 flex justify-center">
          <div className="w-full max-w-5xl">
            <CategoryBentoGrid
              categories={parentCategories}
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
              isLoading={categoriesLoading}
            />
          </div>
        </section>

        {/* Sub-Category Bar - Appears when parent has children */}
        <section className="container mx-auto px-4">
          <AnimatePresence>
            {activeCategory && subCategories.length > 0 && (
              <SubCategoryBar
                subCategories={subCategories}
                activeSubCategory={activeSubCategory}
                onSubCategoryChange={setActiveSubCategory}
                parentName={activeParentName}
              />
            )}
          </AnimatePresence>
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
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-7"
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

      {/* Admin Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="bg-white/90 backdrop-blur-xl border border-white/30">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-carbon">
              GENERATE STUDIO VISUALS
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Cette action va générer {categories.length} images AI. 
              Cela peut prendre plusieurs minutes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-2 max-h-48 overflow-y-auto">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-mineral" />
                <span className="font-montserrat">{cat.name}</span>
                <span className="text-muted-foreground">({cat.slug})</span>
              </div>
            ))}
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleGenerateAllImages}
              className="bg-mineral text-white hover:bg-mineral-dark"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Lancer la génération
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Floating Button - Temporarily visible for image generation */}
      {true && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={isGenerating || categoriesLoading}
            className={cn(
              "flex items-center gap-2 px-4 py-3 rounded-xl",
              "bg-white/20 backdrop-blur-md border border-white/30",
              "text-carbon font-montserrat font-semibold text-sm",
              "hover:bg-white/30 hover:border-mineral/50",
              "transition-all duration-300 shadow-lg hover:shadow-xl",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-mineral" />
                <span>Generate Studio Visuals (AI)</span>
              </>
            )}
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default Catalogue;
