#!/usr/bin/env node
/**
 * scripts/update-photos.js
 * Met à jour uniquement les photos d'un scooter existant via process-images.
 *
 * Usage :
 *   node scripts/update-photos.js --file scripts/data/kukirin-photos.json
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args      = process.argv.slice(2);

const fileArgIdx = args.indexOf('--file');
if (fileArgIdx === -1 || !args[fileArgIdx + 1]) {
  console.error('Usage: node scripts/update-photos.js --file <chemin/vers/photos.json>');
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

// ─── Résolution slug → id via Supabase REST ───────────────────────────────────

async function resolveScooterId(slug, supabaseUrl, anonKey) {
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/scooter_models?slug=eq.${encodeURIComponent(slug)}&select=id,name`,
      { headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` } }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows.length > 0 ? rows[0] : null;
  } catch {
    return null;
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const env = loadEnv();

  const SUPABASE_URL = env.VITE_SUPABASE_URL;
  const ANON_KEY     = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const ADMIN_SECRET = env.ADMIN_BULK_SECRET;

  if (!SUPABASE_URL || !ANON_KEY || !ADMIN_SECRET) {
    console.error('❌ Variables manquantes dans .env : VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, ADMIN_BULK_SECRET');
    process.exit(1);
  }

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

  const batches = Array.isArray(data) ? data : [data];

  for (const batch of batches) {
    const { brandName, scooters } = batch;

    if (!brandName || !Array.isArray(scooters) || scooters.length === 0) {
      console.error('❌ Format invalide. Attendu : { brandName, scooters: [{ slug, source_image_urls }] }');
      process.exit(1);
    }

    console.log(`\n→ ${brandName} (${scooters.length} scooter(s))`);

    let photoOk = 0, photoErr = 0, photoSkip = 0;

    for (const scooter of scooters) {
      const { slug, source_image_urls } = scooter;

      if (!slug) {
        console.log('   ⚠  entrée sans slug, skip');
        photoSkip++; continue;
      }

      if (!Array.isArray(source_image_urls) || source_image_urls.length === 0) {
        console.log(`   ⚠  ${slug} : pas de source_image_urls, skip`);
        photoSkip++; continue;
      }

      const row = await resolveScooterId(slug, SUPABASE_URL, ANON_KEY);
      if (!row) {
        console.log(`   ⚠  ${slug} : non trouvé en BDD, skip`);
        photoSkip++; continue;
      }

      const altBase = `${brandName} ${row.name}`;
      process.stdout.write(`   🖼  ${slug} : traitement...`);
      const result = await processImages(row.id, source_image_urls, altBase, ADMIN_SECRET, PROCESS_IMG_URL);

      if (result.ok) {
        process.stdout.write(` ✅ ${result.processed}/${source_image_urls.length} ok\n`);
        photoOk++;
      } else {
        process.stdout.write(` ❌ ${result.error}\n`);
        photoErr++;
      }
    }

    console.log(`   → Photos : ${photoOk} ok, ${photoErr} erreur(s), ${photoSkip} skip`);
  }

  console.log('\nTerminé.');
}

main();
