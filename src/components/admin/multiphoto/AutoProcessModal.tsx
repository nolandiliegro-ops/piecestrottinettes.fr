import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface AutoProcessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isProcessing: boolean;
  onLaunch: (urls: string[]) => void;
}

const isHttpUrl = (s: string) => /^https?:\/\/\S+/i.test(s.trim());

export const AutoProcessModal = ({
  open,
  onOpenChange,
  isProcessing,
  onLaunch,
}: AutoProcessModalProps) => {
  const [raw, setRaw] = useState("");

  const urls = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const validUrls = urls.filter(isHttpUrl);
  const tooMany = validUrls.length > 4;
  const canLaunch = !isProcessing && validUrls.length > 0 && validUrls.length <= 4;

  const handleClose = (next: boolean) => {
    if (!next && !isProcessing) setRaw("");
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Récupérer & détourer automatiquement</DialogTitle>
          <DialogDescription>
            Colle 1 à 4 URLs d'images publiques (une par ligne). Remove.bg les
            détourera et les ajoutera à la galerie.
          </DialogDescription>
        </DialogHeader>

        {isProcessing ? (
          <div className="flex flex-col items-center justify-center gap-4 py-10">
            <Loader2 className="h-10 w-10 animate-spin text-green-700" />
            <p className="text-sm font-medium text-foreground">
              Détourage en cours, 30 à 60 secondes...
            </p>
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              Tu peux fermer cette modal, le traitement continue en arrière-plan.
              Tu seras notifié à la fin.
            </p>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <Textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder={"https://exemple.com/photo1.jpg\nhttps://exemple.com/photo2.jpg"}
              rows={6}
              className="font-mono text-sm"
            />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {validUrls.length} URL{validUrls.length > 1 ? "s" : ""} valide
                {validUrls.length > 1 ? "s" : ""} sur {urls.length || 0}
              </span>
              {tooMany && (
                <span className="text-destructive font-medium">
                  Maximum 4 URLs
                </span>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isProcessing}
          >
            Fermer
          </Button>
          <Button
            onClick={() => onLaunch(validUrls.slice(0, 4))}
            disabled={!canLaunch}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            Lancer le détourage
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
