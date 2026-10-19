import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminBadges {
  /** Commandes payées ou en préparation = à traiter */
  ordersToProcess: number;
  /** Conversations clients en attente de réponse */
  pendingMessages: number;
  /** Trottinettes + pièces importées par les bots, en attente de revue */
  pendingImports: number;
}

const EMPTY: AdminBadges = { ordersToProcess: 0, pendingMessages: 0, pendingImports: 0 };

/**
 * Compteurs des pastilles de la navigation admin.
 * Une seule source pour la sidebar, la bottom nav et la feuille « Plus » —
 * jamais de fetch dupliqué par écran (l'ancien layout en avait deux).
 */
export const useAdminBadges = (): AdminBadges => {
  const { data } = useQuery({
    queryKey: ['admin-badges'],
    staleTime: 60_000,
    refetchInterval: 120_000,
    queryFn: async (): Promise<AdminBadges> => {
      const [orders, conv, pendingScooters, pendingParts] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }).in('status', ['paid', 'processing']),
        supabase.from('conversation_status').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('scooter_models').select('id', { count: 'exact', head: true }).eq('published', false),
        supabase.from('parts').select('id', { count: 'exact', head: true }).eq('published', false),
      ]);
      return {
        ordersToProcess: orders.count ?? 0,
        pendingMessages: conv.count ?? 0,
        pendingImports: (pendingScooters.count ?? 0) + (pendingParts.count ?? 0),
      };
    },
  });
  return data ?? EMPTY;
};
