import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRemoveFromGarage } from '@/hooks/useGarage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DeleteScooterButtonProps {
  garageItemId: string;
  modelName: string;
  onDeleted?: () => void;
}

const DeleteScooterButton = ({ garageItemId, modelName, onDeleted }: DeleteScooterButtonProps) => {
  const [open, setOpen] = useState(false);
  const removeFromGarage = useRemoveFromGarage();

  const handleDelete = () => {
    removeFromGarage.mutate(garageItemId, {
      onSuccess: () => {
        setOpen(false);
        onDeleted?.();
      },
    });
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(true)}
        className="w-9 h-9 rounded-full bg-white/60 backdrop-blur-sm border border-white/30
                   flex items-center justify-center
                   hover:bg-red-50 hover:border-red-200 transition-colors group"
        title="Retirer du garage"
      >
        <Trash2 className="w-4 h-4 text-carbon/40 group-hover:text-red-500 transition-colors" />
      </motion.button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="bg-background/95 backdrop-blur-xl border-mineral/20 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-lg">
              Retirer {modelName} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette trottinette sera retirée de votre garage. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DeleteScooterButton;
