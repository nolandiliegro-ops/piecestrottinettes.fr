#!/usr/bin/env node
/**
 * scripts/garde-doublons.mjs — garde-fou anti-doublon des galeries (25/10/2026). LECTURE SEULE.
 *
 *   --calibrer : mesure TOUTES les paires de photos d'une même fiche publiée (trottinettes + pièces, galeries validées
 *                par vision le 24-25/10 = négatifs) et les 130 copies retirées le 24/10 (config/photos/calib-positifs.json
 *                = positifs). Sort out/doublons-calib/ : calib.json (faux positifs / détections par grille de seuils),
 *                proches-N.jpg (paires négatives les plus proches), rates-N.jpg (positifs non détectés).
 *   --ronde    : passe toutes les fiches publiées avec les seuils de scripts/lib/empreinte.mjs ; sort out/doublons-ronde/
 *                ronde.json + doublons-N.jpg ; code 3 si au moins un doublon (le workflow ouvre alors un ticket).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import { promisify } from 'util';
import sharp from 'sharp';
import { empreinte, ham, iou, ecartCouleur, memePhoto, SEUILS } from './lib/empreinte.mjs';
const pexec = promisify(execFile);

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MODE = process.argv.includes('--ronde') ? 'ronde' : 'calibrer';
const OUT = resolve(ROOT, 'out', `doublons-${MODE === 'ronde' ? 'ronde' : 'calib'}`);
mkdirSync(OUT, { recursive: true });

const client = readFileSync(resolve(ROOT, 'src/integrations/supabase/client.ts'), 'utf-8');
const SB_URL = (client.match(/VITE_SUPABASE_URL\s*\|\|\s*"([^"]+)"/) || [])[1];
const ANON = (client.match(/VITE_SUPABASE_PUBLISHABLE_KEY\s*\|\|\s*"([^"]+)"/) || [])[1];
if (!SB_URL || !ANON) throw new Error('URL / clé publique introuvables dans client.ts');

const small = (u) => u.includes('/storage/v1/object/public/')
  ? u.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') + '?width=320&resize=contain&quality=80'
  : u;
async function get(u) {
  for (let t = 0; t < 3; t++) {
    try {
      const { stdout } = await pexec('curl', ['-s', '-f', '-L', '--max-time', '30', small(u)], { encoding: 'buffer', maxBuffer: 32 * 1024 * 1024 });
      if (stdout.length > 200) return stdout;
    } catch { /* nouvel essai */ }
    await new Promise((r) => setTimeout(r, 800 * (t + 1)));
  }
  throw new Error('téléchargement impossible');
}

async function rows(table) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const r = await fetch(`${SB_URL}/rest/v1/${table}?select=slug,images&published=eq.true&order=slug`, { headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, Range: `${from}-${from + 999}` } });
    const page = await r.json();
    if (!Array.isArray(page)) throw new Error('lecture refusée : ' + JSON.stringify(page).slice(0, 200));
    out.push(...page.map((p) => ({ ...p, table })));
    if (page.length < 1000) break;
  }
  if (out.length === 0) throw new Error(`0 fiche lue dans ${table} (RLS ?)`);
  return out;
}
const urlsOf = (s) => (Array.isArray(s.images) ? [...s.images] : [])
  .sort((a, b) => (a?.position ?? 0) - (b?.position ?? 0)).map((i) => (typeof i === 'string' ? i : i?.url)).filter(Boolean);

// cache d'empreintes par URL
const cache = new Map(); const bufs = new Map();
async function fp(u) {
  if (cache.has(u)) return cache.get(u);
  const p = (async () => { const b = await get(u); bufs.set(u, b); return empreinte(b); })().catch((e) => ({ err: e.message }));
  cache.set(u, p);
  return p;
}
async function pool(items, n, fn) { let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; await fn(items[k]); } })); }

async function tile(u, l1, l2, color) {
  const W = 200, H = 220, b = bufs.get(u);
  const im = b ? await sharp(b, { failOn: 'none' }).resize(190, 180, { fit: 'inside' }).png().toBuffer() : null;
  const meta = im ? await sharp(im).metadata() : null;
  const esc = (s) => String(s).replace(/[&<>"]/g, '');
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#a3a3a3"/><rect x="3" y="3" width="${W - 6}" height="${H - 6}" fill="none" stroke="${color}" stroke-width="6"/><rect y="${H - 34}" width="${W}" height="34" fill="#fff"/><text x="5" y="${H - 20}" font-family="DejaVu Sans" font-size="11" font-weight="bold">${esc(l1).slice(0, 30)}</text><text x="5" y="${H - 6}" font-family="DejaVu Sans" font-size="11" fill="${color}" font-weight="bold">${esc(l2).slice(0, 30)}</text></svg>`);
  const comp = [{ input: svg, top: 0, left: 0 }];
  if (im) comp.push({ input: im, top: 4 + Math.round((180 - meta.height) / 2), left: Math.round((W - meta.width) / 2) });
  return sharp({ create: { width: W, height: H, channels: 3, background: '#a3a3a3' } }).composite(comp).jpeg({ quality: 76 }).toBuffer();
}
async function planchePaires(pairs, nom) {
  const W = 200, H = 220, PER = 12; // 12 paires par planche, 2 paires par rangée (4 vignettes)
  for (let p = 0; p * PER < pairs.length; p++) {
    const part = pairs.slice(p * PER, (p + 1) * PER);
    const comp = [];
    for (const [k, q] of part.entries()) {
      const x = (k % 2) * 4 * W + (k % 2) * 20, y = Math.floor(k / 2) * H;
      const lab = `d${q.d} s${q.io === null ? '-' : q.io.toFixed(2)} c${q.c === null || q.c === undefined ? '-' : q.c.toFixed(0)}`;
      comp.push({ input: await tile(q.a, q.slug, lab, '#c62828'), left: x, top: y });
      comp.push({ input: await tile(q.b, `#${q.ia} / #${q.ib}`, q.table, '#1565c0'), left: x + W, top: y });
    }
    await sharp({ create: { width: 2 * 4 * W + 20, height: Math.ceil(part.length / 2) * H, channels: 3, background: '#ffffff' } }).composite(comp).jpeg({ quality: 74 }).toFile(resolve(OUT, `${nom}-${p + 1}.jpg`));
  }
}

const fiches = [...(await rows('scooter_models')), ...(await rows('parts'))];
const allUrls = [...new Set(fiches.flatMap(urlsOf))];
console.log(`${fiches.length} fiches publiées, ${allUrls.length} photos`);
let pos = [];
if (MODE === 'calibrer') {
  pos = JSON.parse(readFileSync(resolve(ROOT, 'config/photos/calib-positifs.json'), 'utf-8'));
  for (const p of pos) allUrls.push(p.retiree, ...p.gardees);
}
await pool([...new Set(allUrls)], 8, fp);

const neg = [];
for (const s of fiches) {
  const us = urlsOf(s);
  for (let a = 0; a < us.length; a++) for (let b = a + 1; b < us.length; b++) {
    const A = await fp(us[a]), B = await fp(us[b]);
    if (A.err || B.err) continue;
    neg.push({ slug: s.slug, table: s.table, ia: a, ib: b, a: us[a], b: us[b], d: ham(A.hash, B.hash), io: iou(A.mask, B.mask), c: ecartCouleur(A.rgb, B.rgb) });
  }
}
const erreurs = [...cache.keys()].length - (await Promise.all([...cache.values()])).filter((x) => !x.err).length;

if (MODE === 'ronde') {
  const hits = [];
  for (const q of neg) { const A = await fp(q.a), B = await fp(q.b); const m = memePhoto(A, B); if (m.doublon) hits.push({ ...q, raison: m.raison }); }
  writeFileSync(resolve(OUT, 'ronde.json'), JSON.stringify({ seuils: SEUILS, fiches: fiches.length, paires: neg.length, erreurs_telechargement: erreurs, doublons: hits.map(({ a, b, ...r }) => ({ ...r, a, b })) }, null, 1));
  await planchePaires(hits, 'doublons');
  console.log(`::notice title=ronde doublons::${fiches.length} fiches · ${neg.length} paires · ${hits.length} doublon(s) · ${erreurs} téléchargement(s) en échec`);
  process.exit(hits.length ? 3 : 0);
}

// ── calibration ──
const posM = [];
for (const p of pos) {
  const R = await fp(p.retiree); if (R.err) continue;
  let best = null;
  for (const g of p.gardees) { const G = await fp(g); if (G.err) continue; const d = ham(R.hash, G.hash), io = iou(R.mask, G.mask), c = ecartCouleur(R.rgb, G.rgb); if (!best || d < best.d) best = { slug: p.slug, table: 'parts', ia: 'retirée', ib: 'gardée', a: p.retiree, b: g, d, io, c }; }
  if (best) posM.push(best);
}
const grille = [];
for (const dh of [4, 6, 8, 10]) for (const si of [0.95, 0.97, 0.98]) for (const dhi of [10, 12, 14]) for (const cc of [10, 15, 20, 25, 30, 40]) {
  const s = { dhash: dh, iou: si, dhashAvecIou: dhi, couleur: cc };
  const flag = (q) => !(q.c !== null && q.c > s.couleur) && (q.d <= s.dhash || (q.io !== null && q.io >= s.iou && q.d <= s.dhashAvecIou));
  grille.push({ ...s, faux_positifs: neg.filter(flag).length, detectes: posM.filter(flag).length, positifs: posM.length });
}
grille.sort((x, y) => x.faux_positifs - y.faux_positifs || y.detectes - x.detectes);
const proches = [...neg].filter((q) => q.d <= 12).sort((x, y) => (x.c ?? 999) - (y.c ?? 999)).slice(0, 36);
const flagCur = (q) => !(q.c !== null && q.c > SEUILS.couleur) && (q.d <= SEUILS.dhash || (q.io !== null && q.io >= SEUILS.iou && q.d <= SEUILS.dhashAvecIou));
const rates = posM.filter((q) => !flagCur(q));
const hist = (arr) => { const h = {}; for (const q of arr) h[q.d] = (h[q.d] || 0) + 1; return h; };
writeFileSync(resolve(OUT, 'calib.json'), JSON.stringify({ fiches: fiches.length, paires_negatives: neg.length, positifs: posM.length, erreurs_telechargement: erreurs, seuils_actuels: SEUILS,
  actuels: { faux_positifs: neg.filter(flagCur).map(({ slug, ia, ib, d, io, c }) => ({ slug, ia, ib, d, io, c })), rates: rates.length },
  hist_dhash_negatifs: hist(neg), hist_dhash_positifs: hist(posM), grille: grille.slice(0, 40) }, null, 1));
await planchePaires(proches, 'proches');
await planchePaires(rates.slice(0, 36), 'rates');
console.log(`::notice title=calibration doublons::${neg.length} paires négatives · ${posM.length} positifs · seuils actuels : ${neg.filter(flagCur).length} faux positif(s), ${rates.length} raté(s)`);
