import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2, Edit, Save, Building, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  scooter_count?: number;
}

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

const BrandsManager = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  const [newBrand, setNewBrand] = useState({
    name: ''
  });

  const [editBrand, setEditBrand] = useState<Brand | null>(null);
  const [editValues, setEditValues] = useState({
    name: ''
  });

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      // Get brands with scooter count
      const { data: brandsData, error: brandsError } = await supabase
        .from('brands')
        .select('*')
        .order('name');

      if (brandsError) throw brandsError;

      // Get scooter counts per brand
      const { data: scooterCounts, error: countError } = await supabase
        .from('scooter_models')
        .select('brand_id');

      if (countError) throw countError;

      const countMap = scooterCounts?.reduce((acc, s) => {
        acc[s.brand_id] = (acc[s.brand_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const brandsWithCount = brandsData?.map(b => ({
        ...b,
        scooter_count: countMap[b.id] || 0
      })) || [];

      setBrands(brandsWithCount);
    } catch (error) {
      console.error('Error fetching brands:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const createBrand = async () => {
    if (!newBrand.name.trim()) {
      toast.error('Nom requis');
      return;
    }

    setCreating(true);
    try {
      const slug = slugify(newBrand.name);
      const { data, error } = await supabase
        .from('brands')
        .insert({
          name: newBrand.name.trim(),
          slug
        })
        .select()
        .single();

      if (error) throw error;

      setBrands(prev => [...prev, { ...data, scooter_count: 0 }].sort((a, b) => a.name.localeCompare(b.name)));
      setNewBrand({ name: '' });
      setIsCreateOpen(false);
      toast.success('Marque créée');
    } catch (error) {
      console.error('Error creating brand:', error);
      toast.error('Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  const startEditing = (brand: Brand) => {
    setEditBrand(brand);
    setEditValues({
      name: brand.name
    });
    setIsEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editBrand) return;

    setSaving(true);
    try {
      const slug = slugify(editValues.name);
      const { error } = await supabase
        .from('brands')
        .update({
          name: editValues.name.trim(),
          slug
        })
        .eq('id', editBrand.id);

      if (error) throw error;

      setBrands(prev => prev.map(b => 
        b.id === editBrand.id 
          ? { ...b, name: editValues.name.trim(), slug }
          : b
      ).sort((a, b) => a.name.localeCompare(b.name)));

      setIsEditOpen(false);
      setEditBrand(null);
      toast.success('Marque modifiée');
    } catch (error) {
      console.error('Error saving brand:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const deleteBrand = async (brand: Brand) => {
    // Check if brand has scooters
    const { count } = await supabase
      .from('scooter_models')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brand.id);

    if (count && count > 0) {
      toast.error(`Impossible de supprimer: ${count} trottinette(s) liée(s)`);
      return;
    }

    setDeleting(brand.id);
    try {
      const { error } = await supabase.from('brands').delete().eq('id', brand.id);
      if (error) throw error;

      setBrands(prev => prev.filter(b => b.id !== brand.id));
      toast.success('Marque supprimée');
    } catch (error) {
      console.error('Error deleting brand:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(null);
    }
  };

  const handleLogoUpload = async (brandId: string, brandSlug: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    setUploading(brandId);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `brand-${brandSlug}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('category-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('category-images')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('brands')
        .update({ logo_url: publicUrl })
        .eq('id', brandId);

      if (updateError) throw updateError;

      setBrands(prev => prev.map(b => 
        b.id === brandId ? { ...b, logo_url: publicUrl } : b
      ));

      toast.success('Logo mis à jour');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(null);
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
        <p className="text-sm text-muted-foreground">{brands.length} marque(s)</p>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 gap-2">
              <Plus className="w-4 h-4" />
              Nouvelle Marque
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Créer une marque</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input value={newBrand.name} onChange={(e) => setNewBrand(prev => ({ ...prev, name: e.target.value }))} placeholder="Ex: Dualtron" />
                {newBrand.name && <p className="text-xs text-muted-foreground">Slug: {slugify(newBrand.name)}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={createBrand} disabled={creating || !newBrand.name.trim()} className="w-full bg-primary hover:bg-primary/90">
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
              <TableHead className="w-16">Logo</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="w-28">Trottinettes</TableHead>
              <TableHead className="w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {brands.map((brand) => (
              <TableRow key={brand.id} className="hover:bg-primary/5">
                <TableCell>
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center border border-border relative group overflow-hidden">
                    {brand.logo_url ? (
                      <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-contain p-1" />
                    ) : (
                      <Building className="w-4 h-4 text-muted-foreground" />
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLogoUpload(brand.id, brand.slug, file);
                        }}
                        disabled={uploading === brand.id}
                      />
                      {uploading === brand.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <Upload className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{brand.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{brand.slug}</TableCell>
                <TableCell>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                    {brand.scooter_count ?? 0}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => startEditing(brand)} className="h-8 w-8">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" disabled={deleting === brand.id}>
                          {deleting === brand.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer "{brand.name}" ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action supprimera la marque. Les trottinettes liées devront être réaffectées.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteBrand(brand)} className="bg-destructive hover:bg-destructive/90">
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
            <DialogTitle>Modifier la marque</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={editValues.name} onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))} />
              {editValues.name && <p className="text-xs text-muted-foreground">Slug: {slugify(editValues.name)}</p>}
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

export default BrandsManager;
