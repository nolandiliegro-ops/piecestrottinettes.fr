import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Plus, GripVertical, ImageIcon, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useReorderCategories, type AdminCategory } from "@/hooks/useAdminCategories";

interface CategoryListPanelProps {
  categories: AdminCategory[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
}

// Tri hiérarchique : parents puis leurs enfants (parité avec l'ancien manager).
const organize = (categories: AdminCategory[]): AdminCategory[] => {
  const parents = categories.filter((c) => !c.parent_id);
  const result: AdminCategory[] = [];
  parents.forEach((parent) => {
    result.push(parent);
    result.push(...categories.filter((c) => c.parent_id === parent.id));
  });
  const seen = new Set(result.map((c) => c.id));
  categories.forEach((c) => {
    if (!seen.has(c.id)) result.push(c);
  });
  return result;
};

const SortableRow = ({
  category,
  selected,
  onSelect,
}: {
  category: AdminCategory;
  selected: boolean;
  onSelect: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-lg border p-2 transition-colors",
        selected ? "border-green-700 bg-green-700/5" : "border-border/40 hover:bg-primary/5",
        isDragging && "opacity-50 shadow-lg",
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none rounded p-1 hover:bg-muted active:cursor-grabbing"
        aria-label="Réordonner"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      <button onClick={() => onSelect(category.id)} className="flex min-h-[44px] flex-1 items-center gap-3 text-left">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border/40 bg-muted">
          {category.image_url ? (
            <img src={category.image_url} alt={category.alt_text || category.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
              <ImageIcon className="h-4 w-4" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {category.parent_id && <span className="text-muted-foreground">└</span>}
            <span className="truncate text-sm font-medium">{category.name}</span>
          </div>
          <span className="text-xs text-muted-foreground">{category.parts_count} pièce(s)</span>
        </div>
        {category.show_on_home && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-green-700/10 px-2 py-0.5 text-[10px] font-medium text-green-700">
            <Home className="h-3 w-3" /> Home
          </span>
        )}
      </button>
    </div>
  );
};

const CategoryListPanel = ({ categories, selectedId, onSelect, onCreate }: CategoryListPanelProps) => {
  const reorderMut = useReorderCategories();
  const organized = organize(categories);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = organized.findIndex((c) => c.id === active.id);
    const newIndex = organized.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(organized, oldIndex, newIndex);
    try {
      await reorderMut.mutateAsync(next.map((c) => ({ id: c.id, name: c.name, slug: c.slug })));
      toast.success("Ordre mis à jour");
    } catch (err: any) {
      toast.error("Erreur : " + err.message);
    }
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{categories.length} catégorie(s)</p>
        <Button size="sm" className="min-h-[44px] bg-green-700 hover:bg-green-800" onClick={onCreate}>
          <Plus className="mr-1.5 h-4 w-4" /> Nouvelle
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={organized.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {organized.map((category) => (
                <SortableRow
                  key={category.id}
                  category={category}
                  selected={category.id === selectedId}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};

export default CategoryListPanel;
