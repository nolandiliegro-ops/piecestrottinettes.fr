import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSelectedScooter, type BrandColorConfig } from '@/contexts/ScooterContext';

/**
 * Hook to check if a part is compatible with the currently selected scooter.
 * Returns { isCompatible, isLoading, selectedScooter, brandColors }
 */
export const useIsCompatibleWithSelected = (partId: string | undefined) => {
  const { selectedScooter, selectedBrandColors } = useSelectedScooter();

  const { data: isCompatible, isLoading } = useQuery({
    queryKey: ['part-compatibility-check', partId, selectedScooter?.id],
    queryFn: async () => {
      if (!selectedScooter || !partId) return false;
      
      const { data, error } = await supabase
        .from('part_compatibility')
        .select('id')
        .eq('part_id', partId)
        .eq('scooter_model_id', selectedScooter.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking compatibility:', error);
        return false;
      }
      
      return !!data;
    },
    enabled: !!selectedScooter && !!partId,
    staleTime: 60000, // Cache for 1 minute
  });

  return {
    isCompatible: isCompatible ?? false,
    isLoading,
    selectedScooter,
    brandColors: selectedBrandColors,
  };
};
