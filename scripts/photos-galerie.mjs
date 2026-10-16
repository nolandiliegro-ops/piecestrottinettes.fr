#!/usr/bin/env node
/**
 * scripts/photos-galerie.mjs — galeries de 3+ photos détourées, avec garde-fou (16/10/2026).
 *
 * Entrée : config/photos/<lot>.json
 *   { "lot": "lot01", "models": [ { "id", "slug", "name", "brand", "candidates": [url, ...] } ] }
 *
 * --dry  : télécharge + détoure + contrôle chaque candidate, écrit
 *          out/<lot>/report.json et des planches JPEG (out/<lot>/planche-N.jpg). AUCUNE écriture.
 * --write --accept config/photos/<lot>.accept.json
 *          { "<slug>": [indexCandidate, ...] } dans l'ordre voulu (1er = photo principale).
 *          Rejoue détourage + contrôle : une photo qui ne passe plus est REFUSÉE (garde-fou),
 *          puis process-images reset (1re) + append (suivantes). Relit la base à la fin.
 *
 * Garde-fou (photoQcAll) : photo principale = aucun FAIL ; photos 2+ = gros plan toléré
 * (« produit coupé », « cadrage serré »), tout autre FAIL refusé (élément en plus, détourage sale…).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import sharp from 'sharp';
import { detoure } from './lib/detoure.js';
import { photoQcAll } from './lib/photo-qc.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const args = process.argv.slice(2);
const arg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const MODE = args.includes('--write') ? 'write' : 'dry';
const APPEND = args.includes('--append'); // 17/10 : ajoute aux galeries existantes, jamais de remise à zéro
const LOT_FILE = resolve(ROOT, arg('--file') || '');
const lot = JSON.parse(readFileSync(LOT_FILE, 'utf-8'));
const OUT = resolve(ROOT, 'out', lot.lot);
mkdirSync(OUT, { recursive: true });

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const CLOSEUP_OK = new Set(['produit coupé / gros plan', 'cadrage serré']);

function download(url) {
  const buf = execFileSync('curl', ['-s', '-L', '--max-time', '40', '-A', UA, '-H', 'Accept: image/webp,image/jpeg,image/png,image/*;q=0.8,*/*;q=0.5', url], { maxBuffer: 64 * 1024 * 1024 });
  if (!buf || buf.length < 2000) throw new Error('téléchargement vide');
  return buf;
}

// Source déjà détourée proprement (coins transparents) : on la garde telle quelle.
async function alreadyCut(buf) {
  const meta = await sharp(buf).metadata();
  if (!meta.hasAlpha) return false;
  const { data, info } = await sharp(buf).resize(64, 64, { fit: 'fill' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const a = (x, y) => data[(y * info.width + x) * 4 + 3];
  let t = 0;
  for (const [x, y] of [[0, 0], [63, 0], [0, 63], [63, 63], [32, 0], [0, 32], [63, 32], [32, 63]]) if (a(x, y) < 10) t++;
  return t >= 7;
}

async function cutout(url) {
  const raw = download(url);
  let png;
  if (await alreadyCut(raw)) png = await sharp(raw).png().toBuffer();
  else {
    const meta = await sharp(raw).metadata();
    const src = meta.hasAlpha ? await sharp(raw).flatten({ background: '#ffffff' }).png().toBuffer() : raw;
    const type = meta.format === 'png' || meta.hasAlpha ? 'image/png' : meta.format === 'webp' ? 'image/webp' : 'image/jpeg';
    png = await detoure(new Blob([src], { type }));
  }
  // recadrage sur le produit + marge 4 %, max 1600 px
  const trimmed = await sharp(png).trim({ threshold: 1 }).toBuffer().catch(() => png);
  const m = await sharp(trimmed).metadata();
  const pad = Math.round(Math.max(m.width, m.height) * 0.04);
  return sharp(trimmed).extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).png().toBuffer();
}

function judge(qc, position) {
  if (qc.verdict !== 'FAIL') return { ok: true, why: qc.reasons };
  if (position === 0) return { ok: false, why: qc.reasons };
  const hard = qc.reasons.filter((r) => !CLOSEUP_OK.has(r) && !r.startsWith('petit élément') && !r.startsWith('couleurs') && !r.startsWith('basse') && !r.startsWith('produit minuscule'));
  return { ok: hard.length === 0 && qc.plus.verdict !== 'FAIL', why: qc.reasons };
}

// ─── planche : vignettes 220 px sur gris moyen (un résidu blanc ou un logo s'y voit) ───
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
async function tile(png, label, verdict) {
  const W = 220, H = 250;
  const color = verdict === 'PASS' ? '#2e7d32' : verdict === 'WARN' ? '#c79100' : '#c62828';
  const img = png ? await sharp(png).resize(208, 200, { fit: 'inside' }).png().toBuffer() : null;
  const meta = img ? await sharp(img).metadata() : null;
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="#9e9e9e"/><rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="${color}" stroke-width="6"/>
    <rect x="0" y="${H - 44}" width="${W}" height="44" fill="#ffffff"/>
    <text x="6" y="${H - 27}" font-family="DejaVu Sans" font-size="13" font-weight="bold" fill="#000">${esc(label[0])}</text>
    <text x="6" y="${H - 9}" font-family="DejaVu Sans" font-size="11" fill="${color}">${esc(label[1])}</text></svg>`);
  const comp = [{ input: svg, top: 0, left: 0 }];
  if (img) comp.push({ input: img, top: 4 + Math.round((200 - meta.height) / 2), left: Math.round((W - meta.width) / 2) });
  return sharp({ create: { width: W, height: H, channels: 3, background: '#9e9e9e' } }).composite(comp).jpeg({ quality: 82 }).toBuffer();
}
async function planches(tiles) {
  const COLS = 8, ROWS = 6, W = 220, H = 250, per = COLS * ROWS;
  for (let p = 0; p * per < tiles.length; p++) {
    const part = tiles.slice(p * per, (p + 1) * per);
    const rows = Math.ceil(part.length / COLS);
    const comp = part.map((t, i) => ({ input: t, left: (i % COLS) * W, top: Math.floor(i / COLS) * H }));
    await sharp({ create: { width: COLS * W, height: rows * H, channels: 3, background: '#ffffff' } }).composite(comp).jpeg({ quality: 80 }).toFile(resolve(OUT, `planche-${p + 1}.jpg`));
  }
}

async function dry() {
  const report = [];
  const tiles = [];
  for (const m of lot.models) {
    for (let i = 0; i < (m.candidates || []).length; i++) {
      const url = m.candidates[i];
      let png = null, qc = null, err = null;
      try { png = await cutout(url); qc = await photoQcAll(png); } catch (e) { err = e.message.slice(0, 120); }
      const verdict = err ? 'ERROR' : qc.verdict;
      const short = err ? err : (qc.reasons.join(' · ') || 'ok');
      console.log(`${m.slug} #${i} ${verdict} ${short}`);
      report.push({ slug: m.slug, i, url, verdict, reasons: qc?.reasons || [], plus: qc?.plus || null, size: qc ? [qc.width, qc.height] : null, error: err });
      tiles.push(await tile(png, [`${m.slug.slice(0, 26)} #${i}`, `${verdict} ${short}`.slice(0, 34)], err ? 'FAIL' : verdict));
    }
  }
  writeFileSync(resolve(OUT, 'report.json'), JSON.stringify(report, null, 1));
  await planches(tiles);
  const c = (v) => report.filter((r) => r.verdict === v).length;
  console.log(`::notice title=photos ${lot.lot} (dry)::${report.length} candidates · PASS ${c('PASS')} · WARN ${c('WARN')} · FAIL ${c('FAIL')} · ERREUR ${c('ERROR')}`);
}

async function write() {
  const accept = JSON.parse(readFileSync(resolve(ROOT, arg('--accept')), 'utf-8'));
  const env = Object.fromEntries(readFileSync(resolve(ROOT, '.env'), 'utf-8').split('\n').map((l) => l.match(/^([A-Z_]+)=["']?([^"'\r\n]*)/)).filter(Boolean).map((m) => [m[1], m[2]]));
  const URL_ = `${env.VITE_SUPABASE_URL}/functions/v1/process-images`;
  const out = [];
  for (const m of lot.models) {
    const picks = accept[m.slug];
    if (!Array.isArray(picks) || picks.length === 0) continue;
    const bufs = [];
    for (const idx of picks) {
      const url = m.candidates[idx];
      try {
        const png = await cutout(url);
        const qc = await photoQcAll(png);
        const j = judge(qc, APPEND ? 1 : bufs.length);
        if (!j.ok) { console.log(`::warning title=REFUSÉ ${m.slug} #${idx}::${j.why.join(' · ')}`); continue; }
        bufs.push(png);
      } catch (e) { console.log(`::warning title=ERREUR ${m.slug} #${idx}::${e.message.slice(0, 120)}`); }
    }
    if (bufs.length === 0) { out.push({ slug: m.slug, posted: 0, note: 'aucune photo validée, galerie intacte' }); continue; }
    let posted = 0;
    for (let k = 0; k < bufs.length; k++) {
      const res = await fetch(URL_, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': env.ADMIN_BULK_SECRET },
        body: JSON.stringify({ entity_type: 'scooter', entity_id: m.id, images_base64: [bufs[k].toString('base64')], alt_base: m.name, reset: !APPEND && k === 0 }),
      });
      const t = await res.text();
      if (res.ok && /"success"\s*:\s*true/.test(t)) posted++;
      else { console.log(`::warning title=POST ${m.slug}::HTTP ${res.status} ${t.slice(0, 120)}`); if (k === 0) break; }
    }
    out.push({ slug: m.slug, posted, wanted: picks.length });
    console.log(`${m.slug} : ${posted}/${picks.length} photo(s) écrite(s)`);
  }
  writeFileSync(resolve(OUT, 'write.json'), JSON.stringify(out, null, 1));
  const tot = out.reduce((a, o) => a + o.posted, 0);
  console.log(`::notice title=photos ${lot.lot} (write)::${out.length} modèles · ${tot} photos écrites · ${out.filter((o) => o.posted < 3).length} modèles à moins de 3`);
}

(MODE === 'write' ? write() : dry()).catch((e) => { console.error(e); process.exit(1); });
