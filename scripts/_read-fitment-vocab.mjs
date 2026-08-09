// scripts/_read-fitment-vocab.mjs
// LECTURE SEULE (GET uniquement, clé anon) : extrait le vocabulaire canonique des
// clés de montage pour seeder des selects Airtable. Modèle : _smoke-read-fitment.mjs.
// Usage : node scripts/_read-fitment-vocab.mjs
//
// Sortie : un seul bloc JSON { rim_diameter_codes, fixtures_fitment_specs,
// fitment_raw_geom_distinct, scooter_disc_codes_distinct, anomalies }.
// Aucune valeur inventée : si une table/colonne n'existe pas sous ce nom exact,
// on liste les colonnes réelles et on signale l'écart dans `anomalies`.

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const content = readFileSync(resolve(__dirname, '../.env'), 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const m = line.match(/^([^#=][^=]*)=["']?([^"'\r\n]*)["']?/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

const env = loadEnv();
const BASE = env.VITE_SUPABASE_URL;
const ANON = env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!BASE || !ANON) {
  console.error('VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY manquante');
  process.exit(1);
}

const HEADERS = { apikey: ANON, Authorization: `Bearer ${ANON}` };
const anomalies = [];

// GET une page PostgREST. Retourne { ok, rows, status, body }.
async function get(table, params, rangeFrom, rangeTo) {
  const u = new URL(`${BASE}/rest/v1/${table}`);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const headers = { ...HEADERS };
  if (rangeFrom !== undefined) headers.Range = `${rangeFrom}-${rangeTo}`;
  const res = await fetch(u, { headers });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text.slice(0, 300); }
  return { ok: res.ok, rows: res.ok ? body : null, status: res.status, body };
}

// GET toutes les lignes par pages de 1000 (contourne le max-rows PostgREST).
async function getAll(table, params) {
  const PAGE = 1000;
  let all = [];
  for (let from = 0; ; from += PAGE) {
    const r = await get(table, params, from, from + PAGE - 1);
    if (!r.ok) return r;
    all = all.concat(r.rows);
    if (r.rows.length < PAGE) break;
  }
  return { ok: true, rows: all };
}

// En cas d'échec (colonne/table inconnue) : liste les colonnes réelles via une
// ligne select=* et pousse l'écart dans anomalies. Ne devine jamais.
async function reportShape(table, context, failure) {
  anomalies.push({ table, context, error: failure.body?.message ?? failure.body, status: failure.status });
  const probe = await get(table, { select: '*' }, 0, 0);
  if (probe.ok && Array.isArray(probe.rows)) {
    anomalies.push({
      table,
      real_columns: probe.rows.length > 0 ? Object.keys(probe.rows[0]) : '(table vide ou non lisible en anon — 0 ligne)',
    });
  } else {
    anomalies.push({ table, probe_error: probe.body?.message ?? probe.body, status: probe.status });
  }
}

const out = {};

// ── 1. fitment_rim_diameters : toutes lignes, toutes colonnes ─────────────────
{
  const r = await getAll('fitment_rim_diameters', { select: '*', order: 'code' });
  if (r.ok) {
    out.rim_diameter_codes = r.rows;
    if (r.rows.length === 0) {
      anomalies.push({ table: 'fitment_rim_diameters', note: '0 ligne — table vide OU RLS anon sans policy de lecture (indistinguable en 200)' });
    }
  } else {
    out.rim_diameter_codes = null;
    await reportShape('fitment_rim_diameters', 'select=*', r);
  }
}

// ── 2. parts : fixtures + toute autre ligne avec fitment_specs non null ───────
{
  const FIXTURES = ['disque-frein-160-6-trous-example', 'pneu-10x2125-tubeless-example'];
  const bySlug = {};
  const rFix = await getAll('parts', {
    select: 'slug,fitment_specs',
    slug: `in.(${FIXTURES.map((s) => `"${s}"`).join(',')})`,
  });
  const rAll = await getAll('parts', {
    select: 'slug,fitment_specs',
    fitment_specs: 'not.is.null',
    order: 'slug',
  });
  if (rFix.ok) for (const row of rFix.rows) bySlug[row.slug] = row.fitment_specs;
  else await reportShape('parts', 'fixtures par slug', rFix);
  if (rAll.ok) for (const row of rAll.rows) bySlug[row.slug] = row.fitment_specs;
  else await reportShape('parts', 'fitment_specs not.is.null', rAll);
  out.fixtures_fitment_specs = bySlug;
}

// ── 3. fitment_raw : distincts des clés de geom + geom_signature ──────────────
{
  const r = await getAll('fitment_raw', { select: 'geom,geom_signature' });
  if (r.ok) {
    const perKey = new Map(); // clé geom -> Map(valeur JSON -> count)
    const signatures = new Map(); // geom_signature -> count
    let geomNull = 0;
    for (const row of r.rows) {
      if (row.geom_signature != null) {
        signatures.set(row.geom_signature, (signatures.get(row.geom_signature) ?? 0) + 1);
      }
      const geom = row.geom;
      if (geom == null || typeof geom !== 'object') { geomNull++; continue; }
      for (const [k, v] of Object.entries(geom)) {
        if (!perKey.has(k)) perKey.set(k, new Map());
        const key = typeof v === 'object' ? JSON.stringify(v) : String(v);
        perKey.get(k).set(key, (perKey.get(k).get(key) ?? 0) + 1);
      }
    }
    const sortDistinct = (m) =>
      [...m.entries()]
        .map(([valeur, count]) => ({ valeur, count }))
        .sort((a, b) => b.count - a.count || String(a.valeur).localeCompare(String(b.valeur), 'fr', { numeric: true }));
    out.fitment_raw_geom_distinct = {
      total_rows: r.rows.length,
      rows_geom_null: geomNull,
      keys: Object.fromEntries([...perKey.entries()].map(([k, m]) => [k, sortDistinct(m)])),
      geom_signatures: sortDistinct(signatures),
    };
    if (r.rows.length === 0) {
      anomalies.push({ table: 'fitment_raw', note: '0 ligne — table vide OU RLS anon sans policy de lecture (indistinguable en 200)' });
    }
  } else {
    out.fitment_raw_geom_distinct = null;
    await reportShape('fitment_raw', 'select=geom,geom_signature', r);
  }
}

// ── 4. scooter_models : distincts disc_*_code hors null ───────────────────────
{
  const COLS = ['disc_diameter_code', 'disc_pcd_code', 'disc_holes_code'];
  const r = await getAll('scooter_models', { select: COLS.join(',') });
  if (r.ok) {
    const result = {};
    for (const col of COLS) {
      const m = new Map();
      for (const row of r.rows) {
        const v = row[col];
        if (v == null) continue;
        m.set(v, (m.get(v) ?? 0) + 1);
      }
      result[col] = [...m.entries()]
        .map(([valeur, count]) => ({ valeur, count }))
        .sort((a, b) => String(a.valeur).localeCompare(String(b.valeur), 'fr', { numeric: true }));
    }
    result.total_models = r.rows.length;
    out.scooter_disc_codes_distinct = result;
  } else {
    out.scooter_disc_codes_distinct = null;
    await reportShape('scooter_models', 'select=disc_*_code', r);
  }
}

out.anomalies = anomalies;
console.log(JSON.stringify(out, null, 2));
