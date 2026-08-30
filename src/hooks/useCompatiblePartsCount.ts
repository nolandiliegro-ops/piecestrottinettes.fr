import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { classifyCompat } from '@/lib/compatibilityStatus';

/**
 * Hook to count compatible parts for a selected scooter model.
 * LOT 3 : compte l'AFFICHABLE (✅ verified + 🟡 unverified) sur pièces publiées
 * — même règle que la fiche trotte, le compteur Header reste cohérent.
 */
export const useCompatiblePartsCount = (scooterModelId: string | null | undefined) => {
  return useQuery({
    queryKey: ['compatible-parts-count-v3', scooterModelId],
    queryFn: async () => {
      if (!scooterModelId) return 0;

      const { data, error } = await supabase
        .from('part_compatibility')
        .select('confidence_level, suggestion_reason, parts!inner(id, published)')
        .eq('scooter_model_id', scooterModelId)
        .eq('parts.published', true)
        .in('confidence_level', ['validated', 'high', 'medium']);

      if (error) {
        console.error('Error fetching compatible parts count:', error);
        return 0;
      }

      return (data || []).filter((row) => classifyCompat(row) !== null).length;
    },
    enabled: !!scooterModelId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};
