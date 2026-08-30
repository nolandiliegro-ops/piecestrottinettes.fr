// Règle UNIQUE de classification des lignes part_compatibility côté client.
// Doctrine LOT 3 (30/08/2026, arbitrée) :
//   ✅ verified   : confidence_level='validated' (curation admin), OU raison
//                   moteur K « fitment:… » hors « fitment:partial » (clé prouvée).
//   🟡 unverified : high sans raison (backfill legacy) ou avec raison texte
//                   (IA Passe B) ; medium « fitment:partial » (Ø jante ok,
//                   largeur non vérifiée).
//   masqué (null) : tout le reste — low, medium sans fitment:partial.
// NB : pas de colonne booléenne `validated` en base — c'est une valeur de
// confidence_level. Aucun hook/écran ne réimplémente cette logique.

export type CompatStatus = "verified" | "unverified";

export interface CompatRow {
  confidence_level: string | null;
  suggestion_reason: string | null;
}

export function classifyCompat(row: CompatRow): CompatStatus | null {
  const reason = row.suggestion_reason;
  if (row.confidence_level === "validated") return "verified";
  if (reason?.startsWith("fitment:") && !reason.startsWith("fitment:partial")) {
    return "verified";
  }
  if (row.confidence_level === "high") return "unverified";
  if (row.confidence_level === "medium" && reason?.startsWith("fitment:partial")) {
    return "unverified";
  }
  return null;
}

/** Libellé du 🟡 — texte ≥14px à l'écran, jamais un badge ni un pourcentage. */
export function unverifiedLabel(reason: string | null): string {
  return reason?.startsWith("fitment:partial")
    ? "Même diamètre, largeur non vérifiée — vérifie le flanc de ton pneu"
    : "Suggestion automatique non vérifiée";
}

/** Ventile une liste : les lignes masquées tombent. */
export function partitionCompat<T extends CompatRow>(
  rows: T[],
): { verified: T[]; unverified: T[] } {
  const verified: T[] = [];
  const unverified: T[] = [];
  for (const row of rows) {
    const status = classifyCompat(row);
    if (status === "verified") verified.push(row);
    else if (status === "unverified") unverified.push(row);
  }
  return { verified, unverified };
}
