// DOUBLON SERVEUR de src/lib/compatibilityStatus.ts (classifyCompat + libellés) — SOURCE = le fichier front.
// Utilisé par chat-skot (SKOT). Toute modification de la règle front doit être reportée ici.
// Règle (doctrine LOT 3, 30/08/2026) :
//   verified   : confidence_level='validated' OU raison « fitment:… » hors « fitment:partial »
//   unverified : 'high' sans raison moteur, ou 'medium' + « fitment:partial »
//   masqué     : tout le reste

export type CompatStatus = "verified" | "unverified";

export function classifyCompat(row: { confidence_level: string | null; suggestion_reason: string | null }): CompatStatus | null {
  const reason = row.suggestion_reason;
  if (row.confidence_level === "validated") return "verified";
  if (reason?.startsWith("fitment:") && !reason.startsWith("fitment:partial")) return "verified";
  if (row.confidence_level === "high") return "unverified";
  if (row.confidence_level === "medium" && reason?.startsWith("fitment:partial")) return "unverified";
  return null;
}

const FLANK = "vérifie la dimension inscrite sur le flanc de ton pneu";

/** Phrase du 🟡 — reprise de unverifiedLabel (front). */
export function unverifiedLabel(reason: string | null): string {
  if (reason?.startsWith("fitment:partial")) {
    const width = reason.includes(" width=?");
    const section = reason.includes(" section=?");
    if (width && section) return `Même diamètre de jante — largeur de jante et section à confirmer, ${FLANK}.`;
    if (width) return "Même diamètre de jante — largeur de jante à confirmer.";
    if (section) return `Même diamètre de jante — section à confirmer, ${FLANK}.`;
    return "Même diamètre, largeur non vérifiée — vérifie le flanc de ton pneu";
  }
  return "Suggestion automatique non vérifiée";
}

/** Raison lisible d'un ✅ (famille de clé). */
export function verifiedReason(reason: string | null): string {
  const r = (reason ?? "").toLowerCase();
  if (r.includes("voltage")) return "vérifié sur le voltage du pack";
  if (r.includes("caliper")) return "vérifié sur la famille d'étrier";
  if (r.includes("disc")) return "vérifié sur le disque (diamètre, entraxe, trous)";
  if (r.includes("solid rim")) return "vérifié sur la roue (diamètre et largeur de jante, section)";
  if (r.includes("rim")) return "vérifié sur la roue (diamètre de jante et section du pneu)";
  return "vérifié par nos ateliers";
}

// Délais — DOUBLON de src/lib/delivery.ts (tenir en phase).
export const STOCK_CATEGORY_SLUGS = ["pneus", "pneus-pleins", "chambres-a-air", "chargeurs", "plaquettes", "disques"];
export const partDelay = (slug: string | null | undefined) =>
  slug && STOCK_CATEGORY_SLUGS.includes(slug) ? "48-72 h" : "3 à 5 jours ouvrés";
