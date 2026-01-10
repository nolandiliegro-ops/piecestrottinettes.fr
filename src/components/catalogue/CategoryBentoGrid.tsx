import { motion } from "framer-motion";
import { 
  LayoutGrid, 
  Disc, 
  CircleDot, 
  Octagon, 
  Plug, 
  Battery, 
  Backpack,
  LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategoryImages } from "@/hooks/useCategoryImages";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  slug: string;
}

interface CategoryBentoGridProps {
  categories: Category[];
  activeCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  isLoading?: boolean;
}

// Mapping slug -> Lucide icon
const iconMap: Record<string, LucideIcon> = {
  pneus: Disc,
  "chambres-a-air": CircleDot,
  freinage: Octagon,
  chargeurs: Plug,
  batteries: Battery,
  accessoires: Backpack,
};

const CategoryBentoGrid = ({
  categories,
  activeCategory,
  onCategoryChange,
  isLoading = false,
}: CategoryBentoGridProps) => {
  const { data: categoryImages = {} } = useCategoryImages();

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {/* "Toutes" button */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => onCategoryChange(null)}
        className={cn(
          "relative aspect-[4/5] rounded-2xl overflow-hidden",
          activeCategory === null && "ring-2 ring-mineral ring-offset-2 ring-offset-greige"
        )}
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
        const IconComponent = iconMap[category.slug] || LayoutGrid;
        const isActive = activeCategory === category.id;
        const categoryImage = categoryImages[category.id];

        return (
          <motion.button
            key={category.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              "relative aspect-[4/5] rounded-2xl overflow-hidden",
              isActive && "ring-2 ring-mineral ring-offset-2 ring-offset-greige"
            )}
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
                  alt={category.name}
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
        );
      })}
    </div>
  );
};

export default CategoryBentoGrid;
