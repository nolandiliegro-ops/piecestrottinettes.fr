import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LayoutGrid, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategoryImages } from "@/hooks/useCategoryImages";
import { resolveCategoryIcon } from "@/lib/categoryIcons";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  slug: string;
  parent_id?: string | null;
  // Nom du composant Lucide en BDD (Palier 0) ; fallback legacy par slug géré par le resolver.
  lucide_icon?: string | null;
}

interface CategoryBentoGridProps {
  categories: Category[];
  activeCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  isLoading?: boolean;
  /** Décomptes optionnels par id de catégorie ; badge masqué si absent. */
  counts?: Record<string, number>;
}

const CategoryBentoGrid = ({
  categories,
  activeCategory,
  onCategoryChange,
  isLoading = false,
  counts,
}: CategoryBentoGridProps) => {
  const { data: categoryImages = {} } = useCategoryImages();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-16 sm:h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  const cardBase =
    "relative w-full h-16 sm:h-20 rounded-xl overflow-hidden border flex items-center text-left transition-all duration-300";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {/* "Toutes" button */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
        onClick={() => onCategoryChange(null)}
        className={cn(
          cardBase,
          activeCategory === null
            ? "bg-[#4A7C59]/15 border-[#4A7C59]"
            : "bg-white border-black/10 hover:border-black/20"
        )}
      >
        <span className="h-full aspect-square shrink-0 flex items-center justify-center bg-carbon rounded-l-xl">
          <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6 text-white/85" />
        </span>
        <span className="flex-1 min-w-0 px-3 pr-9">
          <span className="block text-sm font-semibold line-clamp-2 text-foreground">
            Toutes
          </span>
        </span>
      </motion.button>

      {/* Category buttons */}
      {categories.map((category) => {
        const IconComponent = resolveCategoryIcon(category.lucide_icon, category.slug);
        const isActive = activeCategory === category.id;
        const catImgData = categoryImages[category.id];
        const categoryImage = typeof catImgData === "string" ? catImgData : catImgData?.image_url;
        const count = counts?.[category.id];

        return (
          <div key={category.id} className="relative">
            <motion.button
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                cardBase,
                isActive
                  ? "bg-[#4A7C59]/15 border-[#4A7C59]"
                  : "bg-white border-black/10 hover:border-black/20"
              )}
            >
              {/* Miniature à gauche */}
              {categoryImage ? (
                <img
                  src={categoryImage}
                  alt={typeof catImgData === "string" ? category.name : (catImgData?.alt_text || category.name)}
                  loading="lazy"
                  decoding="async"
                  className="h-full aspect-square shrink-0 object-cover rounded-l-xl"
                />
              ) : (
                <span className="h-full aspect-square shrink-0 flex items-center justify-center bg-carbon rounded-l-xl">
                  <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-white/85" />
                </span>
              )}

              {/* Nom au centre */}
              <span className="flex-1 min-w-0 px-3 pr-9 flex items-center gap-2">
                <span className="block text-sm font-semibold line-clamp-2 text-foreground">
                  {category.name}
                </span>
                {typeof count === "number" && (
                  <span className="shrink-0 bg-black/5 px-2 py-0.5 rounded-full text-xs text-foreground/70">
                    {count}
                  </span>
                )}
              </span>
            </motion.button>

            {/* Lien secondaire vers la page catégorie (frère du button, jamais enfant). */}
            <Link
              to={`/categorie/${category.slug}`}
              aria-label={`Voir la page ${category.name}`}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center rounded-full p-1.5 bg-black/10 text-carbon hover:bg-black/20 transition-colors"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        );
      })}
    </div>
  );
};

export default CategoryBentoGrid;
