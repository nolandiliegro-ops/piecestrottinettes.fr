import { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Loader2, Link2, Unlink, Check, ChevronDown, ChevronRight, Sparkles, X, CheckCheck, Zap, RefreshCw, CircleDot, Circle, ListFilter, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getPrimaryImage, type ImageEntry } from '@/lib/entityImage';
import ScooterCompatibilitySelect from './ScooterCompatibilitySelect';

interface Scooter {
  id: string;
  name: string;
  slug: string;
  brand: { name: string } | null;
}

interface Part {
  id: string;
  name: string;
  sku: string | null;
  image_url: string | null;
  images: ImageEntry[] | null;
  published: boolean | null;
  category: { name: string } | null;
}

type Confidence = 'high' | 'medium' | 'low' | 'validated';
type FilterKey = 'all' | 'to_validate' | 'high' | 'medium' | 'low' | 'validated';

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
  // B1 — relance matching IA sur le 1er lot (≤35) des pièces publiées non câblées d'une catégorie
  const [catRetriggering, setCatRetriggering] = useState(false);
  const [catRetrigResult, setCatRetrigResult] = useState<{ processed: number; suggestions: number; errors: number } | null>(null);
  const [selectedScooter, setSelectedScooter] = useState<string | null>(null);
  // SB3 — axe de travail : 'scooter' = mode existant, 'part' = nouveau mode par pièce
  const [axis, setAxis] = useState<'scooter' | 'part'>('scooter');
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [localSelected, setLocalSelected] = useState<string[]>([]);
  // SB3 t2 — portée de la sidebar « par pièce » : non câblées (défaut) vs toutes
  const [partScope, setPartScope] = useState<'unwired' | 'all'>('unwired');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterKey>('all');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  // SB2 — vue pièces non câblées (repliable, collapsed par défaut) + filtre catégorie
  const [showUnmatched, setShowUnmatched] = useState(false);
  const [unmatchedCat, setUnmatchedCat] = useState<string>('all');

  const invalidateCompatQueries = () => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        const root = query.queryKey[0];
        if (typeof root !== 'string') return false;
        return ['compatible', 'compatibility', 'related-parts'].some((frag) =>
          root.includes(frag)
        );
      },
    });
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { setFilter('all'); }, [selectedScooter]);
  // SB3 — reset au changement d'axe pour éviter la contamination entre modes
  useEffect(() => { setSelectedScooter(null); setSelectedPart(null); }, [axis]);

  const fetchData = async () => {
    try {
      const [scootersRes, partsRes, compatRes] = await Promise.all([
        supabase.from('scooter_models').select('id, name, slug, brand:brands(name)').order('name'),
        supabase.from('parts').select('id, name, sku, image_url, images, published, category:categories(name)').order('name'),
        supabase.from('part_compatibility').select('part_id, scooter_model_id, auto_suggested, confidence_level, suggestion_reason'),
      ]);
      if (scootersRes.error) throw scootersRes.error;
      if (partsRes.error) throw partsRes.error;
      if (compatRes.error) throw compatRes.error;
      setScooters(scootersRes.data || []);
      setParts(((partsRes.data || []) as unknown[]).map((p) => p as Part));
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

  // SB3 t2 — validation batch « 1 pièce × N trottinettes » (calqué sur validateBatch)
  const validatePartBatch = async (partId: string, scooterIds: string[]) => {
    setBulkSaving(true);
    try {
      // 1. upsert des cochés → compat validées (INSERT des nouveaux, suggestions → validées)
      if (scooterIds.length > 0) {
        const { error: upErr } = await supabase.from('part_compatibility').upsert(
          scooterIds.map((sid) => ({
            part_id: partId,
            scooter_model_id: sid,
            auto_suggested: false,
            confidence_level: 'validated',
          })),
          { onConflict: 'part_id,scooter_model_id' }
        );
        if (upErr) throw upErr;
      }
      // 2. delete des décochés, BORNÉ au validé (ne jamais détruire une suggestion IA non vue)
      let del = supabase.from('part_compatibility').delete()
        .eq('part_id', partId)
        .eq('auto_suggested', false);
      if (scooterIds.length > 0) {
        del = del.not('scooter_model_id', 'in', '(' + scooterIds.map((s) => '"' + s + '"').join(',') + ')');
      }
      const { error: delErr } = await del;
      if (delErr) throw delErr;

      await fetchData();
      invalidateCompatQueries();
      const partName = parts.find((p) => p.id === partId)?.name ?? 'la pièce';
      toast.success(`${scooterIds.length} trottinette${scooterIds.length > 1 ? 's' : ''} câblée${scooterIds.length > 1 ? 's' : ''} sur ${partName}`);
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la validation batch');
    } finally {
      setBulkSaving(false);
    }
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
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('retrigger-compatibility-matching', {
        body: { part_ids: [partId] },
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
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

  // B1 — relance le matching IA sur UN seul lot de part_ids (clone de retriggerForPart, mode
  // part_ids, auth JWT de session admin — jamais x-admin-secret). Pas de boucle ici (= B2).
  const retriggerCategoryFirstLot = async (ids: string[]) => {
    if (ids.length === 0) return;
    setCatRetriggering(true);
    setCatRetrigResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('retrigger-compatibility-matching', {
        body: { part_ids: ids },
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });
      if (error) throw error;
      const results: Array<{ passe_A_added?: number; passe_B_added?: number; ai_status?: string }> =
        Array.isArray(data?.results) ? data.results : [];
      const suggestions = results.reduce((s, r) => s + (r.passe_A_added ?? 0) + (r.passe_B_added ?? 0), 0);
      const errors = results.filter((r) => r.ai_status === 'error').length;
      setCatRetrigResult({ processed: results.length, suggestions, errors });
      toast.success(`${results.length} pièce(s) traitée(s) · +${suggestions} suggestion(s) IA · ${errors} erreur(s)`);
      await fetchData();
      invalidateCompatQueries();
    } catch (e) {
      console.error(e);
      toast.error('Erreur relance matching IA (catégorie)');
    } finally {
      setCatRetriggering(false);
    }
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

  const matchesFilter = (partId: string): boolean => {
    if (!selectedScooter) return false;
    const meta = metaByKey.get(`${partId}_${selectedScooter}`);
    switch (filter) {
      case 'all': return true;
      case 'to_validate': return !!meta && meta.auto;
      case 'high': return !!meta && meta.auto && meta.confidence === 'high';
      case 'medium': return !!meta && meta.auto && meta.confidence === 'medium';
      case 'low': return !!meta && meta.auto && meta.confidence === 'low';
      case 'validated': return !!meta && !meta.auto;
      default: return true;
    }
  };

  const getVisiblePartIds = (): string[] => {
    if (!selectedScooter) return [];
    return parts.filter((p) => {
      if (filter === 'all') {
        const meta = metaByKey.get(`${p.id}_${selectedScooter}`);
        return !!meta && meta.auto;
      }
      return matchesFilter(p.id);
    }).map((p) => p.id);
  };

  const validateDisplayed = async () => {
    if (!selectedScooter) return;
    const ids = getVisiblePartIds();
    if (ids.length === 0) return;
    setBulkSaving(true);
    try {
      const { error } = await supabase.from('part_compatibility')
        .update({ auto_suggested: false, confidence_level: 'validated' })
        .in('part_id', ids)
        .eq('scooter_model_id', selectedScooter)
        .eq('auto_suggested', true);
      if (error) throw error;
      await fetchData();
      invalidateCompatQueries();
      toast.success(`${ids.length} compatibilité(s) validée(s)`);
    } catch (e) { console.error(e); toast.error('Erreur validation'); }
    finally { setBulkSaving(false); }
  };

  const rejectDisplayed = async () => {
    if (!selectedScooter) return;
    const ids = getVisiblePartIds();
    if (ids.length === 0) return;
    if (!window.confirm(`Rejeter ${ids.length} suggestion(s) ? Cette action est irréversible.`)) return;
    setBulkSaving(true);
    try {
      const { error } = await supabase.from('part_compatibility').delete()
        .in('part_id', ids)
        .eq('scooter_model_id', selectedScooter)
        .eq('auto_suggested', true);
      if (error) throw error;
      await fetchData();
      invalidateCompatQueries();
      toast.success(`${ids.length} suggestion(s) rejetée(s)`);
    } catch (e) { console.error(e); toast.error('Erreur rejet'); }
    finally { setBulkSaving(false); }
  };

  // SB2 — agrégats de câblage, 1 passe sur metaByKey, sans requête (hook AVANT l'early-return)
  const { validatedParts, wiredParts, onlySuggested, unmatchedParts } = useMemo(() => {
    const validated = new Set<string>();
    const suggested = new Set<string>();
    // clé metaByKey = `${part_id}_${scooter_model_id}` ; un UUID fait 36 char et ne contient pas de '_'
    metaByKey.forEach((m, k) => {
      const partId = k.slice(0, 36);
      if (m.auto) suggested.add(partId);
      else validated.add(partId);
    });
    const wired = new Set<string>([...validated, ...suggested]);
    const onlySug = [...suggested].filter((id) => !validated.has(id));
    // B0 — ne considérer comme « non câblées » que les pièces publiées (les brouillons
    // ne doivent pas entrer dans le matching IA par catégorie)
    const unmatched = parts.filter((p) => !wired.has(p.id) && p.published === true);
    return { validatedParts: validated, suggestedParts: suggested, wiredParts: wired, onlySuggested: onlySug, unmatchedParts: unmatched };
  }, [metaByKey, parts]);

  // SB3b — réindex par pièce (zéro requête) : tous les scooter_model_id existants de la pièce
  // (validées + suggérées confondues). Clé = `${part_id}_${scooter_model_id}`, UUID = 36 char sans '_'.
  const selectedIdsForPart = useMemo(() => {
    if (!selectedPart) return [];
    const ids: string[] = [];
    metaByKey.forEach((_, k) => { if (k.slice(0, 36) === selectedPart) ids.push(k.slice(37)); });
    return ids;
  }, [metaByKey, selectedPart]);

  // seed du panneau « par pièce » à chaque (re)calcul (changement de pièce ou refetch)
  useEffect(() => { setLocalSelected(selectedIdsForPart); }, [selectedIdsForPart]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const partsByCategory = getPartsByCategory();
  // SB2 — options + filtrage catégorie de la vue non câblées
  const unmatchedCats = Array.from(
    new Set(unmatchedParts.map((p) => p.category?.name || 'Autre'))
  ).sort((a, b) => a.localeCompare(b));
  const unmatchedFiltered = unmatchedCat === 'all'
    ? unmatchedParts
    : unmatchedParts.filter((p) => (p.category?.name || 'Autre') === unmatchedCat);
  const wiredPct = parts.length > 0 ? Math.round((wiredParts.size / parts.length) * 100) : 0;
  // SB3 t2 — source de la sidebar « par pièce » selon la portée (non câblées vs toutes)
  const partScopeBase = partScope === 'all' ? parts : unmatchedParts;
  const partScopeCats = Array.from(
    new Set(partScopeBase.map((p) => p.category?.name || 'Autre'))
  ).sort((a, b) => a.localeCompare(b));
  const partScopeFiltered = unmatchedCat === 'all'
    ? partScopeBase
    : partScopeBase.filter((p) => (p.category?.name || 'Autre') === unmatchedCat);
  const sugCount = selectedScooter ? getCountByLevel(selectedScooter, 'auto') : 0;
  const highCount = selectedScooter ? getCountByLevel(selectedScooter, 'high') : 0;
  const medCount = selectedScooter ? getCountByLevel(selectedScooter, 'medium') : 0;
  const lowCount = selectedScooter ? getCountByLevel(selectedScooter, 'low') : 0;
  const validatedCount = selectedScooter
    ? Array.from(metaByKey.entries()).filter(([k, m]) => k.endsWith(`_${selectedScooter}`) && !m.auto).length
    : 0;

  const visibleIds = selectedScooter ? getVisiblePartIds() : [];
  const visibleCount = visibleIds.length;
  const filterLabels: Record<FilterKey, string> = {
    all: 'Tout',
    to_validate: 'À valider',
    high: 'Haute',
    medium: 'Moyenne',
    low: 'Basse',
    validated: 'Validées',
  };
  const bulkDisabled = filter === 'all' || filter === 'validated' || visibleCount === 0 || bulkSaving;

  const filterPills: { key: FilterKey; label: string; count: number }[] = [
    { key: 'all', label: 'Tout', count: parts.length },
    { key: 'to_validate', label: 'À valider', count: sugCount },
    { key: 'high', label: 'Haute', count: highCount },
    { key: 'medium', label: 'Moy', count: medCount },
    { key: 'low', label: 'Basse', count: lowCount },
    { key: 'validated', label: 'Validées', count: validatedCount },
  ];


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
      {/* SB2 — Synthèse de câblage (barre globale + pièces non câblées), pleine largeur avant la grille */}
      <div className="space-y-4 mb-6">
        {/* SB3a — Toggle d'axe de travail */}
        <div className="inline-flex rounded-lg border p-1" style={{ borderColor: 'rgba(74,124,89,0.25)', backgroundColor: '#F5F0E8' }}>
          {([['scooter', 'Par trottinette'], ['part', 'Par pièce']] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setAxis(key)}
              className="px-4 min-h-[44px] rounded-md text-sm font-semibold transition-colors"
              style={axis === key ? { backgroundColor: '#4A7C59', color: '#fff' } : { color: '#6B7280' }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Barre de progression globale */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Link2 className="w-4 h-4" style={{ color: '#4A7C59' }} />
              {wiredParts.size} / {parts.length} pièces câblées
            </h3>
            <span className="text-sm font-semibold" style={{ color: '#4A7C59' }}>{wiredPct}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(74,124,89,0.12)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${wiredPct}%`, backgroundColor: '#4A7C59' }}
            />
          </div>
          <p className="text-[11px] mt-2" style={{ color: '#6B7280' }}>
            {validatedParts.size} validées · {onlySuggested.length} en attente de validation · {unmatchedParts.length} non câblées
          </p>
        </div>

        {/* Vue pièces non câblées (informatif — l'action de matching par pièce sera le SB3) */}
        <div className="rounded-lg border border-border bg-card">
          <button
            type="button"
            onClick={() => setShowUnmatched((v) => !v)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-lg"
          >
            <span className="font-semibold text-foreground flex items-center gap-2">
              <Unlink className="w-4 h-4" style={{ color: '#6B7280' }} />
              Pièces non câblées ({unmatchedParts.length})
            </span>
            {showUnmatched ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </button>
          {showUnmatched && (
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <label htmlFor="unmatched-cat" className="text-xs font-medium" style={{ color: '#6B7280' }}>Catégorie</label>
                <select
                  id="unmatched-cat"
                  value={unmatchedCat}
                  onChange={(e) => setUnmatchedCat(e.target.value)}
                  className="text-sm rounded-lg border px-3 py-2 bg-white min-h-[44px]"
                  style={{ borderColor: 'rgba(74,124,89,0.25)', color: '#4A7C59' }}
                >
                  <option value="all">Toutes ({unmatchedParts.length})</option>
                  {unmatchedCats.map((c) => (
                    <option key={c} value={c}>
                      {c} ({unmatchedParts.filter((p) => (p.category?.name || 'Autre') === c).length})
                    </option>
                  ))}
                </select>
              </div>
              {/* B1 — relancer le matching IA sur le 1er lot (≤35) des pièces publiées non câblées de la catégorie */}
              <div className="rounded-lg p-3 mb-3 border-t" style={{ backgroundColor: 'rgba(74,124,89,0.05)', borderColor: 'rgba(74,124,89,0.15)' }}>
                <p className="text-xs mb-2" style={{ color: '#6B7280' }}>
                  1er lot : <span className="font-semibold" style={{ color: '#4A7C59' }}>{Math.min(unmatchedFiltered.length, 35)}</span> / {unmatchedFiltered.length} pièce{unmatchedFiltered.length > 1 ? 's' : ''} non câblée{unmatchedFiltered.length > 1 ? 's' : ''}{unmatchedCat !== 'all' ? ` — ${unmatchedCat}` : ''}
                </p>
                <button
                  type="button"
                  onClick={() => retriggerCategoryFirstLot(unmatchedFiltered.map((p) => p.id).slice(0, 35))}
                  disabled={catRetriggering || unmatchedFiltered.length === 0}
                  className="inline-flex items-center gap-2 px-4 min-h-[44px] rounded-lg text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                  style={{ backgroundColor: '#4A7C59' }}
                >
                  {catRetriggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Relancer matching IA (catégorie)
                </button>
                {catRetrigResult && (
                  <p className="text-[11px] mt-2" style={{ color: '#6B7280' }}>
                    Dernier lot : {catRetrigResult.processed} traitée{catRetrigResult.processed > 1 ? 's' : ''} · +{catRetrigResult.suggestions} suggestion{catRetrigResult.suggestions > 1 ? 's' : ''} IA · {catRetrigResult.errors} erreur{catRetrigResult.errors > 1 ? 's' : ''}
                  </p>
                )}
              </div>
              {unmatchedFiltered.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Aucune pièce non câblée dans cette catégorie 🎉</p>
              ) : (
                <ScrollArea className="h-[280px]">
                  <ul className="space-y-1 pr-2">
                    {unmatchedFiltered.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between gap-3 px-3 py-2 rounded-md flex-wrap"
                        style={{ backgroundColor: '#F5F0E8' }}
                      >
                        <span className="text-sm text-foreground min-w-0 truncate">{p.name}</span>
                        <span className="flex items-center gap-2 shrink-0">
                          {p.sku && (
                            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(74,124,89,0.1)', color: '#4A7C59' }}>
                              {p.sku}
                            </span>
                          )}
                          <span className="text-[11px]" style={{ color: '#6B7280' }}>{p.category?.name || 'Autre'}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {axis === 'scooter' && (
          <>
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
            </div>

            {selectedScooter && (
              <>
                {/* Zone A — Filtres (revue) */}
                <div className="rounded-lg p-3 mb-3" style={{ backgroundColor: '#F5F0E8' }}>
                  <div className="flex items-center gap-2 mb-2 text-xs font-medium" style={{ color: '#6B7280' }}>
                    <ListFilter className="w-3.5 h-3.5" /> Filtres de revue
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {filterPills.map((p) => {
                      const active = filter === p.key;
                      return (
                        <button
                          key={p.key}
                          onClick={() => setFilter(p.key)}
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3 min-h-[44px] rounded-full text-xs font-semibold border transition-colors',
                            active ? 'text-white border-transparent' : 'bg-white hover:bg-white/70'
                          )}
                          style={
                            active
                              ? { backgroundColor: '#4A7C59' }
                              : { color: '#6B7280', borderColor: 'rgba(74,124,89,0.25)' }
                          }
                        >
                          {p.label}
                          <span
                            className={cn(
                              'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold',
                              active ? 'bg-white/25 text-white' : ''
                            )}
                            style={active ? undefined : { backgroundColor: 'rgba(74,124,89,0.12)', color: '#4A7C59' }}
                          >
                            {p.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Zone B — Actions de masse sur l'affichage courant */}
                <div
                  className="rounded-lg p-3 mb-4 border-t"
                  style={{ backgroundColor: 'rgba(74,124,89,0.05)', borderColor: 'rgba(74,124,89,0.15)' }}
                >
                  <p className="text-xs mb-2" style={{ color: '#6B7280' }}>
                    Affichage : <span className="font-semibold" style={{ color: '#4A7C59' }}>{filterLabels[filter]}</span> — {visibleCount} pièce{visibleCount > 1 ? 's' : ''}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={validateDisplayed}
                      disabled={bulkDisabled}
                      className="inline-flex items-center gap-2 px-4 min-h-[44px] rounded-lg text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                      style={{ backgroundColor: '#4A7C59' }}
                    >
                      {bulkSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                      Valider tout l'affichage ({visibleCount})
                    </button>
                    <button
                      onClick={rejectDisplayed}
                      disabled={bulkDisabled}
                      className="inline-flex items-center gap-2 px-4 min-h-[44px] rounded-lg text-sm font-semibold border-2 border-destructive text-destructive bg-white hover:bg-destructive/5 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                    >
                      <X className="w-4 h-4" />
                      Rejeter l'affichage ({visibleCount})
                    </button>
                  </div>
                  {(filter === 'all' || filter === 'validated') && (
                    <p className="text-[11px] mt-2" style={{ color: '#6B7280' }}>
                      Sélectionnez un filtre de revue (À valider / Haute / Moyenne / Basse) pour activer les actions de masse.
                    </p>
                  )}
                </div>
              </>
            )}

            {selectedScooter ? (
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {Object.entries(partsByCategory).map(([category, categoryParts]) => {
                    const filteredParts = categoryParts.filter((p) => matchesFilter(p.id));
                    if (filter !== 'all' && filteredParts.length === 0) return null;
                    const isOpen = filter !== 'all' || expandedCategories.has(category);
                    const displayParts = filter === 'all' ? categoryParts : filteredParts;
                    return (
                    <div key={category} className="border border-border rounded-lg overflow-hidden">
                      <button onClick={() => toggleCategory(category)}
                        className="w-full px-4 py-3 bg-muted/50 flex items-center justify-between hover:bg-muted transition-colors">
                        <span className="font-medium text-sm text-foreground">{category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {filter === 'all'
                              ? `${categoryParts.filter((p) => metaByKey.has(`${p.id}_${selectedScooter}`)).length}/${categoryParts.length}`
                              : `${filteredParts.length} affichée${filteredParts.length > 1 ? 's' : ''}`}
                          </span>
                          {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </button>
                      {isOpen && (
                        <div className="p-3 space-y-2">
                          {displayParts.map((part) => {
                            const key = `${part.id}_${selectedScooter}`;
                            const meta = metaByKey.get(key);
                            const isCompatible = !!meta;
                            const isAuto = !!meta?.auto;
                            const primary = getPrimaryImage(part.images, part.image_url, '');
                            return (
                              <div key={part.id}
                                className={cn('flex items-center gap-3 p-2 rounded-md transition-colors flex-wrap',
                                  isAuto ? 'bg-orange-500/10 border border-orange-500/30' :
                                  isCompatible ? 'bg-primary/10' : 'hover:bg-muted')}>
                                <div className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                                  onClick={() => !saving && toggleCompatibility(part.id, selectedScooter)}>
                                  <Checkbox checked={isCompatible} disabled={saving}
                                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); if (primary) setLightboxUrl(primary); }}
                                    disabled={!primary}
                                    aria-label={primary ? `Agrandir ${part.name}` : 'Pas de photo'}
                                    className="h-11 w-11 shrink-0 rounded-lg overflow-hidden border flex items-center justify-center transition disabled:cursor-default"
                                    style={{ backgroundColor: '#F5F0E8', borderColor: 'rgba(74,124,89,0.15)' }}
                                  >
                                    {primary ? (
                                      <img src={primary} alt={part.name} loading="lazy" className="h-full w-full object-cover" />
                                    ) : (
                                      <ImageIcon className="h-5 w-5" style={{ color: '#6B7280' }} />
                                    )}
                                  </button>
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
                    );
                  })}
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
          </>
        )}

        {axis === 'part' && (
          <>
            {/* Sidebar pièces (mode par pièce) */}
            <div className="lg:col-span-1">
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <ListFilter className="w-4 h-4 text-primary" />Sélectionner une pièce
                </h3>
                {/* SB3 t2 — portée : non câblées vs toutes */}
                <div className="inline-flex rounded-lg border p-1 mb-3" style={{ borderColor: 'rgba(74,124,89,0.25)', backgroundColor: '#F5F0E8' }}>
                  {([['unwired', 'Non câblées'], ['all', 'Toutes']] as const).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => { setPartScope(key); setUnmatchedCat('all'); }}
                      className="px-3 min-h-[40px] rounded-md text-xs font-semibold transition-colors"
                      style={partScope === key ? { backgroundColor: '#4A7C59', color: '#fff' } : { color: '#6B7280' }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <select
                  value={unmatchedCat}
                  onChange={(e) => setUnmatchedCat(e.target.value)}
                  className="w-full text-sm rounded-lg border px-3 py-2 bg-white min-h-[44px] mb-3"
                  style={{ borderColor: 'rgba(74,124,89,0.25)', color: '#4A7C59' }}
                >
                  <option value="all">Toutes catégories ({partScopeBase.length})</option>
                  {partScopeCats.map((c) => (
                    <option key={c} value={c}>
                      {c} ({partScopeBase.filter((p) => (p.category?.name || 'Autre') === c).length})
                    </option>
                  ))}
                </select>
                <ScrollArea className="h-[420px]">
                  <div className="space-y-1">
                    {partScopeFiltered.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-6 text-center">
                        {partScope === 'unwired' ? 'Aucune pièce non câblée 🎉' : 'Aucune pièce'}
                      </p>
                    ) : (
                      partScopeFiltered.map((part) => {
                        const isWired = wiredParts.has(part.id);
                        return (
                          <button
                            key={part.id}
                            onClick={() => setSelectedPart(part.id)}
                            className={cn(
                              'w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-2',
                              selectedPart === part.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                            )}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: isWired ? '#4A7C59' : 'rgba(107,114,128,0.4)' }}
                              aria-hidden
                            />
                            <span className="min-w-0">
                              <p className="font-medium text-sm truncate">{part.name}</p>
                              <p className={cn('text-xs truncate', selectedPart === part.id ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                                {part.sku || '—'} · {part.category?.name || 'Autre'}
                              </p>
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Panneau par pièce */}
            <div className="lg:col-span-2">
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    {selectedPart ? (
                      <><Check className="w-4 h-4 text-primary" />Trottinettes compatibles</>
                    ) : (
                      <><Unlink className="w-4 h-4 text-muted-foreground" />Sélectionnez une pièce</>
                    )}
                  </h3>
                </div>

                {selectedPart ? (
                  <>
                    {/* Zone B — validation batch (INERTE en tranche 1, écriture = tranche 2) */}
                    <div
                      className="rounded-lg p-3 mb-4 border-t"
                      style={{ backgroundColor: 'rgba(74,124,89,0.05)', borderColor: 'rgba(74,124,89,0.15)' }}
                    >
                      <p className="text-xs mb-2" style={{ color: '#6B7280' }}>
                        {localSelected.length} trottinette{localSelected.length > 1 ? 's' : ''} cochée{localSelected.length > 1 ? 's' : ''}
                      </p>
                      <button
                        type="button"
                        onClick={() => selectedPart && validatePartBatch(selectedPart, localSelected)}
                        disabled={bulkSaving}
                        className="inline-flex items-center gap-2 px-4 min-h-[44px] rounded-lg text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                        style={{ backgroundColor: '#4A7C59' }}
                      >
                        {bulkSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                        Valider ({localSelected.length} trottinette{localSelected.length > 1 ? 's' : ''})
                      </button>
                    </div>

                    <ScooterCompatibilitySelect
                      partId={undefined}
                      selectedIds={localSelected}
                      onChange={setLocalSelected}
                    />
                  </>
                ) : (
                  <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                    <p className="text-center">
                      <Link2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      Cliquez sur une pièce pour gérer ses trottinettes compatibles
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      <Dialog open={!!lightboxUrl} onOpenChange={(o) => !o && setLightboxUrl(null)}>
        <DialogContent className="max-w-3xl p-2" style={{ backgroundColor: '#F5F0E8' }}>
          {lightboxUrl && (
            <img src={lightboxUrl} alt="" className="w-full h-auto max-h-[80vh] object-contain rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default CompatibilityManager;
