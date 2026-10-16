// scripts/lib/photo-qc.js
// Contrôle qualité d'un PNG détouré (sortie @imgly) : mesure la couverture alpha
// et les bords pour repérer produit coupé, résidu de décor, bandeau, cadrage serré.
// Seuils calibrés sur 82 images prod (17/09/2026), 0 faux positif : NE PAS modifier.
import sharp from 'sharp';

const MEASURE_MAX = 400;

export async function photoQc(pngBuffer) {
  const meta = await sharp(pngBuffer).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  const { data, info } = await sharp(pngBuffer)
    .resize(MEASURE_MAX, MEASURE_MAX, { fit: 'inside', withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const total = w * h;
  let opaqueCount = 0;
  let semiCount = 0;
  const alphaAt = (x, y) => data[(y * w + x) * 4 + 3];

  for (let i = 3; i < data.length; i += 4) {
    const a = data[i];
    if (a > 200) opaqueCount++;
    else if (a > 20) semiCount++;
  }

  const rowOpaque = (y) => { let c = 0; for (let x = 0; x < w; x++) if (alphaAt(x, y) > 200) c++; return c / w; };
  const colOpaque = (x) => { let c = 0; for (let y = 0; y < h; y++) if (alphaAt(x, y) > 200) c++; return c / h; };

  const edge = {
    top: rowOpaque(0),
    bottom: rowOpaque(h - 1),
    left: colOpaque(0),
    right: colOpaque(w - 1),
  };
  const opaque = opaqueCount / total;
  const semi = semiCount / total;

  const reasons = [];
  let verdict = 'PASS';
  const fail = (r) => { verdict = 'FAIL'; reasons.push(r); };
  const warn = (r) => { if (verdict !== 'FAIL') verdict = 'WARN'; reasons.push(r); };

  if (Object.values(edge).some((v) => v > 0.02)) fail('produit coupé / gros plan');
  if (semi > 0.04) fail('détourage sale / résidu de décor');
  if (width / height > 3 || height / width > 3) fail('bandeau, pas un produit');
  if (Math.min(width, height) < 600) warn('basse définition');
  if (opaque > 0.24) warn('cadrage serré');

  return { width, height, opaque, semi, edge, verdict, reasons };
}

// ─── Garde-fou n°2 (16/10/2026) — ce que photoQc ne voit pas ────────────────────
// Fait déclencheur : 65 photos principales sur 437 étaient « détourées » (PASS au
// contrôle alpha) mais portaient un logo DGT, un téléphone, un badge, un texte de
// fiche technique ou plusieurs trottinettes. Ici on compte les morceaux opaques
// séparés (un objet en plus = un 2e morceau) et la part de couleurs vives
// (visuel marketing). Les seuils de photoQc ci-dessus ne sont PAS touchés.
const PLUS_MAX = 200;

export async function photoQcPlus(pngBuffer) {
  const { data, info } = await sharp(pngBuffer)
    .resize(PLUS_MAX, PLUS_MAX, { fit: 'inside', withoutEnlargement: false })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height, n = w * h;
  const m = new Uint8Array(n);
  let op = 0, vivid = 0, minX = w, minY = h, maxX = -1, maxY = -1;
  for (let i = 0; i < n; i++) {
    if (data[i * 4 + 3] > 128) {
      m[i] = 1; op++;
      const x = i % w, y = (i / w) | 0;
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
      const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
      if (mx > 90 && (mx - mn) / mx > 0.5) vivid++;
    }
  }
  const reasons = [];
  let verdict = 'PASS';
  const fail = (r) => { verdict = 'FAIL'; reasons.push(r); };
  const warn = (r) => { if (verdict !== 'FAIL') verdict = 'WARN'; reasons.push(r); };
  if (op === 0) { fail('image vide'); return { verdict, reasons, parts: 0, second: 0, vivid: 0, fill: 0 }; }

  // dilatation 2 px pour recoller les fines pièces d'une même trottinette (guidon, câbles)
  const d = new Uint8Array(n);
  for (let i = 0; i < n; i++) if (m[i]) {
    const x = i % w, y = (i / w) | 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < w && yy < h) d[yy * w + xx] = 1;
    }
  }
  const seen = new Uint8Array(n);
  const sizes = [];
  for (let i = 0; i < n; i++) {
    if (!d[i] || seen[i]) continue;
    let st = [i], s = 0; seen[i] = 1;
    while (st.length) {
      const p = st.pop(); if (m[p]) s++;
      const x = p % w;
      for (const q of [p - 1, p + 1, p - w, p + w]) {
        if (q < 0 || q >= n || seen[q] || !d[q]) continue;
        if (Math.abs((q % w) - x) > 1) continue;
        seen[q] = 1; st.push(q);
      }
    }
    sizes.push(s);
  }
  sizes.sort((a, b) => b - a);
  const second = (sizes[1] || 0) / op;
  const parts = sizes.filter((s) => s / op >= 0.015).length;
  const vividShare = vivid / op;
  const fill = ((maxX - minX + 1) * (maxY - minY + 1)) / n;

  if (second >= 0.03) fail(`élément en plus (logo, badge, téléphone, 2e trottinette) : ${parts} morceaux`);
  else if (parts >= 2) warn(`petit élément détaché (${parts} morceaux)`);
  if (vividShare > 0.30) warn(`couleurs vives ${(vividShare * 100).toFixed(0)} % (visuel marketing ?)`);
  if (fill < 0.12) warn('produit minuscule dans le cadre');
  return { verdict, reasons, parts, second: +second.toFixed(3), vivid: +vividShare.toFixed(3), fill: +fill.toFixed(3) };
}

// Verdict combiné : le pire des deux contrôles.
export async function photoQcAll(pngBuffer) {
  const a = await photoQc(pngBuffer);
  const b = await photoQcPlus(pngBuffer);
  const rank = { PASS: 0, WARN: 1, FAIL: 2 };
  const verdict = rank[b.verdict] > rank[a.verdict] ? b.verdict : a.verdict;
  return { ...a, verdict, reasons: [...a.reasons, ...b.reasons], plus: b };
}
