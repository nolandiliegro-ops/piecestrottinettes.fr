#!/usr/bin/env node
/**
 * scripts/sync-scooters.js
 * Importe des modèles de trottinettes depuis un fichier JSON vers Supabase via l'Edge Function.
 *
 * Usage :
 *   node scripts/sync-scooters.js --file scripts/data/import.json
 *   node scripts/sync-scooters.js --file scripts/data/import.json --update
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args      = process.argv.slice(2);
const doUpdate  = args.includes('--update');

const fileArgIdx = args.indexOf('--file');
if (fileArgIdx === -1 || !args[fileArgIdx + 1]) {
  console.error('Usage: node scripts/sync-scooters.js --file <chemin/vers/import.json> [--update]');
  process.exit(1);
}
const filePath = resolve(process.cwd(), args[fileArgIdx + 1]);

// ─── Chargement .env ──────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = resolve(__dirname, '../.env');
  let content;
  try { content = readFileSync(envPath, 'utf-8'); }
  catch { console.error('❌ .env introuvable :', envPath); process.exit(1); }
  const env = {};
  for (const line of content.split('\n')) {
    const m = line.match(/^([^#=][^=]*)=["']?([^"'\r\n]*)["']?/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const env = loadEnv();

  const SUPABASE_URL    = env.VITE_SUPABASE_URL;
  const ADMIN_SECRET    = env.ADMIN_BULK_SECRET;

  if (!SUPABASE_URL || !ADMIN_SECRET) {
    console.error('❌ Variables manquantes dans .env : VITE_SUPABASE_URL, ADMIN_BULK_SECRET');
    process.exit(1);
  }

  const EDGE_URL = `${SUPABASE_URL}/functions/v1/bulk-insert-scooters`;

  // ── Lecture du fichier JSON ──────────────────────────────────────────────────
  let data;
  try {
    const raw = readFileSync(filePath, 'utf-8');
    data = JSON.parse(raw);
  } catch (e) {
    console.error('❌ Impossible de lire le fichier JSON :', filePath);
    console.error(e.message);
    process.exit(1);
  }

  // Le fichier peut contenir un seul objet { brandName, scooters } ou un tableau de tels objets
  const batches = Array.isArray(data) ? data : [data];

  for (const batch of batches) {
    const { brandName, scooters, models } = batch;
    const items = scooters ?? models;

    if (!brandName || !Array.isArray(items) || items.length === 0) {
      console.error('❌ Format invalide. Attendu : { brandName, scooters: [...] }');
      process.exit(1);
    }

    console.log(`\n→ ${brandName} (${items.length} modèle(s))${doUpdate ? ' [--update]' : ''}`);

    // ── Appel Edge Function ────────────────────────────────────────────────────
    let result;
    try {
      const res = await fetch(EDGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': ADMIN_SECRET,
          'x-sync-secret': ADMIN_SECRET,
        },
        body: JSON.stringify({ brandName, brand_name: brandName, scooters: items, models: items, forceUpdate: doUpdate }),
      });

      const text = await res.text();
      try { result = JSON.parse(text); }
      catch { console.error('❌ Réponse non-JSON :', text); process.exit(1); }

      if (!res.ok) {
        console.error(`❌ Erreur ${res.status} :`, result?.error ?? text);
        continue;
      }
    } catch (e) {
      console.error('❌ Requête échouée :', e.message);
      process.exit(1);
    }

    // ── Affichage résultats ────────────────────────────────────────────────────
    const inserted = result.inserted ?? result.results?.inserted ?? 0;
    const skipped  = result.skipped  ?? result.results?.skipped  ?? 0;
    const errors   = result.results?.errors ?? [];
    const rows     = result.results;

    console.log(`   ✅ Insérés : ${inserted}   ⏭  Ignorés : ${skipped}`);

    if (Array.isArray(rows)) {
      for (const r of rows) {
        if (r.status === 'inserted') console.log(`   + ${r.name} (${r.slug})`);
        if (r.status === 'error')    console.log(`   ✗ ${r.name} — ${r.error}`);
      }
    }

    if (Array.isArray(errors) && errors.length > 0) {
      console.log('   Erreurs :');
      for (const e of errors) console.log(`   ✗ ${e.name ?? e} — ${e.error ?? ''}`);
    }
  }

  console.log('\nTerminé.');
}

main();
