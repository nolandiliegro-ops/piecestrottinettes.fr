import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Link2, Unlink, Check, ChevronDown, ChevronRight, Sparkles, X, CheckCheck, Zap, RefreshCw, CircleDot, Circle, ListFilter } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Scooter {
  id: string;
  name: string;
  slug: string;
  brand: { name: string } | null;
}

interface Part {
  id: string;
  name: string;
  category: { name: string } | null;
}

type Confidence = 'high' | 'medium' | 'low' | 'validated';

interface CompatMeta {
  auto: boolean;
  confidence: Confidence;
  reason: string | null;
}

const CompatibilityManager = () => {
  const queryClient = useQueryClient();
  const [scooters, setScooters] = useState<Scooter[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  // Map "partId_scooterId" → meta
  const [metaByKey, setMetaByKey] = useState<Map<string, CompatMeta>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [retriggering, setRetriggering] = useState<string | null>(null);
  const [selectedScooter, setSelectedScooter] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const invalidateCompatQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['compatible-parts'] });
    queryClient.invalidateQueries({ queryKey: ['compatible-parts-rich'] });
    queryClient.invalidateQueries({ queryKey: ['compatible-parts-count'] });
    queryClient.invalidateQueries({ queryKey: ['compatible-scooters'] });
    queryClient.invalidateQueries({ queryKey: ['related-parts'] });
  };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [scootersRes, partsRes, compatRes] = await Promise.all([
        supabase.from('scooter_models').select('id, name, slug, brand:brands(name)').order('name'),
        supabase.from('parts').select('id, name, category:categories(name)').order('name'),
        supabase.from('part_compatibility').select('part_id, scooter_model_id, auto_suggested, confidence_level, suggestion_reason'),
      ]);
      if (scootersRes.error) throw scootersRes.error;
      if (partsRes.error) throw partsRes.error;
      if (compatRes.error) throw compatRes.error;
      setScooters(scootersRes.data || []);
      setParts(partsRes.data || []);
      const map = new Map<string, CompatMeta>();
      (compatRes.data || []).forEach((c: { part_id: string; scooter_model_id: string; auto_suggested: boolean; confidence_level: string; suggestion_reason: string | null }) => {
        const key = `${c.part_id}_${c.scooter_model_id}`;
        const conf = (['high', 'medium', 'low', 'validated'].includes(c.confidence_level) ? c.confidence_level : 'medium') as Confidence;
        map.set(key, { auto: !!c.auto_suggested, confidence: conf, reason: c.suggestion_reason });
      });
      setMetaByKey(map);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  /** Toggle 3-states */
  const toggleCompatibility = async (partId: string, scooterId: string) => {
    const key = `${partId}_${scooterId}`;
    const meta = metaByKey.get(key);
    setSaving(true);
    try {
      if (!meta) {
        const { error } = await supabase
          .from('part_compatibility')
          .insert({ part_id: partId, scooter_model_id: scooterId, auto_suggested: false, confidence_level: 'validated' });
        if (error) throw error;
        const next = new Map(metaByKey);
        next.set(key, { auto: false, confidence: 'validated', reason: null });
        setMetaByKey(next);
        invalidateCompatQueries();
        toast.success('Compatibilité ajoutée');
      } else if (meta.auto) {
        const { error } = await supabase
          .from('part_compatibility')
          .update({ auto_suggested: false, confidence_level: 'validated' })
          .eq('part_id', partId).eq('scooter_model_id', scooterId);
        if (error) throw error;
        const next = new Map(metaByKey);
        next.set(key, { auto: false, confidence: 'validated', reason: meta.reason });
        setMetaByKey(next);
        invalidateCompatQueries();
        toast.success('Suggestion validée');
      } else {
        const { error } = await supabase
          .from('part_compatibility').delete()
          .eq('part_id', partId).eq('scooter_model_id', scooterId);
        if (error) throw error;
        const next = new Map(metaByKey);
        next.delete(key);
        setMetaByKey(next);
        invalidateCompatQueries();
        toast.success('Compatibilité supprimée');
      }
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la modification');
    } finally {
      setSaving(false);
    }
  };

  const rejectSuggestion = async (partId: string, scooterId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('part_compatibility').delete()
        .eq('part_id', partId).eq('scooter_model_id', scooterId).eq('auto_suggested', true);
      if (error) throw error;
      const next = new Map(metaByKey);
      next.delete(`${partId}_${scooterId}`);
      setMetaByKey(next);
      invalidateCompatQueries();
      toast.success('Suggestion rejetée');
    } catch (error) {
      console.error(error); toast.error('Erreur');
    } finally { setSaving(false); }
  };

  const validateBatch = async (level: Confidence | 'all') => {
    if (!selectedScooter) return;
    setBulkSaving(true);
    try {
      let q = supabase.from('part_compatibility')
        .update({ auto_suggested: false, confidence_level: 'validated' })
        .eq('scooter_model_id', selectedScooter).eq('auto_suggested', true);
      if (level !== 'all') q = q.eq('confidence_level', level);
      const { error } = await q;
      if (error) throw error;
      await fetchData();
      invalidateCompatQueries();
      toast.success(`Validées (${level})`);
    } catch (e) { console.error(e); toast.error('Erreur validation batch'); }
    finally { setBulkSaving(false); }
  };

  const rejectAllSuggestions = async () => {
    if (!selectedScooter) return;
    setBulkSaving(true);
    try {
      const { error } = await supabase.from('part_compatibility').delete()
        .eq('scooter_model_id', selectedScooter).eq('auto_suggested', true);
      if (error) throw error;
      await fetchData();
      invalidateCompatQueries();
      toast.success('Toutes les suggestions rejetées');
    } catch (e) { console.error(e); toast.error('Erreur rejet'); }
    finally { setBulkSaving(false); }
  };

  const retriggerForPart = async (partId: string) => {
    setRetriggering(partId);
    try {
      const { data, error } = await supabase.functions.invoke('retrigger-compatibility-matching', {
        body: { part_ids: [partId] },
      });
      if (error) throw error;
      const r = data?.results?.[0];
      if (r) {
        toast.success(`+${r.passe_A_added} specs · +${r.passe_B_added} IA · ${r.validated_kept} validées préservées`);
      } else {
        toast.success('Re-trigger terminé');
      }
      await fetchData();
      invalidateCompatQueries();
    } catch (e) {
      console.error(e); toast.error('Erreur re-trigger IA');
    } finally { setRetriggering(null); }
  };

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) newSet.delete(categoryName); else newSet.add(categoryName);
      return newSet;
    });
  };

  const getPartsByCategory = () => {
    const grouped: Record<string, Part[]> = {};
    parts.forEach((p) => {
      const cat = p.category?.name || 'Autre';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(p);
    });
    return grouped;
  };

  const getCompatibleCount = (scooterId: string) => {
    let n = 0;
    metaByKey.forEach((_, k) => { if (k.endsWith(`_${scooterId}`)) n++; });
    return n;
  };

  const getCountByLevel = (scooterId: string, level: Confidence | 'auto') => {
    let n = 0;
    metaByKey.forEach((m, k) => {
      if (!k.endsWith(`_${scooterId}`)) return;
      if (level === 'auto' && m.auto) n++;
      else if (level !== 'auto' && m.auto && m.confidence === level) n++;
    });
    return n;
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const partsByCategory = getPartsByCategory();
  const sugCount = selectedScooter ? getCountByLevel(selectedScooter, 'auto') : 0;
  const highCount = selectedScooter ? getCountByLevel(selectedScooter, 'high') : 0;
  const medCount = selectedScooter ? getCountByLevel(selectedScooter, 'medium') : 0;

  const renderBadge = (meta: CompatMeta) => {
    const cfg: Record<Confidence, { label: string; className: string; icon: JSX.Element }> = {
      validated: { label: 'Validé', className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30', icon: <Check className="w-2.5 h-2.5" /> },
      high:      { label: 'Confiance haute',   className: 'bg-green-500/15 text-green-600 border-green-500/30',   icon: <Zap className="w-2.5 h-2.5" /> },
      medium:    { label: 'Confiance moyenne', className: 'bg-amber-500/15 text-amber-600 border-amber-500/30',   icon: <CircleDot className="w-2.5 h-2.5" /> },
      low:       { label: 'Confiance basse',   className: 'bg-orange-500/15 text-orange-600 border-orange-500/30', icon: <Circle className="w-2.5 h-2.5" /> },
    };
    const c = cfg[meta.confidence];
    const badge = (
      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border whitespace-nowrap', c.className)}>
        {c.icon}{c.label}
      </span>
    );
    if (!meta.reason) return badge;
    return (
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">{meta.reason}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar scooters */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-primary" />Sélectionner une trottinette
            </h3>
            <ScrollArea className="h-[500px]">
              <div className="space-y-1">
                {scooters.map((scooter) => {
                  const sc = getCountByLevel(scooter.id, 'auto');
                  return (
                    <button key={scooter.id} onClick={() => setSelectedScooter(scooter.id)}
                      className={cn('w-full text-left px-3 py-2 rounded-md transition-colors flex items-center justify-between',
                        selectedScooter === scooter.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted')}>
                      <div>
                        <p className="font-medium text-sm">{scooter.name}</p>
                        <p className={cn('text-xs', selectedScooter === scooter.id ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                          {scooter.brand?.name}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
                          selectedScooter === scooter.id ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/10 text-primary')}>
                          {getCompatibleCount(scooter.id)}
                        </span>
                        {sc > 0 && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-600 inline-flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" />{sc}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Compat grid */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                {selectedScooter ? <><Check className="w-4 h-4 text-primary" />Pièces compatibles</> :
                  <><Unlink className="w-4 h-4 text-muted-foreground" />Sélectionnez une trottinette</>}
              </h3>
              {selectedScooter && sugCount > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 text-xs gap-1.5"
                    onClick={() => validateBatch('all')} disabled={bulkSaving}>
                    {bulkSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
                    Valider toutes ({sugCount})
                  </Button>
                  {highCount > 0 && (
                    <Button size="sm" variant="outline" className="border-green-500/40 text-green-600 hover:bg-green-500/10 text-xs gap-1.5"
                      onClick={() => validateBatch('high')} disabled={bulkSaving}>
                      <Zap className="w-3 h-3" />Hautes ({highCount})
                    </Button>
                  )}
                  {medCount > 0 && (
                    <Button size="sm" variant="outline" className="border-amber-500/40 text-amber-600 hover:bg-amber-500/10 text-xs gap-1.5"
                      onClick={() => validateBatch('medium')} disabled={bulkSaving}>
                      <CircleDot className="w-3 h-3" />Moyennes ({medCount})
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10 text-xs gap-1.5"
                    onClick={rejectAllSuggestions} disabled={bulkSaving}>
                    <X className="w-3 h-3" />Rejeter ({sugCount})
                  </Button>
                </div>
              )}
            </div>

            {selectedScooter ? (
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {Object.entries(partsByCategory).map(([category, categoryParts]) => (
                    <div key={category} className="border border-border rounded-lg overflow-hidden">
                      <button onClick={() => toggleCategory(category)}
                        className="w-full px-4 py-3 bg-muted/50 flex items-center justify-between hover:bg-muted transition-colors">
                        <span className="font-medium text-sm text-foreground">{category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {categoryParts.filter((p) => metaByKey.has(`${p.id}_${selectedScooter}`)).length}/{categoryParts.length}
                          </span>
                          {expandedCategories.has(category) ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </button>
                      {expandedCategories.has(category) && (
                        <div className="p-3 space-y-2">
                          {categoryParts.map((part) => {
                            const key = `${part.id}_${selectedScooter}`;
                            const meta = metaByKey.get(key);
                            const isCompatible = !!meta;
                            const isAuto = !!meta?.auto;
                            return (
                              <div key={part.id}
                                className={cn('flex items-center gap-3 p-2 rounded-md transition-colors flex-wrap',
                                  isAuto ? 'bg-orange-500/10 border border-orange-500/30' :
                                  isCompatible ? 'bg-primary/10' : 'hover:bg-muted')}>
                                <div className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                                  onClick={() => !saving && toggleCompatibility(part.id, selectedScooter)}>
                                  <Checkbox checked={isCompatible} disabled={saving}
                                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                                  <span className={cn('text-sm truncate', isCompatible ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                                    {part.name}
                                  </span>
                                </div>
                                {meta && renderBadge(meta)}
                                <button
                                  onClick={(e) => { e.stopPropagation(); retriggerForPart(part.id); }}
                                  disabled={retriggering === part.id || saving}
                                  className="p-1 rounded hover:bg-primary/15 text-primary transition-colors disabled:opacity-50"
                                  title="Re-trigger matching IA"
                                >
                                  {retriggering === part.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                </button>
                                {isAuto && (
                                  <button onClick={(e) => { e.stopPropagation(); if (!saving) rejectSuggestion(part.id, selectedScooter); }}
                                    disabled={saving} className="p-1 rounded hover:bg-destructive/15 text-destructive transition-colors"
                                    title="Rejeter cette suggestion">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                <p className="text-center">
                  <Link2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Cliquez sur une trottinette pour gérer ses compatibilités
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default CompatibilityManager;
