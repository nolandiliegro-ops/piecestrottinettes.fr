/**
 * Audit du détourage des photos de trottinettes — 19/10/2026. LECTURE SEULE, aucune écriture en base.
 * Demande de Nolan : « on a ~430 trottinettes, il faut qu'elles soient toutes bien détourées » (cas G30 Max :
 * voile autour du guidon, pixels fantômes près de la roue).
 *
 * Pour chaque trottinette publiée, chaque photo de sa galerie est mesurée (réduite à 400 px) :
 *  - fond     : part de pixels transparents (< 5 % = photo pas détourée du tout)
 *  - voile    : part des pixels de la silhouette qui sont semi-transparents (alpha 16..230) — halo, flou, fantômes
 *  - ilots    : morceaux détachés de la silhouette principale (taille ≥ 0,05 % de l'image) — débris, ombres coupées
 *  - liseré   : part du contour de la silhouette qui est presque blanc et opaque — reste de fond blanc
 * Verdict : OK / À REVOIR (+ raisons). Sorties out/audit-detourage/ : report.json, a-revoir-N.jpg (vignettes sur gris
 * moyen, où un voile ou un liseré se voit), resume.
 *
 *   node scripts/audit-detourage.mjs [--limit N] [--principale]   (--principale : seulement la 1re photo de chaque galerie)
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'out/audit-detourage');
mkdirSync(OUT, { recursive: true });
const LIMIT = (() => { const i = process.argv.indexOf('--limit'); return i > 0 ? Number(process.argv[i + 1]) : Infinity; })();
const PRINCIPALE = process.argv.includes('--principale');

// 19/10 calibré sur planche : le « voile » (part de pixels semi-transparents) ne discrimine pas sur un objet fin
// (7-13 % sur des détourages propres). Le vrai défaut = FANTÔMES : semi-transparents à plus de 2 px de la silhouette opaque.
const SEUILS = { fond: 0.05, fantome: 0.02, ilots: 2, liseré: 0.25 };

const client = readFileSync(resolve(ROOT, 'src/integrations/supabase/client.ts'), 'utf-8');
const SB_URL = (client.match(/VITE_SUPABASE_URL\s*\|\|\s*"([^"]+)"/) || [])[1];
const ANON = (client.match(/VITE_SUPABASE_PUBLISHABLE_KEY\s*\|\|\s*"([^"]+)"/) || [])[1];

async function scooters() {
  const r = await fetch(`${SB_URL}/rest/v1/scooter_models?select=id,name,slug,image_url,images,is_top_moment&published=eq.true&order=name`, {
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
  });
  if (!r.ok) {
    // repli si la colonne s'appelle autrement
    const r2 = await fetch(`${SB_URL}/rest/v1/scooter_models?select=id,name,slug,image_url,images,is_top_moment&order=name`, { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } });
    if (!r2.ok) throw new Error(`lecture scooter_models HTTP ${r.status}/${r2.status}`);
    return r2.json();
  }
  return r.json();
}

const urlsOf = (s) => {
  const imgs = Array.isArray(s.images) ? [...s.images].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map((i) => i.url).filter(Boolean) : [];
  if (imgs.length === 0 && s.image_url) imgs.push(s.image_url);
  return PRINCIPALE ? imgs.slice(0, 1) : imgs;
};

async function mesure(buf) {
  const { data, info } = await sharp(buf, { failOn: 'none' }).ensureAlpha().resize(400, 400, { fit: 'inside' }).raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H;
  const A = (i) => data[i * 4 + 3];
  let transp = 0, sil = 0, semi = 0;
  const plein = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const a = A(i);
    if (a < 16) transp++;
    else { sil++; plein[i] = 1; if (a <= 230) semi++; }
  }
  // composantes connexes (4-voisins) sur les pixels de silhouette
  const lab = new Int32Array(N).fill(-1); const tailles = [];
  for (let i = 0; i < N; i++) {
    if (!plein[i] || lab[i] >= 0) continue;
    const id = tailles.length; let n = 0; const pile = [i]; lab[i] = id;
    while (pile.length) {
      const p = pile.pop(); n++;
      const x = p % W, y = (p / W) | 0;
      for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1]) {
        if (q >= 0 && plein[q] && lab[q] < 0) { lab[q] = id; pile.push(q); }
      }
    }
    tailles.push(n);
  }
  const grand = Math.max(0, ...tailles);
  const ilots = tailles.filter((t) => t !== grand && t >= N * 0.0005).length;
  // liseré : pixels de bord de silhouette (voisin transparent) presque blancs et opaques
  let bord = 0, blanc = 0;
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x; if (!plein[i]) continue;
    if (!plein[i - 1] || !plein[i + 1] || !plein[i - W] || !plein[i + W]) {
      bord++;
      const k = i * 4; if (data[k] > 225 && data[k + 1] > 225 && data[k + 2] > 225 && data[k + 3] > 230) blanc++;
    }
  }
  // fantômes : pixels visibles (alpha 16..230) à plus de 2 px de tout pixel opaque (alpha > 230)
  const opaque = new Uint8Array(N); for (let i = 0; i < N; i++) if (A(i) > 230) opaque[i] = 1;
  const pres = new Uint8Array(N); const R = 2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!opaque[y * W + x]) continue;
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      const yy = y + dy, xx = x + dx; if (yy >= 0 && yy < H && xx >= 0 && xx < W) pres[yy * W + xx] = 1;
    }
  }
  let fant = 0, opq = 0; for (let i = 0; i < N; i++) { if (opaque[i]) opq++; const a = A(i); if (a >= 16 && a <= 230 && !pres[i]) fant++; }
  const m = { fond: transp / N, voile: sil ? semi / sil : 0, fantome: opq ? fant / opq : 0, ilots, liseré: bord ? blanc / bord : 0 };
  const raisons = [];
  if (m.fond < SEUILS.fond) raisons.push('pas détourée');
  else {
    if (m.fantome > SEUILS.fantome) raisons.push(`fantômes ${(m.fantome * 100).toFixed(1)} %`);
    if (m.ilots >= SEUILS.ilots) raisons.push(`${m.ilots} débris`);
    if (m.liseré > SEUILS.liseré) raisons.push(`liseré blanc ${Math.round(m.liseré * 100)} %`);
  }
  return { ...Object.fromEntries(Object.entries(m).map(([k, v]) => [k, typeof v === 'number' && v < 1 ? Math.round(v * 1000) / 1000 : v])), raisons, verdict: raisons.length ? 'A_REVOIR' : 'OK' };
}

async function vignette(buf, l1, l2) {
  const W = 240, H = 260;
  const img = await sharp(buf, { failOn: 'none' }).resize(228, 205, { fit: 'inside' }).png().toBuffer();
  const meta = await sharp(img).metadata();
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#8f8f8f"/>
    <rect x="0" y="${H - 46}" width="${W}" height="46" fill="#fff"/>
    <text x="6" y="${H - 28}" font-family="DejaVu Sans" font-size="13" font-weight="bold" fill="#000">${esc(l1.slice(0, 28))}</text>
    <text x="6" y="${H - 10}" font-family="DejaVu Sans" font-size="12" fill="#c62828">${esc(l2.slice(0, 34))}</text></svg>`);
  return sharp({ create: { width: W, height: H, channels: 3, background: '#8f8f8f' } })
    .composite([{ input: svg, top: 0, left: 0 }, { input: img, top: 4 + Math.round((205 - meta.height) / 2), left: Math.round((W - meta.width) / 2) }])
    .jpeg({ quality: 80 }).toBuffer();
}

async function main() {
  const list = (await scooters()).slice(0, LIMIT);
  const report = []; const tuiles = [];
  for (const s of list) {
    const urls = urlsOf(s);
    if (urls.length === 0) { report.push({ slug: s.slug, nom: s.name, top: !!s.is_top_moment, photos: 0, verdict: 'SANS_PHOTO' }); continue; }
    const photos = [];
    for (const [pos, u] of urls.entries()) {
      try {
        const r = await fetch(u); if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const buf = Buffer.from(await r.arrayBuffer());
        const m = await mesure(buf);
        photos.push({ pos, url: u, ...m });
        if (m.verdict === 'A_REVOIR') tuiles.push(await vignette(buf, `${s.name} #${pos + 1}`, m.raisons.join(' · ')));
      } catch (e) { photos.push({ pos, url: u, verdict: 'ERREUR', raisons: [e.message] }); }
    }
    const pire = photos.some((p) => p.verdict === 'A_REVOIR') ? 'A_REVOIR' : photos.some((p) => p.verdict === 'ERREUR') ? 'ERREUR' : 'OK';
    report.push({ id: s.id, slug: s.slug, nom: s.name, top: !!s.is_top_moment, photos: photos.length, verdict: pire, principale: photos[0]?.verdict, detail: photos });
  }
  // planches : 6 × 5 vignettes
  const PER = 30;
  for (let p = 0; p * PER < tuiles.length; p++) {
    const part = tuiles.slice(p * PER, (p + 1) * PER);
    await sharp({ create: { width: 6 * 240, height: Math.ceil(part.length / 6) * 260, channels: 3, background: '#ffffff' } })
      .composite(part.map((t, i) => ({ input: t, left: (i % 6) * 240, top: Math.floor(i / 6) * 260 })))
      .jpeg({ quality: 78 }).toFile(resolve(OUT, `a-revoir-${p + 1}.jpg`));
  }
  const n = (f) => report.filter(f).length;
  const photosRevoir = report.reduce((a, r) => a + (r.detail || []).filter((p) => p.verdict === 'A_REVOIR').length, 0);
  const resume = {
    trottinettes: report.length, photos: report.reduce((a, r) => a + r.photos, 0),
    trottinettesOK: n((r) => r.verdict === 'OK'), trottinettesARevoir: n((r) => r.verdict === 'A_REVOIR'),
    principaleARevoir: n((r) => r.principale === 'A_REVOIR'), topARevoir: n((r) => r.top && r.principale === 'A_REVOIR'),
    photosARevoir: photosRevoir, sansPhoto: n((r) => r.verdict === 'SANS_PHOTO'), erreurs: n((r) => r.verdict === 'ERREUR'),
    planches: Math.ceil(tuiles.length / PER),
  };
  writeFileSync(resolve(OUT, 'report.json'), JSON.stringify({ resume, seuils: SEUILS, report }, null, 1));
  console.log(`::notice title=audit détourage::${JSON.stringify(resume)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
