import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, Zap, Battery, Gauge, Save, Plus, Trash2, Edit, Download, Search } from 'lucide-react';
import { toast } from 'sonner';
import { getScooterImage } from '@/lib/scooterImageMapping';

interface Scooter {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  power_watts: number | null;
  voltage: number | null;
  amperage: number | null;
  max_speed_kmh: number | null;
  range_km: number | null;
  tire_size: string | null;
  youtube_video_id: string | null;
  brand: { name: string } | null;
  brand_id: string;
}

interface Brand {
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

const ScootersManager = () => {
  const [scooters, setScooters] = useState<Scooter[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState<string>('all');

  const [newScooter, setNewScooter] = useState({
    name: '',
    brand_id: '',
    power_watts: '',
    voltage: '',
    amperage: '',
    max_speed_kmh: '',
    range_km: '',
    tire_size: '',
    youtube_video_id: ''
  });

  const [editScooter, setEditScooter] = useState<Scooter | null>(null);
  const [editValues, setEditValues] = useState({
    name: '',
    brand_id: '',
    power_watts: '',
    voltage: '',
    amperage: '',
    max_speed_kmh: '',
    range_km: '',
    tire_size: '',
    youtube_video_id: ''
  });

  useEffect(() => {
    fetchScooters();
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase.from('brands').select('id, name').order('name');
      if (error) throw error;
      setBrands(data || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const fetchScooters = async () => {
    try {
      const { data, error } = await supabase
        .from('scooter_models')
        .select('id, name, slug, image_url, power_watts, voltage, amperage, max_speed_kmh, range_km, tire_size, youtube_video_id, brand_id, brand:brands(name)')
        .order('name');

      if (error) throw error;
      setScooters(data || []);
    } catch (error) {
      console.error('Error fetching scooters:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const createScooter = async () => {
    if (!newScooter.name.trim() || !newScooter.brand_id) {
      toast.error('Nom et marque requis');
      return;
    }

    setCreating(true);
    try {
      const slug = slugify(newScooter.name);
      const { data, error } = await supabase
        .from('scooter_models')
        .insert({
          name: newScooter.name.trim(),
          slug,
          brand_id: newScooter.brand_id,
          power_watts: newScooter.power_watts ? parseInt(newScooter.power_watts) : null,
          voltage: newScooter.voltage ? parseInt(newScooter.voltage) : null,
          amperage: newScooter.amperage ? parseInt(newScooter.amperage) : null,
          max_speed_kmh: newScooter.max_speed_kmh ? parseInt(newScooter.max_speed_kmh) : null,
          range_km: newScooter.range_km ? parseInt(newScooter.range_km) : null,
          tire_size: newScooter.tire_size.trim() || null,
          youtube_video_id: newScooter.youtube_video_id.trim() || null
        })
        .select('id, name, slug, image_url, power_watts, voltage, amperage, max_speed_kmh, range_km, tire_size, youtube_video_id, brand_id, brand:brands(name)')
        .single();

      if (error) throw error;

      setScooters(prev => [...prev, data]);
      setNewScooter({ name: '', brand_id: '', power_watts: '', voltage: '', amperage: '', max_speed_kmh: '', range_km: '', tire_size: '', youtube_video_id: '' });
      setIsCreateOpen(false);
      toast.success('Trottinette créée');
    } catch (error) {
      console.error('Error creating scooter:', error);
      toast.error('Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  const startEditing = (scooter: Scooter) => {
    setEditScooter(scooter);
    setEditValues({
      name: scooter.name,
      brand_id: scooter.brand_id,
      power_watts: scooter.power_watts?.toString() || '',
      voltage: scooter.voltage?.toString() || '',
      amperage: scooter.amperage?.toString() || '',
      max_speed_kmh: scooter.max_speed_kmh?.toString() || '',
      range_km: scooter.range_km?.toString() || '',
      tire_size: scooter.tire_size || '',
      youtube_video_id: scooter.youtube_video_id || ''
    });
    setIsEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editScooter) return;

    setSaving(true);
    try {
      const slug = slugify(editValues.name);
      const { error } = await supabase
        .from('scooter_models')
        .update({
          name: editValues.name.trim(),
          slug,
          brand_id: editValues.brand_id,
          power_watts: editValues.power_watts ? parseInt(editValues.power_watts) : null,
          voltage: editValues.voltage ? parseInt(editValues.voltage) : null,
          amperage: editValues.amperage ? parseInt(editValues.amperage) : null,
          max_speed_kmh: editValues.max_speed_kmh ? parseInt(editValues.max_speed_kmh) : null,
          range_km: editValues.range_km ? parseInt(editValues.range_km) : null,
          tire_size: editValues.tire_size.trim() || null,
          youtube_video_id: editValues.youtube_video_id.trim() || null
        })
        .eq('id', editScooter.id);

      if (error) throw error;

      setScooters(prev => prev.map(s => 
        s.id === editScooter.id 
          ? { 
              ...s, 
              name: editValues.name.trim(),
              slug,
              brand_id: editValues.brand_id,
              power_watts: editValues.power_watts ? parseInt(editValues.power_watts) : null,
              voltage: editValues.voltage ? parseInt(editValues.voltage) : null,
              amperage: editValues.amperage ? parseInt(editValues.amperage) : null,
              max_speed_kmh: editValues.max_speed_kmh ? parseInt(editValues.max_speed_kmh) : null,
              range_km: editValues.range_km ? parseInt(editValues.range_km) : null,
              tire_size: editValues.tire_size.trim() || null,
              youtube_video_id: editValues.youtube_video_id.trim() || null,
              brand: brands.find(b => b.id === editValues.brand_id) ? { name: brands.find(b => b.id === editValues.brand_id)!.name } : null
            }
          : s
      ));

      setIsEditOpen(false);
      setEditScooter(null);
      toast.success('Trottinette modifiée');
    } catch (error) {
      console.error('Error saving scooter:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const deleteScooter = async (scooter: Scooter) => {
    setDeleting(scooter.id);
    try {
      // Delete compatibility entries
      await supabase.from('part_compatibility').delete().eq('scooter_model_id', scooter.id);
      
      // Delete garage entries
      await supabase.from('user_garage').delete().eq('scooter_model_id', scooter.id);

      // Delete image from storage if exists
      if (scooter.image_url && scooter.image_url.includes('scooter-photos')) {
        const fileName = scooter.image_url.split('/').pop();
        if (fileName) {
          await supabase.storage.from('scooter-photos').remove([fileName]);
        }
      }

      // Delete the scooter
      const { error } = await supabase.from('scooter_models').delete().eq('id', scooter.id);
      if (error) throw error;

      setScooters(prev => prev.filter(s => s.id !== scooter.id));
      toast.success('Trottinette supprimée');
    } catch (error) {
      console.error('Error deleting scooter:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(null);
    }
  };

  const handleImageUpload = async (scooterId: string, scooterSlug: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    setUploading(scooterId);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${scooterSlug}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('scooter-photos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('scooter-photos')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('scooter_models')
        .update({ image_url: publicUrl })
        .eq('id', scooterId);

      if (updateError) throw updateError;

      setScooters(prev => prev.map(s => 
        s.id === scooterId ? { ...s, image_url: publicUrl } : s
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
    const headers = ['Nom', 'Slug', 'Marque', 'Puissance', 'Voltage', 'Ampérage', 'Vitesse Max', 'Autonomie', 'Pneus', 'YouTube ID'];
    const rows = scooters.map(s => [
      s.name,
      s.slug,
      s.brand?.name || '',
      s.power_watts?.toString() || '',
      s.voltage?.toString() || '',
      s.amperage?.toString() || '',
      s.max_speed_kmh?.toString() || '',
      s.range_km?.toString() || '',
      s.tire_size || '',
      s.youtube_video_id || ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trottinettes-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Export CSV téléchargé');
  };

  const getDisplayImage = (scooter: Scooter) => {
    if (scooter.image_url) return scooter.image_url;
    return getScooterImage(scooter.slug);
  };

  const filteredScooters = scooters.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand = brandFilter === 'all' || s.brand_id === brandFilter;
    return matchesSearch && matchesBrand;
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
            <Input placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Toutes marques" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes marques</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
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
                Nouvelle Trottinette
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer une nouvelle trottinette</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nom *</Label>
                  <Input value={newScooter.name} onChange={(e) => setNewScooter(prev => ({ ...prev, name: e.target.value }))} placeholder="Ex: Dualtron Thunder 3" />
                  {newScooter.name && <p className="text-xs text-muted-foreground">Slug: {slugify(newScooter.name)}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Marque *</Label>
                  <Select value={newScooter.brand_id} onValueChange={(value) => setNewScooter(prev => ({ ...prev, brand_id: value }))}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Puissance (W)</Label>
                    <Input type="number" value={newScooter.power_watts} onChange={(e) => setNewScooter(prev => ({ ...prev, power_watts: e.target.value }))} placeholder="5400" />
                  </div>
                  <div className="space-y-2">
                    <Label>Voltage (V)</Label>
                    <Input type="number" value={newScooter.voltage} onChange={(e) => setNewScooter(prev => ({ ...prev, voltage: e.target.value }))} placeholder="60" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Ampérage (Ah)</Label>
                    <Input type="number" value={newScooter.amperage} onChange={(e) => setNewScooter(prev => ({ ...prev, amperage: e.target.value }))} placeholder="35" />
                  </div>
                  <div className="space-y-2">
                    <Label>Vitesse (km/h)</Label>
                    <Input type="number" value={newScooter.max_speed_kmh} onChange={(e) => setNewScooter(prev => ({ ...prev, max_speed_kmh: e.target.value }))} placeholder="85" />
                  </div>
                  <div className="space-y-2">
                    <Label>Autonomie (km)</Label>
                    <Input type="number" value={newScooter.range_km} onChange={(e) => setNewScooter(prev => ({ ...prev, range_km: e.target.value }))} placeholder="120" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Taille pneus</Label>
                    <Input value={newScooter.tire_size} onChange={(e) => setNewScooter(prev => ({ ...prev, tire_size: e.target.value }))} placeholder="11 pouces" />
                  </div>
                  <div className="space-y-2">
                    <Label>YouTube ID</Label>
                    <Input value={newScooter.youtube_video_id} onChange={(e) => setNewScooter(prev => ({ ...prev, youtube_video_id: e.target.value }))} placeholder="dQw4w9WgXcQ" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={createScooter} disabled={creating || !newScooter.name.trim() || !newScooter.brand_id} className="w-full bg-primary hover:bg-primary/90">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Créer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {filteredScooters.length} trottinette(s) • {scooters.filter(s => s.image_url).length} avec image DB
      </p>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-foreground/5">
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Modèle</TableHead>
              <TableHead>Marque</TableHead>
              <TableHead className="w-20"><Zap className="w-3 h-3 inline mr-1" />W</TableHead>
              <TableHead className="w-16"><Battery className="w-3 h-3 inline mr-1" />V</TableHead>
              <TableHead className="w-16">Ah</TableHead>
              <TableHead className="w-20"><Gauge className="w-3 h-3 inline mr-1" />km/h</TableHead>
              <TableHead className="w-16">km</TableHead>
              <TableHead className="w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredScooters.map((scooter) => {
              const displayImage = getDisplayImage(scooter);
              return (
                <TableRow key={scooter.id} className="hover:bg-primary/5">
                  <TableCell>
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center border border-border relative group">
                      {displayImage ? (
                        <img src={displayImage} alt={scooter.name} className="w-full h-full object-contain" />
                      ) : (
                        <Zap className="w-4 h-4 text-muted-foreground" />
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(scooter.id, scooter.slug, file);
                          }}
                          disabled={uploading === scooter.id}
                        />
                        {uploading === scooter.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                        ) : (
                          <Upload className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{scooter.name}</TableCell>
                  <TableCell className="text-muted-foreground">{scooter.brand?.name || '-'}</TableCell>
                  <TableCell className="text-primary font-medium">{scooter.power_watts || '-'}</TableCell>
                  <TableCell>{scooter.voltage || '-'}</TableCell>
                  <TableCell>{scooter.amperage || '-'}</TableCell>
                  <TableCell>{scooter.max_speed_kmh || '-'}</TableCell>
                  <TableCell>{scooter.range_km || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => startEditing(scooter)} className="h-8 w-8">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" disabled={deleting === scooter.id}>
                            {deleting === scooter.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer "{scooter.name}" ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action supprimera la trottinette, son image, toutes les compatibilités et les entrées de garage associées. Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteScooter(scooter)} className="bg-destructive hover:bg-destructive/90">
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la trottinette</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input value={editValues.name} onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))} />
              {editValues.name && <p className="text-xs text-muted-foreground">Slug: {slugify(editValues.name)}</p>}
            </div>
            <div className="space-y-2">
              <Label>Marque *</Label>
              <Select value={editValues.brand_id} onValueChange={(value) => setEditValues(prev => ({ ...prev, brand_id: value }))}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Puissance (W)</Label>
                <Input type="number" value={editValues.power_watts} onChange={(e) => setEditValues(prev => ({ ...prev, power_watts: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Voltage (V)</Label>
                <Input type="number" value={editValues.voltage} onChange={(e) => setEditValues(prev => ({ ...prev, voltage: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Ampérage (Ah)</Label>
                <Input type="number" value={editValues.amperage} onChange={(e) => setEditValues(prev => ({ ...prev, amperage: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Vitesse (km/h)</Label>
                <Input type="number" value={editValues.max_speed_kmh} onChange={(e) => setEditValues(prev => ({ ...prev, max_speed_kmh: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Autonomie (km)</Label>
                <Input type="number" value={editValues.range_km} onChange={(e) => setEditValues(prev => ({ ...prev, range_km: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Taille pneus</Label>
                <Input value={editValues.tire_size} onChange={(e) => setEditValues(prev => ({ ...prev, tire_size: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>YouTube ID</Label>
                <Input value={editValues.youtube_video_id} onChange={(e) => setEditValues(prev => ({ ...prev, youtube_video_id: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveEdit} disabled={saving || !editValues.name.trim() || !editValues.brand_id} className="w-full bg-primary hover:bg-primary/90">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScootersManager;
