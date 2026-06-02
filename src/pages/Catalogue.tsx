import SEO from "@/components/SEO";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import CategoryBentoGrid from "@/components/catalogue/CategoryBentoGrid";
import SubCategoryBar from "@/components/catalogue/SubCategoryBar";
import PartCard from "@/components/parts/PartCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories, useScooterModels } from "@/hooks/useScooterData";
import { useAllParts, type CataloguePart } from "@/hooks/useCatalogueData";
import { useProductSearch, type ProductSearchRow } from "@/hooks/useProductSearch";
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

// Mappe une ligne de recherche (RPC) vers la shape attendue par PartCard.
// Les champs absents de la RPC (description, difficulty_level, technical_metadata) = null.
const toCataloguePart = (p: ProductSearchRow): CataloguePart => ({
  id: p.id,
  name: p.name,
  slug: p.slug,
  description: null,
  price: p.price,
  image_url: p.image_url,
  images: p.images,
  difficulty_level: null,
  stock_quantity: p.stock_quantity,
  technical_metadata: null,
  is_featured: p.is_featured ?? undefined,
  category: p.category,
  category_id: p.category?.id ?? null,
});

const Catalogue = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  // Read ?category=<slug> on first render so home pills can pre-filter the catalogue.
  const [activeCategory, setActiveCategory] = useState<string | null>(
    () => searchParams.get("category") || null
  );
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);

  // Get scooter filter from URL params (e.g., ?scooter=uuid)
  const scooterIdFilter = searchParams.get("scooter");
  // Home redirections — read but never mutate URL except via clear handlers
  const searchQuery = searchParams.get("search")?.trim() || null;
  const brandFilter = searchParams.get("brand") || null;

  // Resolve brand slug → display name (for banner)
  const { data: brandDisplayName } = useQuery({
    queryKey: ["catalogue_brand_display", brandFilter],
    queryFn: async () => {
      if (!brandFilter) return null;
      const { data } = await supabase
        .from("brands")
        .select("name")
        .eq("slug", brandFilter)
        .maybeSingle();
      return data?.name || brandFilter;
    },
    enabled: !!brandFilter,
    staleTime: 5 * 60 * 1000,
  });

  // Resolve brand → set of compatible part IDs (for client-side filter)
  const { data: brandPartIds = null } = useQuery({
    queryKey: ["catalogue_brand_part_ids", brandFilter],
    queryFn: async (): Promise<Set<string>> => {
      if (!brandFilter) return new Set();
      const { data: brand } = await supabase
        .from("brands")
        .select("id")
        .eq("slug", brandFilter)
        .maybeSingle();
      if (!brand) return new Set();
      const { data: models } = await supabase
        .from("scooter_models")
        .select("id")
        .eq("brand_id", brand.id)
        .eq("published", true);
      if (!models || models.length === 0) return new Set();
      const { data: compat } = await supabase
        .from("part_compatibility")
        .select("part_id")
        .in("scooter_model_id", models.map((m) => m.id));
      return new Set((compat || []).map((c) => c.part_id as string));
    },
    enabled: !!brandFilter,
    staleTime: 5 * 60 * 1000,
  });

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

  const { data: allParts = [], isLoading: partsLoading, isPlaceholderData } = useAllParts(effectiveCategoryFilter);

  // Recherche full-text via RPC (pg_trgm) — pilote la grille uniquement quand ?search= est présent.
  // Cumulable avec le scooter (?scooter=) et la catégorie/sous-catégorie active.
  const searchCategoryIds = useMemo<string[] | null>(() => {
    if (activeSubCategory) return [activeSubCategory];
    if (activeCategory && subCategories.length > 0)
      return [activeCategory, ...subCategories.map((sc) => sc.id)];
    if (activeCategory) return [activeCategory];
    return null;
  }, [activeCategory, activeSubCategory, subCategories]);

  const search = useProductSearch({
    query: searchQuery ?? "",
    scooterId: scooterIdFilter,
    categoryIds: searchCategoryIds,
    limit: 48,
  });

  const isSearch = !!searchQuery;
  const displayLoading = isSearch
    ? !search.isActive || search.isLoading || search.isFetching
    : partsLoading;
  // Switch de catégorie : l'ancienne grille reste (keepPreviousData) + état visuel léger,
  // jamais le SkeletonGrid (réservé au tout premier chargement via partsLoading/isLoading).
  const isSwitching = !isSearch && isPlaceholderData;

  // Pagination "Voir plus" côté client sur la grille standard (16 = 4 lignes en desktop 4 colonnes).
  const [visibleCount, setVisibleCount] = useState(16);
  // Reset au changement de catégorie / sous-catégorie / marque / recherche.
  useEffect(() => setVisibleCount(16), [activeCategory, activeSubCategory, brandFilter, searchQuery]);

  // Mode recherche : exact / related séparés (option B), filtre marque appliqué côté client.
  const searchExact = useMemo<CataloguePart[]>(() => {
    let arr = search.exactParts.map(toCataloguePart);
    if (brandFilter && brandPartIds) arr = arr.filter((p) => brandPartIds.has(p.id));
    return arr;
  }, [search.exactParts, brandFilter, brandPartIds]);

  const searchRelated = useMemo<CataloguePart[]>(() => {
    let arr = search.relatedParts.map(toCataloguePart);
    if (brandFilter && brandPartIds) arr = arr.filter((p) => brandPartIds.has(p.id));
    return arr;
  }, [search.relatedParts, brandFilter, brandPartIds]);

  // Filtrer manuellement si on a une catégorie parente avec sous-catégories
  const parts = useMemo<CataloguePart[]>(() => {
    // Mode recherche : la RPC filtre déjà published + catégories + scooter ;
    // parts = exact puis related (déjà ordonné par la RPC) pour le compteur + l'état vide.
    if (searchQuery) {
      return [...searchExact, ...searchRelated];
    }
    // Chemin standard (inchangé) : useAllParts + filtres catégorie/marque client-side.
    let filtered = allParts;
    if (activeCategory && subCategories.length > 0 && !activeSubCategory) {
      const validCategoryIds = new Set([activeCategory, ...subCategories.map(sc => sc.id)]);
      filtered = filtered.filter(p => p.category_id && validCategoryIds.has(p.category_id));
    }
    if (brandFilter && brandPartIds) {
      filtered = filtered.filter(p => brandPartIds.has(p.id));
    }
    return filtered;
  }, [allParts, activeCategory, activeSubCategory, subCategories, searchQuery, searchExact, searchRelated, brandFilter, brandPartIds]);

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

  const clearSearchFilter = () => {
    searchParams.delete("search");
    setSearchParams(searchParams);
  };

  const clearBrandFilter = () => {
    searchParams.delete("brand");
    setSearchParams(searchParams);
  };

  return (
    <div className="min-h-screen bg-greige pb-24 md:pb-0">
      <SEO
        title="Pièces Détachées Trottinette Électrique - Catalogue Complet"
        description="Catalogue complet de pièces détachées pour trottinettes électriques. Xiaomi, Ninebot, Kaabo, Dualtron. Pneus, freins, batteries, chargeurs. Livraison rapide."
        canonical="https://piecestrottinettes.fr/catalogue"
      />
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
            {displayLoading ? "Chargement..." : `${parts.length} pièces disponibles`}
            {isSwitching && <Loader2 className="inline-block w-4 h-4 ml-2 animate-spin align-[-2px]" />}
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

          {searchQuery && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-3 inline-flex items-center gap-3 px-5 py-3 rounded-full bg-mineral/10 border border-mineral/20 mx-1"
            >
              <Search className="w-4 h-4 text-mineral" />
              <span className="text-carbon font-medium">
                Recherche : <span className="text-mineral font-semibold">{searchQuery}</span>
              </span>
              <button
                onClick={clearSearchFilter}
                className="ml-2 px-3 py-1 rounded-full bg-white/60 hover:bg-white text-carbon/70 hover:text-carbon text-xs font-medium transition-all"
              >
                Effacer
              </button>
            </motion.div>
          )}

          {brandFilter && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-3 inline-flex items-center gap-3 px-5 py-3 rounded-full bg-mineral/10 border border-mineral/20 mx-1"
            >
              <Filter className="w-4 h-4 text-mineral" />
              <span className="text-carbon font-medium">
                Marque : <span className="text-mineral font-semibold">{brandDisplayName || brandFilter}</span>
              </span>
              <button
                onClick={clearBrandFilter}
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
            {displayLoading ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <SkeletonGrid />
              </motion.div>
            ) : parts.length > 0 ? (
              isSearch ? (
                searchExact.length > 0 ? (
                  // Au moins 1 exact -> on n'affiche QUE les exacts (pas de bruit).
                  <div
                    key="search-exact"
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-7"
                  >
                    {searchExact.map((part, index) => (
                      <PartCard key={part.id} part={part} index={index} />
                    ))}
                  </div>
                ) : (
                  // 0 exact mais des proches -> suggestions, sans séparateur.
                  <div key="search-related">
                    <p className="mb-5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Aucun résultat exact, voici des suggestions
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-7">
                      {searchRelated.map((part, index) => (
                        <PartCard key={part.id} part={part} index={index} />
                      ))}
                    </div>
                  </div>
                )
              ) : (
                <motion.div
                  key={activeCategory || "all"}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-7 transition-opacity duration-200",
                    isSwitching && "opacity-60 pointer-events-none"
                  )}
                >
                  {parts.slice(0, visibleCount).map((part, index) => (
                    <PartCard key={part.id} part={part} index={index} />
                  ))}
                </motion.div>
              )
            ) : isSearch ? (
              // Recherche sans aucun résultat -> message spécifique à la requête.
              <motion.div
                key="search-empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-white/40 backdrop-blur-md flex items-center justify-center mb-6">
                  <Search className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="font-display text-2xl text-carbon mb-2">AUCUNE PIÈCE TROUVÉE</h3>
                <p className="text-muted-foreground">
                  Aucune pièce trouvée pour «&nbsp;{searchQuery}&nbsp;»
                </p>
              </motion.div>
            ) : (
              <EmptyState onClear={() => setActiveCategory(null)} />
            )}
          </AnimatePresence>

          {/* Pagination "Voir plus" — grille standard uniquement (hors recherche, hors chargement initial). */}
          {!isSearch && !displayLoading && visibleCount < parts.length && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + 16)}
                className="inline-flex items-center gap-2 min-h-[48px] px-8 rounded-xl border bg-white text-sm font-bold uppercase tracking-wider transition-transform hover:bg-[#1A1A1A]/[0.03] active:scale-[0.98]"
                style={{ borderColor: "#1A1A1A", color: "#1A1A1A", transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
              >
                Voir plus ({parts.length - visibleCount} restantes)
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Catalogue;
