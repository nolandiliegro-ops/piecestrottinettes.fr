// Comptoir Pro (25/10/2026) — accès des magasins revendeurs par lien perso (envoyé sur WhatsApp).
// Toutes les lectures/écritures passent par des fonctions SECURITY DEFINER qui prennent le jeton du lien :
// le prix d'achat ne quitte jamais la base, le prix pro est recalculé côté serveur à chaque appel.
import { supabase } from "@/integrations/supabase/client";

export const PRO_TOKEN_KEY = "pt-pro-token";

export type ProPalier = { code: string; nom: string; remise_pct: number };
export type ProCycle = { cloture: string; retrait: string };
export type ProCartLine = { part_id: string; name: string; sku: string | null; image_url: string | null; quantite: number; prix_pro_ht: number; stock: number };
export type ProCart = { lignes: ProCartLine[]; sous_total_ht: number; tva: number; total_ttc: number; cycle: ProCycle; note: string | null };
export type ProMe = {
  nom_magasin: string;
  contact_nom: string | null;
  palier: ProPalier;
  ca_12m_ht: number;
  suivant: { nom: string; remise_pct: number; seuil_ca_ht: number; reste_ht: number } | null;
  cycle: ProCycle;
  panier: ProCart;
};
export type ProPiece = {
  part_id: string; name: string; slug: string | null; sku: string | null; ean: string | null; image_url: string | null;
  category_id: string | null; prix_public_ht: number; prix_pro_ht: number; stock: number; deja_commande: number;
};
export type ProOrder = {
  order_number: string; status: string; created_at: string; retrait_prevu: string | null; total_ttc: number; payment_method: string | null;
  lignes: { part_id: string | null; name: string; image_url: string | null; quantite: number; prix_ht: number }[] | null;
};

/** Lit le jeton : celui de l'URL d'abord (et on le garde sur le téléphone), sinon celui déjà gardé. */
export function resolveProToken(fromUrl: string | undefined): string | null {
  const clean = (fromUrl || "").trim();
  if (/^[a-f0-9]{40,128}$/i.test(clean)) {
    try { localStorage.setItem(PRO_TOKEN_KEY, clean); } catch { /* navigation privée */ }
    return clean;
  }
  try { return localStorage.getItem(PRO_TOKEN_KEY); } catch { return null; }
}

export function forgetProToken() {
  try { localStorage.removeItem(PRO_TOKEN_KEY); } catch { /* ignore */ }
}

/** Message lisible pour un pro, à partir de l'erreur renvoyée par la base. */
export function proErrorMessage(e: unknown): string {
  const m = String((e as { message?: string })?.message ?? e ?? "");
  if (m.includes("lien invalide")) return "Ce lien ne marche plus. Demande un nouveau lien à Nolan sur WhatsApp.";
  if (m.includes("compte en pause")) return "Ton compte pro est en pause. Appelle Nolan pour le réactiver.";
  if (m.includes("panier vide")) return "Ton panier est vide.";
  if (m.includes("pièce introuvable")) return "Cette pièce n'est plus disponible.";
  return "Problème de connexion. Réessaie dans un instant.";
}

const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);

function normCart(c: Record<string, unknown> | null | undefined): ProCart {
  const lignes = Array.isArray(c?.lignes) ? (c!.lignes as Record<string, unknown>[]) : [];
  return {
    lignes: lignes.map((l) => ({
      part_id: String(l.part_id), name: String(l.name ?? ""), sku: (l.sku as string) ?? null, image_url: (l.image_url as string) ?? null,
      quantite: num(l.quantite), prix_pro_ht: num(l.prix_pro_ht), stock: num(l.stock),
    })),
    sous_total_ht: num(c?.sous_total_ht), tva: num(c?.tva), total_ttc: num(c?.total_ttc),
    cycle: (c?.cycle as ProCycle) ?? { cloture: "", retrait: "" }, note: (c?.note as string) ?? null,
  };
}

export async function proMe(token: string): Promise<ProMe> {
  const { data, error } = await supabase.rpc("pro_t_me", { p_token: token });
  if (error) throw error;
  const d = data as Record<string, unknown>;
  return { ...(d as unknown as ProMe), ca_12m_ht: num(d.ca_12m_ht), panier: normCart(d.panier as Record<string, unknown>) };
}

export async function proCatalogue(token: string): Promise<ProPiece[]> {
  const { data, error } = await supabase.rpc("pro_t_catalogue", { p_token: token });
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map((p) => ({
    part_id: String(p.part_id), name: String(p.name ?? ""), slug: (p.slug as string) ?? null, sku: (p.sku as string) ?? null,
    ean: (p.ean as string) ?? null, image_url: (p.image_url as string) ?? null, category_id: (p.category_id as string) ?? null,
    prix_public_ht: num(p.prix_public_ht), prix_pro_ht: num(p.prix_pro_ht), stock: num(p.stock), deja_commande: num(p.deja_commande),
  }));
}

export async function proCartSet(token: string, partId: string, quantite: number): Promise<ProCart> {
  const { data, error } = await supabase.rpc("pro_t_cart_set", { p_token: token, p_part: partId, p_quantite: quantite });
  if (error) throw error;
  return normCart(data as Record<string, unknown>);
}

export async function proCommander(token: string, note: string | null): Promise<{ order_number: string; total_ttc: number; retrait: string }> {
  const { data, error } = await supabase.rpc("pro_t_commander", { p_token: token, p_note: note ?? undefined });
  if (error) throw error;
  const d = data as Record<string, unknown>;
  return { order_number: String(d.order_number), total_ttc: num(d.total_ttc), retrait: String(d.retrait ?? "") };
}

export async function proCommandes(token: string): Promise<ProOrder[]> {
  const { data, error } = await supabase.rpc("pro_t_commandes", { p_token: token });
  if (error) throw error;
  return ((data ?? []) as unknown as ProOrder[]).map((o) => ({ ...o, total_ttc: num(o.total_ttc) }));
}

export const PRO_STATUS_LABEL: Record<string, string> = {
  a_regler_retrait: "En préparation",
  prete: "Prête au magasin",
  retiree_payee: "Retirée et payée",
  cancelled: "Annulée",
};

export const eurFR = (v: number) => `${(Number.isFinite(v) ? v : 0).toFixed(2).replace(".", ",")} €`;

export const jourFR = (d: string | null | undefined) =>
  d ? new Date(`${d.slice(0, 10)}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) : "";
