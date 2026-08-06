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
}

const CategoryBentoGrid = ({
  categories,
  activeCategory,
  onCategoryChange,
  isLoading = false,
}: CategoryBentoGridProps) => {
  const { data: categoryImages = {} } = useCategoryImages();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
        ))}
      </div>
    );
  }


  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {/* "Toutes" button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.3 }}
        onClick={() => onCategoryChange(null)}
        className={cn(
          "relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/10",
          "transition-all duration-300",
          activeCategory === null && "ring-2 ring-mineral ring-offset-2 ring-offset-greige"
        )}
        style={activeCategory === null ? {
          boxShadow: "0 0 20px 4px rgba(147, 181, 161, 0.5)"
        } : {}}
      >

        {/* Background with hover zoom */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-carbon/90 to-carbon/60"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        
        {/* Icon centered */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <LayoutGrid className="w-10 h-10 md:w-12 md:h-12 text-white/80" />
        </div>
        
        {/* Brand Label Tab - Bottom Left */}
        <div className="absolute bottom-0 left-0 z-20">
          <div className={cn(
            "px-3 py-1.5 md:px-4 md:py-2 rounded-tr-xl",
            activeCategory === null ? "bg-mineral" : "bg-white/95"
          )}>
            <span className={cn(
              "font-montserrat font-bold text-xs md:text-sm uppercase tracking-wide",
              activeCategory === null ? "text-white" : "text-carbon"
            )}>
              Toutes
            </span>
          </div>
        </div>
      </motion.button>

      {/* Category buttons */}
      {categories.map((category) => {
        const IconComponent = resolveCategoryIcon(category.lucide_icon, category.slug);
        const isActive = activeCategory === category.id;
        const catImgData = categoryImages[category.id];
        const categoryImage = typeof catImgData === 'string' ? catImgData : catImgData?.image_url;

        return (
          <div key={category.id} className="relative w-24 md:w-28 lg:w-32 flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.3 }}
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              "relative w-full aspect-[4/5] rounded-2xl overflow-hidden border border-white/10",
              "transition-all duration-300",
              isActive && "ring-2 ring-mineral ring-offset-2 ring-offset-greige"
            )}
            style={isActive ? {
              boxShadow: "0 0 20px 4px rgba(147, 181, 161, 0.5)"
            } : {}}
          >
            {/* Image/Gradient with hover zoom - NOT the card */}
            <motion.div 
              className="absolute inset-0"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {categoryImage ? (
                <img 
                  src={categoryImage} 
                  alt={typeof catImgData === 'string' ? category.name : (catImgData?.alt_text || category.name)}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-carbon/90 to-carbon/60" />
              )}
            </motion.div>
            
            {/* Overlay gradient for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            
            {/* Icon centered */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <IconComponent className="w-10 h-10 md:w-12 md:h-12 text-white/80" />
            </div>
            
            {/* Brand Label Tab - Bottom Left */}
            <div className="absolute bottom-0 left-0 z-20">
              <div className={cn(
                "px-3 py-1.5 md:px-4 md:py-2 rounded-tr-xl",
                isActive ? "bg-mineral" : "bg-white/95"
              )}>
                <span className={cn(
                  "font-montserrat font-bold text-xs md:text-sm uppercase tracking-wide",
                  isActive ? "text-white" : "text-carbon"
                )}>
                  {category.name}
                </span>
              </div>
            </div>
          </motion.button>
            {/* Lien secondaire vers la page catégorie (frère du button, jamais enfant). */}
            <Link
              to={`/categorie/${category.slug}`}
              aria-label={`Voir la page ${category.name}`}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-1.5 right-1.5 z-20 flex items-center justify-center rounded-full p-1.5 bg-black/45 backdrop-blur-sm text-white hover:bg-black/65 transition-colors"
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
