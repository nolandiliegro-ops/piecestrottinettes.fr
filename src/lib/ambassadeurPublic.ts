import { supabase } from '@/integrations/supabase/client';

/* Badge « Ambassadeur » des cartes Rider publiques (25/10/2026).
   Fonction en base `rider_est_ambassadeur(p_user)` : SECURITY DEFINER, ne renvoie que vrai/faux
   (ambassadeur au statut « actif » relié à ce compte) ; la table ambassadors reste fermée au public. */

type RpcLibre = { rpc: (f: string, a?: Record<string, unknown>) => PromiseLike<{ data: unknown; error: unknown }> };

export const estAmbassadeur = async (userId: string): Promise<boolean> => {
  const { data, error } = await (supabase as unknown as RpcLibre).rpc('rider_est_ambassadeur', { p_user: userId });
  return !error && data === true;
};
