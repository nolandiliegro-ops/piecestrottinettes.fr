import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Returns the total amount invested by the current user in paid/shipped/delivered orders.
 * Cosmetic counter — no toast on error, just logs and falls back to 0.
 */
export const useUserTotalInvested = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['user-total-invested', user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('total_ttc')
        .eq('user_id', user!.id)
        .in('status', ['paid', 'shipped', 'delivered']);
      if (error) {
        console.error('[useUserTotalInvested] fetch error', error);
        throw error;
      }
      return data ?? [];
    },
    select: (orders) =>
      (orders ?? []).reduce(
        (sum: number, o: { total_ttc: number | string | null }) =>
          sum + Number(o.total_ttc ?? 0),
        0
      ),
  });

  return {
    totalInvested: query.data ?? 0,
    isLoading: query.isLoading,
  };
};
