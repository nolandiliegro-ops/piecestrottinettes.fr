import { motion } from "framer-motion";
import CategoryBentoCard from "./CategoryBentoCard";
import { useCategoryPartsCount } from "@/hooks/useCategoryPartsCount";
import { Skeleton } from "@/components/ui/skeleton";

// Hero card slug
const HERO_SLUG = "pneus";

// Display order for the racing bento grid
const CATEGORY_ORDER = [
  "pneus",              // Hero — col-span-2 row-span-2
  "disques-plaquettes",
  "chargeurs",
  "chambres-air",
  "batteries",
  "accessoires",
];

const ShopByCategorySection = () => {
  const { data: categories, isLoading } = useCategoryPartsCount();

  const sortedCategories = categories?.sort((a, b) => {
    const indexA = CATEGORY_ORDER.indexOf(a.slug);
    const indexB = CATEGORY_ORDER.indexOf(b.slug);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  }) || [];

  return (
    <section className="relative py-16 lg:py-24 overflow-hidden">
      {/* Greige → Dark transition mask */}
      <div
        className="absolute top-0 left-0 right-0 h-[120px] z-20 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, hsl(30 14% 95%) 0%, transparent 100%)",
        }}
      />

      {/* Anthracite background */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, #1A1A1E 0%, #121215 100%)",
        }}
      />

      {/* Carbon fiber texture overlay — barely suggested */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='6' height='6' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='3' height='3' fill='%23ffffff' fill-opacity='0.03'/%3E%3Crect x='3' y='3' width='3' height='3' fill='%23ffffff' fill-opacity='0.03'/%3E%3C/svg%3E")`,
          backgroundSize: "6px 6px",
        }}
      />

      {/* Neon grid overlay */}
      <div className="gaming-grid-bg" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-12 lg:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <h2
            className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl uppercase bg-gradient-to-r from-[#C0C0C0] via-white to-[#A0A0A0] bg-clip-text text-transparent"
            style={{
              fontWeight: 800,
              letterSpacing: "0.06em",
            }}
          >
            SHOP BY CATEGORY
          </h2>
          <p
            className="mt-3 lg:mt-4 font-light text-sm lg:text-base"
            style={{ color: "hsla(0, 0%, 100%, 0.5)" }}
          >
            Performance · Précision · Ingénierie
          </p>
        </motion.div>

        {/* Racing Bento Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 max-w-6xl mx-auto">
            {[...Array(5)].map((_, i) => (
              <Skeleton
                key={i}
                className={`${i === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-[4/3]"} rounded-2xl bg-white/5`}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 max-w-6xl mx-auto">
            {sortedCategories.map((category, index) => (
              <CategoryBentoCard
                key={category.id}
                category={category}
                partsCount={category.parts_count}
                isHero={category.slug === HERO_SLUG}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ShopByCategorySection;
