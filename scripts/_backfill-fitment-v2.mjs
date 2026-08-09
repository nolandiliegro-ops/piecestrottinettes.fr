// scripts/_backfill-fitment-v2.mjs
// Backfill one-shot : normalise les fitment_specs legacy non conformes v2.
// Seule transformation autorisée (mécanique, aucune valeur inventée) :
//   brake_disc { diameter: "140", pcd: "48", holes: "5" }  (v1 singulier/scalaire)
//   → brake_disc { diameters: ["140"], pcds: ["48"], holes: ["5"] }  (v2)
// Toute autre non-conformité est SIGNALÉE mais jamais touchée.
//
// Écriture : PATCH REST avec SUPABASE_SERVICE_ROLE_KEY si présente dans .env
// (la clé anon ne peut pas écrire parts — RLS). Sinon : imprime le SQL à coller
// dans le dashboard Supabase et n'écrit rien.
// Usage : node scripts/_backfill-fitment-v2.mjs

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { findMissingPartKeys } from './lib/validate-part-keys.js';

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
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY; // jamais affichée
if (!BASE || !ANON) {
  console.error('VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY manquante');
  process.exit(1);
}

// ── Lecture : toutes les lignes fitment_specs non null (clé anon) ─────────────
async function fetchAllFitment() {
  const PAGE = 1000;
  let all = [];
  for (let from = 0; ; from += PAGE) {
    const u = new URL(`${BASE}/rest/v1/parts`);
    u.searchParams.set('select', 'id,slug,fitment_specs');
    u.searchParams.set('fitment_specs', 'not.is.null');
    u.searchParams.set('order', 'slug');
    const res = await fetch(u, {
      headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, Range: `${from}-${from + PAGE - 1}` },
    });
    if (!res.ok) throw new Error(`REST parts ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const rows = await res.json();
    all = all.concat(rows);
    if (rows.length < PAGE) break;
  }
  return all;
}

// Forme v2 ? On réutilise la lib : catégorie hors mapping → validation de forme seule.
function shapeFaults(fs) {
  const faults = findMissingPartKeys([{ categoryName: '_audit_', parts: [{ slug: 'x', fitment_specs: fs }] }]);
  return faults.length > 0 ? faults[0].missing : [];
}

// Transformation mécanique v1→v2 du bloc brake_disc singulier/scalaire.
// Retourne le nouvel objet, ou null si la ligne ne correspond pas EXACTEMENT au motif.
function normalizeBrakeDisc(fs) {
  if (fs == null || typeof fs !== 'object' || Array.isArray(fs)) return null;
  const disc = fs.brake_disc;
  if (disc == null || typeof disc !== 'object' || Array.isArray(disc)) return null;
  const SINGULAR = { diameter: 'diameters', pcd: 'pcds', holes: 'holes' };
  const keys = Object.keys(disc);
  if (keys.length === 0 || !keys.every((k) => k in SINGULAR)) return null;
  const newDisc = {};
  for (const [k, v] of Object.entries(disc)) {
    if (typeof v !== 'string' || v.trim() === '') return null; // pas le motif attendu → on ne touche pas
    newDisc[SINGULAR[k]] = [v];
  }
  return { ...fs, brake_disc: newDisc };
}

const rows = await fetchAllFitment();
console.log(`[backfill] ${rows.length} pièce(s) avec fitment_specs non null.`);

const conform = [];
const toFix = [];
const untouched = [];
for (const r of rows) {
  const faults = shapeFaults(r.fitment_specs);
  if (faults.length === 0) { conform.push(r.slug); continue; }
  const fixed = normalizeBrakeDisc(r.fitment_specs);
  if (fixed && shapeFaults(fixed).length === 0) {
    toFix.push({ ...r, fixed });
  } else {
    untouched.push({ slug: r.slug, faults, fitment_specs: r.fitment_specs });
  }
}

console.log(`[backfill] Conformes v2 : ${conform.length} · À normaliser (brake_disc v1) : ${toFix.length} · Non conformes NON transformables : ${untouched.length}`);
for (const u of untouched) {
  console.log(`[backfill] ⚠  ${u.slug} — fautes : ${u.faults.join(', ')} — laissé intact :`);
  console.log(`             ${JSON.stringify(u.fitment_specs)}`);
}

if (toFix.length === 0) {
  console.log('[backfill] Rien à écrire.');
  process.exit(0);
}

for (const t of toFix) {
  console.log(`\n[backfill] ${t.slug}`);
  console.log(`  avant : ${JSON.stringify(t.fitment_specs)}`);
  console.log(`  après : ${JSON.stringify(t.fixed)}`);
}

if (!SERVICE) {
  console.log('\n[backfill] SUPABASE_SERVICE_ROLE_KEY absente du .env → AUCUNE écriture.');
  console.log('[backfill] SQL à coller dans le dashboard Supabase :\n');
  for (const t of toFix) {
    console.log(`update parts set fitment_specs = '${JSON.stringify(t.fixed)}'::jsonb where id = '${t.id}';`);
  }
  process.exit(0);
}

// ── Écriture service_role : PATCH ciblé par id, retour de la ligne écrite ─────
let ok = 0, err = 0;
for (const t of toFix) {
  const u = new URL(`${BASE}/rest/v1/parts`);
  u.searchParams.set('id', `eq.${t.id}`);
  u.searchParams.set('select', 'slug,fitment_specs');
  const res = await fetch(u, {
    method: 'PATCH',
    headers: {
      apikey: SERVICE,
      Authorization: `Bearer ${SERVICE}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ fitment_specs: t.fixed }),
  });
  const body = await res.text();
  if (!res.ok) {
    err++;
    console.log(`[backfill] ❌ ${t.slug} : ${res.status} ${body.slice(0, 150)}`);
    continue;
  }
  const rowsBack = JSON.parse(body);
  if (!Array.isArray(rowsBack) || rowsBack.length !== 1) {
    err++;
    console.log(`[backfill] ❌ ${t.slug} : ${rowsBack.length ?? 0} ligne écrite (attendu 1)`);
    continue;
  }
  ok++;
  console.log(`[backfill] ✅ ${t.slug} → ${JSON.stringify(rowsBack[0].fitment_specs)}`);
}
console.log(`\n[backfill] Terminé : ${ok} écrite(s), ${err} erreur(s).`);
process.exit(err > 0 ? 1 : 0);
