// scripts/_retrigger-by-category.mjs
// Retrigger du moteur K sur TOUTES les pièces publiées des catégories allowlist
// (STRICT_CATEGORIES, source unique : scripts/lib/validate-part-keys.js).
// Même mécanique que _smoke-moteur-k.mjs : lectures en clé ANON (RLS publique),
// écritures UNIQUEMENT via l'EF (x-admin-secret = ADMIN_BULK_SECRET).
// L'EF ne touche jamais les lignes validated (prouvé par le smoke le 30/08).
// Usage CLI : node scripts/_retrigger-by-category.mjs [slug …]
// Usage module : import { retriggerKeyWired } — AUCUN effet de bord à l'import
// (ni lecture .env, ni réseau, ni process.exit) : tout est dans les fonctions.
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STRICT_CATEGORIES } from './lib/validate-part-keys.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const KEY_WIRED = [...STRICT_CATEGORIES];

function loadConfig() {
  const env = {};
  for (const line of readFileSync(resolve(__dirname, '../.env'), 'utf-8').split('\n')) {
    const m = line.match(/^([^#=][^=]*)=["']?([^"'\r\n]*)["']?/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  const cfg = {
    url: env.VITE_SUPABASE_URL,
    anon: env.VITE_SUPABASE_PUBLISHABLE_KEY,
    secret: env.ADMIN_BULK_SECRET,
  };
  const missing = [
    ['VITE_SUPABASE_URL', cfg.url],
    ['VITE_SUPABASE_PUBLISHABLE_KEY', cfg.anon],
    ['ADMIN_BULK_SECRET', cfg.secret],
  ].filter(([, v]) => !v).map(([n]) => n);
  if (missing.length) {
    throw new Error(`Variables manquantes dans .env (noms seulement) : ${missing.join(', ')}`);
  }
  return cfg;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Relance le moteur K sur les pièces publiées des catégories demandées.
 * @param {{ categories?: string[], log?: (msg: string) => void }} [opts]
 *   categories : sous-ensemble de KEY_WIRED (défaut : toutes). Un slug hors
 *   allowlist lève AVANT tout appel réseau. log : défaut console.log.
 * @returns {Promise<{ parts: number, suggestions: number, removed: number, errors: number }>}
 */
export async function retriggerKeyWired({ categories, log = console.log } = {}) {
  const targets = Array.isArray(categories) ? categories : [];
  const unknown = targets.filter((s) => !KEY_WIRED.includes(s));
  if (unknown.length > 0) {
    throw new Error(
      `Catégorie(s) hors allowlist : ${unknown.join(', ')}\nValeurs acceptées : ${KEY_WIRED.join(', ')}`,
    );
  }
  const { url, anon, secret } = loadConfig();

  const anonHeaders = { apikey: anon, Authorization: `Bearer ${anon}` };
  async function rest(path) {
    const res = await fetch(`${url}/rest/v1/${path}`, { headers: anonHeaders });
    if (!res.ok) throw new Error(`REST anon ${path} → HTTP ${res.status}: ${await res.text()}`);
    return res.json();
  }
  async function ef(name, body) {
    const res = await fetch(`${url}/functions/v1/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(`EF ${name} → HTTP ${res.status}: ${JSON.stringify(json)}`);
    return json;
  }

  const SELECTED = targets.length > 0 ? targets : KEY_WIRED;
  log(
    `[scope] ${SELECTED.length}/${KEY_WIRED.length} catégorie(s) : ${SELECTED.join(', ')}` +
    `${targets.length > 0 ? ' (ciblage par argument)' : ' (défaut : allowlist complète)'}`,
  );

  const cats = await rest(`categories?select=id,slug&slug=in.(${SELECTED.join(',')})`);
  if (cats.length === 0) throw new Error('Aucune catégorie allowlist trouvée');
  const slugById = Object.fromEntries(cats.map((c) => [c.id, c.slug]));
  log(`[cats] ${cats.map((c) => c.slug).join(', ')}`);

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
  log(`[parts] ${parts.length} pièce(s) publiée(s) à retrigger\n`);

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
        log(`${tag} → AUCUN résultat EF (warnings: ${JSON.stringify(resp.warnings)})`);
        stats[slug].errors++;
      } else {
        log(
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
      log(`${tag} → ERREUR : ${e.message.slice(0, 200)}`);
      stats[slug].errors++;
    }
    await sleep(400);
  }

  log('\n=== RÉCAP PAR CATÉGORIE ===');
  let totK = 0, totRm = 0, totErr = 0;
  for (const s of KEY_WIRED) {
    const st = stats[s];
    if (st.pieces === 0 && st.errors === 0) continue;
    log(
      `${s.padEnd(18)} pièces=${st.pieces} | suggestions K recréées=${st.K} | ` +
      `auto supprimées=${st.removed} | validated conservées=${st.validated} | ` +
      `sans clés=${st.noFitment} | erreurs=${st.errors}`,
    );
    totK += st.K; totRm += st.removed; totErr += st.errors;
  }
  log(`TOTAL : ${parts.length} pièces, ${totK} suggestions K, ${totRm} auto supprimées, ${totErr} erreur(s).`);
  return { parts: parts.length, suggestions: totK, removed: totRm, errors: totErr };
}

// ─── CLI : seulement si lancé directement (jamais à l'import) ──────────────────
// Windows : la casse du lecteur (c:\ vs C:\) peut différer entre argv et import.meta.url.
const samePath = (a, b) => (process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b);
const isMain = Boolean(process.argv[1]) && samePath(resolve(process.argv[1]), __filename);
if (isMain) {
  const TARGETS = process.argv.slice(2);
  // Slug hors allowlist refusé AVANT tout appel réseau (aucune écriture, aucune lecture).
  const unknown = TARGETS.filter((s) => !KEY_WIRED.includes(s));
  if (unknown.length > 0) {
    console.error(`Catégorie(s) hors allowlist : ${unknown.join(', ')}`);
    console.error(`Valeurs acceptées : ${KEY_WIRED.join(', ')}`);
    process.exit(1);
  }
  try {
    const { errors } = await retriggerKeyWired({ categories: TARGETS });
    process.exit(errors === 0 ? 0 : 1);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
