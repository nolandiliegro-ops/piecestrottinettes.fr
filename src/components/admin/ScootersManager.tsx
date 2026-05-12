import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, Upload, Zap, Battery, Gauge, Save, Plus, Trash2, Edit, Download, Search, FileText, Link as LinkIcon, Copy, FileUp, ChevronDown, Cpu } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import RichTextEditor from './RichTextEditor';
import AIGenerateButton from './AIGenerateButton';
import MultiPhotoGallery from './MultiPhotoGallery';
import { Images } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Papa from 'papaparse';

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
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  affiliate_link: string | null;
  year: number | null;
  search_terms: string | null;
  brand: { name: string } | null;
  brand_id: string;
  technical_signature: Record<string, any> | null;
  published: boolean;
}

const SIGNATURE_DEFAULTS: { key: string; label: string; type: 'select' | 'number' | 'text'; options?: string[] }[] = [
  { key: 'brake_type', label: 'Type de frein', type: 'select', options: ['disc', 'drum', 'eabs', 'none'] },
  { key: 'motor_watts', label: 'Moteur (W)', type: 'number' },
  { key: 'wheel_size', label: 'Taille roue', type: 'text' },
  { key: 'folding_mechanism', label: 'Mécanisme pliage', type: 'select', options: ['lever_front', 'lever_rear', 'none'] },
  { key: 'led_position', label: 'Position LEDs', type: 'select', options: ['front', 'rear', 'both', 'none'] },
];

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
  const navigate = useNavigate();
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
  const [importing, setImporting] = useState(false);
  const [publishedFilter, setPublishedFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [togglingPublish, setTogglingPublish] = useState<string | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Quick Add state
  const [quickName, setQuickName] = useState('');
  const [quickBrandId, setQuickBrandId] = useState('');
  const [quickYear, setQuickYear] = useState('');
  const [quickAdding, setQuickAdding] = useState(false);

  const [newScooter, setNewScooter] = useState({
    name: '', brand_id: '', power_watts: '', voltage: '', amperage: '',
    max_speed_kmh: '', range_km: '', tire_size: '', youtube_video_id: '',
    description: '', meta_title: '', meta_description: '', affiliate_link: '',
    year: '', search_terms: ''
  });

  const [editScooter, setEditScooter] = useState<Scooter | null>(null);
  const [editValues, setEditValues] = useState({
    name: '', brand_id: '', power_watts: '', voltage: '', amperage: '',
    max_speed_kmh: '', range_km: '', tire_size: '', youtube_video_id: '',
    description: '', meta_title: '', meta_description: '', affiliate_link: '',
    year: '', search_terms: '',
    technical_signature: {} as Record<string, any>,
    published: false,
  });
  const [sigOpen, setSigOpen] = useState(false);
  const [customKey, setCustomKey] = useState('');
  const [customValue, setCustomValue] = useState('');

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
        .select('id, name, slug, image_url, power_watts, voltage, amperage, max_speed_kmh, range_km, tire_size, youtube_video_id, description, meta_title, meta_description, affiliate_link, brand_id, year, search_terms, technical_signature, published, brand:brands(name)')
        .order('name');
      if (error) throw error;
      setScooters((data as any) || []);
    } catch (error) {
      console.error('Error fetching scooters:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  // ===== QUICK ADD =====
  const quickAdd = async () => {
    if (!quickName.trim() || !quickBrandId) {
      toast.error('Nom et marque requis');
      return;
    }
    setQuickAdding(true);
    try {
      const slug = slugify(quickName);
      const { data, error } = await supabase
        .from('scooter_models')
        .insert({
          name: quickName.trim(), slug, brand_id: quickBrandId,
          year: quickYear ? parseInt(quickYear) : null
        })
        .select('id, name, slug, image_url, power_watts, voltage, amperage, max_speed_kmh, range_km, tire_size, youtube_video_id, description, meta_title, meta_description, affiliate_link, brand_id, year, search_terms, brand:brands(name)')
        .single();
      if (error) throw error;
      setScooters(prev => [...prev, data as any]);
      setQuickName(''); setQuickYear('');
      toast.success(`${quickName} ajoutée !`);
    } catch (error) {
      console.error('Error quick adding:', error);
      toast.error('Erreur lors de l\'ajout');
    } finally {
      setQuickAdding(false);
    }
  };

  // ===== CSV IMPORT =====
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as Record<string, string>[];
          let created = 0;
          let brandsCreated = 0;
          const brandMap = new Map(brands.map(b => [b.name.toLowerCase(), b.id]));

          for (const row of rows) {
            const name = (row['Nom'] || row['name'] || '').trim();
            const brandName = (row['Marque'] || row['brand'] || '').trim();
            if (!name || !brandName) continue;

            // Find or create brand
            let brandId = brandMap.get(brandName.toLowerCase());
            if (!brandId) {
              const { data: newBrand, error: brandErr } = await supabase
                .from('brands')
                .insert({ name: brandName, slug: slugify(brandName) })
                .select('id, name')
                .single();
              if (brandErr) { console.error('Brand error:', brandErr); continue; }
              brandId = newBrand.id;
              brandMap.set(brandName.toLowerCase(), brandId);
              brandsCreated++;
            }

            const slug = slugify(name);
            const { error } = await supabase.from('scooter_models').insert({
              name, slug, brand_id: brandId,
              year: row['Annee'] || row['year'] ? parseInt(row['Annee'] || row['year']) : null,
              power_watts: row['Puissance'] || row['power_watts'] ? parseInt(row['Puissance'] || row['power_watts']) : null,
              voltage: row['Voltage'] || row['voltage'] ? parseInt(row['Voltage'] || row['voltage']) : null,
              amperage: row['Amperage'] || row['amperage'] ? parseInt(row['Amperage'] || row['amperage']) : null,
              max_speed_kmh: row['Vitesse Max'] || row['max_speed_kmh'] ? parseInt(row['Vitesse Max'] || row['max_speed_kmh']) : null,
              range_km: row['Autonomie'] || row['range_km'] ? parseInt(row['Autonomie'] || row['range_km']) : null,
              tire_size: (row['Pneus'] || row['tire_size'] || '').trim() || null,
              search_terms: (row['Alias'] || row['search_terms'] || '').trim() || null,
              description: (row['Description'] || row['description'] || '').trim() || null,
            });
            if (!error) created++;
          }

          toast.success(`${created} trottinette(s) importée(s)${brandsCreated > 0 ? `, ${brandsCreated} marque(s) créée(s)` : ''}`);
          fetchScooters();
          fetchBrands();
        } catch (err) {
          console.error('Import error:', err);
          toast.error('Erreur lors de l\'import');
        } finally {
          setImporting(false);
          if (csvInputRef.current) csvInputRef.current.value = '';
        }
      },
      error: () => {
        toast.error('Fichier CSV invalide');
        setImporting(false);
      }
    });
  };

  // ===== DUPLICATE =====
  const duplicateScooter = async (scooter: Scooter) => {
    try {
      const newName = `${scooter.name} (copie)`;
      const slug = slugify(newName);
      const { data, error } = await supabase
        .from('scooter_models')
        .insert({
          name: newName, slug, brand_id: scooter.brand_id,
          power_watts: scooter.power_watts, voltage: scooter.voltage, amperage: scooter.amperage,
          max_speed_kmh: scooter.max_speed_kmh, range_km: scooter.range_km,
          tire_size: scooter.tire_size, description: scooter.description,
        })
        .select('id, name, slug, image_url, power_watts, voltage, amperage, max_speed_kmh, range_km, tire_size, youtube_video_id, description, meta_title, meta_description, affiliate_link, brand_id, year, search_terms, brand:brands(name)')
        .single();
      if (error) throw error;
      setScooters(prev => [...prev, data as any]);
      toast.success(`"${newName}" créée — modifiez les specs !`);
    } catch (error) {
      console.error('Error duplicating:', error);
      toast.error('Erreur lors de la duplication');
    }
  };

  const createScooter = async () => {
    if (!newScooter.name.trim() || !newScooter.brand_id) { toast.error('Nom et marque requis'); return; }
    setCreating(true);
    try {
      const slug = slugify(newScooter.name);
      const { data, error } = await supabase
        .from('scooter_models')
        .insert({
          name: newScooter.name.trim(), slug, brand_id: newScooter.brand_id,
          power_watts: newScooter.power_watts ? parseInt(newScooter.power_watts) : null,
          voltage: newScooter.voltage ? parseInt(newScooter.voltage) : null,
          amperage: newScooter.amperage ? parseInt(newScooter.amperage) : null,
          max_speed_kmh: newScooter.max_speed_kmh ? parseInt(newScooter.max_speed_kmh) : null,
          range_km: newScooter.range_km ? parseInt(newScooter.range_km) : null,
          tire_size: newScooter.tire_size.trim() || null,
          youtube_video_id: newScooter.youtube_video_id.trim() || null,
          description: newScooter.description.trim() || null,
          meta_title: newScooter.meta_title.trim() || null,
          meta_description: newScooter.meta_description.trim() || null,
          affiliate_link: newScooter.affiliate_link.trim() || null,
          year: newScooter.year ? parseInt(newScooter.year) : null,
          search_terms: newScooter.search_terms.trim() || null,
        })
        .select('id, name, slug, image_url, power_watts, voltage, amperage, max_speed_kmh, range_km, tire_size, youtube_video_id, description, meta_title, meta_description, affiliate_link, brand_id, year, search_terms, brand:brands(name)')
        .single();
      if (error) throw error;
      setScooters(prev => [...prev, data as any]);
      setNewScooter({ name: '', brand_id: '', power_watts: '', voltage: '', amperage: '', max_speed_kmh: '', range_km: '', tire_size: '', youtube_video_id: '', description: '', meta_title: '', meta_description: '', affiliate_link: '', year: '', search_terms: '' });
      setIsCreateOpen(false);
      toast.success('Trottinette créée');
    } catch (error) {
      console.error('Error creating scooter:', error);
      toast.error('Erreur lors de la création');
    } finally { setCreating(false); }
  };

  const startEditing = (scooter: Scooter) => {
    setEditScooter(scooter);
    setEditValues({
      name: scooter.name, brand_id: scooter.brand_id,
      power_watts: scooter.power_watts?.toString() || '', voltage: scooter.voltage?.toString() || '',
      amperage: scooter.amperage?.toString() || '', max_speed_kmh: scooter.max_speed_kmh?.toString() || '',
      range_km: scooter.range_km?.toString() || '', tire_size: scooter.tire_size || '',
      youtube_video_id: scooter.youtube_video_id || '', description: scooter.description || '',
      meta_title: scooter.meta_title || '', meta_description: scooter.meta_description || '',
      affiliate_link: scooter.affiliate_link || '', year: scooter.year?.toString() || '',
      search_terms: scooter.search_terms || '',
      technical_signature: (scooter.technical_signature as Record<string, any>) || {},
      published: !!scooter.published,
    });
    setSigOpen(false);
    setIsEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editScooter) return;
    setSaving(true);
    try {
      const slug = slugify(editValues.name);
      // Clean signature: remove empty values
      const cleanSig = Object.fromEntries(
        Object.entries(editValues.technical_signature).filter(([, v]) => v !== '' && v !== null && v !== undefined)
      );
      const { error } = await supabase
        .from('scooter_models')
        .update({
          name: editValues.name.trim(), slug, brand_id: editValues.brand_id,
          power_watts: editValues.power_watts ? parseInt(editValues.power_watts) : null,
          voltage: editValues.voltage ? parseInt(editValues.voltage) : null,
          amperage: editValues.amperage ? parseInt(editValues.amperage) : null,
          max_speed_kmh: editValues.max_speed_kmh ? parseInt(editValues.max_speed_kmh) : null,
          range_km: editValues.range_km ? parseInt(editValues.range_km) : null,
          tire_size: editValues.tire_size.trim() || null,
          youtube_video_id: editValues.youtube_video_id.trim() || null,
          description: editValues.description.trim() || null,
          meta_title: editValues.meta_title.trim() || null,
          meta_description: editValues.meta_description.trim() || null,
          affiliate_link: editValues.affiliate_link.trim() || null,
          year: editValues.year ? parseInt(editValues.year) : null,
          search_terms: editValues.search_terms.trim() || null,
          technical_signature: cleanSig,
          published: editValues.published,
        } as any)
        .eq('id', editScooter.id);
      if (error) throw error;
      await fetchScooters();
      setIsEditOpen(false);
      setEditScooter(null);
      toast.success('Trottinette modifiée');
    } catch (error) {
      console.error('Error saving scooter:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally { setSaving(false); }
  };

  const deleteScooter = async (scooter: Scooter) => {
    setDeleting(scooter.id);
    try {
      await supabase.from('part_compatibility').delete().eq('scooter_model_id', scooter.id);
      await supabase.from('user_garage').delete().eq('scooter_model_id', scooter.id);
      if (scooter.image_url && scooter.image_url.includes('scooter-photos')) {
        const fileName = scooter.image_url.split('/').pop();
        if (fileName) await supabase.storage.from('scooter-photos').remove([fileName]);
      }
      const { error } = await supabase.from('scooter_models').delete().eq('id', scooter.id);
      if (error) throw error;
      setScooters(prev => prev.filter(s => s.id !== scooter.id));
      toast.success('Trottinette supprimée');
    } catch (error) {
      console.error('Error deleting scooter:', error);
      toast.error('Erreur lors de la suppression');
    } finally { setDeleting(null); }
  };

  const handleImageUpload = async (scooterId: string, scooterSlug: string, file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Veuillez sélectionner une image'); return; }
    setUploading(scooterId);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${scooterSlug}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('scooter-photos').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('scooter-photos').getPublicUrl(fileName);
      const { error: updateError } = await supabase.from('scooter_models').update({ image_url: publicUrl }).eq('id', scooterId);
      if (updateError) throw updateError;
      setScooters(prev => prev.map(s => s.id === scooterId ? { ...s, image_url: publicUrl } : s));
      toast.success('Image mise à jour');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error("Erreur lors de l'upload");
    } finally { setUploading(null); }
  };

  const exportCSV = () => {
    const headers = ['Nom', 'Slug', 'Marque', 'Annee', 'Puissance', 'Voltage', 'Ampérage', 'Vitesse Max', 'Autonomie', 'Pneus', 'Alias', 'YouTube ID', 'Description'];
    const rows = scooters.map(s => [
      s.name, s.slug, s.brand?.name || '', s.year?.toString() || '',
      s.power_watts?.toString() || '', s.voltage?.toString() || '', s.amperage?.toString() || '',
      s.max_speed_kmh?.toString() || '', s.range_km?.toString() || '', s.tire_size || '',
      s.search_terms || '', s.youtube_video_id || '', s.description || '',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trottinettes-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Export CSV téléchargé');
  };

  const getDisplayImage = (scooter: Scooter) => scooter.image_url || '/placeholder.svg';

  const togglePublished = async (scooter: Scooter) => {
    const newValue = !scooter.published;
    setTogglingPublish(scooter.id);
    // Optimistic update
    setScooters(prev => prev.map(s => s.id === scooter.id ? { ...s, published: newValue } : s));
    try {
      const { error } = await supabase
        .from('scooter_models')
        .update({ published: newValue })
        .eq('id', scooter.id);
      if (error) throw error;
      toast.success(newValue ? `"${scooter.name}" publiée` : `"${scooter.name}" passée en brouillon`);
    } catch (error) {
      console.error('Error toggling published:', error);
      // Rollback
      setScooters(prev => prev.map(s => s.id === scooter.id ? { ...s, published: !newValue } : s));
      toast.error('Erreur lors du changement de statut');
    } finally {
      setTogglingPublish(null);
    }
  };

  const publishedCount = scooters.filter(s => s.published).length;
  const draftCount = scooters.length - publishedCount;

  const filteredScooters = scooters.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.search_terms || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand = brandFilter === 'all' || s.brand_id === brandFilter;
    const matchesPublished =
      publishedFilter === 'all' ||
      (publishedFilter === 'published' && s.published) ||
      (publishedFilter === 'draft' && !s.published);
    return matchesSearch && matchesBrand && matchesPublished;
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
      {/* Quick Add Bar */}
      <div className="flex flex-col sm:flex-row items-end gap-2 p-3 rounded-lg border border-dashed border-primary/30 bg-primary/5">
        <div className="flex-1 w-full">
          <Label className="text-xs text-muted-foreground mb-1 block">Ajout rapide</Label>
          <Input
            placeholder="Nom du modèle (ex: Thunder 3)"
            value={quickName}
            onChange={(e) => setQuickName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && quickAdd()}
          />
        </div>
        <Select value={quickBrandId} onValueChange={setQuickBrandId}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Marque" />
          </SelectTrigger>
          <SelectContent>
            {brands.map((brand) => (
              <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number" placeholder="Année" className="w-full sm:w-24"
          value={quickYear} onChange={(e) => setQuickYear(e.target.value)}
        />
        <Button onClick={quickAdd} disabled={quickAdding || !quickName.trim() || !quickBrandId} size="icon" className="bg-primary hover:bg-primary/90 shrink-0">
          {quickAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </Button>
      </div>

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
          {/* CSV Import */}
          <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
          <Button variant="outline" onClick={() => csvInputRef.current?.click()} disabled={importing} className="gap-2">
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
            Import CSV
          </Button>
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
                <div className="grid grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    <Label>Année</Label>
                    <Input type="number" value={newScooter.year} onChange={(e) => setNewScooter(prev => ({ ...prev, year: e.target.value }))} placeholder="2024" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Alias / Noms alternatifs</Label>
                  <Input value={newScooter.search_terms} onChange={(e) => setNewScooter(prev => ({ ...prev, search_terms: e.target.value }))} placeholder="M365, Mi Scooter, etc." />
                  <p className="text-xs text-muted-foreground">Séparez par des virgules pour le moteur de recherche</p>
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Description</Label>
                    <AIGenerateButton
                      field="description"
                      context={{
                        name: newScooter.name,
                        brand: brands.find(b => b.id === newScooter.brand_id)?.name,
                        power_watts: newScooter.power_watts,
                        voltage: newScooter.voltage,
                        range_km: newScooter.range_km,
                        tire_size: newScooter.tire_size,
                        max_speed_kmh: newScooter.max_speed_kmh,
                      }}
                      onGenerated={(text) => setNewScooter(prev => ({ ...prev, description: text }))}
                    />
                  </div>
                  <RichTextEditor
                    value={newScooter.description}
                    onChange={(val) => setNewScooter(prev => ({ ...prev, description: val }))}
                    placeholder="Description de la trottinette..."
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Meta Title</Label>
                    <AIGenerateButton
                      field="meta_title"
                      context={{
                        name: newScooter.name,
                        brand: brands.find(b => b.id === newScooter.brand_id)?.name,
                        power_watts: newScooter.power_watts,
                        voltage: newScooter.voltage,
                        range_km: newScooter.range_km,
                        max_speed_kmh: newScooter.max_speed_kmh,
                      }}
                      onGenerated={(text) => setNewScooter(prev => ({ ...prev, meta_title: text }))}
                    />
                  </div>
                  <Input value={newScooter.meta_title} onChange={(e) => setNewScooter(prev => ({ ...prev, meta_title: e.target.value }))} placeholder="Titre SEO" maxLength={60} />
                  <p className="text-xs text-muted-foreground">{newScooter.meta_title.length}/60 caractères</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Meta Description</Label>
                    <AIGenerateButton
                      field="meta_description"
                      context={{
                        name: newScooter.name,
                        brand: brands.find(b => b.id === newScooter.brand_id)?.name,
                        power_watts: newScooter.power_watts,
                        voltage: newScooter.voltage,
                        range_km: newScooter.range_km,
                        max_speed_kmh: newScooter.max_speed_kmh,
                      }}
                      onGenerated={(text) => setNewScooter(prev => ({ ...prev, meta_description: text }))}
                    />
                  </div>
                  <Textarea value={newScooter.meta_description} onChange={(e) => setNewScooter(prev => ({ ...prev, meta_description: e.target.value }))} placeholder="Description SEO" rows={3} maxLength={160} />
                  <p className="text-xs text-muted-foreground">{newScooter.meta_description.length}/160 caractères</p>
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
      {/* Published filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={publishedFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPublishedFilter('all')}
          className="gap-2"
        >
          Tous <Badge variant="secondary">{scooters.length}</Badge>
        </Button>
        <Button
          variant={publishedFilter === 'published' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPublishedFilter('published')}
          className="gap-2"
        >
          Publiés <Badge variant="secondary" className="bg-green-600 text-white">{publishedCount}</Badge>
        </Button>
        <Button
          variant={publishedFilter === 'draft' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPublishedFilter('draft')}
          className="gap-2"
        >
          Brouillons <Badge variant="secondary" className="bg-amber-600 text-white">{draftCount}</Badge>
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {filteredScooters.length} trottinette(s) • {scooters.filter(s => s.image_url).length} avec image
      </p>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-foreground/5">
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Modèle</TableHead>
              <TableHead>Marque</TableHead>
              <TableHead className="w-16">Année</TableHead>
              <TableHead className="w-20"><Zap className="w-3 h-3 inline mr-1" />W</TableHead>
              <TableHead className="w-16"><Battery className="w-3 h-3 inline mr-1" />V</TableHead>
              <TableHead className="w-20"><Gauge className="w-3 h-3 inline mr-1" />km/h</TableHead>
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
                          type="file" accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(scooter.id, scooter.slug, file); }}
                          disabled={uploading === scooter.id}
                        />
                        {uploading === scooter.id ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Upload className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">{scooter.name}</span>
                      {scooter.search_terms && (
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">{scooter.search_terms}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{scooter.brand?.name || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{scooter.year || '-'}</TableCell>
                  <TableCell className="text-primary font-medium">{scooter.power_watts || '-'}</TableCell>
                  <TableCell>{scooter.voltage || '-'}</TableCell>
                  <TableCell>{scooter.max_speed_kmh || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/scooter/${scooter.id}/expert`)} className="h-8 w-8 text-primary hover:text-primary" title="Expert Studio">
                        <Cpu className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => startEditing(scooter)} className="h-8 w-8" title="Modifier">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => duplicateScooter(scooter)} className="h-8 w-8" title="Dupliquer">
                        <Copy className="w-4 h-4" />
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
                              Cette action supprimera la trottinette, son image, toutes les compatibilités et les entrées de garage associées.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteScooter(scooter)} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
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
            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label>Année</Label>
                <Input type="number" value={editValues.year} onChange={(e) => setEditValues(prev => ({ ...prev, year: e.target.value }))} placeholder="2024" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Alias / Noms alternatifs</Label>
              <Input value={editValues.search_terms} onChange={(e) => setEditValues(prev => ({ ...prev, search_terms: e.target.value }))} placeholder="M365, Mi Scooter, etc." />
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Description</Label>
                <AIGenerateButton
                  field="description"
                  context={{
                    name: editValues.name,
                    brand: brands.find(b => b.id === editValues.brand_id)?.name,
                    power_watts: editValues.power_watts,
                    voltage: editValues.voltage,
                    range_km: editValues.range_km,
                    tire_size: editValues.tire_size,
                    max_speed_kmh: editValues.max_speed_kmh,
                  }}
                  onGenerated={(text) => setEditValues(prev => ({ ...prev, description: text }))}
                />
              </div>
              <RichTextEditor
                value={editValues.description}
                onChange={(val) => setEditValues(prev => ({ ...prev, description: val }))}
                placeholder="Description de la trottinette..."
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Meta Title</Label>
                <AIGenerateButton
                  field="meta_title"
                  context={{
                    name: editValues.name,
                    brand: brands.find(b => b.id === editValues.brand_id)?.name,
                    power_watts: editValues.power_watts,
                    voltage: editValues.voltage,
                    range_km: editValues.range_km,
                    max_speed_kmh: editValues.max_speed_kmh,
                  }}
                  onGenerated={(text) => setEditValues(prev => ({ ...prev, meta_title: text }))}
                />
              </div>
              <Input value={editValues.meta_title} onChange={(e) => setEditValues(prev => ({ ...prev, meta_title: e.target.value }))} placeholder="Titre SEO" maxLength={60} />
              <p className="text-xs text-muted-foreground">{editValues.meta_title.length}/60 caractères</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Meta Description</Label>
                <AIGenerateButton
                  field="meta_description"
                  context={{
                    name: editValues.name,
                    brand: brands.find(b => b.id === editValues.brand_id)?.name,
                    power_watts: editValues.power_watts,
                    voltage: editValues.voltage,
                    range_km: editValues.range_km,
                    max_speed_kmh: editValues.max_speed_kmh,
                  }}
                  onGenerated={(text) => setEditValues(prev => ({ ...prev, meta_description: text }))}
                />
              </div>
              <Textarea value={editValues.meta_description} onChange={(e) => setEditValues(prev => ({ ...prev, meta_description: e.target.value }))} placeholder="Description SEO" rows={3} maxLength={160} />
              <p className="text-xs text-muted-foreground">{editValues.meta_description.length}/160 caractères</p>
            </div>

            {/* Signature Technique (IA) — Lave Froide */}
            <Collapsible open={sigOpen} onOpenChange={setSigOpen}>
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#1A1A1A] border border-[#93B5A1]/30 text-white/90 hover:border-[#93B5A1]/60 transition-all group">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Cpu className="w-4 h-4 text-[#93B5A1] drop-shadow-[0_0_6px_rgba(147,181,161,0.5)]" />
                    Signature Technique (IA)
                  </span>
                  <ChevronDown className={`w-4 h-4 text-[#93B5A1] transition-transform ${sigOpen ? 'rotate-180' : ''}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 p-4 rounded-xl bg-[#1A1A1A]/90 backdrop-blur-sm border border-[#93B5A1]/20 space-y-3">
                  {/* Standard keys */}
                  {SIGNATURE_DEFAULTS.map((field) => (
                    <div key={field.key} className="flex items-center gap-3">
                      <Label className="text-xs text-white/60 w-28 shrink-0">{field.label}</Label>
                      {field.type === 'select' ? (
                        <Select
                          value={editValues.technical_signature[field.key] || ''}
                          onValueChange={(v) => setEditValues(prev => ({
                            ...prev,
                            technical_signature: { ...prev.technical_signature, [field.key]: v }
                          }))}
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs h-8">
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options?.map(o => (
                              <SelectItem key={o} value={o}>{o}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : field.type === 'number' ? (
                        <Input
                          type="number" className="bg-white/5 border-white/10 text-white text-xs h-8"
                          value={editValues.technical_signature[field.key] || ''}
                          onChange={(e) => setEditValues(prev => ({
                            ...prev,
                            technical_signature: { ...prev.technical_signature, [field.key]: e.target.value ? Number(e.target.value) : '' }
                          }))}
                        />
                      ) : (
                        <Input
                          className="bg-white/5 border-white/10 text-white text-xs h-8"
                          value={editValues.technical_signature[field.key] || ''}
                          onChange={(e) => setEditValues(prev => ({
                            ...prev,
                            technical_signature: { ...prev.technical_signature, [field.key]: e.target.value }
                          }))}
                        />
                      )}
                    </div>
                  ))}

                  {/* Custom keys */}
                  {Object.entries(editValues.technical_signature)
                    .filter(([k]) => !SIGNATURE_DEFAULTS.some(d => d.key === k))
                    .map(([k, v]) => (
                      <div key={k} className="flex items-center gap-2">
                        <span className="text-xs text-[#93B5A1] font-mono w-28 shrink-0 truncate">{k}</span>
                        <Input
                          className="bg-white/5 border-white/10 text-white text-xs h-8 flex-1"
                          value={String(v || '')}
                          onChange={(e) => setEditValues(prev => ({
                            ...prev,
                            technical_signature: { ...prev.technical_signature, [k]: e.target.value }
                          }))}
                        />
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive"
                          onClick={() => setEditValues(prev => {
                            const sig = { ...prev.technical_signature };
                            delete sig[k];
                            return { ...prev, technical_signature: sig };
                          })}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}

                  {/* Add custom marker */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <Input
                      placeholder="clé" className="bg-white/5 border-white/10 text-white text-xs h-8 w-28"
                      value={customKey} onChange={(e) => setCustomKey(e.target.value)}
                    />
                    <Input
                      placeholder="valeur" className="bg-white/5 border-white/10 text-white text-xs h-8 flex-1"
                      value={customValue} onChange={(e) => setCustomValue(e.target.value)}
                    />
                    <Button
                      size="sm" className="h-8 bg-[#93B5A1] hover:bg-[#7a9e89] text-white text-xs"
                      disabled={!customKey.trim()}
                      onClick={() => {
                        setEditValues(prev => ({
                          ...prev,
                          technical_signature: { ...prev.technical_signature, [customKey.trim()]: customValue }
                        }));
                        setCustomKey(''); setCustomValue('');
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Ajouter
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {editScooter && (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Images className="w-4 h-4" />
                      📸 Galerie multi-photos (nouveau)
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <MultiPhotoGallery
                    entityType="scooter"
                    entityId={editScooter.id}
                    defaultAltBase={`${editScooter.brand?.name ?? ''} ${editScooter.name}`.trim()}
                  />
                </CollapsibleContent>
              </Collapsible>
            )}
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
