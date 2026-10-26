// Image d'aperçu de lien (WhatsApp, Telegram, Messenger…) au gabarit « Vitrine » (choix de Nolan, 26/10/2026).
// Servie par l'Edge Function og-image : l'image de la fiche si elle est générée, sinon l'image par défaut du site.
// Les images sont fabriquées par .github/workflows/og-images.yml (scripts/og/generate.mjs).
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://kqsxscjtlipregkrmucg.supabase.co";

export type OgKind = "scooter" | "part" | "brand" | "category" | "page";

export function ogImage(kind: OgKind, slug?: string | null): string {
  const s = (slug || "default").toLowerCase();
  return `${SUPABASE_URL}/functions/v1/og-image?k=${kind}&s=${encodeURIComponent(s)}`;
}

export const OG_DEFAULT = ogImage("page", "default");
