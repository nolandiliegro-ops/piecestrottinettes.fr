#!/usr/bin/env node
/**
 * scripts/agents/fill-photos.js — PASSE PHOTOS (lot du 10/10/2026)
 *
 * Mesuré le 10/10 : 12 modèles extraits ne sont bloqués QUE par l'absence de photo ; les trouver fait passer
 * 4 marques à 2 modèles (Yeep.me, Beaster, Aprilia, Jeep). L'IA ne cherche que des FICHES PRODUIT de revendeurs ;
 * le script lit lui-même l'og:image de chaque page (méthode validée de l'extracteur).
 *
 * Usage : node scripts/agents/fill-photos.js --data-dir <dossier> [--brands "a,b"] [--model <id>]
 *         [--max-searches 4] [--max-brands N] --plafond-tokens N (obligatoire)
 *   - ne traite que les modèles dont le SEUL manque est source_image_urls ;
 *   - jamais deux fois avec le même modèle IA ; journalise dans _journal.md.
 */

import { readFileSync, writeFileSync, readdirSync, appendFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { assembleScooter, sourcesReport } from './lib/extract-core.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(`--${n}`); return i !== -1 && args[i + 1] ? args[i + 1] : d; };
const DATA = resolve(process.cwd(), opt('data-dir', 'extraction'));
const MODEL = opt('model', 'claude-sonnet-5-5');
const MAX_SEARCHES = Number(opt('max-searches', '8'));
const MAX_BRANDS = Number(opt('max-brands', '999'));
const CAP = Number(opt('plafond-tokens', '0')); // GARDE-FOU : sans plafond, rien ne part
const ONLY = opt('brands') ? opt('brands').split(',').map((s) => s.trim()) : null;
const BRAKE_KEYS = ['brake_type', 'disc_diameter', 'disc_pcd', 'disc_holes'];

const env = { ...process.env };
function publicSupabase() {
  try {
    const src = readFileSync(resolve(ROOT, 'src/integrations/supabase/client.ts'), 'utf-8');
    return { url: src.match(/VITE_SUPABASE_URL\s*\|\|\s*"([^"]+)"/)?.[1], key: src.match(/VITE_SUPABASE_PUBLISHABLE_KEY\s*\|\|\s*"([^"]+)"/)?.[1] };
  } catch { return {}; }
}
const pub = publicSupabase();
const SB_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL || pub.url;
const SB_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY || pub.key;
if (!env.ANTHROPIC_API_KEY || !SB_URL || !SB_KEY) { console.error('❌ ANTHROPIC_API_KEY / Supabase public absents — arrêt avant tout appel'); process.exit(1); }

async function rest(path) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
  if (!res.ok) throw new Error(`REST ${path} → ${res.status}`);
  return res.json();
}
async function loadVocab() {
  const codes = async (t) => (await rest(`${t}?select=code`)).map((r) => String(r.code));
  const v = {
    brake_rows: await rest('fitment_brake_types?select=code,has_disc'),
    caliper: await codes('fitment_caliper_families'), rim_type: await codes('fitment_rim_types'),
    rim_d: await codes('fitment_rim_diameters'), section: await codes('fitment_tire_sections'),
    disc_d: await codes('fitment_disc_diameters'), pcd: await codes('fitment_disc_pcd'), holes: await codes('fitment_disc_holes'),
  };
  v.brake = v.brake_rows.map((r) => r.code);
  for (const k of ['brake', 'disc_d', 'pcd', 'holes', 'section', 'rim_d']) if (!v[k].length) throw new Error(`Référentiel ${k} lu VIDE — arrêt.`);
  return v;
}

const usage = { input_tokens: 0, output_tokens: 0, web_searches: 0 };
async function claude({ system, prompt, tool }) {
  const messages = [{ role: 'user', content: prompt }];
  for (let turn = 0, retry = 0; turn < 4; turn++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 6000, system, messages, tools: [tool, { type: 'web_search_20250305', name: 'web_search', max_uses: MAX_SEARCHES }] }),
    });
    if ([429, 500, 529].includes(res.status) && retry < 3) {
      const wait = Math.min(120, Number(res.headers.get('retry-after')) || 30 * (retry + 1));
      await new Promise((r) => setTimeout(r, wait * 1000)); retry++; turn--; continue;
    }
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 400)}`);
    const data = await res.json();
    usage.input_tokens += data.usage?.input_tokens || 0;
    usage.output_tokens += data.usage?.output_tokens || 0;
    usage.web_searches += data.usage?.server_tool_use?.web_search_requests || 0;
    const call = (data.content || []).find((c) => c.type === 'tool_use' && c.name === tool.name);
    if (call) return call.input;
    messages.push({ role: 'assistant', content: data.content });
    if (data.stop_reason !== 'pause_turn') messages.push({ role: 'user', content: `Conclus maintenant en appelant ${tool.name} (null + source vide pour l'introuvable).` });
  }
  throw new Error(`Aucun appel à ${tool.name} après 4 tours`);
}

const F = (type, extra = {}) => ({
  type: 'object',
  properties: {
    value: { type: [type, 'null'], ...extra },
    source_url: { type: ['string', 'null'] },
    source_url_2: { type: ['string', 'null'], description: 'DEUXIÈME page, sur un AUTRE site, même valeur' },
    source_type: { type: 'string', enum: ['constructeur', 'distributeur', 'revendeur', 'site_test', 'forum', 'inconnu'] },
  },
  required: ['value', 'source_url', 'source_type'],
});

// ─── PASSE PHOTOS ─────────────────────────────────────────────────────────────
const SYSTEM = `Tu trouves des FICHES PRODUIT de revendeurs pour une trottinette électrique (marché français / européen).
- Une fiche = une page qui vend CE SEUL modèle (pas une catégorie, pas un comparatif, pas un article de blog, pas une vidéo).
- Même modèle, même génération. Revendeurs FR de préférence (Boulanger, Fnac, Darty, Decathlon, Cdiscount, boutiques spécialisées), puis site constructeur.
- Ajoute des URLs DIRECTES d'images (.jpg/.png/.webp) si tu en vois : photo produit seule, fond neutre.
- Réponds UNIQUEMENT en appelant l'outil.`;

const tool = {
  name: 'submit_pages',
  description: 'Fiches produit et images du modèle.',
  input_schema: {
    type: 'object',
    properties: {
      product_page_urls: { type: 'array', items: { type: 'string' }, description: '2 à 4 URLs de fiches produit' },
      image_urls: { type: 'array', items: { type: 'string' }, description: '0 à 4 URLs directes d\'images' },
    },
    required: ['product_page_urls'],
  },
};

async function ogImages(pages = []) {
  const out = [];
  for (const url of pages.filter((u) => typeof u === 'string' && /^https?:\/\//i.test(u)).slice(0, 4)) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; pt-extracteur/1.0)' }, signal: AbortSignal.timeout(10000) });
      if (!res.ok) continue;
      const html = await res.text();
      const m = html.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og:image|twitter:image)["']/i);
      if (m) out.push(new URL(m[1].replace(/&amp;/g, '&'), url).href);
    } catch { /* page bloquée ou lente */ }
  }
  return [...new Set(out)];
}

async function main() {
  if (!CAP) { console.log('--plafond-tokens absent : aucun run sans plafond. Arrêt.'); return; }
  const vocab = await loadVocab();
  const files = readdirSync(DATA).filter((f) => f.endsWith('.draft.json') && !f.startsWith('vsett-banc'))
    .filter((f) => !ONLY || ONLY.includes(f.replace('.draft.json', ''))).slice(0, MAX_BRANDS);
  let gainedAll = 0, tried = 0;
  for (const f of files) {
    const out = f.replace('.draft.json', '');
    const draft = JSON.parse(readFileSync(resolve(DATA, f), 'utf-8'));
    const before = { ...usage };
    const t0 = Date.now();
    let touched = 0, gained = 0;
    for (let i = 0; i < (draft.results || []).length; i++) {
      const r = draft.results[i];
      if (r.ready || !r.missing?.length || !r.missing.every((k) => k === 'source_image_urls') || r.toValidate?.length) continue;
      if (r.photo_pass?.model === MODEL) continue;
      if (usage.input_tokens + usage.output_tokens >= CAP) { console.log(`Plafond ${CAP} tokens atteint : arrêt.`); break; }
      tried++; touched++;
      try {
        const got = await claude({ system: SYSTEM, prompt: `Trottinette électrique « ${r.scooter.name} ». Trouve 2 à 4 fiches produit de revendeurs (une page = ce seul modèle).`, tool });
        const specs = { ...(r.raw?.specs || {}) };
        specs.product_page_urls = [...new Set([...(specs.product_page_urls || []), ...(got.product_page_urls || [])])];
        specs.image_urls = [...new Set([...(specs.image_urls || []), ...(got.image_urls || [])])];
        specs._og_images = [...new Set([...(specs._og_images || []), ...(await ogImages(got.product_page_urls))])];
        const n = assembleScooter(draft.brandName, r.scooter.name, specs, r.raw?.keys || {}, vocab);
        n.raw = { specs, keys: r.raw?.keys };
        for (const k of ['disc_pass', 'tire_pass']) if (r[k]) n[k] = r[k];
        n.photo_pass = { model: MODEL, date: new Date().toISOString().slice(0, 10), pages: got.product_page_urls || [], og: specs._og_images.length };
        draft.results[i] = n;
        if (n.ready) { gained++; gainedAll++; }
        console.log(`  ${n.ready ? '✅' : '⚠️'} ${r.scooter.name} → ${n.ready ? `PRÊT (${(n.scooter.source_image_urls || []).length} photo(s))` : `manque ${n.missing.join(', ')}`}`);
      } catch (e) { console.error(`  ✖ ${r.scooter.name} : ${e.message}`); }
    }
    if (!touched) continue;
    const ready = draft.results.filter((r) => r.ready).map((r) => r.scooter);
    const prevJson = (() => { try { return JSON.parse(readFileSync(resolve(DATA, `${out}.json`), 'utf-8')); } catch { return {}; } })();
    writeFileSync(resolve(DATA, `${out}.json`), JSON.stringify({ ...prevJson, brandName: draft.brandName, scooters: ready }, null, 2));
    writeFileSync(resolve(DATA, f), JSON.stringify(draft, null, 2));
    const u = { input_tokens: usage.input_tokens - before.input_tokens, output_tokens: usage.output_tokens - before.output_tokens, web_searches: usage.web_searches - before.web_searches };
    writeFileSync(resolve(DATA, `${out}.sources.md`), sourcesReport(draft.brandName, draft.results, { date: new Date().toISOString().slice(0, 10), model: `passe photos ${MODEL}`, usage: u }));
    appendFileSync(resolve(DATA, '_journal.md'), `- ${new Date().toISOString()} · ${draft.brandName} · PASSE PHOTOS · +${gained} prêt(s) sur ${touched} · ${ready.length} prêt(s) au total · ${((Date.now() - t0) / 60000).toFixed(1)} min · ${u.input_tokens} in / ${u.output_tokens} out / ${u.web_searches} rech.\n`);
  }
  console.log(`Passe photos terminée : ${gainedAll}/${tried} modèles débloqués · ${usage.input_tokens} in / ${usage.output_tokens} out / ${usage.web_searches} recherches`);
}

main().catch((e) => { console.error('❌', e.message); process.exit(1); });
