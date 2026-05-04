import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Updates user_garage.last_maintenance_date to now() for a given garage row.
 * Invalidates the user-garage-scooters query on success.
 */
export const useUpdateLastMaintenance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (garageId: string) => {
      const { error } = await supabase
        .from('user_garage')
        .update({ last_maintenance_date: new Date().toISOString() })
        .eq('id', garageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-garage-scooters'] });
      toast.success('Révision enregistrée');
    },
    onError: () => {
      toast.error("Impossible d'enregistrer la révision");
    },
  });
};
