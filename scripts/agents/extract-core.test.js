// node --test scripts/agents/extract-core.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assembleScooter, needsDiscKeys, sourcesReport } from './lib/extract-core.js';

const vocab = {
  brake_rows: [{ code: 'disc_hydraulic', has_disc: true }, { code: 'drum', has_disc: false }],
  brake: ['disc_hydraulic', 'drum'],
  caliper: ['sram_avid', 'nutt_4p'], rim_type: ['monobloc', 'demi_jante'],
  rim_d: ['6', '6.5', '134mm'], section: ['90/65', '10x3.00'],
  disc_d: ['120', '145', '160'], pcd: ['44', '48'], holes: ['5', '6'],
};
const S = (value, type = 'constructeur') => ({ value, source_url: 'https://ex.com/p', source_url_2: 'https://autre.fr/q', source_type: type });
const specsOk = { weight_kg: S(35.5), voltage: S(60), wheel_inches: S(10), image_urls: ['https://cdn.ex.com/a.jpg'] };
const keysOk = { brake_type: S('disc_hydraulic'), disc_diameter: S(145), disc_pcd: S(44), disc_holes: S(6), rim_diameter: S('6'), tire_section: S('10x3.00'), caliper_family: S('sram_avid') };

test('modèle complet et sourcé → PRÊT, au contrat', () => {
  const r = assembleScooter('Vsett', '10+', specsOk, keysOk, vocab);
  assert.equal(r.ready, true);
  assert.equal(r.scooter.name, 'Vsett 10+');
  assert.equal(r.scooter.slug, 'vsett-10-plus');
  assert.equal(r.scooter.disc_diameter, 145);
  assert.equal(r.scooter.weight_kg, 35.5);
  assert.equal(r.scooter.max_speed_kmh, 25);
  assert.match(r.scooter.meta_description, /disque de frein 145 mm 6 trous/);
});

test('valeur sans URL source → écartée, jamais inventée', () => {
  const r = assembleScooter('Vsett', '10+', { ...specsOk, weight_kg: { value: 35, source_url: null, source_type: 'inconnu' } }, keysOk, vocab);
  assert.equal(r.scooter.weight_kg, undefined);
  assert.deepEqual(r.missing, ['weight_kg']);
  assert.equal(r.ready, false);
});

test('poids venu d\'un site de test → à valider par Nolan, pas écrit', () => {
  const r = assembleScooter('Vsett', '10+', { ...specsOk, weight_kg: S(35, 'site_test') }, keysOk, vocab);
  assert.equal(r.scooter.weight_kg, undefined);
  assert.equal(r.toValidate[0].key, 'weight_kg');
  assert.equal(r.ready, false);
});

test('code hors référentiel → non importé, signalé', () => {
  const r = assembleScooter('Vsett', '10+', specsOk, { ...keysOk, tire_section: S('11x4') }, vocab);
  assert.equal(r.scooter.tire_section, undefined);
  assert.deepEqual(r.offVocab, ['tire_section=11x4']);
  assert.equal(r.ready, true); // section optionnelle : le modèle reste importable
});

test('disque inconnu (hors liste) → manque la clé', () => {
  const r = assembleScooter('Vsett', '10+', specsOk, { ...keysOk, disc_diameter: S(203) }, vocab);
  assert.ok(r.missing.includes('disc_diameter'));
});

test('frein tambour → clés disque non exigées', () => {
  assert.equal(needsDiscKeys('drum', vocab), false);
  const r = assembleScooter('X', 'Y', specsOk, { brake_type: S('drum') }, vocab);
  assert.equal(r.ready, true);
});

test('solid_conversion=no interdit sur une trotte à pneus pleins', () => {
  const r = assembleScooter('X', 'Y', specsOk, { ...keysOk, tire_family: S('solid'), solid_conversion: S('no') }, vocab);
  assert.equal(r.scooter.solid_conversion, undefined);
});

test('photo non directe (page HTML) → refusée', () => {
  const r = assembleScooter('X', 'Y', { ...specsOk, image_urls: ['https://ex.com/produit'] }, keysOk, vocab);
  assert.ok(r.missing.includes('source_image_urls'));
});

test('rapport de sources : verdict et URLs', () => {
  const md = sourcesReport('Vsett', [assembleScooter('Vsett', '10+', specsOk, keysOk, vocab)], { date: '2026-10-08', model: 'm' });
  assert.match(md, /1 PRÊT \/ 1 modèles/);
  assert.match(md, /\| disc_diameter \| 145 \| constructeur \| https:\/\/ex\.com\/p \| https:\/\/autre\.fr\/q \|/);
});

test('photos : og:image de fiche produit acceptée même sans extension', () => {
  const r = assembleScooter('X', 'Y', { ...specsOk, image_urls: [], _og_images: ['https://cdn.shop.com/files/produit?v=123'] }, keysOk, vocab);
  assert.deepEqual(r.scooter.source_image_urls, ['https://cdn.shop.com/files/produit?v=123']);
  assert.equal(r.ready, true);
});

test('solid_conversion=yes : proposé au rapport, jamais importé', () => {
  const r = assembleScooter('X', 'Y', specsOk, { ...keysOk, solid_conversion: S('yes') }, vocab);
  assert.equal(r.scooter.solid_conversion, undefined);
  assert.equal(r.proposals[0].value, 'yes');
});

test('disque avec une seule source → non importé, listé « une seule source »', () => {
  const r = assembleScooter('Vsett', '10+', specsOk, { ...keysOk, disc_diameter: { ...S(160), source_url_2: null } }, vocab);
  assert.equal(r.scooter.disc_diameter, undefined);
  assert.ok(r.missing.includes('disc_diameter'));
  assert.equal(r.unconfirmed[0].key, 'disc_diameter');
});

test('deux URLs du même site ne font pas deux sources', () => {
  const r = assembleScooter('Vsett', '10+', specsOk, { ...keysOk, rim_diameter: { ...S('6'), source_url_2: 'https://www.ex.com/autre-page' } }, vocab);
  assert.equal(r.scooter.rim_diameter, undefined);
});

test('poids avec une seule source → manque (obligatoire pour publier)', () => {
  const r = assembleScooter('Vsett', '10+', { ...specsOk, weight_kg: { ...S(39), source_url_2: null } }, keysOk, vocab);
  assert.ok(r.missing.includes('weight_kg'));
});
