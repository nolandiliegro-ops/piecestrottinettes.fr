import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Check, Trash2, Bot, Zap, Gauge, Route, Calendar, Pencil, ExternalLink, ImageIcon, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { getPrimaryImage, getAllImages } from '@/lib/entityImage';

const usePendingScooters = () => {
  return useQuery({
    queryKey: ['pending-scooters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scooter_models')
        .select('*, brand:brands(id, name, slug)')
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

function getSources(sig: any): { url: string; label: string }[] {
  const raw = sig?.sources;
  if (!Array.isArray(raw)) return [];
  return raw.map((s: any) =>
    typeof s === 'string' ? { url: s, label: extractHostname(s) } : { url: s.url, label: s.label || extractHostname(s.url) }
  );
}

/* ─── Edit Dialog ─── */
type ScooterRow = any;

const EditScooterDialog = ({ scooter, open, onOpenChange }: { scooter: ScooterRow; open: boolean; onOpenChange: (v: boolean) => void }) => {
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string, any>>({});
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const allImportedImages = getAllImages(scooter?.images, null);

  useEffect(() => {
    if (scooter) {
      setForm({
        image_url: scooter.image_url || '',
        name: scooter.name || '',
        year: scooter.year ?? '',
        power_watts: scooter.power_watts ?? '',
        voltage: scooter.voltage ?? '',
        max_speed_kmh: scooter.max_speed_kmh ?? '',
        range_km: scooter.range_km ?? '',
        tire_size: scooter.tire_size || '',
        description: scooter.description || '',
        meta_title: scooter.meta_title || '',
        meta_description: scooter.meta_description || '',
        search_terms: scooter.search_terms || '',
        youtube_video_id: scooter.youtube_video_id || '',
        affiliate_link: scooter.affiliate_link || '',
      });
    }
  }, [scooter]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, any> = { ...form };
      ['year', 'power_watts', 'voltage', 'max_speed_kmh', 'range_km'].forEach(k => {
        payload[k] = payload[k] === '' ? null : Number(payload[k]);
      });
      ['image_url', 'tire_size', 'description', 'meta_title', 'meta_description', 'search_terms', 'youtube_video_id', 'affiliate_link'].forEach(k => {
        if (payload[k] === '') payload[k] = null;
      });
      const { error } = await supabase.from('scooter_models').update(payload).eq('id', scooter.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-scooters'] });
      toast.success('Modifications enregistrées');
      onOpenChange(false);
    },
    onError: () => toast.error('Erreur lors de la sauvegarde'),
  });

  const field = (label: string, key: string, type = 'text') => (
    <div className="space-y-1">
      <label className="text-xs text-[hsl(0_0%_55%)]">{label}</label>
      <Input type={type} value={form[key] ?? ''} onChange={set(key)} className="bg-[hsl(0_0%_8%)] border-[hsl(0_0%_20%)] text-[hsl(0_0%_90%)] h-8 text-xs" />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[hsl(0_0%_10%)] border-[hsl(0_0%_18%)] max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[hsl(0_0%_90%)]">Éditer — {scooter?.name}</DialogTitle>
          <DialogDescription className="text-[hsl(0_0%_50%)]">Modifiez les infos avant publication</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Photos importées (multi-photo system) */}
          <div className="space-y-1">
            <label className="text-xs text-[hsl(0_0%_55%)]">
              Photos importées{allImportedImages.length > 0 ? ` (${allImportedImages.length})` : ''}
            </label>
            {allImportedImages.length === 0 ? (
              <div className="h-20 bg-[hsl(0_0%_8%)] rounded flex items-center justify-center text-xs text-[hsl(0_0%_40%)]">
                Aucune photo importée
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {allImportedImages.map((img, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setLightboxUrl(img.url)}
                    className="relative h-20 bg-[hsl(0_0%_8%)] rounded overflow-hidden hover:ring-2 hover:ring-primary transition"
                  >
                    <img src={img.url} alt={img.alt || `photo ${i + 1}`} className="w-full h-full object-contain p-1" />
                    {img.is_primary && (
                      <Badge className="absolute top-1 left-1 bg-emerald-600 text-white text-[8px] px-1 py-0">
                        Principal
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Image URL legacy */}
          <div className="space-y-1">
            <label className="text-xs text-[hsl(0_0%_55%)]">Image URL legacy (optionnel)</label>
            <Input value={form.image_url ?? ''} onChange={set('image_url')} className="bg-[hsl(0_0%_8%)] border-[hsl(0_0%_20%)] text-[hsl(0_0%_90%)] h-8 text-xs" />
            <p className="text-[10px] text-[hsl(0_0%_40%)]">Champ historique. Le système multi-photos ci-dessus est prioritaire.</p>
            {form.image_url && (
              <div className="h-32 bg-[hsl(0_0%_6%)] rounded flex items-center justify-center mt-1">
                <img src={form.image_url} alt="preview" className="h-full object-contain p-2" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {field('Nom', 'name')}
            {field('Année', 'year', 'number')}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {field('Puissance (W)', 'power_watts', 'number')}
            {field('Voltage (V)', 'voltage', 'number')}
            {field('Vitesse max (km/h)', 'max_speed_kmh', 'number')}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {field('Autonomie (km)', 'range_km', 'number')}
            {field('Taille pneus', 'tire_size')}
            {field('YouTube Video ID', 'youtube_video_id')}
          </div>

          <div className="space-y-1">
            <label className="text-xs text-[hsl(0_0%_55%)]">Description</label>
            <Textarea value={form.description ?? ''} onChange={set('description')} rows={3} className="bg-[hsl(0_0%_8%)] border-[hsl(0_0%_20%)] text-[hsl(0_0%_90%)] text-xs" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {field('Meta Title', 'meta_title')}
            {field('Meta Description', 'meta_description')}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {field('Search Terms', 'search_terms')}
            {field('Lien affilié', 'affiliate_link')}
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

      {/* Lightbox */}
      <Dialog open={!!lightboxUrl} onOpenChange={(v) => !v && setLightboxUrl(null)}>
        <DialogContent className="bg-[hsl(0_0%_6%)] border-[hsl(0_0%_18%)] max-w-4xl p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Aperçu photo</DialogTitle>
          </DialogHeader>
          {lightboxUrl && (
            <img src={lightboxUrl} alt="aperçu" className="w-full h-auto max-h-[80vh] object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

/* ─── Main component ─── */
const PendingScootersManager = () => {
  const queryClient = useQueryClient();
  const { data: pending = [], isLoading } = usePendingScooters();
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingScooter, setEditingScooter] = useState<ScooterRow | null>(null);
  const [imageEditId, setImageEditId] = useState<string | null>(null);
  const [imageUrlDraft, setImageUrlDraft] = useState('');

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      setPublishingId(id);
      const { error } = await supabase.from('scooter_models').update({ published: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pending-scooters'] }); queryClient.invalidateQueries({ queryKey: ['scooter_models'] }); toast.success('Trottinette publiée !'); setPublishingId(null); },
    onError: () => { toast.error('Erreur lors de la publication'); setPublishingId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      setDeletingId(id);
      const { error } = await supabase.from('scooter_models').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pending-scooters'] }); toast.success('Trottinette supprimée'); setDeletingId(null); },
    onError: () => { toast.error('Erreur lors de la suppression'); setDeletingId(null); },
  });

  const publishAllMutation = useMutation({
    mutationFn: async () => {
      const ids = pending.map((s: any) => s.id);
      const { error } = await supabase.from('scooter_models').update({ published: true }).in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pending-scooters'] }); queryClient.invalidateQueries({ queryKey: ['scooter_models'] }); toast.success(`${pending.length} trottinette(s) publiée(s) !`); },
    onError: () => toast.error('Erreur lors de la publication groupée'),
  });

  const imageUpdateMutation = useMutation({
    mutationFn: async ({ id, url }: { id: string; url: string }) => {
      const { error } = await supabase.from('scooter_models').update({ image_url: url || null }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pending-scooters'] }); toast.success('Image mise à jour'); setImageEditId(null); },
    onError: () => toast.error("Erreur lors de la mise à jour de l'image"),
  });

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  if (pending.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Bot className="w-12 h-12 text-[hsl(0_0%_30%)] mb-4" />
      <p className="text-[hsl(0_0%_55%)] text-sm">Aucune trottinette en attente de validation</p>
      <p className="text-[hsl(0_0%_40%)] text-xs mt-1">Les imports bot apparaîtront ici</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header with count + publish all */}
      <div className="flex items-center justify-between">
        <p className="text-[hsl(0_0%_55%)] text-sm">
          {pending.length} trottinette{pending.length > 1 ? 's' : ''} en attente
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
              <AlertDialogTitle className="text-[hsl(0_0%_90%)]">Publier toutes les trottinettes ?</AlertDialogTitle>
              <AlertDialogDescription>{pending.length} trottinette(s) seront publiées sur le site.</AlertDialogDescription>
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
        {pending.map((scooter: any) => {
          const sources = getSources(scooter.technical_signature);
          const isEditingImage = imageEditId === scooter.id;
          const cardImages = getAllImages(scooter.images, scooter.image_url);
          const cardPrimary = getPrimaryImage(scooter.images, scooter.image_url, '');

          return (
            <Card key={scooter.id} className="bg-[hsl(0_0%_12%)] border-[hsl(0_0%_18%)] overflow-hidden">
              <CardContent className="p-0">
                {/* Image */}
                <div className="relative h-40 bg-[hsl(0_0%_8%)] flex items-center justify-center">
                  {cardPrimary ? (
                    <img src={cardPrimary} alt={scooter.name} className="h-full w-full object-contain p-4" />
                  ) : (
                    <div className="text-[hsl(0_0%_25%)] text-4xl">🛴</div>
                  )}
                  {cardImages.length > 1 && (
                    <Badge className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] gap-1 backdrop-blur">
                      <ImageIcon className="w-2.5 h-2.5" />
                      +{cardImages.length - 1} photo{cardImages.length > 2 ? 's' : ''}
                    </Badge>
                  )}
                  <Badge className="absolute top-2 left-2 bg-violet-600/90 text-white text-[10px] gap-1">
                    <Bot className="w-3 h-3" />Bot
                  </Badge>
                  {/* Quick image edit toggle */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2 h-7 w-7 bg-black/50 hover:bg-black/70 text-white"
                    onClick={() => { setImageEditId(isEditingImage ? null : scooter.id); setImageUrlDraft(scooter.image_url || ''); }}
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
                    <Button size="sm" className="h-7 px-2 bg-primary text-primary-foreground text-xs" onClick={() => imageUpdateMutation.mutate({ id: scooter.id, url: imageUrlDraft })}>
                      {imageUpdateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    </Button>
                  </div>
                )}

                {/* Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-[hsl(0_0%_45%)] text-xs">{scooter.brand?.name || '—'}</p>
                    <h3 className="text-[hsl(0_0%_90%)] font-semibold text-sm truncate">{scooter.name}</h3>
                  </div>

                  {/* Specs */}
                  <div className="flex flex-wrap gap-2 text-[10px]">
                    {scooter.power_watts && <span className="flex items-center gap-1 text-[hsl(0_0%_55%)] bg-[hsl(0_0%_15%)] px-2 py-0.5 rounded-full"><Zap className="w-3 h-3 text-amber-500" />{scooter.power_watts}W</span>}
                    {scooter.max_speed_kmh && <span className="flex items-center gap-1 text-[hsl(0_0%_55%)] bg-[hsl(0_0%_15%)] px-2 py-0.5 rounded-full"><Gauge className="w-3 h-3 text-blue-400" />{scooter.max_speed_kmh}km/h</span>}
                    {scooter.range_km && <span className="flex items-center gap-1 text-[hsl(0_0%_55%)] bg-[hsl(0_0%_15%)] px-2 py-0.5 rounded-full"><Route className="w-3 h-3 text-green-400" />{scooter.range_km}km</span>}
                    {scooter.year && <span className="flex items-center gap-1 text-[hsl(0_0%_55%)] bg-[hsl(0_0%_15%)] px-2 py-0.5 rounded-full"><Calendar className="w-3 h-3 text-muted-foreground" />{scooter.year}</span>}
                  </div>

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
                      onClick={() => publishMutation.mutate(scooter.id)} disabled={publishingId === scooter.id}>
                      {publishingId === scooter.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      Publier
                    </Button>

                    <Button size="sm" variant="outline" className="border-[hsl(0_0%_25%)] text-[hsl(0_0%_70%)] hover:bg-[hsl(0_0%_15%)] text-xs gap-1.5"
                      onClick={() => setEditingScooter(scooter)}>
                      <Pencil className="w-3 h-3" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10 text-xs gap-1.5" disabled={deletingId === scooter.id}>
                          {deletingId === scooter.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-[hsl(0_0%_12%)] border-[hsl(0_0%_18%)]">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-[hsl(0_0%_90%)]">Supprimer cette trottinette ?</AlertDialogTitle>
                          <AlertDialogDescription>"{scooter.name}" sera définitivement supprimée.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-[hsl(0_0%_15%)] border-[hsl(0_0%_20%)] text-[hsl(0_0%_70%)]">Annuler</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => deleteMutation.mutate(scooter.id)}>Supprimer</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit dialog */}
      {editingScooter && (
        <EditScooterDialog scooter={editingScooter} open={!!editingScooter} onOpenChange={v => { if (!v) setEditingScooter(null); }} />
      )}
    </div>
  );
};

export { usePendingScooters };
export default PendingScootersManager;
