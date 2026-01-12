import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Trash2, Edit, Save, Tag, FolderTree, Globe } from 'lucide-react';
import { toast } from 'sonner';

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
}

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

const CategoriesManager = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: '',
    display_order: '',
    parent_id: '',
    meta_title: '',
    meta_description: ''
  });

  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [editValues, setEditValues] = useState({
    name: '',
    icon: '',
    display_order: '',
    parent_id: '',
    meta_title: '',
    meta_description: ''
  });

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

    setCreating(true);
    try {
      const slug = slugify(newCategory.name);
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: newCategory.name.trim(),
          slug,
          icon: newCategory.icon.trim() || null,
          display_order: newCategory.display_order ? parseInt(newCategory.display_order) : 0,
          parent_id: newCategory.parent_id || null,
          meta_title: newCategory.meta_title.trim() || null,
          meta_description: newCategory.meta_description.trim() || null
        })
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data].sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
      setNewCategory({ name: '', icon: '', display_order: '', parent_id: '', meta_title: '', meta_description: '' });
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
      icon: category.icon || '',
      display_order: category.display_order?.toString() || '',
      parent_id: category.parent_id || '',
      meta_title: category.meta_title || '',
      meta_description: category.meta_description || ''
    });
    setIsEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editCategory) return;

    setSaving(true);
    try {
      const slug = slugify(editValues.name);
      const { error } = await supabase
        .from('categories')
        .update({
          name: editValues.name.trim(),
          slug,
          icon: editValues.icon.trim() || null,
          display_order: editValues.display_order ? parseInt(editValues.display_order) : 0,
          parent_id: editValues.parent_id || null,
          meta_title: editValues.meta_title.trim() || null,
          meta_description: editValues.meta_description.trim() || null
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
              meta_description: editValues.meta_description.trim() || null
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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderFormFields = (values: typeof newCategory, setValues: (v: typeof newCategory) => void, excludeId?: string) => (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="general" className="gap-1"><FolderTree className="w-3 h-3" /> Général</TabsTrigger>
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

      <TabsContent value="seo" className="space-y-4">
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{categories.length} catégorie(s)</p>
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
        <Table>
          <TableHeader>
            <TableRow className="bg-foreground/5">
              <TableHead className="w-16">Icône</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="w-20">Ordre</TableHead>
              <TableHead className="w-24">Pièces</TableHead>
              <TableHead className="w-24">SEO</TableHead>
              <TableHead className="w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {organizedCategories().map((category) => (
              <TableRow key={category.id} className="hover:bg-primary/5">
                <TableCell>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                    {category.icon || <Tag className="w-4 h-4 text-primary" />}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
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
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{category.slug}</TableCell>
                <TableCell>{category.display_order ?? 0}</TableCell>
                <TableCell>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                    {category.product_count ?? 0}
                  </span>
                </TableCell>
                <TableCell>
                  {category.meta_title || category.meta_description ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-600">OK</span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-600">—</span>
                  )}
                </TableCell>
                <TableCell>
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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