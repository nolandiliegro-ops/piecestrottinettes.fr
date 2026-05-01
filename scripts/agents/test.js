/**
 * Smoke tests Le Veilleur — vérifient que les modules se chargent sans erreur.
 * Run : node scripts/agents/test.js
 */
import assert from 'node:assert';
import { scoreScooter, scorePart } from './lib/scoring.js';
import { slugify, buildScooterSlug, buildPartSlug } from './lib/slugify.js';

const weights = { has_price: 15, has_official_url: 15, has_images: 20, has_full_specs: 30, has_marketing_description: 20 };

// Test slugify
assert.strictEqual(slugify('Dualtron Storm Limited'), 'dualtron-storm-limited');
assert.strictEqual(slugify('NAMI Burn-E 3 Max'), 'nami-burn-e-3-max');
assert.strictEqual(buildScooterSlug('Dualtron', 'Thunder', '3'), 'dualtron-thunder-3');
assert.strictEqual(buildPartSlug('Pneu 10x3', 'Wattiz'), 'wattiz-pneu-10x3');
console.log('✓ slugify');

// Test scoring : item complet
const fullScooter = {
  brand: 'Dualtron', name: 'Storm', price: 2500, official_url: 'https://dualtron.fr/storm',
  images: ['a.jpg', 'b.jpg'],
  specs: { voltage: 60, motor_power: 5400, max_speed: 80, autonomy: 110, battery_wh: 3024, tire_size: '11', weight: 39 },
  description: 'A'.repeat(300),
};
const r1 = scoreScooter(fullScooter, weights, 6);
assert.strictEqual(r1.score, 100, `expected 100 got ${r1.score}`);
console.log('✓ scoreScooter full → 100');

// Test scoring : item minimal
const minScooter = { brand: 'X', name: 'Y' };
const r2 = scoreScooter(minScooter, weights, 6);
assert.strictEqual(r2.score, 0);
console.log('✓ scoreScooter empty → 0');

// Test scorePart
const fullPart = {
  name: 'Pneu 10x3', brand: 'Wattiz', price: 49, official_url: 'https://wattiz.fr/p',
  images: ['x.jpg'],
  technical_metadata: { size: '10x3', type: 'gonflable', material: 'caoutchouc', tubeless: true, ply: 6, weight: 800 },
  description: 'B'.repeat(200),
};
const r3 = scorePart(fullPart, weights, 6);
assert.strictEqual(r3.score, 100);
console.log('✓ scorePart full → 100');

console.log('\n✅ Tous les smoke tests passent');
