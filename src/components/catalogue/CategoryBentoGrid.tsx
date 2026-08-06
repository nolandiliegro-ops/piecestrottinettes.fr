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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-32 sm:h-36 rounded-2xl" />
        ))}
      </div>
    );
  }

  const cardBase =
    "relative w-full h-32 sm:h-36 rounded-2xl bg-white/80 backdrop-blur-sm border border-neutral-200/80 p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden group flex flex-col justify-between items-start text-left";

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
        <span className="flex h-20 w-full items-center justify-center">
          <LayoutGrid className="h-10 w-10 text-neutral-800 group-hover:scale-105 transition-transform" />
        </span>
        <span className="text-sm font-black text-neutral-900 uppercase tracking-tight line-clamp-2">
          Toutes
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
                isActive && "border-[#4A7C59] border-2 bg-[#4A7C59]/10"
              )}
            >
              {/* Visuel produit détouré */}
              <span className="flex h-20 w-full items-center justify-center">
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
                    className="h-20 w-auto object-contain group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <IconComponent className="h-10 w-10 text-neutral-800 group-hover:scale-105 transition-transform" />
                )}
              </span>

              {/* Label + décompte */}
              <span className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-black text-neutral-900 uppercase tracking-tight line-clamp-2">
                  {category.name}
                </span>
                {typeof count === "number" && (
                  <span className="shrink-0 bg-black/5 px-2 py-0.5 rounded-full text-xs font-medium text-neutral-700">
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
              className="absolute top-3 right-3 z-10 flex items-center justify-center bg-neutral-900 text-white p-1.5 rounded-full opacity-80 hover:opacity-100 group-hover:opacity-100 transition-opacity"
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
