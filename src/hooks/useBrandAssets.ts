import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BRAND_ASSETS_FALLBACK, type BrandAssetKey } from "@/config/brand";

export interface BrandAsset {
  asset_key: string;
  asset_url: string;
  alt_text: string | null;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

export type BrandAssetsMap = Record<string, { url: string; alt: string }>;

export const BRAND_ASSETS_QUERY_KEY = ["brand-assets"] as const;

async function fetchBrandAssets(): Promise<BrandAssetsMap> {
  const { data, error } = await supabase
    .from("brand_assets")
    .select("asset_key, asset_url, alt_text");
  if (error) throw error;
  const map: BrandAssetsMap = {};
  (data ?? []).forEach((row) => {
    if (row.asset_url && row.asset_url.length > 0) {
      map[row.asset_key] = { url: row.asset_url, alt: row.alt_text ?? "" };
    }
  });
  return map;
}

/**
 * Returns the full brand assets map. Falls back to static config
 * when the network call fails or returns no rows.
 */
export function useBrandAssets() {
  return useQuery({
    queryKey: BRAND_ASSETS_QUERY_KEY,
    queryFn: fetchBrandAssets,
    staleTime: 60 * 60 * 1000, // 1h
    gcTime: 24 * 60 * 60 * 1000, // 24h
    retry: 1,
  });
}

/**
 * Returns the URL of one brand asset, with automatic fallback.
 */
export function useBrandAsset(key: BrandAssetKey): { url: string; alt: string } {
  const { data } = useBrandAssets();
  const fromDb = data?.[key];
  if (fromDb && fromDb.url) return fromDb;
  return BRAND_ASSETS_FALLBACK[key];
}
