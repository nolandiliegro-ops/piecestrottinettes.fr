import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Warehouse, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/contexts/AuthContext";
import { useIsInGarage, useAddToGarage, useRemoveFromGarage } from "@/hooks/useGarage";
import AddToGarageDialog from "./AddToGarageDialog";

interface GarageButtonProps {
  scooterSlug: string;
  scooterName: string;
  className?: string;
}

const GarageButton = ({ scooterSlug, scooterName, className }: GarageButtonProps) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { inGarage, isOwned, garageItem } = useIsInGarage(scooterSlug);
  const addToGarage = useAddToGarage();
  const removeFromGarage = useRemoveFromGarage();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast.info("Connectez-vous pour gérer votre garage", {
        description: "Créez un compte pour ajouter vos trottinettes",
      });
      navigate("/login");
      return;
    }

    // If already owned, remove from garage
    if (isOwned && garageItem) {
      removeFromGarage.mutate(garageItem.id);
      return;
    }

    // Open dialog to add with details
    setDialogOpen(true);
  };

  const handleDialogConfirm = (data: { nickname: string; currentKm: number }) => {
    addToGarage.mutate({
      scooterSlug,
      isOwned: true,
      scooterName,
      nickname: data.nickname,
      currentKm: data.currentKm,
    });
    setDialogOpen(false);
  };

  const isLoading = addToGarage.isPending || removeFromGarage.isPending;

  return (
    <>
      <motion.button
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          "relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 shadow-lg",
          isOwned 
            ? "bg-garage text-garage-foreground ring-2 ring-garage/50 hover:bg-garage/90" 
            : "bg-white/80 backdrop-blur-md border border-garage/20 text-carbon/60 hover:text-garage hover:border-garage/40 hover:bg-white",
          isLoading && "opacity-50 cursor-not-allowed",
          className
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={isOwned ? "Retirer de mon écurie" : "C'est ma trottinette !"}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isOwned ? "owned" : "not-owned"}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Warehouse className="w-5 h-5" />
          </motion.div>
        </AnimatePresence>

        {/* Check Badge for Owned */}
        <AnimatePresence>
          {isOwned && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-md"
            >
              <Check className="w-3 h-3 text-garage" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AddToGarageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        scooterName={scooterName}
        onConfirm={handleDialogConfirm}
        isLoading={addToGarage.isPending}
      />
    </>
  );
};

export default GarageButton;
