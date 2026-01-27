import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";

interface PartFavoriteButtonProps {
  partId: string;
  partName?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const PartFavoriteButton = ({ 
  partId, 
  partName, 
  className,
  size = "md" 
}: PartFavoriteButtonProps) => {
  const { isFavorite, toggleFavorite, isToggling, user } = useFavorites();
  
  const isFav = isFavorite(partId);
  
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };
  
  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(partId, partName);
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={isToggling}
      className={cn(
        "relative flex items-center justify-center rounded-full transition-all duration-300 shadow-lg",
        sizeClasses[size],
        isFav 
          ? "bg-destructive text-white hover:bg-destructive/90" 
          : "bg-white/90 backdrop-blur-md border border-carbon/10 text-carbon/50 hover:text-destructive hover:border-destructive/30 hover:bg-white",
        isToggling && "opacity-50 cursor-not-allowed",
        !user && "hover:text-carbon/60",
        className
      )}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isFav ? "filled" : "empty"}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Heart 
            className={cn(
              iconSizes[size],
              "transition-all",
              isFav && "fill-current"
            )} 
          />
        </motion.div>
      </AnimatePresence>
      
      {/* Pulse effect when favorited */}
      {isFav && (
        <motion.div
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 rounded-full bg-destructive"
        />
      )}
    </motion.button>
  );
};

export default PartFavoriteButton;
