#!/usr/bin/env node
/**
 * scripts/enrich.js
 * Enrichit la table Pièces (Airtable) à partir des fiches fournisseurs.
 *
 * Pour chaque ligne de la table Liaison qui possède une URL fournisseur :
 *   1. résout la Pièce liée ;
 *   2. saute si la pièce est déjà "Extrait" sans "Re-extraire" coché ;
 *   3. appelle l'Edge Function extract-product avec l'URL ;
 *   4. écrit le résultat sur la PIÈCE (jamais sur Nom/Marque/Catégorie/Prix).
 *
 * DRY_RUN=true par défaut : fait les appels extract-product et AFFICHE ce qui
 * serait écrit, sans rien écrire dans Airtable. Mettre DRY_RUN=false dans .env
 * pour écrire réellement.
 *
 * Usage :
 *   node scripts/enrich.js
 *
 * Même pattern .env / fetch brut que scripts/sync-airtable-wattiz.js
 * (pas de dépendance airtable / dotenv).
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── .env (loader manuel, strip les guillemets — identique à sync-parts.js) ────
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

const ENV = loadEnv();

// DRY_RUN par défaut TRUE : on n'écrit dans Airtable que si DRY_RUN="false".
const DRY_RUN = String(ENV.DRY_RUN ?? 'true').toLowerCase() !== 'false';

const AIRTABLE_API_KEY = ENV.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = ENV.AIRTABLE_BASE_ID || 'appCVWWSvCrOFSMpZ';
const ADMIN_BULK_SECRET = ENV.ADMIN_BULK_SECRET;
const EXTRACT_URL =
  ENV.EXTRACT_PRODUCT_URL ||
  'https://kqsxscjtlipregkrmucg.supabase.co/functions/v1/extract-product';
const GENERATE_SEO_URL =
  ENV.GENERATE_PART_SEO_URL ||
  'https://kqsxscjtlipregkrmucg.supabase.co/functions/v1/generate-part-seo';

// ─── Tables & champs (IDs Airtable, robustes aux renommages) ───────────────────
const TABLE_LIAISON = 'tbl2NhTcgrEJSDjUl';
const TABLE_PIECES = 'tblV3rukuKXNjvWVw';

const F_LIAISON_URL = 'fldpreOJ6fnrNxlur';        // Liaison : URL fournisseur
const F_LIAISON_PIECE_FALLBACK = 'fldis5RUHBNjlV99X'; // Liaison : lien "Pièce" (fallback si Meta KO)

const F_PIECE_STATUT = 'fldF4DK0FbyCDe56r';       // Pièces : Statut extraction (singleSelect)
const F_PIECE_REEXTRAIRE = 'fldVS8dEifS4nifqM';   // Pièces : Re-extraire (checkbox)
const F_PIECE_EAN = 'fldCdtbyVIh76jLT0';          // Pièces : EAN
const F_PIECE_SPECS = 'fldwCu08OnHRBZz4Y';        // Pièces : Caractéristiques
const F_PIECE_COMPAT = 'fldotemKZlLMUP8Um';       // Pièces : Compatibilité source
const F_PIECE_PHOTOS = 'fldiB7HKuHL7CU8yp';       // Pièces : Photos source
// Champs SEO rédigés par generate-part-seo (jamais le champ "Description" brut fldHEGORilfwqhpPA :
// sync-airtable-wattiz pousse "Description SEO" → parts.description).
const F_PIECE_DESC_SEO = 'fld4U8m1qArXwpprE';     // Pièces : Description SEO   → parts.description
const F_PIECE_META_TITLE = 'fldUPz6QJlJubuWPV';   // Pièces : Meta title SEO   → parts.meta_title
const F_PIECE_META_DESC = 'fldxkVuvjl1GfMsgE';    // Pièces : Meta description SEO → parts.meta_description

const STATUT_EXTRAIT = 'Extrait';
const STATUT_BLOQUE = 'Bloqué';
const STATUT_ERREUR = 'Erreur';

const DELAY_BETWEEN_MS = 2500; // anti rate-limit entre pièces
const BLOCKED_RETRY_PAUSE_MS = 10000; // pause avant le retry sur "blocked"
const SEO_MAX_ATTEMPTS = 3;       // VOLET 1 : 3 tentatives generate-part-seo (1 + 2 retries)
const SEO_RETRY_PAUSE_MS = 1500;  // pause entre tentatives SEO

if (!AIRTABLE_API_KEY) { console.error('❌ AIRTABLE_API_KEY manquante dans .env'); process.exit(1); }
if (!ADMIN_BULK_SECRET) { console.error('❌ ADMIN_BULK_SECRET manquante dans .env'); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Airtable REST helpers ─────────────────────────────────────────────────────
const AT_HEADERS = { Authorization: `Bearer ${AIRTABLE_API_KEY}` };

// Lit une table entière (paginée). returnFieldsByFieldId=true → r.fields keyé par ID.
async function fetchTable(tableId, fieldIds) {
  let all = [];
  let offset = null;
  do {
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableId}`);
    url.searchParams.set('pageSize', '100');
    url.searchParams.set('returnFieldsByFieldId', 'true');
    if (offset) url.searchParams.set('offset', offset);
    if (Array.isArray(fieldIds)) {
      for (const f of fieldIds) url.searchParams.append('fields[]', f);
    }
    const res = await fetch(url.toString(), { headers: AT_HEADERS });
    if (!res.ok) throw new Error(`Airtable ${tableId} ${res.status}: ${await res.text()}`);
    const data = await res.json();
    all = all.concat(data.records);
    offset = data.offset;
  } while (offset);
  return all;
}

// Identifie le champ lien Liaison → Pièces via l'API Meta (PAT a schema:read).
// Fallback sur l'ID connu si l'appel échoue.
async function resolveLiaisonPieceField() {
  try {
    const res = await fetch(
      `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`,
      { headers: AT_HEADERS },
    );
    if (!res.ok) throw new Error(`meta ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const liaison = data.tables?.find((t) => t.id === TABLE_LIAISON);
    const linkField = liaison?.fields?.find(
      (f) => f.type === 'multipleRecordLinks' && f.options?.linkedTableId === TABLE_PIECES,
    );
    if (linkField) {
      console.log(`[enrich] Champ lien Liaison→Pièces : "${linkField.name}" (${linkField.id})`);
      return linkField.id;
    }
    console.warn('[enrich] ⚠  Champ lien introuvable via Meta, fallback sur ID connu.');
  } catch (e) {
    console.warn(`[enrich] ⚠  Meta API KO (${e.message}), fallback sur ID connu.`);
  }
  return F_LIAISON_PIECE_FALLBACK;
}

// PATCH une pièce. fields keyé par field ID, typecast pour les singleSelect.
async function patchPiece(recordId, fields) {
  const res = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE_PIECES}/${recordId}`,
    {
      method: 'PATCH',
      headers: { ...AT_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields, typecast: true }),
    },
  );
  if (!res.ok) throw new Error(`PATCH ${recordId} ${res.status}: ${await res.text()}`);
  return res.json();
}

// ─── extract-product ───────────────────────────────────────────────────────────
async function callExtract(url) {
  const res = await fetch(EXTRACT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_BULK_SECRET },
    body: JSON.stringify({ url }),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); }
  catch { throw new Error(`réponse non-JSON (HTTP ${res.status}): ${text.slice(0, 120)}`); }
  return json;
}

// ─── generate-part-seo ───────────────────────────────────────────────────────────
// Génère description (HTML) + meta_title + meta_description ORIGINAUX à partir des
// specs vérifiées. Même auth (x-admin-secret) et même style fetch que callExtract.
// Lève si status !== 'ok' → l'appelant traite l'échec en best-effort (specs gardées).
async function callGenerateSeo(payload) {
  const res = await fetch(GENERATE_SEO_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_BULK_SECRET },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); }
  catch { throw new Error(`SEO réponse non-JSON (HTTP ${res.status}): ${text.slice(0, 120)}`); }
  if (json.status !== 'ok') {
    throw new Error(`SEO status=${json.status ?? 'inconnu'}${json.message ? ` (${json.message})` : ''}`);
  }
  return json; // { status, description, meta_title, meta_description }
}

const firstLink = (v) => (Array.isArray(v) && v.length > 0 ? v[0] : null);
const asArray = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);
const joinList = (v) => asArray(v).map((x) => String(x).trim()).filter(Boolean).join(', ');
const nonEmpty = (v) => typeof v === 'string' && v.trim() !== '';

// Construit les champs à écrire selon le status de la réponse extract-product.
function buildFields(json) {
  switch (json.status) {
    case 'ok':
      return {
        [F_PIECE_EAN]: json.ean ?? '',
        [F_PIECE_SPECS]: typeof json.specs === 'string' ? json.specs : JSON.stringify(json.specs ?? ''),
        [F_PIECE_COMPAT]: joinList(json.compatibility),
        [F_PIECE_PHOTOS]: joinList(json.images),
        [F_PIECE_STATUT]: STATUT_EXTRAIT,
        [F_PIECE_REEXTRAIRE]: false,
      };
    case 'blocked':
      return { [F_PIECE_STATUT]: STATUT_BLOQUE };
    case 'error':
    default:
      return { [F_PIECE_STATUT]: STATUT_ERREUR };
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`[enrich] Mode : ${DRY_RUN ? 'DRY_RUN (aucune écriture Airtable)' : '⚠️  ÉCRITURE RÉELLE'}`);

  const pieceLinkField = await resolveLiaisonPieceField();

  console.log('[enrich] Lecture table Liaison...');
  const liaisons = await fetchTable(TABLE_LIAISON, [F_LIAISON_URL, pieceLinkField]);

  console.log('[enrich] Lecture table Pièces...');
  const piecesById = new Map();
  for (const r of await fetchTable(TABLE_PIECES, [
    F_PIECE_STATUT,
    F_PIECE_REEXTRAIRE,
    // Lus pour la garde "Set & Forget" (SEO existant préservé), jamais pour décider
    // de l'extraction elle-même.
    F_PIECE_DESC_SEO,
    F_PIECE_META_TITLE,
  ])) {
    piecesById.set(r.id, r.fields);
  }
  console.log(`[enrich] ${liaisons.length} liaisons, ${piecesById.size} pièces.`);

  // Ne garder que les liaisons avec une URL fournisseur.
  const todo = liaisons.filter((r) => r.fields[F_LIAISON_URL]);
  console.log(`[enrich] ${todo.length} liaison(s) avec URL fournisseur.\n`);

  let ok = 0, blocked = 0, errored = 0, skipped = 0;
  let seoOk = 0, seoFail = 0, seoKept = 0;
  const blockedUrls = [];

  for (const liaison of todo) {
    const url = liaison.fields[F_LIAISON_URL];
    try {
      const pieceId = firstLink(liaison.fields[pieceLinkField]);
      if (!pieceId) {
        console.log(`⏭  ${url} — aucune pièce liée, skip`);
        skipped++; continue;
      }
      const piece = piecesById.get(pieceId);
      if (!piece) {
        console.log(`⏭  ${url} — pièce ${pieceId} introuvable, skip`);
        skipped++; continue;
      }

      // Règle skip : déjà Extrait ET Re-extraire non coché.
      const statut = piece[F_PIECE_STATUT];
      const reextraire = piece[F_PIECE_REEXTRAIRE] === true;
      if (statut === STATUT_EXTRAIT && !reextraire) {
        console.log(`⏭  ${url} — déjà "${STATUT_EXTRAIT}", skip`);
        skipped++; continue;
      }

      // Appel extract-product (+ 1 retry sur blocked après pause).
      console.log(`→  ${url}`);
      let json = await callExtract(url);
      if (json.status === 'blocked') {
        console.log(`   ⏳ blocked — pause ${BLOCKED_RETRY_PAUSE_MS / 1000}s puis retry...`);
        await sleep(BLOCKED_RETRY_PAUSE_MS);
        json = await callExtract(url);
      }

      const fields = buildFields(json);

      // Comptage + log selon status.
      if (json.status === 'ok') {
        ok++;
        console.log(`   ✅ ok`);
      } else if (json.status === 'blocked') {
        blocked++; blockedUrls.push(url);
        console.log(`   🚫 bloqué`);
      } else {
        errored++;
        console.log(`   ❌ erreur${json.error ? ` — ${json.error}` : ''}`);
      }

      // ─── Étape SEO (status ok uniquement) ───────────────────────────────────
      // VOLET 1 : retry (SEO_MAX_ATTEMPTS) car generate-part-seo échoue parfois
      // (validation_failed / parse_failed non déterministes) — même esprit que le
      // retry "blocked" d'extract-product.
      // GARDE "Set & Forget" : si la pièce a DÉJÀ une "Description SEO" ET un
      // "Meta title SEO" non vides, on ne régénère pas et on n'écrit aucun champ
      // SEO — quel que soit l'état de Re-extraire. Seule l'extraction produit
      // (EAN/specs/compat/photos) suit sa logique habituelle. Protège les fiches
      // live, que sync-airtable-wattiz.js resynchronise ensuite vers Supabase.
      const seoAlreadyWritten =
        nonEmpty(piece[F_PIECE_DESC_SEO]) && nonEmpty(piece[F_PIECE_META_TITLE]);

      let seo = null;
      let seoPreserved = false;
      if (json.status === 'ok' && seoAlreadyWritten) {
        seoPreserved = true;
        seoKept++;
        console.log('   🔒 SEO existant préservé — skip');
      } else if (json.status === 'ok') {
        for (let attempt = 1; attempt <= SEO_MAX_ATTEMPTS; attempt++) {
          try {
            seo = await callGenerateSeo({
              name: json.name,
              specs: json.specs,
              compatibility: json.compatibility,
              ean: json.ean,
              category_hint: json.category_hint,
              brand: json.brand,
            });
            break; // succès → sortie de la boucle de retry
          } catch (e) {
            if (attempt < SEO_MAX_ATTEMPTS) {
              console.log(`   ⏳ SEO tentative ${attempt}/${SEO_MAX_ATTEMPTS} KO (${e.message}) — retry dans ${SEO_RETRY_PAUSE_MS / 1000}s...`);
              await sleep(SEO_RETRY_PAUSE_MS);
            } else {
              console.log(`   ⚠  SEO échec définitif après ${SEO_MAX_ATTEMPTS} tentatives — ${e.message}`);
            }
          }
        }

        if (seo) {
          // Filet déterministe : la PDP a déjà son <h1> (nom de la pièce). On downgrade
          // tout <h1>/</h1> résiduel en <h2> pour ne jamais écrire de H1 dual en base.
          fields[F_PIECE_DESC_SEO] = String(seo.description ?? '').replace(/<(\/?)h1\b([^>]*)>/gi, '<$1h2$2>');
          fields[F_PIECE_META_TITLE] = seo.meta_title ?? '';
          fields[F_PIECE_META_DESC] = seo.meta_description ?? '';
          seoOk++;
          const mtLen = [...(seo.meta_title ?? '')].length;
          const mdLen = [...(seo.meta_description ?? '')].length;
          console.log(`   📝 SEO ok (meta_title=${mtLen}c, meta_description=${mdLen}c)`);
        } else {
          // VOLET 2 — garde-fou anti-"faux fini" : SEO KO après tous les essais.
          // L'extraction (ean/specs/compat/photos) reste écrite, MAIS on NE marque PAS
          // la pièce comme terminée : on force Re-extraire=true (override du false posé
          // par buildFields) pour qu'un prochain run la reprenne automatiquement, au
          // lieu de la laisser publiable avec un SEO vide.
          seoFail++;
          fields[F_PIECE_REEXTRAIRE] = true;
          console.log(`   ⚠  SEO manquant → Re-extraire laissé coché (reprise auto au prochain run, extraction conservée)`);
        }
      }

      if (DRY_RUN) {
        console.log(`   [DRY] ${pieceId} ← ${JSON.stringify(fields)}`);
        if (seoPreserved) {
          console.log('   [DRY] SEO non régénéré, aucun champ SEO dans le PATCH.');
        }
        if (seo) {
          console.log(`   [DRY] SEO meta_title    : ${seo.meta_title ?? ''}`);
          console.log(`   [DRY] SEO meta_descript : ${seo.meta_description ?? ''}`);
          const writtenDesc = String(fields[F_PIECE_DESC_SEO] ?? '');
          const descPreview = writtenDesc.replace(/\s+/g, ' ').slice(0, 200);
          console.log(`   [DRY] SEO description   : ${descPreview}${writtenDesc.length > 200 ? '…' : ''}`);
        }
      } else {
        await patchPiece(pieceId, fields);
        console.log(`   💾 écrit sur ${pieceId}`);
      }
    } catch (e) {
      // Ne jamais planter sur une ligne.
      errored++;
      console.log(`   ❌ exception — ${e.message}`);
    }

    await sleep(DELAY_BETWEEN_MS);
  }

  // ─── Récap ──────────────────────────────────────────────────────────────────
  console.log('\n──────── Récap ────────');
  console.log(`✅ ok        : ${ok}`);
  console.log(`🚫 bloquées  : ${blocked}`);
  console.log(`❌ erreurs   : ${errored}`);
  console.log(`⏭  skippées  : ${skipped}`);
  console.log(`📝 SEO ok    : ${seoOk}`);
  console.log(`🔒 SEO gardé : ${seoKept} (existant préservé, non régénéré)`);
  console.log(`⚠  SEO échec : ${seoFail}`);
  if (blockedUrls.length > 0) {
    console.log('\nURLs bloquées :');
    for (const u of blockedUrls) console.log(`  • ${u}`);
  }
  if (DRY_RUN) {
    console.log('\n[enrich] DRY_RUN actif — aucune écriture. Mettre DRY_RUN=false dans .env pour écrire.');
  }
}

main().catch((e) => { console.error('[enrich] ❌ Fatal:', e); process.exit(1); });
