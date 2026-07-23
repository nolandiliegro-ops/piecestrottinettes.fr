// scripts/lib/validate-part-keys.js
// Validation des clés de montage du schéma d'import pièces (contrat — étape 3, schéma v2).
// Module PUR (aucun I/O, aucun env) → testable isolément.
// Miroir côté pièces de validate-brake-keys.js (étape 2, scooters).
//
// Schéma v2 de parts.fitment_specs (jsonb) : STRINGS/CODES partout, alignés sur
// les tables de référence Supabase fitment_* ; les tableaux sont des ensembles
// de valeurs acceptées (même à 1 élément) :
//   tire_family   : "pneumatic" | "solid" (scalaire)
//   rim_diameters : [] codes fitment_rim_diameters (ex "6.5", "134mm")
//   tire_sections : [] codes fitment_tire_sections (ex "90/65", "8.5x2", "8x4")
//   brake_disc    : { diameters: [], pcds: [], holes: [] } codes fitment_disc_*
//   brake_caliper : [] codes fitment_caliper_families (ex "nutt_4p", "zoom")
//
// Clé non sourcée = clé ABSENTE (jamais de valeur inventée). La validation refuse
// aussi tout fitment_specs malformé, y compris hors catégories à clés requises.

/** Clés requises par slug canonique de catégorie. Hors mapping → aucune clé requise. */
export const REQUIRED_KEYS_BY_CATEGORY = {
  'chargeurs': { kind: 'electrical' },
  'pneus': { kind: 'tire', family: 'pneumatic' },
  // Alias : slug dérivé du NOM de la catégorie en base ("Pneus gonflables", slug "pneus").
  // Un batch peut porter le nom plutôt que le slug (resolveCategoryMatch accepte les deux).
  'pneus-gonflables': { kind: 'tire', family: 'pneumatic' },
  'chambres-a-air': { kind: 'tire', family: 'pneumatic' },
  'pneus-pleins': { kind: 'tire', family: 'solid' },
  'plaquettes': { kind: 'caliper' },
  'disques': { kind: 'disc' },
};

export const BRAKE_DISC_KEYS = ['diameters', 'pcds', 'holes'];
export const TIRE_FAMILIES = ['pneumatic', 'solid'];

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

const FITMENT_BLOCKS = ['tire_family', 'rim_diameters', 'tire_sections', 'brake_disc', 'brake_caliper'];

/**
 * Fautes de FORME d'un fitment_specs fourni (indépendant de la catégorie).
 * Retour : liste de libellés "chemin (attendu)" — vide si conforme ou absent.
 */
function fitmentShapeFaults(fs) {
  if (fs == null) return [];
  if (typeof fs !== 'object' || Array.isArray(fs)) return ['fitment_specs (objet attendu)'];
  const faults = [];

  for (const block of Object.keys(fs)) {
    if (!FITMENT_BLOCKS.includes(block)) faults.push(`fitment_specs.${block} (bloc inconnu)`);
  }

  if (fs.tire_family !== undefined && !TIRE_FAMILIES.includes(fs.tire_family)) {
    faults.push('tire_family ("pneumatic"|"solid" attendu)');
  }
  if (fs.rim_diameters !== undefined && !isStrArray(fs.rim_diameters)) {
    faults.push('rim_diameters (tableau de codes strings attendu)');
  }
  if (fs.tire_sections !== undefined && !isStrArray(fs.tire_sections)) {
    faults.push('tire_sections (tableau de codes strings attendu)');
  }
  if (fs.brake_caliper !== undefined && !isStrArray(fs.brake_caliper)) {
    faults.push('brake_caliper (tableau de codes strings attendu)');
  }

  const disc = fs.brake_disc;
  if (disc !== undefined) {
    if (disc == null || typeof disc !== 'object' || Array.isArray(disc)) {
      faults.push('brake_disc (objet attendu)');
    } else {
      for (const k of Object.keys(disc)) {
        if (!BRAKE_DISC_KEYS.includes(k)) faults.push(`brake_disc.${k} (clé inconnue)`);
      }
      for (const k of BRAKE_DISC_KEYS) {
        if (disc[k] !== undefined && !isStrArray(disc[k])) {
          faults.push(`brake_disc.${k} (tableau de codes strings attendu)`);
        }
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

  if (rule.kind === 'tire') {
    const missing = [];
    if (fs?.tire_family !== rule.family) missing.push(`tire_family="${rule.family}"`);
    if (!isStrArray(fs?.rim_diameters)) missing.push('rim_diameters');
    if (!isStrArray(fs?.tire_sections)) missing.push('tire_sections');
    return missing;
  }

  if (rule.kind === 'disc') {
    return BRAKE_DISC_KEYS.filter((k) => !isStrArray(fs?.brake_disc?.[k])).map((k) => `brake_disc.${k}`);
  }

  if (rule.kind === 'caliper') {
    return isStrArray(fs?.brake_caliper) ? [] : ['brake_caliper'];
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
