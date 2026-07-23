// scripts/_test-validate-part-keys.mjs
// Tests du module pur validate-part-keys.js (aucun réseau, aucun env).
// Usage : node scripts/_test-validate-part-keys.mjs

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { findMissingPartKeys, canonicalCategorySlug } from './lib/validate-part-keys.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

let failures = 0;
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? '✅' : '❌'} ${label}`);
  if (!ok) {
    failures++;
    console.log(`   attendu : ${JSON.stringify(expected)}`);
    console.log(`   obtenu  : ${JSON.stringify(actual)}`);
  }
}

// ── canonicalCategorySlug ──────────────────────────────────────────────────────
check('slug: "Chambres à Air" → chambres-a-air', canonicalCategorySlug('Chambres à Air'), 'chambres-a-air');
check('slug: "Pneus gonflables" → pneus-gonflables', canonicalCategorySlug('Pneus gonflables'), 'pneus-gonflables');

// ── Catégorie sans clés requises → aucune faute ───────────────────────────────
check(
  'garde-boue (catégorie libre) : conforme',
  findMissingPartKeys([{ categoryName: 'Accessoires divers', parts: [{ slug: 'garde-boue-x' }] }]),
  [],
);

// ── Frein : disque conforme / manquant ────────────────────────────────────────
const disqueOk = {
  slug: 'disque-160-6t',
  fitment_specs: { brake: { disc_diameter: [160], disc_pcd: [48], disc_holes: [6] } },
};
check(
  'disque avec les 3 clés brake : conforme',
  findMissingPartKeys([{ categoryName: 'Disques', parts: [disqueOk] }]),
  [],
);
check(
  'disque sans fitment_specs : 3 fautes brake',
  findMissingPartKeys([{ categoryName: 'Disques', parts: [{ slug: 'disque-nu' }] }]),
  [{ categoryName: 'Disques', ref: 'disque-nu', missing: ['brake.disc_diameter', 'brake.disc_pcd', 'brake.disc_holes'] }],
);
check(
  'plaquettes ensembles acceptés [140,160] : conforme',
  findMissingPartKeys([{
    categoryName: 'Plaquettes',
    parts: [{ slug: 'plaq-sm', fitment_specs: { brake: { disc_diameter: [140, 160], disc_pcd: [48], disc_holes: [6] } } }],
  }]),
  [],
);
check(
  'brake.disc_diameter non entier ("160") : refusé',
  findMissingPartKeys([{
    categoryName: 'Disques',
    parts: [{ slug: 'disque-str', fitment_specs: { brake: { disc_diameter: ['160'], disc_pcd: [48], disc_holes: [6] } } }],
  }]),
  [{ categoryName: 'Disques', ref: 'disque-str', missing: ['brake.disc_diameter', "brake.disc_diameter (tableau d'entiers attendu)"] }],
);

// ── Roue pneumatique ──────────────────────────────────────────────────────────
const pneuOk = {
  slug: 'pneu-10x2125',
  fitment_specs: { wheel: { type: 'pneumatic', rim_diameter: ['10'], tire_width: ['2.125', '2.5'] } },
};
check(
  'pneu pneumatic complet : conforme',
  findMissingPartKeys([{ categoryName: 'Pneus gonflables', parts: [pneuOk] }]),
  [],
);
check(
  'chambre à air sans dims : fautes wheel',
  findMissingPartKeys([{ categoryName: 'Chambres à Air', parts: [{ slug: 'chambre-10' }] }]),
  [{ categoryName: 'Chambres à Air', ref: 'chambre-10', missing: ['wheel.type="pneumatic"', 'wheel.rim_diameter', 'wheel.tire_width'] }],
);

// ── Roue pleine (largeur de JANTE en mm) ──────────────────────────────────────
check(
  'pneu plein complet : conforme',
  findMissingPartKeys([{
    categoryName: 'Pneus pleins',
    parts: [{ slug: 'pnp-85x2', fitment_specs: { wheel: { type: 'solid', rim_diameter: ['5.5'], rim_width_mm: [36] } } }],
  }]),
  [],
);
check(
  'pneu plein avec type pneumatic : refusé',
  findMissingPartKeys([{
    categoryName: 'Pneus pleins',
    parts: [{ slug: 'pnp-mauvais-type', fitment_specs: { wheel: { type: 'pneumatic', rim_diameter: ['5.5'], rim_width_mm: [36] } } }],
  }]),
  [{ categoryName: 'Pneus pleins', ref: 'pnp-mauvais-type', missing: ['wheel.type="solid"'] }],
);

// ── Électrique (chargeurs) ────────────────────────────────────────────────────
check(
  'chargeur avec electrical_specs.voltages : conforme',
  findMissingPartKeys([{ categoryName: 'Chargeurs', parts: [{ slug: 'chg-52v', electrical_specs: { voltages: [52], connector: 'GX16' } }] }]),
  [],
);
check(
  'chargeur sans voltages : faute electrical',
  findMissingPartKeys([{ categoryName: 'Chargeurs', parts: [{ slug: 'chg-nu' }] }]),
  [{ categoryName: 'Chargeurs', ref: 'chg-nu', missing: ['electrical_specs.voltages'] }],
);

// ── Forme : fitment_specs malformé refusé même hors catégorie à clés ──────────
check(
  'bloc inconnu refusé partout',
  findMissingPartKeys([{ categoryName: 'Accessoires divers', parts: [{ slug: 'acc-x', fitment_specs: { moteur: {} } }] }]),
  [{ categoryName: 'Accessoires divers', ref: 'acc-x', missing: ['fitment_specs.moteur (bloc inconnu)'] }],
);
check(
  'batch par categorySlug (prioritaire sur categoryName)',
  findMissingPartKeys([{ categoryName: 'Nom Farfelu', categorySlug: 'disques', parts: [{ slug: 'd-1' }] }]),
  [{ categoryName: 'Nom Farfelu', ref: 'd-1', missing: ['brake.disc_diameter', 'brake.disc_pcd', 'brake.disc_holes'] }],
);

// ── Fichier exemple de référence : doit passer la validation tel quel ─────────
const example = JSON.parse(
  readFileSync(resolve(__dirname, 'data/disque-160-example.json'), 'utf-8'),
);
check('scripts/data/disque-160-example.json : conforme', findMissingPartKeys(example), []);

console.log(failures === 0 ? '\nTous les tests passent.' : `\n${failures} échec(s).`);
process.exit(failures === 0 ? 0 : 1);
