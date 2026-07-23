// scripts/lib/validate-part-keys.js
// Validation des clés de montage du schéma d'import pièces (contrat — étape 3).
// Module PUR (aucun I/O, aucun env) → testable isolément.
// Miroir côté pièces de validate-brake-keys.js (étape 2, scooters).
//
// Une pièce d'une catégorie « à montage » doit porter parts.fitment_specs (jsonb)
// avec les clés requises de sa catégorie. Tous les champs de valeurs sont des
// TABLEAUX (ensembles acceptés), même à un seul élément. Noms alignés sur les
// colonnes scooter (disc_diameter_code, rim_diameter_code…) sans le suffixe _code :
//
//   brake : disc_diameter [mm, entiers] · disc_pcd [mm, entiers] · disc_holes [entiers]
//   wheel : type "pneumatic"|"solid" · rim_diameter [pouces, strings — codes
//           fitment_rim_diameters] · tire_width [strings] (pneumatique)
//           · rim_width_mm [mm, entiers] (plein)
//
// Clé non sourcée = clé ABSENTE (jamais de valeur inventée). La validation refuse
// aussi tout fitment_specs malformé, y compris hors catégories à clés requises.

/** Clés requises par slug canonique de catégorie. Hors mapping → aucune clé requise. */
export const REQUIRED_KEYS_BY_CATEGORY = {
  'chargeurs': { kind: 'electrical' },
  'pneus': { kind: 'wheel', type: 'pneumatic' },
  // Alias : slug dérivé du NOM de la catégorie en base ("Pneus gonflables", slug "pneus").
  // Un batch peut porter le nom plutôt que le slug (resolveCategoryMatch accepte les deux).
  'pneus-gonflables': { kind: 'wheel', type: 'pneumatic' },
  'chambres-a-air': { kind: 'wheel', type: 'pneumatic' },
  'pneus-pleins': { kind: 'wheel', type: 'solid' },
  'plaquettes': { kind: 'brake' },
  'disques': { kind: 'brake' },
};

export const BRAKE_KEYS = ['disc_diameter', 'disc_pcd', 'disc_holes'];

const DIACRITICS_RE = new RegExp('[\\u0300-\\u036f]', 'g');

/** Slug canonique — même logique NFD que canonicalSlug (bulk-insert-parts). */
export function canonicalCategorySlug(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS_RE, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const isIntArray = (v) => Array.isArray(v) && v.length > 0 && v.every(Number.isInteger);
const isStrArray = (v) =>
  Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === 'string' && x.trim() !== '');

/**
 * Fautes de FORME d'un fitment_specs fourni (indépendant de la catégorie).
 * Retour : liste de libellés "chemin (attendu)" — vide si conforme ou absent.
 */
function fitmentShapeFaults(fs) {
  if (fs == null) return [];
  if (typeof fs !== 'object' || Array.isArray(fs)) return ['fitment_specs (objet attendu)'];
  const faults = [];

  for (const block of Object.keys(fs)) {
    if (block !== 'wheel' && block !== 'brake') faults.push(`fitment_specs.${block} (bloc inconnu)`);
  }

  const brake = fs.brake;
  if (brake != null) {
    if (typeof brake !== 'object' || Array.isArray(brake)) {
      faults.push('fitment_specs.brake (objet attendu)');
    } else {
      for (const k of BRAKE_KEYS) {
        if (brake[k] !== undefined && !isIntArray(brake[k])) {
          faults.push(`brake.${k} (tableau d'entiers attendu)`);
        }
      }
    }
  }

  const wheel = fs.wheel;
  if (wheel != null) {
    if (typeof wheel !== 'object' || Array.isArray(wheel)) {
      faults.push('fitment_specs.wheel (objet attendu)');
    } else {
      if (wheel.type !== undefined && wheel.type !== 'pneumatic' && wheel.type !== 'solid') {
        faults.push('wheel.type ("pneumatic"|"solid" attendu)');
      }
      if (wheel.rim_diameter !== undefined && !isStrArray(wheel.rim_diameter)) {
        faults.push('wheel.rim_diameter (tableau de strings attendu)');
      }
      if (wheel.tire_width !== undefined && !isStrArray(wheel.tire_width)) {
        faults.push('wheel.tire_width (tableau de strings attendu)');
      }
      if (wheel.rim_width_mm !== undefined && !isIntArray(wheel.rim_width_mm)) {
        faults.push('wheel.rim_width_mm (tableau d\'entiers attendu)');
      }
    }
  }

  return faults;
}

/**
 * Clés REQUISES manquantes pour une pièce selon sa catégorie.
 * Retour : liste de libellés — vide si conforme (ou catégorie sans clés requises).
 */
function requiredKeyFaults(part, rule) {
  if (!rule) return [];

  if (rule.kind === 'electrical') {
    return isIntArray(part?.electrical_specs?.voltages) ? [] : ['electrical_specs.voltages'];
  }

  const fs = part?.fitment_specs;
  if (rule.kind === 'brake') {
    const brake = fs?.brake;
    return BRAKE_KEYS.filter((k) => !isIntArray(brake?.[k])).map((k) => `brake.${k}`);
  }

  if (rule.kind === 'wheel') {
    const wheel = fs?.wheel;
    const missing = [];
    if (wheel?.type !== rule.type) missing.push(`wheel.type="${rule.type}"`);
    if (!isStrArray(wheel?.rim_diameter)) missing.push('wheel.rim_diameter');
    if (rule.type === 'pneumatic' && !isStrArray(wheel?.tire_width)) missing.push('wheel.tire_width');
    if (rule.type === 'solid' && !isIntArray(wheel?.rim_width_mm)) missing.push('wheel.rim_width_mm');
    return missing;
  }

  return [];
}

/**
 * Parcourt les batches ({ categoryName, parts }) et liste les pièces dont les
 * clés de montage requises manquent ou dont le fitment_specs est malformé.
 * Retour : [{ categoryName, ref, missing: [...] }] — vide si tout est conforme.
 */
export function findMissingPartKeys(batches) {
  const faults = [];
  for (const batch of batches) {
    const parts = batch?.parts;
    if (!Array.isArray(parts)) continue;
    const slug = canonicalCategorySlug(batch?.categorySlug || batch?.categoryName);
    const rule = REQUIRED_KEYS_BY_CATEGORY[slug];
    for (const p of parts) {
      const missing = [...requiredKeyFaults(p, rule), ...fitmentShapeFaults(p?.fitment_specs)];
      if (missing.length > 0) {
        faults.push({
          categoryName: batch?.categoryName ?? '?',
          ref: p?.slug || p?.name || '(sans slug/name)',
          missing,
        });
      }
    }
  }
  return faults;
}
