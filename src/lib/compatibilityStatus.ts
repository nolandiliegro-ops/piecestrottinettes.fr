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

// ---------------------------------------------------------------------------
// PNEUS PLEINS — état de la TROTTE (décision 16/09). Une trotte pneumatique
// peut passer en plein ('yes'), ne pas pouvoir ('no') ou on ne sait pas (NULL).
// Aucune ligne part_compatibility n'existe pour une trotte 'no' : cet état se
// lit sur scooter_models, jamais sur les lignes. classifyCompat ne change pas.
// ---------------------------------------------------------------------------

export type SolidConversionState = "blocked" | "unknown" | "ok";

export function solidConversionState(s: {
  tire_family: string | null | undefined;
  solid_conversion: string | null | undefined;
}): SolidConversionState {
  if (s.tire_family === "solid" || s.solid_conversion === "yes") return "ok";
  if (s.solid_conversion === "no") return "blocked";
  return "unknown";
}

/**
 * Clés manquantes nommées dans une raison « fitment:partial rim=… width=? section=? »
 * (moteur K pneus pleins, 16/09). Une raison partial sans drapeau = ancienne
 * grammaire pneumatique (section absente d'un côté).
 */
function partialMissing(reason: string | null): { width: boolean; section: boolean } {
  if (!reason?.startsWith("fitment:partial")) return { width: false, section: false };
  return { width: reason.includes(" width=?"), section: reason.includes(" section=?") };
}

const FLANK = "vérifie la dimension inscrite sur le flanc de ton pneu";

function partialSentence(missing: { width: boolean; section: boolean }): string | null {
  if (missing.width && missing.section) {
    return `Même diamètre de jante — largeur de jante et section à confirmer, ${FLANK}.`;
  }
  if (missing.width) return "Même diamètre de jante — largeur de jante à confirmer.";
  if (missing.section) return `Même diamètre de jante — section à confirmer, ${FLANK}.`;
  return null;
}

/** Libellé du 🟡 — texte ≥14px à l'écran, jamais un badge ni un pourcentage. */
export function unverifiedLabel(reason: string | null): string {
  if (reason?.startsWith("fitment:partial")) {
    return partialSentence(partialMissing(reason)) ??
      "Même diamètre, largeur non vérifiée — vérifie le flanc de ton pneu";
  }
  // M-A7a : raison sentinelle posée côté PDP quand isVerdictSafe() refuse le
  // verdict auto (voltage hors barème, ou 84 V ambigu). Jamais écrite en base.
  if (reason?.startsWith("voltage:")) {
    return "Voltage de cette pièce à confirmer — on vérifie avant de l'affirmer";
  }
  return "Suggestion automatique non vérifiée";
}

// ---------------------------------------------------------------------------
// LIBELLÉS DE GROUPE — une phrase pour un ENSEMBLE de lignes, jamais une par
// ligne. Sur le chargeur 36 V, les 18 modèles viennent tous de la même clé
// (`fitment:voltage=36`) : la raison se dit une fois, en tête de section.
// Ces fonctions ne classent RIEN — classifyCompat reste la règle unique.
// ---------------------------------------------------------------------------

export type KeyFamily = "voltage" | "wheel" | "solid_wheel" | "disc" | "caliper" | "partial";

/** Famille de clé de montage portée par une raison moteur, sinon null. */
export function reasonKeyFamily(reason: string | null): KeyFamily | null {
  if (!reason) return null;
  // Grammaire réelle relevée en base le 09/09 (436 lignes) :
  //   fitment:voltage=36 · fitment:pneumatic rim=6.5 section=10x2.125
  //   fitment:disc d=160 pcd=44 holes=6 · fitment_key:brake caliper=zoom
  //   fitment_key:brake disc=160/48/6 · fitment_key:pneumatic rim=6.5 section=90/65
  // On teste des PRÉFIXES : « disc d=… » et « brake caliper=… » ne se laissent
  // pas découper par une capture générique.
  const m = /^fitment(?:_key)?:\s*(.*)$/i.exec(reason);
  if (!m) return null;
  const rest = m[1].toLowerCase();
  if (rest.startsWith("partial")) return "partial";
  if (rest.startsWith("voltage")) return "voltage";
  if (rest.startsWith("brake caliper") || rest.startsWith("caliper")) return "caliper";
  if (rest.startsWith("brake disc") || rest.startsWith("disc")) return "disc";
  // Pneu plein (16/09) : « fitment:solid rim=6.5 width=44mm section=10x2.50 »
  // — la clé prouvée inclut la largeur de jante, le libellé doit le dire.
  if (rest.startsWith("solid rim")) return "solid_wheel";
  if (rest.startsWith("pneumatic rim") || rest.startsWith("rim")) return "wheel";
  return null;
}

/**
 * Phrase unique en tête de la section ✅. Si les lignes ne partagent pas la
 * même clé, on ne bricole pas une raison composite : on reste factuel.
 */
export function verifiedGroupLabel(reasons: (string | null)[]): string {
  // Une raison vide = validation humaine sans raison machine. Absence
  // d'information, pas contradiction : elle ne doit pas effacer la clé des
  // autres lignes. Mesuré le 09/09 sur le chargeur GX16 (17 voltage + 1 vide).
  const families = new Set(reasons.filter((r) => r).map(reasonKeyFamily));
  if (families.size === 1) {
    switch ([...families][0]) {
      case "voltage":
        return "Vérifié sur le voltage — le chargeur correspond au pack de ces machines.";
      case "wheel":
        return "Vérifié sur la roue — diamètre de jante et section du pneu.";
      case "solid_wheel":
        return "Vérifié sur la roue — diamètre et largeur de jante, section du pneu.";
      case "disc":
        return "Vérifié sur le disque — diamètre, entraxe et nombre de trous.";
      case "caliper":
        return "Vérifié sur la famille d'étrier de frein.";
    }
  }
  return "Vérifié par nos ateliers.";
}

/**
 * Phrase unique en tête de la section 🟡. Elle donne la RAISON du doute, jamais
 * un pourcentage, et ne doit jamais ressembler à une validation.
 */
export function unverifiedGroupLabel(reasons: (string | null)[]): string {
  // Une raison vide = validation humaine sans raison machine. Absence
  // d'information, pas contradiction : elle ne doit pas effacer la clé des
  // autres lignes. Mesuré le 09/09 sur le chargeur GX16 (17 voltage + 1 vide).
  const families = new Set(reasons.filter((r) => r).map(reasonKeyFamily));
  if (families.size === 1) {
    switch ([...families][0]) {
      case "partial": {
        // Union des clés manquantes sur l'ensemble des lignes du groupe.
        const missing = reasons.map(partialMissing).reduce(
          (acc, m) => ({ width: acc.width || m.width, section: acc.section || m.section }),
          { width: false, section: false },
        );
        return partialSentence(missing) ??
          "Même diamètre de jante, largeur non vérifiée — vérifie la dimension inscrite sur le flanc de ton pneu.";
      }
      case "voltage":
        return "Voltage à confirmer — on vérifie avant de l'affirmer.";
    }
  }
  if (reasons.some((r) => r && !reasonKeyFamily(r))) {
    return "Le modèle est cité par le fournisseur, mais la cote n'a pas encore été confirmée par nos ateliers.";
  }
  return "Compatibilité probable, pas encore confirmée par nos ateliers.";
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
