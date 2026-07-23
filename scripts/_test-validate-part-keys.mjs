// scripts/_test-validate-part-keys.mjs
// Tests du module pur validate-part-keys.js — schéma fitment_specs v2 (codes
// strings alignés référentiels fitment_*). Aucun réseau, aucun env.
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

// ── Disques : brake_disc en codes strings ─────────────────────────────────────
const disqueOk = {
  slug: 'disque-160-6t',
  fitment_specs: { brake_disc: { diameters: ['160'], pcds: ['48'], holes: ['6'] } },
};
check(
  'disque avec brake_disc complet : conforme',
  findMissingPartKeys([{ categoryName: 'Disques', parts: [disqueOk] }]),
  [],
);
check(
  'disque sans fitment_specs : 3 fautes brake_disc',
  findMissingPartKeys([{ categoryName: 'Disques', parts: [{ slug: 'disque-nu' }] }]),
  [{ categoryName: 'Disques', ref: 'disque-nu', missing: ['brake_disc.diameters', 'brake_disc.pcds', 'brake_disc.holes'] }],
);
check(
  'disque ensembles acceptés ["140","160"] : conforme',
  findMissingPartKeys([{
    categoryName: 'Disques',
    parts: [{ slug: 'disque-multi', fitment_specs: { brake_disc: { diameters: ['140', '160'], pcds: ['48'], holes: ['6'] } } }],
  }]),
  [],
);
check(
  'brake_disc.diameters en ENTIERS (ancien schéma) : refusé',
  findMissingPartKeys([{
    categoryName: 'Disques',
    parts: [{ slug: 'disque-int', fitment_specs: { brake_disc: { diameters: [160], pcds: ['48'], holes: ['6'] } } }],
  }]),
  [{ categoryName: 'Disques', ref: 'disque-int', missing: ['brake_disc.diameters', 'brake_disc.diameters (tableau de codes strings attendu)'] }],
);

// ── Plaquettes : brake_caliper requis, géométrie disque NON requise ───────────
check(
  'plaquettes avec brake_caliper seul : conforme (géométrie non requise)',
  findMissingPartKeys([{
    categoryName: 'Plaquettes',
    parts: [{ slug: 'plaq-zoom', fitment_specs: { brake_caliper: ['zoom'] } }],
  }]),
  [],
);
check(
  'plaquettes sans brake_caliper : faute',
  findMissingPartKeys([{ categoryName: 'Plaquettes', parts: [{ slug: 'plaq-nue' }] }]),
  [{ categoryName: 'Plaquettes', ref: 'plaq-nue', missing: ['brake_caliper'] }],
);
check(
  'plaquettes multi-étriers ["nutt_4p","sram_avid"] : conforme',
  findMissingPartKeys([{
    categoryName: 'Plaquettes',
    parts: [{ slug: 'plaq-multi', fitment_specs: { brake_caliper: ['nutt_4p', 'sram_avid'] } }],
  }]),
  [],
);

// ── Pneus / chambres : tire_family + rim_diameters + tire_sections ────────────
const pneuOk = {
  slug: 'pneu-90-65',
  fitment_specs: { tire_family: 'pneumatic', rim_diameters: ['6.5'], tire_sections: ['90/65'] },
};
check(
  'pneu pneumatic complet : conforme',
  findMissingPartKeys([{ categoryName: 'Pneus gonflables', parts: [pneuOk] }]),
  [],
);
check(
  'chambre à air sans dims : 3 fautes tire',
  findMissingPartKeys([{ categoryName: 'Chambres à Air', parts: [{ slug: 'chambre-10' }] }]),
  [{ categoryName: 'Chambres à Air', ref: 'chambre-10', missing: ['tire_family="pneumatic"', 'rim_diameters', 'tire_sections'] }],
);
check(
  'chambre jante mm ("134mm") : conforme',
  findMissingPartKeys([{
    categoryName: 'Chambres à Air',
    parts: [{ slug: 'chambre-zero', fitment_specs: { tire_family: 'pneumatic', rim_diameters: ['134mm'], tire_sections: ['8.5x2'] } }],
  }]),
  [],
);

// ── Pneus pleins : tire_family="solid" (rim_width_mm n'existe plus) ───────────
check(
  'pneu plein complet : conforme',
  findMissingPartKeys([{
    categoryName: 'Pneus pleins',
    parts: [{ slug: 'pnp-8x4', fitment_specs: { tire_family: 'solid', rim_diameters: ['6'], tire_sections: ['8x4'] } }],
  }]),
  [],
);
check(
  'pneu plein avec tire_family pneumatic : refusé',
  findMissingPartKeys([{
    categoryName: 'Pneus pleins',
    parts: [{ slug: 'pnp-mauvaise-famille', fitment_specs: { tire_family: 'pneumatic', rim_diameters: ['6'], tire_sections: ['8x4'] } }],
  }]),
  [{ categoryName: 'Pneus pleins', ref: 'pnp-mauvaise-famille', missing: ['tire_family="solid"'] }],
);
check(
  'rim_width_mm (ancien schéma) : bloc inconnu refusé',
  findMissingPartKeys([{
    categoryName: 'Pneus pleins',
    parts: [{ slug: 'pnp-v1', fitment_specs: { tire_family: 'solid', rim_diameters: ['6'], tire_sections: ['8x4'], rim_width_mm: [36] } }],
  }]),
  [{ categoryName: 'Pneus pleins', ref: 'pnp-v1', missing: ['fitment_specs.rim_width_mm (bloc inconnu)'] }],
);

// ── Électrique (chargeurs) — inchangé ─────────────────────────────────────────
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

// ── Forme : ancien schéma v1 et blocs inconnus refusés partout ────────────────
check(
  'ancien bloc wheel (v1) refusé même hors catégorie à clés',
  findMissingPartKeys([{
    categoryName: 'Accessoires divers',
    parts: [{ slug: 'acc-v1', fitment_specs: { wheel: { type: 'pneumatic', rim_diameter: ['10'] } } }],
  }]),
  [{ categoryName: 'Accessoires divers', ref: 'acc-v1', missing: ['fitment_specs.wheel (bloc inconnu)'] }],
);
check(
  'ancien bloc brake (v1) refusé',
  findMissingPartKeys([{
    categoryName: 'Accessoires divers',
    parts: [{ slug: 'acc-brake-v1', fitment_specs: { brake: { disc_diameter: [160] } } }],
  }]),
  [{ categoryName: 'Accessoires divers', ref: 'acc-brake-v1', missing: ['fitment_specs.brake (bloc inconnu)'] }],
);
check(
  'brake_disc avec clé inconnue : refusé',
  findMissingPartKeys([{
    categoryName: 'Disques',
    parts: [{ slug: 'disque-typo', fitment_specs: { brake_disc: { diameters: ['160'], pcds: ['48'], holes: ['6'], pcd: ['48'] } } }],
  }]),
  [{ categoryName: 'Disques', ref: 'disque-typo', missing: ['brake_disc.pcd (clé inconnue)'] }],
);
check(
  'batch par categorySlug (prioritaire sur categoryName)',
  findMissingPartKeys([{ categoryName: 'Nom Farfelu', categorySlug: 'disques', parts: [{ slug: 'd-1' }] }]),
  [{ categoryName: 'Nom Farfelu', ref: 'd-1', missing: ['brake_disc.diameters', 'brake_disc.pcds', 'brake_disc.holes'] }],
);

// ── Fichier exemple de référence : doit passer la validation tel quel ─────────
const example = JSON.parse(
  readFileSync(resolve(__dirname, 'data/disque-160-example.json'), 'utf-8'),
);
check('scripts/data/disque-160-example.json : conforme', findMissingPartKeys(example), []);

console.log(failures === 0 ? '\nTous les tests passent.' : `\n${failures} échec(s).`);
process.exit(failures === 0 ? 0 : 1);
