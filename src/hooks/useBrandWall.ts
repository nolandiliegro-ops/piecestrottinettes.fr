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

export type BrandAxis =
  | "performance"
  | "autonomy"
  | "offroad"
  | "comfort"
  | "budget"
  | "lightweight";

// Single source of truth for axis label + icon (reused by chips and tiles)
export const AXIS_UI: Record<BrandAxis, { label: string; icon: string }> = {
  performance: { label: "Performance", icon: "⚡" },
  autonomy: { label: "Autonomie", icon: "🔋" },
  offroad: { label: "Tout-terrain", icon: "🏔️" },
  comfort: { label: "Confort", icon: "🛋️" },
  budget: { label: "Petit prix", icon: "💶" },
  lightweight: { label: "Léger", icon: "🪶" },
};

export interface ChampionInfo {
  model_id: string;
  name: string;
  image_url: string | null;
  score: number | null;
}

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
  sponsored: boolean;
  champions: Record<BrandAxis, ChampionInfo | null>;
}

const BRAND_COLS =
  "id, name, slug, logo_url, country, display_order, signature_color, tile_size, watermark_pos, is_star, entry_style, showcase_model_id, youtube_video_id, sponsored, score_comfort, score_budget, score_lightweight";

const MODEL_COLS =
  "id, brand_id, name, slug, image_url, images, score_performance, score_autonomy, score_perf_adj, score_auto_adj, score_offroad, score_offroad_adj";

interface RawModel {
  id: string;
  brand_id: string | null;
  name: string;
  slug: string;
  image_url: string | null;
  images: unknown;
  score_performance: number | null;
  score_autonomy: number | null;
  score_perf_adj: number | null;
  score_auto_adj: number | null;
  score_offroad: number | null;
  score_offroad_adj: number | null;
}

// Final score = clamp(base + offset, 0, 100); null base means "not scored on this axis"
const finalScore = (
  base: number | null | undefined,
  offset: number | null | undefined
): number | null => {
  if (base === null || base === undefined) return null;
  return Math.min(100, Math.max(0, base + (offset ?? 0)));
};

// A model is eligible as champion only if it has a resolvable photo
const modelPhoto = (m: RawModel): string | null =>
  getPrimaryImage(m.images, m.image_url, "") || null;

type ModelScoreCol = "score_performance" | "score_autonomy" | "score_offroad";
type ModelAdjCol = "score_perf_adj" | "score_auto_adj" | "score_offroad_adj";
type BrandScoreCol = "score_comfort" | "score_budget" | "score_lightweight";

type AxisConfig =
  | { level: "model"; base: ModelScoreCol; adj: ModelAdjCol }
  | { level: "brand"; col: BrandScoreCol };

const AXIS_CONFIG: Record<BrandAxis, AxisConfig> = {
  performance: { level: "model", base: "score_performance", adj: "score_perf_adj" },
  autonomy: { level: "model", base: "score_autonomy", adj: "score_auto_adj" },
  offroad: { level: "model", base: "score_offroad", adj: "score_offroad_adj" },
  comfort: { level: "brand", col: "score_comfort" },
  budget: { level: "brand", col: "score_budget" },
  lightweight: { level: "brand", col: "score_lightweight" },
};

// True when the axis score comes from the brand row (editorial), not from a model
export const isBrandLevelAxis = (axis: BrandAxis): boolean =>
  AXIS_CONFIG[axis].level === "brand";

// Editorial brand score: clamp 0-100; null stays null (not rated -> excluded from filter)
const clampScore = (v: number | null | undefined): number | null =>
  v === null || v === undefined ? null : Math.min(100, Math.max(0, v));

// Champion = brand model with the highest final score that HAS a photo.
// Fallback to the showcase model when no scored-with-photo candidate exists.
const pickChampion = (
  brandModels: RawModel[],
  axis: BrandAxis,
  showcaseId: string | null,
  byId: Map<string, RawModel>,
  brand: any
): ChampionInfo | null => {
  const cfg = AXIS_CONFIG[axis];

  if (cfg.level === "brand") {
    // Score from the brand row; a representative model still provides photo/name.
    const rep =
      (showcaseId ? byId.get(showcaseId) : undefined) ??
      brandModels.find((m) => modelPhoto(m)) ??
      brandModels[0] ??
      null;
    if (!rep) return null;
    return {
      model_id: rep.id,
      name: rep.name,
      image_url: modelPhoto(rep),
      score: clampScore(brand[cfg.col]),
    };
  }

  const { base, adj } = cfg;

  const scored = brandModels
    .filter((m) => modelPhoto(m))
    .map((m) => ({ m, score: finalScore(m[base], m[adj]) }))
    .filter((x): x is { m: RawModel; score: number } => x.score !== null);

  if (scored.length > 0) {
    scored.sort((a, b) => b.score - a.score || a.m.name.localeCompare(b.m.name));
    const top = scored[0];
    return { model_id: top.m.id, name: top.m.name, image_url: modelPhoto(top.m), score: top.score };
  }

  if (showcaseId && byId.has(showcaseId)) {
    const sm = byId.get(showcaseId)!;
    return {
      model_id: sm.id,
      name: sm.name,
      image_url: modelPhoto(sm),
      score: finalScore(sm[base], sm[adj]),
    };
  }

  return null;
};

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
        .select(MODEL_COLS)
        .eq("published", true);
      if (mErr) throw mErr;

      const counts = new Map<string, number>();
      const byId = new Map<string, RawModel>();
      const byBrand = new Map<string, RawModel[]>();
      (models ?? []).forEach((raw: any) => {
        const m = raw as RawModel;
        byId.set(m.id, m);
        if (m.brand_id) {
          counts.set(m.brand_id, (counts.get(m.brand_id) ?? 0) + 1);
          const arr = byBrand.get(m.brand_id) ?? [];
          arr.push(m);
          byBrand.set(m.brand_id, arr);
        }
      });

      const items: BrandWallItem[] = (brands ?? []).map((b: any) => {
        let showcase: string | null = null;
        if (b.showcase_model_id && byId.has(b.showcase_model_id)) {
          showcase = modelPhoto(byId.get(b.showcase_model_id)!);
        }
        const brandModels = byBrand.get(b.id) ?? [];
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
          sponsored: !!b.sponsored,
          champions: Object.fromEntries(
            (Object.keys(AXIS_UI) as BrandAxis[]).map((ax) => [
              ax,
              pickChampion(brandModels, ax, b.showcase_model_id, byId, b),
            ])
          ) as Record<BrandAxis, ChampionInfo | null>,
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
