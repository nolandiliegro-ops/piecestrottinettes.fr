/**
 * Audit « trottinette coupée » — 19/10/2026, LECTURE SEULE.
 * Demande Nolan : « fais attention que les trottinettes ne soient pas coupées » (ex. Dualtron Mini : roues tronchées à plat
 * dès la photo d'origine — le cadrage n'y est pour rien, mesuré : 54 px de transparent sous la coupe).
 * Mesure : une silhouette entière a des bords ARRONDIS (roue, poignée) : peu de pixels pleins sur sa ligne/colonne extrême.
 * Une photo coupée a un bord PLAT : beaucoup de pixels pleins alignés sur la ligne extrême.
 * coupe[côté] = pixels pleins (alpha > 200) sur les 2 lignes/colonnes extrêmes de la silhouette / largeur (ou hauteur) du cadre.
 * Sorties out/audit-coupe/ : report.json, planche-N.jpg (photos principales coupées + leurs autres photos, numérotées).
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'out/audit-coupe');
mkdirSync(OUT, { recursive: true });
const SEUIL = 0.12; // calibré : Mini coupée 0.21, Dolphin/Togo Max entières 0.08
const client = readFileSync(resolve(ROOT, 'src/integrations/supabase/client.ts'), 'utf-8');
const SB_URL = (client.match(/VITE_SUPABASE_URL\s*\|\|\s*"([^"]+)"/) || [])[1];
const ANON = (client.match(/VITE_SUPABASE_PUBLISHABLE_KEY\s*\|\|\s*"([^"]+)"/) || [])[1];

async function coupe(buf) {
  const { data, info } = await sharp(buf, { failOn: 'none' }).ensureAlpha().resize(400, 400, { fit: 'inside' }).raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height; const A = (x, y) => data[(y * W + x) * 4 + 3] > 200;
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (A(x, y)) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return null;
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
  const ligne = (y) => { let n = 0; for (let x = x0; x <= x1; x++) if (A(x, y)) n++; return n; };
  const colonne = (x) => { let n = 0; for (let y = y0; y <= y1; y++) if (A(x, y)) n++; return n; };
  const r = (v) => Math.round(v * 1000) / 1000;
  return {
    bas: r(Math.max(ligne(y1), ligne(Math.max(y0, y1 - 1))) / bw), haut: r(Math.max(ligne(y0), ligne(Math.min(y1, y0 + 1))) / bw),
    gauche: r(Math.max(colonne(x0), colonne(Math.min(x1, x0 + 1))) / bh), droite: r(Math.max(colonne(x1), colonne(Math.max(x0, x1 - 1))) / bh),
  };
}

async function tuile(buf, txt, rouge) {
  const C = 200; const t = await sharp(buf, { failOn: 'none' }).resize(C - 10, C - 34, { fit: 'inside' }).png().toBuffer(); const m = await sharp(t).metadata();
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${C}" height="${C}"><rect width="${C}" height="${C}" fill="${rouge ? '#b98a8a' : '#9a9a9a'}"/><rect y="${C - 26}" width="${C}" height="26" fill="#fff"/><text x="6" y="${C - 8}" font-family="DejaVu Sans" font-size="14" font-weight="bold">${String(txt).replace(/[&<>"]/g, '').slice(0, 24)}</text></svg>`);
  return sharp({ create: { width: C, height: C, channels: 3, background: '#9a9a9a' } }).composite([{ input: svg, top: 0, left: 0 }, { input: t, top: Math.round((C - 30 - m.height) / 2), left: Math.round((C - m.width) / 2) }]).jpeg({ quality: 75 }).toBuffer();
}

async function main() {
  const list = await (await fetch(`${SB_URL}/rest/v1/scooter_models?select=id,name,slug,images,image_url&published=eq.true&order=name`, { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } })).json();
  const report = []; const lignes = [];
  for (const s of list) {
    const urls = Array.isArray(s.images) && s.images.length ? [...s.images].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map((i) => i.url) : (s.image_url ? [s.image_url] : []);
    const photos = [];
    for (const u of urls) { try { const r = await fetch(u); if (!r.ok) throw new Error(`HTTP ${r.status}`); const buf = Buffer.from(await r.arrayBuffer()); const c = await coupe(buf); photos.push({ buf, c, coupee: !!c && Object.values(c).some((v) => v > SEUIL) }); } catch (e) { photos.push({ err: e.message }); } }
    report.push({ slug: s.slug, nom: s.name, photos: photos.map((p, i) => ({ i, coupe: p.c, coupee: p.coupee, err: p.err })), principaleCoupee: !!photos[0]?.coupee, entieres: photos.map((p, i) => (p.buf && !p.coupee ? i : null)).filter((i) => i !== null) });
    if (photos[0]?.coupee) lignes.push(await Promise.all(photos.filter((p) => p.buf).slice(0, 8).map((p, i) => tuile(p.buf, `#${i} ${s.name}`, p.coupee))));
  }
  for (let p = 0; p * 6 < lignes.length; p++) {
    const part = lignes.slice(p * 6, (p + 1) * 6); const comp = [];
    part.forEach((l, r) => l.forEach((t, c) => comp.push({ input: t, left: c * 200, top: r * 200 })));
    await sharp({ create: { width: 1600, height: part.length * 200, channels: 3, background: '#fff' } }).composite(comp).jpeg({ quality: 72 }).toFile(resolve(OUT, `planche-${p + 1}.jpg`));
  }
  const resume = { trottinettes: report.length, photos: report.reduce((a, r) => a + r.photos.length, 0), photosCoupees: report.reduce((a, r) => a + r.photos.filter((p) => p.coupee).length, 0), principalesCoupees: report.filter((r) => r.principaleCoupee).length, sansPhotoEntiere: report.filter((r) => r.entieres.length === 0).length };
  writeFileSync(resolve(OUT, 'report.json'), JSON.stringify({ resume, seuil: SEUIL, report }, null, 1));
  console.log(`::notice title=audit coupe::${JSON.stringify(resume)}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
