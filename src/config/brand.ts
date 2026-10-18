/**
 * Fallback brand assets — used when Supabase brand_assets table
 * is unreachable or when a specific asset_key has no URL yet.
 *
 * Keep these paths in sync with /public/ and src/assets/.
 */

export type BrandAssetKey =
  | "logo_main_light"
  | "logo_main_dark"
  | "logo_compact_light"
  | "logo_compact_dark"
  | "favicon"
  | "apple_touch_icon"
  | "og_image"
  | "watermark_product";

export const BRAND_ASSETS_FALLBACK: Record<BrandAssetKey, { url: string; alt: string }> = {
  logo_main_light: { url: "/brand/logo-pt-2026.png", alt: "piecestrottinettes.fr" },
  logo_main_dark: { url: "/brand/logo-pt-2026-negatif.png", alt: "piecestrottinettes.fr" },
  logo_compact_light: { url: "/brand/logo-pt-2026.png", alt: "piecestrottinettes.fr" },
  logo_compact_dark: { url: "/brand/logo-pt-2026-negatif.png", alt: "piecestrottinettes.fr" },
  favicon: { url: "/brand/favicon-pt.png", alt: "" },
  apple_touch_icon: { url: "/brand/apple-touch-icon.png", alt: "" },
  og_image: {
    url: "https://kqsxscjtlipregkrmucg.supabase.co/storage/v1/object/public/site-assets/og-image.png",
    alt: "Pièces Trottinettes",
  },
  watermark_product: { url: "", alt: "" },
};
