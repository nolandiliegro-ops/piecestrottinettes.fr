// Délais et mode de livraison — source UNIQUE côté front (lot livraison, 24/10/2026).
// Règle de Nolan : ce qui est en stock au magasin part sous 48-72 h ; une pièce commandée
// chez le fournisseur (Wattiz, eWheel…) : 3 à 5 jours ouvrés.
// « En stock magasin » = par catégorie (arbitrage A1) : tout ce qui n'est pas cher et se stocke facilement.
// ⚠️ Règle DUPLIQUÉE dans supabase/functions/create-checkout-session/index.ts (snapshot orders.delivery_estimate).
// Tenir les deux en phase.
import { supabase } from "@/integrations/supabase/client";

export const STOCK_CATEGORY_SLUGS = [
  "pneus",
  "pneus-pleins",
  "chambres-a-air",
  "chargeurs",
  "plaquettes",
  "disques",
] as const;

export const DELAY_STOCK = "48-72 h";
export const DELAY_SUPPLIER = "3 à 5 jours ouvrés";

/** Seul mode proposé à l'ouverture (arbitrage A3) : livraison suivie. */
export const STANDARD_DELIVERY = { id: "standard" as const, name: "Livraison suivie", price: 4.9 };

export function isStockCategory(slug: string | null | undefined): boolean {
  return !!slug && (STOCK_CATEGORY_SLUGS as readonly string[]).includes(slug);
}

/** Délai d'une pièce selon sa catégorie. */
export function partDelay(slug: string | null | undefined): string {
  return isStockCategory(slug) ? DELAY_STOCK : DELAY_SUPPLIER;
}

/** Délai d'un panier : le plus long de ses pièces. Panier vide ou catégorie inconnue → délai fournisseur. */
export function cartDelay(slugs: (string | null | undefined)[]): string {
  return slugs.length > 0 && slugs.every(isStockCategory) ? DELAY_STOCK : DELAY_SUPPLIER;
}

/** Lit les catégories des pièces du panier et renvoie le délai annoncé. */
export async function fetchCartDelay(partIds: string[]): Promise<string> {
  if (partIds.length === 0) return DELAY_SUPPLIER;
  const { data, error } = await supabase
    .from("parts")
    .select("id, categories(slug)")
    .in("id", partIds);
  if (error || !data || data.length !== new Set(partIds).size) return DELAY_SUPPLIER;
  return cartDelay(
    data.map((p) => (p as { categories: { slug: string | null } | null }).categories?.slug ?? null),
  );
}
