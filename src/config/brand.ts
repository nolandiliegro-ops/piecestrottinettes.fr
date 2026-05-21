/**
 * Fallback brand assets — used when Supabase brand_assets table
 * is unreachable or when a specific asset_key has no URL yet.
 *
 * Keep these paths in sync with /public/ and src/assets/.
 */
import logoMainLight from "@/assets/logo-pt.png";

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
  logo_main_light: { url: logoMainLight, alt: "Pièces Trottinettes" },
  logo_main_dark: { url: logoMainLight, alt: "Pièces Trottinettes" },
  logo_compact_light: { url: logoMainLight, alt: "Pièces Trottinettes" },
  logo_compact_dark: { url: logoMainLight, alt: "Pièces Trottinettes" },
  favicon: { url: "/favicon.png", alt: "" },
  apple_touch_icon: { url: "/pwa-192x192.png", alt: "" },
  og_image: {
    url: "https://kqsxscjtlipregkrmucg.supabase.co/storage/v1/object/public/site-assets/og-image.png",
    alt: "Pièces Trottinettes",
  },
  watermark_product: { url: "", alt: "" },
};
