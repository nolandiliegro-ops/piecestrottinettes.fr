#!/usr/bin/env node
/**
 * scripts/agents/fill-gallery.js — PASSE GALERIE (lot du 13/10/2026)
 *
 * Mesuré le 13/10 sur les 146 modèles publiés (223 photos analysées dans le navigateur) :
 *   221 photos détourées sur 223 ; 88 fiches n'ont qu'UNE photo, 43 en ont 2 ;
 *   2 photos principales à remplacer : velity-511-sx (rangée de trottinettes recadrée),
 *   beaster-bs09 (gros plan de la fourche) ; 20 photos sous 500 px.
 * Objectif Nolan : 3 photos propres et détourées par fiche.
 *
 * Cette passe (GitHub Actions, crédit API) :
 *   1. lit en public les modèles publiés et leurs photos ;
 *   2. demande à Claude (recherche web) des FICHES PRODUIT du modèle exact (site constructeur d'abord) ;
 *   3. extrait elle-même les images de ces pages (og:image, JSON-LD Product, galerie Shopify/Woo) —
 *      une page n'est retenue que si son titre contient le nom du modèle ;
 *   4. DÉTOURE chaque candidate (@imgly, local), la passe au contrôle qualité photoQc (seuils calibrés
 *      17/09) et écarte les doublons (empreinte dHash contre les photos déjà en ligne et entre elles) ;
 *   5. écrit les URLs SOURCES retenues dans <data-dir>/galerie/galerie-ia.json.
 * N'ÉCRIT RIEN EN BASE NI EN STORAGE. L'ajout se fait au FIXE par scripts/add-gallery.js (re-détourage
 * local + process-images en mode ajout).
 *
 * Usage : node scripts/agents/fill-gallery.js --data-dir <dossier> --plafond-tokens N
 *         [--model <id>] [--max-searches 4] [--remplacer slug1,slug2] [--slugs a,b] [--max-modeles N]
 */

import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(`--${n}`); return i !== -1 && args[i + 1] ? args[i + 1] : d; };
const DATA = resolve(process.cwd(), opt('data-dir', 'extraction'));
const MODEL = opt('model', 'claude-sonnet-5-5');
const MAX_SEARCHES = Number(opt('max-searches', '4'));
const CAP = Number(opt('plafond-tokens', '0')); // GARDE-FOU : sans plafond, rien ne part
const REPLACE = (opt('remplacer') || '').split(',').map((s) => s.trim()).filter(Boolean);
const ONLY = opt('slugs') ? opt('slugs').split(',').map((s) => s.trim()) : null;
const MAX_MODELS = Number(opt('max-modeles', '999'));
const TARGET = 3; // photos visées par fiche
const CONC = Math.max(1, Math.min(4, Number(opt('concurrence', '3'))));
const TIME_BUDGET_MIN = Number(opt('budget-minutes', '300')); // le job GitHub est coupé à 330 min

// Dépendances de détourage : installées dans scripts/node_modules (scripts/package.json).
const req = createRequire(resolve(ROOT, 'scripts/package.json'));
const sharp = req('sharp');
const { detoure } = await import('../lib/detoure.js');
const { photoQc } = await import('../lib/photo-qc.js');

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

async function rest(path) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
  if (!res.ok) throw new Error(`REST ${path} → ${res.status}`);
  return res.json();
}

const usage = { input_tokens: 0, output_tokens: 0, web_searches: 0 };
async function claude({ system, prompt, tool }) {
  const messages = [{ role: 'user', content: prompt }];
  for (let turn = 0, retry = 0; turn < 4; turn++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 3000, system, messages, tools: [tool, { type: 'web_search_20250305', name: 'web_search', max_uses: MAX_SEARCHES }] }),
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
    if (data.stop_reason !== 'pause_turn') messages.push({ role: 'user', content: `Conclus maintenant en appelant ${tool.name}.` });
  }
  throw new Error(`Aucun appel à ${tool.name} après 4 tours`);
}

const SYSTEM = `Tu trouves des FICHES PRODUIT d'une trottinette électrique précise, pour récupérer ses photos produit.
- Priorité 1 : la fiche du modèle sur le site OFFICIEL de la marque (souvent une boutique Shopify : URL en /products/...).
- Priorité 2 : fiches de revendeurs qui vendent CE SEUL modèle (Boulanger, Fnac, Darty, Decathlon, boutiques spécialisées, Amazon exclu).
- Même modèle, même génération, même version (un « Pro » n'est pas un « Max », une « 2025 » n'est pas une « 2023 »).
- Pas de catégorie, de comparatif, d'article, de vidéo, de forum.
- Si tu vois des URLs DIRECTES d'images produit (fond blanc ou neutre, trottinette entière), ajoute-les.
Réponds UNIQUEMENT en appelant l'outil.`;

const tool = {
  name: 'submit_pages',
  description: 'Fiches produit du modèle exact.',
  input_schema: {
    type: 'object',
    properties: {
      product_page_urls: { type: 'array', items: { type: 'string' }, description: '2 à 5 URLs de fiches produit, site officiel en premier' },
      image_urls: { type: 'array', items: { type: 'string' }, description: '0 à 6 URLs directes d\'images produit' },
    },
    required: ['product_page_urls'],
  },
};

const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36' };
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

// Jetons distinctifs du nom de modèle (hors marque) : la page doit tous les contenir dans son titre.
function modelTokens(brand, name) {
  const nb = norm(brand).split(' ');
  return norm(name).split(' ').filter((t) => t && !nb.includes(t) && !['trottinette', 'electrique', 'scooter', 'electric'].includes(t));
}

async function pageImages(url, tokens) {
  const out = { ok: false, imgs: [], title: '' };
  try {
    const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(15000), redirect: 'follow' });
    if (!res.ok) return out;
    const html = await res.text();
    const title = (html.match(/<title[^>]*>([^<]*)/i)?.[1] || '') + ' ' + (html.match(/property=["']og:title["'][^>]*content=["']([^"']+)/i)?.[1] || '');
    out.title = title.trim().slice(0, 160);
    const nt = norm(title);
    if (!tokens.every((t) => nt.includes(t))) return out; // page d'un autre modèle : écartée
    out.ok = true;
    const abs = (u) => { try { return new URL(u.replace(/&amp;/g, '&'), url).href; } catch { return null; } };
    const add = (u) => { const a = u && abs(u.startsWith('//') ? 'https:' + u : u); if (a && /^https?:/.test(a)) out.imgs.push(a); };
    for (const m of html.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*content=["']([^"']+)["']/gi)) add(m[1]);
    for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
      try {
        const walk = (n) => {
          if (!n || typeof n !== 'object') return;
          if (Array.isArray(n)) return n.forEach(walk);
          if (/Product/i.test(String(n['@type'])) && n.image) [].concat(n.image).forEach((x) => add(typeof x === 'string' ? x : x?.url));
          Object.values(n).forEach(walk);
        };
        walk(JSON.parse(m[1]));
      } catch { /* JSON-LD invalide */ }
    }
    for (const m of html.matchAll(/data-large_image=["']([^"']+)["']/gi)) add(m[1]); // WooCommerce
    if (/\/products\/[^/?#]+/.test(url)) { // Shopify : toutes les photos du produit
      try {
        const base = url.split(/[?#]/)[0].replace(/\/$/, '');
        const j = await fetch(base + '.js', { headers: UA, signal: AbortSignal.timeout(10000) }).then((r) => (r.ok ? r.json() : null));
        (j?.images || []).forEach((s) => add(s));
      } catch { /* pas Shopify */ }
    }
  } catch { /* page bloquée ou lente */ }
  out.imgs = [...new Set(out.imgs)];
  return out;
}

async function download(url) {
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get('content-type') || '';
  if (!/image\//.test(type)) throw new Error(`pas une image (${type})`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 15000) throw new Error('image trop légère');
  return buf;
}

// Empreinte dHash 64 bits sur l'image posée sur fond blanc.
async function dhash(buf) {
  const { data } = await sharp(buf).flatten({ background: '#ffffff' }).greyscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  let bits = '';
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits += data[y * 9 + x] > data[y * 9 + x + 1] ? '1' : '0';
  return bits;
}
const ham = (a, b) => { let d = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++; return d; };

const PRIORITY = ['xiaomi', 'segway', 'ninebot', 'dualtron', 'kaabo', 'vsett', 'kukirin', 'pure-electric', 'teverun', 'inokim', 'niu', 'zero', 'navee', 'urbanglide', 'wispeed'];

async function main() {
  if (!CAP) { console.log('--plafond-tokens absent : aucun run sans plafond. Arrêt.'); return; }
  if (!env.ANTHROPIC_API_KEY || !SB_URL || !SB_KEY) { console.error('❌ ANTHROPIC_API_KEY / Supabase public absents — arrêt avant tout appel'); process.exit(1); }
  const rows = await rest('scooter_models?select=id,slug,name,image_url,images,brands!scooter_models_brand_id_fkey(name,slug)&published=eq.true&order=slug');
  if (rows.length < 100) { console.log(`::error title=fill-gallery::${rows.length} modèles lus (attendu ≥ 100) — arrêt.`); process.exit(1); }
  const models = rows.map((r) => {
    const imgs = (Array.isArray(r.images) ? r.images : []).map((i) => (typeof i === 'string' ? i : i?.url)).filter(Boolean);
    const all = [...new Set([r.image_url, ...imgs].filter(Boolean))];
    return { id: r.id, slug: r.slug, name: r.name, brand: r.brands?.name || '', brandSlug: r.brands?.slug || '', current: all, replace: REPLACE.includes(r.slug) };
  });
  const rank = (m) => (m.replace ? -100 : 0) + (PRIORITY.includes(m.brandSlug) ? PRIORITY.indexOf(m.brandSlug) : 50) + m.current.length * 0.1;

  const dir = resolve(DATA, 'galerie'); mkdirSync(dir, { recursive: true });
  const outPath = resolve(dir, 'galerie-ia.json');
  const results = existsSync(outPath) ? JSON.parse(readFileSync(outPath, 'utf-8')) : {};
  const todo = models
    .filter((m) => (!ONLY || ONLY.includes(m.slug)) && (m.replace || m.current.length < TARGET) && results[m.slug]?.model !== MODEL)
    .sort((a, b) => rank(a) - rank(b)).slice(0, MAX_MODELS);
  console.log(`🖼  Passe galerie — ${models.length} modèles publiés, ${todo.length} à compléter · ${MODEL} · plafond ${CAP} tokens`);
  const save = () => writeFileSync(outPath, JSON.stringify(results, null, 2));
  const t0 = Date.now();
  let done = 0, added = 0;

  let qi = 0, stop = false;
  async function one(m) {
    const need = m.replace ? TARGET : TARGET - m.current.length;
    const tokens = modelTokens(m.brand, m.name);
    try {
      const got = await claude({ system: SYSTEM, tool, prompt: `Trottinette électrique « ${m.brand} ${m.name} ». Trouve ses fiches produit (site officiel ${m.brand} d'abord) pour en récupérer ${need + 2} photos produit différentes (vues de profil, 3/4, avant, plié).` });
      const pages = (got.product_page_urls || []).filter((u) => /^https?:\/\//i.test(u)).slice(0, 5);
      const cands = []; const okHosts = new Set(); const pageLog = [];
      for (const p of pages) {
        const r = await pageImages(p, tokens);
        pageLog.push({ url: p, ok: r.ok, n: r.imgs.length, title: r.title });
        if (r.ok) { okHosts.add(new URL(p).host); r.imgs.forEach((u) => cands.push({ url: u, page: p })); }
      }
      for (const u of (got.image_urls || [])) { try { if (okHosts.has(new URL(u).host)) cands.push({ url: u, page: 'direct' }); } catch { /* URL invalide */ } }
      const uniq = [...new Map(cands.map((c) => [c.url.split('?')[0], c])).values()].slice(0, 12);

      // Empreintes des photos déjà en ligne (sauf si on remplace tout).
      const known = [];
      if (!m.replace) for (const u of m.current) { try { known.push(await dhash(await download(u))); } catch { /* photo illisible */ } }

      const picks = []; const rejects = {};
      const rej = (k) => { rejects[k] = (rejects[k] || 0) + 1; };
      for (const c of uniq) {
        if (picks.length >= need) break;
        let png;
        try { const src = await sharp(await download(c.url)).png().toBuffer(); png = await detoure(new Blob([src], { type: 'image/png' })); } catch (e) { rej('téléchargement/détourage'); continue; }
        const qc = await photoQc(png);
        if (qc.verdict === 'FAIL') { rej(qc.reasons.join('+')); continue; }
        if (Math.min(qc.width, qc.height) < 600) { rej('basse définition'); continue; }
        const h = await dhash(png);
        if (known.some((k) => ham(k, h) <= 8) || picks.some((p) => ham(p.hash, h) <= 8)) { rej('doublon'); continue; }
        picks.push({ url: c.url, page: c.page, w: qc.width, h: qc.height, verdict: qc.verdict, reasons: qc.reasons, hash: h });
      }
      results[m.slug] = { id: m.id, name: `${m.brand} ${m.name}`, replace: m.replace, current: m.current.length, need, picks: picks.map(({ hash, ...p }) => p), rejects, pages: pageLog, model: MODEL, date: new Date().toISOString().slice(0, 10) };
      done++; added += picks.length;
      console.log(`  ${picks.length >= need ? '✅' : picks.length ? '⚠️' : '·'} ${m.brand} ${m.name} : ${picks.length}/${need} photo(s) · pages ${pageLog.filter((p) => p.ok).length}/${pages.length} · rejets ${JSON.stringify(rejects)}`);
      save();
    } catch (e) { console.error(`  ✖ ${m.slug} : ${e.message}`); console.log(`::warning title=fill-gallery ${m.slug}::${String(e.message).slice(0, 200)}`); }
  }
  async function worker() {
    while (!stop && qi < todo.length) {
      if (usage.input_tokens + usage.output_tokens >= CAP) { if (!stop) console.log(`Plafond ${CAP} tokens atteint : arrêt.`); stop = true; break; }
      if (Date.now() - t0 > TIME_BUDGET_MIN * 60000) { if (!stop) console.log(`Budget temps ${TIME_BUDGET_MIN} min atteint : arrêt propre.`); stop = true; break; }
      await one(todo[qi++]);
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));
  save();
  const line = `- ${new Date().toISOString()} · PASSE GALERIE · ${done} modèles · ${added} photos retenues · ${((Date.now() - t0) / 60000).toFixed(1)} min · ${usage.input_tokens} in / ${usage.output_tokens} out / ${usage.web_searches} rech.\n`;
  appendFileSync(resolve(DATA, '_journal.md'), line);
  console.log(`::notice title=fill-gallery::${line.trim()}`);
}

main().catch((e) => { console.error('❌', e.message); console.log(`::error title=fill-gallery::${String(e.message).slice(0, 300)}`); process.exit(1); });
