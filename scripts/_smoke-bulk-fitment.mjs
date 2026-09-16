// scripts/_smoke-bulk-fitment.mjs
// SMOKE-TEST de déploiement de l'Edge Function bulk-insert-scooters (garde clés de
// montage, commit 342d1f7). Lovable n'expose aucun état de déploiement : ce script est
// le seul instrument. Il a vocation à rester dans le repo.
//
// Principe : envoyer UN modèle existant avec 3 clés hors référentiel
// (tire_family, solid_conversion, rim_width — LOT 2 du 17/09). L'EF renvoie un
// warning par clé refusée, field = NOM DE COLONNE (fitmentCodeFields) :
//   - warnings avec "solid_conversion" ET "rim_width_code" → LOT 2 DÉPLOYÉ ;
//   - warnings avec "tire_family" seul → ANCIEN CODE (≥ 342d1f7, < lot 2) ;
//   - aucune clé warnings → CODE < 342d1f7.
// Dans tous les cas scooter_models n'est PAS écrit (partialRow vide → no-op).
//
// Écriture assumée et unique : l'upsert brands (name, slug) que l'EF fait avant toute
// chose. name et slug sont lus en base et renvoyés VERBATIM (mêmes variables, jamais
// retapés) → UPDATE à contenu identique sur la ligne existante, aucune marque fantôme.
//
// Usage :
//   node scripts/_smoke-bulk-fitment.mjs                 # lecture seule : étape 1 + état avant
//   node scripts/_smoke-bulk-fitment.mjs --fire          # + appel EF + contrôles post-appel
//   node scripts/_smoke-bulk-fitment.mjs --slug thunder  # modèle ciblé (défaut : thunder)

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const FIRE = args.includes('--fire');
const slugIdx = args.indexOf('--slug');
const SLUG = slugIdx !== -1 && args[slugIdx + 1] ? args[slugIdx + 1] : 'thunder';

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
const SECRET = env.ADMIN_BULK_SECRET;
if (!BASE || !ANON) { console.error('❌ VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY manquante'); process.exit(1); }
if (FIRE && !SECRET) { console.error('❌ ADMIN_BULK_SECRET manquante (requis pour --fire)'); process.exit(1); }

const READ_HEADERS = { apikey: ANON, Authorization: `Bearer ${ANON}` };
const FITMENT_COLS = [
  'tire_family', 'rim_diameter_code', 'tire_section_code', 'caliper_family',
  'disc_diameter_code', 'disc_pcd_code', 'disc_holes_code',
  'rim_width_code', 'solid_conversion', // LOT 1 (16/09) — doivent rester NULL après le smoke
];
const INVALID = 'ZZZ_TEST_INVALIDE';
// Clé payload → nom de colonne renvoyé dans results.warnings[].field par l'EF.
const PROBES = [
  ['tire_family', 'tire_family'],
  ['solid_conversion', 'solid_conversion'],
  ['rim_width', 'rim_width_code'],
];

// ─── Lectures (clé anon, PostgREST) ────────────────────────────────────────────

async function readScooter(slug) {
  const u = new URL(`${BASE}/rest/v1/scooter_models`);
  u.searchParams.set('select', `slug,name,published,${FITMENT_COLS.join(',')},brand:brands!scooter_models_brand_id_fkey(id,name,slug)`);
  u.searchParams.set('slug', `eq.${slug}`);
  const res = await fetch(u, { headers: READ_HEADERS });
  if (!res.ok) throw new Error(`REST scooter_models ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const rows = await res.json();
  return rows[0] ?? null;
}

async function readBrandById(id) {
  const u = new URL(`${BASE}/rest/v1/brands`);
  u.searchParams.set('select', 'id,name,slug');
  u.searchParams.set('id', `eq.${id}`);
  const res = await fetch(u, { headers: READ_HEADERS });
  if (!res.ok) throw new Error(`REST brands ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json())[0] ?? null;
}

async function countBrands() {
  const u = new URL(`${BASE}/rest/v1/brands`);
  u.searchParams.set('select', 'id');
  const res = await fetch(u, { headers: { ...READ_HEADERS, Prefer: 'count=exact', Range: '0-0' } });
  if (!res.ok) throw new Error(`REST brands count ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const m = res.headers.get('content-range')?.match(/\/(\d+)$/);
  if (!m) throw new Error(`content-range illisible : ${res.headers.get('content-range')}`);
  return parseInt(m[1], 10);
}

const pick = (row) => Object.fromEntries(FITMENT_COLS.map((c) => [c, row?.[c] ?? null]));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ─── Main ──────────────────────────────────────────────────────────────────────

(async () => {
  console.log(`[smoke] Cible : scooter_models.slug = "${SLUG}"`);

  // ── Étape 1 : lecture avant ─────────────────────────────────────────────────
  const before = await readScooter(SLUG);
  if (!before) { console.error(`❌ Aucun scooter_models avec slug "${SLUG}". Arrêt.`); process.exit(1); }
  if (!before.brand || typeof before.brand.name !== 'string' || before.brand.name.trim() === '' || !before.brand.slug) {
    console.error('❌ Marque liée illisible (embed brands vide ou name/slug absents). Arrêt, aucun appel.');
    console.error(JSON.stringify(before, null, 2));
    process.exit(1);
  }
  const brandName = before.brand.name;   // VERBATIM, réutilisé tel quel dans le POST
  const brandSlug = before.brand.slug;   // VERBATIM, cible exacte de l'upsert onConflict:slug
  const brandId = before.brand.id;
  const brandsBefore = await countBrands();

  console.log('\n[smoke] === ÉTAPE 1 — valeurs lues (avant) ===');
  console.log(`  slug             : ${before.slug}   (name="${before.name}", published=${before.published})`);
  console.log(`  brand.name       : ${JSON.stringify(brandName)}   (${brandName.length} caractères)`);
  console.log(`  brand.slug       : ${JSON.stringify(brandSlug)}   (id=${brandId})`);
  console.log(`  brands count     : ${brandsBefore}`);
  console.log(`  fitment (avant)  : ${JSON.stringify(pick(before))}`);

  if (!FIRE) {
    console.log('\n[smoke] Lecture seule terminée. Relancer avec --fire pour appeler l\'Edge Function.');
    return;
  }

  // ── Étape 2 : appel EF ──────────────────────────────────────────────────────
  // Même forme que scripts/sync-scooters.js : brandName à la RACINE du body (l'EF lit
  // body.brandName, pas scooter.brandName), forceUpdate pour le mode update.
  const probe = { slug: before.slug, ...Object.fromEntries(PROBES.map(([key]) => [key, INVALID])) };
  const payload = {
    brandName,
    brand_name: brandName,
    brandSlug,
    scooters: [probe],
    models: [probe],
    forceUpdate: true,
  };
  console.log('\n[smoke] === ÉTAPE 2 — POST bulk-insert-scooters ===');
  console.log(`  payload : ${JSON.stringify(payload)}`);

  const res = await fetch(`${BASE}/functions/v1/bulk-insert-scooters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-secret': SECRET, 'x-sync-secret': SECRET },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  console.log(`\n  HTTP ${res.status} ${res.statusText}`);
  for (const h of ['content-type', 'x-deno-execution-id', 'x-sb-edge-region', 'date']) {
    const v = res.headers.get(h);
    if (v) console.log(`  ${h}: ${v}`);
  }
  console.log('  --- body brut ---');
  console.log(text);
  console.log('  --- fin body ---');

  let json = null;
  try { json = JSON.parse(text); } catch { /* non-JSON : verdict impossible */ }
  const warnings = json?.results?.warnings;
  console.log('\n[smoke] === VERDICT DÉPLOIEMENT ===');
  if (Array.isArray(warnings)) {
    const hit = (field) => warnings.some((w) => w?.field === field && w?.code === INVALID);
    console.log(`  clé results.warnings PRÉSENTE (${warnings.length} entrée(s))`);
    for (const [, field] of PROBES) console.log(`  warning ${field}/${INVALID} : ${hit(field) ? 'OUI' : 'NON'}`);
    if (hit('solid_conversion') && hit('rim_width_code')) {
      console.log('  → LOT 2 DÉPLOYÉ (solid_conversion + rim_width_code refusés par le référentiel)');
    } else if (hit('tire_family')) {
      console.log('  → ANCIEN CODE (≥ 342d1f7, < lot 2) : les 2 nouvelles clés sont ignorées en silence');
    } else {
      console.log('  → warnings présent mais sans les entrées attendues, à examiner');
    }
  } else if (json && res.ok) {
    console.log('  AUCUNE clé results.warnings → CODE < 342d1f7 (aucune garde de clés en prod)');
  } else {
    console.log('  Réponse non exploitable (HTTP non-2xx ou non-JSON) → verdict impossible');
  }

  // ── Étape 3 : contrôles post-appel ──────────────────────────────────────────
  const after = await readScooter(SLUG);
  const brandAfter = await readBrandById(brandId);
  const brandsAfter = await countBrands();

  console.log('\n[smoke] === ÉTAPE 3 — contrôles post-appel ===');
  const c1 = brandsAfter === brandsBefore;
  console.log(`  1. brands count       : avant=${brandsBefore} après=${brandsAfter} → ${c1 ? 'OK identique' : '✗ DIFFÉRENT'}`);
  const c2 = brandAfter && brandAfter.name === brandName && brandAfter.slug === brandSlug;
  console.log(`  2. brand ${brandId} : name=${JSON.stringify(brandAfter?.name)} slug=${JSON.stringify(brandAfter?.slug)} → ${c2 ? 'OK inchangé' : '✗ MODIFIÉ'}`);
  const c3 = same(pick(before), pick(after));
  console.log(`  3. fitment ${SLUG}  : ${JSON.stringify(pick(after))} → ${c3 ? `OK inchangé (${FITMENT_COLS.length} colonnes)` : '✗ MODIFIÉ'}`);
  if (!c3) console.log(`     avant : ${JSON.stringify(pick(before))}`);
  const c4 = after?.rim_width_code == null && after?.solid_conversion == null;
  console.log(`  4. rim_width_code / solid_conversion : ${JSON.stringify(after?.rim_width_code ?? null)} / ${JSON.stringify(after?.solid_conversion ?? null)} → ${c4 ? 'OK NULL' : '✗ ÉCRITES (la garde hors-vocab a laissé passer)'}`);

  if (!(c1 && c2 && c3 && c4)) process.exit(2);
})().catch((e) => { console.error('[smoke] ❌ Fatal :', e.message); process.exit(1); });
