#!/usr/bin/env node
/**
 * scripts/audit-angles.mjs — audit « 3 angles distincts » (24/10/2026, demande Nolan). LECTURE SEULE.
 * Règle : chaque fiche doit montrer au moins 3 photos d'ANGLES différents (3/4 avant, profil, arrière / plié / détail).
 * Les URL sont toutes uniques en base : le doublon est visuel (même photo ré-uploadée, ou même angle à 5° près).
 *
 * Mesure par photo (vignette 320 px du stockage) :
 *  - silhouette : masque alpha > 128, recadré sur son cadre, posé dans un carré (rapport conservé), 48×48 ;
 *  - dHash 64 bits sur l'objet aplati sur blanc (photo identique / recolorée).
 * Deux photos = MÊME ANGLE si IoU(silhouettes) ≥ SEUIL_IOU, ou si l'une est le miroir de l'autre au même seuil,
 * ou si dHash ≤ 6. Les groupes (fermeture transitive) = les angles distincts de la fiche.
 *
 * Usage : node scripts/audit-angles.mjs --table scooter_models|parts [--slugs a,b,c] [--iou 0.82] [--lot nom]
 * Sorties out/angles-<lot>/ : report.json (toutes les paires mesurées), resume.json, lignes-N.jpg (fiches à corriger,
 * une ligne par fiche, vignettes colorées par groupe d'angle).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import { promisify } from 'util';
import sharp from 'sharp';
const pexec = promisify(execFile);

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const arg = (k, d = null) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const TABLE = arg('--table', 'scooter_models');
if (!['scooter_models', 'parts'].includes(TABLE)) throw new Error('table inconnue');
const SLUGS = (arg('--slugs', '') || '').split(',').map((s) => s.trim()).filter(Boolean);
const SEUIL_IOU = Number(arg('--iou', '0.82'));
const ALL = args.includes('--toutes');
const LOT = arg('--lot', TABLE === 'parts' ? 'pieces' : 'trottinettes');
const OUT = resolve(ROOT, 'out', `angles-${LOT}`);
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

const N = 48;
async function measure(buf) {
  const { data, info } = await sharp(buf, { failOn: 'none' }).ensureAlpha().resize(240, 240, { fit: 'inside' }).raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  let x0 = w, y0 = h, x1 = -1, y1 = -1, opaque = 0, semi = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const a = data[(y * w + x) * 4 + 3];
    if (a > 128) { opaque++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } else if (a > 16) semi++;
  }
  const transparent = opaque < w * h * 0.97; // photo sans détourage = fond opaque partout
  let mask = null, aspect = null;
  if (x1 >= 0 && transparent) {
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, side = Math.max(bw, bh);
    aspect = +(bw / bh).toFixed(2);
    const ox = x0 - Math.floor((side - bw) / 2), oy = y0 - Math.floor((side - bh) / 2);
    mask = new Uint8Array(N * N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      // échantillonnage par bloc : la case est pleine si ≥ 35 % de ses pixels sont opaques
      const sx0 = ox + Math.floor((i * side) / N), sx1 = ox + Math.floor(((i + 1) * side) / N);
      const sy0 = oy + Math.floor((j * side) / N), sy1 = oy + Math.floor(((j + 1) * side) / N);
      let n = 0, t = 0;
      for (let y = sy0; y < Math.max(sy1, sy0 + 1); y++) for (let x = sx0; x < Math.max(sx1, sx0 + 1); x++) {
        t++; if (x >= 0 && y >= 0 && x < w && y < h && data[(y * w + x) * 4 + 3] > 128) n++;
      }
      mask[j * N + i] = n / t >= 0.35 ? 1 : 0;
    }
  }
  const g = await sharp(buf, { failOn: 'none' }).flatten({ background: '#ffffff' }).resize(9, 8, { fit: 'fill' }).grayscale().raw().toBuffer();
  let hash = 0n;
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { hash <<= 1n; if (g[y * 9 + x] > g[y * 9 + x + 1]) hash |= 1n; }
  return { mask, aspect, hash, transparent, semi: +(semi / (w * h)).toFixed(3) };
}
const ham = (a, b) => { let x = a ^ b, n = 0; while (x) { n += Number(x & 1n); x >>= 1n; } return n; };
function iou(a, b, mirror = false) {
  let inter = 0, uni = 0;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const va = a[j * N + i], vb = b[j * N + (mirror ? N - 1 - i : i)];
    if (va || vb) { uni++; if (va && vb) inter++; }
  }
  return uni ? inter / uni : 0;
}

async function fetchRows() {
  const sel = TABLE === 'parts' ? 'id,name,slug,images,image_url' : 'id,name,slug,images,image_url';
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const r = await fetch(`${SB_URL}/rest/v1/${TABLE}?select=${sel}&published=eq.true&order=slug`, { headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, Range: `${from}-${from + 999}` } });
    const page = await r.json();
    if (!Array.isArray(page)) throw new Error('lecture refusée : ' + JSON.stringify(page).slice(0, 200));
    rows.push(...page);
    if (page.length < 1000) break;
  }
  return SLUGS.length ? rows.filter((r) => SLUGS.includes(r.slug)) : rows;
}
const urlsOf = (s) => {
  const im = Array.isArray(s.images) ? [...s.images] : [];
  const list = im.length
    ? im.sort((a, b) => (a?.position ?? 0) - (b?.position ?? 0)).map((i) => (typeof i === 'string' ? i : i?.url)).filter(Boolean)
    : (s.image_url ? [s.image_url] : []);
  return [...new Set(list)];
};

async function tile(buf, l1, l2, color) {
  const W = 180, H = 200;
  const im = buf ? await sharp(buf, { failOn: 'none' }).resize(170, 160, { fit: 'inside' }).png().toBuffer() : null;
  const meta = im ? await sharp(im).metadata() : null;
  const esc = (s) => String(s).replace(/[&<>"]/g, '');
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#a3a3a3"/><rect x="3" y="3" width="${W - 6}" height="${H - 6}" fill="none" stroke="${color}" stroke-width="6"/><rect y="${H - 34}" width="${W}" height="34" fill="#fff"/><text x="5" y="${H - 20}" font-family="DejaVu Sans" font-size="11" font-weight="bold">${esc(l1).slice(0, 26)}</text><text x="5" y="${H - 6}" font-family="DejaVu Sans" font-size="11" fill="${color}" font-weight="bold">${esc(l2).slice(0, 26)}</text></svg>`);
  const comp = [{ input: svg, top: 0, left: 0 }];
  if (im) comp.push({ input: im, top: 4 + Math.round((160 - meta.height) / 2), left: Math.round((W - meta.width) / 2) });
  return sharp({ create: { width: W, height: H, channels: 3, background: '#a3a3a3' } }).composite(comp).jpeg({ quality: 76 }).toBuffer();
}
const COLORS = ['#2e7d32', '#1565c0', '#c79100', '#6a1b9a', '#00838f', '#ad1457', '#4e342e', '#37474f'];

async function auditOne(s) {
  const urls = urlsOf(s);
  const items = [];
  for (const [i, u] of urls.entries()) {
    try { const buf = await get(u); items.push({ i, url: u, buf, ...(await measure(buf)) }); }
    catch (e) { items.push({ i, url: u, buf: null, error: e.message }); }
  }
  // union-find des photos de même angle
  const parent = items.map((_, k) => k);
  const find = (k) => (parent[k] === k ? k : (parent[k] = find(parent[k])));
  const pairs = [];
  for (let a = 0; a < items.length; a++) for (let b = a + 1; b < items.length; b++) {
    const A = items[a], B = items[b];
    if (A.hash === undefined || B.hash === undefined) continue;
    const d = ham(A.hash, B.hash);
    const io = A.mask && B.mask ? Math.max(iou(A.mask, B.mask), iou(A.mask, B.mask, true)) : null;
    const same = d <= 6 || (io !== null && io >= SEUIL_IOU);
    pairs.push({ a, b, dhash: d, iou: io === null ? null : +io.toFixed(3), same });
    if (same) parent[find(b)] = find(a);
  }
  const roots = [...new Set(items.filter((it) => it.hash !== undefined).map((it) => find(it.i)))];
  const groupOf = (k) => roots.indexOf(find(k));
  const groups = roots.map((r) => items.filter((it) => it.hash !== undefined && find(it.i) === r).map((it) => it.i));
  const rec = {
    slug: s.slug, nom: s.name, photos: urls.length, angles: groups.length, groupes: groups,
    a_retirer: groups.flatMap((g) => g.slice(1)), // garder la 1re de chaque groupe (ordre de galerie)
    erreurs: items.filter((it) => it.error).map((it) => it.i),
    non_detourees: items.filter((it) => it.hash !== undefined && !it.transparent).map((it) => it.i),
    pairs,
  };
  rec.verdict = rec.angles >= 3 && rec.a_retirer.length === 0 && rec.non_detourees.length === 0 ? 'ok'
    : rec.angles >= 3 ? 'nettoyer' : 'completer';
  const tiles = rec.verdict === 'ok' && !ALL ? null : await Promise.all(items.slice(0, 8).map((it) => {
    const g = it.hash !== undefined ? groupOf(it.i) : -1;
    const lettre = g >= 0 ? String.fromCharCode(65 + g) : '?';
    const dup = rec.a_retirer.includes(it.i);
    return tile(it.buf, `${s.slug.slice(0, 20)} #${it.i}`, `angle ${lettre}${dup ? ' · DOUBLON' : ''}${it.transparent === false ? ' · FOND' : ''}`, dup ? '#c62828' : (g >= 0 ? COLORS[g % COLORS.length] : '#000'));
  }));
  return { rec, tiles };
}

const rows = await fetchRows();
console.log(`${rows.length} fiches publiées lues dans ${TABLE}`);
if (!rows.length) { console.log('::error title=angles::0 fiche lue (RLS ou filtre ?)'); process.exit(1); }
const report = []; const lignes = [];
const CONC = 6; let next = 0;
await Promise.all(Array.from({ length: CONC }, async () => {
  while (next < rows.length) {
    const s = rows[next++];
    try { const { rec, tiles } = await auditOne(s); report.push(rec); if (tiles) lignes.push({ slug: s.slug, tiles }); }
    catch (e) { report.push({ slug: s.slug, verdict: 'erreur', erreur: e.message }); }
  }
}));
report.sort((a, b) => a.slug.localeCompare(b.slug));
lignes.sort((a, b) => a.slug.localeCompare(b.slug));
writeFileSync(resolve(OUT, 'report.json'), JSON.stringify(report, null, 1));
const W = 180, H = 200;
for (let p = 0; p * 10 < lignes.length; p++) {
  const part = lignes.slice(p * 10, (p + 1) * 10);
  const comp = [];
  part.forEach((r, y) => r.tiles.forEach((t, x) => comp.push({ input: t, left: x * W, top: y * H })));
  await sharp({ create: { width: 8 * W, height: part.length * H, channels: 3, background: '#ffffff' } }).composite(comp).jpeg({ quality: 72 }).toFile(resolve(OUT, `lignes-${p + 1}.jpg`));
}
const c = (f) => report.filter(f).length;
const resume = {
  table: TABLE, seuil_iou: SEUIL_IOU, fiches: report.length,
  ok: c((r) => r.verdict === 'ok'), nettoyer: c((r) => r.verdict === 'nettoyer'), completer: c((r) => r.verdict === 'completer'), erreur: c((r) => r.verdict === 'erreur'),
  photos: report.reduce((a, r) => a + (r.photos || 0), 0), doublons_a_retirer: report.reduce((a, r) => a + (r.a_retirer?.length || 0), 0),
  par_nb_angles: report.reduce((acc, r) => { const k = r.angles ?? 'err'; acc[k] = (acc[k] || 0) + 1; return acc; }, {}),
  planches: Math.ceil(lignes.length / 10),
};
writeFileSync(resolve(OUT, 'resume.json'), JSON.stringify(resume, null, 1));
console.log(`::notice title=angles ${LOT}::${JSON.stringify(resume)}`);
