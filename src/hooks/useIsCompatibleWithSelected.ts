import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSelectedScooter, type BrandColorConfig } from '@/contexts/ScooterContext';
import { classifyCompat } from '@/lib/compatibilityStatus';
import { isVerdictSafe } from '@/lib/batteryVoltage';

/**
 * Lit parts.electrical_specs.voltages depuis l'embed PostgREST. La colonne est
 * un jsonb libre : on ne fait confiance qu'a un tableau de nombres.
 */
const readVoltages = (embedded: unknown): number[] | null => {
  const row = Array.isArray(embedded) ? embedded[0] : embedded;
  const specs = (row as { electrical_specs?: unknown } | null | undefined)?.electrical_specs;
  const voltages = (specs as { voltages?: unknown } | null | undefined)?.voltages;
  return Array.isArray(voltages) && voltages.every((v) => typeof v === 'number')
    ? voltages
    : null;
};

/**
 * Hook to check if a part is compatible with the currently selected scooter.
 * Returns { isCompatible, isLoading, selectedScooter, brandColors }
 */
export const useIsCompatibleWithSelected = (partId: string | undefined) => {
  const { selectedScooter, selectedBrandColors } = useSelectedScooter();

  const { data: isCompatible, isLoading } = useQuery({
    queryKey: ['part-compatibility-check-v3', partId, selectedScooter?.id],
    queryFn: async () => {
      if (!selectedScooter || !partId) return false;

      const { data, error } = await supabase
        .from('part_compatibility')
        // M-A7a : electrical_specs vient en embed sur la requête existante —
        // aucun appel réseau supplémentaire par carte.
        .select('confidence_level, suggestion_reason, parts(electrical_specs)')
        .eq('part_id', partId)
        .eq('scooter_model_id', selectedScooter.id)
        .maybeSingle();

      if (error) {
        console.error('Error checking compatibility:', error);
        return false;
      }
      if (!data) return false;

      // M-A7a garde-fous #1/#2 : nominal hors barème ou 84 V ambigu ⇒ la pièce
      // sort du verdict automatique (état neutre, pas de badge). Une pièce sans
      // voltage (pneu, disque…) n'est jamais concernée.
      if (!isVerdictSafe(readVoltages(data.parts))) return false;

      // LOT 3 : le badge card reste BINAIRE — verified uniquement, jamais de 🟡.
      return classifyCompat(data) === 'verified';
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
