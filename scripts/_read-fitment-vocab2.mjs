// scripts/_read-fitment-vocab2.mjs
// LECTURE SEULE (GET uniquement, clé anon) : complément de _read-fitment-vocab.mjs.
// Lit les tables fitment_* de types.ts pas encore couvertes :
//   fitment_tire_sections, fitment_caliper_families (lignes complètes demandées),
//   fitment_disc_diameters, fitment_disc_pcd, fitment_disc_holes (complètes si
//   <100 lignes, sinon colonnes + count).
// Déjà lues au run précédent : fitment_rim_diameters (10 lignes), fitment_raw (0 ligne anon).
// Usage : node scripts/_read-fitment-vocab2.mjs

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

// GET toutes les lignes (pages de 1000) + count exact via Content-Range.
async function getAll(table) {
  const PAGE = 1000;
  let all = [];
  let exactCount = null;
  for (let from = 0; ; from += PAGE) {
    const u = new URL(`${BASE}/rest/v1/${table}`);
    u.searchParams.set('select', '*');
    const res = await fetch(u, {
      headers: {
        ...HEADERS,
        Range: `${from}-${from + PAGE - 1}`,
        Prefer: 'count=exact',
      },
    });
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch { body = text.slice(0, 300); }
    if (!res.ok) return { ok: false, status: res.status, body };
    const range = res.headers.get('content-range'); // ex. "0-9/10"
    const m = range?.match(/\/(\d+|\*)$/);
    if (m && m[1] !== '*') exactCount = parseInt(m[1], 10);
    all = all.concat(body);
    if (body.length < PAGE) break;
  }
  return { ok: true, rows: all, count: exactCount ?? all.length };
}

async function readTable(table, { fullIfUnder = Infinity } = {}) {
  const r = await getAll(table);
  if (!r.ok) {
    anomalies.push({ table, error: r.body?.message ?? r.body, status: r.status });
    return null;
  }
  if (r.count === 0) {
    anomalies.push({
      table,
      note: '0 ligne — table vide OU RLS anon sans policy de lecture (indistinguable en 200)',
    });
    return { count: 0, rows: [] };
  }
  if (r.count < fullIfUnder) return { count: r.count, rows: r.rows };
  return {
    count: r.count,
    columns: r.rows.length > 0 ? Object.keys(r.rows[0]) : [],
    rows_omitted: `>= ${fullIfUnder} lignes — colonnes + count uniquement`,
  };
}

const out = {};

// 1-2. Lignes complètes demandées explicitement.
out.fitment_tire_sections = await readTable('fitment_tire_sections');
out.fitment_caliper_families = await readTable('fitment_caliper_families');

// 3. Autres tables fitment_* de types.ts pas encore lues : complètes si <100 lignes.
out.autres_tables_fitment = {
  deja_lues_run_precedent: {
    fitment_rim_diameters: '10 lignes (JSON du run précédent)',
    fitment_raw: '0 ligne en anon (anomalie déjà signalée)',
  },
  fitment_disc_diameters: await readTable('fitment_disc_diameters', { fullIfUnder: 100 }),
  fitment_disc_pcd: await readTable('fitment_disc_pcd', { fullIfUnder: 100 }),
  fitment_disc_holes: await readTable('fitment_disc_holes', { fullIfUnder: 100 }),
};

out.anomalies = anomalies;
console.log(JSON.stringify(out, null, 2));
