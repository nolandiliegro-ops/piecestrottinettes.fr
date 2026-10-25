// scripts/lib/empreinte.mjs — empreinte visuelle d'une photo produit (garde-fou anti-doublon, 25/10/2026).
// Règle de Nolan : JAMAIS deux fois la même photo sur une fiche (copie ré-uploadée, recadrage, même cliché).
// Deux mesures complémentaires :
//   - dHash 64 bits (8x8 sur gris, fond aplati en blanc) : même image, même recadrée ou recompressée ;
//   - silhouette 48x48 (alpha) : même cliché à un autre cadrage. Le MIROIR n'est PAS utilisé ici :
//     une vue de face et une vue arrière ont des silhouettes miroirs, ce sont deux angles légitimes.
// Le même angle pris sous un autre cliché (3/4 de l'autre côté) reste l'affaire du tri vision.
import sharp from 'sharp';

const N = 48;

export async function empreinte(buf) {
  const { data, info } = await sharp(buf, { failOn: 'none' }).ensureAlpha().resize(240, 240, { fit: 'inside' }).raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  let x0 = w, y0 = h, x1 = -1, y1 = -1, opaque = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (data[(y * w + x) * 4 + 3] > 128) { opaque++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  let mask = null;
  if (x1 >= 0 && opaque < w * h * 0.97) {
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, side = Math.max(bw, bh);
    const ox = x0 - Math.floor((side - bw) / 2), oy = y0 - Math.floor((side - bh) / 2);
    mask = new Uint8Array(N * N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
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
  // signature couleur : histogramme des TEINTES (12 cases, pixels saturés) + des LUMINOSITÉS (4 cases) calculé sur les
  // seuls pixels du produit (alpha), en proportion. Deux coloris d'une même trottinette ont le même dHash gris et la même
  // silhouette, mais pas cet histogramme — Nolan garde les variantes de couleur (24/10), le garde-fou ne doit pas les bloquer.
  const { data: px, info: pi } = await sharp(buf, { failOn: 'none' }).ensureAlpha().resize(96, 96, { fit: 'inside' }).raw().toBuffer({ resolveWithObject: true });
  const rgb = new Float64Array(16); let tot = 0;
  for (let k = 0; k < pi.width * pi.height; k++) {
    const r = px[4 * k] / 255, gg = px[4 * k + 1] / 255, b = px[4 * k + 2] / 255, a = px[4 * k + 3];
    if (a < 128) continue;
    const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), v = mx, sat = mx ? (mx - mn) / mx : 0;
    tot++;
    rgb[12 + Math.min(3, Math.floor(v * 4))] += 1;
    if (sat > 0.3 && v > 0.2) {
      let h = 0; const dlt = mx - mn;
      if (mx === r) h = ((gg - b) / dlt) % 6; else if (mx === gg) h = (b - r) / dlt + 2; else h = (r - gg) / dlt + 4;
      h = (h * 60 + 360) % 360;
      rgb[Math.floor(h / 30) % 12] += 1;
    }
  }
  if (tot) for (let k = 0; k < 16; k++) rgb[k] /= tot;
  return { hash, mask, rgb: tot ? rgb : null };
}

// écart de couleur (0-200) : distance L1 des histogrammes ×100. Même photo ≈ 0-3 ; autre coloris = grand écart.
export function ecartCouleur(a, b) {
  if (!a || !b) return null;
  let s = 0; for (let k = 0; k < 16; k++) s += Math.abs(a[k] - b[k]);
  return s * 100;
}

export const ham = (a, b) => { let x = a ^ b, n = 0; while (x) { n += Number(x & 1n); x >>= 1n; } return n; };

export function iou(a, b) {
  if (!a || !b) return null;
  let inter = 0, uni = 0;
  for (let k = 0; k < N * N; k++) { if (a[k] || b[k]) { uni++; if (a[k] && b[k]) inter++; } }
  return uni ? inter / uni : 0;
}

// Seuils calibrés le 25/10/2026 sur les galeries publiées validées par vision (voir scripts/garde-doublons.mjs --calibrer).
export const SEUILS = { dhash: Number(process.env.DOUBLON_DHASH ?? 6), iou: Number(process.env.DOUBLON_IOU ?? 0.97), dhashAvecIou: Number(process.env.DOUBLON_DHASH_IOU ?? 12), couleur: Number(process.env.DOUBLON_COULEUR ?? 8) };

// Vrai si `a` et `b` sont la même photo (copie, recadrage, recompression).
export function memePhoto(a, b, s = SEUILS) {
  const d = ham(a.hash, b.hash);
  const io = iou(a.mask, b.mask);
  const c = ecartCouleur(a.rgb, b.rgb);
  if (c !== null && c > s.couleur) return { doublon: false, d, io, c }; // autre coloris : jamais un doublon
  if (d <= s.dhash) return { doublon: true, d, io, c, raison: `même image (dHash ${d}, couleur ${c?.toFixed(1)})` };
  if (io !== null && io >= s.iou && d <= s.dhashAvecIou) return { doublon: true, d, io, c, raison: `même cliché recadré (silhouette ${io.toFixed(3)}, dHash ${d}, couleur ${c?.toFixed(1)})` };
  return { doublon: false, d, io, c };
}
