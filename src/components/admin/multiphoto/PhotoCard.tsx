import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Star, Pencil, Trash2, GripVertical, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProcessedImage } from "@/types/multiPhoto";

interface PhotoCardProps {
  image: ProcessedImage;
  position: number;
  onSetPrimary: () => void;
  onUpdateAlt: (newAlt: string) => void;
  onDelete: () => void;
  busy?: boolean;
}

export const PhotoCard = ({
  image,
  position,
  onSetPrimary,
  onUpdateAlt,
  onDelete,
  busy,
}: PhotoCardProps) => {
  const [editingAlt, setEditingAlt] = useState(false);
  const [altDraft, setAltDraft] = useState(image.alt ?? "");

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `${image.url}-${position}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden border border-border bg-white"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 z-20 p-1.5 rounded-md bg-white/90 backdrop-blur shadow-sm hover:bg-white cursor-grab active:cursor-grabbing"
        aria-label="Réorganiser"
        type="button"
      >
        <GripVertical className="w-4 h-4 text-gray-500" />
      </button>

      {/* Primary badge */}
      {image.is_primary && (
        <div className="absolute top-2 left-2 z-20 flex items-center gap-1 px-2 py-1 rounded-md bg-green-700 text-white text-xs font-semibold shadow-sm">
          <Star className="w-3 h-3 fill-current" />
          Principale
        </div>
      )}

      {/* Thumbnail */}
      <div
        className="aspect-square w-full"
        style={{ backgroundColor: "#F5F0E8" }}
      >
        <img
          src={image.url}
          alt={image.alt || `Photo ${position + 1}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Hover overlay actions */}
      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex flex-wrap gap-1.5 z-10">
        {!image.is_primary && (
          <Button
            type="button"
            size="sm"
            onClick={onSetPrimary}
            disabled={busy}
            className="h-9 bg-green-700 hover:bg-green-800 text-white text-xs gap-1"
          >
            <Star className="w-3.5 h-3.5" /> Principale
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => {
            setAltDraft(image.alt ?? "");
            setEditingAlt(true);
          }}
          disabled={busy}
          className="h-9 text-xs gap-1"
        >
          <Pencil className="w-3.5 h-3.5" /> Alt
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onDelete}
          disabled={busy}
          className="h-9 bg-red-600 hover:bg-red-700 text-white text-xs gap-1 ml-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Inline alt editor */}
      {editingAlt && (
        <div className="absolute inset-0 z-30 bg-white/95 backdrop-blur p-3 flex flex-col gap-2 justify-center">
          <label className="text-xs font-semibold text-foreground">
            Alt text (SEO)
          </label>
          <Input
            value={altDraft}
            onChange={(e) => setAltDraft(e.target.value)}
            className="text-sm"
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onUpdateAlt(altDraft.trim());
                setEditingAlt(false);
              }}
              className="flex-1 bg-green-700 hover:bg-green-800 text-white"
            >
              <Check className="w-4 h-4" /> OK
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setEditingAlt(false)}
              className="flex-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
