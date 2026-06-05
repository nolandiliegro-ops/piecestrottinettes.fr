#!/usr/bin/env node
/**
 * scripts/test-detoure-local.mjs
 * Test standalone du moteur de détourage local @imgly (scripts/lib/detoure.js).
 *
 * Usage :
 *   node scripts/test-detoure-local.mjs <url>
 * Sans argument, une URL par défaut est utilisée.
 */

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detoure } from './lib/detoure.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DEFAULT_URL =
  'https://kqsxscjtlipregkrmucg.supabase.co/storage/v1/object/public/part-images/chargeur-36-volt-42v-2a-standard-gx16-1769647229268.png';

const url = process.argv[2] || DEFAULT_URL;
const outPath = resolve(__dirname, '_detoure-out.png');

async function main() {
  try {
    console.log(`→ Détourage : ${url}`);
    const t0 = Date.now();
    const buf = await detoure(url);
    const seconds = (Date.now() - t0) / 1000;

    writeFileSync(outPath, buf);

    const ko = (buf.length / 1024).toFixed(1);
    console.log(`✅ PNG détouré : ${ko} Ko`);
    console.log(`⏱  Temps : ${seconds.toFixed(1)} s`);
    console.log(`📄 Écrit : ${outPath}`);
  } catch (e) {
    console.error(`❌ Échec du détourage : ${e.message}`);
    process.exit(1);
  }
}

main();
