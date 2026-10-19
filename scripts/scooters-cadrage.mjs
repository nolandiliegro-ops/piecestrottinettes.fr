/**
 * Cadrage + photo principale des trottinettes — 19/10/2026 (demande Nolan : « exactement pareil que le cadrage des pièces,
 * certaines sont plus éloignées que d'autres ; et la principale en angle, de trois-quarts »).
 *
 *  1. CADRAGE : même règle que scripts/recadrage-photos.mjs (marge 4 %, recadrage si un côté a > 7 % de vide), mais le
 *     cadre est mesuré sur la SILHOUETTE PLEINE (alpha > 128, débris < 2 % de la plus grande pièce ignorés) : un voile
 *     ou un fantôme de détourage ne doit pas élargir le cadre (c'est ce qui fait paraître certaines trottinettes « loin »).
 *  1b. Photo à fantômes (> 2 %) : masque durci d'abord (alpha < 64 → 0, > 160 → 255) — validé sur planche, l'effacement
 *     simple amputait les trottinettes au corps semi-transparent.
 *  2. PHOTO PRINCIPALE : config/photos/vues.json { "<slug>": indexPhotoDeTroisQuarts (0-based) } — choisie sur planches
 *     (out/scooters-cadrage/vues-N.jpg). La photo choisie passe en 1re, les autres gardent leur ordre.
 *
 *   node scripts/scooters-cadrage.mjs --dry    → report-dry.json + vues-N.jpg (toutes les galeries, numérotées) + avant-apres
 *   node scripts/scooters-cadrage.mjs --write  → galerie renvoyée à process-images (1 photo/envoi, 1re = reset)
 * Idempotent : galerie déjà cadrée ET déjà dans le bon ordre → pas réécrite.
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'out/scooters-cadrage');
mkdirSync(OUT, { recursive: true });
const MODE = process.argv.includes('--write') ? 'write' : 'dry';
const MARGE = 0.04, SEUIL = 0.07;
const VUES = existsSync(resolve(ROOT, 'config/photos/vues.json')) ? JSON.parse(readFileSync(resolve(ROOT, 'config/photos/vues.json'), 'utf-8')) : {};

const client = readFileSync(resolve(ROOT, 'src/integrations/supabase/client.ts'), 'utf-8');
const SB_URL = (client.match(/VITE_SUPABASE_URL\s*\|\|\s*"([^"]+)"/) || [])[1];
const ANON = (client.match(/VITE_SUPABASE_PUBLISHABLE_KEY\s*\|\|\s*"([^"]+)"/) || [])[1];

/** Fantômes (mesure de scripts/audit-detourage.mjs, 400 px). */
async function fantome(buf) {
  const { data, info } = await sharp(buf, { failOn: 'none' }).ensureAlpha().resize(400, 400, { fit: 'inside' }).raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H;
  const op = new Uint8Array(N); for (let i = 0; i < N; i++) if (data[i * 4 + 3] > 230) op[i] = 1;
  const pres = new Uint8Array(N);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (op[y * W + x])
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const yy = y + dy, xx = x + dx; if (yy >= 0 && yy < H && xx >= 0 && xx < W) pres[yy * W + xx] = 1; }
  let f = 0, o = 0; for (let i = 0; i < N; i++) { if (op[i]) o++; const a = data[i * 4 + 3]; if (a >= 16 && a <= 230 && !pres[i]) f++; }
  return o ? f / o : 0;
}
/** Masque durci (validé sur planche 19/10, run « nettoyage dry durcir ») : alpha < 64 → 0, > 160 → 255, rampe entre. */
async function durcir(buf) {
  const { data, info } = await sharp(buf, { failOn: 'none' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < info.width * info.height; i++) { const a = data[i * 4 + 3]; data[i * 4 + 3] = a < 64 ? 0 : a > 160 ? 255 : Math.round((a - 64) * 255 / 96); }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png({ compressionLevel: 9 }).toBuffer();
}

async function analyse(buf) {
  const meta = await sharp(buf, { failOn: 'none' }).metadata();
  const W = meta.width, H = meta.height, k = Math.min(1, 400 / Math.max(W, H));
  const { data, info } = await sharp(buf, { failOn: 'none' }).ensureAlpha().resize(Math.max(1, Math.round(W * k)), Math.max(1, Math.round(H * k)), { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height, N = w * h;
  const plein = new Uint8Array(N); let transp = 0;
  for (let i = 0; i < N; i++) { const a = data[i * 4 + 3]; if (a > 128) plein[i] = 1; if (a < 250) transp++; }
  if (transp / N < 0.05) return { W, H, opaque: true };
  // composantes (8-voisins) de la silhouette pleine
  const lab = new Int32Array(N).fill(-1); const comps = [];
  for (let i = 0; i < N; i++) {
    if (!plein[i] || lab[i] >= 0) continue;
    const id = comps.length; const px = [i]; lab[i] = id; let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let j = 0; j < px.length; j++) {
      const p = px[j], x = p % w, y = (p / w) | 0;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        const q = yy * w + xx; if (plein[q] && lab[q] < 0) { lab[q] = id; px.push(q); }
      }
    }
    comps.push({ n: px.length, x0, y0, x1, y1 });
  }
  if (!comps.length) return { W, H, vide: true };
  const big = Math.max(...comps.map((c) => c.n));
  const garde = comps.filter((c) => c.n >= big * 0.02);
  const sx0 = Math.min(...garde.map((c) => c.x0)), sy0 = Math.min(...garde.map((c) => c.y0));
  const sx1 = Math.max(...garde.map((c) => c.x1)), sy1 = Math.max(...garde.map((c) => c.y1));
  const x0 = Math.max(0, Math.floor((sx0 - 1) / k)), y0 = Math.max(0, Math.floor((sy0 - 1) / k));
  const x1 = Math.min(W - 1, Math.ceil((sx1 + 2) / k) - 1), y1 = Math.min(H - 1, Math.ceil((sy1 + 2) / k) - 1);
  const marges = { haut: y0 / H, bas: (H - 1 - y1) / H, gauche: x0 / W, droite: (W - 1 - x1) / W };
  const besoin = Object.values(marges).some((m) => m > SEUIL);
  let out = null;
  if (besoin) {
    const cw = x1 - x0 + 1, ch = y1 - y0 + 1, m = Math.round(Math.max(cw, ch) * MARGE);
    out = await sharp(buf, { failOn: 'none' }).ensureAlpha().extract({ left: x0, top: y0, width: cw, height: ch })
      .extend({ top: m, bottom: m, left: m, right: m, background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true }).png({ compressionLevel: 9 }).toBuffer();
  }
  return { W, H, marges, remplissage: Math.round(100 * Math.max((x1 - x0 + 1) / W, (y1 - y0 + 1) / H)), besoin, out };
}

async function tuile(buf, txt, C = 200) {
  const t = await sharp(buf, { failOn: 'none' }).resize(C - 10, C - 34, { fit: 'inside' }).png().toBuffer(); const m = await sharp(t).metadata();
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${C}" height="${C}"><rect width="${C}" height="${C}" fill="#9a9a9a"/><rect y="${C - 26}" width="${C}" height="26" fill="#fff"/><text x="6" y="${C - 8}" font-family="DejaVu Sans" font-size="15" font-weight="bold">${String(txt).replace(/[&<>"]/g, '').slice(0, 22)}</text></svg>`);
  return sharp({ create: { width: C, height: C, channels: 3, background: '#9a9a9a' } }).composite([{ input: svg, top: 0, left: 0 }, { input: t, top: Math.round((C - 30 - m.height) / 2), left: Math.round((C - m.width) / 2) }]).jpeg({ quality: 75 }).toBuffer();
}

async function main() {
  const env = MODE === 'write' ? Object.fromEntries(readFileSync(resolve(ROOT, '.env'), 'utf-8').split('\n').map((l) => l.match(/^([A-Z_]+)=["']?([^"'\r\n]*)/)).filter(Boolean).map((m) => [m[1], m[2]])) : {};
  const list = await (await fetch(`${SB_URL}/rest/v1/scooter_models?select=id,name,slug,image_url,images&published=eq.true&order=name`, { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } })).json();
  const report = []; const lignes = []; const paires = [];
  for (const s of list) {
    const urls = Array.isArray(s.images) && s.images.length ? [...s.images].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map((i) => i.url) : (s.image_url ? [s.image_url] : []);
    const photos = [];
    for (const u of urls) {
      try {
        const r = await fetch(u); if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const brut = Buffer.from(await r.arrayBuffer());
        const f = await fantome(brut);
        const buf = f > 0.02 ? await durcir(brut) : brut; // photo à fantômes : masque durci AVANT le cadrage
        const a = await analyse(buf);
        if (f > 0.02 && !a.out) a.out = buf; // durcie mais déjà bien cadrée : la version durcie est quand même à écrire
        photos.push({ url: u, buf: brut, f, durcie: f > 0.02, ...a, besoin: a.besoin || f > 0.02 });
      }
      catch (e) { photos.push({ url: u, erreur: e.message }); }
    }
    const v = VUES[s.slug];
    const ordre = photos.map((_, i) => i);
    if (Number.isInteger(v) && v > 0 && v < photos.length) { ordre.splice(ordre.indexOf(v), 1); ordre.unshift(v); }
    const reordonne = ordre[0] !== 0;
    const aCadrer = photos.filter((p) => p.besoin).length;
    const erreurs = photos.filter((p) => p.erreur).length;
    const aEcrire = (aCadrer > 0 || reordonne) && erreurs === 0 && photos.length > 0;
    const R = { id: s.id, slug: s.slug, nom: s.name, photos: photos.length, aCadrer, durcies: photos.filter((p) => p.durcie).length, reordonne, principale: ordre[0], erreurs, remplissagePrincipale: photos[ordre[0]]?.remplissage ?? null, aEcrire };
    if (MODE === 'dry') {
      lignes.push({ nom: s.name, slug: s.slug, tuiles: await Promise.all(photos.filter((p) => p.buf).map((p, i) => tuile(p.out || p.buf, `#${i} ${s.name}`))) });
      const p0 = photos[ordre[0]];
      if (p0?.besoin && paires.length < 48) paires.push([await tuile(p0.buf, `AVANT ${s.name}`, 260), await tuile(p0.out, 'APRÈS', 260)]);
    }
    if (MODE === 'write' && aEcrire) {
      let ok = true;
      for (const [k, i] of ordre.entries()) {
        await new Promise((r) => setTimeout(r, 1000)); // 19/10 : 400 ms → 8 « Too many connections » sur 416
        const png = photos[i].out || await sharp(photos[i].buf, { failOn: 'none' }).png().toBuffer();
        const res = await fetch(`${env.VITE_SUPABASE_URL}/functions/v1/process-images`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-secret': env.ADMIN_BULK_SECRET }, body: JSON.stringify({ entity_type: 'scooter', entity_id: s.id, images_base64: [png.toString('base64')], alt_base: s.name, reset: k === 0 }) });
        const t = await res.text();
        if (!res.ok || !/"success"\s*:\s*true/.test(t) || Number((t.match(/"processed_count"\s*:\s*(\d+)/) || [])[1]) !== 1) { ok = false; console.log(`::warning title=${k === 0 ? 'ÉCHEC' : 'ÉCHEC_PARTIEL'} ${s.slug}::photo ${k + 1}/${ordre.length} HTTP ${res.status} ${t.slice(0, 140)}`); break; }
      }
      R.ecrit = ok;
    }
    report.push(R);
  }
  if (MODE === 'dry') {
    // planches de vues : 6 trottinettes par planche, une ligne par galerie (tuiles numérotées depuis 0)
    for (let p = 0; p * 6 < lignes.length; p++) {
      const part = lignes.slice(p * 6, (p + 1) * 6); const comp = [];
      part.forEach((l, r) => l.tuiles.slice(0, 8).forEach((t, c) => comp.push({ input: t, left: c * 200, top: r * 200 })));
      await sharp({ create: { width: 1600, height: part.length * 200, channels: 3, background: '#fff' } }).composite(comp).jpeg({ quality: 72 }).toFile(resolve(OUT, `vues-${p + 1}.jpg`));
    }
    writeFileSync(resolve(OUT, 'vues-index.json'), JSON.stringify(lignes.map((l, i) => ({ planche: Math.floor(i / 6) + 1, ligne: i % 6, slug: l.slug, nom: l.nom, photos: l.tuiles.length }))));
    for (let p = 0; p * 12 < paires.length; p++) {
      const part = paires.slice(p * 12, (p + 1) * 12); const comp = [];
      part.forEach(([a, b], i) => { comp.push({ input: a, left: (i % 4) * 530, top: Math.floor(i / 4) * 260 }); comp.push({ input: b, left: (i % 4) * 530 + 262, top: Math.floor(i / 4) * 260 }); });
      await sharp({ create: { width: 2120, height: Math.ceil(part.length / 4) * 260, channels: 3, background: '#fff' } }).composite(comp).jpeg({ quality: 72 }).toFile(resolve(OUT, `avant-apres-${p + 1}.jpg`));
    }
  }
  const n = (f) => report.filter(f).length;
  const resume = { mode: MODE, trottinettes: report.length, aCadrer: n((r) => r.aCadrer > 0), photosACadrer: report.reduce((a, r) => a + r.aCadrer, 0), photosDurcies: report.reduce((a, r) => a + (r.durcies || 0), 0), reordonnees: n((r) => r.reordonne), avecErreur: n((r) => r.erreurs > 0), aEcrire: n((r) => r.aEcrire), ecrites: n((r) => r.ecrit === true), echecs: n((r) => r.ecrit === false) };
  writeFileSync(resolve(OUT, `report-${MODE}.json`), JSON.stringify({ resume, report }, null, 1));
  console.log(`::notice title=scooters-cadrage ${MODE}::${JSON.stringify(resume)}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
