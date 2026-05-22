import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ScooterCompatiblePart } from "@/hooks/useScooterDetail";

// Full editorial brand row (mirrors the extended `brands` table — étape 1C/2).
export interface BrandData {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  hero_image_url: string | null;
  tagline: string | null;
  description: string | null;
  editorial_verdict: string | null;
  country: string | null;
  founded_year: number | null;
  website_url: string | null;
  youtube_video_id: string | null;
  accent_color: string | null;
  display_order: number;
  published: boolean;
}

// Lightweight model shape used by the brand models carousel.
export interface BrandModel {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  max_speed_kmh: number | null;
  range_km: number | null;
  power_watts: number | null;
}

// Lightweight item for previous/next brand navigation in the hero carousel.
export interface BrandNavItem {
  slug: string;
  name: string;
  accent_color: string | null;
}

const BRAND_COLUMNS =
  "id, name, slug, logo_url, hero_image_url, tagline, description, editorial_verdict, country, founded_year, website_url, youtube_video_id, accent_color, display_order, published";

// A. One published brand by slug.
const useBrandBySlug = (slug?: string) =>
  useQuery({
    queryKey: ["brand-by-slug", slug],
    queryFn: async (): Promise<BrandData | null> => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("brands")
        .select(BRAND_COLUMNS)
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as BrandData) ?? null;
    },
    enabled: !!slug,
  });

// B. Published models for the brand, newest first.
const useBrandModels = (brandId?: string | null) =>
  useQuery({
    queryKey: ["brand-models", brandId],
    queryFn: async (): Promise<BrandModel[]> => {
      if (!brandId) return [];
      const { data, error } = await supabase
        .from("scooter_models")
        .select("id, name, slug, image_url, max_speed_kmh, range_km, power_watts")
        .eq("brand_id", brandId)
        .eq("published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as BrandModel[]) ?? [];
    },
    enabled: !!brandId,
  });

// C. Top parts across the brand's gamme.
// No direct part→brand link, so we walk: models → part_compatibility → parts,
// then aggregate client-side (popularity = number of models a part fits).
const useBrandTopParts = (modelIds: string[]) =>
  useQuery({
    queryKey: ["brand-top-parts", modelIds],
    queryFn: async (): Promise<ScooterCompatiblePart[]> => {
      if (modelIds.length === 0) return [];
      const { data, error } = await supabase
        .from("part_compatibility")
        .select(
          `
          part_id,
          parts (
            id, name, slug, price, image_url, images, stock_quantity,
            difficulty_level, technical_metadata,
            category:categories(id, name, icon, slug)
          )
        `
        )
        .in("scooter_model_id", modelIds)
        .in("confidence_level", ["validated", "high"]); // source de vérité (cf. useScooterCompatibleParts)
      if (error) throw error;

      const counts = new Map<string, number>();
      const byId = new Map<string, ScooterCompatiblePart>();
      (data || []).forEach((row) => {
        const part = (row as { parts?: unknown }).parts as ScooterCompatiblePart | null;
        if (!part) return;
        counts.set(part.id, (counts.get(part.id) || 0) + 1);
        if (!byId.has(part.id)) byId.set(part.id, part);
      });

      return Array.from(byId.values())
        .sort((a, b) => (counts.get(b.id) || 0) - (counts.get(a.id) || 0))
        .slice(0, 8);
    },
    enabled: modelIds.length > 0,
  });

export const useBrandData = (slug: string | undefined) => {
  const { data: brand, isLoading: brandLoading, isError: brandError } = useBrandBySlug(slug);
  const { data: models = [], isLoading: modelsLoading } = useBrandModels(brand?.id ?? null);

  const modelIds = useMemo(() => models.map((m) => m.id), [models]);
  const { data: topParts = [], isLoading: partsLoading } = useBrandTopParts(modelIds);

  return {
    brand: brand ?? null,
    models,
    topParts,
    // Page is "loading" only until we know whether the published brand exists.
    isLoading: brandLoading,
    isModelsLoading: modelsLoading,
    isPartsLoading: partsLoading,
    isError: brandError,
  };
};

// Ordered list of published brands → previous/next neighbours for the hero carousel.
// Stable query key (no slug) so the list is fetched once and reused across navigations.
export const useBrandsNavigation = (currentSlug?: string) => {
  const { data: ordered = [] } = useQuery({
    queryKey: ["brands-nav"],
    queryFn: async (): Promise<BrandNavItem[]> => {
      const { data, error } = await supabase
        .from("brands")
        .select("slug, name, accent_color, display_order")
        .eq("published", true)
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return (data as unknown as BrandNavItem[]) ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  return useMemo(() => {
    const empty = { prev: null as BrandNavItem | null, next: null as BrandNavItem | null };
    if (!currentSlug || ordered.length < 2) return empty;
    const i = ordered.findIndex((b) => b.slug === currentSlug);
    if (i === -1) return empty;
    const len = ordered.length;
    // Loop modulo : with exactly 2 brands, prev === next === the other brand (spec).
    return {
      prev: ordered[(i - 1 + len) % len],
      next: ordered[(i + 1) % len],
    };
  }, [ordered, currentSlug]);
};
