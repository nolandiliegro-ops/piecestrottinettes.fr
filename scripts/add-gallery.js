#!/usr/bin/env node
/**
 * scripts/add-gallery.js — AJOUT DES PHOTOS DE GALERIE (au FIXE, lot du 13/10/2026)
 *
 * Lit le résultat de la passe galerie (scripts/agents/fill-gallery.js, branche donnees-extraction,
 * galerie/galerie-ia.json), re-détoure chaque photo retenue en LOCAL (@imgly, même moteur que
 * sync-scooters) puis l'envoie à l'Edge Function process-images en mode « image déjà détourée » :
 *   - mode AJOUT (reset:false) : les photos existantes restent, la principale ne change pas ;
 *   - modèles marqués replace:true (photo principale ratée) : la 1re photo retenue repart d'un
 *     tableau vide (reset:true), les suivantes s'ajoutent.
 * Garde : rien n'est écrit sans --go. Idempotent : chaque modèle traité est noté dans
 * <fichier>.applied.json et n'est jamais retraité.
 *
 * Usage : node scripts/add-gallery.js --file <galerie-ia.json>           (plan, aucune écriture)
 *         node scripts/add-gallery.js --file <galerie-ia.json> --go      (écrit)
 *         [--slugs a,b]
 * .env requis : VITE_SUPABASE_URL, ADMIN_BULK_SECRET
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { detoure } from './lib/detoure.js';
import { photoQc } from './lib/photo-qc.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sharp = createRequire(resolve(__dirname, 'package.json'))('sharp');
const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(`--${n}`); return i !== -1 && args[i + 1] ? args[i + 1] : d; };
const GO = args.includes('--go');
const FILE = opt('file');
const ONLY = opt('slugs') ? opt('slugs').split(',').map((s) => s.trim()) : null;
if (!FILE) { console.error('Usage : node scripts/add-gallery.js --file <galerie-ia.json> [--go] [--slugs a,b]'); process.exit(1); }

function loadEnv() {
  const envPath = resolve(__dirname, '../.env');
  let content;
  try { content = readFileSync(envPath, 'utf-8'); } catch { console.error('❌ .env introuvable :', envPath); process.exit(1); }
  const env = {};
  for (const line of content.split('\n')) {
    const m = line.match(/^([^#=][^=]*)=["']?([^"'\r\n]*)["']?/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36' };

async function main() {
  const env = loadEnv();
  if (!env.VITE_SUPABASE_URL || !env.ADMIN_BULK_SECRET) { console.error('❌ .env : VITE_SUPABASE_URL ou ADMIN_BULK_SECRET manquant'); process.exit(1); }
  const URL_FN = `${env.VITE_SUPABASE_URL}/functions/v1/process-images`;
  const path = resolve(process.cwd(), FILE);
  const data = JSON.parse(readFileSync(path, 'utf-8'));
  const appliedPath = path.replace(/\.json$/, '.applied.json');
  const applied = existsSync(appliedPath) ? JSON.parse(readFileSync(appliedPath, 'utf-8')) : {};

  const todo = Object.entries(data).filter(([slug, r]) => (!ONLY || ONLY.includes(slug)) && r.picks?.length && !applied[slug]);
  const nPhotos = todo.reduce((s, [, r]) => s + r.picks.length, 0);
  console.log(`🖼  Galerie — ${todo.length} modèle(s), ${nPhotos} photo(s) à ajouter${GO ? '' : ' · PLAN SEUL (ajoute --go pour écrire)'} · déjà traités : ${Object.keys(applied).length}`);
  if (!GO) {
    for (const [slug, r] of todo) console.log(`  ${slug} : +${r.picks.length}${r.replace ? ' (REMPLACE la photo principale)' : ''}`);
    return;
  }

  let okModels = 0, okImgs = 0, errImgs = 0;
  for (const [slug, r] of todo) {
    let sent = 0;
    for (let i = 0; i < r.picks.length; i++) {
      const p = r.picks[i];
      try {
        const res = await fetch(p.url, { headers: UA, signal: AbortSignal.timeout(20000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const src = await sharp(Buffer.from(await res.arrayBuffer())).png().toBuffer();
        const png = await detoure(new Blob([src], { type: 'image/png' }));
        const qc = await photoQc(png);
        if (qc.verdict === 'FAIL') throw new Error(`contrôle qualité : ${qc.reasons.join(', ')}`);
        const out = await fetch(URL_FN, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-secret': env.ADMIN_BULK_SECRET },
          body: JSON.stringify({ entity_type: 'scooter', entity_id: r.id, images_base64: [png.toString('base64')], alt_base: r.name, reset: Boolean(r.replace) && sent === 0 }),
        });
        const json = await out.json().catch(() => null);
        if (!out.ok || json?.success !== true || !(json.processed_count > 0)) throw new Error(json?.error || `HTTP ${out.status}`);
        sent++; okImgs++;
      } catch (e) { errImgs++; console.log(`  ⚠ ${slug} photo ${i + 1} : ${e.message}`); }
    }
    console.log(`  ${sent ? '✅' : '✖'} ${slug} : ${sent}/${r.picks.length} photo(s) ajoutée(s)`);
    if (sent) { okModels++; applied[slug] = { sent, date: new Date().toISOString() }; writeFileSync(appliedPath, JSON.stringify(applied, null, 2)); }
  }
  console.log(`\nBILAN GALERIE : ${okModels} modèle(s) enrichi(s) · ${okImgs} photo(s) ajoutée(s) · ${errImgs} échec(s)`);
}

main().catch((e) => { console.error('❌', e.message); process.exit(1); });
