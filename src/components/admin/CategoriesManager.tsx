import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2, Edit, Save, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  display_order: number | null;
  product_count: number | null;
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
    display_order: ''
  });

  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [editValues, setEditValues] = useState({
    name: '',
    icon: '',
    display_order: ''
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
          display_order: newCategory.display_order ? parseInt(newCategory.display_order) : 0
        })
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data].sort((a, b) => (a.display_order || 0) - (b.display_order || 0)));
      setNewCategory({ name: '', icon: '', display_order: '' });
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
      display_order: category.display_order?.toString() || ''
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
          display_order: editValues.display_order ? parseInt(editValues.display_order) : 0
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
              display_order: editValues.display_order ? parseInt(editValues.display_order) : 0
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

    setDeleting(category.id);
    try {
      // Delete category image if exists
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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Créer une catégorie</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input value={newCategory.name} onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))} placeholder="Ex: Pneus et chambres" />
                {newCategory.name && <p className="text-xs text-muted-foreground">Slug: {slugify(newCategory.name)}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Icône (emoji)</Label>
                  <Input value={newCategory.icon} onChange={(e) => setNewCategory(prev => ({ ...prev, icon: e.target.value }))} placeholder="🔧" />
                </div>
                <div className="space-y-2">
                  <Label>Ordre d'affichage</Label>
                  <Input type="number" value={newCategory.display_order} onChange={(e) => setNewCategory(prev => ({ ...prev, display_order: e.target.value }))} placeholder="0" />
                </div>
              </div>
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
              <TableHead className="w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id} className="hover:bg-primary/5">
                <TableCell>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
                    {category.icon || <Tag className="w-4 h-4 text-primary" />}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{category.slug}</TableCell>
                <TableCell>{category.display_order ?? 0}</TableCell>
                <TableCell>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                    {category.product_count ?? 0}
                  </span>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier la catégorie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={editValues.name} onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))} />
              {editValues.name && <p className="text-xs text-muted-foreground">Slug: {slugify(editValues.name)}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icône (emoji)</Label>
                <Input value={editValues.icon} onChange={(e) => setEditValues(prev => ({ ...prev, icon: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Ordre d'affichage</Label>
                <Input type="number" value={editValues.display_order} onChange={(e) => setEditValues(prev => ({ ...prev, display_order: e.target.value }))} />
              </div>
            </div>
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
