import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getPrimaryImage } from "@/lib/entityImage";

export type TileSize = "normal" | "wide" | "tall" | "big";
export type WatermarkPos = "tr" | "bl" | "cc" | "tl" | "br-big";
export type EntryStyle =
  | "punch-right"
  | "glide-right"
  | "slide-left"
  | "rise-bottom"
  | "dive-top"
  | "diag-br"
  | "diag-bl";

export interface BrandWallItem {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  country: string | null;
  display_order: number;
  signature_color: string | null;
  tile_size: TileSize;
  watermark_pos: WatermarkPos;
  is_star: boolean;
  entry_style: EntryStyle;
  showcase_model_id: string | null;
  youtube_video_id: string | null;
  models_count: number;
  showcase_image_url: string | null;
}

const BRAND_COLS =
  "id, name, slug, logo_url, country, display_order, signature_color, tile_size, watermark_pos, is_star, entry_style, showcase_model_id, youtube_video_id";

export const useBrandWall = () =>
  useQuery({
    queryKey: ["brand-wall"],
    queryFn: async (): Promise<BrandWallItem[]> => {
      const { data: brands, error } = await supabase
        .from("brands")
        .select(BRAND_COLS)
        .eq("published", true);
      if (error) throw error;

      const { data: models, error: mErr } = await supabase
        .from("scooter_models")
        .select("id, brand_id, image_url, images")
        .eq("published", true);
      if (mErr) throw mErr;

      const counts = new Map<string, number>();
      const byId = new Map<string, { image_url: string | null; images: unknown }>();
      (models ?? []).forEach((m: any) => {
        if (m.brand_id) counts.set(m.brand_id, (counts.get(m.brand_id) ?? 0) + 1);
        byId.set(m.id, { image_url: m.image_url, images: m.images });
      });

      const items: BrandWallItem[] = (brands ?? []).map((b: any) => {
        let showcase: string | null = null;
        if (b.showcase_model_id && byId.has(b.showcase_model_id)) {
          const m = byId.get(b.showcase_model_id)!;
          const url = getPrimaryImage(m.images, m.image_url, "");
          showcase = url || null;
        }
        return {
          id: b.id,
          name: b.name,
          slug: b.slug,
          logo_url: b.logo_url,
          country: b.country,
          display_order: b.display_order ?? 999,
          signature_color: b.signature_color,
          tile_size: (b.tile_size as TileSize) ?? "normal",
          watermark_pos: (b.watermark_pos as WatermarkPos) ?? "tr",
          is_star: !!b.is_star,
          entry_style: (b.entry_style as EntryStyle) ?? "glide-right",
          showcase_model_id: b.showcase_model_id,
          youtube_video_id: b.youtube_video_id,
          models_count: counts.get(b.id) ?? 0,
          showcase_image_url: showcase,
        };
      });

      items.sort((a, b) => {
        if (a.is_star !== b.is_star) return a.is_star ? -1 : 1;
        if (a.display_order !== b.display_order) return a.display_order - b.display_order;
        return a.name.localeCompare(b.name);
      });

      return items;
    },
    staleTime: 5 * 60 * 1000,
  });
