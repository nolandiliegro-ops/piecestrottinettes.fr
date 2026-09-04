// Bareme des packs li-ion : SOURCE UNIQUE du voltage cote client.
// Aucun composant ne hardcode une valeur de voltage — tout passe par ici.
// M-A7a (05/09/2026).

/** Bareme des packs li-ion reellement commercialises. Rien d'autre n'est un nominal. */
export const CANONICAL_VOLTAGES = [24, 36, 48, 52, 60, 72, 84] as const;

/**
 * Valeur ambigue du champ : chez les fournisseurs, « chargeur 84 V » designe
 * la sortie 84,0 V d'un pack 72 V nominal (Storm, Ultra 2, X2, Zero 11X) AUTANT
 * que le pack 84 V nominal de la Storm LTD. On ne tranche pas a l'aveugle.
 */
const AMBIGUOUS_VOLTAGE = 84;

/** Nominal -> tension de fin de charge (nS x 4,2 V). Table lue sur des etiquettes, pas calculee. */
const CHARGE_VOLTAGE: Record<number, number> = {
  24: 29.4, //  7S
  36: 42, // 10S
  48: 54.6, // 13S
  52: 58.8, // 14S
  60: 67.2, // 16S
  72: 84, // 20S
  // 84 V (23S) : derivation volontairement absente.
  // La theorie donne 96,6 V (23S x 4,2). Le doc d'audit du 02/09 note
  // "environ 95 V". Aucune des deux valeurs n'a ete verifiee sur
  // l'etiquette d'un chargeur d'origine Minimotors (Dualtron Storm LTD).
  // Un ecart de 1,6 V affiche au client sur une pastille destinee a etre
  // comparee a son etiquette produit un faux negatif silencieux : il
  // conclut que ce n'est pas le bon chargeur et n'achete pas.
  // 84 est par ailleurs la valeur ambigue du champ (sortie 84,0 V d'un
  // pack 72 V vs pack 84 V nominal) et est deja exclue du verdict auto.
  // A completer uniquement quand la valeur aura ete lue sur un chargeur
  // d'origine, pas deduite.
};

export function isCanonicalVoltage(v: number): boolean {
  return (CANONICAL_VOLTAGES as readonly number[]).includes(v);
}

/**
 * Tension de fin de charge du pack, ou null.
 * null n'est PAS une erreur : c'est l'etat legitime « on ne sait pas » (hors
 * bareme, ou 84 V non mesure). Les appelants le gerent explicitement — pas de
 * valeur par defaut, pas de 0, pas de `!`, pas de cast.
 */
export function chargeVoltageOf(nominal: number): number | null {
  const v = CHARGE_VOLTAGE[nominal];
  return v === undefined ? null : v;
}

/** "29,4 V" — virgule FR, une decimale. */
export function formatVolts(v: number): string {
  return `${v.toFixed(1).replace(".", ",")} V`;
}

/**
 * Garde-fous #1 + #2. false => la piece sort du verdict automatique
 * (ni ✅ ni ❌ : etat neutre « on verifie »).
 *
 * Raison d'etre : parts.electrical_specs.voltages vient du champ Airtable
 * "Voltages compatibles", saisi a la main — il peut contenir une tension de
 * SORTIE la ou on attend un nominal. Cas avere : SP-186 "Chargeur 63V
 * Inmotion S1/S1F" ; 63,0 V est la fin de charge d'un pack 15S (55,5 V
 * nominal), et l'Inmotion S1 est un 15S. La valeur saisie n'est donc pas un
 * nominal. Une valeur hors bareme est du bruit de saisie, pas un pack exotique.
 *
 *   voltages vide/absent   -> true   (pneu, disque... aucune affirmation de
 *                                     voltage a proteger, le verdict reste
 *                                     decide ailleurs)
 *   une valeur hors bareme -> false  (bruit de saisie, cf. SP-186)
 *   contient 84            -> false  (sortie d'un pack 72 OU nominal Storm LTD)
 */
export function isVerdictSafe(voltages: number[] | null | undefined): boolean {
  if (!Array.isArray(voltages) || voltages.length === 0) return true;
  return voltages.every((v) => isCanonicalVoltage(v) && v !== AMBIGUOUS_VOLTAGE);
}
