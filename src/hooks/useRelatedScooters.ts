import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ImageEntry } from "@/lib/entityImage";

// Modèle léger pour les 3 onglets "autres modèles" de la fiche /scooter.
// Inclut le logo de marque (absent de useScooterModels) pour l'afficher dans les cards.
export interface RelatedScooterBrand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

export interface RelatedScooter {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  images: ImageEntry[] | null;
  brand_id: string | null;
  power_watts: number | null;
  max_speed_kmh: number | null;
  range_km: number | null;
  is_top_moment: boolean;
  is_featured_home: boolean;
  compatible_parts_count: number | null;
  brand: RelatedScooterBrand | null;
}

const normalizeBrand = (raw: unknown): RelatedScooterBrand | null => {
  if (raw && typeof raw === "object" && "name" in raw) {
    return raw as RelatedScooterBrand;
  }
  if (Array.isArray(raw) && raw.length > 0) {
    return raw[0] as RelatedScooterBrand;
  }
  return null;
};

export const useRelatedScooters = () =>
  useQuery({
    queryKey: ["related_scooters_all"],
    queryFn: async (): Promise<RelatedScooter[]> => {
      const { data, error } = await supabase
        .from("scooter_models")
        .select(
          `id, name, slug, image_url, images, brand_id, power_watts, max_speed_kmh, range_km,
           is_top_moment, is_featured_home, compatible_parts_count,
           brand:brands!scooter_models_brand_id_fkey(id, name, slug, logo_url)`
        )
        .eq("published", true)
        .order("name");
      if (error) throw error;
      return (data || []).map((m) => ({
        id: m.id,
        name: m.name,
        slug: m.slug,
        image_url: m.image_url,
        images: (m as { images?: unknown }).images as ImageEntry[] | null,
        brand_id: m.brand_id,
        power_watts: m.power_watts,
        max_speed_kmh: m.max_speed_kmh,
        range_km: m.range_km,
        is_top_moment: !!m.is_top_moment,
        is_featured_home: !!m.is_featured_home,
        compatible_parts_count: m.compatible_parts_count,
        brand: normalizeBrand((m as { brand?: unknown }).brand),
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
