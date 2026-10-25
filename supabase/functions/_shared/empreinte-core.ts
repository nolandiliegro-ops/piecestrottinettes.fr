// supabase/functions/_shared/empreinte-core.ts — garde-fou anti-doublon photo (25/10/2026).
// CŒUR PUR, sans aucune dépendance : il reçoit des pixels RGBA déjà décodés et rend une empreinte.
// Le MÊME fichier est utilisé par l'Edge Function process-images (Deno) et par la calibration (Node,
// scripts/garde-doublons-core.mjs) : les seuils calibrés valent donc pour le code en production.
//
// Règle de Nolan : JAMAIS deux fois la même photo sur une fiche. Les variantes de COULEUR sont gardées.
// Trois mesures, calculées sur le produit seul (cadre recadré sur les pixels opaques) :
//   - dHash 64 bits (gris 9x8, fond aplati en blanc) : même image, même recadrée / recompressée ;
//   - silhouette 48x48 (alpha) : même cliché à un autre cadrage. PAS de miroir (face ≠ arrière) ;
//   - histogramme couleur (12 teintes saturées + 4 luminosités) : deux coloris ne sont jamais un doublon.

export interface Pixels { width: number; height: number; data: Uint8Array | Uint8ClampedArray } // RGBA 8 bits
export interface Empreinte { hash: bigint; mask: Uint8Array | null; hist: Float64Array | null; opaque: number }

const N = 48;

// Recadrage sur les pixels du produit (alpha > 16). Image sans transparence = toute l'image.
function boite(p: Pixels) {
  const { width: w, height: h, data } = p;
  let x0 = w, y0 = h, x1 = -1, y1 = -1, opaque = 0;
  const pas = Math.max(1, Math.floor(Math.max(w, h) / 600)); // sous-échantillonnage des très grandes images
  for (let y = 0; y < h; y += pas) for (let x = 0; x < w; x += pas) {
    if (data[(y * w + x) * 4 + 3] > 16) { opaque++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0) return null;
  return { x0, y0, x1: Math.min(w - 1, x1 + pas - 1), y1: Math.min(h - 1, y1 + pas - 1), opaque };
}

// moyenne d'une zone [ax,bx[ x [ay,by[ (au moins 1 pixel), avec un pas pour borner le coût
function zone(p: Pixels, ax: number, ay: number, bx: number, by: number) {
  const { width: w, data } = p;
  bx = Math.max(bx, ax + 1); by = Math.max(by, ay + 1);
  const pas = Math.max(1, Math.floor(Math.min(bx - ax, by - ay) / 8));
  let r = 0, g = 0, b = 0, a = 0, n = 0, opq = 0;
  for (let y = ay; y < by; y += pas) for (let x = ax; x < bx; x += pas) {
    const k = (y * w + x) * 4, al = data[k + 3] / 255;
    // fond aplati en blanc (comme flatten({background:'#fff'}))
    r += data[k] * al + 255 * (1 - al); g += data[k + 1] * al + 255 * (1 - al); b += data[k + 2] * al + 255 * (1 - al);
    a += data[k + 3]; n++; if (data[k + 3] > 128) opq++;
  }
  return { r: r / n, g: g / n, b: b / n, a: a / n, plein: opq / n };
}

export function empreinte(p: Pixels): Empreinte {
  const bx = boite(p);
  const hist = new Float64Array(16);
  if (!bx) return { hash: 0n, mask: null, hist: null, opaque: 0 };
  const { x0, y0, x1, y1 } = bx;
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
  const transparent = bx.opaque * Math.max(1, Math.floor(Math.max(p.width, p.height) / 600)) ** 2 < p.width * p.height * 0.97;

  // dHash 9x8 sur la boîte, gris (luma Rec.601) du fond aplati en blanc
  const gris: number[] = [];
  for (let j = 0; j < 8; j++) for (let i = 0; i < 9; i++) {
    const z = zone(p, x0 + Math.floor((i * bw) / 9), y0 + Math.floor((j * bh) / 8), x0 + Math.floor(((i + 1) * bw) / 9), y0 + Math.floor(((j + 1) * bh) / 8));
    gris.push(0.299 * z.r + 0.587 * z.g + 0.114 * z.b);
  }
  let hash = 0n;
  for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { hash <<= 1n; if (gris[j * 9 + i] > gris[j * 9 + i + 1]) hash |= 1n; }

  // silhouette 48x48 sur le carré centré sur la boîte
  let mask: Uint8Array | null = null;
  if (transparent) {
    const side = Math.max(bw, bh), ox = x0 - Math.floor((side - bw) / 2), oy = y0 - Math.floor((side - bh) / 2);
    mask = new Uint8Array(N * N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const ax = ox + Math.floor((i * side) / N), ay = oy + Math.floor((j * side) / N);
      const ex = ox + Math.floor(((i + 1) * side) / N), ey = oy + Math.floor(((j + 1) * side) / N);
      const cx0 = Math.max(0, ax), cy0 = Math.max(0, ay), cx1 = Math.min(p.width, ex), cy1 = Math.min(p.height, ey);
      if (cx1 <= cx0 || cy1 <= cy0) continue;
      const z = zone(p, cx0, cy0, cx1, cy1);
      const frac = z.plein * ((cx1 - cx0) * (cy1 - cy0)) / Math.max(1, (ex - ax) * (ey - ay));
      mask[j * N + i] = frac >= 0.35 ? 1 : 0;
    }
  }

  // histogramme couleur sur les pixels opaques de la boîte (grille ~96x96)
  const pas = Math.max(1, Math.floor(Math.max(bw, bh) / 96));
  let tot = 0;
  for (let y = y0; y <= y1; y += pas) for (let x = x0; x <= x1; x += pas) {
    const k = (y * p.width + x) * 4;
    if (p.data[k + 3] < 128) continue;
    const r = p.data[k] / 255, g = p.data[k + 1] / 255, b = p.data[k + 2] / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx ? (mx - mn) / mx : 0;
    tot++;
    hist[12 + Math.min(3, Math.floor(mx * 4))] += 1;
    if (sat > 0.3 && mx > 0.2) {
      const d = mx - mn; let h: number;
      if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
      h = (h * 60 + 360) % 360;
      hist[Math.floor(h / 30) % 12] += 1;
    }
  }
  if (tot) for (let k = 0; k < 16; k++) hist[k] /= tot;
  return { hash, mask, hist: tot ? hist : null, opaque: tot };
}

export const ham = (a: bigint, b: bigint) => { let x = a ^ b, n = 0; while (x) { n += Number(x & 1n); x >>= 1n; } return n; };
export function iou(a: Uint8Array | null, b: Uint8Array | null) {
  if (!a || !b) return null;
  let inter = 0, uni = 0;
  for (let k = 0; k < N * N; k++) if (a[k] || b[k]) { uni++; if (a[k] && b[k]) inter++; }
  return uni ? inter / uni : 0;
}
export function ecartCouleur(a: Float64Array | null, b: Float64Array | null) {
  if (!a || !b) return null;
  let s = 0; for (let k = 0; k < 16; k++) s += Math.abs(a[k] - b[k]);
  return s * 100;
}

// Seuils : voir out/doublons-core/calib.json (calibration du 25/10 sur ce cœur exact).
export const SEUILS = { dhash: 6, iou: 0.95, dhashAvecIou: 10, couleur: 8 };

export function memePhoto(a: Empreinte, b: Empreinte, s = SEUILS) {
  const d = ham(a.hash, b.hash), io = iou(a.mask, b.mask), c = ecartCouleur(a.hist, b.hist);
  if (!a.opaque || !b.opaque) return { doublon: false, d, io, c, raison: 'photo vide' };
  if (c !== null && c > s.couleur) return { doublon: false, d, io, c };
  if (d <= s.dhash) return { doublon: true, d, io, c, raison: `même image (dHash ${d}, couleur ${c?.toFixed(1)})` };
  if (io !== null && io >= s.iou && d <= s.dhashAvecIou) return { doublon: true, d, io, c, raison: `même cliché recadré (silhouette ${io.toFixed(3)}, dHash ${d})` };
  return { doublon: false, d, io, c };
}

// ===== stockage (table public.photo_empreintes) =====
export interface EmpreinteStockee { hash: string; hist: number[] | null; mask: string | null; opaque: number }
export function versStockage(e: Empreinte): EmpreinteStockee {
  let mask: string | null = null;
  if (e.mask) {
    const bytes = new Uint8Array(Math.ceil((N * N) / 8));
    for (let k = 0; k < N * N; k++) if (e.mask[k]) bytes[k >> 3] |= 1 << (k & 7);
    mask = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return { hash: e.hash.toString(16).padStart(16, '0'), hist: e.hist ? Array.from(e.hist) : null, mask, opaque: e.opaque };
}
export function depuisStockage(s: EmpreinteStockee): Empreinte {
  let mask: Uint8Array | null = null;
  if (s.mask) {
    mask = new Uint8Array(N * N);
    for (let k = 0; k < N * N; k++) { const byte = parseInt(s.mask.substr((k >> 3) * 2, 2), 16); mask[k] = (byte >> (k & 7)) & 1; }
  }
  return { hash: BigInt('0x' + s.hash), mask, hist: s.hist ? Float64Array.from(s.hist) : null, opaque: s.opaque };
}
