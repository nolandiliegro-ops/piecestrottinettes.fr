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

// ─── process-images helper ────────────────────────────────────────────────────

async function processImages(entityId, sourceUrls, altBase, secret, url) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
      body: JSON.stringify({
        entity_type: 'scooter',
        entity_id: entityId,
        source_urls: sourceUrls,
        alt_base: altBase,
      }),
    });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { return { ok: false, error: `non-JSON: ${text.slice(0, 80)}` }; }
    if (!res.ok) return { ok: false, error: json?.error ?? `HTTP ${res.status}` };
    return { ok: true, processed: json.processed_count ?? 0, failed: json.failed_count ?? 0 };
  } catch (e) {
    return { ok: false, error: e.message };
  }
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

  const EDGE_URL        = `${SUPABASE_URL}/functions/v1/bulk-insert-scooters`;
  const PROCESS_IMG_URL = `${SUPABASE_URL}/functions/v1/process-images`;

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
    // LEGACY (broken before BLOC 4 fix) — kept commented for archeology
    // const rows = result.results;
    // if (Array.isArray(rows)) {
    //   for (const r of rows) {
    //     if (r.status === 'inserted') console.log(`   + ${r.name} (${r.slug})`);
    //     if (r.status === 'error')    console.log(`   ✗ ${r.name} — ${r.error}`);
    //   }
    // }

    console.log(`   ✅ Insérés : ${inserted}   ⏭  Ignorés : ${skipped}`);

    if (Array.isArray(errors) && errors.length > 0) {
      console.log('   Erreurs :');
      for (const e of errors) console.log(`   ✗ ${e.name ?? e} — ${e.error ?? ''}`);
    }

    // ── Détourage images (si results.rows disponible) ─────────────────────────
    const resultRows = result.results?.rows;

    if (Array.isArray(resultRows)) {
      const urlsBySlug = new Map(
        items
          .filter(s => Array.isArray(s.source_image_urls) && s.source_image_urls.length > 0)
          .map(s => [s.slug, s.source_image_urls])
      );

      let imgOk = 0, imgErr = 0, imgSkip = 0;

      for (const r of resultRows) {
        if (r.status !== 'inserted') { imgSkip++; continue; }
        const srcUrls = urlsBySlug.get(r.slug);
        if (!srcUrls) { imgSkip++; continue; }
        if (!r.id) {
          console.log(`   ⚠  Images ${r.slug} : UUID absent dans la réponse, skip`);
          imgSkip++; continue;
        }
        const altBase = `${brandName} ${r.name}`;
        process.stdout.write(`   🖼  Images ${r.slug} : traitement...`);
        const imgResult = await processImages(r.id, srcUrls, altBase, ADMIN_SECRET, PROCESS_IMG_URL);
        if (imgResult.ok) {
          process.stdout.write(` ✅ ${imgResult.processed}/${srcUrls.length} ok\n`);
          imgOk++;
        } else {
          process.stdout.write(` ⚠  ${imgResult.error}\n`);
          imgErr++;
        }
      }

      if (urlsBySlug.size > 0) {
        console.log(`   → Images : ${imgOk} ok, ${imgErr} erreur(s), ${imgSkip} skip`);
      }
    }
  }

  console.log('\nTerminé.');
}

main();
