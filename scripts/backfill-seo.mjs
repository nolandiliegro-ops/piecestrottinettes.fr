#!/usr/bin/env node
/**
 * scripts/backfill-seo.mjs
 * Backfill ciblé du SEO pour les pièces "orphelines" : characteristics rempli MAIS
 * description / meta_title / meta_description vide(s). Découplé d'extract-product :
 * on régénère le SEO À PARTIR DES SPECS DÉJÀ EN BASE (Supabase), on n'rescrape rien.
 *
 * Source de vérité = AIRTABLE : on écrit les 3 champs SEO sur la fiche Airtable (mêmes
 * field IDs qu'enrich.js) + Re-extraire=false. La propagation vers Supabase se fait
 * ensuite via le sync existant (scripts/sync-airtable-wattiz.js), HORS de ce script.
 *
 * DRY_RUN=true par défaut : appelle generate-part-seo (lecture), AFFICHE le PATCH qui
 * serait fait, n'écrit RIEN. Mettre DRY_RUN=false dans .env pour écrire réellement.
 *
 * Node pur (global fetch + node:fs), ESM, AUCUNE dépendance. Ne modifie pas le .env.
 * Ne touche ni enrich.js ni generate-part-seo (réutilisés tels quels).
 *
 * Usage : node scripts/backfill-seo.mjs
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── .env (loader manuel, strip guillemets — identique à enrich.js / sync) ──────
function loadEnv() {
  const envPath = resolve(__dirname, '../.env');
  let content;
  try { content = readFileSync(envPath, 'utf-8'); }
  catch { console.error('❌ .env introuvable :', envPath); process.exit(1); }
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^([^#=][^=]*)=["']?([^"'\r\n]*)["']?/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

const ENV = loadEnv();

// DRY_RUN par défaut TRUE : on n'écrit dans Airtable que si DRY_RUN="false".
const DRY_RUN = String(ENV.DRY_RUN ?? 'true').toLowerCase() !== 'false';

const SUPABASE_URL = ENV.VITE_SUPABASE_URL || 'https://kqsxscjtlipregkrmucg.supabase.co';
const SUPABASE_ANON = ENV.VITE_SUPABASE_PUBLISHABLE_KEY;
const ADMIN_BULK_SECRET = ENV.ADMIN_BULK_SECRET;
const AIRTABLE_API_KEY = ENV.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = ENV.AIRTABLE_BASE_ID || 'appCVWWSvCrOFSMpZ';
const GENERATE_SEO_URL =
  ENV.GENERATE_PART_SEO_URL ||
  `${SUPABASE_URL}/functions/v1/generate-part-seo`;

// ─── Airtable : table Pièces + field IDs (identiques à enrich.js) ───────────────
const TABLE_PIECES = 'tblV3rukuKXNjvWVw';
const F_PIECE_REEXTRAIRE = 'fldVS8dEifS4nifqM';  // checkbox Re-extraire
const F_PIECE_DESC_SEO = 'fld4U8m1qArXwpprE';    // Description SEO   → parts.description
const F_PIECE_META_TITLE = 'fldUPz6QJlJubuWPV';  // Meta title SEO    → parts.meta_title
const F_PIECE_META_DESC = 'fldxkVuvjl1GfMsgE';   // Meta description  → parts.meta_description

const SEO_MAX_ATTEMPTS = 3;       // 1 + 2 retries
const SEO_RETRY_PAUSE_MS = 1500;
const DELAY_BETWEEN_MS = 2500;    // anti rate-limit entre pièces

if (!SUPABASE_ANON) { console.error('❌ VITE_SUPABASE_PUBLISHABLE_KEY manquante dans .env'); process.exit(1); }
if (!ADMIN_BULK_SECRET) { console.error('❌ ADMIN_BULK_SECRET manquante dans .env'); process.exit(1); }
if (!AIRTABLE_API_KEY) { console.error('❌ AIRTABLE_API_KEY manquante dans .env'); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isEmpty = (v) => v == null || (typeof v === 'string' && v.trim() === '');
const len = (v) => (typeof v === 'string' ? [...v].length : 0);
const splitCsv = (v) =>
  typeof v === 'string' ? v.split(',').map((x) => x.trim()).filter(Boolean) : [];

// ─── 1. Sélection des orphelines (Supabase REST, lecture anon) ──────────────────
async function fetchOrphans() {
  const url = new URL(`${SUPABASE_URL}/rest/v1/parts`);
  url.searchParams.set(
    'select',
    'id,slug,name,characteristics,compatibility_source,ean,category_id,description,meta_title,meta_description,technical_metadata,categories(name)'
  );
  // Pré-filtre serveur large : characteristics non null. Le reste se fait côté JS
  // (PostgREST gère mal la chaîne vide).
  url.searchParams.set('characteristics', 'not.is.null');
  url.searchParams.set('limit', '5000');

  const res = await fetch(url.toString(), {
    headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
  });
  if (!res.ok) throw new Error(`Supabase parts ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const rows = await res.json();

  // Orphelin = characteristics non vide ET au moins un des 3 champs SEO vide.
  return rows.filter(
    (p) =>
      !isEmpty(p.characteristics) &&
      (isEmpty(p.description) || isEmpty(p.meta_title) || isEmpty(p.meta_description))
  );
}

// ─── 2. generate-part-seo (réutilisé tel quel, x-admin-secret) ──────────────────
// Renvoie { status, description?, meta_title?, meta_description?, message? }.
async function callGenerateSeo(payload) {
  const res = await fetch(GENERATE_SEO_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_BULK_SECRET },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); }
  catch { return { status: `non_json_http_${res.status}`, message: text.slice(0, 120) }; }
  return json;
}

// ─── 3. Airtable PATCH (cible durable) ──────────────────────────────────────────
async function patchPiece(recordId, fields) {
  const res = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE_PIECES}/${recordId}`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields, typecast: true }),
    }
  );
  if (!res.ok) throw new Error(`PATCH ${recordId} ${res.status}: ${(await res.text()).slice(0, 160)}`);
  return res.json();
}

// Filet H1 identique à enrich.js : la PDP a déjà son <h1> (nom de la pièce).
const downgradeH1 = (html) => String(html ?? '').replace(/<(\/?)h1\b([^>]*)>/gi, '<$1h2$2>');

// ─── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`[backfill-seo] Mode : ${DRY_RUN ? 'DRY_RUN (aucune écriture Airtable)' : '⚠️  ÉCRITURE RÉELLE Airtable'}`);
  console.log('[backfill-seo] Sélection des pièces orphelines (characteristics OK, SEO incomplet)...');

  const orphans = await fetchOrphans();
  console.log(`[backfill-seo] ${orphans.length} pièce(s) orpheline(s) :`);
  for (const p of orphans) {
    const miss = [
      isEmpty(p.description) ? 'description' : null,
      isEmpty(p.meta_title) ? 'meta_title' : null,
      isEmpty(p.meta_description) ? 'meta_description' : null,
    ].filter(Boolean).join(', ');
    console.log(`   • ${p.slug}  (manque: ${miss} | characteristics ${len(p.characteristics)}c)`);
  }
  console.log('');

  let seoOk = 0, seoFail = 0, written = 0, skippedNoRec = 0;

  for (const p of orphans) {
    console.log(`\n── ${p.slug} ──`);
    const airtableId = p.technical_metadata?.airtable_id ?? null;

    const payload = {
      name: p.name,
      specs: p.characteristics,
      compatibility: splitCsv(p.compatibility_source),
      ean: p.ean,
      category_hint: p.categories?.name ?? null,
      brand: null,
    };

    // 3 tentatives, on logge le status de CHACUNE (révèle pourquoi ça échouait).
    let seo = null;
    for (let attempt = 1; attempt <= SEO_MAX_ATTEMPTS; attempt++) {
      const r = await callGenerateSeo(payload);
      const ok = r.status === 'ok' && !isEmpty(r.description) && !isEmpty(r.meta_title) && !isEmpty(r.meta_description);
      console.log(`   tentative ${attempt}/${SEO_MAX_ATTEMPTS}: status=${r.status}${r.message ? ` (${r.message})` : ''}${ok ? ' ✅' : ''}`);
      if (ok) { seo = r; break; }
      if (attempt < SEO_MAX_ATTEMPTS) await sleep(SEO_RETRY_PAUSE_MS);
    }

    if (!seo) {
      seoFail++;
      console.log(`   ⚠  SEO échec définitif (${SEO_MAX_ATTEMPTS} tentatives) — rien écrit, Re-extraire laissé tel quel.`);
      await sleep(DELAY_BETWEEN_MS);
      continue;
    }

    seoOk++;
    const description = downgradeH1(seo.description);
    const meta_title = seo.meta_title;
    const meta_description = seo.meta_description;

    // Aperçu des 3 champs générés.
    console.log(`   📝 meta_title    (${len(meta_title)}c): ${meta_title}`);
    console.log(`   📝 meta_descript (${len(meta_description)}c): ${meta_description}`);
    const descPreview = description.replace(/\s+/g, ' ').slice(0, 200);
    console.log(`   📝 description   (${len(description)}c): ${descPreview}${len(description) > 200 ? '…' : ''}`);

    // Écriture (garde anti-null : les 3 sont non vides ici par construction).
    const fields = {
      [F_PIECE_DESC_SEO]: description,
      [F_PIECE_META_TITLE]: meta_title,
      [F_PIECE_META_DESC]: meta_description,
      [F_PIECE_REEXTRAIRE]: false,
    };

    if (!airtableId) {
      skippedNoRec++;
      console.log(`   ⚠  technical_metadata.airtable_id absent → écriture durable impossible, skip.`);
    } else if (DRY_RUN) {
      console.log(`   [DRY] PATCH Airtable ${airtableId} ← Description SEO / Meta title / Meta desc + Re-extraire=false`);
    } else {
      await patchPiece(airtableId, fields);
      written++;
      console.log(`   💾 écrit sur Airtable ${airtableId} (Re-extraire=false)`);
    }

    await sleep(DELAY_BETWEEN_MS);
  }

  console.log('\n──────── Récap ────────');
  console.log(`Orphelines        : ${orphans.length}`);
  console.log(`SEO généré ok     : ${seoOk}`);
  console.log(`SEO échec         : ${seoFail}`);
  console.log(`Sans airtable_id  : ${skippedNoRec}`);
  console.log(`Écrites Airtable  : ${DRY_RUN ? 0 : written}`);
  if (DRY_RUN) {
    console.log('\n[backfill-seo] DRY_RUN actif — aucune écriture. Mettre DRY_RUN=false dans .env pour écrire,');
    console.log('               puis propager vers Supabase via scripts/sync-airtable-wattiz.js.');
  }
}

main().catch((e) => { console.error('[backfill-seo] ❌ Fatal:', e); process.exit(1); });
