import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Loader2,
  Plus,
  Trash2,
  Edit,
  Building,
  Search,
  Eye,
  EyeOff,
} from "lucide-react";
import { LayoutGrid, List as ListIcon, Pencil } from "lucide-react";
import { toast } from "sonner";
import BrandFormDialog, { type BrandRow } from "./brands/BrandFormDialog";

interface BrandWithCount extends BrandRow {
  id: string;
  scooter_count: number;
}

const BrandsManager = () => {
  // Vue grille par défaut (19/10), persistée par navigateur
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    try { return localStorage.getItem('pt-admin-brands-view') === 'list' ? 'list' : 'grid'; } catch { return 'grid'; }
  });
  const [brands, setBrands] = useState<BrandWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BrandRow | null>(null);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const { data: brandsData, error } = await supabase
        .from("brands")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;

      const { data: scooterCounts, error: countError } = await supabase
        .from("scooter_models")
        .select("brand_id");
      if (countError) throw countError;

      const countMap = (scooterCounts ?? []).reduce<Record<string, number>>(
        (acc, s) => {
          if (s.brand_id) acc[s.brand_id] = (acc[s.brand_id] || 0) + 1;
          return acc;
        },
        {}
      );

      setBrands(
        (brandsData ?? []).map((b: any) => ({
          ...b,
          scooter_count: countMap[b.id] || 0,
        }))
      );
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.slug.toLowerCase().includes(q) ||
        (b.country ?? "").toLowerCase().includes(q)
    );
  }, [brands, search]);

  const suggestedOrder = useMemo(
    () => (brands.length ? Math.max(...brands.map((b) => b.display_order ?? 0)) + 1 : 0),
    [brands]
  );

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (b: BrandWithCount) => {
    setEditing(b);
    setDialogOpen(true);
  };

  const handleSaved = (saved: BrandRow) => {
    setBrands((prev) => {
      const sc = prev.find((p) => p.id === saved.id)?.scooter_count ?? 0;
      const next = prev.some((p) => p.id === saved.id)
        ? prev.map((p) => (p.id === saved.id ? { ...(saved as BrandWithCount), scooter_count: sc } : p))
        : [...prev, { ...(saved as BrandWithCount), scooter_count: 0 }];
      return next.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    });
  };

  const togglePublished = async (b: BrandWithCount) => {
    setTogglingId(b.id);
    const next = !b.published;
    try {
      const { error } = await supabase
        .from("brands")
        .update({ published: next })
        .eq("id", b.id);
      if (error) throw error;
      setBrands((prev) => prev.map((p) => (p.id === b.id ? { ...p, published: next } : p)));
      toast.success(next ? "Marque publiée" : "Marque dépubliée");
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors du toggle");
    } finally {
      setTogglingId(null);
    }
  };

  const deleteBrand = async (b: BrandWithCount) => {
    if (b.scooter_count > 0) {
      toast.error(
        `${b.scooter_count} trottinette(s) utilisent cette marque, réassignez-les d'abord`
      );
      return;
    }
    setDeleting(b.id);
    try {
      const { error } = await supabase.from("brands").delete().eq("id", b.id);
      if (error) throw error;
      setBrands((prev) => prev.filter((x) => x.id !== b.id));
      toast.success("Marque supprimée");
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <p className="text-sm text-muted-foreground whitespace-nowrap">
            {filtered.length} / {brands.length} marque(s)
          </p>
          <div className="flex items-center rounded-full border border-[hsl(var(--admin-border))] bg-white p-0.5">
            <button
              onClick={() => { setViewMode('grid'); try { localStorage.setItem('pt-admin-brands-view', 'grid'); } catch { /* noop */ } }}
              className={viewMode === 'grid' ? 'p-2 rounded-full bg-[hsl(var(--admin-accent))] text-white' : 'p-2 rounded-full text-[hsl(var(--admin-text-muted))]'}
              aria-label="Vue grille"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setViewMode('list'); try { localStorage.setItem('pt-admin-brands-view', 'list'); } catch { /* noop */ } }}
              className={viewMode === 'list' ? 'p-2 rounded-full bg-[hsl(var(--admin-accent))] text-white' : 'p-2 rounded-full text-[hsl(var(--admin-text-muted))]'}
              aria-label="Vue liste"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher nom, slug, pays..."
              className="pl-9"
            />
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          Nouvelle marque
        </Button>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3">
          {filtered.map((brand) => (
            <div key={brand.id} className={"admin-glass-card rounded-2xl overflow-hidden flex flex-col transition-shadow hover:shadow-xl" + (brand.published ? "" : " opacity-80")}>
              <button
                onClick={() => openEdit(brand)}
                className="relative aspect-[4/3] bg-white flex items-center justify-center group"
                aria-label={"Modifier " + brand.name}
              >
                {brand.logo_url ? (
                  <img src={brand.logo_url} alt={brand.name} loading="lazy" className="w-full h-full object-contain p-5 transition-transform duration-200 group-hover:scale-[1.05]" />
                ) : (
                  <Building className="w-10 h-10 text-[hsl(var(--admin-text-muted))]" />
                )}
                {!brand.published && (
                  <span className="absolute bottom-2 left-2 text-[11px] font-bold px-2 py-1 rounded-full bg-amber-500 text-white">Brouillon</span>
                )}
                {brand.accent_color && (
                  <span className="absolute top-2 left-2 w-3 h-3 rounded-full border border-[hsl(var(--admin-border))]" style={{ backgroundColor: brand.accent_color }} />
                )}
              </button>
              <div className="flex-1 flex flex-col px-3 pt-2 pb-3 gap-0.5 border-t border-[hsl(var(--admin-border))]">
                <p className="text-sm font-bold text-[hsl(var(--admin-text))] truncate">{brand.name}</p>
                <p className="text-[11px] text-[hsl(var(--admin-text-muted))] truncate">
                  {(brand.country ?? "—") + " · " + brand.scooter_count + " trott" + (brand.scooter_count > 1 ? "s" : "")}
                </p>
                <div className="mt-auto flex items-center justify-between pt-1.5">
                  {togglingId === brand.id
                    ? <Loader2 className="w-4 h-4 animate-spin text-[hsl(var(--admin-text-muted))]" />
                    : <Switch checked={brand.published} onCheckedChange={() => togglePublished(brand)} className="data-[state=checked]:bg-[hsl(var(--admin-accent))]" />}
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => openEdit(brand)} aria-label="Modifier">
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full text-center py-8 text-muted-foreground text-sm">Aucune marque trouvée</p>
          )}
        </div>
      ) : (
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-foreground/5">
              <TableHead className="w-12">#</TableHead>
              <TableHead className="w-16">Logo</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Pays</TableHead>
              <TableHead className="w-28">Publié</TableHead>
              <TableHead className="w-24">Trotts</TableHead>
              <TableHead className="w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((brand) => (
              <TableRow key={brand.id} className="hover:bg-primary/5">
                <TableCell className="text-xs text-muted-foreground">
                  {brand.display_order}
                </TableCell>
                <TableCell>
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center border border-border overflow-hidden">
                    {brand.logo_url ? (
                      <img
                        src={brand.logo_url}
                        alt={brand.name}
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <Building className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {brand.accent_color && (
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full border border-border"
                        style={{ backgroundColor: brand.accent_color }}
                      />
                    )}
                    {brand.name}
                  </div>
                  {brand.tagline && (
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {brand.tagline}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm font-mono">
                  {brand.slug}
                </TableCell>
                <TableCell className="text-sm">{brand.country ?? "—"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {togglingId === brand.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Switch
                        checked={brand.published}
                        onCheckedChange={() => togglePublished(brand)}
                      />
                    )}
                    {brand.published ? (
                      <Eye className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                    {brand.scooter_count}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(brand)}
                      className="h-8 w-8"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          disabled={deleting === brand.id}
                        >
                          {deleting === brand.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer "{brand.name}" ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {brand.scooter_count > 0
                              ? `${brand.scooter_count} trottinette(s) utilisent cette marque. Réassignez-les d'abord.`
                              : "Cette action est irréversible."}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteBrand(brand)}
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={brand.scooter_count > 0}
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">
                  Aucune marque trouvée
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      )}

      <BrandFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        brand={editing}
        suggestedOrder={suggestedOrder}
        onSaved={handleSaved}
      />
    </div>
  );
};

export default BrandsManager;
