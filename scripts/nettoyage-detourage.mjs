/**
 * Nettoyage du détourage des photos de trottinettes — 19/10/2026 (demande Nolan : « elles doivent toutes être bien détourées »).
 * Suite de scripts/audit-detourage.mjs. Le défaut mesuré = FANTÔMES : pixels semi-transparents (alpha 16..230) à plus de
 * 2 px de la silhouette opaque (taches, cadres, restes de fond), + petits débris détachés.
 * Correction sans IA, sans re-détourage : on garde la silhouette opaque et son contour lissé (≤ 2 px), on efface le reste
 * (alpha → 0) et les débris < 0,05 % de l'image. La trottinette elle-même n'est jamais modifiée.
 * Photos cassées (HTTP ≠ 200) : retirées de la galerie (jamais la seule photo restante).
 *
 * Idempotent : une photo sans fantôme (≤ SEUIL) est renvoyée telle quelle ; une trottinette sans photo à corriger n'est pas réécrite.
 *   node scripts/nettoyage-detourage.mjs --dry   → out/nettoyage/report-dry.json + avant-apres-N.jpg, AUCUNE écriture
 *   node scripts/nettoyage-detourage.mjs --write → process-images (entity scooter, 1 photo par envoi), nouveaux fichiers à côté des anciens
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'out/nettoyage');
mkdirSync(OUT, { recursive: true });
const MODE = process.argv.includes('--write') ? 'write' : 'dry';
const SEUIL = 0.02; // part de fantômes (rapportée à la silhouette opaque) au-delà de laquelle on nettoie

const client = readFileSync(resolve(ROOT, 'src/integrations/supabase/client.ts'), 'utf-8');
const SB_URL = (client.match(/VITE_SUPABASE_URL\s*\|\|\s*"([^"]+)"/) || [])[1];
const ANON = (client.match(/VITE_SUPABASE_PUBLISHABLE_KEY\s*\|\|\s*"([^"]+)"/) || [])[1];

async function scooters() {
  const r = await fetch(`${SB_URL}/rest/v1/scooter_models?select=id,name,slug,image_url,images&published=eq.true&order=name`, { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } });
  if (!r.ok) throw new Error(`lecture scooter_models HTTP ${r.status}`);
  return r.json();
}
const urlsOf = (s) => {
  const imgs = Array.isArray(s.images) ? [...s.images].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map((i) => i.url).filter(Boolean) : [];
  if (imgs.length === 0 && s.image_url) imgs.push(s.image_url);
  return imgs;
};

/** Nettoie une photo en pleine résolution. Renvoie { fantome, debris, out? }. */
async function nettoie(buf) {
  const { data, info } = await sharp(buf, { failOn: 'none' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H;
  const R = Math.max(2, Math.round(Math.max(W, H) / 200)); // 2 px à 400 px ⇒ proportionnel en pleine résolution
  const opaque = new Uint8Array(N);
  let opq = 0;
  for (let i = 0; i < N; i++) if (data[i * 4 + 3] > 230) { opaque[i] = 1; opq++; }
  if (opq === 0) return { fantome: 0, debris: 0 };
  // zone autorisée = silhouette opaque dilatée de R px (dilatation séparable : lignes puis colonnes)
  const tmp = new Uint8Array(N), pres = new Uint8Array(N);
  for (let y = 0; y < H; y++) { let last = -1e9; for (let x = 0; x < W; x++) { if (opaque[y * W + x]) last = x; if (x - last <= R) tmp[y * W + x] = 1; } last = 1e9; for (let x = W - 1; x >= 0; x--) { if (opaque[y * W + x]) last = x; if (last - x <= R) tmp[y * W + x] = 1; } }
  for (let x = 0; x < W; x++) { let last = -1e9; for (let y = 0; y < H; y++) { if (tmp[y * W + x]) last = y; if (y - last <= R) pres[y * W + x] = 1; } last = 1e9; for (let y = H - 1; y >= 0; y--) { if (tmp[y * W + x]) last = y; if (last - y <= R) pres[y * W + x] = 1; } }
  let fant = 0;
  for (let i = 0; i < N; i++) { const a = data[i * 4 + 3]; if (a >= 16 && !pres[i]) { if (a <= 230) fant++; } }
  const fantome = fant / opq;
  // débris : composantes visibles (alpha ≥ 16) hors de la plus grande, sous 0,05 % de l'image
  const vis = new Uint8Array(N); for (let i = 0; i < N; i++) if (data[i * 4 + 3] >= 16) vis[i] = 1;
  const lab = new Int32Array(N).fill(-1); const comps = [];
  for (let i = 0; i < N; i++) {
    if (!vis[i] || lab[i] >= 0) continue;
    const id = comps.length; const px = [i]; lab[i] = id;
    for (let k = 0; k < px.length; k++) {
      const p = px[k], x = p % W, y = (p / W) | 0;
      if (x > 0 && vis[p - 1] && lab[p - 1] < 0) { lab[p - 1] = id; px.push(p - 1); }
      if (x < W - 1 && vis[p + 1] && lab[p + 1] < 0) { lab[p + 1] = id; px.push(p + 1); }
      if (y > 0 && vis[p - W] && lab[p - W] < 0) { lab[p - W] = id; px.push(p - W); }
      if (y < H - 1 && vis[p + W] && lab[p + W] < 0) { lab[p + W] = id; px.push(p + W); }
    }
    comps.push(px);
  }
  let big = 0; comps.forEach((c, j) => { if (c.length > comps[big].length) big = j; });
  const petits = comps.filter((c, j) => j !== big && c.length < N * 0.0005);
  // 19/10 dry 1 : déclencher sur les seuls débris = 929 photos retouchées pour rien (poussières invisibles). Fantômes seuls.
  const besoin = fantome > SEUIL;
  if (!besoin) return { fantome, debris: 0 };
  const out = Buffer.from(data);
  for (let i = 0; i < N; i++) { const a = out[i * 4 + 3]; if (a >= 16 && a <= 230 && !pres[i]) out[i * 4 + 3] = 0; }
  for (const c of petits) for (const p of c) out[p * 4 + 3] = 0;
  const png = await sharp(out, { raw: { width: W, height: H, channels: 4 } }).png({ compressionLevel: 9 }).toBuffer();
  return { fantome, debris: petits.length, out: png };
}

async function vignette(buf, l1) {
  const W = 300, H = 300;
  const t = await sharp(buf, { failOn: 'none' }).resize(290, 260, { fit: 'inside' }).png().toBuffer();
  const m = await sharp(t).metadata();
  const esc = (s) => String(s).replace(/[&<>"]/g, '');
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#8f8f8f"/><rect y="${H - 30}" width="${W}" height="30" fill="#fff"/><text x="6" y="${H - 10}" font-family="DejaVu Sans" font-size="13" font-weight="bold">${esc(l1.slice(0, 38))}</text></svg>`);
  return sharp({ create: { width: W, height: H, channels: 3, background: '#8f8f8f' } }).composite([{ input: svg, top: 0, left: 0 }, { input: t, top: Math.round((260 - m.height) / 2), left: Math.round((W - m.width) / 2) }]).jpeg({ quality: 78 }).toBuffer();
}

async function main() {
  const env = MODE === 'write' ? Object.fromEntries(readFileSync(resolve(ROOT, '.env'), 'utf-8').split('\n').map((l) => l.match(/^([A-Z_]+)=["']?([^"'\r\n]*)/)).filter(Boolean).map((m) => [m[1], m[2]])) : {};
  const report = []; const paires = [];
  for (const s of await scooters()) {
    const urls = urlsOf(s);
    const photos = [];
    for (const u of urls) {
      try {
        const r = await fetch(u); if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const buf = Buffer.from(await r.arrayBuffer());
        photos.push({ url: u, buf, ...(await nettoie(buf)) });
      } catch (e) { photos.push({ url: u, casse: true, erreur: e.message }); }
    }
    const corrigees = photos.filter((p) => p.out).length;
    const cassees = photos.filter((p) => p.casse && /HTTP 4\d\d/.test(p.erreur)).length;
    const transitoires = photos.filter((p) => p.casse && !/HTTP 4\d\d/.test(p.erreur)).length;
    const garde = photos.filter((p) => !p.casse);
    const aEcrire = (corrigees > 0 || cassees > 0) && transitoires === 0 && garde.length > 0;
    report.push({ id: s.id, slug: s.slug, nom: s.name, photos: photos.length, corrigees, cassees, transitoires, principaleCorrigee: !!photos[0]?.out, principaleCassee: !!photos[0]?.casse, aEcrire });
    for (const [k, p] of photos.entries()) if (p.out) paires.push({ nom: `${s.name} #${k + 1} ${(p.fantome * 100).toFixed(1)}%`, f: p.fantome, avant: await sharp(p.buf, { failOn: 'none' }).resize(290, 260, { fit: 'inside' }).png().toBuffer(), apres: await sharp(p.out).resize(290, 260, { fit: 'inside' }).png().toBuffer() });

    if (MODE === 'write' && aEcrire) {
      const bufs = garde.map((p) => p.out || p.buf);
      let ok = true;
      for (let k = 0; k < bufs.length; k++) {
        await new Promise((r) => setTimeout(r, 400));
        const png = await sharp(bufs[k], { failOn: 'none' }).png().toBuffer();
        const res = await fetch(`${env.VITE_SUPABASE_URL}/functions/v1/process-images`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-secret': env.ADMIN_BULK_SECRET },
          body: JSON.stringify({ entity_type: 'scooter', entity_id: s.id, images_base64: [png.toString('base64')], alt_base: s.name, reset: k === 0 }),
        });
        const t = await res.text();
        const nOk = (t.match(/"processed_count"\s*:\s*(\d+)/) || [])[1];
        if (!res.ok || !/"success"\s*:\s*true/.test(t) || Number(nOk) !== 1) { ok = false; console.log(`::warning title=${k === 0 ? 'ÉCHEC' : 'ÉCHEC_PARTIEL'} ${s.slug}::photo ${k + 1}/${bufs.length} HTTP ${res.status} ${t.slice(0, 140)}`); break; }
      }
      report[report.length - 1].ecrit = ok;
    }
  }
  // planches avant | après, 4 paires par ligne, 6 lignes par planche
  paires.sort((a, b) => b.f - a.f); // pires d'abord
  const PER = 24;
  for (let p = 0; p * PER < paires.length; p++) {
    const part = paires.slice(p * PER, (p + 1) * PER); const comp = [];
    for (const [i, x] of part.entries()) {
      comp.push({ input: await vignette(x.avant, `AVANT ${x.nom}`), left: (i % 4) * 620, top: Math.floor(i / 4) * 300 });
      comp.push({ input: await vignette(x.apres, 'APRÈS'), left: (i % 4) * 620 + 305, top: Math.floor(i / 4) * 300 });
    }
    await sharp({ create: { width: 4 * 620, height: Math.ceil(part.length / 4) * 300, channels: 3, background: '#ffffff' } }).composite(comp).jpeg({ quality: 72 }).toFile(resolve(OUT, `avant-apres-${p + 1}.jpg`));
  }
  const n = (f) => report.filter(f).length;
  const resume = {
    mode: MODE, trottinettes: report.length, aEcrire: n((r) => r.aEcrire),
    photosCorrigees: report.reduce((a, r) => a + r.corrigees, 0), photosCassees: report.reduce((a, r) => a + r.cassees, 0),
    principalesCorrigees: n((r) => r.principaleCorrigee), principalesCassees: n((r) => r.principaleCassee), transitoires: n((r) => r.transitoires > 0),
    ecrites: n((r) => r.ecrit === true), echecs: n((r) => r.ecrit === false),
  };
  writeFileSync(resolve(OUT, `report-${MODE}.json`), JSON.stringify({ resume, report }, null, 1));
  console.log(`::notice title=nettoyage ${MODE}::${JSON.stringify(resume)}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
