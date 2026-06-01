import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ImageEntry } from "@/lib/entityImage";

export interface CompatiblePartRich {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  image_url: string | null;
  images: ImageEntry[] | null;
  stock_quantity: number | null;
  is_featured: boolean | null;
  created_at: string;
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    color: string | null;
  } | null;
}

const normalizeCategory = (raw: unknown): CompatiblePartRich["category"] => {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    const first = raw[0] as Record<string, unknown> | undefined;
    if (!first) return null;
    return {
      id: String(first.id ?? ""),
      name: String(first.name ?? ""),
      slug: String(first.slug ?? ""),
      icon: (first.icon as string | null) ?? null,
      color: (first.color as string | null) ?? null,
    };
  }
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    return {
      id: String(o.id ?? ""),
      name: String(o.name ?? ""),
      slug: String(o.slug ?? ""),
      icon: (o.icon as string | null) ?? null,
      color: (o.color as string | null) ?? null,
    };
  }
  return null;
};

export const useCompatiblePartsRich = (scooterModelId: string | null | undefined) => {
  return useQuery<CompatiblePartRich[], Error>({
    queryKey: ["compatible-parts-rich", scooterModelId],
    queryFn: async () => {
      if (!scooterModelId) return [];

      const { data: compat, error: compatErr } = await supabase
        .from("part_compatibility")
        .select("part_id")
        .eq("scooter_model_id", scooterModelId);
      if (compatErr) throw compatErr;
      if (!compat || compat.length === 0) return [];

      const partIds = compat.map((c) => c.part_id);

      const { data: parts, error: partsErr } = await supabase
        .from("parts")
        .select(
          `id, name, slug, price, image_url, images, stock_quantity, is_featured,
           created_at,
           category:categories(id, name, slug, icon, color)`
        )
        .eq("published", true)
        .in("id", partIds)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (partsErr) throw partsErr;

      return (parts || []).map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        image_url: p.image_url,
        images: (p.images as unknown as ImageEntry[] | null) ?? null,
        stock_quantity: p.stock_quantity,
        is_featured: p.is_featured,
        created_at: p.created_at,
        category: normalizeCategory(p.category),
      }));
    },
    enabled: !!scooterModelId,
    staleTime: 5 * 60 * 1000,
  });
};
