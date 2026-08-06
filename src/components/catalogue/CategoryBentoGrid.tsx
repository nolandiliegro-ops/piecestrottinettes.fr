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
  /** Décomptes optionnels par id de catégorie ; sous-titre masqué si absent. */
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-40 sm:h-44 rounded-3xl" />
        ))}
      </div>
    );
  }

  const cardBase =
    "relative w-full h-40 sm:h-44 rounded-3xl bg-[#FAFAF8] border border-neutral-200/60 p-5 shadow-sm hover:shadow-2xl hover:border-neutral-300 transition-all duration-300 group overflow-hidden flex flex-col justify-between text-left";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {/* "Toutes" button */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
        onClick={() => onCategoryChange(null)}
        className={cn(
          cardBase,
          activeCategory === null && "border-[#4A7C59] border-2 bg-[#4A7C59]/10"
        )}
      >
        <span className="flex h-24 sm:h-28 w-full items-center justify-center">
          <LayoutGrid className="h-12 w-12 text-neutral-800 drop-shadow-[0_10px_15px_rgba(0,0,0,0.15)] group-hover:scale-105 group-hover:-translate-y-1.5 transition-all duration-300" />
        </span>
        <span className="block">
          <span className="block text-base font-black text-neutral-900 uppercase tracking-tight">
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
          <div key={category.id} className="relative group">
            <motion.button
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                cardBase,
                isActive && "border-[#4A7C59] border-2 bg-[#4A7C59]/10"
              )}
            >
              {/* Visuel 3D détouré */}
              <span className="flex h-24 sm:h-28 w-full items-center justify-center">
                {categoryImage ? (
                  <img
                    src={categoryImage}
                    alt={
                      typeof catImgData === "string"
                        ? category.name
                        : catImgData?.alt_text || category.name
                    }
                    loading="lazy"
                    decoding="async"
                    className="h-24 sm:h-28 w-auto object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.15)] group-hover:scale-105 group-hover:-translate-y-1.5 transition-all duration-300"
                  />
                ) : (
                  <IconComponent className="h-12 w-12 text-neutral-800 drop-shadow-[0_10px_15px_rgba(0,0,0,0.15)] group-hover:scale-105 group-hover:-translate-y-1.5 transition-all duration-300" />
                )}
              </span>

              {/* Zone texte nue */}
              <span className="block min-w-0">
                <span className="block text-base font-black text-neutral-900 uppercase tracking-tight line-clamp-1">
                  {category.name}
                </span>
                {typeof count === "number" && (
                  <span className="block text-xs font-semibold text-neutral-500 mt-0.5">
                    {count} pièces
                  </span>
                )}
              </span>
            </motion.button>

            {/* Lien secondaire vers la page catégorie (frère du button, jamais enfant). */}
            <Link
              to={`/categorie/${category.slug}`}
              aria-label={`Voir la page ${category.name}`}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-4 right-4 z-10 flex items-center justify-center bg-neutral-900 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-200 shadow-md"
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
