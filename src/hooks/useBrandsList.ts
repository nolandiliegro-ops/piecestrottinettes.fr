import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * One published brand enriched with its count of published scooter models.
 * Drives the home BrandCarousel — replaces the legacy hardcoded
 * FEATURED_BRAND_SLUGS approach.
 */
export interface BrandListItem {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  tagline: string | null;
  country: string | null;
  accent_color: string | null;
  display_order: number;
  count: number;
}

const BRAND_COLUMNS =
  "id, name, slug, logo_url, tagline, country, accent_color, display_order";

/**
 * Fetch ALL published brands (ordered display_order asc, then name asc) and
 * attach the number of published scooter models per brand.
 *
 * Counts are aggregated client-side (no direct count join in PostgREST without
 * an RPC) — same pattern as the previous home brands implementation.
 */
export const useBrandsList = () =>
  useQuery({
    queryKey: ["brands-list-with-counts"],
    queryFn: async (): Promise<BrandListItem[]> => {
      const { data: brands, error: brandsErr } = await supabase
        .from("brands")
        .select(BRAND_COLUMNS)
        .eq("published", true)
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });
      if (brandsErr) throw brandsErr;

      const { data: models, error: modelsErr } = await supabase
        .from("scooter_models")
        .select("brand_id")
        .eq("published", true);
      if (modelsErr) throw modelsErr;

      const counts = new Map<string, number>();
      (models ?? []).forEach((m) => {
        if (m.brand_id) counts.set(m.brand_id, (counts.get(m.brand_id) ?? 0) + 1);
      });

      return (brands ?? []).map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        logo_url: b.logo_url,
        tagline: b.tagline,
        country: b.country,
        accent_color: b.accent_color,
        display_order: b.display_order,
        count: counts.get(b.id) ?? 0,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
