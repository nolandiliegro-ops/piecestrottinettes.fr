#!/usr/bin/env node
// scripts/suppliers/airtable-push-lot.mjs
// Écrit un lot fournisseur préparé par Claude (config/lots/<lot>.json) dans Airtable :
// une fiche Pièces (brouillon) + une fiche Liaison vers le fournisseur, par article.
// Le lot est relu et validé AVANT (prix, clés, photos) : ce script ne décide rien, il écrit.
//
// Idempotent : un article dont la « Référence constructeur » existe déjà dans Pièces est SAUTÉ
// (ni pièce, ni liaison). Relancé deux fois, il n'écrit rien la 2e fois.
// DRY_RUN par défaut : n'écrit que si DRY_RUN=false.
//
// Usage : node scripts/suppliers/airtable-push-lot.mjs --file config/lots/ewheel-lot2.json
//         DRY_RUN=false node scripts/suppliers/airtable-push-lot.mjs --file config/lots/ewheel-lot2.json

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'appCVWWSvCrOFSMpZ';
const T_PIECES = 'tblV3rukuKXNjvWVw';
const T_LIAISON = 'tbl2NhTcgrEJSDjUl';
const F_REF = 'fldb8PaL7dFGvJFbO';           // Référence constructeur (clé de dédup)
const F_LIAISON_PIECE = 'fldis5RUHBNjlV99X'; // Liaison → Pièce
const F_LIAISON_FOURN = 'fldcCz7cQwJFUyM5G'; // Liaison → Fournisseur

function loadEnv() {
  const env = {};
  for (const line of readFileSync(resolve(__dirname, '../../.env'), 'utf-8').split('\n')) {
    const m = line.match(/^([^#=][^=]*)=["']?([^"'\r\n]*)["']?/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

const args = process.argv.slice(2);
const file = args[args.indexOf('--file') + 1];
if (!file || args.indexOf('--file') === -1) { console.error('Usage : --file config/lots/<lot>.json'); process.exit(1); }
const ENV = loadEnv();
const KEY = ENV.AIRTABLE_API_KEY;
if (!KEY) { console.error('❌ AIRTABLE_API_KEY absent du .env'); process.exit(1); }
const DRY = String(process.env.DRY_RUN ?? 'true').toLowerCase() !== 'false';
const lot = JSON.parse(readFileSync(resolve(process.cwd(), file), 'utf-8'));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function api(path, opts = {}) {
  for (let i = 1; i <= 4; i++) {
    const res = await fetch(`https://api.airtable.com/v0/${BASE}/${path}`, {
      ...opts,
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    });
    if (res.status === 429) { await sleep(1500 * i); continue; }
    const body = await res.json();
    if (!res.ok) throw new Error(`${path} : HTTP ${res.status} ${JSON.stringify(body.error || body)}`);
    return body;
  }
  throw new Error(`${path} : 429 persistant`);
}

async function existingRefs() {
  const refs = new Set();
  let offset;
  do {
    const q = new URLSearchParams({ pageSize: '100', returnFieldsByFieldId: 'true' });
    q.append('fields[]', F_REF);
    if (offset) q.set('offset', offset);
    const j = await api(`${T_PIECES}?${q}`);
    for (const r of j.records) if (r.fields[F_REF]) refs.add(String(r.fields[F_REF]).trim());
    offset = j.offset;
    await sleep(220);
  } while (offset);
  return refs;
}

async function createBatch(table, records) {
  const out = [];
  for (let i = 0; i < records.length; i += 10) {
    const j = await api(table, {
      method: 'POST',
      body: JSON.stringify({ records: records.slice(i, i + 10).map((fields) => ({ fields })), typecast: true, returnFieldsByFieldId: true }),
    });
    out.push(...j.records);
    await sleep(220);
  }
  return out;
}

const refs = await existingRefs();
const todo = lot.items.filter((it) => !refs.has(String(it.piece[F_REF]).trim()));
const skipped = lot.items.length - todo.length;
console.log(`[lot ${lot.lot}] articles : ${lot.items.length} · déjà dans Airtable (sautés) : ${skipped} · à créer : ${todo.length} · ${DRY ? 'SIMULATION' : 'ÉCRITURE'}`);
for (const it of todo) console.log(`  + ${it.piece[F_REF]} · ${it.piece.fldgD03vwej0wTDM0} · ${it.piece.fldHbnijvy1jhKLyz} €`);
if (DRY || todo.length === 0) process.exit(0);

const pieces = await createBatch(T_PIECES, todo.map((it) => it.piece));
if (pieces.length !== todo.length) throw new Error(`pièces créées ${pieces.length} ≠ ${todo.length}`);
const byRef = new Map(pieces.map((r) => [String(r.fields[F_REF]).trim(), r.id]));
const liaisons = await createBatch(
  T_LIAISON,
  todo.map((it) => ({ ...it.liaison, [F_LIAISON_PIECE]: [byRef.get(String(it.piece[F_REF]).trim())], [F_LIAISON_FOURN]: [lot.fournisseur_record_id] })),
);
console.log(`[lot ${lot.lot}] ÉCRIT : pièces ${pieces.length} · liaisons ${liaisons.length}`);
if (liaisons.length !== pieces.length) { console.error('⚠ liaisons ≠ pièces'); process.exit(1); }
