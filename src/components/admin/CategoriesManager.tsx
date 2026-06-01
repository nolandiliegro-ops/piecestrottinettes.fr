import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Trash2, Edit, Save, Tag, FolderTree, Globe, GripVertical, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  display_order: number | null;
  product_count: number | null;
  parent_id: string | null;
  meta_title: string | null;
  meta_description: string | null;
  color: string | null;
  image_url: string | null;
}

// Presets alignés sur la palette du design system (cf. lib/categoryColors).
const COLOR_PRESETS = ['#FF6600', '#DC2626', '#4A7C59', '#F59E0B', '#7C3AED', '#FACC15', '#6B7280', '#1A1A1A'];

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Sortable Row Component
const SortableRow = ({ 
  category, 
  getParentName, 
  startEditing, 
  deleteCategory, 
  deleting,
  isDragging 
}: {
  category: Category;
  getParentName: (id: string | null) => string | null;
  startEditing: (cat: Category) => void;
  deleteCategory: (cat: Category) => void;
  deleting: string | null;
  isDragging?: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-b transition-colors hover:bg-primary/5",
        isSortableDragging && "opacity-50 bg-primary/10",
        isDragging && "shadow-lg"
      )}
    >
      <td className="p-4 w-10">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded touch-none"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>
      </td>
      <td className="p-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
          {category.icon || <Tag className="w-4 h-4 text-primary" />}
        </div>
      </td>
      <td className="p-4 font-medium">
        <div className="flex items-center gap-2">
          {category.parent_id && (
            <span className="text-muted-foreground">└</span>
          )}
          <span className={category.parent_id ? 'text-muted-foreground' : ''}>
            {category.name}
          </span>
          {category.parent_id && (
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {getParentName(category.parent_id)}
            </span>
          )}
        </div>
      </td>
      <td className="p-4 text-muted-foreground text-sm">{category.slug}</td>
      <td className="p-4">{category.display_order ?? 0}</td>
      <td className="p-4">
        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
          {category.product_count ?? 0}
        </span>
      </td>
      <td className="p-4">
        {category.meta_title || category.meta_description ? (
          <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-600">OK</span>
        ) : (
          <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-600">—</span>
        )}
      </td>
      <td className="p-4">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => startEditing(category)} className="h-8 w-8">
            <Edit className="w-4 h-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" disabled={deleting === category.id}>
                {deleting === category.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer "{category.name}" ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action supprimera la catégorie. Les pièces liées devront être réaffectées.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteCategory(category)} className="bg-destructive hover:bg-destructive/90">
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </td>
    </tr>
  );
};

const CategoriesManager = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [newCategory, setNewCategory] = useState({
    name: '',
    slug: '',
    icon: '',
    display_order: '',
    parent_id: '',
    meta_title: '',
    meta_description: '',
    color: ''
  });

  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [editValues, setEditValues] = useState({
    name: '',
    slug: '',
    icon: '',
    display_order: '',
    parent_id: '',
    meta_title: '',
    meta_description: '',
    color: ''
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true, nullsFirst: false });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const getParentCategories = (excludeId?: string) => {
    return categories.filter(c => !c.parent_id && c.id !== excludeId);
  };

  const getParentName = (parentId: string | null) => {
    if (!parentId) return null;
    const parent = categories.find(c => c.id === parentId);
    return parent?.name || null;
  };

  const createCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error('Nom requis');
      return;
    }

    // Slug généré UNE FOIS à la création : champ slug explicite si fourni, sinon dérivé du nom.
    const slug = slugify(newCategory.slug.trim() || newCategory.name);
    if (categories.some(c => c.slug === slug)) {
      toast.error(`Le slug "${slug}" existe déjà`);
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: newCategory.name.trim(),
          slug,
          icon: newCategory.icon.trim() || null,
          display_order: newCategory.display_order ? parseInt(newCategory.display_order) : 0,
          parent_id: newCategory.parent_id || null,
          meta_title: newCategory.meta_title.trim() || null,
          meta_description: newCategory.meta_description.trim() || null,
          color: newCategory.color.trim() || null
        })
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data].sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
      setNewCategory({ name: '', slug: '', icon: '', display_order: '', parent_id: '', meta_title: '', meta_description: '', color: '' });
      setIsCreateOpen(false);
      toast.success('Catégorie créée');
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  const startEditing = (category: Category) => {
    setEditCategory(category);
    setEditValues({
      name: category.name,
      slug: category.slug,
      icon: category.icon || '',
      display_order: category.display_order?.toString() || '',
      parent_id: category.parent_id || '',
      meta_title: category.meta_title || '',
      meta_description: category.meta_description || '',
      color: category.color || ''
    });
    setIsEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editCategory) return;

    // Slug STABLE au rename : on conserve le slug existant sauf si l'admin édite
    // explicitement le champ slug. Jamais re-dérivé du nom (sinon casse les deep-links).
    const slug = editValues.slug.trim() ? slugify(editValues.slug) : editCategory.slug;
    if (slug !== editCategory.slug && categories.some(c => c.slug === slug && c.id !== editCategory.id)) {
      toast.error(`Le slug "${slug}" existe déjà`);
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('categories')
        .update({
          name: editValues.name.trim(),
          slug,
          icon: editValues.icon.trim() || null,
          display_order: editValues.display_order ? parseInt(editValues.display_order) : 0,
          parent_id: editValues.parent_id || null,
          meta_title: editValues.meta_title.trim() || null,
          meta_description: editValues.meta_description.trim() || null,
          color: editValues.color.trim() || null
        })
        .eq('id', editCategory.id);

      if (error) throw error;

      setCategories(prev => prev.map(c =>
        c.id === editCategory.id
          ? {
              ...c,
              name: editValues.name.trim(),
              slug,
              icon: editValues.icon.trim() || null,
              display_order: editValues.display_order ? parseInt(editValues.display_order) : 0,
              parent_id: editValues.parent_id || null,
              meta_title: editValues.meta_title.trim() || null,
              meta_description: editValues.meta_description.trim() || null,
              color: editValues.color.trim() || null
            }
          : c
      ).sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));

      setIsEditOpen(false);
      setEditCategory(null);
      toast.success('Catégorie modifiée');
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (category: Category) => {
    // Check if category has parts
    const { count } = await supabase
      .from('parts')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', category.id);

    if (count && count > 0) {
      toast.error(`Impossible de supprimer: ${count} pièce(s) liée(s)`);
      return;
    }

    // Check if category has subcategories
    const { count: subCount } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', category.id);

    if (subCount && subCount > 0) {
      toast.error(`Impossible de supprimer: ${subCount} sous-catégorie(s) liée(s)`);
      return;
    }

    setDeleting(category.id);
    try {
      await supabase.from('category_images').delete().eq('category_id', category.id);

      const { error } = await supabase.from('categories').delete().eq('id', category.id);
      if (error) throw error;

      setCategories(prev => prev.filter(c => c.id !== category.id));
      toast.success('Catégorie supprimée');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(null);
    }
  };

  // Handle drag end - update order
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex(c => c.id === active.id);
    const newIndex = categories.findIndex(c => c.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newCategories = arrayMove(categories, oldIndex, newIndex);
    
    // Update display_order for all moved categories
    const updatedCategories = newCategories.map((cat, index) => ({
      ...cat,
      display_order: index
    }));

    setCategories(updatedCategories);

    // Save to database
    try {
      const updates = updatedCategories.map(cat => ({
        id: cat.id,
        display_order: cat.display_order
      }));

      for (const update of updates) {
        await supabase
          .from('categories')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }

      toast.success('Ordre mis à jour');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Erreur lors de la mise à jour');
      fetchCategories(); // Revert on error
    }
  };

  // Organize categories hierarchically
  const organizedCategories = () => {
    const parents = categories.filter(c => !c.parent_id);
    const result: Category[] = [];
    
    parents.forEach(parent => {
      result.push(parent);
      const children = categories.filter(c => c.parent_id === parent.id);
      result.push(...children);
    });

    // Add orphan categories (shouldn't happen but just in case)
    const addedIds = new Set(result.map(c => c.id));
    categories.forEach(c => {
      if (!addedIds.has(c.id)) {
        result.push(c);
      }
    });

    return result;
  };

  const activeCategory = activeId ? categories.find(c => c.id === activeId) : null;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderFormFields = (values: typeof newCategory, setValues: (v: typeof newCategory) => void, excludeId?: string) => (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-4">
        <TabsTrigger value="general" className="gap-1"><FolderTree className="w-3 h-3" /> Général</TabsTrigger>
        <TabsTrigger value="visuel" className="gap-1"><ImageIcon className="w-3 h-3" /> Visuel</TabsTrigger>
        <TabsTrigger value="seo" className="gap-1"><Globe className="w-3 h-3" /> SEO</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-4">
        <div className="space-y-2">
          <Label>Nom *</Label>
          <Input value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} placeholder="Ex: Pneus et chambres" />
          {values.name && <p className="text-xs text-muted-foreground">Slug: {slugify(values.name)}</p>}
        </div>
        <div className="space-y-2">
          <Label>Catégorie parente</Label>
          <Select value={values.parent_id} onValueChange={(v) => setValues({ ...values, parent_id: v === 'none' ? '' : v })}>
            <SelectTrigger><SelectValue placeholder="Aucune (catégorie principale)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucune (catégorie principale)</SelectItem>
              {getParentCategories(excludeId).map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Sélectionnez une catégorie parente pour créer une sous-catégorie</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Icône (emoji)</Label>
            <Input value={values.icon} onChange={(e) => setValues({ ...values, icon: e.target.value })} placeholder="🔧" />
          </div>
          <div className="space-y-2">
            <Label>Ordre d'affichage</Label>
            <Input type="number" value={values.display_order} onChange={(e) => setValues({ ...values, display_order: e.target.value })} placeholder="0" />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="visuel" className="space-y-4">
        <div className="space-y-2">
          <Label>Couleur d'accent</Label>
          <div className="flex items-center gap-2 flex-wrap">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setValues({ ...values, color: c })}
                className={cn(
                  "w-8 h-8 rounded-full border-2 transition-transform",
                  values.color.toLowerCase() === c.toLowerCase() ? "border-foreground scale-110" : "border-transparent"
                )}
                style={{ backgroundColor: c }}
                aria-label={`Couleur ${c}`}
              />
            ))}
            <input
              type="color"
              value={values.color || '#6B7280'}
              onChange={(e) => setValues({ ...values, color: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border border-border bg-transparent p-0"
              aria-label="Couleur personnalisée"
            />
            {values.color && (
              <>
                <span className="text-xs text-muted-foreground font-mono">{values.color}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => setValues({ ...values, color: '' })}>
                  Réinitialiser
                </Button>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Couleur de la tuile catégorie (hex). Optionnelle.</p>
        </div>

        <p className="text-xs text-muted-foreground border-t border-border/40 pt-3">
          🖼️ L'image de la catégorie se gère désormais dans l'onglet <strong>Design Catégories</strong> (source unique).
        </p>
      </TabsContent>

      <TabsContent value="seo" className="space-y-4">
        <div className="space-y-2">
          <Label>Slug (URL)</Label>
          <Input
            value={values.slug}
            onChange={(e) => setValues({ ...values, slug: e.target.value })}
            placeholder={values.name ? slugify(values.name) : 'ex: pneus'}
          />
          {values.slug && <p className="text-xs text-muted-foreground">Sera enregistré : {slugify(values.slug)}</p>}
          <p className="text-xs text-amber-600">⚠️ Modifier le slug casse les liens existants vers cette catégorie (deep-links, partages).</p>
        </div>
        <div className="space-y-2">
          <Label>Meta Title</Label>
          <Input value={values.meta_title} onChange={(e) => setValues({ ...values, meta_title: e.target.value })} placeholder="Titre SEO" maxLength={60} />
          <p className="text-xs text-muted-foreground">{values.meta_title.length}/60 caractères</p>
        </div>
        <div className="space-y-2">
          <Label>Meta Description</Label>
          <Textarea value={values.meta_description} onChange={(e) => setValues({ ...values, meta_description: e.target.value })} placeholder="Description pour les moteurs de recherche" rows={3} maxLength={160} />
          <p className="text-xs text-muted-foreground">{values.meta_description.length}/160 caractères</p>
        </div>
      </TabsContent>
    </Tabs>
  );

  const organized = organizedCategories();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">{categories.length} catégorie(s)</p>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full flex items-center gap-1">
            <GripVertical className="w-3 h-3" />
            Glisser pour réordonner
          </span>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 gap-2">
              <Plus className="w-4 h-4" />
              Nouvelle Catégorie
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Créer une catégorie</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {renderFormFields(newCategory, setNewCategory)}
            </div>
            <DialogFooter>
              <Button onClick={createCategory} disabled={creating || !newCategory.name.trim()} className="w-full bg-primary hover:bg-primary/90">
                {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Créer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <table className="w-full">
            <thead>
              <tr className="bg-foreground/5 border-b">
                <th className="p-4 text-left w-10"></th>
                <th className="p-4 text-left w-16 font-medium text-sm">Icône</th>
                <th className="p-4 text-left font-medium text-sm">Nom</th>
                <th className="p-4 text-left font-medium text-sm">Slug</th>
                <th className="p-4 text-left w-20 font-medium text-sm">Ordre</th>
                <th className="p-4 text-left w-24 font-medium text-sm">Pièces</th>
                <th className="p-4 text-left w-24 font-medium text-sm">SEO</th>
                <th className="p-4 text-left w-32 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              <SortableContext items={organized.map(c => c.id)} strategy={verticalListSortingStrategy}>
                {organized.map((category) => (
                  <SortableRow
                    key={category.id}
                    category={category}
                    getParentName={getParentName}
                    startEditing={startEditing}
                    deleteCategory={deleteCategory}
                    deleting={deleting}
                  />
                ))}
              </SortableContext>
            </tbody>
          </table>

          <DragOverlay>
            {activeCategory && (
              <div className="bg-white shadow-xl rounded-lg p-4 border-2 border-primary flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                  {activeCategory.icon || <Tag className="w-3 h-3 text-primary" />}
                </div>
                <span className="font-medium">{activeCategory.name}</span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier la catégorie</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {renderFormFields(editValues, setEditValues, editCategory?.id)}
          </div>
          <DialogFooter>
            <Button onClick={saveEdit} disabled={saving || !editValues.name.trim()} className="w-full bg-primary hover:bg-primary/90">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoriesManager;
