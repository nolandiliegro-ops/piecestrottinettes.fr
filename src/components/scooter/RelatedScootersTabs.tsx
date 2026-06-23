import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Bike, Wrench } from "lucide-react";
import { getBrandColors } from "@/contexts/ScooterContext";
import { getPrimaryImage } from "@/lib/entityImage";
import { optimizedImage } from "@/lib/imageTransform";
import { useRelatedScooters, type RelatedScooter } from "@/hooks/useRelatedScooters";

interface RelatedScootersTabsProps {
  current: {
    id: string;
    brand_id: string | null;
    brandName: string | null;
    power_watts: number | null;
    max_speed_kmh: number | null;
    range_km: number | null;
  };
}

type TabKey = "brand" | "popular" | "budget";

// Distance specs normalisée (0 = identique). Proxy de gamme de prix tant que
// price_eur n'est pas alimenté.
const specDistance = (a: RelatedScootersTabsProps["current"], b: RelatedScooter): number => {
  const fields: [number | null, number | null, number][] = [
    [a.power_watts, b.power_watts, 5000],
    [a.max_speed_kmh, b.max_speed_kmh, 120],
    [a.range_km, b.range_km, 200],
  ];
  let sum = 0;
  let count = 0;
  for (const [av, bv, scale] of fields) {
    if (av != null && bv != null) {
      sum += Math.abs(av - bv) / scale;
      count += 1;
    }
  }
  return count > 0 ? sum / count : Infinity;
};

const MAX_CARDS = 8;

const ScooterCard = ({ scooter, index }: { scooter: RelatedScooter; index: number }) => {
  const brand = getBrandColors(scooter.brand?.name);
  const image = getPrimaryImage(scooter.images, scooter.image_url, "/placeholder.svg");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
    >
      <Link
        to={`/scooter/${scooter.slug}`}
        className="group block bg-white/50 backdrop-blur-md rounded-2xl border border-white/30 overflow-hidden hover:shadow-xl transition-all duration-300"
        style={{ borderColor: `${brand.accent}22` }}
      >
        {/* Image + logo marque */}
        <div className="relative aspect-square bg-gradient-to-br from-muted/30 to-muted/10 overflow-hidden">
          {/* Logo marque (fallback texte stylisé si null) */}
          <div className="absolute top-3 left-3 z-10">
            {scooter.brand?.logo_url ? (
              <img
                src={scooter.brand.logo_url}
                alt={scooter.brand.name}
                className="h-5 w-auto max-w-[72px] object-contain"
                loading="lazy"
              />
            ) : scooter.brand?.name ? (
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
                style={{ backgroundColor: brand.accent, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {scooter.brand.name}
              </span>
            ) : null}
          </div>

          {image ? (
            <div className="absolute inset-0 flex items-center justify-center p-2">
              <img
                src={optimizedImage(image, 400)}
                alt={scooter.name}
                className="max-w-[88%] max-h-[88%] object-contain group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Bike className="w-12 h-12 opacity-20" />
            </div>
          )}

          {/* Compteur pièces compatibles */}
          {scooter.compatible_parts_count && scooter.compatible_parts_count > 0 ? (
            <div className="absolute bottom-3 right-3">
              <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: `${brand.accent}e6` }}
              >
                <Wrench className="w-3 h-3" />
                {scooter.compatible_parts_count}
              </span>
            </div>
          ) : null}
        </div>

        {/* Contenu — nom modèle + marque, PAS de prix (price_eur vide) */}
        <div className="p-4">
          <h3
            className="text-base lg:text-lg text-carbon line-clamp-1 uppercase"
            style={{ fontFamily: "'Anton', sans-serif", letterSpacing: "-0.01em" }}
          >
            {scooter.name}
          </h3>
          {scooter.brand?.name && (
            <p className="text-xs text-muted-foreground mt-1">{scooter.brand.name}</p>
          )}
        </div>
      </Link>
    </motion.div>
  );
};

const RelatedScootersTabs = ({ current }: RelatedScootersTabsProps) => {
  const { data: all = [], isLoading } = useRelatedScooters();
  const [tab, setTab] = useState<TabKey>("brand");

  const accent = getBrandColors(current.brandName).accent;

  const { brandList, popularList, budgetList } = useMemo(() => {
    const others = all.filter((s) => s.id !== current.id);

    // Liste triée par proximité specs — source de fallback partout pour garantir
    // qu'aucun onglet n'est jamais vide.
    const byCloseness = [...others].sort((a, b) => specDistance(current, a) - specDistance(current, b));

    // Même marque
    let brand = current.brand_id ? others.filter((s) => s.brand_id === current.brand_id) : [];
    if (brand.length === 0) brand = byCloseness; // seul de sa marque → specs-proches

    // Populaires : is_featured_home prioritaire, complété par is_top_moment
    const featured = others.filter((s) => s.is_featured_home);
    const topMoment = others.filter((s) => s.is_top_moment && !s.is_featured_home);
    let popular = [...featured, ...topMoment];
    if (popular.length === 0) popular = byCloseness; // aucun flag → specs-proches

    // Même budget : proxy specs-proches.
    // TODO: basculer sur scooter_models.price_eur (±X%) quand le scraping prix
    //       scooter sera branché — remplacer le tri specDistance ci-dessus.
    const budget = byCloseness;

    return {
      brandList: brand.slice(0, MAX_CARDS),
      popularList: popular.slice(0, MAX_CARDS),
      budgetList: budget.slice(0, MAX_CARDS),
    };
  }, [all, current]);

  const tabs: { key: TabKey; label: string; list: RelatedScooter[] }[] = [
    { key: "brand", label: "Même marque", list: brandList },
    { key: "popular", label: "Populaires", list: popularList },
    { key: "budget", label: "Même budget", list: budgetList },
  ];

  const activeList = tabs.find((t) => t.key === tab)?.list ?? [];

  if (isLoading) {
    return (
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="h-10 w-72 bg-muted/50 rounded mb-8 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-[3/4] bg-muted/30 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Tous onglets vides (catalogue à 1 seul modèle) → on masque la section.
  if (brandList.length === 0 && popularList.length === 0 && budgetList.length === 0) {
    return null;
  }

  return (
    <section className="py-16 lg:py-20 bg-gradient-to-b from-transparent to-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        <h2
          className="text-3xl lg:text-4xl xl:text-5xl text-foreground uppercase mb-6"
          style={{ fontFamily: "'Unbounded', sans-serif", fontWeight: 800, letterSpacing: "-0.02em" }}
        >
          Autres modèles
        </h2>

        {/* Segmented control */}
        <div
          className="inline-flex p-1 rounded-full mb-8 border"
          style={{ backgroundColor: "rgba(255,255,255,0.6)", borderColor: "rgba(26,26,26,0.08)" }}
          role="tablist"
          aria-label="Filtrer les autres modèles"
        >
          {tabs.map((t) => {
            const isActive = t.key === tab;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setTab(t.key)}
                className="relative min-h-[40px] px-4 sm:px-5 rounded-full text-xs sm:text-sm font-semibold uppercase tracking-wider transition-colors"
                style={{
                  color: isActive ? "#FFFFFF" : "#6B7280",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {isActive && (
                  <motion.span
                    layoutId="related-tab-pill"
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: accent }}
                    transition={{ type: "spring", stiffness: 320, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Grille de cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {activeList.map((s, i) => (
            <ScooterCard key={s.id} scooter={s} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default RelatedScootersTabs;
