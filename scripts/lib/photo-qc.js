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
