import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, Check, X, Image as ImageIcon, Save, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Part {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  stock_quantity: number | null;
  image_url: string | null;
  category: { name: string } | null;
  category_id?: string;
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
  const [editingPart, setEditingPart] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ price: string; stock: string }>({ price: '', stock: '' });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPart, setNewPart] = useState({
    name: '',
    category_id: '',
    price: '',
    stock: '',
    description: ''
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
        .select('id, name, slug, price, stock_quantity, image_url, category_id, category:categories(name)')
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
          description: newPart.description.trim() || null
        })
        .select('id, name, slug, price, stock_quantity, image_url, category_id, category:categories(name)')
        .single();

      if (error) throw error;

      setParts(prev => [...prev, data]);
      setNewPart({ name: '', category_id: '', price: '', stock: '', description: '' });
      setIsCreateOpen(false);
      toast.success('Pièce créée avec succès');
    } catch (error) {
      console.error('Error creating part:', error);
      toast.error('Erreur lors de la création');
    } finally {
      setCreating(false);
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

  const startEditing = (part: Part) => {
    setEditingPart(part.id);
    setEditValues({
      price: part.price?.toString() || '',
      stock: part.stock_quantity?.toString() || '',
    });
  };

  const saveChanges = async (partId: string) => {
    try {
      const { error } = await supabase
        .from('parts')
        .update({
          price: editValues.price ? parseFloat(editValues.price) : null,
          stock_quantity: editValues.stock ? parseInt(editValues.stock) : null,
        })
        .eq('id', partId);

      if (error) throw error;

      setParts(prev => prev.map(p => 
        p.id === partId 
          ? { ...p, price: parseFloat(editValues.price) || null, stock_quantity: parseInt(editValues.stock) || null }
          : p
      ));

      setEditingPart(null);
      toast.success('Modifications enregistrées');
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const isPlaceholder = (url: string | null) => {
    return !url || url.includes('placehold.co') || url.includes('placeholder');
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
        <p className="text-sm text-muted-foreground">
          {parts.filter(p => !isPlaceholder(p.image_url)).length}/{parts.length} pièces avec image
        </p>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Pièce
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle pièce</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={newPart.name}
                  onChange={(e) => setNewPart(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Pneu 10 pouces"
                />
                {newPart.name && (
                  <p className="text-xs text-muted-foreground">
                    Slug: {slugify(newPart.name)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie *</Label>
                <Select
                  value={newPart.category_id}
                  onValueChange={(value) => setNewPart(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Prix (€)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={newPart.price}
                    onChange={(e) => setNewPart(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={newPart.stock}
                    onChange={(e) => setNewPart(prev => ({ ...prev, stock: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newPart.description}
                  onChange={(e) => setNewPart(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description de la pièce..."
                  rows={3}
                />
              </div>
              <Button
                onClick={createPart}
                disabled={creating || !newPart.name.trim() || !newPart.category_id}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Créer la pièce
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-foreground/5">
              <TableHead className="w-20">Image</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead className="w-28">Prix (€)</TableHead>
              <TableHead className="w-28">Stock</TableHead>
              <TableHead className="w-32">Statut</TableHead>
              <TableHead className="w-48">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parts.map((part) => (
              <TableRow key={part.id} className="hover:bg-primary/5">
                <TableCell>
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex items-center justify-center border border-border">
                    {part.image_url && !isPlaceholder(part.image_url) ? (
                      <img 
                        src={part.image_url} 
                        alt={part.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium text-foreground">{part.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {part.category?.name || '-'}
                </TableCell>
                <TableCell>
                  {editingPart === part.id ? (
                    <Input
                      type="number"
                      value={editValues.price}
                      onChange={(e) => setEditValues(prev => ({ ...prev, price: e.target.value }))}
                      className="w-24 h-8 text-sm"
                    />
                  ) : (
                    <span className="text-foreground">{part.price ? `${part.price}€` : '-'}</span>
                  )}
                </TableCell>
                <TableCell>
                  {editingPart === part.id ? (
                    <Input
                      type="number"
                      value={editValues.stock}
                      onChange={(e) => setEditValues(prev => ({ ...prev, stock: e.target.value }))}
                      className="w-24 h-8 text-sm"
                    />
                  ) : (
                    <span className={part.stock_quantity && part.stock_quantity > 0 ? 'text-primary' : 'text-destructive'}>
                      {part.stock_quantity ?? 0}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {isPlaceholder(part.image_url) ? (
                    <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-medium">
                      <X className="w-3 h-3" />
                      Placeholder
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-primary text-xs font-medium">
                      <Check className="w-3 h-3" />
                      Image HD
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {editingPart === part.id ? (
                      <Button 
                        size="sm" 
                        onClick={() => saveChanges(part.id)}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Save className="w-3 h-3 mr-1" />
                        Sauver
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => startEditing(part)}
                        className="border-primary/30 hover:bg-primary/10"
                      >
                        Modifier
                      </Button>
                    )}
                    <div className="relative">
                      <Input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer w-24"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(part.id, part.slug, file);
                        }}
                        disabled={uploading === part.id}
                      />
                      <Button 
                        variant="ghost" 
                        size="sm"
                        disabled={uploading === part.id}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {uploading === part.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Upload className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PartsManager;
