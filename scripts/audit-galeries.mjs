#!/usr/bin/env node
/**
 * scripts/audit-galeries.mjs — audit des galeries en ligne (17/10/2026). LECTURE SEULE, aucune écriture en base.
 * Entrée : config/photos/<lot>.json { lot, models: [{ id, slug, name, urls: [url principale d'abord, ...] }] }
 * Pour chaque photo : forme du produit (rapport largeur/hauteur, remplissage du cadre), empreinte visuelle (dHash 64 bits).
 *  - DOUBLON : empreinte à ≤ 8 bits d'une photo précédente de la même galerie (même photo recadrée / autre couleur très proche).
 *  - GROS PLAN probable : remplissage élevé (roue, deck) ou forme très allongée/très haute sans silhouette de trottinette.
 * Proposition : 2e photo = 1er gros plan non doublon, sinon la vue la plus différente de la principale.
 * Sorties (out/<lot>/) : report.json, paires-N.jpg (principale + 2e proposée, 4 modèles par ligne), lignes-N.jpg (toute la galerie, 1 modèle par ligne).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const arg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const lot = JSON.parse(readFileSync(resolve(ROOT, arg('--file')), 'utf-8'));
const OUT = resolve(ROOT, 'out', lot.lot);
mkdirSync(OUT, { recursive: true });

const small = (u) => u.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') + '?width=320&resize=contain&quality=80';
const get = (u) => execFileSync('curl', ['-s', '-L', '--max-time', '30', small(u)], { maxBuffer: 32 * 1024 * 1024 });

async function measure(buf) {
  const img = sharp(buf).ensureAlpha();
  const { data, info } = await img.clone().resize(160, 160, { fit: 'inside' }).raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  let minX = w, minY = h, maxX = -1, maxY = -1, op = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (data[(y * w + x) * 4 + 3] > 128) { op++; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  }
  const bw = Math.max(1, maxX - minX + 1), bh = Math.max(1, maxY - minY + 1);
  const fill = op / (bw * bh);
  const aspect = bw / bh;
  // dHash sur l'objet aplati sur blanc
  const g = await sharp(buf).flatten({ background: '#ffffff' }).trim({ threshold: 5 }).resize(9, 8, { fit: 'fill' }).grayscale().raw().toBuffer().catch(async () =>
    sharp(buf).flatten({ background: '#ffffff' }).resize(9, 8, { fit: 'fill' }).grayscale().raw().toBuffer());
  let hash = 0n;
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { hash <<= 1n; if (g[y * 9 + x] > g[y * 9 + x + 1]) hash |= 1n; }
  return { fill: +fill.toFixed(3), aspect: +aspect.toFixed(2), hash };
}
const ham = (a, b) => { let x = a ^ b, n = 0; while (x) { n += Number(x & 1n); x >>= 1n; } return n; };
// Gros plan probable : la silhouette d'une trottinette entière est clairsemée (fill < ~0.33) et de rapport 0.55–1.6.
const isClose = (m) => m.fill > 0.42 || m.aspect > 2.2 || m.aspect < 0.35;

const report = [];
const pairTiles = [], rowImgs = [];
async function tile(buf, label, color) {
  const W = 180, H = 200;
  const im = buf ? await sharp(buf).resize(170, 162, { fit: 'inside' }).png().toBuffer() : null;
  const meta = im ? await sharp(im).metadata() : null;
  const esc = (s) => String(s).replace(/[&<>"]/g, '');
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#9e9e9e"/><rect width="${W}" height="${H}" fill="none" stroke="${color}" stroke-width="5"/><rect y="${H - 34}" width="${W}" height="34" fill="#fff"/><text x="5" y="${H - 20}" font-family="DejaVu Sans" font-size="11" font-weight="bold">${esc(label[0])}</text><text x="5" y="${H - 6}" font-family="DejaVu Sans" font-size="10" fill="${color}">${esc(label[1])}</text></svg>`);
  const comp = [{ input: svg, top: 0, left: 0 }];
  if (im) comp.push({ input: im, top: 2 + Math.round((162 - meta.height) / 2), left: Math.round((W - meta.width) / 2) });
  return sharp({ create: { width: W, height: H, channels: 3, background: '#9e9e9e' } }).composite(comp).jpeg({ quality: 78 }).toBuffer();
}

for (const m of lot.models) {
  const items = [];
  for (let i = 0; i < m.urls.length; i++) {
    try { const buf = get(m.urls[i]); const me = await measure(buf); items.push({ i, buf, ...me }); }
    catch (e) { items.push({ i, buf: null, error: e.message.slice(0, 80) }); }
  }
  // doublons
  for (const it of items) {
    if (it.hash === undefined) continue;
    const prev = items.find((p) => p.i < it.i && p.hash !== undefined && !p.dupOf && ham(p.hash, it.hash) <= 8);
    if (prev) it.dupOf = prev.i;
  }
  const p0 = items[0];
  const cands = items.filter((it) => it.i > 0 && it.hash !== undefined && it.dupOf === undefined && (p0.hash === undefined || ham(p0.hash, it.hash) > 8));
  const close = cands.filter(isClose);
  const hover = close[0] ?? [...cands].sort((a, b) => ham(p0.hash, b.hash) - ham(p0.hash, a.hash))[0];
  const rec = {
    id: m.id, slug: m.slug, n: m.urls.length,
    hover: hover ? hover.i : null, hoverKind: hover ? (isClose(hover) ? 'gros plan' : 'autre vue') : 'aucune',
    dups: items.filter((it) => it.dupOf !== undefined).map((it) => [it.i, it.dupOf]),
    items: items.map((it) => ({ i: it.i, fill: it.fill, aspect: it.aspect, close: it.hash !== undefined ? isClose(it) : null, dupOf: it.dupOf ?? null, d0: it.hash !== undefined && p0.hash !== undefined ? ham(p0.hash, it.hash) : null, error: it.error ?? null })),
  };
  report.push(rec);
  console.log(`${m.slug} n=${rec.n} 2e=${rec.hover} (${rec.hoverKind}) doublons=${JSON.stringify(rec.dups)}`);
  pairTiles.push(await tile(p0.buf, [`${m.slug.slice(0, 22)}`, `#0 principale${isClose(p0) ? ' GROS PLAN?' : ''}`], isClose(p0) ? '#c62828' : '#2e7d32'));
  pairTiles.push(await tile(hover?.buf ?? null, [`${m.slug.slice(0, 22)}`, hover ? `#${hover.i} ${rec.hoverKind}` : 'AUCUNE 2e'], hover && rec.hoverKind === 'gros plan' ? '#1565c0' : '#c79100'));
  rowImgs.push({ slug: m.slug, tiles: await Promise.all(items.map((it) => tile(it.buf, [`${m.slug.slice(0, 18)} #${it.i}`, it.dupOf !== undefined ? `DOUBLON de #${it.dupOf}` : `${isClose(it) ? 'gros plan' : 'vue'} f${it.fill} a${it.aspect}`], it.dupOf !== undefined ? '#c62828' : it.i === 0 ? '#2e7d32' : it.i === rec.hover ? '#1565c0' : '#777'))) });
}
writeFileSync(resolve(OUT, 'report.json'), JSON.stringify(report, null, 1));

// planches de paires : 4 modèles (8 vignettes) par ligne, 8 lignes
const W = 180, H = 200;
for (let p = 0; p * 64 < pairTiles.length; p++) {
  const part = pairTiles.slice(p * 64, (p + 1) * 64);
  const rows = Math.ceil(part.length / 8);
  const comp = part.map((t, i) => ({ input: t, left: (i % 8) * W + Math.floor((i % 8) / 2) * 12, top: Math.floor(i / 8) * H }));
  await sharp({ create: { width: 8 * W + 36, height: rows * H, channels: 3, background: '#ffffff' } }).composite(comp).jpeg({ quality: 78 }).toFile(resolve(OUT, `paires-${p + 1}.jpg`));
}
// planches de lignes : 1 modèle par ligne, 8 vignettes max, 10 modèles par planche
for (let p = 0; p * 10 < rowImgs.length; p++) {
  const part = rowImgs.slice(p * 10, (p + 1) * 10);
  const comp = [];
  part.forEach((r, y) => r.tiles.slice(0, 8).forEach((t, x) => comp.push({ input: t, left: x * W, top: y * H })));
  await sharp({ create: { width: 8 * W, height: part.length * H, channels: 3, background: '#ffffff' } }).composite(comp).jpeg({ quality: 75 }).toFile(resolve(OUT, `lignes-${p + 1}.jpg`));
}
const c = (k) => report.filter(k).length;
console.log(`::notice title=audit ${lot.lot}::${report.length} modèles · 2e = gros plan ${c((r) => r.hoverKind === 'gros plan')} · autre vue ${c((r) => r.hoverKind === 'autre vue')} · aucune ${c((r) => r.hoverKind === 'aucune')} · galeries avec doublons ${c((r) => r.dups.length)}`);
