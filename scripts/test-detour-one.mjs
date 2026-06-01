#!/usr/bin/env node
/**
 * scripts/test-detour-one.mjs
 * Test de détourage sur UN SEUL produit via l'Edge Function process-images.
 * Le secret est lu depuis process.env.ADMIN_BULK_SECRET (jamais hardcodé).
 *
 * Usage (PowerShell) :
 *   $env:ADMIN_BULK_SECRET = "<secret>"; node scripts/test-detour-one.mjs
 */

// Charge ADMIN_BULK_SECRET depuis le .env racine si absent de l'env (dotenv non installé).
// La valeur n'est jamais loggée.
if (!process.env.ADMIN_BULK_SECRET) {
  try {
    const { readFileSync } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    const { dirname, resolve } = await import('node:path');
    const envPath = resolve(dirname(fileURLToPath(import.meta.url)), '..', '.env');
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const m = line.match(/^\s*ADMIN_BULK_SECRET\s*=\s*["']?([^"'\r\n]*)["']?/);
      if (m) { process.env.ADMIN_BULK_SECRET = m[1].trim(); break; }
    }
  } catch {
    // .env introuvable/illisible : on laisse la garde ci-dessous gérer l'absence.
  }
}

const SECRET = process.env.ADMIN_BULK_SECRET;
if (!SECRET) {
  console.error('❌ ADMIN_BULK_SECRET absent de l\'environnement. Ex : $env:ADMIN_BULK_SECRET = "<secret>"');
  process.exit(1);
}

const URL = 'https://kqsxscjtlipregkrmucg.supabase.co/functions/v1/process-images';

const body = {
  entity_type: 'part',
  entity_id: 'bd33a2af-1625-4568-961d-b7b2507fe36a',
  source_urls: [
    'https://kqsxscjtlipregkrmucg.supabase.co/storage/v1/object/public/part-images/chargeur-36-volt-42v-2a-standard-gx16-1769647229268.png',
  ],
  alt_base: 'Chargeur 36 VOLT 42V 2A GX16',
};

async function main() {
  try {
    const res = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': SECRET,
      },
      body: JSON.stringify(body),
    });

    console.log(`HTTP ${res.status} ${res.statusText}`);

    const text = await res.text();
    try {
      console.log(JSON.stringify(JSON.parse(text), null, 2));
    } catch {
      console.log('Réponse non-JSON :');
      console.log(text);
    }
  } catch (e) {
    console.error(`❌ Requête échouée : ${e.message}`);
    process.exit(1);
  }
}

main();
