#!/usr/bin/env node
/**
 * scripts/sync-parts.js
 * Importe des pièces détachées depuis un fichier JSON vers Supabase via l'Edge Function.
 *
 * Usage :
 *   node scripts/sync-parts.js --file scripts/data/pneus-wattiz.json
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);

const fileArgIdx = args.indexOf('--file');
if (fileArgIdx === -1 || !args[fileArgIdx + 1]) {
  console.error('Usage: node scripts/sync-parts.js --file <chemin/vers/import.json>');
  process.exit(1);
}
const filePath = resolve(process.cwd(), args[fileArgIdx + 1]);

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
        entity_type: 'part',
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

async function main() {
  const env = loadEnv();
  const SUPABASE_URL = env.VITE_SUPABASE_URL;
  const ADMIN_SECRET = env.ADMIN_BULK_SECRET;

  if (!SUPABASE_URL || !ADMIN_SECRET) {
    console.error('❌ Variables manquantes dans .env : VITE_SUPABASE_URL, ADMIN_BULK_SECRET');
    process.exit(1);
  }

  const EDGE_URL = `${SUPABASE_URL}/functions/v1/bulk-insert-parts`;
  const PROCESS_IMG_URL = `${SUPABASE_URL}/functions/v1/process-images`;

  let data;
  try {
    const raw = readFileSync(filePath, 'utf-8');
    data = JSON.parse(raw);
  } catch (e) {
    console.error('❌ Impossible de lire le fichier JSON :', filePath);
    console.error(e.message);
    process.exit(1);
  }

  const batches = Array.isArray(data) ? data : [data];

  for (const batch of batches) {
    const { categoryName, parts } = batch;

    if (!categoryName || !Array.isArray(parts) || parts.length === 0) {
      console.error('❌ Format invalide. Attendu : { categoryName, parts: [...] }');
      process.exit(1);
    }

    console.log(`\n→ ${categoryName} (${parts.length} pièce(s))`);

    let result;
    try {
      const res = await fetch(EDGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': ADMIN_SECRET,
        },
        body: JSON.stringify(batch),
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

    const inserted = result.results?.inserted ?? 0;
    const updated = result.results?.updated ?? 0;
    const errors = result.results?.errors ?? [];

    console.log(`   ✅ Insérées : ${inserted}   🔄 Mises à jour : ${updated}`);

    if (errors.length > 0) {
      console.log('   Erreurs :');
      for (const e of errors) console.log(`   ✗ ${e.name} — ${e.error}`);
    }

    // ── Détourage images (si results.rows disponible) ─────────────────────────
    const resultRows = result.results?.rows;

    if (Array.isArray(resultRows)) {
      const urlsBySlug = new Map(
        parts
          .filter(p => Array.isArray(p.source_image_urls) && p.source_image_urls.length > 0)
          .map(p => [p.slug, p.source_image_urls])
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
        const altBase = r.name;
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
