// scripts/_smoke-moteur-k.mjs
// Smoke-test du moteur K sur les EF DÉPLOYÉES (bulk-insert-parts + retrigger).
// SANS clé service (doctrine Lovable Cloud) :
//   - écritures via les EF (x-admin-secret = ADMIN_BULK_SECRET, canal admin) ;
//   - lectures en clé ANON (part_compatibility/scooter_models/categories sont en
//     lecture publique RLS ; les ids fixtures viennent de la réponse EF) ;
//   - CLEANUP : PAS de REST — SQL fourni en fin de run pour le SQL editor Lovable.
// skip_ai=true partout (zéro appel Claude). Fixtures SKU TEST-K-* uniquement.
// Preuve de déploiement : compatibilities_suggested_fitment dans la réponse,
// sinon ARRÊT IMMÉDIAT.
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = {};
for (const line of readFileSync(resolve(__dirname, '../.env'), 'utf-8').split('\n')) {
  const m = line.match(/^([^#=][^=]*)=["']?([^"'\r\n]*)["']?/);
  if (m) env[m[1].trim()] = m[2].trim();
}
const URL_ = env.VITE_SUPABASE_URL;
const ANON = env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SECRET = env.ADMIN_BULK_SECRET;
const missing = [
  ['VITE_SUPABASE_URL', URL_],
  ['VITE_SUPABASE_PUBLISHABLE_KEY', ANON],
  ['ADMIN_BULK_SECRET', SECRET],
].filter(([, v]) => !v).map(([n]) => n);
if (missing.length) {
  console.error(`Variables manquantes dans .env (noms seulement) : ${missing.join(', ')}`);
  process.exit(1);
}

const anonHeaders = { apikey: ANON, Authorization: `Bearer ${ANON}` };
async function rest(path) {
  const res = await fetch(`${URL_}/rest/v1/${path}`, { headers: anonHeaders });
  if (!res.ok) throw new Error(`REST anon ${path} → HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}
async function ef(name, body) {
  const res = await fetch(`${URL_}/functions/v1/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-secret': SECRET },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`EF ${name} → HTTP ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

const FIXTURE_SKUS = ['TEST-K-TIRE', 'TEST-K-TIRE2', 'TEST-K-DISC', 'TEST-K-CHG', 'TEST-K-NOFIT', 'TEST-K-LEGACY'];
const KEY_WIRED = ['chargeurs', 'chambres-a-air', 'pneus', 'pneus-gonflables', 'pneus-pleins', 'disques'];

let failures = 0;
const ok = (label, cond, detail = '') => {
  console.log(`${cond ? '✅' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!cond) failures++;
};

try {
  // ── Phase 0 : seeds réels en anon (fixture construit sur de VRAIS codes) ────
  const cats = await rest('categories?select=name,slug');
  const bySlug = Object.fromEntries(cats.map((c) => [c.slug, c.name]));
  const legacySlug = 'plaquettes' in bySlug
    ? 'plaquettes'
    : Object.keys(bySlug).find((s) => !KEY_WIRED.includes(s));

  const [tireSeed] = await rest(
    'scooter_models?select=id,name,tire_family,rim_diameter_code,tire_section_code' +
    '&published=eq.true&tire_family=not.is.null&rim_diameter_code=not.is.null&tire_section_code=not.is.null&limit=1',
  );
  const [discSeed] = await rest(
    'scooter_models?select=id,name,disc_diameter_code,disc_pcd_code,disc_holes_code' +
    '&published=eq.true&disc_diameter_code=not.is.null&disc_pcd_code=not.is.null&disc_holes_code=not.is.null&limit=1',
  );
  const published = await rest('scooter_models?select=id&published=eq.true');
  const pubIds = new Set(published.map((r) => r.id));
  let voltSeed = null;
  try {
    const cfgs = await rest('scooter_battery_configs?select=scooter_model_id,voltage&limit=100');
    voltSeed = cfgs.find((c) => pubIds.has(c.scooter_model_id)) ?? null;
  } catch (e) {
    console.warn('[seeds] scooter_battery_configs illisible en anon — test CHG sauté :', e.message.slice(0, 120));
  }
  console.log(`[seeds] tire=${tireSeed ? `${tireSeed.name} (${tireSeed.tire_family} rim=${tireSeed.rim_diameter_code} sect=${tireSeed.tire_section_code})` : 'AUCUN'}`);
  console.log(`[seeds] disc=${discSeed ? `${discSeed.name} (d=${discSeed.disc_diameter_code} pcd=${discSeed.disc_pcd_code} holes=${discSeed.disc_holes_code})` : 'AUCUN'}`);
  console.log(`[seeds] voltage=${voltSeed ? voltSeed.voltage : 'AUCUN'} | legacy cat=${legacySlug}`);

  const tireCatSlug = tireSeed?.tire_family === 'solid'
    ? 'pneus-pleins'
    : ['chambres-a-air', 'pneus-gonflables', 'pneus'].find((s) => s in bySlug);

  // ── Phase 1 : fixtures via bulk-insert-parts (skip_ai partout) ──────────────
  const batches = [];
  if (tireSeed && tireCatSlug) {
    batches.push({
      categoryName: bySlug[tireCatSlug],
      skip_ai: true,
      parts: [
        { name: 'ZZZ TEST moteur K pneu', slug: 'zzz-test-moteur-k-pneu', sku: 'TEST-K-TIRE',
          fitment_specs: { tire_family: tireSeed.tire_family, rim_diameters: [tireSeed.rim_diameter_code], tire_sections: [tireSeed.tire_section_code] } },
        { name: 'ZZZ TEST moteur K pneu partiel', slug: 'zzz-test-moteur-k-pneu-partiel', sku: 'TEST-K-TIRE2',
          fitment_specs: { tire_family: tireSeed.tire_family, rim_diameters: [tireSeed.rim_diameter_code] } },
      ],
    });
  }
  if (discSeed && 'disques' in bySlug) {
    batches.push({
      categoryName: bySlug['disques'],
      skip_ai: true,
      parts: [
        { name: 'ZZZ TEST moteur K disque', slug: 'zzz-test-moteur-k-disque', sku: 'TEST-K-DISC',
          fitment_specs: { brake_disc: { diameters: [discSeed.disc_diameter_code], pcds: [discSeed.disc_pcd_code], holes: [discSeed.disc_holes_code] } } },
        { name: 'ZZZ TEST moteur K sans fitment', slug: 'zzz-test-moteur-k-sans-fitment', sku: 'TEST-K-NOFIT' },
      ],
    });
  }
  if (voltSeed && 'chargeurs' in bySlug) {
    batches.push({
      categoryName: bySlug['chargeurs'],
      skip_ai: true,
      parts: [
        { name: 'ZZZ TEST moteur K chargeur', slug: 'zzz-test-moteur-k-chargeur', sku: 'TEST-K-CHG',
          electrical_specs: { voltages: [voltSeed.voltage] } },
      ],
    });
  }
  if (legacySlug) {
    batches.push({
      categoryName: bySlug[legacySlug],
      skip_ai: true,
      parts: [
        // Nom regex-matchable (10x2) : prouve que la Passe A legacy tourne encore hors allowlist.
        { name: 'ZZZ TEST legacy 10x2.50', slug: 'zzz-test-legacy-10x2-50', sku: 'TEST-K-LEGACY' },
      ],
    });
  }

  const statusBySku = {};
  const idBySku = {};
  for (const batch of batches) {
    const resp = await ef('bulk-insert-parts', batch);
    // ── PREUVE DE DÉPLOIEMENT ──
    if (!('compatibilities_suggested_fitment' in (resp.results ?? {}))) {
      console.error('\n🛑 ARRÊT : compatibilities_suggested_fitment ABSENT de la réponse — le deploy Lovable n\'a pas pris. Aucun autre test.');
      failures++;
      throw new Error('deploy_not_taken');
    }
    console.log(`[EF] ${batch.categoryName}: fitment=${resp.results.compatibilities_suggested_fitment} regexA=${resp.results.compatibilities_suggested} ai=${resp.results.compatibilities_suggested_ai}`);
    for (const r of resp.results.rows) {
      statusBySku[r.sku] = r;
      if (r.id) idBySku[r.sku] = r.id;
      // Un run précédent aurait laissé des fixtures : "updated" = pas de re-matching
      // (compat only à la création) → résultats invalides tant que le SQL cleanup
      // n'a pas tourné.
      if (r.status === 'updated') {
        ok(`fixture ${r.sku} : créée (pas un résidu de run précédent)`, false, 'status=updated — lance le SQL de cleanup puis relance le smoke');
      }
    }
  }
  ok('preuve deploy : compatibilities_suggested_fitment présent', true);

  // ── Phase 2 : vérif des lignes écrites (anon — lecture publique RLS) ────────
  const fixtureIds = Object.values(idBySku);
  const compat = fixtureIds.length
    ? await rest(`part_compatibility?part_id=in.(${fixtureIds.join(',')})&select=part_id,scooter_model_id,auto_suggested,confidence_level,suggestion_reason`)
    : [];
  const rowsOf = (sku) => compat.filter((c) => c.part_id === idBySku[sku]);

  if (tireSeed) {
    const t1 = rowsOf('TEST-K-TIRE');
    ok('TIRE : ≥1 ligne high fitment:', t1.some((r) => r.confidence_level === 'high' && r.suggestion_reason?.startsWith('fitment:')), `${t1.length} ligne(s), ex: ${t1[0]?.suggestion_reason}`);
    ok('TIRE : toutes auto_suggested=true, aucune validated', t1.length > 0 && t1.every((r) => r.auto_suggested === true && r.confidence_level !== 'validated'));
    const t2 = rowsOf('TEST-K-TIRE2');
    ok('TIRE2 (sans sections) : que du medium fitment:partial', t2.length > 0 && t2.every((r) => r.confidence_level === 'medium' && r.suggestion_reason?.startsWith('fitment:partial')), `${t2.length} ligne(s), ex: ${t2[0]?.suggestion_reason}`);
  }
  if (discSeed) {
    const d = rowsOf('TEST-K-DISC');
    ok('DISC : ≥1 ligne high fitment:disc', d.some((r) => r.confidence_level === 'high' && r.suggestion_reason?.startsWith('fitment:disc')), `${d.length} ligne(s), ex: ${d[0]?.suggestion_reason}`);
    ok('NOFIT (strict sans specs) : ZÉRO suggestion', rowsOf('TEST-K-NOFIT').length === 0, `status EF=${statusBySku['TEST-K-NOFIT']?.status}`);
  }
  if (voltSeed) {
    const c = rowsOf('TEST-K-CHG');
    ok('CHG : ≥1 ligne high fitment:voltage', c.some((r) => r.confidence_level === 'high' && r.suggestion_reason?.startsWith('fitment:voltage')), `${c.length} ligne(s), ex: ${c[0]?.suggestion_reason}`);
  }
  if (legacySlug) {
    const l = rowsOf('TEST-K-LEGACY');
    ok('LEGACY (hors allowlist) : Passe A regex a tourné (lignes SANS préfixe fitment:)', l.length > 0 && l.every((r) => !r.suggestion_reason?.startsWith('fitment:')), `${l.length} ligne(s)`);
  }

  // ── Phase 3 : retrigger ciblé sur des SKU réels keyés (published, anon) ─────
  const keyedParts = (await rest(
    'parts?fitment_specs=not.is.null&select=id,sku,category:categories(slug)&limit=50',
  )).filter((p) => KEY_WIRED.includes(p.category?.slug) && p.sku && !FIXTURE_SKUS.includes(p.sku)).slice(0, 3);
  if (keyedParts.length === 0) {
    ok('RETRIGGER : aucun SKU réel keyé lisible en anon — test sauté', true);
  } else {
    const ids = keyedParts.map((p) => p.id);
    const skus = keyedParts.map((p) => p.sku);
    const before = await rest(`part_compatibility?part_id=in.(${ids.join(',')})&select=part_id,scooter_model_id,auto_suggested,confidence_level,suggestion_reason`);
    const validatedBefore = before.filter((r) => r.confidence_level === 'validated');
    const rt = await ef('retrigger-compatibility-matching', { skus });
    const after = await rest(`part_compatibility?part_id=in.(${ids.join(',')})&select=part_id,scooter_model_id,auto_suggested,confidence_level,suggestion_reason`);
    const validatedAfter = after.filter((r) => r.confidence_level === 'validated');
    const kAfter = after.filter((r) => r.suggestion_reason?.startsWith('fitment:'));
    console.log(`[retrigger] skus=${skus.join(',')} | avant: ${before.length} lignes (${validatedBefore.length} validated) | après: ${after.length} lignes (${validatedAfter.length} validated, ${kAfter.length} fitment:)`);
    console.log(`[retrigger] réponse: ${JSON.stringify(rt.results?.map((r) => ({ p: r.part_name, K: r.passe_K_added, A: r.passe_A_added, B: r.passe_B_added, rm: r.auto_removed, status: r.ai_status })))}`);
    ok('RETRIGGER : passe_K_added présent dans la réponse (preuve deploy retrigger)', rt.results?.every((r) => 'passe_K_added' in r));
    const sortK = (a, b) => (a.part_id + a.scooter_model_id).localeCompare(b.part_id + b.scooter_model_id);
    ok('RETRIGGER : validated intactes', JSON.stringify([...validatedBefore].sort(sortK)) === JSON.stringify([...validatedAfter].sort(sortK)), `${validatedBefore.length} avant / ${validatedAfter.length} après`);
    ok('RETRIGGER : lignes K recréées (fitment:) pour les pièces keyées', rt.results?.some((r) => r.passe_K_added > 0) ? kAfter.length > 0 : true, `${kAfter.length} ligne(s) fitment:`);
    ok('RETRIGGER : aucune ligne auto legacy résiduelle (auto=true sans fitment:) sur ces pièces', after.every((r) => !r.auto_suggested || r.suggestion_reason?.startsWith('fitment:')));
  }
} catch (e) {
  if (e.message !== 'deploy_not_taken') { console.error('EXCEPTION :', e); failures++; }
}

// ── CLEANUP : à exécuter dans le SQL editor Lovable (pas de clé service ici) ──
console.log('\n=== CLEANUP SQL (SQL editor Lovable) ===');
console.log(`DELETE FROM public.parts WHERE sku LIKE 'TEST-K-%';`);
console.log(`SELECT (SELECT count(*) FROM public.parts WHERE sku LIKE 'TEST-K-%') AS parts_restantes, (SELECT count(*) FROM public.part_compatibility pc WHERE NOT EXISTS (SELECT 1 FROM public.parts p WHERE p.id = pc.part_id)) AS compat_orphelines;`);

console.log(failures === 0 ? '\n🎉 Smoke moteur K : tout est vert (reste le cleanup SQL).' : `\n${failures} échec(s).`);
process.exit(failures === 0 ? 0 : 1);
