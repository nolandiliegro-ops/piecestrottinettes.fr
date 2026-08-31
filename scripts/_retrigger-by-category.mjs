// scripts/_retrigger-by-category.mjs
// Retrigger du moteur K sur TOUTES les pièces publiées des 6 catégories allowlist.
// Même mécanique que _smoke-moteur-k.mjs : lectures en clé ANON (RLS publique),
// écritures UNIQUEMENT via l'EF (x-admin-secret = ADMIN_BULK_SECRET).
// L'EF ne touche jamais les lignes validated (prouvé par le smoke le 30/08).
// Usage : node scripts/_retrigger-by-category.mjs
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const KEY_WIRED = ['chargeurs', 'chambres-a-air', 'pneus', 'pneus-gonflables', 'pneus-pleins', 'disques'];

const cats = (await rest(`categories?select=id,slug&slug=in.(${KEY_WIRED.join(',')})`));
if (cats.length === 0) throw new Error('Aucune catégorie allowlist trouvée');
const slugById = Object.fromEntries(cats.map((c) => [c.id, c.slug]));
console.log(`[cats] ${cats.map((c) => c.slug).join(', ')}`);

// Pagination explicite : PostgREST tronque silencieusement au-delà du max-rows.
const PAGE = 500;
const parts = [];
for (let from = 0; ; from += PAGE) {
  const page = await rest(
    `parts?select=id,sku,name,category_id&published=eq.true` +
    `&category_id=in.(${cats.map((c) => c.id).join(',')})&order=id&offset=${from}&limit=${PAGE}`,
  );
  parts.push(...page);
  if (page.length < PAGE) break;
}
console.log(`[parts] ${parts.length} pièce(s) publiée(s) à retrigger\n`);

const stats = {};
for (const s of KEY_WIRED) stats[s] = { pieces: 0, K: 0, removed: 0, validated: 0, noFitment: 0, errors: 0 };

let i = 0;
for (const p of parts) {
  i++;
  const slug = slugById[p.category_id];
  const tag = `[${String(i).padStart(3)}/${parts.length}] ${p.sku ?? '(sans sku)'} (${slug})`;
  try {
    const resp = await ef('retrigger-compatibility-matching', { part_ids: [p.id] });
    const r = resp.results?.[0];
    if (!r) {
      console.log(`${tag} → AUCUN résultat EF (warnings: ${JSON.stringify(resp.warnings)})`);
      stats[slug].errors++;
    } else {
      console.log(
        `${tag} → passe_K=${r.passe_K_added} auto_removed=${r.auto_removed} ` +
        `validated_kept=${r.validated_kept} status=${r.ai_status}`,
      );
      const st = stats[slug];
      st.pieces++;
      st.K += r.passe_K_added;
      st.removed += r.auto_removed;
      st.validated += r.validated_kept;
      if (r.ai_status === 'skipped_no_fitment') st.noFitment++;
      if (r.ai_status === 'error' || r.ai_status === 'key_wired_error') st.errors++;
    }
  } catch (e) {
    console.log(`${tag} → ERREUR : ${e.message.slice(0, 200)}`);
    stats[slug].errors++;
  }
  await sleep(400);
}

console.log('\n=== RÉCAP PAR CATÉGORIE ===');
let totK = 0, totRm = 0, totErr = 0;
for (const s of KEY_WIRED) {
  const st = stats[s];
  if (st.pieces === 0 && st.errors === 0) continue;
  console.log(
    `${s.padEnd(18)} pièces=${st.pieces} | suggestions K recréées=${st.K} | ` +
    `auto supprimées=${st.removed} | validated conservées=${st.validated} | ` +
    `sans clés=${st.noFitment} | erreurs=${st.errors}`,
  );
  totK += st.K; totRm += st.removed; totErr += st.errors;
}
console.log(`TOTAL : ${parts.length} pièces, ${totK} suggestions K, ${totRm} auto supprimées, ${totErr} erreur(s).`);
process.exit(totErr === 0 ? 0 : 1);
