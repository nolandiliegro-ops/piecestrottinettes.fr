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
import { detoure } from './lib/detoure.js';

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

// ─── process-images helper (détourage LOCAL @imgly + mode images_base64) ────────
//
// Pour chaque source_url : detoure(url) en local → Buffer PNG → base64 (sans
// préfixe data:) → 1 POST process-images avec images_base64:[b64].
// reset:true sur la 1ère image (repart d'un tableau vide), reset:false ensuite
// (append). Une image qui échoue est comptée en erreur et la boucle continue.
// Aucun fallback Remove.bg, aucun envoi de source_urls.
//
// Retour : { ok, processed:perImgOk, failed:perImgErr, errors:[...] }
//   ok:true dès que perImgOk > 0 (succès partiel accepté).
//   ok:false uniquement si perImgOk === 0 (aucune image passée).
async function processImages(entityId, sourceUrls, altBase, secret, url) {
  let perImgOk = 0;
  let perImgErr = 0;
  const errors = [];

  for (let i = 0; i < sourceUrls.length; i++) {
    const srcUrl = sourceUrls[i];
    try {
      const buf = await detoure(srcUrl); // LOCAL @imgly, URL → Buffer PNG
      const b64 = buf.toString('base64'); // sans préfixe data:

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({
          entity_type: 'scooter',
          entity_id: entityId,
          images_base64: [b64],
          alt_base: altBase,
          reset: i === 0,
        }),
      });

      const text = await res.text();
      let json;
      try { json = JSON.parse(text); }
      catch { perImgErr++; errors.push(`img ${i}: non-JSON: ${text.slice(0, 80)}`); continue; }

      if (!res.ok || json?.success !== true) {
        perImgErr++;
        errors.push(`img ${i}: ${json?.error ?? `HTTP ${res.status}`}`);
        continue;
      }
      perImgOk++;
    } catch (e) {
      // detourage (URL morte, échec moteur) ou réseau : on logue et on continue
      perImgErr++;
      errors.push(`img ${i}: ${e.message}`);
    }
  }

  return { ok: perImgOk > 0, processed: perImgOk, failed: perImgErr, errors };
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
        if (result.failed > 0) {
          process.stdout.write(` ✅ ${result.processed}/${source_image_urls.length} ok, ${result.failed} erreur(s)\n`);
        } else {
          process.stdout.write(` ✅ ${result.processed}/${source_image_urls.length} ok\n`);
        }
        photoOk++;
      } else {
        process.stdout.write(` ❌ 0/${source_image_urls.length} ok — ${result.errors.join('; ') || 'aucune image traitée'}\n`);
        photoErr++;
      }
    }

    console.log(`   → Photos : ${photoOk} ok, ${photoErr} erreur(s), ${photoSkip} skip`);
  }

  console.log('\nTerminé.');
}

main();
