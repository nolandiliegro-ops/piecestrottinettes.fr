import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PartDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number | null;
  stock_quantity: number | null;
  difficulty_level: number | null;
  image_url: string | null;
  youtube_video_id: string | null;
  technical_metadata: Record<string, unknown> | null;
  estimated_install_time_minutes: number | null;
  required_tools: string[] | null;
  category_id: string | null;
  category: {
    name: string;
    slug: string;
    icon: string | null;
  } | null;
}

export interface CompatibleScooter {
  id: string;
  name: string;
  slug: string;
  brand: {
    name: string;
    logo_url: string | null;
  };
}

export const usePartBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ["part", slug],
    queryFn: async (): Promise<PartDetail> => {
      const { data, error } = await supabase
        .from("parts")
        .select(
          `
          id,
          name,
          slug,
          description,
          price,
          stock_quantity,
          difficulty_level,
          image_url,
          youtube_video_id,
          technical_metadata,
          estimated_install_time_minutes,
          required_tools,
          category_id,
          categories (
            name,
            slug,
            icon
          )
        `
        )
        .eq("slug", slug)
        .single();

      if (error) throw error;

      return {
        ...data,
        category: data.categories,
      } as PartDetail;
    },
    enabled: !!slug,
  });
};

export const useRelatedParts = (
  categoryId: string | null,
  currentPartId: string | null,
  scooterModelId?: string | null
) => {
  return useQuery({
    queryKey: ["related-parts", categoryId, currentPartId, scooterModelId],
    queryFn: async () => {
      if (scooterModelId) {
        const { data: compatibleIds } = await supabase
          .from("part_compatibility")
          .select("part_id")
          .eq("scooter_model_id", scooterModelId);

        const ids = (compatibleIds || []).map((c) => c.part_id);
        if (ids.length === 0) return [];

        const { data, error } = await supabase
          .from("parts")
          .select("id, name, slug, price, image_url, stock_quantity")
          .eq("category_id", categoryId!)
          .neq("id", currentPartId!)
          .in("id", ids)
          .limit(4);
        if (error) throw error;
        return data ?? [];
      }

      const { data, error } = await supabase
        .from("parts")
        .select("id, name, slug, price, image_url, stock_quantity")
        .eq("category_id", categoryId!)
        .neq("id", currentPartId!)
        .limit(4);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!categoryId && !!currentPartId,
  });
};

export const useCompatibleScooters = (partId: string | null) => {
  return useQuery({
    queryKey: ["compatible-scooters", partId],
    queryFn: async (): Promise<CompatibleScooter[]> => {
      const { data, error } = await supabase
        .from("part_compatibility")
        .select(
          `
          scooter_models (
            id,
            name,
            slug,
            brands (
              name,
              logo_url
            )
          )
        `
        )
        .eq("part_id", partId);

      if (error) throw error;

      return (data || [])
        .map((item) => {
          const model = item.scooter_models as unknown as {
            id: string;
            name: string;
            slug: string;
            brands: { name: string; logo_url: string | null };
          };
          
          if (!model) return null;
          
          return {
            id: model.id,
            name: model.name,
            slug: model.slug,
            brand: model.brands,
          };
        })
        .filter((item): item is CompatibleScooter => item !== null);
    },
    enabled: !!partId,
  });
};
