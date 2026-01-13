import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ScooterDetail {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  power_watts: number | null;
  voltage: number | null;
  amperage: number | null;
  max_speed_kmh: number | null;
  range_km: number | null;
  tire_size: string | null;
  youtube_video_id: string | null;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  affiliate_link: string | null;
  brand: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
  } | null;
}

export interface ScooterCompatiblePart {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  image_url: string | null;
  stock_quantity: number | null;
  difficulty_level: number | null;
  technical_metadata: Record<string, unknown> | null;
  category: {
    id: string;
    name: string;
    icon: string | null;
    slug: string;
  } | null;
}

// Hook to fetch a scooter by its slug
export const useScooterBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ["scooter-detail", slug],
    queryFn: async () => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from("scooter_models")
        .select(`
          id,
          name,
          slug,
          image_url,
          power_watts,
          voltage,
          amperage,
          max_speed_kmh,
          range_km,
          tire_size,
          youtube_video_id,
          description,
          meta_title,
          meta_description,
          affiliate_link,
          brand:brands(id, name, slug, logo_url)
        `)
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      return data as ScooterDetail | null;
    },
    enabled: !!slug,
  });
};

// Hook to fetch ALL compatible parts for a scooter (no limit)
export const useScooterCompatibleParts = (scooterId: string | null) => {
  return useQuery({
    queryKey: ["scooter-compatible-parts", scooterId],
    queryFn: async () => {
      if (!scooterId) return [];

      const { data, error } = await supabase
        .from("part_compatibility")
        .select(`
          parts (
            id,
            name,
            slug,
            price,
            image_url,
            stock_quantity,
            difficulty_level,
            technical_metadata,
            category:categories(id, name, icon, slug)
          )
        `)
        .eq("scooter_model_id", scooterId);

      if (error) throw error;

      // Flatten the response
      return (data || [])
        .map((item) => item.parts)
        .filter(Boolean) as ScooterCompatiblePart[];
    },
    enabled: !!scooterId,
  });
};

// Hook to fetch all scooters grouped by brand for navigation
export const useScootersGroupedByBrand = () => {
  return useQuery({
    queryKey: ["scooters-grouped-by-brand"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scooter_models")
        .select(`
          id,
          name,
          slug,
          brand:brands(id, name, slug)
        `)
        .order("name");

      if (error) throw error;

      // Group by brand
      const grouped: Record<
        string,
        {
          brand: { id: string; name: string; slug: string };
          models: { id: string; name: string; slug: string }[];
        }
      > = {};

      (data || []).forEach((scooter) => {
        if (!scooter.brand) return;
        const brandId = scooter.brand.id;

        if (!grouped[brandId]) {
          grouped[brandId] = {
            brand: scooter.brand,
            models: [],
          };
        }

        grouped[brandId].models.push({
          id: scooter.id,
          name: scooter.name,
          slug: scooter.slug,
        });
      });

      // Convert to array and sort by brand name
      return Object.values(grouped).sort((a, b) =>
        a.brand.name.localeCompare(b.brand.name)
      );
    },
  });
};
