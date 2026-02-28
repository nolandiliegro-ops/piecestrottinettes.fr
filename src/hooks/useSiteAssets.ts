import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SiteAsset {
  id: string;
  asset_key: string;
  asset_url: string;
  label: string;
  section: string;
  subtitle: string;
  updated_at: string;
}

export const useSiteAssets = (section?: string) => {
  return useQuery({
    queryKey: ['site-assets', section],
    queryFn: async (): Promise<SiteAsset[]> => {
      let query = supabase.from('site_assets').select('*');
      if (section) query = query.eq('section', section);
      const { data, error } = await query.order('asset_key');
      if (error) throw error;
      return (data || []) as SiteAsset[];
    },
  });
};

export const useSiteAsset = (key: string) => {
  return useQuery({
    queryKey: ['site-asset', key],
    queryFn: async (): Promise<string> => {
      const { data, error } = await supabase
        .from('site_assets')
        .select('asset_url')
        .eq('asset_key', key)
        .maybeSingle();
      if (error) throw error;
      return (data as { asset_url: string } | null)?.asset_url || '';
    },
  });
};

export const useUpsertSiteAsset = () => {
  const queryClient = useQueryClient();

  const upsertAsset = async (assetKey: string, newUrl: string) => {
    const { error } = await supabase
      .from('site_assets')
      .update({ asset_url: newUrl })
      .eq('asset_key', assetKey);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['site-assets'] });
    queryClient.invalidateQueries({ queryKey: ['site-asset', assetKey] });
  };

  const updateSubtitle = async (assetKey: string, subtitle: string) => {
    const { error } = await supabase
      .from('site_assets')
      .update({ subtitle })
      .eq('asset_key', assetKey);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['site-assets'] });
  };

  return { upsertAsset, updateSubtitle };
};
