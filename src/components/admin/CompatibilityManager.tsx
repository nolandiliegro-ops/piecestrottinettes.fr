import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Link2, Unlink, Check, ChevronDown, ChevronRight, Sparkles, X, CheckCheck } from 'lucide-react';
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

const CompatibilityManager = () => {
  const [scooters, setScooters] = useState<Scooter[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  // Set of "partId_scooterId"
  const [compatibilities, setCompatibilities] = useState<Set<string>>(new Set());
  // Set of "partId_scooterId" — sous-ensemble dont auto_suggested = true
  const [autoSuggested, setAutoSuggested] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [selectedScooter, setSelectedScooter] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [scootersRes, partsRes, compatRes] = await Promise.all([
        supabase.from('scooter_models').select('id, name, slug, brand:brands(name)').order('name'),
        supabase.from('parts').select('id, name, category:categories(name)').order('name'),
        supabase.from('part_compatibility').select('part_id, scooter_model_id, auto_suggested'),
      ]);

      if (scootersRes.error) throw scootersRes.error;
      if (partsRes.error) throw partsRes.error;
      if (compatRes.error) throw compatRes.error;

      setScooters(scootersRes.data || []);
      setParts(partsRes.data || []);

      const compatSet = new Set<string>();
      const autoSet = new Set<string>();
      (compatRes.data || []).forEach((c: { part_id: string; scooter_model_id: string; auto_suggested: boolean }) => {
        const key = `${c.part_id}_${c.scooter_model_id}`;
        compatSet.add(key);
        if (c.auto_suggested) autoSet.add(key);
      });
      setCompatibilities(compatSet);
      setAutoSuggested(autoSet);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggle 3-states :
   *  - non cochée → INSERT (auto_suggested=false)
   *  - cochée + auto_suggested → UPDATE auto_suggested=false (= validation)
   *  - cochée + validée → DELETE
   */
  const toggleCompatibility = async (partId: string, scooterId: string) => {
    const key = `${partId}_${scooterId}`;
    const isCompatible = compatibilities.has(key);
    const isAuto = autoSuggested.has(key);

    setSaving(true);
    try {
      if (!isCompatible) {
        const { error } = await supabase
          .from('part_compatibility')
          .insert({ part_id: partId, scooter_model_id: scooterId, auto_suggested: false });
        if (error) throw error;
        setCompatibilities((prev) => new Set(prev).add(key));
        toast.success('Compatibilité ajoutée');
      } else if (isAuto) {
        const { error } = await supabase
          .from('part_compatibility')
          .update({ auto_suggested: false })
          .eq('part_id', partId)
          .eq('scooter_model_id', scooterId);
        if (error) throw error;
        setAutoSuggested((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        toast.success('Suggestion validée');
      } else {
        const { error } = await supabase
          .from('part_compatibility')
          .delete()
          .eq('part_id', partId)
          .eq('scooter_model_id', scooterId);
        if (error) throw error;
        setCompatibilities((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        toast.success('Compatibilité supprimée');
      }
    } catch (error) {
      console.error('Error toggling compatibility:', error);
      toast.error('Erreur lors de la modification');
    } finally {
      setSaving(false);
    }
  };

  /** Reject une suggestion auto (X rouge inline) */
  const rejectSuggestion = async (partId: string, scooterId: string) => {
    const key = `${partId}_${scooterId}`;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('part_compatibility')
        .delete()
        .eq('part_id', partId)
        .eq('scooter_model_id', scooterId)
        .eq('auto_suggested', true);
      if (error) throw error;
      setCompatibilities((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      setAutoSuggested((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      toast.success('Suggestion rejetée');
    } catch (error) {
      console.error('Error rejecting:', error);
      toast.error('Erreur');
    } finally {
      setSaving(false);
    }
  };

  const validateAllSuggestions = async () => {
    if (!selectedScooter) return;
    setBulkSaving(true);
    try {
      const { error } = await supabase
        .from('part_compatibility')
        .update({ auto_suggested: false })
        .eq('scooter_model_id', selectedScooter)
        .eq('auto_suggested', true);
      if (error) throw error;

      // Maj locale : retirer du set autoSuggested toutes les clés liées au scooter
      setAutoSuggested((prev) => {
        const next = new Set<string>();
        prev.forEach((k) => {
          if (!k.endsWith(`_${selectedScooter}`)) next.add(k);
        });
        return next;
      });
      toast.success('Toutes les suggestions validées');
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la validation en masse');
    } finally {
      setBulkSaving(false);
    }
  };

  const rejectAllSuggestions = async () => {
    if (!selectedScooter) return;
    setBulkSaving(true);
    try {
      const { error } = await supabase
        .from('part_compatibility')
        .delete()
        .eq('scooter_model_id', selectedScooter)
        .eq('auto_suggested', true);
      if (error) throw error;

      setCompatibilities((prev) => {
        const next = new Set<string>();
        prev.forEach((k) => {
          if (!(k.endsWith(`_${selectedScooter}`) && autoSuggested.has(k))) next.add(k);
        });
        return next;
      });
      setAutoSuggested((prev) => {
        const next = new Set<string>();
        prev.forEach((k) => {
          if (!k.endsWith(`_${selectedScooter}`)) next.add(k);
        });
        return next;
      });
      toast.success('Toutes les suggestions rejetées');
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors du rejet en masse');
    } finally {
      setBulkSaving(false);
    }
  };

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) newSet.delete(categoryName);
      else newSet.add(categoryName);
      return newSet;
    });
  };

  const getPartsByCategory = () => {
    const grouped: Record<string, Part[]> = {};
    parts.forEach((part) => {
      const category = part.category?.name || 'Autre';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(part);
    });
    return grouped;
  };

  const getCompatibleCount = (scooterId: string) => {
    let count = 0;
    compatibilities.forEach((key) => {
      if (key.endsWith(`_${scooterId}`)) count++;
    });
    return count;
  };

  const getSuggestionCount = (scooterId: string) => {
    let count = 0;
    autoSuggested.forEach((key) => {
      if (key.endsWith(`_${scooterId}`)) count++;
    });
    return count;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const partsByCategory = getPartsByCategory();
  const suggestionCount = selectedScooter ? getSuggestionCount(selectedScooter) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Scooter Selection */}
      <div className="lg:col-span-1">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-primary" />
            Sélectionner une trottinette
          </h3>
          <ScrollArea className="h-[500px]">
            <div className="space-y-1">
              {scooters.map((scooter) => {
                const sugCount = getSuggestionCount(scooter.id);
                return (
                  <button
                    key={scooter.id}
                    onClick={() => setSelectedScooter(scooter.id)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-md transition-colors flex items-center justify-between',
                      selectedScooter === scooter.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                    )}
                  >
                    <div>
                      <p className="font-medium text-sm">{scooter.name}</p>
                      <p
                        className={cn(
                          'text-xs',
                          selectedScooter === scooter.id ? 'text-primary-foreground/70' : 'text-muted-foreground',
                        )}
                      >
                        {scooter.brand?.name}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span
                        className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded-full',
                          selectedScooter === scooter.id
                            ? 'bg-primary-foreground/20 text-primary-foreground'
                            : 'bg-primary/10 text-primary',
                        )}
                      >
                        {getCompatibleCount(scooter.id)}
                      </span>
                      {sugCount > 0 && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-600 inline-flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" />
                          {sugCount}
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

      {/* Parts Compatibility Grid */}
      <div className="lg:col-span-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              {selectedScooter ? (
                <>
                  <Check className="w-4 h-4 text-primary" />
                  Pièces compatibles
                </>
              ) : (
                <>
                  <Unlink className="w-4 h-4 text-muted-foreground" />
                  Sélectionnez une trottinette
                </>
              )}
            </h3>

            {selectedScooter && suggestionCount > 0 && (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 text-xs gap-1.5"
                  onClick={validateAllSuggestions}
                  disabled={bulkSaving}
                >
                  {bulkSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
                  Valider toutes ({suggestionCount})
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10 text-xs gap-1.5"
                  onClick={rejectAllSuggestions}
                  disabled={bulkSaving}
                >
                  <X className="w-3 h-3" />
                  Rejeter toutes ({suggestionCount})
                </Button>
              </div>
            )}
          </div>

          {selectedScooter ? (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {Object.entries(partsByCategory).map(([category, categoryParts]) => (
                  <div key={category} className="border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full px-4 py-3 bg-muted/50 flex items-center justify-between hover:bg-muted transition-colors"
                    >
                      <span className="font-medium text-sm text-foreground">{category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {categoryParts.filter((p) => compatibilities.has(`${p.id}_${selectedScooter}`)).length}/
                          {categoryParts.length}
                        </span>
                        {expandedCategories.has(category) ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {expandedCategories.has(category) && (
                      <div className="p-3 space-y-2">
                        {categoryParts.map((part) => {
                          const key = `${part.id}_${selectedScooter}`;
                          const isCompatible = compatibilities.has(key);
                          const isAuto = autoSuggested.has(key);
                          return (
                            <div
                              key={part.id}
                              className={cn(
                                'flex items-center gap-3 p-2 rounded-md transition-colors',
                                isAuto
                                  ? 'bg-orange-500/10 border border-orange-500/30'
                                  : isCompatible
                                    ? 'bg-primary/10'
                                    : 'hover:bg-muted',
                              )}
                            >
                              <div
                                className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                                onClick={() => !saving && toggleCompatibility(part.id, selectedScooter)}
                              >
                                <Checkbox
                                  checked={isCompatible}
                                  disabled={saving}
                                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                                <span
                                  className={cn(
                                    'text-sm truncate',
                                    isCompatible ? 'text-foreground font-medium' : 'text-muted-foreground',
                                  )}
                                >
                                  {part.name}
                                </span>
                              </div>

                              {isCompatible && (
                                <span
                                  className={cn(
                                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border whitespace-nowrap',
                                    isAuto
                                      ? 'bg-orange-500/15 text-orange-600 border-orange-500/30'
                                      : 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
                                  )}
                                >
                                  {isAuto ? (
                                    <>
                                      <Sparkles className="w-2.5 h-2.5" />
                                      Suggestion
                                    </>
                                  ) : (
                                    <>
                                      <Check className="w-2.5 h-2.5" />
                                      Validé
                                    </>
                                  )}
                                </span>
                              )}

                              {isAuto && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!saving) rejectSuggestion(part.id, selectedScooter);
                                  }}
                                  disabled={saving}
                                  className="p-1 rounded hover:bg-destructive/15 text-destructive transition-colors"
                                  title="Rejeter cette suggestion"
                                >
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
  );
};

export default CompatibilityManager;
