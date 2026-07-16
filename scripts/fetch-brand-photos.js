#!/usr/bin/env node
/**
 * scripts/fetch-brand-photos.js
 * Entrée : un slug de marque (ex. dualtron).
 * Lit scripts/data/sources.json, croise avec les slugs RÉELS en BDD (garde-fou),
 * applique l'adaptateur du revendeur, écrit scripts/data/{marque}.json au format
 * update-photos.js : { brandName, scooters:[{ slug, source_image_urls[] }] }
 * Usage : node scripts/fetch-brand-photos.js dualtron [--limit N] [--out chemin.json]
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

const argv = process.argv.slice(2);
const brandArg = argv.find(a => !a.startsWith('--'));
if (!brandArg) {
  console.error('Usage: node scripts/fetch-brand-photos.js <marque> [--limit N] [--out chemin.json]');
  process.exit(1);
}
const brand = brandArg.toLowerCase();
const limitIdx = argv.indexOf('--limit');
const LIMIT = limitIdx !== -1 ? parseInt(argv[limitIdx + 1], 10) : Infinity;
const outIdx = argv.indexOf('--out');
const OUT = outIdx !== -1
  ? resolve(process.cwd(), argv[outIdx + 1])
  : resolve(__dirname, `data/${brand}.json`);

const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; pt-photo-bot/1.0)' };

function loadEnv() {
  const envPath = resolve(__dirname, '../.env');
  let content;
  try { content = readFileSync(envPath, 'utf-8'); }
  catch { console.error('.env introuvable :', envPath); process.exit(1); }
  const env = {};
  for (const line of content.split('\n')) {
    const m = line.match(/^([^#=][^=]*)=["']?([^"'\r\n]*)["']?/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

async function getBrandModels(brandSlug, SUPABASE_URL, ANON_KEY) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/scooter_models?select=slug,name,brand:brands!scooter_models_brand_id_fkey(slug,name)&order=name.asc`,
    { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } }
  );
  if (!res.ok) { console.error('Supabase :', res.status, await res.text()); process.exit(1); }
  const rows = await res.json();
  const matched = rows.filter(r => r.brand?.slug === brandSlug);
  const brandName = matched[0]?.brand?.name || brandSlug;
  return { brandName, models: matched.map(r => ({ slug: r.slug, name: r.name })) };
}

function norm(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}
function tokens(s) { return norm(s).split(' ').filter(t => t.length > 1 || /[0-9]/.test(t)); }
function titleMatches(modelName, candidate) {
  const mt = tokens(modelName);
  if (mt.length === 0) return false;
  const ct = new Set(tokens(candidate));
  return mt.every(t => ct.has(t));
}
function cleanUrl(u) { return String(u).split('?')[0]; }

// --- Matching Odoo (categorie) : tolere le millesime, garde generation + suffixe ---
// Retire UNIQUEMENT les tokens d'annee (20xx) et les specs (52V, 40Ah, IPX5...),
// traite LIMITED == LTD. GARDE numero de generation et suffixe (X, PRO, MAX).
function odooIdTokens(name) {
  let s = String(name || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  s = s.replace(/ /g, ' ');
  s = s.replace(/\bipx\s?\d+\b/g, ' ');                                                   // indice etancheite
  s = s.replace(/\d+[.,]?\d*\s?(?:v|a|ah|wh|w|kmh|km\/h|km|kg|mm|pouces?|inch)\b/g, ' ');  // specs V/A/Ah/W...
  return s.split(/[^a-z0-9]+/)
    .filter(Boolean)
    .filter(t => t.length > 1 || /[0-9]/.test(t))   // vire lettres seules (bruit)
    .filter(t => !/^20\d{2}$/.test(t))              // vire les millesimes 20xx
    .map(t => (t === 'limited' ? 'ltd' : t));       // LIMITED == LTD
}
function splitWordsNums(toks) {
  const words = new Set(), nums = new Set();
  for (const t of toks) (/^\d+$/.test(t) ? nums : words).add(t);
  return { words, nums };
}
// Finition discriminante et SYMETRIQUE (limited deja normalise en ltd dans odooIdTokens).
// "G4" nu ne doit jamais matcher "G4 Max" ni l'inverse -> max/ultra/master/adventurers ici.
// "lite" = finition a part entiere : "Mantis 8" (nu) != "Mantis 8 Lite".
const FINITION = new Set(['ltd', 'pro', 'max', 'ultra', 'master', 'adventurers', 'lite']);
// Mots ignores (ni finition ni generation) : bruit editorial/categorie + regionaux (VMP/ABE).
const STOPWORDS = new Set(['new', 'electric', 'scooter', 'trottinette', 'electrique', 'vmp', 'abe']);

// Match si : tous les MOTS du modele sont dans le candidat (subset -> "togo" matche
// "togo max" ET "togo pro" => 2 candidats => AMBIGU), les NOMBRES de generation sont
// identiques des deux cotes (Thunder 3 != Thunder != Thunder 2 => ABSENT), ET les
// tokens de FINITION sont symetriques : presents des DEUX cotes ou d'AUCUN
// (storm base vs NEW STORM LTD => ABSENT ; storm-ltd-2025 vs NEW STORM LTD => MATCH).
function odooMatches(modelName, candName) {
  const m = splitWordsNums(odooIdTokens(modelName).filter(t => !STOPWORDS.has(t)));
  const c = splitWordsNums(odooIdTokens(candName).filter(t => !STOPWORDS.has(t)));
  if (m.words.size === 0) return false;
  const fin = set => [...set].filter(w => FINITION.has(w)).sort().join(',');
  if (fin(m.words) !== fin(c.words)) return false;   // symetrie de finition
  for (const w of m.words) if (!c.words.has(w)) return false;
  if (m.nums.size !== c.nums.size) return false;
  for (const n of m.nums) if (!c.nums.has(n)) return false;
  return true;
}
// Cle de finition d'un nom (tokens FINITION tries) — garde-fou titre cote shopify.
function finitionKey(name) {
  const w = splitWordsNums(odooIdTokens(name).filter(t => !STOPWORDS.has(t))).words;
  return [...w].filter(x => FINITION.has(x)).sort().join(',');
}
// minimotors (Odoo) bloque undici/fetch au niveau WAF (403 sur empreinte TLS)
// mais laisse passer curl. On route donc les appels minimotors via curl (natif Windows 11).
const CURL_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
function curlText(url) {
  try {
    return execFileSync('curl', ['-s', '-L', '-A', CURL_UA, url], { encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 });
  } catch (e) { console.error(`   curl KO ${url}: ${e.message}`); return ''; }
}
function curlStatus(url) {
  const nul = process.platform === 'win32' ? 'NUL' : '/dev/null';
  try {
    const out = execFileSync('curl', ['-s', '-I', '-L', '-o', nul, '-w', '%{http_code}', '-A', CURL_UA, url], { encoding: 'utf-8' });
    return parseInt(String(out).trim(), 10) || 0;
  } catch { return 0; }
}

// Garde-fou image : ne retient une URL qu'apres un HEAD 200 (via curl).
async function headOk(url) {
  return curlStatus(url) === 200;
}

async function shopifyAllProducts(base) {
  const all = [];
  for (let page = 1; page <= 20; page++) {
    let res;
    try { res = await fetch(`${base}/products.json?limit=250&page=${page}`, { headers: UA }); }
    catch (e) { console.error(`   shopify fetch KO p${page}: ${e.message}`); break; }
    if (!res.ok) break;
    const j = await res.json().catch(() => ({}));
    const prods = j.products || [];
    all.push(...prods);
    if (prods.length < 250) break;
  }
  return all;
}
async function adapterShopify(models, rev) {
  const products = await shopifyAllProducts(rev.base_url);
  const typeFilter = rev.product_type_filter;
  const pool = typeFilter
    ? products.filter(p => (p.product_type || '').toLowerCase() === typeFilter.toLowerCase())
    : products;
  const brandKey = norm(brand);
  const brandProducts = pool.filter(p => norm(`${p.vendor || ''} ${p.title} ${p.handle}`).includes(brandKey));
  console.log(`   shopify(${rev.base_url}) : ${products.length} -> ${pool.length} "${typeFilter || '*'}" -> ${brandProducts.length} ${brandKey}`);
  // Titres officiels nus ("Mantis King GT") sans prefixe marque -> retirer le
  // token marque EN TETE du nom BDD (pool deja scope marque = neutre).
  const stripBrand = name => name.replace(new RegExp(`^\\s*${brand}\\b`, 'i'), '').trim();
  return models.map(m => {
    // matcher tolerant partage avec le chemin odoo : ignore annee/parentheses/regionaux,
    // garde generation + finition SYMETRIQUE (G4 != G4 Max).
    const mName = stripBrand(m.name);
    const matches = brandProducts.filter(p => {
      const ok = odooMatches(mName, p.title) || odooMatches(mName, p.handle.replace(/-/g, ' '));
      // Le TITRE fait foi pour la finition : bloque "Mantis 8" -> "Mantis 8 Lite"
      // meme quand le match passe par le handle (qui, lui, ne porte pas "lite").
      return ok && finitionKey(mName) === finitionKey(p.title);
    });
    if (matches.length !== 1) {
      console.log(`   ! ${m.slug} : ${matches.length} match(s) shopify -> ABSENT`);
      return { slug: m.slug, source_image_urls: ['ABSENT'], _reason: `${matches.length} matchs` };
    }
    const imgs = (matches[0].images || []).map(i => cleanUrl(i.src)).slice(0, 4);
    if (imgs.length === 0) return { slug: m.slug, source_image_urls: ['ABSENT'], _reason: 'produit sans image' };
    console.log(`   ok ${m.slug} -> "${matches[0].title}" (${imgs.length} img)`);
    return { slug: m.slug, source_image_urls: imgs, _match: matches[0].title };
  });
}

// Scrape UNE fois la liste des categories scooters minimotors et ecrit
// odoo_category_id dans sources.json pour chaque marque du registre qui matche.
async function discoverOdooCategories(registry, registryPath, rev) {
  const html = curlText(`${rev.base_url}/en/shop`);
  const cats = new Map(); // segment marque -> catId
  for (const mm of html.matchAll(/\/shop\/category\/trottinettes-electriques-([a-z0-9-]+?)-(\d+)(?=[\/"?#])/gi)) {
    const seg = mm[1].toLowerCase();
    if (!cats.has(seg)) cats.set(seg, Number(mm[2]));
  }
  const mapping = [];
  let changed = false;
  for (const [slug, mq] of Object.entries(registry.marques || {})) {
    if (cats.has(slug)) {
      const id = cats.get(slug);
      mapping.push({ marque: slug, catId: id });
      if (mq.odoo_category_id !== id) { mq.odoo_category_id = id; changed = true; }
    }
  }
  if (changed) writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf-8');
  return { mapping, total: cats.size };
}

// Source = page CATEGORIE (ne liste que des trottinettes, pas les pieces).
// Lit l'ID template + le nom "[SKU] NOM" dans le HTML, matche au nom BDD,
// construit /web/image/product.template/{ID}/image_1920 (fallback image_512),
// et ne retient l'URL qu'apres un HEAD 200 (garde-fou).
async function adapterOdoo(models, rev, marque) {
  const catId = marque.odoo_category_id;
  if (!catId) {
    console.log('   ! odoo_category_id absent pour cette marque -> tout ABSENT');
    return models.map(m => ({ slug: m.slug, source_image_urls: ['ABSENT'], _status: 'ABSENT', _reason: 'pas de categorie odoo' }));
  }
  const catUrl = `${rev.base_url}/en/shop/category/trottinettes-electriques-${brand}-${catId}`;
  const html = curlText(catUrl);

  // Produits de la categorie : template ID + nom depuis /web/image/product.template/{ID}/image_.../[SKU] NOM
  const prodMap = new Map();
  for (const mm of html.matchAll(/\/web\/image\/product\.template\/(\d+)\/image_\d+\/([^"?]+)/g)) {
    const id = mm[1];
    if (prodMap.has(id)) continue;
    let name;
    try { name = decodeURIComponent(mm[2]); } catch { name = mm[2]; }
    name = name.replace(/^\s*\[[^\]]*\]\s*/, '').trim();   // retire le [SKU]
    if (name) prodMap.set(id, name);
  }
  const products = [...prodMap.entries()].map(([id, name]) => ({ id, name }));
  console.log(`   odoo cat ${catId} (${brand}) : ${products.length} trottinette(s) listee(s)`);

  const out = [];
  for (const m of models) {
    const proven = marque.exemples_prouves?.[m.slug] || null;
    const cands = products.filter(p => odooMatches(m.name, p.name));
    // Tie-break : un exemple prouve (valide main) prime des que le matcher n'est pas
    // net (0 candidat OU 2+ AMBIGU) -> tranche achilleus/togo et rattrape forever.
    if (proven && cands.length !== 1) {
      if (await headOk(proven)) {
        console.log(`   ok ${m.slug} -> exemple_prouve (tie-break, matcher=${cands.length}, HEAD 200)`);
        out.push({ slug: m.slug, source_image_urls: [proven], _status: 'MATCH', _match: 'exemple_prouve', _templateId: '(prouve)', _proven: proven });
      } else {
        console.log(`   ! ${m.slug} : exemple_prouve HEAD != 200 -> ABSENT (a re-sourcer)`);
        out.push({ slug: m.slug, source_image_urls: ['ABSENT'], _status: 'ABSENT', _reason: 'exemple_prouve perime (HEAD != 200), a re-sourcer', _proven: proven });
      }
      continue;
    }
    if (cands.length === 0) {
      console.log(`   ! ${m.slug} : 0 candidat -> ABSENT`);
      out.push({ slug: m.slug, source_image_urls: ['ABSENT'], _status: 'ABSENT', _reason: '0 candidat', _proven: proven });
      continue;
    }
    if (cands.length > 1) {
      console.log(`   ~ ${m.slug} : ${cands.length} candidats -> AMBIGU`);
      out.push({
        slug: m.slug, source_image_urls: ['ABSENT'], _status: 'AMBIGU',
        _reason: `${cands.length} candidats`, _candidates: cands.map(c => `${c.id}:${c.name}`), _proven: proven,
      });
      continue;
    }
    const c = cands[0];
    const url1920 = `${rev.base_url}/web/image/product.template/${c.id}/image_1920`;
    const url512 = `${rev.base_url}/web/image/product.template/${c.id}/image_512`;
    let url = null;
    if (await headOk(url1920)) url = url1920;
    else if (await headOk(url512)) url = url512;
    if (!url) {
      console.log(`   ! ${m.slug} : image HEAD != 200 -> ABSENT`);
      out.push({ slug: m.slug, source_image_urls: ['ABSENT'], _status: 'ABSENT', _reason: 'image non 200 (HEAD)', _match: c.name, _templateId: c.id, _proven: proven });
      continue;
    }
    console.log(`   ok ${m.slug} -> template ${c.id} ("${c.name}")`);
    out.push({ slug: m.slug, source_image_urls: [url], _status: 'MATCH', _match: c.name, _templateId: c.id, _proven: proven });
  }
  return out;
}

async function adapterWoo(models, rev) {
  const out = [];
  for (const m of models) {
    let productUrl = null, html = '';
    try {
      const r = await fetch(`${rev.base_url}/product/${m.slug}/`, { headers: UA });
      if (r.ok) { productUrl = r.url; html = await r.text(); }
    } catch {}
    if (!html) {
      try {
        const r = await fetch(`${rev.base_url}/?s=${encodeURIComponent(m.name)}&post_type=product`, { headers: UA });
        const search = r.ok ? await r.text() : '';
        const link = [...search.matchAll(/href="([^"]*\/product\/[^"]+?)"/g)].map(x => x[1])[0];
        if (link) { const pr = await fetch(link, { headers: UA }); if (pr.ok) { productUrl = link; html = await pr.text(); } }
      } catch {}
    }
    if (!html) { out.push({ slug: m.slug, source_image_urls: ['ABSENT'], _reason: 'fiche woo introuvable' }); console.log(`   ! ${m.slug} : fiche woo introuvable -> ABSENT`); continue; }
    const urls = new Set();
    const og = html.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i);
    if (og) urls.add(cleanUrl(og[1]));
    for (const x of html.matchAll(/(https?:\/\/[^"'\s]+wp-content\/uploads\/\d{4}\/\d{2}\/[^"'\s]+\.(?:jpe?g|webp|png))/gi)) urls.add(cleanUrl(x[1]));
    const imgs = [...urls].slice(0, 4);
    if (imgs.length === 0) { out.push({ slug: m.slug, source_image_urls: ['ABSENT'], _reason: 'fiche sans image' }); console.log(`   ! ${m.slug} : fiche sans image -> ABSENT`); continue; }
    console.log(`   ok ${m.slug} -> ${imgs.length} img (woo)`);
    out.push({ slug: m.slug, source_image_urls: imgs, _match: productUrl });
  }
  return out;
}

async function main() {
  const env = loadEnv();
  const SUPABASE_URL = env.VITE_SUPABASE_URL;
  const ANON_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!SUPABASE_URL || !ANON_KEY) {
    console.error('.env manquant : VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY');
    process.exit(1);
  }
  const registryPath = resolve(__dirname, 'data/sources.json');
  let registry;
  try { registry = JSON.parse(readFileSync(registryPath, 'utf-8')); }
  catch (e) { console.error('sources.json illisible :', registryPath, e.message); process.exit(1); }

  const marque = registry.marques?.[brand];
  if (!marque) {
    console.error(`Marque "${brand}" absente du registre. Ajoute-la a sources.json APRES ouverture prouvee - ne devine pas.`);
    process.exit(1);
  }
  if (marque.statut === 'inconnu' || marque.statut === 'shooting_maison') {
    console.log(`\n[skip] ${brand} : statut "${marque.statut}" - ${marque.preuve || ''}`);
    console.log('   Aucune URL collectee (regle dure).');
    process.exit(0);
  }
  const { brandName, models: allModels } = await getBrandModels(brand, SUPABASE_URL, ANON_KEY);
  if (allModels.length === 0) {
    console.error(`Aucun modele "${brand}" en BDD (scooter_models.brand.slug). Verifie le slug marque.`);
    process.exit(1);
  }
  const models = allModels.slice(0, LIMIT);
  console.log(`\n-> ${brandName} (${models.length}/${allModels.length} modele(s) BDD cible(s))`);

  const rev = registry.revendeurs?.[marque.revendeur];
  if (!rev) { console.error(`Revendeur "${marque.revendeur}" absent de sources.json`); process.exit(1); }
  console.log(`   revendeur: ${marque.revendeur} (${rev.plateforme})`);

  // Odoo : scrape unique de la liste des categories -> ecrit odoo_category_id au registre
  if (rev.plateforme === 'odoo' && !marque.odoo_category_id) {
    console.log('   > decouverte categories odoo (scrape unique)...');
    const { mapping, total } = await discoverOdooCategories(registry, registryPath, rev);
    console.log(`   ${total} categorie(s) scooters minimotors. Mapping marque->catId ecrit dans sources.json :`);
    if (mapping.length === 0) console.log('     (aucune marque du registre ne matche une categorie)');
    for (const mp of mapping) console.log(`     - ${mp.marque} -> ${mp.catId}`);
  }

  let results;
  switch (rev.plateforme) {
    case 'shopify': results = await adapterShopify(models, rev); break;
    case 'odoo': results = await adapterOdoo(models, rev, marque); break;
    case 'woocommerce': results = await adapterWoo(models, rev); break;
    default:
      console.log(`   ! plateforme "${rev.plateforme}" non couverte - source a traiter a la main.`);
      results = models.map(m => ({ slug: m.slug, source_image_urls: ['ABSENT'], _reason: `plateforme ${rev.plateforme}` }));
  }

  // Tableau dry-run (si l'adaptateur fournit des statuts detailles)
  if (results.some(r => r._status)) {
    console.log('\n   ===== TABLEAU DRY-RUN =====');
    console.log('   slug BDD | nom source matche | template | statut | voie');
    for (const r of results) {
      const nom = r._match || (r._candidates ? r._candidates.join('  //  ') : '-');
      const voie = r._match === 'exemple_prouve' ? 'tie-break' : (r._status === 'MATCH' ? 'matcher' : '-');
      const proven = r._proven ? `  (exemple_prouve: ${r._proven})` : '';
      console.log(`   ${r.slug} | ${nom} | ${r._templateId || '-'} | ${r._status} | ${voie}${proven}`);
    }
  }

  // Sortie update-photos.js : on remplit image_url ET images (format ImageEntry)
  const scooters = results.filter(r => !r.source_image_urls.includes('ABSENT'))
    .map(r => {
      const urls = r.source_image_urls;
      return {
        slug: r.slug,
        image_url: urls[0],
        images: urls.map((url, i) => ({ url, position: i, is_primary: i === 0 })),
        source_image_urls: urls,
      };
    });
  const absent = results.filter(r => r.source_image_urls.includes('ABSENT'))
    .map(r => ({ slug: r.slug, statut: r._status || 'ABSENT', raison: r._reason }));

  const payload = { brandName, scooters, _absent: absent, _source: marque.revendeur, _dry_run: true };
  writeFileSync(OUT, JSON.stringify(payload, null, 2), 'utf-8');

  console.log(`\n[ok] ${scooters.length} MATCH avec URL(s), ${absent.length} non retenu(s)`);
  if (absent.length) console.log('   non retenus :', absent.map(a => `${a.slug}(${a.statut})`).join(', '));
  console.log(`\nEcrit : ${OUT}  (DRY-RUN, aucune ecriture BDD)`);
  console.log('   REGLE DURE : ouvre chaque URL dans ton Chrome avant tout import.');
}
main();
