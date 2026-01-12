import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Link2, Unlink, Check, ChevronDown, ChevronRight } from 'lucide-react';
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

interface Compatibility {
  part_id: string;
  scooter_model_id: string;
}

const CompatibilityManager = () => {
  const [scooters, setScooters] = useState<Scooter[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [compatibilities, setCompatibilities] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        supabase.from('part_compatibility').select('part_id, scooter_model_id'),
      ]);

      if (scootersRes.error) throw scootersRes.error;
      if (partsRes.error) throw partsRes.error;
      if (compatRes.error) throw compatRes.error;

      setScooters(scootersRes.data || []);
      setParts(partsRes.data || []);
      
      // Create a set of "partId_scooterId" for quick lookup
      const compatSet = new Set<string>();
      (compatRes.data || []).forEach(c => {
        compatSet.add(`${c.part_id}_${c.scooter_model_id}`);
      });
      setCompatibilities(compatSet);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const toggleCompatibility = async (partId: string, scooterId: string) => {
    const key = `${partId}_${scooterId}`;
    const isCompatible = compatibilities.has(key);

    setSaving(true);

    try {
      if (isCompatible) {
        // Remove compatibility
        const { error } = await supabase
          .from('part_compatibility')
          .delete()
          .eq('part_id', partId)
          .eq('scooter_model_id', scooterId);

        if (error) throw error;

        setCompatibilities(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
        toast.success('Compatibilité supprimée');
      } else {
        // Add compatibility
        const { error } = await supabase
          .from('part_compatibility')
          .insert({ part_id: partId, scooter_model_id: scooterId });

        if (error) throw error;

        setCompatibilities(prev => {
          const newSet = new Set(prev);
          newSet.add(key);
          return newSet;
        });
        toast.success('Compatibilité ajoutée');
      }
    } catch (error) {
      console.error('Error toggling compatibility:', error);
      toast.error('Erreur lors de la modification');
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const getPartsByCategory = () => {
    const grouped: Record<string, Part[]> = {};
    parts.forEach(part => {
      const category = part.category?.name || 'Autre';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(part);
    });
    return grouped;
  };

  const getCompatibleCount = (scooterId: string) => {
    let count = 0;
    compatibilities.forEach(key => {
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
              {scooters.map(scooter => (
                <button
                  key={scooter.id}
                  onClick={() => setSelectedScooter(scooter.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md transition-colors flex items-center justify-between",
                    selectedScooter === scooter.id 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  )}
                >
                  <div>
                    <p className="font-medium text-sm">{scooter.name}</p>
                    <p className={cn(
                      "text-xs",
                      selectedScooter === scooter.id ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {scooter.brand?.name}
                    </p>
                  </div>
                  <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    selectedScooter === scooter.id 
                      ? "bg-primary-foreground/20 text-primary-foreground" 
                      : "bg-primary/10 text-primary"
                  )}>
                    {getCompatibleCount(scooter.id)}
                  </span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Parts Compatibility Grid */}
      <div className="lg:col-span-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
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
                          {categoryParts.filter(p => compatibilities.has(`${p.id}_${selectedScooter}`)).length}/{categoryParts.length}
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
                        {categoryParts.map(part => {
                          const isCompatible = compatibilities.has(`${part.id}_${selectedScooter}`);
                          return (
                            <div
                              key={part.id}
                              className={cn(
                                "flex items-center gap-3 p-2 rounded-md transition-colors cursor-pointer",
                                isCompatible ? "bg-primary/10" : "hover:bg-muted"
                              )}
                              onClick={() => !saving && toggleCompatibility(part.id, selectedScooter)}
                            >
                              <Checkbox
                                checked={isCompatible}
                                disabled={saving}
                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <span className={cn(
                                "text-sm",
                                isCompatible ? "text-foreground font-medium" : "text-muted-foreground"
                              )}>
                                {part.name}
                              </span>
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
