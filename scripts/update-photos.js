#!/usr/bin/env node
/**
 * scripts/update-photos.js
 * Met à jour uniquement les photos d'un scooter existant via process-images.
 *
 * Usage :
 *   node scripts/update-photos.js --file scripts/data/kukirin-photos.json
 *   node scripts/update-photos.js --file ... --dry-run   # détoure + QC, aucun POST
 *                                                          # → scripts/data/_preview/
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import sharp from 'sharp';
import { detoure } from './lib/detoure.js';
import { photoQc } from './lib/photo-qc.js';

// minimotors (Odoo) bloque node/undici au niveau WAF (403 sur l'endpoint image).
// On pre-telecharge la source via curl (qui passe le WAF) puis on passe le Buffer
// a detoure() — @imgly recoit des bytes et ne fait aucun fetch interne.
const CURL_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
// @imgly sniffe le format via le MIME : un Buffer brut => "Unsupported format".
// On detecte le type par magic bytes et on renvoie un Blob type.
function sniffMime(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf.slice(0, 4).toString('latin1') === 'RIFF' && buf.slice(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
  return 'image/jpeg'; // fallback raisonnable
}
// Source DÉJÀ transparente (PNG alpha, ex. appmifile/Boulanger) : @imgly fabrique
// des rectangles fantômes semi-transparents. On aplatit sur blanc AVANT detoure.
async function curlDownload(url) {
  const buf = execFileSync('curl', ['-s', '-L', '-A', CURL_UA, url], { maxBuffer: 64 * 1024 * 1024 });
  if (!buf || buf.length === 0) throw new Error('curl download vide/echec');
  const { hasAlpha } = await sharp(buf).metadata();
  if (hasAlpha === true) {
    if (DRY_RUN) console.log('      (source alpha aplatie sur blanc)');
    const flat = await sharp(buf).flatten({ background: '#ffffff' }).png().toBuffer();
    return new Blob([flat], { type: 'image/png' });
  }
  return new Blob([buf], { type: sniffMime(buf) });   // Blob type (pas Buffer brut) pour @imgly
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const args      = process.argv.slice(2);
const DRY_RUN   = args.includes('--dry-run');
const PREVIEW_DIR = resolve(__dirname, 'data/_preview');

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
// reset:true sur la 1ère image réellement postée (repart d'un tableau vide),
// reset:false ensuite (append). Une image qui échoue est comptée en erreur et la
// boucle continue. Aucun fallback Remove.bg, aucun envoi de source_urls.
// Le verdict photoQc est affiché avant chaque POST, à titre d'information (aucun blocage).
// DRY_RUN : détoure + QC + PNG dans _preview/, lignes dans `report`, AUCUN fetch.
//
// Retour : { ok, processed:perImgOk, failed:perImgErr, errors:[...] }
//   ok:true dès que perImgOk > 0 (succès partiel accepté).
//   ok:false uniquement si perImgOk === 0 (aucune image passée).
async function processImages(entityId, sourceUrls, altBase, secret, url, slug, report) {
  let perImgOk = 0;
  let perImgErr = 0;
  const errors = [];

  for (let i = 0; i < sourceUrls.length; i++) {
    const srcUrl = sourceUrls[i];
    try {
      const srcBuf = await curlDownload(srcUrl); // curl passe le WAF minimotors → Buffer source
      const buf = await detoure(srcBuf);   // LOCAL @imgly détoure les bytes (aucun fetch interne)
      const qc = await photoQc(buf);
      console.log(`      ${slug} #${i} ${qc.verdict}${qc.reasons.length ? ' ' + qc.reasons.join(', ') : ''}`);

      if (DRY_RUN) {
        writeFileSync(resolve(PREVIEW_DIR, `${slug}__${i}.png`), buf);
        report.push({ slug, i, source_url: srcUrl, ...qc, error: null });
        perImgOk++;
        continue;
      }

      const b64 = buf.toString('base64'); // sans préfixe data:

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({
          entity_type: 'scooter',
          entity_id: entityId,
          images_base64: [b64],
          alt_base: altBase,
          reset: perImgOk === 0,
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
      if (DRY_RUN) {
        console.log(`      ${slug} #${i} ERROR ${e.message}`);
        report.push({
          slug, i, source_url: srcUrl, width: null, height: null, opaque: null, semi: null,
          edge: null, verdict: 'ERROR', reasons: [], error: e.message,
        });
      }
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

  if (!SUPABASE_URL || !ANON_KEY || (!DRY_RUN && !ADMIN_SECRET)) {
    console.error('❌ Variables manquantes dans .env : VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY' + (DRY_RUN ? '' : ', ADMIN_BULK_SECRET'));
    process.exit(1);
  }

  const PROCESS_IMG_URL = `${SUPABASE_URL}/functions/v1/process-images`;
  const report = [];

  if (DRY_RUN) {
    console.log('🔍 DRY-RUN : détourage + QC local, aucun POST process-images.');
    rmSync(PREVIEW_DIR, { recursive: true, force: true });
    mkdirSync(PREVIEW_DIR, { recursive: true });
  }

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

      // Evite le doublon de marque : le name BDD contient souvent deja la marque
      // (ex. "Dualtron Achilleus 2025"). Si name commence par brandName (casse/espaces
      // ignores), on garde name seul ; sinon on prefixe. Generique toutes marques.
      const brandStr = String(brandName || '').trim();
      const nameStr = String(row.name || '').trim();
      const nb = brandStr.toLowerCase().replace(/\s+/g, ' ');
      const nn = nameStr.toLowerCase().replace(/\s+/g, ' ');
      const startsWithBrand = nb.length > 0 && (nn === nb || nn.startsWith(nb + ' '));
      const altBase = startsWithBrand ? nameStr : `${brandStr} ${nameStr}`;
      console.log(`   🖼  ${slug} : traitement...`);
      const result = await processImages(row.id, source_image_urls, altBase, ADMIN_SECRET, PROCESS_IMG_URL, slug, report);

      if (result.ok) {
        if (result.failed > 0) {
          console.log(`      ✅ ${result.processed}/${source_image_urls.length} ok, ${result.failed} erreur(s)`);
        } else {
          console.log(`      ✅ ${result.processed}/${source_image_urls.length} ok`);
        }
        photoOk++;
      } else {
        console.log(`      ❌ 0/${source_image_urls.length} ok — ${result.errors.join('; ') || 'aucune image traitée'}`);
        photoErr++;
      }
    }

    console.log(`   → Photos : ${photoOk} ok, ${photoErr} erreur(s), ${photoSkip} skip`);
  }

  if (DRY_RUN) {
    writeDryRunReport(report);
    const count = (v) => report.filter((r) => r.verdict === v).length;
    console.log(`\nQC : ${count('PASS')} PASS · ${count('WARN')} WARN · ${count('FAIL')} FAIL · ${count('ERROR')} erreur(s) sur ${report.length} image(s)`);
    console.log(`Planche : ${resolve(PREVIEW_DIR, 'index.html')}`);
    console.log('DRY-RUN : 0 écriture en base, 0 appel process-images');
    return;
  }

  console.log('\nTerminé.');
}

// ─── Rapport dry-run : report.json + planche de contact index.html ────────────

function writeDryRunReport(report) {
  writeFileSync(resolve(PREVIEW_DIR, 'report.json'), JSON.stringify(report, null, 2));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tiles = report.map((r) => `
    <figure class="${r.verdict}">
      ${r.error ? `<div class="img err">${esc(r.error)}</div>` : `<img src="${esc(`${r.slug}__${r.i}.png`)}" alt="">`}
      <figcaption>
        <b>${esc(r.slug)} #${r.i}</b>
        <span class="v">${r.verdict}</span>
        ${r.reasons?.length ? `<small>${esc(r.reasons.join(' · '))}</small>` : ''}
        ${r.width ? `<small>${r.width}×${r.height} · opaque ${(r.opaque * 100).toFixed(1)}% · semi ${(r.semi * 100).toFixed(1)}%</small>` : ''}
      </figcaption>
    </figure>`).join('');
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Photo QC — dry-run</title>
<style>
body{margin:0;padding:16px;background:#3b6ea5;font:14px system-ui,sans-serif;color:#fff}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}
figure{margin:0;background:rgba(0,0,0,.15);border-radius:12px;padding:8px;border:3px solid transparent}
figure.PASS{border-color:#4A7C59}figure.WARN{border-color:#e0a800}figure.FAIL,figure.ERROR{border-color:#d33}
.img,img{display:block;width:100%;aspect-ratio:1;object-fit:contain;background:#3b6ea5}
.img.err{display:flex;align-items:center;justify-content:center;text-align:center;padding:8px;box-sizing:border-box}
figcaption{display:flex;flex-direction:column;gap:2px;padding-top:6px}
.v{font-weight:800}small{opacity:.85}
</style></head><body>
<h1 style="margin:0 0 12px;font-size:18px">Photo QC — ${report.length} image(s)</h1>
<div class="grid">${tiles}
</div></body></html>`;
  writeFileSync(resolve(PREVIEW_DIR, 'index.html'), html);
}

main();
