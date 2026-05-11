import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export const ConfirmResetDialog = ({
  open,
  onOpenChange,
  onConfirm,
}: ConfirmResetDialogProps) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Vider la galerie ?</AlertDialogTitle>
        <AlertDialogDescription>
          Cette action retire toutes les photos de la galerie multi-photos.
          Les fichiers eux-mêmes restent dans le bucket (cleanup orphelins
          futur). Le champ image_url legacy n'est pas affecté.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Annuler</AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          className="bg-red-600 hover:bg-red-700"
        >
          Tout supprimer
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
