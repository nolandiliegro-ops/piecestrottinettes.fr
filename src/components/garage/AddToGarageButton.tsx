import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Check, Star, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import AddToGarageDialog from './AddToGarageDialog';
import LuxurySuccessToast from './LuxurySuccessToast';
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/contexts/AuthContext";
import { useIsInGarage, useAddToGarage, useRemoveFromGarage, useToggleOwned } from "@/hooks/useGarage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AddToGarageButtonProps {
  scooterSlug: string;
  scooterName: string;
  className?: string;
}

const AddToGarageButton = ({ scooterSlug, scooterName, className }: AddToGarageButtonProps) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { inGarage, isOwned, garageItem } = useIsInGarage(scooterSlug);
  const addToGarage = useAddToGarage();
  const removeFromGarage = useRemoveFromGarage();
  const toggleOwned = useToggleOwned();
  const [isOpen, setIsOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'collection' | 'stable'>('collection');

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast.info("Connectez-vous pour gérer votre garage", {
        description: "Créez un compte pour sauvegarder vos favoris",
      });
      navigate("/login");
      return;
    }
  };

  const handleAddCollection = () => {
    setDialogMode('collection');
    setDialogOpen(true);
    setIsOpen(false);
  };

  const handleAddStable = () => {
    setDialogMode('stable');
    setDialogOpen(true);
    setIsOpen(false);
  };

  const handleDialogConfirm = (data: { nickname: string; currentKm: number }) => {
    addToGarage.mutate({ 
      scooterSlug, 
      isOwned: dialogMode === 'stable', 
      scooterName,
      nickname: data.nickname,
      currentKm: data.currentKm
    });
    setDialogOpen(false);
  };

  const handlePromoteToStable = () => {
    if (garageItem) {
      toggleOwned.mutate({ garageItemId: garageItem.id, newIsOwned: true });
    }
    setIsOpen(false);
  };

  const handleDemoteToCollection = () => {
    if (garageItem) {
      toggleOwned.mutate({ garageItemId: garageItem.id, newIsOwned: false });
    }
    setIsOpen(false);
  };

  const handleRemove = () => {
    if (garageItem) {
      removeFromGarage.mutate(garageItem.id);
    }
    setIsOpen(false);
  };

  // Determine button state and styles
  const getButtonStyles = () => {
    if (!inGarage) {
      // Not added - Glass neutral
      return "bg-white/40 backdrop-blur-md border border-white/30 text-carbon/60 hover:text-mineral hover:border-mineral/50 hover:bg-white/60";
    }
    if (isOwned) {
      // Stable - Petrol Blue + ring
      return "bg-garage text-garage-foreground ring-2 ring-garage/50 hover:bg-garage/90";
    }
    // Collection - Mineral Green
    return "bg-mineral/80 text-white backdrop-blur-md hover:bg-mineral";
  };

  const isLoading = addToGarage.isPending || removeFromGarage.isPending || toggleOwned.isPending;

  return (
    <>
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <motion.button
          onClick={handleClick}
          disabled={isLoading}
          className={cn(
            "relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 shadow-lg",
            getButtonStyles(),
            isLoading && "opacity-50 cursor-not-allowed",
            className
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={inGarage ? (isOwned ? "stable" : "collection") : "empty"}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Heart 
                className={cn(
                  "w-5 h-5 transition-all",
                  inGarage && "fill-current"
                )} 
              />
            </motion.div>
          </AnimatePresence>

          {/* Check Badge for Stable */}
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
      </DropdownMenuTrigger>

      {user && (
        <DropdownMenuContent 
          align="end" 
          className="w-56 bg-white/95 backdrop-blur-md border border-white/50 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {!inGarage ? (
            // Not in garage - Show add options
            <>
              <DropdownMenuItem 
                onClick={handleAddCollection}
                className="flex items-center gap-3 cursor-pointer hover:bg-mineral/10"
              >
                <Heart className="w-4 h-4 text-mineral" />
                <div className="flex flex-col">
                  <span className="font-medium">Ajouter aux favoris</span>
                  <span className="text-xs text-muted-foreground">+5 Performance Points</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleAddStable}
                className="flex items-center gap-3 cursor-pointer hover:bg-garage/10"
              >
                <Star className="w-4 h-4 text-garage" />
                <div className="flex flex-col">
                  <span className="font-medium">C'est ma trottinette !</span>
                  <span className="text-xs text-muted-foreground">+10 Performance Points</span>
                </div>
              </DropdownMenuItem>
            </>
          ) : (
            // Already in garage - Show toggle/remove options
            <>
              {isOwned ? (
                <DropdownMenuItem 
                  onClick={handleDemoteToCollection}
                  className="flex items-center gap-3 cursor-pointer hover:bg-mineral/10"
                >
                  <Heart className="w-4 h-4 text-mineral" />
                  <span>Déplacer dans mes favoris</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem 
                  onClick={handlePromoteToStable}
                  className="flex items-center gap-3 cursor-pointer hover:bg-garage/10"
                >
                  <Star className="w-4 h-4 text-garage" />
                  <div className="flex flex-col">
                    <span className="font-medium">Promouvoir en écurie</span>
                    <span className="text-xs text-muted-foreground">+5 Performance Points</span>
                  </div>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleRemove}
                className="flex items-center gap-3 cursor-pointer text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
                <span>Retirer du garage</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      )}
    </DropdownMenu>

      {/* Add to Garage Dialog */}
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

export default AddToGarageButton;
