import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { searchScooters } from "@/lib/scooterSearch";

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
  voltage: number | null;
  wheel_inches: string | null;
  search_terms: string | null;
  is_top_moment: boolean;
  top_rank: number | null;
  created_at: string;
}

export interface UseHeroScootersResult {
  scooters: ScooterHero[];
  total: number;
  isLoading: boolean;
  isError: boolean;
}

const FALLBACK_LIMIT = 8;
const TOP_LIMIT = 12;

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
           is_top_moment, top_rank, max_speed_kmh, range_km, power_watts, voltage, wheel_inches, search_terms,
           created_at, brand:brands!scooter_models_brand_id_fkey(name)`
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
          voltage: m.voltage ?? null,
          wheel_inches: m.wheel_inches != null ? String(m.wheel_inches) : null,
          search_terms: m.search_terms,
          is_top_moment: m.is_top_moment,
          top_rank: m.top_rank ?? null,
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
      // 19/10 (Nolan : « que cinq ») : les modèles cochés « top » d'abord, puis complétés jusqu'à 12 par les
      // modèles avec photo qui ont le plus de pièces compatibles.
      // 19/10 soir (Nolan : « c'est pas vraiment le top ») : plus de remplissage au nombre de pièces. 12 modèles
      // cochés is_top_moment en base ; on ne complète que s'il en reste moins de 4 cochés.
      const byParts = (a: ScooterHero, b: ScooterHero) => (b.compatible_parts_count ?? 0) - (a.compatible_parts_count ?? 0);
      // Ordre choisi dans l'admin (top_rank : 1 = en premier), puis le reste au nombre de pièces.
      const byRank = (a: ScooterHero, b: ScooterHero) => (a.top_rank ?? 999) - (b.top_rank ?? 999) || byParts(a, b);
      const top = all.filter((s) => s.is_top_moment).sort(byRank);
      const rest = top.length >= 4 ? [] : all.filter((s) => !s.is_top_moment && s.image_url && (s.compatible_parts_count ?? 0) > 0).sort(byParts);
      const list = [...top, ...rest].slice(0, TOP_LIMIT);
      return list.length > 0 ? list : all.slice(0, FALLBACK_LIMIT);
    }
    // Recherche tolérante (espaces/tirets/accents/1 faute) — lib/scooterSearch
    return searchScooters(all, q, (s) => ({ name: s.name, brand: s.brand_name, slug: s.slug, terms: s.search_terms }));
  }, [all, searchQuery]);

  return { scooters, total: scooters.length, isLoading, isError };
};
