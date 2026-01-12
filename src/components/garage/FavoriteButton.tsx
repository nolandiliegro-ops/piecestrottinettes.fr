import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/contexts/AuthContext";
import { useIsInGarage, useAddToGarage, useRemoveFromGarage } from "@/hooks/useGarage";

interface FavoriteButtonProps {
  scooterSlug: string;
  scooterName: string;
  className?: string;
}

const FavoriteButton = ({ scooterSlug, scooterName, className }: FavoriteButtonProps) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { inGarage, isOwned, garageItem } = useIsInGarage(scooterSlug);
  const addToGarage = useAddToGarage();
  const removeFromGarage = useRemoveFromGarage();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast.info("Connectez-vous pour ajouter des favoris", {
        description: "Créez un compte pour sauvegarder vos favoris",
      });
      navigate("/login");
      return;
    }

    // If already in garage as favorite (not owned), remove it
    if (inGarage && !isOwned && garageItem) {
      removeFromGarage.mutate(garageItem.id);
      return;
    }

    // If not in garage, add as favorite
    if (!inGarage) {
      addToGarage.mutate({
        scooterSlug,
        isOwned: false,
        scooterName,
      });
    }
  };

  const isLoading = addToGarage.isPending || removeFromGarage.isPending;
  const isFavorite = inGarage && !isOwned;

  return (
    <motion.button
      onClick={handleClick}
      disabled={isLoading || isOwned}
      className={cn(
        "relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 shadow-lg",
        isFavorite 
          ? "bg-mineral text-white hover:bg-mineral-dark" 
          : isOwned
            ? "bg-muted/50 text-muted-foreground cursor-not-allowed opacity-50"
            : "bg-white/80 backdrop-blur-md border border-mineral/20 text-carbon/60 hover:text-mineral hover:border-mineral/40 hover:bg-white",
        isLoading && "opacity-50 cursor-not-allowed",
        className
      )}
      whileHover={!isOwned ? { scale: 1.05 } : {}}
      whileTap={!isOwned ? { scale: 0.95 } : {}}
      title={isOwned ? "Déjà dans votre écurie" : isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isFavorite ? "filled" : "empty"}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Heart 
            className={cn(
              "w-5 h-5 transition-all",
              isFavorite && "fill-current"
            )} 
          />
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
};

export default FavoriteButton;
