import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DesignToken {
  key: string;
  value: string;
  type: 'color' | 'gradient' | 'texture';
}

/**
 * Convention de naming : 'category.name' → '--token-category-name'.
 * Les points deviennent des tirets, les tirets restent.
 */
function toCssVar(key: string): string {
  return `--token-${key.replace(/\./g, '-')}`;
}

/**
 * Charge tous les design tokens depuis Supabase et les injecte comme CSS variables
 * sur document.documentElement (:root). Subscribe au Realtime channel `design_tokens`
 * pour propager les UPDATE sans reload.
 *
 * Étape 1 : aucun composant ne consomme encore les CSS vars — fallback naturel sur
 * les hex hardcodés. Étape 2 : refactor des composants pour utiliser var(--token-*).
 */
export function useDesignTokens() {
  const queryClient = useQueryClient();

  const { data: tokens, isLoading, error } = useQuery({
    queryKey: ['design-tokens'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('design_tokens')
        .select('key, value, type');
      if (error) throw error;
      return (data ?? []) as DesignToken[];
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!tokens) return;
    const root = document.documentElement;
    for (const t of tokens) {
      root.style.setProperty(toCssVar(t.key), t.value);
    }
  }, [tokens]);

  useEffect(() => {
    const channel = supabase
      .channel('design-tokens-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'design_tokens' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['design-tokens'] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { tokens, isLoading, error };
}
