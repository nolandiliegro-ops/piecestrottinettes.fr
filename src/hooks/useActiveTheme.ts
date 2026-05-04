import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface GarageTheme {
  id: string;
  key: string;
  name: string;
  description: string | null;
  image_url: string;
  thumbnail_url: string | null;
  unlock_type: 'free' | 'xp' | 'paid';
  required_xp: number;
  price_eur: number | null;
  is_active: boolean;
  display_order: number;
}

const FALLBACK_KEY = 'default-fallback';

export const useAvailableThemes = () => {
  const { profile } = useAuth();
  const points = profile?.performance_points ?? 0;

  return useQuery({
    queryKey: ['garage-themes', 'available'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('garage_themes')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data as GarageTheme[]).map((t) => ({
        ...t,
        unlocked:
          t.unlock_type === 'free' ||
          (t.unlock_type === 'xp' && points >= t.required_xp),
      }));
    },
    staleTime: 60_000,
  });
};

export const useActiveTheme = () => {
  const { profile, user, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const activeKey = (profile as any)?.active_theme_key ?? null;

  const themeQuery = useQuery({
    queryKey: ['garage-themes', 'active', activeKey],
    queryFn: async () => {
      if (activeKey) {
        const { data } = await supabase
          .from('garage_themes')
          .select('*')
          .eq('key', activeKey)
          .eq('is_active', true)
          .maybeSingle();
        if (data) return data as GarageTheme;
      }
      // Fallback: 1er thème actif par display_order
      const { data: first } = await supabase
        .from('garage_themes')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (first) return first as GarageTheme;
      // Ultime fallback: default-fallback
      const { data: fb } = await supabase
        .from('garage_themes')
        .select('*')
        .eq('key', FALLBACK_KEY)
        .maybeSingle();
      return (fb as GarageTheme) ?? null;
    },
    staleTime: 60_000,
  });

  const setTheme = useMutation({
    mutationFn: async (key: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('profiles')
        .update({ active_theme_key: key } as any)
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['garage-themes'] });
      toast.success('Fond appliqué');
    },
    onError: (e: any) => toast.error(e.message ?? 'Erreur'),
  });

  return { theme: themeQuery.data, isLoading: themeQuery.isLoading, setTheme };
};
