import { useEffect, useState } from "react";
import { Loader2, FolderTree } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAdminCategories } from "@/hooks/useAdminCategories";
import CategoryListPanel from "./categories/CategoryListPanel";
import CategoryEditorPanel from "./categories/CategoryEditorPanel";

// Page admin unifiée (Palier 2, bloc B) : master-detail style Shopify.
// ≥1024px → 2 colonnes (liste 35% / éditeur 65%). En dessous → liste + Sheet plein écran.

const CategoriesManager = () => {
  const { data: categories = [], isLoading } = useAdminCategories();
  const isMobile = useIsMobile();
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setWide(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // 2 colonnes seulement si largeur suffisante ; sinon comportement mobile (liste + Sheet).
  const twoColumn = wide && !isMobile;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"edit" | "create" | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const selected = categories.find((c) => c.id === selectedId) ?? null;

  const openEdit = (id: string) => {
    setSelectedId(id);
    setMode("edit");
    if (!twoColumn) setSheetOpen(true);
  };

  const openCreate = () => {
    setSelectedId(null);
    setMode("create");
    if (!twoColumn) setSheetOpen(true);
  };

  const closeEditor = () => {
    setMode(null);
    setSelectedId(null);
    setSheetOpen(false);
  };

  const handleCreated = (id: string) => {
    // Après création : on bascule sur l'édition de la nouvelle catégorie.
    setSelectedId(id);
    setMode("edit");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const editor =
    mode && (mode === "create" || selected) ? (
      <CategoryEditorPanel
        key={mode === "create" ? "create" : selectedId}
        mode={mode}
        category={mode === "edit" ? selected : null}
        allCategories={categories}
        onClose={closeEditor}
        onCreated={handleCreated}
      />
    ) : null;

  const list = (
    <CategoryListPanel
      categories={categories}
      selectedId={selectedId}
      onSelect={openEdit}
      onCreate={openCreate}
    />
  );

  // ── Desktop ≥1024 : master-detail 2 colonnes ──
  if (twoColumn) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[35%_1fr]">
        <div className="h-[calc(100vh-220px)] min-h-[400px] rounded-lg border border-border/40 p-3">{list}</div>
        <div className="h-[calc(100vh-220px)] min-h-[400px] overflow-hidden rounded-lg border border-border/40">
          {editor ?? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
              <FolderTree className="h-10 w-10 opacity-40" />
              <p className="text-sm">Sélectionne une catégorie ou crée-en une nouvelle.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Mobile / largeur réduite : liste plein écran + Sheet éditeur ──
  return (
    <>
      <div className="h-[calc(100vh-200px)] min-h-[400px] rounded-lg border border-border/40 p-3">{list}</div>
      <Sheet open={sheetOpen} onOpenChange={(open) => (open ? setSheetOpen(true) : closeEditor())}>
        <SheetContent side="right" className="w-full max-w-full p-0 sm:max-w-full">
          <div className="h-full pt-6">{editor}</div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default CategoriesManager;
