// scripts/_test-battery-voltage.mjs
// Tests du module pur src/lib/batteryVoltage.ts (bareme M-A7a). Aucun reseau,
// aucun env. Node >= 23 strippe les types nativement : pas de runner de test.
// Usage : node scripts/_test-battery-voltage.mjs

import {
  CANONICAL_VOLTAGES,
  isCanonicalVoltage,
  chargeVoltageOf,
  formatVolts,
  isVerdictSafe,
} from '../src/lib/batteryVoltage.ts';

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

// ── Bareme ────────────────────────────────────────────────────────────────────
check('bareme = 24/36/48/52/60/72/84', [...CANONICAL_VOLTAGES], [24, 36, 48, 52, 60, 72, 84]);
check('24 V canonique (7S, SP-164/SP-165)', isCanonicalVoltage(24), true);
check('53 V hors bareme (SP-1818)', isCanonicalVoltage(53), false);
check('63 V hors bareme (SP-186, sortie 15S saisie en nominal)', isCanonicalVoltage(63), false);
check('84 V canonique (pack Storm LTD)', isCanonicalVoltage(84), true);

// ── Derivation ────────────────────────────────────────────────────────────────
check('24 -> 29,4 V', chargeVoltageOf(24), 29.4);
check('72 -> 84 V', chargeVoltageOf(72), 84);
check('60 -> 67,2 V', chargeVoltageOf(60), 67.2);
check('84 -> null (valeur jamais lue sur une etiquette d origine)', chargeVoltageOf(84), null);
check('53 -> null (hors bareme, aucune derivation)', chargeVoltageOf(53), null);
check('63 -> null (hors bareme, aucune derivation)', chargeVoltageOf(63), null);

// ── Formatage FR ──────────────────────────────────────────────────────────────
check('formatVolts(29.4)', formatVolts(29.4), '29,4 V');
check('formatVolts(58.8)', formatVolts(58.8), '58,8 V');
check('formatVolts(84)', formatVolts(84), '84,0 V');

// ── Garde-fous du verdict ─────────────────────────────────────────────────────
check('pas de voltages (pneu, disque) -> verdict conserve', isVerdictSafe(null), true);
check('voltages absent (undefined) -> verdict conserve', isVerdictSafe(undefined), true);
check('tableau vide -> verdict conserve', isVerdictSafe([]), true);
check('[24] -> verdict conserve', isVerdictSafe([24]), true);
check('[72] -> verdict conserve', isVerdictSafe([72]), true);
check('[36,48] -> verdict conserve', isVerdictSafe([36, 48]), true);
check('[84] -> verdict retire (ambigu 72 vs 84 nominal)', isVerdictSafe([84]), false);
check('[72,84] -> verdict retire des qu un 84 traine', isVerdictSafe([72, 84]), false);
check('[53] -> verdict retire (hors bareme)', isVerdictSafe([53]), false);
check('[63] -> verdict retire (hors bareme)', isVerdictSafe([63]), false);

console.log(failures === 0 ? '\nTous les tests passent.' : `\n${failures} test(s) en echec.`);
process.exit(failures === 0 ? 0 : 1);
