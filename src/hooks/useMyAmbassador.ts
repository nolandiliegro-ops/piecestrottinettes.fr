import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/* Programme ambassadeurs (25/10/2026) — « suis-je ambassadeur ? » pour afficher l'accès à /ambassadeur
   (Garage, menu du compte). Lecture seule ; si rien n'est relié, on tente une fois la liaison par email
   (claim_my_ambassador, idempotente) puis on relit. Mis en cache 10 min : 1 à 3 appels par session. */

export type MyAmbassador = {
  id: string;
  nom: string;
  codes_actifs: string[];
  clics_30j: number;
  commission_acquise: number;
  commission_en_attente: number;
  deja_paye: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = (f: string) => (supabase as any).rpc(f);

async function lire(): Promise<MyAmbassador | null> {
  const { data, error } = await rpc('my_ambassador_dashboard');
  if (error) return null;
  return (data ?? null) as MyAmbassador | null;
}

export function useMyAmbassador() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['amb-mine', user?.id],
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<MyAmbassador | null> => {
      const d = await lire();
      if (d) return d;
      const { data: lie } = await rpc('claim_my_ambassador');
      return lie ? lire() : null;
    },
  });
}

/** Montant restant à verser (commission acquise − déjà payé), jamais négatif. */
export const resteAVerser = (a: MyAmbassador) =>
  Math.max(0, Number(a.commission_acquise || 0) - Number(a.deja_paye || 0));
