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

const STATUT_EXTRAIT = 'Extrait';
const STATUT_BLOQUE = 'Bloqué';
const STATUT_ERREUR = 'Erreur';

const DELAY_BETWEEN_MS = 2500; // anti rate-limit entre pièces
const BLOCKED_RETRY_PAUSE_MS = 10000; // pause avant le retry sur "blocked"

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

const firstLink = (v) => (Array.isArray(v) && v.length > 0 ? v[0] : null);
const asArray = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);
const joinList = (v) => asArray(v).map((x) => String(x).trim()).filter(Boolean).join(', ');

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
  for (const r of await fetchTable(TABLE_PIECES, [F_PIECE_STATUT, F_PIECE_REEXTRAIRE])) {
    piecesById.set(r.id, r.fields);
  }
  console.log(`[enrich] ${liaisons.length} liaisons, ${piecesById.size} pièces.`);

  // Ne garder que les liaisons avec une URL fournisseur.
  const todo = liaisons.filter((r) => r.fields[F_LIAISON_URL]);
  console.log(`[enrich] ${todo.length} liaison(s) avec URL fournisseur.\n`);

  let ok = 0, blocked = 0, errored = 0, skipped = 0;
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

      if (DRY_RUN) {
        console.log(`   [DRY] ${pieceId} ← ${JSON.stringify(fields)}`);
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
  if (blockedUrls.length > 0) {
    console.log('\nURLs bloquées :');
    for (const u of blockedUrls) console.log(`  • ${u}`);
  }
  if (DRY_RUN) {
    console.log('\n[enrich] DRY_RUN actif — aucune écriture. Mettre DRY_RUN=false dans .env pour écrire.');
  }
}

main().catch((e) => { console.error('[enrich] ❌ Fatal:', e); process.exit(1); });
