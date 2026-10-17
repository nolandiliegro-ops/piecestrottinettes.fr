import SEO from "@/components/SEO";
import { useState, useMemo, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import Header from "@/components/Header";
import BrandBentoGrid from "@/components/scooters/BrandBentoGrid";
import ScooterModelCard from "@/components/scooters/ScooterModelCard";
import BrandCarouselLooks, { type MarquesLook } from "@/components/scooters/BrandCarouselLooks";
import ScooterFilters from "@/components/scooters/ScooterFilters";
import RacingSearch from "@/components/scooters/RacingSearch";
import type { FilterLook } from "@/components/scooters/filterSkins";
import { FILTER_GROUPS, applyFilters, readSelection, type Selection } from "@/lib/scooterFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useBrands, useScooterModels } from "@/hooks/useScooterData";
import { getPrimaryImage } from "@/lib/entityImage";

const normalize = (v: string) =>
  v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

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
      Aucune trottinette ne correspond à ces critères
    </p>
    <Button
      onClick={onClear}
      className="rounded-full px-6 bg-mineral text-white hover:bg-mineral-dark"
    >
      Tout réafficher
    </Button>
  </motion.div>
);

const Scooters = () => {
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  
  const { data: brands = [], isLoading: brandsLoading } = useBrands();
  const { data: allScooters = [], isLoading: scootersLoading } = useScooterModels();

  const [query, setQuery] = useState("");
  const nq = normalize(query.trim());

  // Filtres + tri dans l'URL (?puissance=1000,2000&tri=pieces) ; ?marques=1..5 = propositions de carrousel
  const [params, setParams] = useSearchParams();
  const selection: Selection = useMemo(() => readSelection(params), [params]);
  const sort = params.get("tri") ?? "nom";
  const lookParam = Number(params.get("marques"));
  // 16/10 : « Vitrine Air » (1) retenue par Nolan = défaut ; ?marques=0 = ancien carrousel, 2..5 = autres propositions
  const look = (params.get("marques") === null ? 1 : lookParam >= 1 && lookParam <= 5 ? lookParam : 0) as MarquesLook | 0;
  // 17/10 : habillage racing des filtres + recherche à comparer, ?filtres=1..5 (sans paramètre : barre actuelle)
  const fl = Number(params.get("filtres"));
  // 17/10 : « Plaques » (1) retenue par Nolan = défaut ; ?filtres=0 = ancienne barre, 2..5 = autres propositions
  const filterLook = (params.get("filtres") === null ? 1 : fl >= 1 && fl <= 5 ? fl : null) as FilterLook | null;
  const setParam = useCallback((mutate: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params);
    mutate(next);
    setParams(next, { replace: true });
  }, [params, setParams]);
  const toggleFilter = (group: string, value: string) => setParam((p) => {
    const cur = new Set((p.get(group) ?? "").split(",").filter(Boolean));
    if (cur.has(value)) cur.delete(value); else cur.add(value);
    if (cur.size) p.set(group, [...cur].join(",")); else p.delete(group);
  });
  const clearFilters = () => setParam((p) => FILTER_GROUPS.forEach((g) => p.delete(g.key)));
  const setSort = (v: string) => setParam((p) => { if (v === "nom") p.delete("tri"); else p.set("tri", v); });

  // Photo de couverture + nombre de modèles par marque, dérivés des modèles déjà chargés (0 requête en plus)
  const { covers, counts } = useMemo(() => {
    const covers: Record<string, string | undefined> = {};
    const counts: Record<string, number> = {};
    allScooters.forEach((s) => {
      const slug = s.brand?.slug;
      if (!slug) return;
      counts[slug] = (counts[slug] ?? 0) + 1;
      if (!covers[slug]) {
        const img = getPrimaryImage(s.images, s.image_url, "");
        if (img) covers[slug] = img;
      }
    });
    return { covers, counts };
  }, [allScooters]);

  // Propositions de carrousel : 3 photos par marque (modèles les plus fournis en pièces) + 3 marques pour « Toutes »
  const { picks, allPicks } = useMemo(() => {
    const byBrand: Record<string, typeof allScooters> = {};
    allScooters.forEach((s) => { const k = s.brand?.slug; if (k) (byBrand[k] ??= []).push(s); });
    const picks: Record<string, string[]> = {};
    Object.entries(byBrand).forEach(([k, list]) => {
      picks[k] = [...list]
        .sort((a, b) => (b.compatible_parts_count ?? 0) - (a.compatible_parts_count ?? 0))
        .map((s) => getPrimaryImage(s.images, s.image_url, ""))
        .filter(Boolean)
        .slice(0, 3);
    });
    const allPicks = ["xiaomi", "kaabo", "segway"].map((k) => picks[k]?.[0]).filter(Boolean) as string[];
    return { picks, allPicks };
  }, [allScooters]);

  // Marques visibles : seulement celles qui ont au moins un modèle publié, filtrées par la recherche
  const visibleBrands = useMemo(() => {
    const withModels = brands.filter((b) => counts[b.slug]);
    if (!nq) return withModels;
    return withModels.filter(
      (b) =>
        normalize(b.name).includes(nq) ||
        allScooters.some((s) => s.brand?.slug === b.slug && normalize(s.name).includes(nq))
    );
  }, [brands, counts, nq, allScooters]);

  // Filtre modèles : marque active puis recherche (nom du modèle ou de la marque)
  const filteredScooters = useMemo(() => {
    let list = activeBrand ? allScooters.filter((s) => s.brand?.slug === activeBrand) : allScooters;
    if (nq) {
      list = list.filter(
        (s) => normalize(s.name).includes(nq) || normalize(s.brand?.name ?? "").includes(nq)
      );
    }
    return list;
  }, [allScooters, activeBrand, nq]);

  const shownScooters = useMemo(() => applyFilters(filteredScooters, selection, sort), [filteredScooters, selection, sort]);

  // Get active brand name for display
  const activeBrandName = useMemo(() => {
    if (!activeBrand) return null;
    return brands.find(b => b.slug === activeBrand)?.name;
  }, [brands, activeBrand]);

  return (
    <div className="min-h-screen bg-greige pb-24 md:pb-0">
      <SEO
        title="Trottinettes Électriques - Trouver les pièces compatibles"
        description="Sélectionnez votre trottinette électrique pour trouver toutes les pièces compatibles. Xiaomi, Ninebot Max, Kaabo, Dualtron et plus."
        canonical="https://piecestrottinettes.fr/trottinettes"
      />
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
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-carbon tracking-[0.1em] sm:tracking-[0.2em] uppercase"
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
            {scootersLoading ? "Chargement..." : `${shownScooters.length} modèle${shownScooters.length > 1 ? "s" : ""}${activeBrandName ? ` ${activeBrandName}` : ""}`}
          </motion.div>
        </section>

        {/* Brand Bento Grid */}
        <section className="container mx-auto px-4 pb-6">
          {filterLook ? (
            <div className="max-w-xl mx-auto mb-6"><RacingSearch look={filterLook} value={query} onChange={setQuery} /></div>
          ) : (
          <div className="max-w-md mx-auto mb-5">
            <label htmlFor="scooter-search" className="sr-only">
              Rechercher une marque ou un modèle
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" aria-hidden />
              <input
                id="scooter-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Marque ou modèle (ex. Xiaomi, G30…)"
                className="w-full h-12 pl-12 pr-4 rounded-lg border border-gray-300 bg-white text-base text-carbon outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
          </div>
          )}
          {look && !(brandsLoading || scootersLoading) ? (
            <BrandCarouselLooks
              look={look}
              brands={visibleBrands}
              activeBrand={activeBrand}
              onBrandChange={setActiveBrand}
              picks={picks}
              counts={counts}
              allPicks={allPicks}
              total={allScooters.length}
            />
          ) : (
            <BrandBentoGrid
              brands={visibleBrands}
              activeBrand={activeBrand}
              onBrandChange={setActiveBrand}
              isLoading={brandsLoading || scootersLoading}
              covers={covers}
              counts={counts}
            />
          )}
        </section>

        {/* 17/10 : marque choisie → accès visible à sa page (avis, gamme, toutes les pièces). */}
        {activeBrand && activeBrandName && (
          <section className="container mx-auto px-4 -mt-2 pb-2">
            <Link to={`/marque/${activeBrand}`} className="flex items-center gap-3 min-h-[52px] pl-4 pr-3 bg-white max-w-2xl transition-transform hover:-translate-y-0.5"
              style={{ clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)", boxShadow: "inset 4px 0 0 #4A7C59, inset 0 0 0 1px #E2DCD0" }}>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-extrabold uppercase tracking-wide truncate text-carbon">Tout sur {activeBrandName}</span>
                <span className="block text-sm text-gray-500 truncate">L'avis de l'atelier, la gamme et toutes les pièces</span>
              </span>
              <span aria-hidden className="text-xl text-carbon">→</span>
            </Link>
          </section>
        )}

        {/* Scooter Models Grid */}
        <section className="container mx-auto px-4 py-6">
          {!scootersLoading && (
            <ScooterFilters
              base={filteredScooters}
              selection={selection}
              onToggle={toggleFilter}
              onClear={clearFilters}
              sort={sort}
              onSort={setSort}
              resultCount={shownScooters.length}
              look={filterLook}
            />
          )}
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
            ) : shownScooters.length > 0 ? (
              <motion.div
                key={`${activeBrand || "all"}-${sort}-${params.toString()}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
              >
                {shownScooters.map((scooter, index) => (
                  <ScooterModelCard key={scooter.id} scooter={scooter} index={index} />
                ))}
              </motion.div>
            ) : (
              <EmptyState onClear={() => { setActiveBrand(null); setQuery(""); clearFilters(); }} />
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
};

export default Scooters;
