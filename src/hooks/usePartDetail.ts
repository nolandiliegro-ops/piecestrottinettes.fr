import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ImageEntry } from "@/lib/entityImage";

export interface PartDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  characteristics: string | null;
  sku: string | null;
  price: number | null;
  stock_quantity: number | null;
  difficulty_level: number | null;
  image_url: string | null;
  images: ImageEntry[] | null;
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
  /** Present uniquement quand le slug demande est un ancien alias : slug actuel de la piece. */
  redirectTo?: string;
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
    queryFn: async (): Promise<PartDetail | null> => {
      const { data, error } = await supabase
        .from("parts")
        .select(
          `
          id,
          name,
          slug,
          description,
          meta_title,
          meta_description,
          characteristics,
          sku,
          price,
          stock_quantity,
          difficulty_level,
          image_url,
          images,
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
        .eq("published", true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        return {
          ...data,
          category: data.categories,
        } as unknown as PartDetail;
      }

      // Slug inconnu : peut-etre un ancien slug, conserve par part_slug_aliases
      // (trigger trg_record_part_slug_alias au renommage d'une piece verrouillee).
      const { data: alias } = await supabase
        .from("part_slug_aliases")
        .select("part_id")
        .eq("alias", slug!)
        .maybeSingle();

      if (!alias) return null;

      const { data: target } = await supabase
        .from("parts")
        .select("slug")
        .eq("id", alias.part_id)
        .maybeSingle();

      // target.slug === slug rendrait <Navigate replace /> infini. Le trigger
      // supprime pourtant l'alias egal au nouveau slug : on transforme une boucle
      // theorique en 404.
      if (!target || target.slug === slug) return null;

      return { redirectTo: target.slug } as unknown as PartDetail;
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
          .eq("published", true)
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
        .eq("published", true)
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
            brands!scooter_models_brand_id_fkey (
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
