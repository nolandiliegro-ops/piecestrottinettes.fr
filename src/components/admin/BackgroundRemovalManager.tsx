import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, CheckCircle2, XCircle, Scissors, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const MAX_BATCH = 10;
const DELAY_MS = 800;

type PartRow = {
  id: string;
  name: string;
  image_url: string | null;
  images: any;
  category_id: string | null;
};

type RowStatus = {
  state: 'idle' | 'queued' | 'running' | 'success' | 'failed';
  error?: string;
  beforeUrl?: string;
  afterUrl?: string;
};

const isDetoured = (images: any) => Array.isArray(images) && images.length > 0;

const getSourceCandidates = (p: PartRow): string[] => {
  const fromImages = Array.isArray(p.images)
    ? p.images.map((i: any) => i?.url).filter(Boolean)
    : [];
  if (fromImages.length > 0) return fromImages;
  return p.image_url ? [p.image_url] : [];
};

export default function BackgroundRemovalManager() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<'all' | 'raw' | 'detoured'>('all');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [sourceChoice, setSourceChoice] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, RowStatus>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [lightbox, setLightbox] = useState<{ url: string; label: string } | null>(null);

  const { data: parts = [], isLoading } = useQuery({
    queryKey: ['admin-parts-detourage'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parts')
        .select('id, name, image_url, images, category_id')
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as PartRow[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories-detourage'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    return parts.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (catFilter !== 'all' && p.category_id !== catFilter) return false;
      const detoured = isDetoured(p.images);
      if (stateFilter === 'raw' && detoured) return false;
      if (stateFilter === 'detoured' && !detoured) return false;
      return true;
    });
  }, [parts, search, catFilter, stateFilter]);

  const selectedIds = useMemo(
    () => filtered.filter((p) => selected[p.id]).map((p) => p.id),
    [filtered, selected],
  );
  const selectedParts = useMemo(
    () => parts.filter((p) => selected[p.id]),
    [parts, selected],
  );
  const alreadyDetouredSelected = selectedParts.filter((p) => isDetoured(p.images));
  const overLimit = selectedIds.length > MAX_BATCH;

  const toggleAll = (checked: boolean) => {
    const next = { ...selected };
    filtered.forEach((p) => { next[p.id] = checked; });
    setSelected(next);
  };

  const runBatch = async () => {
    setConfirmOpen(false);
    setRunning(true);
    setProgress({ done: 0, total: selectedParts.length });

    const initial: Record<string, RowStatus> = { ...statuses };
    selectedParts.forEach((p) => { initial[p.id] = { state: 'queued' }; });
    setStatuses(initial);

    let done = 0;
    let successCount = 0;
    let failCount = 0;

    for (const p of selectedParts) {
      const candidates = getSourceCandidates(p);
      const src = sourceChoice[p.id] || candidates[0];

      if (!src) {
        setStatuses((s) => ({ ...s, [p.id]: { state: 'failed', error: 'Aucune image source' } }));
        failCount++; done++; setProgress({ done, total: selectedParts.length });
        continue;
      }

      setStatuses((s) => ({ ...s, [p.id]: { state: 'running', beforeUrl: src } }));

      let attempt = 0;
      let ok = false;
      let lastErr = '';
      let afterUrl: string | undefined;

      while (attempt < 2 && !ok) {
        attempt++;
        try {
          const { data, error } = await supabase.functions.invoke('admin-process-images', {
            body: {
              entity_type: 'part',
              entity_id: p.id,
              source_urls: [src],
              alt_base: p.name,
            },
          });
          if (error) throw new Error(error.message || 'Edge function error');
          if (!data?.success) throw new Error(data?.error || 'Échec détourage');
          afterUrl = data?.images?.[0]?.url;
          ok = true;
        } catch (e: any) {
          lastErr = e?.message || 'Erreur inconnue';
          if (attempt < 2) await new Promise((r) => setTimeout(r, 1000));
        }
      }

      setStatuses((s) => ({
        ...s,
        [p.id]: ok
          ? { state: 'success', beforeUrl: src, afterUrl }
          : { state: 'failed', error: lastErr, beforeUrl: src },
      }));

      if (ok) successCount++; else failCount++;
      done++; setProgress({ done, total: selectedParts.length });
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }

    setRunning(false);
    qc.invalidateQueries({ queryKey: ['admin-parts-detourage'] });

    toast({
      title: 'Détourage terminé',
      description: `${successCount} réussi${successCount > 1 ? 's' : ''} · ${failCount} échoué${failCount > 1 ? 's' : ''}`,
    });
  };

  const retryFailed = () => {
    const failedIds = Object.entries(statuses)
      .filter(([, v]) => v.state === 'failed')
      .map(([id]) => id);
    const next: Record<string, boolean> = {};
    failedIds.forEach((id) => { next[id] = true; });
    setSelected(next);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-4 md:p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Scissors className="w-5 h-5 text-[#4A7C59]" />
          <h2 className="text-lg font-bold text-gray-900">Détourage produits</h2>
        </div>
        <p className="text-sm text-gray-500">
          Sélectionne jusqu'à {MAX_BATCH} produits et lance le détourage via Remove.bg.
          Traitement séquentiel, 1 crédit par image.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Input
            placeholder="Rechercher un produit…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-[44px]"
          />
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="min-h-[44px]"><SelectValue placeholder="Catégorie" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {categories.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stateFilter} onValueChange={(v: any) => setStateFilter(v)}>
            <SelectTrigger className="min-h-[44px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les états</SelectItem>
              <SelectItem value="raw">Brut uniquement</SelectItem>
              <SelectItem value="detoured">Détouré uniquement</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
          <label className="flex items-center gap-2 min-h-[44px] cursor-pointer">
            <Checkbox
              checked={filtered.length > 0 && filtered.every((p) => selected[p.id])}
              onCheckedChange={(c) => toggleAll(!!c)}
            />
            <span className="text-sm text-gray-600">
              Tout sélectionner ({filtered.length} filtré{filtered.length > 1 ? 's' : ''})
            </span>
          </label>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${overLimit ? 'text-red-600' : 'text-gray-700'}`}>
              {selectedIds.length} / max {MAX_BATCH}
            </span>
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={selectedIds.length === 0 || overLimit || running}
              className="bg-[#4A7C59] hover:bg-[#3A6449] text-white min-h-[44px]"
            >
              {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Scissors className="w-4 h-4 mr-2" />}
              Lancer le détourage
            </Button>
          </div>
        </div>

        {overLimit && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Max {MAX_BATCH} par lot — on teste avant de scaler.
          </div>
        )}

        {running && (
          <div className="space-y-1">
            <Progress value={(progress.done / Math.max(progress.total, 1)) * 100} />
            <p className="text-xs text-gray-500">{progress.done} / {progress.total}</p>
          </div>
        )}

        {!running && Object.values(statuses).some((s) => s.state === 'failed') && (
          <Button variant="outline" size="sm" onClick={retryFailed} className="min-h-[44px]">
            Re-sélectionner les échoués
          </Button>
        )}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#4A7C59]" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">Aucun produit</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map((p) => {
              const detoured = isDetoured(p.images);
              const status = statuses[p.id];
              const candidates = getSourceCandidates(p);
              const chosenSrc = sourceChoice[p.id] || candidates[0];
              const isChecked = !!selected[p.id];

              return (
                <li key={p.id} className="p-3 md:p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(c) => setSelected((s) => ({ ...s, [p.id]: !!c }))}
                      className="mt-2"
                    />
                    <div className="w-14 h-14 rounded-lg bg-[#F5F0E8] overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                        <Badge
                          variant="outline"
                          className={detoured
                            ? 'bg-[#4A7C59]/10 text-[#4A7C59] border-[#4A7C59]/30'
                            : 'bg-gray-100 text-gray-600 border-gray-200'}
                        >
                          {detoured ? 'Détouré' : 'Brut'}
                        </Badge>
                        {isChecked && detoured && (
                          <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                            ⚠ Re-détourage = 1 crédit
                          </span>
                        )}
                      </div>

                      {candidates.length > 1 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {candidates.map((url) => (
                            <label
                              key={url}
                              className={`relative w-12 h-12 rounded-md overflow-hidden border-2 cursor-pointer ${chosenSrc === url ? 'border-[#4A7C59]' : 'border-transparent'}`}
                            >
                              <input
                                type="radio"
                                name={`src-${p.id}`}
                                checked={chosenSrc === url}
                                onChange={() => setSourceChoice((s) => ({ ...s, [p.id]: url }))}
                                className="sr-only"
                              />
                              <img src={url} alt="" className="w-full h-full object-cover" />
                            </label>
                          ))}
                        </div>
                      )}

                      {status && status.state !== 'idle' && (
                        <div className="mt-2 flex items-center gap-3 flex-wrap">
                          {status.state === 'queued' && (
                            <span className="text-xs text-gray-500">En attente…</span>
                          )}
                          {status.state === 'running' && (
                            <span className="text-xs text-[#4A7C59] flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" /> Détourage en cours…
                            </span>
                          )}
                          {status.state === 'success' && (
                            <>
                              <span className="text-xs text-[#4A7C59] flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Réussi
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="text-center">
                                  <div
                                    className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 cursor-pointer hover:ring-2 hover:ring-[#4A7C59] transition-all"
                                    onClick={() => status.beforeUrl && setLightbox({ url: status.beforeUrl, label: 'AVANT' })}
                                  >
                                    {status.beforeUrl && (
                                      <img src={status.beforeUrl} alt="avant" className="w-full h-full object-cover" />
                                    )}
                                  </div>
                                  <p className="text-[10px] text-gray-500 mt-0.5">AVANT</p>
                                </div>
                                <span className="text-gray-400">→</span>
                                <div className="text-center">
                                  <div
                                    className="w-16 h-16 rounded-md overflow-hidden bg-[#F5F0E8] cursor-pointer hover:ring-2 hover:ring-[#4A7C59] transition-all"
                                    onClick={() => status.afterUrl && setLightbox({ url: status.afterUrl, label: 'APRÈS' })}
                                  >
                                    {status.afterUrl && (
                                      <img src={status.afterUrl} alt="après" className="w-full h-full object-contain" />
                                    )}
                                  </div>
                                  <p className="text-[10px] text-[#4A7C59] mt-0.5 font-medium">APRÈS</p>
                                </div>
                              </div>
                            </>
                          )}
                          {status.state === 'failed' && (
                            <span className="text-xs text-red-600 flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> Échec : {status.error}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer le détourage</DialogTitle>
            <DialogDescription>
              Tu vas consommer <strong>{selectedIds.length} crédit{selectedIds.length > 1 ? 's' : ''}</strong> Remove.bg.
            </DialogDescription>
          </DialogHeader>
          {alreadyDetouredSelected.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {alreadyDetouredSelected.length} produit{alreadyDetouredSelected.length > 1 ? 's' : ''} déjà détouré{alreadyDetouredSelected.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-amber-700">Re-traiter consommera 1 crédit chacun :</p>
              <ul className="text-xs text-amber-700 list-disc list-inside max-h-24 overflow-auto">
                {alreadyDetouredSelected.map((p) => <li key={p.id}>{p.name}</li>)}
              </ul>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} className="min-h-[44px]">
              Annuler
            </Button>
            <Button onClick={runBatch} className="bg-[#4A7C59] hover:bg-[#3A6449] text-white min-h-[44px]">
              Confirmer et lancer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      <Dialog open={!!lightbox} onOpenChange={(open) => !open && setLightbox(null)}>
        <DialogContent className="max-w-3xl p-2 sm:p-4">
          <DialogHeader>
            <DialogTitle className="text-center text-sm text-gray-500 font-normal">
              {lightbox?.label}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center min-h-[200px] bg-[#F5F0E8] rounded-lg overflow-hidden">
            {lightbox?.url && (
              <img
                src={lightbox.url}
                alt={lightbox.label}
                className="max-w-full max-h-[70vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
