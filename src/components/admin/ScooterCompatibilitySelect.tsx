import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bike, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ScooterModel {
  id: string;
  name: string;
  brandId: string;
  brandName: string;
  imageUrl: string | null;
}

interface Brand {
  id: string;
  name: string;
  scooters: ScooterModel[];
}

interface ScooterCompatibilitySelectProps {
  partId?: string; // If editing, the part ID to load existing compatibilities
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

const ScooterCompatibilitySelect = ({
  partId,
  selectedIds,
  onChange,
  disabled = false,
}: ScooterCompatibilitySelectProps) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());

  // Fetch scooters grouped by brand
  useEffect(() => {
    const fetchScooters = async () => {
      try {
        const { data, error } = await supabase
          .from('scooter_models')
          .select(`
            id,
            name,
            image_url,
            brand_id,
            brand:brands(id, name)
          `)
          .order('name');

        if (error) throw error;

        // Group by brand
        const brandMap = new Map<string, Brand>();
        
        (data || []).forEach((scooter) => {
          const brand = scooter.brand as { id: string; name: string } | null;
          if (!brand) return;
          
          if (!brandMap.has(brand.id)) {
            brandMap.set(brand.id, {
              id: brand.id,
              name: brand.name,
              scooters: [],
            });
          }
          
          brandMap.get(brand.id)!.scooters.push({
            id: scooter.id,
            name: scooter.name,
            brandId: brand.id,
            brandName: brand.name,
            imageUrl: scooter.image_url,
          });
        });

        const sortedBrands = Array.from(brandMap.values()).sort((a, b) => 
          a.name.localeCompare(b.name)
        );

        setBrands(sortedBrands);
        
        // Auto-expand brands that have selected scooters
        if (selectedIds.length > 0) {
          const brandsToExpand = new Set<string>();
          sortedBrands.forEach(brand => {
            if (brand.scooters.some(s => selectedIds.includes(s.id))) {
              brandsToExpand.add(brand.id);
            }
          });
          setExpandedBrands(brandsToExpand);
        }
      } catch (error) {
        console.error('Error fetching scooters:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchScooters();
  }, []);

  // Load existing compatibilities when editing
  useEffect(() => {
    if (!partId) return;

    const fetchCompatibilities = async () => {
      try {
        const { data, error } = await supabase
          .from('part_compatibility')
          .select('scooter_model_id')
          .eq('part_id', partId);

        if (error) throw error;
        
        const ids = (data || []).map(c => c.scooter_model_id);
        if (ids.length > 0) {
          onChange(ids);
        }
      } catch (error) {
        console.error('Error fetching compatibilities:', error);
      }
    };

    fetchCompatibilities();
  }, [partId]);

  const toggleScooter = (scooterId: string) => {
    if (disabled) return;
    
    const newIds = selectedIds.includes(scooterId)
      ? selectedIds.filter(id => id !== scooterId)
      : [...selectedIds, scooterId];
    
    onChange(newIds);
  };

  const toggleBrand = (brand: Brand) => {
    if (disabled) return;
    
    const brandScooterIds = brand.scooters.map(s => s.id);
    const allSelected = brandScooterIds.every(id => selectedIds.includes(id));
    
    if (allSelected) {
      // Deselect all from this brand
      onChange(selectedIds.filter(id => !brandScooterIds.includes(id)));
    } else {
      // Select all from this brand
      const newIds = new Set([...selectedIds, ...brandScooterIds]);
      onChange(Array.from(newIds));
    }
  };

  const toggleBrandExpand = (brandId: string) => {
    setExpandedBrands(prev => {
      const next = new Set(prev);
      if (next.has(brandId)) {
        next.delete(brandId);
      } else {
        next.add(brandId);
      }
      return next;
    });
  };

  const getSelectedCountForBrand = (brand: Brand) => {
    return brand.scooters.filter(s => selectedIds.includes(s.id)).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Chargement des modèles...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with count */}
      <div className="flex items-center justify-between px-1">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Bike className="w-4 h-4 text-mineral" />
          Modèles compatibles
        </Label>
        <Badge 
          variant="secondary" 
          className={cn(
            "font-medium",
            selectedIds.length > 0 && "bg-mineral/15 text-mineral border-[0.5px] border-mineral/20"
          )}
        >
          {selectedIds.length} sélectionné{selectedIds.length > 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Scrollable list */}
      <ScrollArea className="h-[280px] rounded-lg border border-border bg-background/50">
        <div className="p-2 space-y-1">
          {brands.map((brand) => {
            const selectedCount = getSelectedCountForBrand(brand);
            const isExpanded = expandedBrands.has(brand.id);
            const allSelected = brand.scooters.length > 0 && 
              brand.scooters.every(s => selectedIds.includes(s.id));
            const someSelected = selectedCount > 0 && !allSelected;

            return (
              <Collapsible
                key={brand.id}
                open={isExpanded}
                onOpenChange={() => toggleBrandExpand(brand.id)}
              >
                <div className="rounded-lg overflow-hidden">
                  {/* Brand Header */}
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted/80 transition-colors",
                    selectedCount > 0 && "bg-mineral/5"
                  )}>
                    <Checkbox
                      checked={allSelected}
                      ref={(el) => {
                        if (el && someSelected) {
                          (el as HTMLButtonElement).dataset.state = 'indeterminate';
                        }
                      }}
                      onCheckedChange={() => toggleBrand(brand)}
                      disabled={disabled}
                      className="data-[state=checked]:bg-mineral data-[state=checked]:border-mineral"
                    />
                    <CollapsibleTrigger asChild>
                      <button className="flex-1 flex items-center justify-between text-left">
                        <span className="font-medium text-sm">{brand.name}</span>
                        <div className="flex items-center gap-2">
                          {selectedCount > 0 && (
                            <span className="text-xs text-mineral font-medium">
                              {selectedCount}/{brand.scooters.length}
                            </span>
                          )}
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </button>
                    </CollapsibleTrigger>
                  </div>

                  {/* Scooter List */}
                  <CollapsibleContent>
                    <div className="pl-4 py-1 space-y-0.5 border-l-2 border-muted ml-3">
                      {brand.scooters.map((scooter) => {
                        const isSelected = selectedIds.includes(scooter.id);
                        
                        return (
                          <div
                            key={scooter.id}
                            onClick={() => toggleScooter(scooter.id)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-all",
                              "hover:bg-muted/50",
                              isSelected && "bg-mineral/10 hover:bg-mineral/15"
                            )}
                          >
                            <Checkbox
                              checked={isSelected}
                              disabled={disabled}
                              className="data-[state=checked]:bg-mineral data-[state=checked]:border-mineral"
                            />
                            {scooter.imageUrl ? (
                              <img 
                                src={scooter.imageUrl} 
                                alt={scooter.name}
                                className="w-8 h-8 object-contain rounded bg-background p-0.5"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                                <Bike className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                            <span className={cn(
                              "text-sm",
                              isSelected && "font-medium text-mineral"
                            )}>
                              {scooter.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>

      <p className="text-xs text-muted-foreground px-1">
        Cliquez sur une marque pour sélectionner tous ses modèles.
      </p>
    </div>
  );
};

export default ScooterCompatibilitySelect;
