import test from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from './slugify.js';

// Implémentation historique de src/components/admin/PartsManager.tsx:69, recopiée
// telle quelle. Sert de juge : le module doit rendre EXACTEMENT la même chose sur
// toutes les fixtures, sinon le refactor front change le comportement.
// (La plage de diacritiques est écrite via new RegExp — caractères combinants
// invisibles en source — mais c'est le même [̀-ͯ] que l'original.)
const LEGACY_DIACRITICS_RE = new RegExp('[\\u0300-\\u036f]', 'g');
const legacySlugify = (text) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(LEGACY_DIACRITICS_RE, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// [entrée, sortie attendue]
const FIXTURES = [
  ['10x2.75', '10x2-75'],
  ['Chambre à air 10x2.125 valve droite', 'chambre-a-air-10x2-125-valve-droite'],
  ['Créer', 'creer'],
  ['Pneu    avant', 'pneu-avant'],
  ['  !! Pneu 10x3 ??  ', 'pneu-10x3'],
  ['Dualtron Storm Limited', 'dualtron-storm-limited'],
  ['NAMI Burn-E 3 Max', 'nami-burn-e-3-max'],
  // NFD décompose š (U+0161) en s + caron combinant → le caron saute, le s reste.
  ['Škoda', 'skoda'],
  // ø (U+00F8) n'a AUCUNE décomposition NFD : il n'est pas dans [a-z0-9], donc il
  // devient un tiret. Comportement réel documenté, pas souhaité — une marque en
  // "ø" produirait un slug amputé.
  ['Søren', 's-ren'],
  ['Ø', ''],
];

test('fixtures — sortie canonique', () => {
  for (const [input, expected] of FIXTURES) {
    assert.equal(slugify(input), expected, `slugify(${JSON.stringify(input)})`);
  }
});

test('parité avec l\'implémentation PartsManager historique', () => {
  for (const [input] of FIXTURES) {
    assert.equal(
      slugify(input),
      legacySlugify(input),
      `divergence sur ${JSON.stringify(input)}`,
    );
  }
});

test('entrées vides ou non-string → ""', () => {
  assert.equal(slugify(null), '');
  assert.equal(slugify(undefined), '');
  assert.equal(slugify(''), '');
  assert.equal(slugify('   '), '');
  assert.equal(slugify('!!!'), '');
});

test('maxLength tronque puis supprime le tiret final', () => {
  // "abcde-fghij" coupé à 6 donnerait "abcde-" → doit rendre "abcde".
  assert.equal(slugify('abcde fghij', { maxLength: 6 }), 'abcde');
  // Coupe en plein mot : pas de tiret à retirer.
  assert.equal(slugify('abcde fghij', { maxLength: 8 }), 'abcde-fg');
  // Slug plus court que maxLength : inchangé.
  assert.equal(slugify('abcde', { maxLength: 80 }), 'abcde');
  // Sans option : aucune troncature.
  assert.equal(slugify('a'.repeat(100)).length, 100);
});
