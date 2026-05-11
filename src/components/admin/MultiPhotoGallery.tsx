import { useRef, useState } from "react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { toast } from "sonner";
import { Sparkles, Upload, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMultiPhotoGallery } from "@/hooks/useMultiPhotoGallery";
import type { EntityType, ProcessedImage } from "@/types/multiPhoto";
import { AutoProcessModal } from "./multiphoto/AutoProcessModal";
import { PhotoCard } from "./multiphoto/PhotoCard";
import { ConfirmResetDialog } from "./multiphoto/ConfirmResetDialog";

interface MultiPhotoGalleryProps {
  entityType: EntityType;
  entityId: string;
  defaultAltBase: string;
  onUpdate?: () => void;
}

export const MultiPhotoGallery = ({
  entityType,
  entityId,
  defaultAltBase,
  onUpdate,
}: MultiPhotoGalleryProps) => {
  const {
    currentImages,
    isLoading,
    autoProcess,
    uploadManual,
    setPrimary,
    updateAlt,
    deleteOne,
    reorder,
    resetAll,
  } = useMultiPhotoGallery(entityType, entityId, defaultAltBase);

  const [autoOpen, setAutoOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const refresh = () => onUpdate?.();

  const handleAutoLaunch = (urls: string[]) => {
    autoProcess.mutate(urls, {
      onSuccess: (data) => {
        const failed = (data?.failed_count as number) ?? 0;
        const ok = (data?.processed_count as number) ?? 0;
        // Toast persistant si modal fermée pendant l'attente
        const isAutoModalOpen = autoOpen;
        const opts = isAutoModalOpen ? {} : { duration: Infinity };
        if (failed > 0) {
          toast.warning(
            `Détourage : ${ok} succès, ${failed} échec(s).`,
            {
              description: Array.isArray(data?.failed_urls)
                ? data.failed_urls
                    .map((f: any) => `${f.url ?? "?"} — ${f.reason ?? "?"}`)
                    .join(" • ")
                : undefined,
              ...opts,
            },
          );
        } else {
          toast.success(`Détourage terminé : ${ok} photo(s) ajoutée(s)`, opts);
        }
        setAutoOpen(false);
        refresh();
      },
      onError: (err: any) => {
        const msg = err?.message ?? "Erreur inconnue";
        if (msg.toLowerCase().includes("abort")) {
          toast.error("Timeout : le détourage a pris trop de temps (>90s)", {
            duration: Infinity,
          });
        } else if (msg.includes("401")) {
          toast.error("Erreur d'authentification, contacte l'admin", {
            duration: Infinity,
          });
        } else {
          toast.error(`Erreur détourage : ${msg}`, { duration: Infinity });
        }
        setAutoOpen(false);
      },
    });
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadManual.mutate(file, {
      onSuccess: () => {
        toast.success("Photo ajoutée");
        refresh();
      },
      onError: (err: any) =>
        toast.error(err?.message ?? "Échec de l'upload"),
    });
    e.target.value = "";
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = currentImages.findIndex(
      (img, i) => `${img.url}-${i}` === active.id,
    );
    const newIndex = currentImages.findIndex(
      (img, i) => `${img.url}-${i}` === over.id,
    );
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(currentImages, oldIndex, newIndex) as ProcessedImage[];
    reorder.mutate(next, {
      onSuccess: () => refresh(),
      onError: () => toast.error("Échec de la réorganisation"),
    });
  };

  const busyMutation =
    autoProcess.isPending ||
    uploadManual.isPending ||
    setPrimary.isPending ||
    updateAlt.isPending ||
    deleteOne.isPending ||
    reorder.isPending ||
    resetAll.isPending;

  return (
    <div
      className="rounded-2xl border border-border p-4 space-y-4"
      style={{ backgroundColor: "#F5F0E8" }}
    >
      {/* Header actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={() => setAutoOpen(true)}
          disabled={busyMutation}
          className="bg-orange-600 hover:bg-orange-700 text-white gap-2 min-h-[44px]"
        >
          <Sparkles className="w-4 h-4" />
          Récupérer & détourer auto
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={busyMutation}
          className="gap-2 min-h-[44px]"
        >
          <Upload className="w-4 h-4" />
          Upload manuel
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFilePick}
        />

        <div className="ml-auto">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setResetOpen(true)}
            disabled={busyMutation || currentImages.length === 0}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2 min-h-[44px]"
          >
            <Trash2 className="w-4 h-4" />
            Tout supprimer
          </Button>
        </div>
      </div>

      {/* Galerie */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Chargement…
        </div>
      ) : currentImages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white/60 p-8 text-center text-sm text-gray-500">
          Aucune photo dans la galerie. Utilise le détourage auto ou l'upload
          manuel pour démarrer.
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={currentImages.map((img, i) => `${img.url}-${i}`)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {currentImages.map((img, i) => (
                <PhotoCard
                  key={`${img.url}-${i}`}
                  image={img}
                  position={i}
                  busy={busyMutation}
                  onSetPrimary={() =>
                    setPrimary.mutate(i, {
                      onSuccess: () => refresh(),
                      onError: () =>
                        toast.error("Impossible de définir comme principale"),
                    })
                  }
                  onUpdateAlt={(newAlt) =>
                    updateAlt.mutate(
                      { position: i, newAlt },
                      {
                        onSuccess: () => {
                          toast.success("Alt mis à jour");
                          refresh();
                        },
                        onError: () =>
                          toast.error("Échec de la mise à jour de l'alt"),
                      },
                    )
                  }
                  onDelete={() =>
                    deleteOne.mutate(i, {
                      onSuccess: () => {
                        toast.success("Photo retirée");
                        refresh();
                      },
                      onError: () => toast.error("Échec de la suppression"),
                    })
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Footer quota */}
      <div className="pt-2 border-t border-border/40">
        <a
          href="https://www.remove.bg/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-green-700"
        >
          <ExternalLink className="w-3 h-3" />
          Voir mon quota Remove.bg
        </a>
      </div>

      <AutoProcessModal
        open={autoOpen}
        onOpenChange={setAutoOpen}
        isProcessing={autoProcess.isPending}
        onLaunch={handleAutoLaunch}
      />

      <ConfirmResetDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        onConfirm={() =>
          resetAll.mutate(undefined, {
            onSuccess: () => {
              toast.success("Galerie vidée");
              setResetOpen(false);
              refresh();
            },
            onError: () => toast.error("Échec du vidage"),
          })
        }
      />
    </div>
  );
};

export default MultiPhotoGallery;
