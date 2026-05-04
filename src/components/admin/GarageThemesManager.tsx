import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Pencil, Trash2, Upload, Wallpaper } from 'lucide-react';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';

interface GarageTheme {
  id: string;
  key: string;
  name: string;
  description: string | null;
  image_url: string;
  thumbnail_url: string | null;
  unlock_type: 'free' | 'xp' | 'paid';
  required_xp: number;
  price_eur: number | null;
  is_active: boolean;
  display_order: number;
}

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const emptyForm = {
  id: null as string | null,
  key: '',
  name: '',
  description: '',
  image_url: '',
  unlock_type: 'free' as 'free' | 'xp' | 'paid',
  required_xp: 0,
  price_eur: '' as string,
  is_active: true,
  display_order: 0,
};

const GarageThemesManager = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [keyTouched, setKeyTouched] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GarageTheme | null>(null);
  const [usersUsingDeleted, setUsersUsingDeleted] = useState(0);

  const { data: themes, isLoading } = useQuery({
    queryKey: ['admin-garage-themes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('garage_themes')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as GarageTheme[];
    },
  });

  const openCreate = () => {
    setForm(emptyForm);
    setKeyTouched(false);
    setDialogOpen(true);
  };

  const openEdit = (t: GarageTheme) => {
    setForm({
      id: t.id,
      key: t.key,
      name: t.name,
      description: t.description ?? '',
      image_url: t.image_url,
      unlock_type: t.unlock_type,
      required_xp: t.required_xp,
      price_eur: t.price_eur != null ? String(t.price_eur) : '',
      is_active: t.is_active,
      display_order: t.display_order,
    });
    setKeyTouched(true);
    setDialogOpen(true);
  };

  const handleNameChange = (v: string) => {
    setForm((f) => ({
      ...f,
      name: v,
      key: keyTouched ? f.key : slugify(v),
    }));
  };

  const handleFile = async (file: File) => {
    if (!file) return;
    if (!form.key) {
      toast.error('Renseigne d\'abord le nom du fond');
      return;
    }
    setUploading(true);
    try {
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 1920,
        maxSizeMB: 1,
        fileType: 'image/webp',
        useWebWorker: true,
      });
      const path = `${form.key}-${Date.now()}.webp`;
      const { error: upErr } = await supabase.storage
        .from('garage-themes')
        .upload(path, compressed, {
          cacheControl: '31536000',
          upsert: false,
          contentType: 'image/webp',
        });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('garage-themes').getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: pub.publicUrl }));
      toast.success('Image uploadée');
    } catch (e: any) {
      toast.error(e.message ?? 'Erreur upload');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.key.trim() || !form.image_url) {
      toast.error('Nom, key et image requis');
      return;
    }
    setSaving(true);
    const payload = {
      key: form.key.trim(),
      name: form.name.trim(),
      description: form.description.trim() || null,
      image_url: form.image_url,
      unlock_type: form.unlock_type,
      required_xp: form.unlock_type === 'xp' ? Number(form.required_xp) || 0 : 0,
      price_eur: form.unlock_type === 'paid' && form.price_eur ? Number(form.price_eur) : null,
      is_active: form.is_active,
      display_order: Number(form.display_order) || 0,
    };
    try {
      if (form.id) {
        const { error } = await supabase.from('garage_themes').update(payload).eq('id', form.id);
        if (error) throw error;
        toast.success('Fond mis à jour');
      } else {
        const { error } = await supabase.from('garage_themes').insert(payload);
        if (error) throw error;
        toast.success('Fond créé');
      }
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-garage-themes'] });
      queryClient.invalidateQueries({ queryKey: ['garage-themes'] });
    } catch (e: any) {
      toast.error(e.message ?? 'Erreur sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const askDelete = async (t: GarageTheme) => {
    const { count } = await (supabase as any)
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('active_theme_key', t.key);
    setUsersUsingDeleted(count ?? 0);
    setDeleteTarget(t);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (usersUsingDeleted > 0) {
        await supabase
          .from('profiles')
          .update({ active_theme_key: null } as any)
          .eq('active_theme_key' as any, deleteTarget.key);
      }
      // Storage cleanup si l'URL pointe vers le bucket
      const marker = '/garage-themes/';
      const idx = deleteTarget.image_url.indexOf(marker);
      if (idx !== -1) {
        const path = deleteTarget.image_url.substring(idx + marker.length);
        await supabase.storage.from('garage-themes').remove([path]);
      }
      const { error } = await supabase.from('garage_themes').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      toast.success('Fond supprimé');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin-garage-themes'] });
      queryClient.invalidateQueries({ queryKey: ['garage-themes'] });
    } catch (e: any) {
      toast.error(e.message ?? 'Erreur suppression');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallpaper className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-[hsl(0_0%_95%)]">Fonds Garage</h2>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> Nouveau fond
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : !themes?.length ? (
        <p className="text-sm text-[hsl(0_0%_55%)] text-center py-10">
          Aucun fond pour l'instant. Crée le premier.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {themes.map((t) => (
            <div
              key={t.id}
              className="group relative aspect-video rounded-xl overflow-hidden border border-[hsl(0_0%_18%)]"
            >
              <img src={t.image_url} alt={t.name} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                {!t.is_active && <Badge variant="secondary" className="text-[10px]">Inactif</Badge>}
                <Badge
                  variant="outline"
                  className="text-[10px] bg-black/40 text-white border-white/30"
                >
                  {t.unlock_type === 'free' ? 'Gratuit' : t.unlock_type === 'xp' ? `${t.required_xp} XP` : `${t.price_eur ?? '?'} €`}
                </Badge>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-2 flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{t.name}</p>
                  <p className="text-[10px] text-white/60 truncate">#{t.display_order} · {t.key}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => openEdit(t)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => askDelete(t)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Modifier le fond' : 'Nouveau fond'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {form.image_url && (
              <div className="aspect-video rounded-lg overflow-hidden border border-[hsl(0_0%_18%)]">
                <img src={form.image_url} alt="preview" className="w-full h-full object-cover" />
              </div>
            )}

            <div>
              <Label className="mb-1.5 block">Image</Label>
              <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-[hsl(0_0%_25%)] hover:border-primary cursor-pointer transition-colors">
                {uploading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Upload...</>
                ) : (
                  <><Upload className="w-4 h-4" /> {form.image_url ? 'Remplacer' : 'Choisir une image'}</>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </label>
            </div>

            <div>
              <Label htmlFor="name" className="mb-1.5 block">Nom</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Atelier Marseille"
              />
            </div>

            <div>
              <Label htmlFor="key" className="mb-1.5 block">Clé technique (slug)</Label>
              <Input
                id="key"
                value={form.key}
                onChange={(e) => { setKeyTouched(true); setForm((f) => ({ ...f, key: slugify(e.target.value) })); }}
                placeholder="atelier-marseille"
              />
            </div>

            <div>
              <Label htmlFor="desc" className="mb-1.5 block">Description (optionnel)</Label>
              <Textarea
                id="desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div>
              <Label className="mb-1.5 block">Type de déverrouillage</Label>
              <RadioGroup
                value={form.unlock_type}
                onValueChange={(v: any) => setForm((f) => ({ ...f, unlock_type: v }))}
                className="flex gap-4"
              >
                <label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="free" /> Gratuit
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="xp" /> XP
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <RadioGroupItem value="paid" /> Payant
                </label>
              </RadioGroup>
            </div>

            {form.unlock_type === 'xp' && (
              <div>
                <Label htmlFor="xp" className="mb-1.5 block">XP requis</Label>
                <Input
                  id="xp" type="number" min={0}
                  value={form.required_xp}
                  onChange={(e) => setForm((f) => ({ ...f, required_xp: Number(e.target.value) }))}
                />
              </div>
            )}

            {form.unlock_type === 'paid' && (
              <div>
                <Label htmlFor="price" className="mb-1.5 block">Prix EUR</Label>
                <Input
                  id="price" type="number" min={0} step="0.01"
                  value={form.price_eur}
                  onChange={(e) => setForm((f) => ({ ...f, price_eur: e.target.value }))}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="order" className="mb-1.5 block">Ordre</Label>
                <Input
                  id="order" type="number"
                  value={form.display_order}
                  onChange={(e) => setForm((f) => ({ ...f, display_order: Number(e.target.value) }))}
                />
              </div>
              <div className="flex items-end gap-2 pb-1">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
                />
                <Label>Actif</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving || uploading}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce fond ?</AlertDialogTitle>
            <AlertDialogDescription>
              {usersUsingDeleted > 0
                ? `${usersUsingDeleted} rider(s) utilisent ce fond. Ils seront réassignés au fond par défaut.`
                : 'Cette action supprime le fond et son image. Irréversible.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GarageThemesManager;
