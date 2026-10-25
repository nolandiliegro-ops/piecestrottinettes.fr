#!/usr/bin/env node
// scripts/_smoke-process-images-doublon.mjs — smoke-test du garde-fou anti-doublon de l'Edge Function process-images (25/10/2026).
// Prouve que la VERSION DÉPLOYÉE contient le garde-fou (signature garde_fou = 'empreinte-core-2510') et qu'il marche :
//   1. check_only : une photo DÉJÀ sur engwe-y1000 → doublon: true            (lecture pure)
//   2. check_only : une photo d'une AUTRE trottinette → doublon: false        (lecture pure)
//   3. append réel de la photo déjà présente → processed_count 0, refused_duplicates 1, galerie inchangée
//      (si le garde-fou était absent, l'étape 3 écrirait un doublon : le script le signale et donne l'URL à retirer)
// Usage (GitHub Actions, .env du runner) : node scripts/_smoke-process-images-doublon.mjs [--fire]   (sans --fire : étapes 1-2 seules)
import { readFileSync } from 'fs';
import { execFileSync } from 'child_process';
const env = Object.fromEntries(readFileSync('.env', 'utf-8').split('\n').map((l) => l.match(/^([A-Z_]+)=["']?([^"'\r\n]*)/)).filter(Boolean).map((m) => [m[1], m[2]]));
const FN = `${env.VITE_SUPABASE_URL}/functions/v1/process-images`;
const H = { apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_PUBLISHABLE_KEY}` };
const FIRE = process.argv.includes('--fire');
const ENGWE = 'aaf64e45-cba2-482a-856f-d13a7f64e944';
let ok = true; const fail = (m) => { ok = false; console.log(`::error title=smoke garde-fou::${m}`); };
const galerie = async (id) => (await (await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/scooter_models?select=images&id=eq.${id}`, { headers: H })).json())[0].images.map((i) => i.url);
const b64 = (u) => execFileSync('curl', ['-s', '-f', '-L', '--max-time', '40', u], { maxBuffer: 64 << 20 }).toString('base64');
const call = async (body) => { const r = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-secret': env.ADMIN_BULK_SECRET }, body: JSON.stringify(body) }); return { status: r.status, j: await r.json().catch(() => null) }; };

const avant = await galerie(ENGWE);
if (avant.length < 2) fail(`engwe-y1000 a ${avant.length} photo(s), test impossible`);
const autre = (await (await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/scooter_models?select=images&slug=eq.f40`, { headers: H })).json())[0].images[0].url;

const c1 = await call({ entity_type: 'scooter', entity_id: ENGWE, check_only: true, images_base64: [b64(avant[1]), b64(autre)] });
console.log('check_only →', c1.status, JSON.stringify(c1.j));
if (c1.j?.garde_fou !== 'empreinte-core-2510') fail('signature absente : la version déployée n\'a PAS le garde-fou');
else {
  if (c1.j.results?.[0]?.doublon !== true) fail('photo déjà présente NON détectée');
  if (c1.j.results?.[1]?.doublon !== false) fail('photo d\'une autre trottinette prise pour un doublon');
}

if (FIRE && ok) {
  const c3 = await call({ entity_type: 'scooter', entity_id: ENGWE, images_base64: [b64(avant[1])], alt_base: 'Engwe Y1000' });
  console.log('append →', c3.status, JSON.stringify({ processed: c3.j?.processed_count, refused: c3.j?.refused_duplicates, failed: c3.j?.failed_urls }));
  const apres = await galerie(ENGWE);
  if (c3.j?.processed_count !== 0 || c3.j?.refused_duplicates !== 1) fail('append réel : le doublon n\'a pas été refusé');
  if (JSON.stringify(apres) !== JSON.stringify(avant)) fail(`galerie MODIFIÉE (${avant.length} → ${apres.length}) — à retirer : ${apres.filter((u) => !avant.includes(u)).join(' ')}`);
}
console.log(ok ? `::notice title=smoke garde-fou::OK${FIRE ? ' (3 étapes)' : ' (lecture seule)'}` : '::notice title=smoke garde-fou::ÉCHEC');
process.exitCode = ok ? 0 : 1;
