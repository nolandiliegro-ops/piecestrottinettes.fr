// scripts/lib/validate-brake-keys.js
// Validation des clés de montage frein du schéma d'import scooters.
// Module PUR (aucun I/O, aucun env) → testable isolément.
//
// Contrat d'import — étape 2 : chaque scooter doit porter les 3 clés frein
// en ENTIERS NUS (mêmes unités que les colonnes scooter_models.disc_*_code) :
//   disc_diameter : Ø disque en mm    (ex. 160)
//   disc_pcd      : entraxe en mm     (ex. 48)
//   disc_holes    : nombre de trous   (ex. 6)

export const BRAKE_KEYS = ['disc_diameter', 'disc_pcd', 'disc_holes'];

/**
 * Parcourt les batches ({ brandName, scooters|models }) et liste les scooters
 * dont une clé frein est absente ou non entière.
 * Retour : [{ brandName, ref, missing: [...] }] — vide si tout est conforme.
 */
export function findMissingBrakeKeys(batches) {
  const faults = [];
  for (const batch of batches) {
    const items = batch?.scooters ?? batch?.models ?? [];
    if (!Array.isArray(items)) continue;
    for (const s of items) {
      const missing = BRAKE_KEYS.filter((k) => !Number.isInteger(s?.[k]));
      if (missing.length > 0) {
        faults.push({
          brandName: batch?.brandName ?? '?',
          ref: s?.slug || s?.name || '(sans slug/name)',
          missing,
        });
      }
    }
  }
  return faults;
}
