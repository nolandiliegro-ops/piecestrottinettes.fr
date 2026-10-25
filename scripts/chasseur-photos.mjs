#!/usr/bin/env node
/**
 * scripts/chasseur-photos.mjs — CHASSEUR PHOTO (25/10/2026, décision de Nolan : « écrit seul + planche le lundi »).
 *
 * Trouve des photos candidates pour les trottinettes qui n'ont pas de vue 3/4 propre (ou moins de 3 photos) et
 * écrit un LOT au format de scripts/photos-galerie.mjs. Il n'écrit RIEN en base : la suite est la chaîne existante
 *   photos-galerie --dry --juge  → planches + proposition (juge vision, anti-doublon contre la galerie en ligne)
 *   photos-galerie --write --append → envoi par process-images (garde-fou doublon + juge rejoués)
 * Recherche : reprise de scripts/agents/fill-gallery.js (13/10) — Claude + recherche web trouve les FICHES PRODUIT
 * du modèle exact ; la page n'est retenue que si son TITRE contient tous les jetons du nom du modèle (garde-fou
 * modèle exact : 22 pneus de la mauvaise variante le 17/10).
 *
 * Usage : node scripts/chasseur-photos.mjs --lot chasse-2510 --cibles depubliees|publiees|toutes|slugs:a,b
 *         --plafond-tokens 400000 [--max-modeles N] [--max-searches 4]
 * Sorties : config/photos/<lot>.json (lot) · out/<lot>/chasse.json (pages lues, rejets, coût).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(`--${n}`); return i !== -1 && args[i + 1] ? args[i + 1] : d; };
const LOT = opt('lot');
const CIBLES = opt('cibles', 'depubliees');
const CAP = Number(opt('plafond-tokens', '0')); // GARDE-FOU : sans plafond, rien ne part
const MAX_MODELS = Number(opt('max-modeles', '999'));
const MAX_SEARCHES = Number(opt('max-searches', '4'));
const MODEL = opt('model', 'claude-sonnet-5-5');
const MAX_CANDS = 10;

function publicSupabase() {
  const src = readFileSync(resolve(ROOT, 'src/integrations/supabase/client.ts'), 'utf-8');
  return { url: src.match(/VITE_SUPABASE_URL\s*\|\|\s*"([^"]+)"/)?.[1], key: src.match(/VITE_SUPABASE_PUBLISHABLE_KEY\s*\|\|\s*"([^"]+)"/)?.[1] };
}
const pub = publicSupabase();
const SB_URL = process.env.VITE_SUPABASE_URL || pub.url;
const SB_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || pub.key;
const rest = async (path) => {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
  if (!r.ok) throw new Error(`REST ${path.slice(0, 60)} → ${r.status}`);
  return r.json();
};
const urlsOf = (images, image_url) => [...new Set([image_url, ...(Array.isArray(images) ? images : []).map((i) => (typeof i === 'string' ? i : i?.url))].filter(Boolean))];

// ─── cibles ───
async function cibles() {
  const f = JSON.parse(readFileSync(resolve(ROOT, 'config/photos/chasse-cibles.json'), 'utf-8'));
  const dep = f.depubliees.map((m) => ({ ...m, published: false }));
  let slugs = null;
  if (CIBLES.startsWith('slugs:')) slugs = CIBLES.slice(6).split(',').map((s) => s.trim()).filter(Boolean);
  const wantPub = CIBLES === 'publiees' || CIBLES === 'toutes' ? f.publiees_slugs : slugs ? slugs.filter((s) => !dep.some((d) => d.slug === s)) : [];
  let pubs = [];
  if (wantPub.length) {
    const rows = await rest(`scooter_models?select=id,slug,name,image_url,images,brands!scooter_models_brand_id_fkey(name)&published=eq.true&slug=in.(${wantPub.join(',')})`);
    pubs = rows.map((r) => ({ id: r.id, slug: r.slug, name: r.name, brand: r.brands?.name || '', published: true, current: urlsOf(r.images, r.image_url) }));
    // le silence n'est pas un succès : une cible publiée absente de la lecture est signalée
    for (const s of wantPub) if (!pubs.some((p) => p.slug === s)) console.log(`::warning title=chasseur::cible ${s} introuvable en lecture publique (dépubliée ?)`);
  }
  const wantDep = CIBLES === 'depubliees' || CIBLES === 'toutes' ? dep : slugs ? dep.filter((d) => slugs.includes(d.slug)) : [];
  return [...wantDep, ...pubs].slice(0, MAX_MODELS);
}

// ─── recherche (reprise de fill-gallery.js) ───
const usage = { input_tokens: 0, output_tokens: 0, web_searches: 0 };
const SYSTEM = `Tu trouves des FICHES PRODUIT d'une trottinette électrique précise, pour récupérer ses photos produit.
- Priorité 1 : la fiche du modèle sur le site OFFICIEL de la marque (souvent une boutique Shopify : URL en /products/...).
- Priorité 2 : fiches de revendeurs qui vendent CE SEUL modèle (boutiques spécialisées, Boulanger, Fnac, Darty, Decathlon ; Amazon exclu).
- Même modèle, même génération, même version (un « Pro » n'est pas un « Max », une « 2025 » n'est pas une « 2023 »).
- Pas de catégorie, de comparatif, d'article, de vidéo, de forum.
- On cherche surtout une VUE DE 3/4 (de biais, on voit le côté ET l'avant), sur fond blanc ou neutre, trottinette seule et entière.
- Si tu vois des URLs DIRECTES d'images produit (fond blanc, trottinette entière, sans personne ni texte), ajoute-les.
Réponds UNIQUEMENT en appelant l'outil.`;
const TOOL = {
  name: 'submit_pages', description: 'Fiches produit du modèle exact.',
  input_schema: { type: 'object', properties: {
    product_page_urls: { type: 'array', items: { type: 'string' }, description: '2 à 5 URLs de fiches produit, site officiel en premier' },
    image_urls: { type: 'array', items: { type: 'string' }, description: "0 à 6 URLs directes d'images produit" },
  }, required: ['product_page_urls'] },
};
async function claude(prompt) {
  const messages = [{ role: 'user', content: prompt }];
  for (let turn = 0, retry = 0; turn < 4; turn++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 3000, system: SYSTEM, messages, tools: [TOOL, { type: 'web_search_20250305', name: 'web_search', max_uses: MAX_SEARCHES }] }),
    });
    if ([429, 500, 529].includes(res.status) && retry < 3) { await new Promise((r) => setTimeout(r, (Number(res.headers.get('retry-after')) || 30 * (retry + 1)) * 1000)); retry++; turn--; continue; }
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    usage.input_tokens += data.usage?.input_tokens || 0;
    usage.output_tokens += data.usage?.output_tokens || 0;
    usage.web_searches += data.usage?.server_tool_use?.web_search_requests || 0;
    const call = (data.content || []).find((c) => c.type === 'tool_use' && c.name === TOOL.name);
    if (call) return call.input;
    messages.push({ role: 'assistant', content: data.content });
    if (data.stop_reason !== 'pause_turn') messages.push({ role: 'user', content: `Conclus maintenant en appelant ${TOOL.name}.` });
  }
  throw new Error(`Aucun appel à ${TOOL.name} après 4 tours`);
}

const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36' };
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const STOP = ['trottinette', 'electrique', 'scooter', 'electric'];
// « F7Ultra » / « H7Pro » : lettres et chiffres collés découpés des deux côtés (nom et titre)
const mots = (s) => norm(s).replace(/([a-z])(?=\d)/g, '$1 ').replace(/(\d)(?=[a-z])/g, '$1 ').split(' ').filter(Boolean);
// Mots de VARIANTE : présents dans le titre mais absents du nom = autre version (Mantis 8 ≠ Mantis 8 Pro) → page écartée
const VARIANTES = ['pro', 'max', 'plus', 'ultra', 'lite', 'mini', 'air', 'gt', 'evo', 'super', 'boost', 'ii', 'iii', 'se', 'x'];
function modelTokens(brand, name) {
  const nb = mots(brand);
  return mots(name).filter((t) => !nb.includes(t) && !STOP.includes(t));
}
async function pageImages(url, tokens) {
  const out = { ok: false, imgs: [], title: '' };
  try {
    const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(15000), redirect: 'follow' });
    if (!res.ok) { out.title = `HTTP ${res.status}`; return out; }
    const html = await res.text();
    const title = (html.match(/<title[^>]*>([^<]*)/i)?.[1] || '') + ' ' + (html.match(/property=["']og:title["'][^>]*content=["']([^"']+)/i)?.[1] || '');
    out.title = title.trim().slice(0, 160);
    const tw = mots(title);
    if (!tokens.every((t) => tw.includes(t))) return out; // page d'un autre modèle : écartée
    const extra = tw.filter((t) => VARIANTES.includes(t) && !tokens.includes(t));
    if (extra.length) { out.title += ` [variante : ${extra.join(',')}]`; return out; }
    out.ok = true;
    const abs = (u) => { try { return new URL(u.replace(/&amp;/g, '&'), url).href; } catch { return null; } };
    const add = (u) => { const a = u && abs(u.startsWith('//') ? 'https:' + u : u); if (a && /^https?:/.test(a)) out.imgs.push(a); };
    for (const m of html.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*content=["']([^"']+)["']/gi)) add(m[1]);
    for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
      try {
        const walk = (n) => { if (!n || typeof n !== 'object') return; if (Array.isArray(n)) return n.forEach(walk);
          if (/Product/i.test(String(n['@type'])) && n.image) [].concat(n.image).forEach((x) => add(typeof x === 'string' ? x : x?.url));
          Object.values(n).forEach(walk); };
        walk(JSON.parse(m[1]));
      } catch { /* JSON-LD invalide */ }
    }
    for (const m of html.matchAll(/data-large_image=["']([^"']+)["']/gi)) add(m[1]); // WooCommerce
    if (/\/products\/[^/?#]+/.test(url)) { // Shopify : toute la galerie du produit
      try {
        const base = url.split(/[?#]/)[0].replace(/\/$/, '');
        const j = await fetch(base + '.js', { headers: UA, signal: AbortSignal.timeout(10000) }).then((r) => (r.ok ? r.json() : null));
        (j?.images || []).forEach((s) => add(s));
      } catch { /* pas Shopify */ }
    }
  } catch (e) { out.title = `erreur ${String(e.message).slice(0, 60)}`; }
  out.imgs = [...new Set(out.imgs)].filter((u) => !/logo|icon|favicon|badge|banner|\.svg|\.gif/i.test(u));
  return out;
}

async function main() {
  if (!LOT || !/^[a-z0-9-]+$/.test(LOT)) { console.log('::error title=chasseur::--lot absent ou invalide'); process.exit(1); }
  if (!CAP) { console.log('::error title=chasseur::--plafond-tokens absent : aucun run sans plafond'); process.exit(1); }
  if (!process.env.ANTHROPIC_API_KEY) { console.log('::error title=chasseur::ANTHROPIC_API_KEY absent — arrêt avant tout appel'); process.exit(1); }
  const models = await cibles();
  if (!models.length) { console.log('::error title=chasseur::0 cible lue — arrêt (une liste vide n\'est pas un succès)'); process.exit(1); }
  console.log(`🎯 Chasseur — ${models.length} cible(s) · ${MODEL} · plafond ${CAP} tokens`);
  const lot = { lot: LOT, entity: 'scooter', chasse: true, models: [] };
  const log = [];
  for (const m of models) {
    if (usage.input_tokens + usage.output_tokens >= CAP) { console.log(`::warning title=chasseur::plafond ${CAP} tokens atteint — ${models.length - log.length} cible(s) non traitées`); break; }
    const tokens = modelTokens(m.brand, m.name);
    const entry = { slug: m.slug, tokens, pages: [], candidates: 0 };
    try {
      const got = await claude(`Trottinette électrique « ${m.brand} ${m.name} ». Trouve ses fiches produit (site officiel ${m.brand} d'abord) pour en récupérer des photos produit : une vue de 3/4 sur fond blanc en priorité, puis profil, face, pliée.`);
      const pages = (got.product_page_urls || []).filter((u) => /^https?:\/\//i.test(u)).slice(0, 5);
      const cands = []; const okHosts = new Set();
      for (const p of pages) {
        const r = await pageImages(p, tokens);
        entry.pages.push({ url: p, ok: r.ok, n: r.imgs.length, title: r.title });
        if (r.ok) { okHosts.add(new URL(p).host); cands.push(...r.imgs); }
      }
      for (const u of got.image_urls || []) { try { if (okHosts.has(new URL(u).host)) cands.push(u); } catch { /* URL invalide */ } }
      const known = new Set(m.current.map((u) => u.split('?')[0]));
      const uniq = [...new Map(cands.map((u) => [u.split('?')[0], u])).values()].filter((u) => !known.has(u.split('?')[0])).slice(0, MAX_CANDS);
      entry.candidates = uniq.length;
      lot.models.push({ id: m.id, slug: m.slug, name: m.name, brand: m.brand, published: m.published, current: m.current, candidates: uniq });
      console.log(`  ${uniq.length ? '🖼 ' : '· '} ${m.slug} : ${uniq.length} candidate(s) · pages retenues ${entry.pages.filter((p) => p.ok).length}/${pages.length}`);
    } catch (e) { entry.error = e.message.slice(0, 200); console.log(`::warning title=chasseur ${m.slug}::${entry.error}`); }
    log.push(entry);
  }
  writeFileSync(resolve(ROOT, 'config/photos', `${LOT}.json`), JSON.stringify(lot, null, 1));
  const OUT = resolve(ROOT, 'out', LOT); mkdirSync(OUT, { recursive: true });
  // coût indicatif Sonnet (3 $/M entrée, 15 $/M sortie, 10 $/1000 recherches) — recompter sur la console Anthropic
  const cout = usage.input_tokens * 3e-6 + usage.output_tokens * 15e-6 + usage.web_searches * 0.01;
  writeFileSync(resolve(OUT, 'chasse.json'), JSON.stringify({ usage, cout_estime_usd: Number(cout.toFixed(2)), cibles: log }, null, 1));
  const sans = lot.models.filter((x) => !x.candidates.length).map((x) => x.slug);
  console.log(`::notice title=chasseur ${LOT}::${lot.models.length} fiches · ${lot.models.reduce((a, x) => a + x.candidates.length, 0)} candidates · ${sans.length} sans source · ${usage.input_tokens} in / ${usage.output_tokens} out / ${usage.web_searches} rech. ≈ ${cout.toFixed(2)} $`);
}
main().catch((e) => { console.log(`::error title=chasseur::${String(e.message).slice(0, 300)}`); process.exit(1); });
