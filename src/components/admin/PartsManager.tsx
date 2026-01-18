import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Upload, Check, X, Image as ImageIcon, Save, Plus, Trash2, Edit, Download, Search, FileUp, Package, Wrench, Code, Globe, AlertTriangle, ArrowUpDown, Layers, ChevronUp, ChevronDown, Trophy, Bike } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import Papa from 'papaparse';
import { cn } from '@/lib/utils';
import ScooterCompatibilitySelect from './ScooterCompatibilitySelect';

import type { Json } from '@/integrations/supabase/types';

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
  technical_metadata: Json | null;
  sku: string | null;
  min_stock_alert: number | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at?: string;
  is_featured?: boolean;
}

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
}

type SortField = 'name' | 'price' | 'stock' | 'created_at';
type SortDirection = 'asc' | 'desc';
type GroupBy = 'none' | 'category' | 'stock_status';

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
  
  // Smart Toolbar state
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  
  // CSV Import state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ success: number; errors: string[] } | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const [newPart, setNewPart] = useState({
    name: '',
    category_id: '',
    price: '',
    stock: '',
    description: '',
    difficulty_level: '',
    estimated_install_time_minutes: '',
    required_tools: '',
    youtube_video_id: '',
    sku: '',
    min_stock_alert: '5',
    meta_title: '',
    meta_description: '',
    technical_metadata: '{}',
    is_featured: false,
    compatibleScooterIds: [] as string[]
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
    youtube_video_id: '',
    sku: '',
    min_stock_alert: '',
    meta_title: '',
    meta_description: '',
    technical_metadata: '{}',
    is_featured: false,
    compatibleScooterIds: [] as string[]
  });

  useEffect(() => {
    fetchParts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, parent_id')
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
        .select('id, name, slug, price, stock_quantity, image_url, category_id, description, difficulty_level, estimated_install_time_minutes, required_tools, youtube_video_id, technical_metadata, sku, min_stock_alert, meta_title, meta_description, created_at, is_featured, category:categories(name)')
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

  const parseJsonSafe = (str: string): Json | null => {
    try {
      const parsed = JSON.parse(str);
      return typeof parsed === 'object' && parsed !== null ? parsed as Json : null;
    } catch {
      return null;
    }
  };

  const createPart = async () => {
    if (!newPart.name.trim() || !newPart.category_id) {
      toast.error('Nom et catégorie requis');
      return;
    }

    const technicalMetadata = parseJsonSafe(newPart.technical_metadata);
    if (newPart.technical_metadata.trim() && newPart.technical_metadata !== '{}' && !technicalMetadata) {
      toast.error('Format JSON invalide pour les specs techniques');
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
          youtube_video_id: newPart.youtube_video_id.trim() || null,
          sku: newPart.sku.trim() || null,
          min_stock_alert: newPart.min_stock_alert ? parseInt(newPart.min_stock_alert) : 5,
          meta_title: newPart.meta_title.trim() || null,
          meta_description: newPart.meta_description.trim() || null,
          technical_metadata: (technicalMetadata || {}) as Json,
          is_featured: newPart.is_featured
        })
        .select('id, name, slug, price, stock_quantity, image_url, category_id, description, difficulty_level, estimated_install_time_minutes, required_tools, youtube_video_id, technical_metadata, sku, min_stock_alert, meta_title, meta_description, is_featured, category:categories(name)')
        .single();

      if (error) throw error;

      setParts(prev => [...prev, data]);
      setNewPart({ name: '', category_id: '', price: '', stock: '', description: '', difficulty_level: '', estimated_install_time_minutes: '', required_tools: '', youtube_video_id: '', sku: '', min_stock_alert: '5', meta_title: '', meta_description: '', technical_metadata: '{}', is_featured: false, compatibleScooterIds: [] });
      setIsCreateOpen(false);
      toast.success('Pièce créée avec succès');
    } catch (error: any) {
      console.error('Error creating part:', error);
      if (error.code === '23505' && error.message?.includes('sku')) {
        toast.error('Ce SKU existe déjà');
      } else {
        toast.error('Erreur lors de la création');
      }
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
      youtube_video_id: part.youtube_video_id || '',
      sku: part.sku || '',
      min_stock_alert: part.min_stock_alert?.toString() || '5',
      meta_title: part.meta_title || '',
      meta_description: part.meta_description || '',
      technical_metadata: part.technical_metadata ? JSON.stringify(part.technical_metadata, null, 2) : '{}',
      is_featured: part.is_featured || false,
      compatibleScooterIds: [] // Will be loaded by ScooterCompatibilitySelect component
    });
    setIsEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editPart) return;

    const technicalMetadata = parseJsonSafe(editValues.technical_metadata);
    if (editValues.technical_metadata.trim() && editValues.technical_metadata !== '{}' && !technicalMetadata) {
      toast.error('Format JSON invalide pour les specs techniques');
      return;
    }

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
          youtube_video_id: editValues.youtube_video_id.trim() || null,
          sku: editValues.sku.trim() || null,
          min_stock_alert: editValues.min_stock_alert ? parseInt(editValues.min_stock_alert) : 5,
          meta_title: editValues.meta_title.trim() || null,
          meta_description: editValues.meta_description.trim() || null,
          technical_metadata: (technicalMetadata || {}) as Json,
          is_featured: editValues.is_featured
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
              sku: editValues.sku.trim() || null,
              min_stock_alert: editValues.min_stock_alert ? parseInt(editValues.min_stock_alert) : 5,
              meta_title: editValues.meta_title.trim() || null,
              meta_description: editValues.meta_description.trim() || null,
              technical_metadata: (technicalMetadata || {}) as Json,
              is_featured: editValues.is_featured,
              category: categories.find(c => c.id === editValues.category_id) ? { name: categories.find(c => c.id === editValues.category_id)!.name } : null
            }
          : p
      ));

      setIsEditOpen(false);
      setEditPart(null);
      toast.success('Pièce modifiée avec succès');
    } catch (error: any) {
      console.error('Error saving part:', error);
      if (error.code === '23505' && error.message?.includes('sku')) {
        toast.error('Ce SKU existe déjà');
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    } finally {
      setSaving(false);
    }
  };

  const deletePart = async (part: Part) => {
    setDeleting(part.id);
    try {
      await supabase.from('part_compatibility').delete().eq('part_id', part.id);

      if (part.image_url && part.image_url.includes('part-images')) {
        const fileName = part.image_url.split('/').pop();
        if (fileName) {
          await supabase.storage.from('part-images').remove([fileName]);
        }
      }

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
    const headers = ['Nom', 'Slug', 'SKU', 'Catégorie', 'Prix', 'Stock', 'Alerte Stock', 'Difficulté', 'Temps Install', 'Outils', 'YouTube ID', 'Description', 'Meta Title', 'Meta Description', 'Image URL'];
    const rows = parts.map(p => [
      p.name,
      p.slug,
      p.sku || '',
      p.category?.name || '',
      p.price?.toString() || '',
      p.stock_quantity?.toString() || '',
      p.min_stock_alert?.toString() || '5',
      p.difficulty_level?.toString() || '',
      p.estimated_install_time_minutes?.toString() || '',
      p.required_tools?.join('; ') || '',
      p.youtube_video_id || '',
      p.description || '',
      p.meta_title || '',
      p.meta_description || '',
      p.image_url || ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pieces-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Export CSV téléchargé');
  };

  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportProgress(0);
    setImportResults(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as Record<string, string>[];
        const errors: string[] = [];
        let successCount = 0;

        const categoryMap = new Map<string, string>();
        categories.forEach(cat => {
          categoryMap.set(cat.name.toLowerCase(), cat.id);
          categoryMap.set(slugify(cat.name), cat.id);
        });

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          setImportProgress(Math.round(((i + 1) / rows.length) * 100));

          const name = row['Nom'] || row['nom'] || row['Name'] || row['name'] || '';
          if (!name.trim()) {
            errors.push(`Ligne ${i + 2}: Nom manquant`);
            continue;
          }

          const categoryName = row['Catégorie'] || row['categorie'] || row['Category'] || row['category'] || '';
          let categoryId: string | null = null;
          
          if (categoryName.trim()) {
            const normalizedCat = categoryName.toLowerCase().trim();
            categoryId = categoryMap.get(normalizedCat) || categoryMap.get(slugify(normalizedCat)) || null;
            
            if (!categoryId) {
              errors.push(`Ligne ${i + 2}: Catégorie "${categoryName}" non trouvée`);
            }
          }

          const priceStr = row['Prix'] || row['prix'] || row['Price'] || row['price'] || '';
          const stockStr = row['Stock'] || row['stock'] || row['Quantity'] || row['quantity'] || '';
          const skuStr = row['SKU'] || row['sku'] || row['Sku'] || '';
          const minStockStr = row['Alerte Stock'] || row['alerte_stock'] || row['Min Stock'] || row['min_stock'] || '';
          const difficultyStr = row['Difficulté'] || row['difficulte'] || row['Difficulty'] || row['difficulty'] || '';
          const installTimeStr = row['Temps Install'] || row['temps_install'] || row['Install Time'] || row['install_time'] || '';
          const toolsStr = row['Outils'] || row['outils'] || row['Tools'] || row['tools'] || '';
          const youtubeId = row['YouTube ID'] || row['youtube_id'] || row['Video ID'] || row['video_id'] || '';
          const description = row['Description'] || row['description'] || '';
          const metaTitle = row['Meta Title'] || row['meta_title'] || '';
          const metaDescription = row['Meta Description'] || row['meta_description'] || '';

          try {
            const slug = slugify(name);
            const { error } = await supabase
              .from('parts')
              .insert({
                name: name.trim(),
                slug,
                category_id: categoryId,
                price: priceStr ? parseFloat(priceStr.replace(',', '.').replace('€', '').trim()) : null,
                stock_quantity: stockStr ? parseInt(stockStr) : 0,
                sku: skuStr.trim() || null,
                min_stock_alert: minStockStr ? parseInt(minStockStr) : 5,
                difficulty_level: difficultyStr ? parseInt(difficultyStr) : null,
                estimated_install_time_minutes: installTimeStr ? parseInt(installTimeStr) : null,
                required_tools: toolsStr ? toolsStr.split(/[;,]/).map(t => t.trim()).filter(Boolean) : null,
                youtube_video_id: youtubeId.trim() || null,
                description: description.trim() || null,
                meta_title: metaTitle.trim() || null,
                meta_description: metaDescription.trim() || null
              });

            if (error) {
              if (error.code === '23505') {
                if (error.message?.includes('sku')) {
                  errors.push(`Ligne ${i + 2}: SKU "${skuStr}" existe déjà`);
                } else {
                  errors.push(`Ligne ${i + 2}: "${name}" existe déjà (slug: ${slug})`);
                }
              } else {
                errors.push(`Ligne ${i + 2}: ${error.message}`);
              }
            } else {
              successCount++;
            }
          } catch (err) {
            errors.push(`Ligne ${i + 2}: Erreur inattendue`);
          }
        }

        setImportResults({ success: successCount, errors });
        setImporting(false);
        
        if (successCount > 0) {
          fetchParts();
          toast.success(`${successCount} pièce(s) importée(s)`);
        }
        
        if (errors.length > 0) {
          toast.error(`${errors.length} erreur(s) lors de l'import`);
        }
      },
      error: (error) => {
        setImporting(false);
        toast.error(`Erreur de parsing CSV: ${error.message}`);
      }
    });

    if (csvInputRef.current) {
      csvInputRef.current.value = '';
    }
  };

  const isPlaceholder = (url: string | null) => {
    return !url || url.includes('placehold.co') || url.includes('placeholder');
  };

  const isLowStock = (part: Part) => {
    const threshold = part.min_stock_alert ?? 5;
    return (part.stock_quantity ?? 0) <= threshold;
  };

  const filteredParts = parts.filter(part => {
    const matchesSearch = part.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (part.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCategory = categoryFilter === 'all' || part.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowStockCount = parts.filter(isLowStock).length;

  // Sort logic
  const sortedParts = useMemo(() => {
    return [...filteredParts].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'fr');
          break;
        case 'price':
          comparison = (a.price ?? 0) - (b.price ?? 0);
          break;
        case 'stock':
          comparison = (a.stock_quantity ?? 0) - (b.stock_quantity ?? 0);
          break;
        case 'created_at':
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          comparison = dateB - dateA;
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredParts, sortField, sortDirection]);

  // Stock status helper
  const getStockStatus = (part: Part): 'critical' | 'low' | 'normal' => {
    const threshold = part.min_stock_alert ?? 5;
    const stock = part.stock_quantity ?? 0;
    if (stock === 0) return 'critical';
    if (stock <= threshold) return 'low';
    return 'normal';
  };

  // Get category display name with hierarchy
  const getCategoryDisplayName = (part: Part): string => {
    const cat = categories.find(c => c.id === part.category_id);
    if (!cat) return 'Sans catégorie';
    
    const parentCat = cat.parent_id ? categories.find(c => c.id === cat.parent_id) : null;
    return parentCat ? `${parentCat.name} › ${cat.name}` : cat.name;
  };

  // Grouping logic
  const groupedParts = useMemo(() => {
    if (groupBy === 'none') {
      return { 'all': sortedParts };
    }
    
    if (groupBy === 'category') {
      const groups: Record<string, Part[]> = {};
      
      // First, organize by parent categories
      const parentOrder: string[] = [];
      
      sortedParts.forEach(part => {
        const groupName = getCategoryDisplayName(part);
        
        if (!groups[groupName]) {
          groups[groupName] = [];
          parentOrder.push(groupName);
        }
        groups[groupName].push(part);
      });
      
      // Sort groups alphabetically
      const sortedGroups: Record<string, Part[]> = {};
      parentOrder.sort((a, b) => a.localeCompare(b, 'fr'));
      parentOrder.forEach(key => {
        sortedGroups[key] = groups[key];
      });
      
      return sortedGroups;
    }
    
    if (groupBy === 'stock_status') {
      const critical = sortedParts.filter(p => getStockStatus(p) === 'critical');
      const low = sortedParts.filter(p => getStockStatus(p) === 'low');
      const normal = sortedParts.filter(p => getStockStatus(p) === 'normal');
      
      const result: Record<string, Part[]> = {};
      if (critical.length > 0) result['🔴 Stock Critique (0)'] = critical;
      if (low.length > 0) result['🟠 Stock Bas'] = low;
      if (normal.length > 0) result['🟢 Stock Normal'] = normal;
      
      return result;
    }
    
    return { 'all': sortedParts };
  }, [sortedParts, groupBy, categories]);

  // Sort label
  const getSortLabel = () => {
    const labels: Record<SortField, string> = {
      name: 'Nom',
      price: 'Prix',
      stock: 'Stock',
      created_at: 'Date'
    };
    const direction = sortDirection === 'asc' ? '↑' : '↓';
    return `${labels[sortField]} ${direction}`;
  };

  // Grouping label
  const getGroupLabel = () => {
    const labels: Record<GroupBy, string> = {
      none: 'Aucun',
      category: 'Catégorie',
      stock_status: 'Statut Stock'
    };
    return labels[groupBy];
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderFormFields = (values: typeof newPart, setValues: (v: typeof newPart) => void, isEdit = false) => (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid w-full grid-cols-5 mb-4">
        <TabsTrigger value="general" className="text-xs gap-1"><Package className="w-3 h-3" /> Général</TabsTrigger>
        <TabsTrigger value="compat" className="text-xs gap-1"><Bike className="w-3 h-3" /> Compat</TabsTrigger>
        <TabsTrigger value="install" className="text-xs gap-1"><Wrench className="w-3 h-3" /> Install</TabsTrigger>
        <TabsTrigger value="specs" className="text-xs gap-1"><Code className="w-3 h-3" /> Specs</TabsTrigger>
        <TabsTrigger value="seo" className="text-xs gap-1"><Globe className="w-3 h-3" /> SEO</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-4">
        <div className="space-y-2">
          <Label>Nom *</Label>
          <Input value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} placeholder="Ex: Pneu 10 pouces" />
          {values.name && <p className="text-xs text-muted-foreground">Slug: {slugify(values.name)}</p>}
        </div>
        <div className="space-y-2">
          <Label>Catégorie *</Label>
          <Select value={values.category_id} onValueChange={(v) => setValues({ ...values, category_id: v })}>
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
            <Label>SKU</Label>
            <Input value={values.sku} onChange={(e) => setValues({ ...values, sku: e.target.value })} placeholder="REF-001" />
          </div>
          <div className="space-y-2">
            <Label>Prix (€)</Label>
            <Input type="number" value={values.price} onChange={(e) => setValues({ ...values, price: e.target.value })} placeholder="0.00" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Stock</Label>
            <Input type="number" value={values.stock} onChange={(e) => setValues({ ...values, stock: e.target.value })} placeholder="0" />
          </div>
          <div className="space-y-2">
            <Label>Alerte stock min</Label>
            <Input type="number" value={values.min_stock_alert} onChange={(e) => setValues({ ...values, min_stock_alert: e.target.value })} placeholder="5" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} placeholder="Description..." rows={3} />
        </div>
        
        {/* Pépite du Chef Toggle - Luxury Design */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-mineral/5 border border-mineral/20 transition-all duration-300 hover:bg-mineral/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-mineral/15 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-mineral" />
            </div>
            <div>
              <Label className="text-carbon font-medium cursor-pointer">Pépite du Chef</Label>
              <p className="text-xs text-muted-foreground">Marquer comme sélection premium</p>
            </div>
          </div>
          <Switch
            checked={values.is_featured}
            onCheckedChange={(checked) => setValues({ ...values, is_featured: checked })}
            className="data-[state=checked]:bg-mineral"
          />
        </div>
      </TabsContent>

      <TabsContent value="compat" className="space-y-4">
        <ScooterCompatibilitySelect
          partId={isEdit ? editPart?.id : undefined}
          selectedIds={values.compatibleScooterIds}
          onChange={(ids) => setValues({ ...values, compatibleScooterIds: ids })}
        />
      </TabsContent>

      <TabsContent value="install" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Difficulté (1-5)</Label>
            <Input type="number" min="1" max="5" value={values.difficulty_level} onChange={(e) => setValues({ ...values, difficulty_level: e.target.value })} placeholder="1-5" />
          </div>
          <div className="space-y-2">
            <Label>Temps install (min)</Label>
            <Input type="number" value={values.estimated_install_time_minutes} onChange={(e) => setValues({ ...values, estimated_install_time_minutes: e.target.value })} placeholder="30" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Outils requis</Label>
          <Input value={values.required_tools} onChange={(e) => setValues({ ...values, required_tools: e.target.value })} placeholder="Clé Allen, Tournevis..." />
          <p className="text-xs text-muted-foreground">Séparer par des virgules</p>
        </div>
        <div className="space-y-2">
          <Label>YouTube Video ID</Label>
          <Input value={values.youtube_video_id} onChange={(e) => setValues({ ...values, youtube_video_id: e.target.value })} placeholder="dQw4w9WgXcQ" />
        </div>
      </TabsContent>

      <TabsContent value="specs" className="space-y-4">
        <div className="space-y-2">
          <Label>Spécifications techniques (JSON)</Label>
          <Textarea 
            value={values.technical_metadata} 
            onChange={(e) => setValues({ ...values, technical_metadata: e.target.value })} 
            placeholder='{"poids": "250g", "dimensions": "10x5cm"}'
            rows={8}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">Format JSON. Ex: {`{"poids": "250g", "couleur": "noir"}`}</p>
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
      {/* Smart Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-xl border border-border">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Recherche instantanée par nom ou SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 bg-background"
          />
          {searchQuery && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setSearchQuery('')}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Category Filter */}
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue placeholder="Toutes catégories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {categories.map((cat) => {
              const parent = cat.parent_id ? categories.find(c => c.id === cat.parent_id) : null;
              return (
                <SelectItem key={cat.id} value={cat.id}>
                  {parent ? `${parent.name} › ${cat.name}` : cat.name}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 bg-background">
              <ArrowUpDown className="w-4 h-4" />
              <span className="hidden sm:inline">Trier:</span>
              <span className="font-medium">{getSortLabel()}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              onClick={() => { setSortField('name'); setSortDirection('asc'); }}
              className={cn(sortField === 'name' && sortDirection === 'asc' && 'bg-accent')}
            >
              <ChevronUp className="w-4 h-4 mr-2" /> Nom A → Z
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => { setSortField('name'); setSortDirection('desc'); }}
              className={cn(sortField === 'name' && sortDirection === 'desc' && 'bg-accent')}
            >
              <ChevronDown className="w-4 h-4 mr-2" /> Nom Z → A
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => { setSortField('price'); setSortDirection('asc'); }}
              className={cn(sortField === 'price' && sortDirection === 'asc' && 'bg-accent')}
            >
              <ChevronUp className="w-4 h-4 mr-2" /> Prix croissant
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => { setSortField('price'); setSortDirection('desc'); }}
              className={cn(sortField === 'price' && sortDirection === 'desc' && 'bg-accent')}
            >
              <ChevronDown className="w-4 h-4 mr-2" /> Prix décroissant
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => { setSortField('stock'); setSortDirection('asc'); }}
              className={cn(sortField === 'stock' && sortDirection === 'asc' && 'bg-accent')}
            >
              <ChevronUp className="w-4 h-4 mr-2" /> Stock croissant
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => { setSortField('stock'); setSortDirection('desc'); }}
              className={cn(sortField === 'stock' && sortDirection === 'desc' && 'bg-accent')}
            >
              <ChevronDown className="w-4 h-4 mr-2" /> Stock décroissant
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => { setSortField('created_at'); setSortDirection('desc'); }}
              className={cn(sortField === 'created_at' && sortDirection === 'desc' && 'bg-accent')}
            >
              <ChevronDown className="w-4 h-4 mr-2" /> Plus récents
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => { setSortField('created_at'); setSortDirection('asc'); }}
              className={cn(sortField === 'created_at' && sortDirection === 'asc' && 'bg-accent')}
            >
              <ChevronUp className="w-4 h-4 mr-2" /> Plus anciens
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Group Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className={cn("gap-2 bg-background", groupBy !== 'none' && "border-primary text-primary")}>
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">Grouper:</span>
              <span className="font-medium">{getGroupLabel()}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={() => setGroupBy('none')}
              className={cn(groupBy === 'none' && 'bg-accent')}
            >
              Aucun groupage
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => setGroupBy('category')}
              className={cn(groupBy === 'category' && 'bg-accent')}
            >
              Par Catégorie
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setGroupBy('stock_status')}
              className={cn(groupBy === 'stock_status' && 'bg-accent')}
            >
              Par Statut de Stock
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Action Buttons Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="font-medium">{sortedParts.length} pièce(s)</span>
          <span>• {parts.filter(p => !isPlaceholder(p.image_url)).length} avec image</span>
          {lowStockCount > 0 && (
            <span className="flex items-center gap-1 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
              {lowStockCount} stock bas
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={isImportOpen} onOpenChange={(open) => {
            setIsImportOpen(open);
            if (!open) {
              setImportResults(null);
              setImportProgress(0);
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <FileUp className="w-4 h-4" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Importer des pièces (CSV)</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Format attendu (colonnes)</Label>
                  <p className="text-xs text-muted-foreground">
                    Nom*, SKU, Catégorie, Prix, Stock, Alerte Stock, Difficulté, Temps Install, Outils, YouTube ID, Description, Meta Title, Meta Description
                  </p>
                  <p className="text-xs text-muted-foreground">
                    * = obligatoire. Les catégories sont mappées par nom. Les slugs sont générés automatiquement.
                  </p>
                </div>
                
                {!importing && !importResults && (
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 hover:border-primary/50 transition-colors">
                    <FileUp className="w-10 h-10 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">Sélectionnez un fichier CSV</p>
                    <input ref={csvInputRef} type="file" accept=".csv,text/csv" onChange={handleCSVImport} className="hidden" id="csv-import-input" />
                    <Button asChild variant="outline">
                      <label htmlFor="csv-import-input" className="cursor-pointer">Parcourir...</label>
                    </Button>
                  </div>
                )}

                {importing && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span className="text-sm">Import en cours...</span>
                    </div>
                    <Progress value={importProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">{importProgress}%</p>
                  </div>
                )}

                {importResults && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">{importResults.success} pièce(s) importée(s)</span>
                    </div>
                    
                    {importResults.errors.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-destructive">
                          <X className="w-5 h-5" />
                          <span className="font-medium">{importResults.errors.length} erreur(s)</span>
                        </div>
                        <div className="max-h-32 overflow-y-auto bg-muted/50 rounded-lg p-3 text-xs space-y-1">
                          {importResults.errors.slice(0, 10).map((err, idx) => (
                            <p key={idx} className="text-destructive">{err}</p>
                          ))}
                          {importResults.errors.length > 10 && (
                            <p className="text-muted-foreground">... et {importResults.errors.length - 10} autres erreurs</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <Button variant="outline" className="w-full" onClick={() => { setImportResults(null); setImportProgress(0); }}>
                      Importer un autre fichier
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
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
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer une nouvelle pièce</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                {renderFormFields(newPart, setNewPart)}
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

      {/* Grouped Tables with Sticky Headers */}
      <div className="space-y-6">
        {Object.entries(groupedParts).map(([groupName, groupParts]) => (
          groupParts.length > 0 && (
            <div key={groupName} className="rounded-lg border border-border overflow-hidden">
              {/* Sticky Group Header */}
              {groupBy !== 'none' && (
                <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b py-3 px-4 flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2 text-foreground">
                    {groupBy === 'stock_status' && (
                      <span className={cn(
                        "w-3 h-3 rounded-full",
                        groupName.includes('Critique') && "bg-red-500",
                        groupName.includes('Bas') && "bg-amber-500",
                        groupName.includes('Normal') && "bg-green-500"
                      )} />
                    )}
                    {groupName}
                  </h3>
                  <Badge variant="secondary" className="font-medium">
                    {groupParts.length} article{groupParts.length > 1 ? 's' : ''}
                  </Badge>
                </div>
              )}
              
              <Table>
                <TableHeader>
                  <TableRow className="bg-foreground/5">
                    <TableHead className="w-16">Image</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead className="w-24">SKU</TableHead>
                    {groupBy !== 'category' && <TableHead>Catégorie</TableHead>}
                    <TableHead className="w-24">Prix</TableHead>
                    <TableHead className="w-20">Stock</TableHead>
                    <TableHead className="w-20">Difficulté</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupParts.map((part) => (
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
                            {uploading === part.id ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Upload className="w-4 h-4 text-white" />}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{part.name}</TableCell>
                      <TableCell className="text-muted-foreground text-xs font-mono">{part.sku || '-'}</TableCell>
                      {groupBy !== 'category' && (
                        <TableCell className="text-muted-foreground">{part.category?.name || '-'}</TableCell>
                      )}
                      <TableCell>{part.price ? `${part.price}€` : '-'}</TableCell>
                      <TableCell>
                        <span className={cn(
                          "flex items-center gap-1",
                          getStockStatus(part) === 'critical' && "text-red-600",
                          getStockStatus(part) === 'low' && "text-amber-600",
                          getStockStatus(part) === 'normal' && "text-primary"
                        )}>
                          {getStockStatus(part) !== 'normal' && <AlertTriangle className="w-3 h-3" />}
                          {part.stock_quantity ?? 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        {part.difficulty_level ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{part.difficulty_level}/5</span>
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
                                <AlertDialogDescription>Cette action supprimera la pièce, son image et toutes les compatibilités associées. Cette action est irréversible.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deletePart(part)} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
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
          )
        ))}
        
        {sortedParts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Aucune pièce trouvée</p>
            {searchQuery && (
              <p className="text-sm mt-2">Essayez de modifier votre recherche</p>
            )}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la pièce</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {renderFormFields(editValues, setEditValues, true)}
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