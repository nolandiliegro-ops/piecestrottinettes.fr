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
import { Loader2, Upload, Check, X, Image as ImageIcon, Save, Plus, Trash2, Edit, Download, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Part {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  stock_quantity: number | null;
  image_url: string | null;
  category: { name: string } | null;
  category_id: string | null;
  description: string | null;
  difficulty_level: number | null;
  estimated_install_time_minutes: number | null;
  required_tools: string[] | null;
  youtube_video_id: string | null;
}

interface Category {
  id: string;
  name: string;
}

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

const PartsManager = () => {
  const [parts, setParts] = useState<Part[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [newPart, setNewPart] = useState({
    name: '',
    category_id: '',
    price: '',
    stock: '',
    description: '',
    difficulty_level: '',
    estimated_install_time_minutes: '',
    required_tools: '',
    youtube_video_id: ''
  });

  const [editPart, setEditPart] = useState<Part | null>(null);
  const [editValues, setEditValues] = useState({
    name: '',
    category_id: '',
    price: '',
    stock: '',
    description: '',
    difficulty_level: '',
    estimated_install_time_minutes: '',
    required_tools: '',
    youtube_video_id: ''
  });

  useEffect(() => {
    fetchParts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchParts = async () => {
    try {
      const { data, error } = await supabase
        .from('parts')
        .select('id, name, slug, price, stock_quantity, image_url, category_id, description, difficulty_level, estimated_install_time_minutes, required_tools, youtube_video_id, category:categories(name)')
        .order('name');

      if (error) throw error;
      setParts(data || []);
    } catch (error) {
      console.error('Error fetching parts:', error);
      toast.error('Erreur lors du chargement des pièces');
    } finally {
      setLoading(false);
    }
  };

  const createPart = async () => {
    if (!newPart.name.trim() || !newPart.category_id) {
      toast.error('Nom et catégorie requis');
      return;
    }

    setCreating(true);
    try {
      const slug = slugify(newPart.name);
      const { data, error } = await supabase
        .from('parts')
        .insert({
          name: newPart.name.trim(),
          slug,
          category_id: newPart.category_id,
          price: newPart.price ? parseFloat(newPart.price) : null,
          stock_quantity: newPart.stock ? parseInt(newPart.stock) : 0,
          description: newPart.description.trim() || null,
          difficulty_level: newPart.difficulty_level ? parseInt(newPart.difficulty_level) : null,
          estimated_install_time_minutes: newPart.estimated_install_time_minutes ? parseInt(newPart.estimated_install_time_minutes) : null,
          required_tools: newPart.required_tools ? newPart.required_tools.split(',').map(t => t.trim()).filter(Boolean) : null,
          youtube_video_id: newPart.youtube_video_id.trim() || null
        })
        .select('id, name, slug, price, stock_quantity, image_url, category_id, description, difficulty_level, estimated_install_time_minutes, required_tools, youtube_video_id, category:categories(name)')
        .single();

      if (error) throw error;

      setParts(prev => [...prev, data]);
      setNewPart({ name: '', category_id: '', price: '', stock: '', description: '', difficulty_level: '', estimated_install_time_minutes: '', required_tools: '', youtube_video_id: '' });
      setIsCreateOpen(false);
      toast.success('Pièce créée avec succès');
    } catch (error) {
      console.error('Error creating part:', error);
      toast.error('Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  const startEditing = (part: Part) => {
    setEditPart(part);
    setEditValues({
      name: part.name,
      category_id: part.category_id || '',
      price: part.price?.toString() || '',
      stock: part.stock_quantity?.toString() || '',
      description: part.description || '',
      difficulty_level: part.difficulty_level?.toString() || '',
      estimated_install_time_minutes: part.estimated_install_time_minutes?.toString() || '',
      required_tools: part.required_tools?.join(', ') || '',
      youtube_video_id: part.youtube_video_id || ''
    });
    setIsEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editPart) return;

    setSaving(true);
    try {
      const slug = slugify(editValues.name);
      const { error } = await supabase
        .from('parts')
        .update({
          name: editValues.name.trim(),
          slug,
          category_id: editValues.category_id || null,
          price: editValues.price ? parseFloat(editValues.price) : null,
          stock_quantity: editValues.stock ? parseInt(editValues.stock) : 0,
          description: editValues.description.trim() || null,
          difficulty_level: editValues.difficulty_level ? parseInt(editValues.difficulty_level) : null,
          estimated_install_time_minutes: editValues.estimated_install_time_minutes ? parseInt(editValues.estimated_install_time_minutes) : null,
          required_tools: editValues.required_tools ? editValues.required_tools.split(',').map(t => t.trim()).filter(Boolean) : null,
          youtube_video_id: editValues.youtube_video_id.trim() || null
        })
        .eq('id', editPart.id);

      if (error) throw error;

      setParts(prev => prev.map(p => 
        p.id === editPart.id 
          ? { 
              ...p, 
              name: editValues.name.trim(),
              slug,
              category_id: editValues.category_id || null,
              price: editValues.price ? parseFloat(editValues.price) : null,
              stock_quantity: editValues.stock ? parseInt(editValues.stock) : 0,
              description: editValues.description.trim() || null,
              difficulty_level: editValues.difficulty_level ? parseInt(editValues.difficulty_level) : null,
              estimated_install_time_minutes: editValues.estimated_install_time_minutes ? parseInt(editValues.estimated_install_time_minutes) : null,
              required_tools: editValues.required_tools ? editValues.required_tools.split(',').map(t => t.trim()).filter(Boolean) : null,
              youtube_video_id: editValues.youtube_video_id.trim() || null,
              category: categories.find(c => c.id === editValues.category_id) ? { name: categories.find(c => c.id === editValues.category_id)!.name } : null
            }
          : p
      ));

      setIsEditOpen(false);
      setEditPart(null);
      toast.success('Pièce modifiée avec succès');
    } catch (error) {
      console.error('Error saving part:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const deletePart = async (part: Part) => {
    setDeleting(part.id);
    try {
      // Delete compatibility entries first
      await supabase.from('part_compatibility').delete().eq('part_id', part.id);

      // Delete image from storage if exists
      if (part.image_url && part.image_url.includes('part-images')) {
        const fileName = part.image_url.split('/').pop();
        if (fileName) {
          await supabase.storage.from('part-images').remove([fileName]);
        }
      }

      // Delete the part
      const { error } = await supabase.from('parts').delete().eq('id', part.id);
      if (error) throw error;

      setParts(prev => prev.filter(p => p.id !== part.id));
      toast.success('Pièce supprimée');
    } catch (error) {
      console.error('Error deleting part:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(null);
    }
  };

  const handleImageUpload = async (partId: string, partSlug: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    setUploading(partId);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${partSlug}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('part-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('part-images')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('parts')
        .update({ image_url: publicUrl })
        .eq('id', partId);

      if (updateError) throw updateError;

      setParts(prev => prev.map(p => 
        p.id === partId ? { ...p, image_url: publicUrl } : p
      ));

      toast.success('Image mise à jour');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(null);
    }
  };

  const exportCSV = () => {
    const headers = ['Nom', 'Slug', 'Catégorie', 'Prix', 'Stock', 'Difficulté', 'Temps Install', 'Outils', 'YouTube ID'];
    const rows = parts.map(p => [
      p.name,
      p.slug,
      p.category?.name || '',
      p.price?.toString() || '',
      p.stock_quantity?.toString() || '',
      p.difficulty_level?.toString() || '',
      p.estimated_install_time_minutes?.toString() || '',
      p.required_tools?.join('; ') || '',
      p.youtube_video_id || ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pieces-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Export CSV téléchargé');
  };

  const isPlaceholder = (url: string | null) => {
    return !url || url.includes('placehold.co') || url.includes('placeholder');
  };

  const filteredParts = parts.filter(part => {
    const matchesSearch = part.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || part.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Toutes catégories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportCSV} className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 gap-2">
                <Plus className="w-4 h-4" />
                Nouvelle Pièce
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer une nouvelle pièce</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nom *</Label>
                  <Input
                    value={newPart.name}
                    onChange={(e) => setNewPart(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Pneu 10 pouces"
                  />
                  {newPart.name && (
                    <p className="text-xs text-muted-foreground">Slug: {slugify(newPart.name)}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Catégorie *</Label>
                  <Select value={newPart.category_id} onValueChange={(value) => setNewPart(prev => ({ ...prev, category_id: value }))}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prix (€)</Label>
                    <Input type="number" value={newPart.price} onChange={(e) => setNewPart(prev => ({ ...prev, price: e.target.value }))} placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Stock</Label>
                    <Input type="number" value={newPart.stock} onChange={(e) => setNewPart(prev => ({ ...prev, stock: e.target.value }))} placeholder="0" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Difficulté (1-5)</Label>
                    <Input type="number" min="1" max="5" value={newPart.difficulty_level} onChange={(e) => setNewPart(prev => ({ ...prev, difficulty_level: e.target.value }))} placeholder="1-5" />
                  </div>
                  <div className="space-y-2">
                    <Label>Temps install (min)</Label>
                    <Input type="number" value={newPart.estimated_install_time_minutes} onChange={(e) => setNewPart(prev => ({ ...prev, estimated_install_time_minutes: e.target.value }))} placeholder="30" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Outils requis</Label>
                  <Input value={newPart.required_tools} onChange={(e) => setNewPart(prev => ({ ...prev, required_tools: e.target.value }))} placeholder="Clé Allen, Tournevis..." />
                  <p className="text-xs text-muted-foreground">Séparer par des virgules</p>
                </div>
                <div className="space-y-2">
                  <Label>YouTube Video ID</Label>
                  <Input value={newPart.youtube_video_id} onChange={(e) => setNewPart(prev => ({ ...prev, youtube_video_id: e.target.value }))} placeholder="dQw4w9WgXcQ" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={newPart.description} onChange={(e) => setNewPart(prev => ({ ...prev, description: e.target.value }))} placeholder="Description..." rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={createPart} disabled={creating || !newPart.name.trim() || !newPart.category_id} className="w-full bg-primary hover:bg-primary/90">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Créer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {filteredParts.length} pièce(s) • {parts.filter(p => !isPlaceholder(p.image_url)).length} avec image
      </p>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-foreground/5">
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead className="w-24">Prix</TableHead>
              <TableHead className="w-20">Stock</TableHead>
              <TableHead className="w-20">Difficulté</TableHead>
              <TableHead className="w-40">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredParts.map((part) => (
              <TableRow key={part.id} className="hover:bg-primary/5">
                <TableCell>
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center border border-border relative group">
                    {part.image_url && !isPlaceholder(part.image_url) ? (
                      <img src={part.image_url} alt={part.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(part.id, part.slug, file);
                        }}
                        disabled={uploading === part.id}
                      />
                      {uploading === part.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <Upload className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{part.name}</TableCell>
                <TableCell className="text-muted-foreground">{part.category?.name || '-'}</TableCell>
                <TableCell>{part.price ? `${part.price}€` : '-'}</TableCell>
                <TableCell>
                  <span className={part.stock_quantity && part.stock_quantity > 0 ? 'text-primary' : 'text-destructive'}>
                    {part.stock_quantity ?? 0}
                  </span>
                </TableCell>
                <TableCell>
                  {part.difficulty_level ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {part.difficulty_level}/5
                    </span>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => startEditing(part)} className="h-8 w-8">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" disabled={deleting === part.id}>
                          {deleting === part.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer "{part.name}" ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action supprimera la pièce, son image et toutes les compatibilités associées. Cette action est irréversible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deletePart(part)} className="bg-destructive hover:bg-destructive/90">
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
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la pièce</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={editValues.name} onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))} />
              {editValues.name && <p className="text-xs text-muted-foreground">Slug: {slugify(editValues.name)}</p>}
            </div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select value={editValues.category_id} onValueChange={(value) => setEditValues(prev => ({ ...prev, category_id: value }))}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prix (€)</Label>
                <Input type="number" value={editValues.price} onChange={(e) => setEditValues(prev => ({ ...prev, price: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input type="number" value={editValues.stock} onChange={(e) => setEditValues(prev => ({ ...prev, stock: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Difficulté (1-5)</Label>
                <Input type="number" min="1" max="5" value={editValues.difficulty_level} onChange={(e) => setEditValues(prev => ({ ...prev, difficulty_level: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Temps install (min)</Label>
                <Input type="number" value={editValues.estimated_install_time_minutes} onChange={(e) => setEditValues(prev => ({ ...prev, estimated_install_time_minutes: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Outils requis</Label>
              <Input value={editValues.required_tools} onChange={(e) => setEditValues(prev => ({ ...prev, required_tools: e.target.value }))} placeholder="Clé Allen, Tournevis..." />
            </div>
            <div className="space-y-2">
              <Label>YouTube Video ID</Label>
              <Input value={editValues.youtube_video_id} onChange={(e) => setEditValues(prev => ({ ...prev, youtube_video_id: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editValues.description} onChange={(e) => setEditValues(prev => ({ ...prev, description: e.target.value }))} rows={3} />
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

export default PartsManager;
