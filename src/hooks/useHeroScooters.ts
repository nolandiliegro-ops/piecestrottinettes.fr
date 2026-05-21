import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ScooterHero {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  brand_name: string | null;
  year: number | null;
  compatible_parts_count: number | null;
  max_speed_kmh: number | null;
  range_km: number | null;
  power_watts: number | null;
  search_terms: string | null;
  is_top_moment: boolean;
  created_at: string;
}

export interface UseHeroScootersResult {
  scooters: ScooterHero[];
  total: number;
  isLoading: boolean;
  isError: boolean;
}

const FALLBACK_LIMIT = 8;

// Single cached fetch of all published scooters — filtering happens client-side
// so typing in the searchbar never hits the network (see useHeroScooters).
const useAllPublishedScooters = () =>
  useQuery({
    queryKey: ["hero_scooters_all"],
    queryFn: async (): Promise<ScooterHero[]> => {
      const { data, error } = await supabase
        .from("scooter_models")
        .select(
          `id, name, slug, image_url, year, compatible_parts_count,
           is_top_moment, max_speed_kmh, range_km, power_watts, search_terms,
           created_at, brand:brands(name)`
        )
        .eq("published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((m) => {
        const brandRaw = (m as { brand?: unknown }).brand;
        let brandName: string | null = null;
        if (brandRaw && typeof brandRaw === "object" && "name" in brandRaw) {
          brandName = (brandRaw as { name: string }).name;
        } else if (Array.isArray(brandRaw) && brandRaw.length > 0) {
          brandName = (brandRaw[0] as { name: string }).name;
        }
        return {
          id: m.id,
          name: m.name,
          slug: m.slug,
          image_url: m.image_url,
          brand_name: brandName,
          year: m.year,
          compatible_parts_count: m.compatible_parts_count,
          max_speed_kmh: m.max_speed_kmh,
          range_km: m.range_km,
          power_watts: m.power_watts,
          search_terms: m.search_terms,
          is_top_moment: m.is_top_moment,
          created_at: m.created_at,
        };
      });
    },
    staleTime: 5 * 60 * 1000,
  });

export const useHeroScooters = (searchQuery: string): UseHeroScootersResult => {
  const { data: all = [], isLoading, isError } = useAllPublishedScooters();

  const scooters = useMemo<ScooterHero[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length === 0) {
      // Default: curated "top du moment". Fallback to latest 8 if none flagged.
      const top = all.filter((s) => s.is_top_moment);
      return top.length > 0 ? top : all.slice(0, FALLBACK_LIMIT);
    }
    return all.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        (s.search_terms?.toLowerCase().includes(q) ?? false) ||
        (s.brand_name?.toLowerCase().includes(q) ?? false)
    );
  }, [all, searchQuery]);

  return { scooters, total: scooters.length, isLoading, isError };
};
