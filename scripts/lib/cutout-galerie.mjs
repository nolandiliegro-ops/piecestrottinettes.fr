// scripts/lib/cutout-galerie.mjs — téléchargement + détourage d'une photo candidate, À L'IDENTIQUE de
// scripts/photos-galerie.mjs (copie du 25/10/2026 pour la calibration de l'anti-doublon : la mesure doit voir
// exactement l'image que l'envoi verrait). Toute modification ici doit être reportée là-bas, et inversement.
import { execFileSync } from 'child_process';
import sharp from 'sharp';
import { detoure } from './detoure.js';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const CLOSEUP_OK = new Set(['produit coupé / gros plan', 'cadrage serré']);

export function download(url) {
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

export async function cutout(url) {
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

