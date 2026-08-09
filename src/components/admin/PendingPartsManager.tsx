import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Check, Trash2, Bot, Pencil, ExternalLink, ImageIcon, CheckCheck, Package, Euro, Wrench, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import PartSuppliersManager from './PartSuppliersManager';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';

export const usePendingParts = () => {
  return useQuery({
    queryKey: ['pending-parts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parts')
        .select('*, category:categories(id, name)')
        .eq('published', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
};

/* ─── helpers ─── */
function extractHostname(url: string) {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return url; }
}

function getSources(meta: any): { url: string; label: string }[] {
  const raw = meta?.sources;
  if (!Array.isArray(raw)) return [];
  return raw.map((s: any) =>
    typeof s === 'string' ? { url: s, label: extractHostname(s) } : { url: s.url, label: s.label || extractHostname(s.url) }
  );
}

/* ─── Edit Dialog ─── */
type PartRow = any;

const EditPartDialog = ({ part, open, onOpenChange }: { part: PartRow; open: boolean; onOpenChange: (v: boolean) => void }) => {
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string, any>>({});

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('id, name').order('name');
      return data || [];
    },
  });

  useEffect(() => {
    if (part) {
      setForm({
        image_url: part.image_url || '',
        name: part.name || '',
        slug: part.slug || '',
        price: part.price ?? '',
        stock_quantity: part.stock_quantity ?? '',
        difficulty_level: part.difficulty_level ?? '',
        category_id: part.category_id || '',
        description: part.description || '',
        sku: part.sku || '',
        youtube_video_id: part.youtube_video_id || '',
        meta_title: part.meta_title || '',
        meta_description: part.meta_description || '',
        price_override: part.price_override ?? false,
      });
    }
  }, [part]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, any> = { ...form };
      ['price'].forEach(k => {
        payload[k] = payload[k] === '' ? null : Number(payload[k]);
      });
      ['stock_quantity', 'difficulty_level'].forEach(k => {
        payload[k] = payload[k] === '' ? null : parseInt(payload[k]);
      });
      ['image_url', 'description', 'sku', 'youtube_video_id', 'meta_title', 'meta_description'].forEach(k => {
        if (payload[k] === '') payload[k] = null;
      });
      if (payload.category_id === '') payload.category_id = null;
      // Verrou prix : comparaison number vs number (payload.price vient d'un Input string).
      // case cochée OU prix réellement modifié → price_override=true (jamais réécrasé par le sync Airtable).
      const newPrice = (payload.price === null || payload.price === '' || payload.price === undefined) ? null : Number(payload.price);
      payload.price = newPrice;
      payload.price_override = !!form.price_override || newPrice !== (part.price ?? null);
      // Gel du slug — cette liste ne montre que published=false, mais slug_locked_at est
      // write-once : une pièce dépubliée y retombe en gardant son verrou. Son slug reste
      // une URL déjà indexée, le champ Slug du formulaire ne doit pas la réécrire.
      if (part.slug_locked_at != null) delete payload.slug;
      const { error } = await supabase.from('parts').update(payload).eq('id', part.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-parts'] });
      toast.success('Modifications enregistrées');
      onOpenChange(false);
    },
    onError: () => toast.error('Erreur lors de la sauvegarde'),
  });

  const field = (label: string, key: string, type = 'text', disabled = false) => (
    <div className="space-y-1">
      <label className="text-xs text-[hsl(0_0%_55%)]">{label}</label>
      <Input type={type} value={form[key] ?? ''} onChange={set(key)} disabled={disabled} className="bg-[hsl(0_0%_8%)] border-[hsl(0_0%_20%)] text-[hsl(0_0%_90%)] h-8 text-xs disabled:opacity-50" />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[hsl(0_0%_10%)] border-[hsl(0_0%_18%)] max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[hsl(0_0%_90%)]">Éditer — {part?.name}</DialogTitle>
          <DialogDescription className="text-[hsl(0_0%_50%)]">Modifiez les infos avant publication</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image preview */}
          <div className="space-y-1">
            <label className="text-xs text-[hsl(0_0%_55%)]">Image URL</label>
            <Input value={form.image_url ?? ''} onChange={set('image_url')} className="bg-[hsl(0_0%_8%)] border-[hsl(0_0%_20%)] text-[hsl(0_0%_90%)] h-8 text-xs" />
            {form.image_url && (
              <div className="h-32 bg-[hsl(0_0%_6%)] rounded flex items-center justify-center mt-1">
                <img src={form.image_url} alt="preview" className="h-full object-contain p-2" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {field('Nom', 'name')}
            {field(part.slug_locked_at ? 'Slug (gelé — URL indexée)' : 'Slug', 'slug', 'text', !!part.slug_locked_at)}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {field('Prix TTC (€)', 'price', 'number')}
            {field('Stock', 'stock_quantity', 'number')}
            {field('Difficulté (1-5)', 'difficulty_level', 'number')}
          </div>

          <div className="flex items-center justify-between rounded border border-[hsl(0_0%_20%)] p-2.5">
            <div className="space-y-0.5">
              <label className="text-xs text-[hsl(0_0%_75%)]">Prix piloté manuellement</label>
              <p className="text-[10px] text-[hsl(0_0%_50%)]">Le sync Airtable ne réécrasera jamais ce prix.</p>
            </div>
            <Switch
              checked={!!form.price_override}
              onCheckedChange={(checked) => setForm(f => ({ ...f, price_override: checked }))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-[hsl(0_0%_55%)]">Catégorie</label>
            <Select value={form.category_id || ''} onValueChange={v => setForm(f => ({ ...f, category_id: v }))}>
              <SelectTrigger className="bg-[hsl(0_0%_8%)] border-[hsl(0_0%_20%)] text-[hsl(0_0%_90%)] h-8 text-xs">
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent className="bg-[hsl(0_0%_10%)] border-[hsl(0_0%_20%)]">
                {categories.map((c: any) => (
                  <SelectItem key={c.id} value={c.id} className="text-[hsl(0_0%_90%)] text-xs">{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-[hsl(0_0%_55%)]">Description</label>
            <Textarea value={form.description ?? ''} onChange={set('description')} rows={3} className="bg-[hsl(0_0%_8%)] border-[hsl(0_0%_20%)] text-[hsl(0_0%_90%)] text-xs" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {field('SKU', 'sku')}
            {field('YouTube Video ID', 'youtube_video_id')}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {field('Meta Title', 'meta_title')}
            {field('Meta Description', 'meta_description')}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-[hsl(0_0%_20%)] text-[hsl(0_0%_70%)]">Annuler</Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-primary text-primary-foreground gap-1.5">
            {saveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ─── Main component ─── */
const PendingPartsManager = () => {
  const queryClient = useQueryClient();
  const { data: pending = [], isLoading } = usePendingParts();
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingPart, setEditingPart] = useState<PartRow | null>(null);
  const [imageEditId, setImageEditId] = useState<string | null>(null);
  const [imageUrlDraft, setImageUrlDraft] = useState('');

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      setPublishingId(id);
      const { error } = await supabase.from('parts').update({ published: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pending-parts'] }); queryClient.invalidateQueries({ queryKey: ['all_parts'] }); toast.success('Pièce publiée !'); setPublishingId(null); },
    onError: () => { toast.error('Erreur lors de la publication'); setPublishingId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      setDeletingId(id);
      const { error } = await supabase.from('parts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pending-parts'] }); toast.success('Pièce supprimée'); setDeletingId(null); },
    onError: () => { toast.error('Erreur lors de la suppression'); setDeletingId(null); },
  });

  const publishAllMutation = useMutation({
    mutationFn: async () => {
      const ids = pending.map((p: any) => p.id);
      const { error } = await supabase.from('parts').update({ published: true }).in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pending-parts'] }); queryClient.invalidateQueries({ queryKey: ['all_parts'] }); toast.success(`${pending.length} pièce(s) publiée(s) !`); },
    onError: () => toast.error('Erreur lors de la publication groupée'),
  });

  const imageUpdateMutation = useMutation({
    mutationFn: async ({ id, url }: { id: string; url: string }) => {
      const { error } = await supabase.from('parts').update({ image_url: url || null }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pending-parts'] }); toast.success('Image mise à jour'); setImageEditId(null); },
    onError: () => toast.error("Erreur lors de la mise à jour de l'image"),
  });

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  if (pending.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Bot className="w-12 h-12 text-[hsl(0_0%_30%)] mb-4" />
      <p className="text-[hsl(0_0%_55%)] text-sm">Aucune pièce en attente de validation</p>
      <p className="text-[hsl(0_0%_40%)] text-xs mt-1">Les imports bot apparaîtront ici</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[hsl(0_0%_55%)] text-sm">
          {pending.length} pièce{pending.length > 1 ? 's' : ''} en attente
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5">
              <CheckCheck className="w-3.5 h-3.5" />
              Tout publier ({pending.length})
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-[hsl(0_0%_12%)] border-[hsl(0_0%_18%)]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[hsl(0_0%_90%)]">Publier toutes les pièces ?</AlertDialogTitle>
              <AlertDialogDescription>{pending.length} pièce(s) seront publiées sur le site.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-[hsl(0_0%_15%)] border-[hsl(0_0%_20%)] text-[hsl(0_0%_70%)]">Annuler</AlertDialogCancel>
              <AlertDialogAction className="bg-emerald-600 text-white" onClick={() => publishAllMutation.mutate()}>
                {publishAllMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Tout publier'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Cards grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {pending.map((part: any) => {
          const sources = getSources(part.technical_metadata);
          const isEditingImage = imageEditId === part.id;

          return (
            <Card key={part.id} className="bg-[hsl(0_0%_12%)] border-[hsl(0_0%_18%)] overflow-hidden">
              <CardContent className="p-0">
                {/* Image */}
                <div className="relative h-40 bg-[hsl(0_0%_8%)] flex items-center justify-center">
                  {part.image_url ? (
                    <img src={part.image_url} alt={part.name} className="h-full w-full object-contain p-4" />
                  ) : (
                    <div className="text-[hsl(0_0%_25%)] text-4xl">🔧</div>
                  )}
                  <Badge className="absolute top-2 left-2 bg-violet-600/90 text-white text-[10px] gap-1">
                    <Bot className="w-3 h-3" />Bot
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2 h-7 w-7 bg-black/50 hover:bg-black/70 text-white"
                    onClick={() => { setImageEditId(isEditingImage ? null : part.id); setImageUrlDraft(part.image_url || ''); }}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Inline image URL editor */}
                {isEditingImage && (
                  <div className="flex gap-1.5 px-3 py-2 bg-[hsl(0_0%_9%)]">
                    <Input
                      value={imageUrlDraft}
                      onChange={e => setImageUrlDraft(e.target.value)}
                      placeholder="https://..."
                      className="bg-[hsl(0_0%_6%)] border-[hsl(0_0%_20%)] text-[hsl(0_0%_90%)] h-7 text-xs flex-1"
                    />
                    <Button size="sm" className="h-7 px-2 bg-primary text-primary-foreground text-xs" onClick={() => imageUpdateMutation.mutate({ id: part.id, url: imageUrlDraft })}>
                      {imageUpdateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    </Button>
                  </div>
                )}

                {/* Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-[hsl(0_0%_45%)] text-xs">{part.category?.name || 'Sans catégorie'}</p>
                    <h3 className="text-[hsl(0_0%_90%)] font-semibold text-sm truncate">{part.name}</h3>
                  </div>

                  {/* Specs */}
                  <div className="flex flex-wrap gap-2 text-[10px]">
                    {part.price != null && (
                      <span className="flex items-center gap-1 text-[hsl(0_0%_55%)] bg-[hsl(0_0%_15%)] px-2 py-0.5 rounded-full">
                        <Euro className="w-3 h-3 text-emerald-400" />{Number(part.price).toFixed(2)}€ HT
                      </span>
                    )}
                    {part.stock_quantity != null && (
                      <span className="flex items-center gap-1 text-[hsl(0_0%_55%)] bg-[hsl(0_0%_15%)] px-2 py-0.5 rounded-full">
                        <Package className="w-3 h-3 text-blue-400" />{part.stock_quantity} en stock
                      </span>
                    )}
                    {part.difficulty_level != null && (
                      <span className="flex items-center gap-1 text-[hsl(0_0%_55%)] bg-[hsl(0_0%_15%)] px-2 py-0.5 rounded-full">
                        <Wrench className="w-3 h-3 text-amber-500" />Niveau {part.difficulty_level}
                      </span>
                    )}
                  </div>

                  {/* Description preview */}
                  {part.description && (
                    <p className="text-[hsl(0_0%_45%)] text-xs line-clamp-2">{part.description.replace(/<[^>]*>/g, '')}</p>
                  )}

                  {/* Sources */}
                  {sources.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {sources.map((s, i) => (
                        <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-full transition-colors">
                          <ExternalLink className="w-2.5 h-2.5" />
                          {s.label}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
                      onClick={() => publishMutation.mutate(part.id)} disabled={publishingId === part.id}>
                      {publishingId === part.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      Publier
                    </Button>

                    <Button size="sm" variant="outline" className="border-[hsl(0_0%_25%)] text-[hsl(0_0%_70%)] hover:bg-[hsl(0_0%_15%)] text-xs gap-1.5"
                      onClick={() => setEditingPart(part)}>
                      <Pencil className="w-3 h-3" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10 text-xs gap-1.5" disabled={deletingId === part.id}>
                          {deletingId === part.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-[hsl(0_0%_12%)] border-[hsl(0_0%_18%)]">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-[hsl(0_0%_90%)]">Supprimer cette pièce ?</AlertDialogTitle>
                          <AlertDialogDescription>"{part.name}" sera définitivement supprimée.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-[hsl(0_0%_15%)] border-[hsl(0_0%_20%)] text-[hsl(0_0%_70%)]">Annuler</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive text-white" onClick={() => deleteMutation.mutate(part.id)}>Supprimer</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  {/* Fournisseurs B2B (collapsible) */}
                  <Collapsible>
                    <CollapsibleTrigger className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[hsl(0_0%_9%)] border border-[hsl(0_0%_18%)] text-[hsl(0_0%_70%)] hover:bg-[hsl(0_0%_12%)] transition-colors text-xs group">
                      <span className="flex items-center gap-1.5">
                        <Package className="w-3 h-3 text-amber-400" />
                        Fournisseurs B2B
                      </span>
                      <ChevronDown className="w-3 h-3 transition-transform group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2">
                      <PartSuppliersManager partId={part.id} partPrice={part.price} />
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      {editingPart && (
        <EditPartDialog part={editingPart} open={!!editingPart} onOpenChange={v => { if (!v) setEditingPart(null); }} />
      )}
    </div>
  );
};

export default PendingPartsManager;
