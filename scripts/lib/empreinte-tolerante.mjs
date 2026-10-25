// scripts/lib/empreinte-tolerante.mjs — empreintes tolérantes au RE-DÉTOURAGE (25/10/2026).
// Une même photo détourée deux fois (source différente, bords, ombre, marges) garde le même contenu sur la boîte du
// produit : pHash du gris étiré sur la boîte, silhouette étirée, corrélation des gris. Calibré par
// scripts/calib-doublon-chasse.mjs (vérité terrain config/photos/calib-chasse-verite.json).
import sharp from 'sharp';
import { empreinte as coreFp, ham as coreHam, iou as coreIou, ecartCouleur as coreC } from '../../supabase/functions/_shared/empreinte-core.ts';
import { empreinte as libFp, ham as libHam, iou as libIou, ecartCouleur as libC } from './empreinte.mjs';

// ─── mesures tolérantes ───
function dct32(m) { // m : 32x32 → coefficients 8x8 basses fréquences
  const N = 32, out = [];
  const c = (k) => (k === 0 ? Math.SQRT1_2 : 1);
  for (let u = 0; u < 8; u++) for (let v = 0; v < 8; v++) {
    let s = 0;
    for (let x = 0; x < N; x++) { const cx = Math.cos(((2 * x + 1) * u * Math.PI) / (2 * N)); for (let y = 0; y < N; y++) s += m[y * N + x] * cx * Math.cos(((2 * y + 1) * v * Math.PI) / (2 * N)); }
    out.push(c(u) * c(v) * s);
  }
  return out;
}
const bitsMed = (arr) => { const a = arr.slice(1); const med = [...a].sort((x, y) => x - y)[a.length >> 1]; return a.map((x) => (x > med ? 1 : 0)); };
export async function feats(buf) {
  const im = sharp(buf, { failOn: 'none' }).ensureAlpha();
  const { data, info } = await im.clone().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  const pas = Math.max(1, Math.floor(Math.max(w, h) / 800));
  for (let y = 0; y < h; y += pas) for (let x = 0; x < w; x += pas) if (data[(y * w + x) * 4 + 3] > 16) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return null;
  x1 = Math.min(w - 1, x1 + pas - 1); y1 = Math.min(h - 1, y1 + pas - 1);
  const box = { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
  const crop = await sharp(buf, { failOn: 'none' }).ensureAlpha().extract(box).png().toBuffer();
  const gris = async (W, H, fit) => [...(await sharp(crop).flatten({ background: '#ffffff' }).grayscale().resize(W, H, { fit, background: '#ffffff' }).raw().toBuffer())];
  const ph = bitsMed(dct32(await gris(32, 32, 'fill')));
  const phSq = bitsMed(dct32(await gris(32, 32, 'contain')));
  const a32 = await sharp(crop).extractChannel('alpha').resize(32, 32, { fit: 'fill' }).raw().toBuffer();
  const mfill = [...a32].map((v) => (v > 128 ? 1 : 0));
  const g16 = await gris(16, 16, 'fill');
  const mu = g16.reduce((s, v) => s + v, 0) / g16.length, sd = Math.sqrt(g16.reduce((s, v) => s + (v - mu) ** 2, 0) / g16.length) || 1;
  // 25/10 (calibration 1) : la couleur globale (histogramme) bouge de 10 à 46 points quand la MÊME photo est re-détourée
  // (halo, morceau perdu) — autant qu'entre deux coloris. Grille 12x12 de couleurs Lab sur la boîte étirée : comparée case
  // par case, la médiane ignore les bords abîmés mais voit un deck ou une tige d'une autre couleur.
  const lab = await sharp(crop).resize(12, 12, { fit: 'fill' }).raw().toBuffer();
  const grille = [];
  for (let k = 0; k < 144; k++) { const a = lab[4 * k + 3]; grille.push(a > 96 ? rgb2lab(lab[4 * k], lab[4 * k + 1], lab[4 * k + 2]) : null); }
  const { data: px, info: pi } = await sharp(buf, { failOn: 'none' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const core = coreFp({ width: pi.width, height: pi.height, data: px });
  const vign = await sharp(crop).resize(320, 320, { fit: 'inside' }).png().toBuffer();
  const lib = await libFp(vign);
  return { grille, ph, phSq, mfill, aspect: box.width / box.height, g: g16.map((v) => (v - mu) / sd), core, lib, thumb: await sharp(crop).resize(96, 96, { fit: 'contain', background: '#9e9e9e' }).flatten({ background: '#9e9e9e' }).jpeg({ quality: 70 }).toBuffer() };
}
const hamA = (a, b) => a.reduce((s, v, k) => s + (v !== b[k] ? 1 : 0), 0);
const iouA = (a, b) => { let i = 0, u = 0; for (let k = 0; k < a.length; k++) if (a[k] || b[k]) { u++; if (a[k] && b[k]) i++; } return u ? i / u : 0; };
const corr = (a, b) => a.reduce((s, v, k) => s + v * b[k], 0) / a.length;
function rgb2lab(r, g, b) {
  const f = (c) => { c /= 255; return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92; };
  const R = f(r), G = f(g), B = f(b);
  const X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047, Y = R * 0.2126 + G * 0.7152 + B * 0.0722, Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const h = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * h(Y) - 16, 500 * (h(X) - h(Y)), 200 * (h(Y) - h(Z))];
}
const quant = (arr, q) => { if (!arr.length) return null; const s = [...arr].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };
export function couleurGrille(A, B) {
  const dab = [], dl = [];
  for (let k = 0; k < 144; k++) { const a = A.grille[k], b = B.grille[k]; if (!a || !b) continue; dab.push(Math.hypot(a[1] - b[1], a[2] - b[2])); dl.push(Math.abs(a[0] - b[0])); }
  return { n: dab.length, ab50: quant(dab, 0.5), ab75: quant(dab, 0.75), ab90: quant(dab, 0.9), l50: quant(dl, 0.5), l75: quant(dl, 0.75) };
}
export function mesures(A, B) {
  const g = couleurGrille(A, B);
  return { gn: g.n, ab50: g.ab50 === null ? null : +g.ab50.toFixed(1), ab75: g.ab75 === null ? null : +g.ab75.toFixed(1), ab90: g.ab90 === null ? null : +g.ab90.toFixed(1), l50: g.l50 === null ? null : +g.l50.toFixed(1), l75: g.l75 === null ? null : +g.l75.toFixed(1),
    ph: hamA(A.ph, B.ph), phSq: hamA(A.phSq, B.phSq), mf: +iouA(A.mfill, B.mfill).toFixed(3),
    asp: +Math.abs(Math.log(A.aspect / B.aspect)).toFixed(3), cor: +corr(A.g, B.g).toFixed(3),
    cd: coreHam(A.core.hash, B.core.hash), cio: coreIou(A.core.mask, B.core.mask), cc: coreC(A.core.hist, B.core.hist),
    ld: libHam(A.lib.hash, B.lib.hash), lio: libIou(A.lib.mask, B.lib.mask), lc: libC(A.lib.rgb, B.lib.rgb),
  };
}

