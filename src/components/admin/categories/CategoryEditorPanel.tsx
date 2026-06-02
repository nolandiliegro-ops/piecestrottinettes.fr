import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Trash2, ExternalLink, Link2, Package } from "lucide-react";
import { toast } from "sonner";
import { ICON_REGISTRY } from "@/lib/categoryIcons";
import {
  slugify,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  type AdminCategory,
  type CategoryWrite,
} from "@/hooks/useAdminCategories";
import CategoryImageUploader from "./CategoryImageUploader";

interface CategoryEditorPanelProps {
  mode: "edit" | "create";
  category: AdminCategory | null;
  allCategories: AdminCategory[];
  onClose: () => void;
  onCreated: (id: string) => void;
}

interface Draft {
  name: string;
  slug: string;
  lucide_icon: string;
  parent_id: string;
  display_order: string;
  neon_color: string;
  accent_label: string;
  show_on_home: boolean;
  display_order_home: string;
  meta_title: string;
  meta_description: string;
  alt_text: string;
  seo_name: string;
}

const NONE = "__none__";
const ICON_NAMES = Object.keys(ICON_REGISTRY);

const seedDraft = (category: AdminCategory | null): Draft => ({
  name: category?.name ?? "",
  slug: category?.slug ?? "",
  lucide_icon: category?.lucide_icon ?? "",
  parent_id: category?.parent_id ?? "",
  display_order: category?.display_order != null ? String(category.display_order) : "",
  neon_color: category?.neon_color ?? "",
  accent_label: category?.accent_label ?? "",
  show_on_home: category?.show_on_home ?? true,
  display_order_home: category?.display_order_home != null ? String(category.display_order_home) : "",
  meta_title: category?.meta_title ?? "",
  meta_description: category?.meta_description ?? "",
  alt_text: category?.alt_text ?? "",
  seo_name: category?.seo_name ?? "",
});

const CategoryEditorPanel = ({ mode, category, allCategories, onClose, onCreated }: CategoryEditorPanelProps) => {
  const [draft, setDraft] = useState<Draft>(() => seedDraft(category));
  const createMut = useCreateCategory();
  const updateMut = useUpdateCategory();
  const deleteMut = useDeleteCategory();

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const parentOptions = allCategories.filter((c) => !c.parent_id && c.id !== category?.id);
  const children = category ? allCategories.filter((c) => c.parent_id === category.id) : [];

  // Slug stable au rename : jamais re-slugifié depuis le name. Warning si modif explicite.
  const effectiveSlug =
    mode === "create"
      ? slugify(draft.slug.trim() || draft.name)
      : draft.slug.trim()
        ? slugify(draft.slug)
        : category!.slug;
  const slugChanged = mode === "edit" && !!category && effectiveSlug !== category.slug;

  const buildWrite = (): CategoryWrite | null => {
    const name = draft.name.trim();
    if (!name) {
      toast.error("Nom requis");
      return null;
    }
    const slug = effectiveSlug;
    if (allCategories.some((c) => c.slug === slug && c.id !== category?.id)) {
      toast.error(`Le slug "${slug}" existe déjà`);
      return null;
    }
    return {
      name,
      slug,
      lucide_icon: draft.lucide_icon || null,
      parent_id: draft.parent_id || null,
      display_order: draft.display_order ? parseInt(draft.display_order, 10) : 0,
      neon_color: draft.neon_color.trim() || null,
      accent_label: draft.accent_label.trim() || null,
      show_on_home: draft.show_on_home,
      display_order_home: draft.display_order_home ? parseInt(draft.display_order_home, 10) : null,
      meta_title: draft.meta_title.trim() || null,
      meta_description: draft.meta_description.trim() || null,
      alt_text: draft.alt_text.trim() || null,
      seo_name: draft.seo_name.trim() || null,
    };
  };

  const handleSave = async () => {
    const write = buildWrite();
    if (!write) return;
    try {
      if (mode === "create") {
        const row = await createMut.mutateAsync(write);
        toast.success("Catégorie créée");
        onCreated(row.id);
      } else {
        await updateMut.mutateAsync({ id: category!.id, patch: write });
        toast.success("Catégorie enregistrée");
      }
    } catch (err: any) {
      toast.error("Erreur : " + err.message);
    }
  };

  const handleDelete = async () => {
    if (!category) return;
    try {
      await deleteMut.mutateAsync(category);
      toast.success("Catégorie supprimée");
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        <Accordion type="multiple" defaultValue={["general", "visuel", "home"]} className="space-y-2">
          {/* ── 1. Général ── */}
          <AccordionItem value="general" className="rounded-lg border border-border/40 px-3">
            <AccordionTrigger className="text-sm font-semibold">Général</AccordionTrigger>
            <AccordionContent className="space-y-4 pb-4">
              <div className="space-y-1.5">
                <Label>Nom *</Label>
                <Input value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex: Pneus" className="min-h-[44px]" />
              </div>
              <div className="space-y-1.5">
                <Label>Slug (URL)</Label>
                <Input
                  value={draft.slug}
                  onChange={(e) => set("slug", e.target.value)}
                  placeholder={draft.name ? slugify(draft.name) : "ex: pneus"}
                  className="min-h-[44px]"
                />
                {effectiveSlug && <p className="text-xs text-muted-foreground">Enregistré : {effectiveSlug}</p>}
                {slugChanged && (
                  <p className="text-xs text-amber-600">
                    ⚠️ Modifier le slug casse les liens existants vers cette catégorie (deep-links, partages).
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Catégorie parente</Label>
                <Select
                  value={draft.parent_id || NONE}
                  onValueChange={(v) => set("parent_id", v === NONE ? "" : v)}
                >
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue placeholder="Aucune (catégorie principale)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Aucune (catégorie principale)</SelectItem>
                    {parentOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Icône</Label>
                <Select
                  value={draft.lucide_icon || NONE}
                  onValueChange={(v) => set("lucide_icon", v === NONE ? "" : v)}
                >
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue placeholder="Aucune icône" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Aucune icône</SelectItem>
                    {ICON_NAMES.map((name) => {
                      const Icon = ICON_REGISTRY[name];
                      return (
                        <SelectItem key={name} value={name}>
                          <span className="flex items-center gap-2">
                            <Icon className="h-4 w-4" /> {name}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Ordre d'affichage (catalogue)</Label>
                <Input
                  type="number"
                  value={draft.display_order}
                  onChange={(e) => set("display_order", e.target.value)}
                  placeholder="0"
                  className="min-h-[44px]"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ── 2. Visuel ── */}
          <AccordionItem value="visuel" className="rounded-lg border border-border/40 px-3">
            <AccordionTrigger className="text-sm font-semibold">Visuel</AccordionTrigger>
            <AccordionContent className="space-y-4 pb-4">
              <CategoryImageUploader category={mode === "edit" ? category : null} />
              <div className="space-y-1.5">
                <Label>Couleur néon</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={draft.neon_color || "#93B5A1"}
                    onChange={(e) => set("neon_color", e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded border border-border bg-transparent p-0"
                    aria-label="Couleur néon"
                  />
                  <Input
                    value={draft.neon_color}
                    onChange={(e) => set("neon_color", e.target.value)}
                    placeholder="#00BCD4"
                    className="min-h-[44px] flex-1 font-mono text-sm"
                  />
                  {draft.neon_color && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => set("neon_color", "")}>
                      Effacer
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Label d'accent</Label>
                <Input
                  value={draft.accent_label}
                  onChange={(e) => set("accent_label", e.target.value)}
                  placeholder="Ex: PERFORMANCE"
                  className="min-h-[44px]"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ── 3. Home ── */}
          <AccordionItem value="home" className="rounded-lg border border-border/40 px-3">
            <AccordionTrigger className="text-sm font-semibold">Home</AccordionTrigger>
            <AccordionContent className="space-y-4 pb-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label>Afficher sur la home</Label>
                  <p className="text-xs text-muted-foreground">Section « Shop by category » (si la catégorie a des pièces).</p>
                </div>
                <Switch checked={draft.show_on_home} onCheckedChange={(v) => set("show_on_home", v)} />
              </div>
              <div className="space-y-1.5">
                <Label>Ordre d'affichage (home)</Label>
                <Input
                  type="number"
                  value={draft.display_order_home}
                  onChange={(e) => set("display_order_home", e.target.value)}
                  placeholder="Laisser vide = ordre catalogue"
                  className="min-h-[44px]"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ── 4. SEO ── */}
          <AccordionItem value="seo" className="rounded-lg border border-border/40 px-3">
            <AccordionTrigger className="text-sm font-semibold">SEO</AccordionTrigger>
            <AccordionContent className="space-y-4 pb-4">
              <div className="space-y-1.5">
                <Label>Meta Title</Label>
                <Input
                  value={draft.meta_title}
                  onChange={(e) => set("meta_title", e.target.value)}
                  placeholder="Titre SEO"
                  maxLength={60}
                  className="min-h-[44px]"
                />
                <p className="text-xs text-muted-foreground">{draft.meta_title.length}/60</p>
              </div>
              <div className="space-y-1.5">
                <Label>Meta Description</Label>
                <Textarea
                  value={draft.meta_description}
                  onChange={(e) => set("meta_description", e.target.value)}
                  placeholder="Description pour les moteurs de recherche"
                  rows={3}
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground">{draft.meta_description.length}/160</p>
              </div>
              <div className="space-y-1.5">
                <Label>Texte ALT (image)</Label>
                <Input
                  value={draft.alt_text}
                  onChange={(e) => set("alt_text", e.target.value)}
                  placeholder="Texte alternatif pour Google"
                  className="min-h-[44px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nom SEO (fichier image)</Label>
                <Input
                  value={draft.seo_name}
                  onChange={(e) => set("seo_name", e.target.value)}
                  placeholder="nom-seo-fichier"
                  className="min-h-[44px]"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ── 5. Liens ── */}
          <AccordionItem value="liens" className="rounded-lg border border-border/40 px-3">
            <AccordionTrigger className="text-sm font-semibold">Liens</AccordionTrigger>
            <AccordionContent className="space-y-3 pb-4">
              {mode === "create" ? (
                <p className="text-xs text-muted-foreground">Disponible après création.</p>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package className="h-4 w-4" />
                    {category!.parts_count} pièce(s) liée(s)
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Link2 className="h-4 w-4" /> Sous-catégories
                    </div>
                    {children.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Aucune sous-catégorie.</p>
                    ) : (
                      <ul className="space-y-1">
                        {children.map((c) => (
                          <li key={c.id} className="text-xs text-muted-foreground">
                            └ {c.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <a
                    href={`/catalogue?category=${category!.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-green-700 hover:text-green-800"
                  >
                    <ExternalLink className="h-4 w-4" /> Aperçu catalogue
                  </a>
                </>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Footer sticky */}
      <div className="flex items-center gap-2 border-t border-border/40 bg-background p-4">
        {mode === "edit" && category && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 text-destructive hover:text-destructive"
                disabled={deleteMut.isPending}
              >
                {deleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer « {category.name} » ?</AlertDialogTitle>
                <AlertDialogDescription>
                  La catégorie sera supprimée. Bloqué s'il reste des pièces ou des sous-catégories liées.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <Button variant="outline" className="ml-auto min-h-[44px]" onClick={onClose}>
          Fermer
        </Button>
        <Button
          className="min-h-[44px] bg-green-700 hover:bg-green-800"
          onClick={handleSave}
          disabled={saving || !draft.name.trim()}
        >
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {mode === "create" ? "Créer" : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
};

export default CategoryEditorPanel;
