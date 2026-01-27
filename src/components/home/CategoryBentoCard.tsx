import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Disc, 
  Cog, 
  Battery, 
  Cpu, 
  Lightbulb, 
  Backpack,
  LucideIcon 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCategoryImages } from "@/hooks/useCategoryImages";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

interface CategoryBentoCardProps {
  category: Category;
  partsCount: number;
  isLarge?: boolean;
  index: number;
}

// Icon mapping by slug
const iconMap: Record<string, LucideIcon> = {
  pneus: Disc,
  freinage: Disc,
  moteurs: Cog,
  batteries: Battery,
  controleurs: Cpu,
  chargeurs: Cpu,
  lumieres: Lightbulb,
  accessoires: Backpack,
};

const CategoryBentoCard = ({ 
  category, 
  partsCount, 
  isLarge = false, 
  index 
}: CategoryBentoCardProps) => {
  const { data: categoryImages = {} } = useCategoryImages();
  const IconComponent = iconMap[category.slug] || Backpack;
  const imageUrl = categoryImages[category.id];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1, 
        ease: [0.25, 0.46, 0.45, 0.94] 
      }}
      className={cn(
        isLarge ? "lg:col-span-2" : "col-span-1"
      )}
    >
      <Link to={`/catalogue?category=${category.slug}`}>
        <motion.div
          whileHover={{ 
            scale: 1.02, 
            y: -8,
            transition: { duration: 0.4, ease: "easeOut" }
          }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "group relative overflow-hidden cursor-pointer",
            "rounded-[24px] border border-white/30",
            "transition-all duration-400 ease-out",
            isLarge ? "aspect-[2/1]" : "aspect-square"
          )}
          style={{
            boxShadow: "0 8px 32px rgba(26, 26, 26, 0.08)",
          }}
        >
          {/* Background Image with zoom on hover */}
          <div className="absolute inset-0 overflow-hidden rounded-[24px]">
            <motion.div 
              className="absolute inset-0 w-full h-full"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={category.name}
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-carbon/80 to-carbon/60" />
              )}
            </motion.div>
          </div>

          {/* Glassmorphism Overlay */}
          <div 
            className="absolute inset-0 flex flex-col justify-end p-5 lg:p-6"
            style={{
              background: "linear-gradient(to top, rgba(245,243,240,0.9) 0%, rgba(245,243,240,0.7) 40%, transparent 100%)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            {/* Icon */}
            <div className="mb-2 lg:mb-3">
              <IconComponent className="w-6 h-6 lg:w-8 lg:h-8 text-mineral" />
            </div>

            {/* Category Name */}
            <h3 
              className="font-display text-xl lg:text-2xl xl:text-3xl text-carbon uppercase"
              style={{ fontWeight: 800, letterSpacing: "-0.02em" }}
            >
              {category.name}
            </h3>

            {/* Parts Count */}
            <p className="text-xs lg:text-sm text-muted-foreground font-medium mt-1">
              {partsCount} pièces
            </p>
          </div>

          {/* Hover Glow Border */}
          <div 
            className="absolute inset-0 rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{ 
              boxShadow: "inset 0 0 0 2px rgba(147,181,161,0.5), 0 0 30px rgba(147,181,161,0.3)" 
            }}
          />
        </motion.div>
      </Link>
    </motion.div>
  );
};

export default CategoryBentoCard;
