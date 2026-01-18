import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to count compatible parts for a selected scooter model
 */
export const useCompatiblePartsCount = (scooterModelId: string | null | undefined) => {
  return useQuery({
    queryKey: ['compatible-parts-count', scooterModelId],
    queryFn: async () => {
      if (!scooterModelId) return 0;
      
      const { count, error } = await supabase
        .from('part_compatibility')
        .select('*', { count: 'exact', head: true })
        .eq('scooter_model_id', scooterModelId);
      
      if (error) {
        console.error('Error fetching compatible parts count:', error);
        return 0;
      }
      
      return count || 0;
    },
    enabled: !!scooterModelId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};
