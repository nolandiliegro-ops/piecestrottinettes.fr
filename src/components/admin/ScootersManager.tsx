import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, Check, X, Zap, Battery, Gauge, Save, Plus } from 'lucide-react';
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
  brand: { name: string } | null;
  brand_id?: string;
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
  const [editingScooter, setEditingScooter] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    power_watts: string;
    voltage: string;
    amperage: string;
    max_speed_kmh: string;
    range_km: string;
  }>({ power_watts: '', voltage: '', amperage: '', max_speed_kmh: '', range_km: '' });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newScooter, setNewScooter] = useState({
    name: '',
    brand_id: '',
    power_watts: '',
    voltage: '',
    amperage: '',
    max_speed_kmh: '',
    range_km: ''
  });

  useEffect(() => {
    fetchScooters();
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name')
        .order('name');
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
        .select('id, name, slug, image_url, power_watts, voltage, amperage, max_speed_kmh, range_km, brand_id, brand:brands(name)')
        .order('name');

      if (error) throw error;
      setScooters(data || []);
    } catch (error) {
      console.error('Error fetching scooters:', error);
      toast.error('Erreur lors du chargement des trottinettes');
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
          range_km: newScooter.range_km ? parseInt(newScooter.range_km) : null
        })
        .select('id, name, slug, image_url, power_watts, voltage, amperage, max_speed_kmh, range_km, brand_id, brand:brands(name)')
        .single();

      if (error) throw error;

      setScooters(prev => [...prev, data]);
      setNewScooter({ name: '', brand_id: '', power_watts: '', voltage: '', amperage: '', max_speed_kmh: '', range_km: '' });
      setIsCreateOpen(false);
      toast.success('Trottinette créée avec succès');
    } catch (error) {
      console.error('Error creating scooter:', error);
      toast.error('Erreur lors de la création');
    } finally {
      setCreating(false);
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

  const startEditing = (scooter: Scooter) => {
    setEditingScooter(scooter.id);
    setEditValues({
      power_watts: scooter.power_watts?.toString() || '',
      voltage: scooter.voltage?.toString() || '',
      amperage: scooter.amperage?.toString() || '',
      max_speed_kmh: scooter.max_speed_kmh?.toString() || '',
      range_km: scooter.range_km?.toString() || '',
    });
  };

  const saveChanges = async (scooterId: string) => {
    try {
      const { error } = await supabase
        .from('scooter_models')
        .update({
          power_watts: editValues.power_watts ? parseInt(editValues.power_watts) : null,
          voltage: editValues.voltage ? parseInt(editValues.voltage) : null,
          amperage: editValues.amperage ? parseInt(editValues.amperage) : null,
          max_speed_kmh: editValues.max_speed_kmh ? parseInt(editValues.max_speed_kmh) : null,
          range_km: editValues.range_km ? parseInt(editValues.range_km) : null,
        })
        .eq('id', scooterId);

      if (error) throw error;

      setScooters(prev => prev.map(s => 
        s.id === scooterId 
          ? { 
              ...s, 
              power_watts: parseInt(editValues.power_watts) || null,
              voltage: parseInt(editValues.voltage) || null,
              amperage: parseInt(editValues.amperage) || null,
              max_speed_kmh: parseInt(editValues.max_speed_kmh) || null,
              range_km: parseInt(editValues.range_km) || null,
            }
          : s
      ));

      setEditingScooter(null);
      toast.success('Specifications mises à jour');
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const getDisplayImage = (scooter: Scooter) => {
    // Priority: DB image_url > local mapping
    if (scooter.image_url) return scooter.image_url;
    return getScooterImage(scooter.slug);
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
          {scooters.filter(s => s.image_url).length}/{scooters.length} trottinettes avec image DB
        </p>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Trottinette
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle trottinette</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du modèle *</Label>
                <Input
                  id="name"
                  value={newScooter.name}
                  onChange={(e) => setNewScooter(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Dualtron Thunder 3"
                />
                {newScooter.name && (
                  <p className="text-xs text-muted-foreground">
                    Slug: {slugify(newScooter.name)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Marque *</Label>
                <Select
                  value={newScooter.brand_id}
                  onValueChange={(value) => setNewScooter(prev => ({ ...prev, brand_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une marque" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="power">Puissance (W)</Label>
                  <Input
                    id="power"
                    type="number"
                    value={newScooter.power_watts}
                    onChange={(e) => setNewScooter(prev => ({ ...prev, power_watts: e.target.value }))}
                    placeholder="5400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="voltage">Voltage (V)</Label>
                  <Input
                    id="voltage"
                    type="number"
                    value={newScooter.voltage}
                    onChange={(e) => setNewScooter(prev => ({ ...prev, voltage: e.target.value }))}
                    placeholder="60"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amperage">Ampérage (Ah)</Label>
                  <Input
                    id="amperage"
                    type="number"
                    value={newScooter.amperage}
                    onChange={(e) => setNewScooter(prev => ({ ...prev, amperage: e.target.value }))}
                    placeholder="35"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="speed">Vitesse (km/h)</Label>
                  <Input
                    id="speed"
                    type="number"
                    value={newScooter.max_speed_kmh}
                    onChange={(e) => setNewScooter(prev => ({ ...prev, max_speed_kmh: e.target.value }))}
                    placeholder="85"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="range">Autonomie (km)</Label>
                  <Input
                    id="range"
                    type="number"
                    value={newScooter.range_km}
                    onChange={(e) => setNewScooter(prev => ({ ...prev, range_km: e.target.value }))}
                    placeholder="120"
                  />
                </div>
              </div>
              <Button
                onClick={createScooter}
                disabled={creating || !newScooter.name.trim() || !newScooter.brand_id}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Créer la trottinette
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
              <TableHead>Modèle</TableHead>
              <TableHead>Marque</TableHead>
              <TableHead className="w-24">
                <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Watts</span>
              </TableHead>
              <TableHead className="w-20">
                <span className="flex items-center gap-1"><Battery className="w-3 h-3" /> V</span>
              </TableHead>
              <TableHead className="w-20">Ah</TableHead>
              <TableHead className="w-24">
                <span className="flex items-center gap-1"><Gauge className="w-3 h-3" /> km/h</span>
              </TableHead>
              <TableHead className="w-20">km</TableHead>
              <TableHead className="w-48">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scooters.map((scooter) => {
              const displayImage = getDisplayImage(scooter);
              return (
                <TableRow key={scooter.id} className="hover:bg-primary/5">
                  <TableCell>
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex items-center justify-center border border-border">
                      {displayImage ? (
                        <img 
                          src={displayImage} 
                          alt={scooter.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Zap className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{scooter.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {scooter.brand?.name || '-'}
                  </TableCell>
                  <TableCell>
                    {editingScooter === scooter.id ? (
                      <Input
                        type="number"
                        value={editValues.power_watts}
                        onChange={(e) => setEditValues(prev => ({ ...prev, power_watts: e.target.value }))}
                        className="w-20 h-8 text-sm"
                      />
                    ) : (
                      <span className="text-primary font-medium">{scooter.power_watts || '-'}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingScooter === scooter.id ? (
                      <Input
                        type="number"
                        value={editValues.voltage}
                        onChange={(e) => setEditValues(prev => ({ ...prev, voltage: e.target.value }))}
                        className="w-16 h-8 text-sm"
                      />
                    ) : (
                      <span>{scooter.voltage || '-'}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingScooter === scooter.id ? (
                      <Input
                        type="number"
                        value={editValues.amperage}
                        onChange={(e) => setEditValues(prev => ({ ...prev, amperage: e.target.value }))}
                        className="w-16 h-8 text-sm"
                      />
                    ) : (
                      <span>{scooter.amperage || '-'}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingScooter === scooter.id ? (
                      <Input
                        type="number"
                        value={editValues.max_speed_kmh}
                        onChange={(e) => setEditValues(prev => ({ ...prev, max_speed_kmh: e.target.value }))}
                        className="w-16 h-8 text-sm"
                      />
                    ) : (
                      <span>{scooter.max_speed_kmh || '-'}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingScooter === scooter.id ? (
                      <Input
                        type="number"
                        value={editValues.range_km}
                        onChange={(e) => setEditValues(prev => ({ ...prev, range_km: e.target.value }))}
                        className="w-16 h-8 text-sm"
                      />
                    ) : (
                      <span>{scooter.range_km || '-'}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {editingScooter === scooter.id ? (
                        <Button 
                          size="sm" 
                          onClick={() => saveChanges(scooter.id)}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Sauver
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => startEditing(scooter)}
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
                            if (file) handleImageUpload(scooter.id, scooter.slug, file);
                          }}
                          disabled={uploading === scooter.id}
                        />
                        <Button 
                          variant="ghost" 
                          size="sm"
                          disabled={uploading === scooter.id}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {uploading === scooter.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Upload className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                      {scooter.image_url ? (
                        <Check className="w-4 h-4 text-primary" />
                      ) : (
                        <X className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ScootersManager;
