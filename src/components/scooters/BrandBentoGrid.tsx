import { motion } from "framer-motion";
import { LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

interface BrandBentoGridProps {
  brands: Brand[];
  activeBrand: string | null;
  onBrandChange: (brandSlug: string | null) => void;
  isLoading?: boolean;
}

const BrandBentoGrid = ({
  brands,
  activeBrand,
  onBrandChange,
  isLoading = false,
}: BrandBentoGridProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-wrap justify-center gap-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="w-28 md:w-32 lg:w-36 aspect-[4/5] rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {/* "Toutes" button */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => onBrandChange(null)}
        className={cn(
          "relative w-28 md:w-32 lg:w-36 aspect-[4/5] rounded-2xl overflow-hidden flex-shrink-0",
          activeBrand === null && "ring-2 ring-mineral ring-offset-2 ring-offset-greige"
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
            activeBrand === null ? "bg-mineral" : "bg-white/95"
          )}>
            <span className={cn(
              "font-montserrat font-bold text-xs md:text-sm uppercase tracking-wide",
              activeBrand === null ? "text-white" : "text-carbon"
            )}>
              Toutes
            </span>
          </div>
        </div>
      </motion.button>

      {/* Brand buttons */}
      {brands.map((brand) => {
        const isActive = activeBrand === brand.slug;

        return (
          <motion.button
            key={brand.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => onBrandChange(brand.slug)}
            className={cn(
              "relative w-28 md:w-32 lg:w-36 aspect-[4/5] rounded-2xl overflow-hidden flex-shrink-0",
              isActive && "ring-2 ring-mineral ring-offset-2 ring-offset-greige"
            )}
          >
            {/* Background with hover zoom */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-br from-carbon/80 to-carbon/50"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
            
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            
            {/* Logo or Brand Name centered */}
            <div className="absolute inset-0 flex items-center justify-center z-10 p-4">
              {brand.logo_url ? (
                <img
                  src={brand.logo_url}
                  alt={brand.name}
                  className="max-w-full max-h-12 object-contain filter brightness-0 invert opacity-80"
                />
              ) : (
                <span className="font-display text-xl text-white/80 text-center leading-tight">
                  {brand.name}
                </span>
              )}
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
                  {brand.name}
                </span>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

export default BrandBentoGrid;
