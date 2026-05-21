import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useScooterBySlug, useScooterCompatibleParts } from "@/hooks/useScooterDetail";

// Lightweight shape used for the scrollable showroom carousel.
export interface ShowroomCarouselScooter {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  brand_name: string | null;
  max_speed_kmh: number | null;
  range_km: number | null;
  power_watts: number | null;
}

// All published scooters, newest first — drives the showroom carousel order.
const useAllShowroomScooters = () =>
  useQuery({
    queryKey: ["showroom_scooters_all"],
    queryFn: async (): Promise<ShowroomCarouselScooter[]> => {
      const { data, error } = await supabase
        .from("scooter_models")
        .select(
          `id, name, slug, image_url, max_speed_kmh, range_km, power_watts,
           brand:brands(name)`
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
          max_speed_kmh: m.max_speed_kmh,
          range_km: m.range_km,
          power_watts: m.power_watts,
        };
      });
    },
    staleTime: 5 * 60 * 1000,
  });

export const useShowroomData = (slug: string | undefined) => {
  const {
    data: scooter,
    isLoading: scooterLoading,
    isError: scooterError,
  } = useScooterBySlug(slug);

  const {
    data: allScooters = [],
    isLoading: listLoading,
    isError: listError,
  } = useAllShowroomScooters();

  const {
    data: compatibleParts = [],
    isLoading: partsLoading,
  } = useScooterCompatibleParts(scooter?.id ?? null);

  // Looping neighbours for the carousel arrows, based on created_at DESC order.
  const { prevSlug, nextSlug } = useMemo(() => {
    if (!slug || allScooters.length < 2) {
      return { prevSlug: null as string | null, nextSlug: null as string | null };
    }
    const i = allScooters.findIndex((s) => s.slug === slug);
    if (i === -1) return { prevSlug: null, nextSlug: null };
    const len = allScooters.length;
    return {
      prevSlug: allScooters[(i - 1 + len) % len].slug,
      nextSlug: allScooters[(i + 1) % len].slug,
    };
  }, [slug, allScooters]);

  return {
    scooter: scooter ?? null,
    allScooters,
    compatibleParts,
    prevSlug,
    nextSlug,
    // Page is "loading" only until we know whether the scooter exists.
    isLoading: scooterLoading || listLoading,
    isPartsLoading: partsLoading,
    isError: scooterError || listError,
  };
};
