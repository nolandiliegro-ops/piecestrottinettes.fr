import { motion } from "framer-motion";
import CategoryBentoCard from "./CategoryBentoCard";
import { useCategoryPartsCount } from "@/hooks/useCategoryPartsCount";
import { Skeleton } from "@/components/ui/skeleton";

// Define which categories should be large (span 2 columns)
const LARGE_CATEGORIES = ["pneus", "lumieres"];

// Define the display order for the bento grid
const CATEGORY_ORDER = [
  "pneus",      // Large - Row 1
  "freinage",   // Row 1 (fallback if no pneus)
  "batteries",  // Row 1
  "chargeurs",  // Row 2
  "lumieres",   // Large - Row 2
  "accessoires" // Row 2
];

const ShopByCategorySection = () => {
  const { data: categories, isLoading } = useCategoryPartsCount();

  // Sort categories according to our desired order
  const sortedCategories = categories?.sort((a, b) => {
    const indexA = CATEGORY_ORDER.indexOf(a.slug);
    const indexB = CATEGORY_ORDER.indexOf(b.slug);
    // If not in order array, put at end
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  }) || [];

  return (
    <section className="py-12 lg:py-20 bg-greige">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div 
          className="text-center mb-10 lg:mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <h2 
            className="font-display text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-carbon uppercase"
            style={{ fontWeight: 800, letterSpacing: "-0.02em" }}
          >
            SHOP BY CATEGORY
          </h2>
          <p className="text-muted-foreground mt-3 lg:mt-4 font-light text-sm lg:text-base">
            Trouvez rapidement ce dont vous avez besoin
          </p>
        </motion.div>

        {/* Bento Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 max-w-6xl mx-auto">
            {[...Array(6)].map((_, i) => (
              <Skeleton 
                key={i} 
                className={`${i === 0 || i === 4 ? 'lg:col-span-2 aspect-[2/1]' : 'aspect-square'} rounded-[24px]`}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 max-w-6xl mx-auto">
            {sortedCategories.map((category, index) => (
              <CategoryBentoCard
                key={category.id}
                category={category}
                partsCount={category.parts_count}
                isLarge={LARGE_CATEGORIES.includes(category.slug)}
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
