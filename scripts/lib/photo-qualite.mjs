// scripts/lib/photo-qualite.mjs — QUALITÉ DU DÉTOURAGE d'une photo de trottinette (26/10/2026).
// Règle de Nolan (25/10, soir) : « je veux que toutes les trottinettes soient belles ; elles ne peuvent pas être mises en
// ligne si elles sont mal détourées. Trouver la solution et ne plus faire l'erreur. »
// Fait déclencheur : import affiliés du 25/10 — Navee K100 (source 600 px, traînées de pub, trottinette collée au bord)
// passée par photo-qc (seuils rapportés à TOUTE l'image, aveugles à des traînées fines) ET par le juge vision (qui ne
// regarde que le contenu). Le contrôle de détourage existait depuis le 19/10 (audit-detourage.mjs) mais n'était branché
// sur aucun import.
//
// Ce module fait trois choses, sans IA, sans réseau :
//   1. NETTOYER  : efface les fantômes (semi-transparents à > 2 px de la silhouette opaque) et les débris détachés.
//                  La silhouette opaque et son contour lissé ne sont jamais modifiés (même règle que nettoyage-detourage).
//   2. CADRER    : recadre serré sur la trottinette + marge de 4 % du plus grand côté (une toile carrée pleine de vide
//                  fait afficher la trottinette en petit, puis agrandie par le site = escaliers).
//   3. MESURER   : fantômes restants, débris, liseré blanc, trottinette collée au bord (= coupée), taille réelle de la
//                  trottinette en pixels. Verdict : principale possible / galerie seulement / refusée.
//
// Utilisé par trierGalerie (photo-juge.mjs), donc par TOUS les chemins d'écriture de photos de trottinettes.
import sharp from 'sharp';

export const SEUILS = {
  fantome: 0.02,      // part de fantômes (rapportée aux pixels opaques) APRÈS nettoyage — audit 19/10
  ilots: 2,           // débris détachés ≥ 0,05 % de l'image
  lisere: 0.25,       // part du contour presque blanc et opaque
  bord: 0.005,        // part d'une ligne/colonne extrême de la TOILE couverte de pixels opaques = collée au bord
  principalePx: 800,  // plus grand côté de la trottinette, en pixels, pour être photo principale
  galeriePx: 500,     // en dessous : refusée partout (floue sur un téléphone)
  travailPx: 2000,    // les très grandes sources sont ramenées à 2000 px de long avant traitement
  marge: 0.04,        // marge transparente remise autour de la trottinette après recadrage
};

async function raw(buf) {
  const { data, info } = await sharp(buf, { failOn: 'none' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, W: info.width, H: info.height };
}

/** Collée au bord de la toile d'ORIGINE (à mesurer AVANT recadrage). */
function bords(data, W, H) {
  const A = (x, y) => data[(y * W + x) * 4 + 3] > 200;
  const ligne = (y) => { let n = 0; for (let x = 0; x < W; x++) if (A(x, y)) n++; return n / W; };
  const col = (x) => { let n = 0; for (let y = 0; y < H; y++) if (A(x, y)) n++; return n / H; };
  return { haut: ligne(0), bas: ligne(H - 1), gauche: col(0), droite: col(W - 1) };
}

/** Efface fantômes et débris. Renvoie le nombre de pixels effacés. Modifie data en place. */
function nettoyerRaw(data, W, H) {
  const N = W * H;
  const opaque = new Uint8Array(N);
  for (let i = 0; i < N; i++) if (data[i * 4 + 3] > 230) opaque[i] = 1;
  // zone autorisée = opaque dilaté de 2 px
  const pres = new Uint8Array(N); const R = 2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!opaque[y * W + x]) continue;
    for (let dy = -R; dy <= R; dy++) { const yy = y + dy; if (yy < 0 || yy >= H) continue; for (let dx = -R; dx <= R; dx++) { const xx = x + dx; if (xx >= 0 && xx < W) pres[yy * W + xx] = 1; } }
  }
  let efface = 0;
  for (let i = 0; i < N; i++) { const a = data[i * 4 + 3]; if (a > 0 && a <= 230 && !pres[i]) { data[i * 4 + 3] = 0; efface++; } }
  // débris : composantes connexes (alpha ≥ 16) autres que la plus grande, < 0,05 % de l'image
  const plein = new Uint8Array(N); for (let i = 0; i < N; i++) if (data[i * 4 + 3] >= 16) plein[i] = 1;
  const lab = new Int32Array(N).fill(-1); const tailles = [];
  for (let i = 0; i < N; i++) {
    if (!plein[i] || lab[i] >= 0) continue;
    const id = tailles.length; let n = 0; const pile = [i]; lab[i] = id;
    while (pile.length) {
      const p = pile.pop(); n++; const x = p % W, y = (p / W) | 0;
      if (x > 0 && plein[p - 1] && lab[p - 1] < 0) { lab[p - 1] = id; pile.push(p - 1); }
      if (x < W - 1 && plein[p + 1] && lab[p + 1] < 0) { lab[p + 1] = id; pile.push(p + 1); }
      if (y > 0 && plein[p - W] && lab[p - W] < 0) { lab[p - W] = id; pile.push(p - W); }
      if (y < H - 1 && plein[p + W] && lab[p + W] < 0) { lab[p + W] = id; pile.push(p + W); }
    }
    tailles.push(n);
  }
  const grand = tailles.indexOf(Math.max(0, ...tailles));
  const petit = N * 0.0005;
  for (let i = 0; i < N; i++) if (lab[i] >= 0 && lab[i] !== grand && tailles[lab[i]] < petit) { data[i * 4 + 3] = 0; efface++; }
  return efface;
}

/** Boîte de la silhouette (alpha ≥ 16). */
function boite(data, W, H) {
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] >= 16) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return x1 < 0 ? null : { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/** Mesures de propreté, mêmes définitions que scripts/audit-detourage.mjs (sur 400 px). */
export async function mesurerPropre(buf) {
  const { data, info } = await sharp(buf, { failOn: 'none' }).ensureAlpha().resize(400, 400, { fit: 'inside' }).raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H; const A = (i) => data[i * 4 + 3];
  const opaque = new Uint8Array(N); let opq = 0, transp = 0;
  for (let i = 0; i < N; i++) { if (A(i) > 230) { opaque[i] = 1; opq++; } if (A(i) < 16) transp++; }
  const pres = new Uint8Array(N); const R = 2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!opaque[y * W + x]) continue; for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { const yy = y + dy, xx = x + dx; if (yy >= 0 && yy < H && xx >= 0 && xx < W) pres[yy * W + xx] = 1; } }
  let fant = 0; for (let i = 0; i < N; i++) { const a = A(i); if (a >= 16 && a <= 230 && !pres[i]) fant++; }
  const plein = new Uint8Array(N); for (let i = 0; i < N; i++) if (A(i) >= 16) plein[i] = 1;
  const lab = new Int32Array(N).fill(-1); const tailles = [];
  for (let i = 0; i < N; i++) { if (!plein[i] || lab[i] >= 0) continue; const id = tailles.length; let n = 0; const pile = [i]; lab[i] = id; while (pile.length) { const p = pile.pop(); n++; const x = p % W, y = (p / W) | 0; for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1]) if (q >= 0 && plein[q] && lab[q] < 0) { lab[q] = id; pile.push(q); } } tailles.push(n); }
  const grand = Math.max(0, ...tailles);
  const ilots = tailles.filter((t) => t !== grand && t >= N * 0.0005).length;
  let bord = 0, blanc = 0;
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; if (!plein[i]) continue; if (!plein[i - 1] || !plein[i + 1] || !plein[i - W] || !plein[i + W]) { bord++; const k = i * 4; if (data[k] > 225 && data[k + 1] > 225 && data[k + 2] > 225 && data[k + 3] > 230) blanc++; } }
  return { fond: transp / N, fantome: opq ? fant / opq : 0, ilots, lisere: bord ? blanc / bord : 0 };
}

/**
 * Nettoie, recadre et juge la qualité d'un PNG détouré.
 * Renvoie { buf (PNG amélioré), defauts[], refus, principale_ok, mesures }.
 *  refus          : la photo ne va nulle part (sale même après nettoyage, pas détourée, ou < galeriePx).
 *  principale_ok  : propre, entière (pas collée au bord) et trottinette ≥ principalePx.
 */
export async function ameliorerEtJuger(buf0) {
  // ramène les sources géantes à travailPx (5000 px = 25 M pixels : inutile et lent)
  let buf = await sharp(buf0, { failOn: 'none' }).ensureAlpha().resize(SEUILS.travailPx, SEUILS.travailPx, { fit: 'inside', withoutEnlargement: true }).png().toBuffer();
  const { data, W, H } = await raw(buf);
  const b = bords(data, W, H);
  const coupee = Object.values(b).some((v) => v > SEUILS.bord);
  const efface = nettoyerRaw(data, W, H);
  const bx = boite(data, W, H);
  if (!bx) return { buf: buf0, defauts: ['image vide'], refus: true, principale_ok: false, mesures: {} };
  // recadrage serré + marge (toujours, même si la photo était déjà propre : c'est ce qui donne la même taille de
  // trottinette sur toutes les cartes)
  const D = Math.max(bx.w, bx.h); const m = Math.round(D * SEUILS.marge);
  buf = await sharp(data, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: bx.x0, top: bx.y0, width: bx.w, height: bx.h })
    .extend({ top: m, bottom: m, left: m, right: m, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 }).toBuffer();
  const p = await mesurerPropre(buf);
  const defauts = [];
  if (p.fond < 0.05) defauts.push('pas détourée');
  if (p.fantome > SEUILS.fantome) defauts.push(`fantômes ${(p.fantome * 100).toFixed(1)} %`);
  if (p.ilots >= SEUILS.ilots) defauts.push(`${p.ilots} débris`);
  if (p.lisere > SEUILS.lisere) defauts.push(`liseré blanc ${Math.round(p.lisere * 100)} %`);
  const sale = defauts.length > 0;
  if (D < SEUILS.galeriePx) defauts.push(`trop petite (${D} px)`);
  else if (D < SEUILS.principalePx) defauts.push(`basse définition (${D} px)`);
  if (coupee) defauts.push('collée au bord / coupée');
  const refus = sale || D < SEUILS.galeriePx;
  const principale_ok = !refus && !coupee && D >= SEUILS.principalePx;
  return { buf, defauts, refus, principale_ok, mesures: { trottPx: D, efface, bords: b, ...p } };
}
