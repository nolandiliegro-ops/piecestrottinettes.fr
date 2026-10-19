/**
 * Re-détourage LOCAL des photos de trottinettes mal détourées — 19/10/2026.
 * Pourquoi : le nettoyage par transparence (scripts/nettoyage-detourage.mjs) ampute les trottinettes dont le CORPS
 * est semi-transparent (G30 Max, Kaabo Wolf, Inmotion C1…) : le défaut est dans le détourage d'origine, pas autour.
 * Méthode : pour chaque photo publiée dont les fantômes dépassent SEUIL (mesure de l'audit, 400 px), on retrouve la
 * photo SOURCE (config/photos/lotNN.json + .accept.json) par comparaison des pixels opaques, on la re-détoure avec
 * @imgly modèle « large », on durcit le masque (la trottinette devient opaque, le résidu de fond tombe à 0), on enlève
 * les débris, et on ne garde la nouvelle version QUE si ses fantômes baissent nettement.
 *
 *   node scripts/redetourage.mjs --dry [--limit N]  → out/redetourage/report-dry.json + avant-apres-N.jpg (pires d'abord)
 *   node scripts/redetourage.mjs --write            → galerie renvoyée à process-images (1 photo/envoi, ordre conservé,
 *                                                      photos non concernées renvoyées telles quelles)
 * Idempotent : une photo sous SEUIL n'est pas retouchée ; relancé après write, il ne trouve plus rien.
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { removeBackground } from '@imgly/background-removal-node';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'out/redetourage');
mkdirSync(OUT, { recursive: true });
const MODE = process.argv.includes('--write') ? 'write' : 'dry';
const LIMIT = (() => { const i = process.argv.indexOf('--limit'); return i > 0 ? Number(process.argv[i + 1]) : Infinity; })();
const SEUIL = 0.02;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

const require = createRequire(import.meta.url);
const publicPath = `${pathToFileURL(dirname(require.resolve('@imgly/background-removal-node'))).href}/`;

const client = readFileSync(resolve(ROOT, 'src/integrations/supabase/client.ts'), 'utf-8');
const SB_URL = (client.match(/VITE_SUPABASE_URL\s*\|\|\s*"([^"]+)"/) || [])[1];
const ANON = (client.match(/VITE_SUPABASE_PUBLISHABLE_KEY\s*\|\|\s*"([^"]+)"/) || [])[1];

// sources acceptées par slug (tous les lots, dernier lot gagnant + union)
const SOURCES = {};
for (const f of readdirSync(resolve(ROOT, 'config/photos')).filter((f) => f.endsWith('.accept.json')).sort()) {
  const acc = JSON.parse(readFileSync(resolve(ROOT, 'config/photos', f), 'utf-8'));
  const lot = JSON.parse(readFileSync(resolve(ROOT, 'config/photos', f.replace('.accept', '')), 'utf-8'));
  for (const m of lot.models) if (acc[m.slug]) for (const i of acc[m.slug]) {
    const u = m.candidates[i]; if (!u) continue;
    (SOURCES[m.slug] ||= []); if (!SOURCES[m.slug].includes(u)) SOURCES[m.slug].push(u);
  }
}

async function get(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

/** Part de fantômes, identique à l'audit (400 px, rayon 2). */
async function fantome(buf) {
  const { data, info } = await sharp(buf, { failOn: 'none' }).ensureAlpha().resize(400, 400, { fit: 'inside' }).raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H;
  const op = new Uint8Array(N); for (let i = 0; i < N; i++) if (data[i * 4 + 3] > 230) op[i] = 1;
  const pres = new Uint8Array(N);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (op[y * W + x])
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const yy = y + dy, xx = x + dx; if (yy >= 0 && yy < H && xx >= 0 && xx < W) pres[yy * W + xx] = 1; }
  let f = 0, o = 0; for (let i = 0; i < N; i++) { if (op[i]) o++; const a = data[i * 4 + 3]; if (a >= 16 && a <= 230 && !pres[i]) f++; }
  return o ? f / o : 1;
}

/** Écart moyen (0..255) entre la photo publiée et une source, sur les pixels opaques de la photo publiée. */
async function ecart(cur, src) {
  const cm = await sharp(cur, { failOn: 'none' }).metadata(); const sm = await sharp(src, { failOn: 'none' }).metadata();
  if (Math.abs(cm.width / cm.height - sm.width / sm.height) > 0.03) return 999;
  const W = 96, H = Math.max(8, Math.round(96 * cm.height / cm.width));
  const a = await sharp(cur, { failOn: 'none' }).ensureAlpha().resize(W, H, { fit: 'fill' }).raw().toBuffer();
  const b = await sharp(src, { failOn: 'none' }).removeAlpha().resize(W, H, { fit: 'fill' }).raw().toBuffer();
  let s = 0, n = 0;
  for (let i = 0; i < W * H; i++) if (a[i * 4 + 3] > 230) { s += Math.abs(a[i * 4] - b[i * 3]) + Math.abs(a[i * 4 + 1] - b[i * 3 + 1]) + Math.abs(a[i * 4 + 2] - b[i * 3 + 2]); n += 3; }
  return n > 50 ? s / n : 999;
}

/** Re-détourage modèle large + masque durci + débris enlevés. */
async function redetoure(src) {
  const blob = await removeBackground(src, { publicPath, model: 'large', output: { format: 'image/png' } });
  const png = Buffer.from(await blob.arrayBuffer());
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H;
  // durcissement : alpha < 64 → 0, > 160 → 255, rampe entre les deux (garde un bord lissé de quelques px)
  for (let i = 0; i < N; i++) { const a = data[i * 4 + 3]; data[i * 4 + 3] = a < 64 ? 0 : a > 160 ? 255 : Math.round((a - 64) * 255 / 96); }
  // débris : composantes < 0,05 % de l'image hors de la plus grande
  const lab = new Int32Array(N).fill(-1); const comps = [];
  for (let i = 0; i < N; i++) {
    if (data[i * 4 + 3] === 0 || lab[i] >= 0) continue;
    const id = comps.length; const px = [i]; lab[i] = id;
    for (let k = 0; k < px.length; k++) {
      const p = px[k], x = p % W;
      for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, p - W, p + W]) if (q >= 0 && q < N && data[q * 4 + 3] > 0 && lab[q] < 0) { lab[q] = id; px.push(q); }
    }
    comps.push(px);
  }
  let big = 0; comps.forEach((c, j) => { if (c.length > comps[big].length) big = j; });
  comps.forEach((c, j) => { if (j !== big && c.length < N * 0.0005) for (const p of c) data[p * 4 + 3] = 0; });
  return sharp(data, { raw: { width: W, height: H, channels: 4 } }).png({ compressionLevel: 9 }).toBuffer();
}

async function tuile(buf, txt) {
  const t = await sharp(buf, { failOn: 'none' }).resize(290, 260, { fit: 'inside' }).png().toBuffer(); const m = await sharp(t).metadata();
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="#8f8f8f"/><rect y="270" width="300" height="30" fill="#fff"/><text x="6" y="290" font-family="DejaVu Sans" font-size="13" font-weight="bold">${String(txt).replace(/[&<>"]/g, '').slice(0, 40)}</text></svg>`);
  return sharp({ create: { width: 300, height: 300, channels: 3, background: '#8f8f8f' } }).composite([{ input: svg, top: 0, left: 0 }, { input: t, top: Math.round((265 - m.height) / 2), left: Math.round((300 - m.width) / 2) }]).jpeg({ quality: 78 }).toBuffer();
}

async function main() {
  const env = MODE === 'write' ? Object.fromEntries(readFileSync(resolve(ROOT, '.env'), 'utf-8').split('\n').map((l) => l.match(/^([A-Z_]+)=["']?([^"'\r\n]*)/)).filter(Boolean).map((m) => [m[1], m[2]])) : {};
  const r = await fetch(`${SB_URL}/rest/v1/scooter_models?select=id,name,slug,image_url,images&published=eq.true&order=name`, { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } });
  const list = await r.json();
  // 1. mesure de toutes les photos publiées
  const cibles = [];
  for (const s of list) {
    const urls = Array.isArray(s.images) && s.images.length ? [...s.images].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map((i) => i.url) : (s.image_url ? [s.image_url] : []);
    const photos = [];
    for (const u of urls) { try { const b = await get(u); photos.push({ url: u, buf: b, f: await fantome(b) }); } catch (e) { photos.push({ url: u, err: e.message }); } }
    const pires = photos.filter((p) => p.f > SEUIL);
    if (pires.length) cibles.push({ s, photos, max: Math.max(...pires.map((p) => p.f)) });
  }
  cibles.sort((a, b) => b.max - a.max);
  console.log(`::notice title=redetourage cibles::${cibles.length} trottinettes · ${cibles.reduce((a, c) => a + c.photos.filter((p) => p.f > SEUIL).length, 0)} photos`);
  // 2. re-détourage
  const report = []; const paires = []; const cache = {};
  for (const c of cibles.slice(0, LIMIT)) {
    const srcs = SOURCES[c.s.slug] || [];
    const lignes = [];
    for (const [k, p] of c.photos.entries()) {
      if (!(p.f > SEUIL)) continue;
      const L = { pos: k + 1, avant: Math.round(p.f * 1000) / 1000 };
      try {
        let best = null;
        for (const u of srcs) {
          try { cache[u] ||= await get(u); } catch { continue; }
          const e = await ecart(p.buf, cache[u]); if (!best || e < best.e) best = { u, e };
        }
        if (!best || best.e > 28) { L.verdict = 'SOURCE_INTROUVABLE'; L.ecart = best ? Math.round(best.e) : null; lignes.push(L); continue; }
        const neu = await redetoure(cache[best.u]);
        const f2 = await fantome(neu);
        L.ecart = Math.round(best.e); L.apres = Math.round(f2 * 1000) / 1000;
        L.verdict = f2 < SEUIL || f2 < p.f / 3 ? 'MIEUX' : 'PAS_MIEUX';
        if (L.verdict === 'MIEUX') p.neu = neu;
        paires.push({ f: p.f, a: await tuile(p.buf, `AVANT ${c.s.name} #${k + 1} ${(p.f * 100).toFixed(1)}%`), b: await tuile(neu, `APRÈS ${(f2 * 100).toFixed(1)}% ${L.verdict}`) });
      } catch (e) { L.verdict = 'ERREUR'; L.err = e.message; }
      lignes.push(L);
    }
    const aEcrire = c.photos.some((p) => p.neu) && c.photos.every((p) => p.buf);
    const R = { id: c.s.id, slug: c.s.slug, nom: c.s.name, photos: c.photos.length, lignes, aEcrire };
    if (MODE === 'write' && aEcrire) {
      let ok = true;
      for (const [k, p] of c.photos.entries()) {
        await new Promise((r) => setTimeout(r, 400));
        const png = p.neu || await sharp(p.buf, { failOn: 'none' }).png().toBuffer();
        const res = await fetch(`${env.VITE_SUPABASE_URL}/functions/v1/process-images`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-secret': env.ADMIN_BULK_SECRET }, body: JSON.stringify({ entity_type: 'scooter', entity_id: c.s.id, images_base64: [png.toString('base64')], alt_base: c.s.name, reset: k === 0 }) });
        const t = await res.text();
        if (!res.ok || !/"success"\s*:\s*true/.test(t) || Number((t.match(/"processed_count"\s*:\s*(\d+)/) || [])[1]) !== 1) { ok = false; console.log(`::warning title=${k === 0 ? 'ÉCHEC' : 'ÉCHEC_PARTIEL'} ${c.s.slug}::photo ${k + 1} HTTP ${res.status} ${t.slice(0, 140)}`); break; }
      }
      R.ecrit = ok;
    }
    report.push(R);
  }
  for (let p = 0; p * 24 < paires.length; p++) {
    const part = paires.slice(p * 24, (p + 1) * 24); const comp = [];
    part.forEach((x, i) => { comp.push({ input: x.a, left: (i % 4) * 620, top: Math.floor(i / 4) * 300 }); comp.push({ input: x.b, left: (i % 4) * 620 + 305, top: Math.floor(i / 4) * 300 }); });
    await sharp({ create: { width: 2480, height: Math.ceil(part.length / 4) * 300, channels: 3, background: '#fff' } }).composite(comp).jpeg({ quality: 72 }).toFile(resolve(OUT, `avant-apres-${p + 1}.jpg`));
  }
  const L = report.flatMap((r) => r.lignes); const n = (v) => L.filter((l) => l.verdict === v).length;
  const resume = { mode: MODE, trottinettes: report.length, photos: L.length, mieux: n('MIEUX'), pasMieux: n('PAS_MIEUX'), sourceIntrouvable: n('SOURCE_INTROUVABLE'), erreurs: n('ERREUR'), aEcrire: report.filter((r) => r.aEcrire).length, ecrites: report.filter((r) => r.ecrit === true).length, echecs: report.filter((r) => r.ecrit === false).length };
  writeFileSync(resolve(OUT, `report-${MODE}.json`), JSON.stringify({ resume, report }, null, 1));
  console.log(`::notice title=redetourage ${MODE}::${JSON.stringify(resume)}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
