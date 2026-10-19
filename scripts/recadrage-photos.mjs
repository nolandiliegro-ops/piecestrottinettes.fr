/**
 * Recadrage des photos de pièces — 19/10/2026 (go Nolan : « recadrer les fichiers »).
 * Pourquoi : sur les cartes, une pièce entourée de beaucoup de transparent sort plus petite
 * (mesuré : la pièce occupe 59 % de la hauteur sur certaines photos, 92 % sur d'autres).
 *
 * Pour chaque pièce publiée : télécharge ses photos, coupe le vide transparent autour de la pièce,
 * remet une marge identique (MARGE), et — en mode write — envoie le jeu complet à l'Edge Function
 * process-images (mode « déjà détourée ») qui range les nouveaux fichiers À CÔTÉ des anciens
 * (jamais écrasés) et met à jour parts.images + parts.image_url.
 *
 * Idempotent : une photo dont la marge est déjà ≤ SEUIL sur ses 4 côtés n'est pas touchée ;
 * une pièce dont aucune photo n'a besoin de recadrage n'est pas réécrite. Relancé, il ne refait rien.
 * Photos sans transparence (fond plein) : ignorées et listées (pas de recadrage à l'aveugle).
 *
 *   node scripts/recadrage-photos.mjs --dry   [--limit N]   → out/recadrage/report.json + planche.jpg, AUCUNE écriture
 *   node scripts/recadrage-photos.mjs --write [--limit N]   → écrit (lit .env : VITE_SUPABASE_URL, ADMIN_BULK_SECRET)
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'out/recadrage');
mkdirSync(OUT, { recursive: true });
const MODE = process.argv.includes('--write') ? 'write' : 'dry';
const LIMIT = (() => { const i = process.argv.indexOf('--limit'); return i > 0 ? Number(process.argv[i + 1]) : Infinity; })();
const ONLY = (() => { const i = process.argv.indexOf('--ids'); return i > 0 ? new Set(process.argv[i + 1].split(',')) : null; })();

const MARGE = 0.04;   // marge remise autour de la pièce (4 % du plus grand côté)
const SEUIL = 0.07;   // au-delà de 7 % de vide sur un côté, on recadre
const ALPHA = 24;     // pixel « plein » si alpha > 24 (ignore les ombres très légères)

const client = readFileSync(resolve(ROOT, 'src/integrations/supabase/client.ts'), 'utf-8');
const SB_URL = (client.match(/VITE_SUPABASE_URL\s*\|\|\s*"([^"]+)"/) || [])[1];
const ANON = (client.match(/VITE_SUPABASE_PUBLISHABLE_KEY\s*\|\|\s*"([^"]+)"/) || [])[1];
if (!SB_URL || !ANON) { console.error('URL ou clé publique introuvable dans client.ts'); process.exit(1); }

async function allParts() {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const r = await fetch(`${SB_URL}/rest/v1/parts?select=id,name,slug,image_url,images&published=eq.true&order=id`, {
      headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, Range: `${from}-${from + 999}`, 'Range-Unit': 'items' },
    });
    if (!r.ok) throw new Error(`lecture parts HTTP ${r.status}`);
    const page = await r.json();
    rows.push(...page);
    if (page.length < 1000) break;
  }
  return rows;
}

const urlsOf = (p) => {
  const imgs = Array.isArray(p.images) ? [...p.images].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map((i) => i.url).filter(Boolean) : [];
  if (imgs.length === 0 && p.image_url) imgs.push(p.image_url);
  return imgs;
};

/** Analyse une photo : marges vides (en fraction) et version recadrée si besoin. */
async function analyse(buf) {
  // Cadre mesuré sur une version réduite (≤ 400 px) puis reporté sur l'original : ~20× plus rapide.
  const meta = await sharp(buf, { failOn: 'none' }).metadata();
  const W = meta.width, H = meta.height;
  const k = Math.min(1, 400 / Math.max(W, H));
  const { data, info } = await sharp(buf, { failOn: 'none' }).ensureAlpha().resize(Math.max(1, Math.round(W * k)), Math.max(1, Math.round(H * k)), { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  const w0 = info.width, h0 = info.height;
  let sx0 = w0, sy0 = h0, sx1 = -1, sy1 = -1, transp = 0;
  for (let y = 0; y < h0; y++) for (let x = 0; x < w0; x++) {
    const a = data[(y * w0 + x) * 4 + 3];
    if (a < 250) transp++;
    if (a > ALPHA) { if (x < sx0) sx0 = x; if (x > sx1) sx1 = x; if (y < sy0) sy0 = y; if (y > sy1) sy1 = y; }
  }
  if (sx1 < 0) return { W, H, vide: true };
  // Report à l'échelle d'origine, avec 1 pixel réduit de sécurité (on ne rogne jamais la pièce).
  const x0 = Math.max(0, Math.floor((sx0 - 1) / k)), y0 = Math.max(0, Math.floor((sy0 - 1) / k));
  const x1 = Math.min(W - 1, Math.ceil((sx1 + 2) / k) - 1), y1 = Math.min(H - 1, Math.ceil((sy1 + 2) / k) - 1);
  transp = transp * (W * H) / (w0 * h0);
  if (x1 < 0) return { W, H, vide: true };
  const marges = { haut: y0 / H, bas: (H - 1 - y1) / H, gauche: x0 / W, droite: (W - 1 - x1) / W };
  const remplissage = { l: (x1 - x0 + 1) / W, h: (y1 - y0 + 1) / H };
  const transparent = transp / (W * H) > 0.05;
  const besoin = transparent && Object.values(marges).some((m) => m > SEUIL);
  let out = null;
  if (besoin) {
    const w = x1 - x0 + 1, h = y1 - y0 + 1, m = Math.round(Math.max(w, h) * MARGE);
    out = await sharp(buf, { failOn: 'none' })
      .extract({ left: x0, top: y0, width: w, height: h })
      .extend({ top: m, bottom: m, left: m, right: m, background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toBuffer();
  }
  return { W, H, marges, remplissage, transparent, besoin, out };
}

async function download(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

async function main() {
  const parts = (await allParts()).filter((p) => !ONLY || ONLY.has(p.id));
  const report = [];
  const avantApres = [];
  let vues = 0;
  for (const p of parts) {
    if (report.filter((r) => r.aRecadrer).length >= LIMIT) break;
    const urls = urlsOf(p);
    if (urls.length === 0) continue;
    const photos = [];
    for (const u of urls) {
      try {
        const buf = await download(u);
        const a = await analyse(buf);
        photos.push({ url: u, buf, ...a });
        vues++;
      } catch (e) { photos.push({ url: u, erreur: e.message }); }
    }
    const aRecadrer = photos.some((f) => f.besoin);
    const opaques = photos.filter((f) => f.transparent === false).length;
    const erreurs = photos.filter((f) => f.erreur).length;
    report.push({
      id: p.id, slug: p.slug, nom: p.name, photos: photos.length, aRecadrer, opaques, erreurs,
      remplissageAvant: photos[0]?.remplissage ? Math.round(100 * Math.max(photos[0].remplissage.h, photos[0].remplissage.l)) : null,
    });
    if (aRecadrer && avantApres.length < 24 && photos[0]?.besoin) avantApres.push({ nom: p.name, avant: photos[0].buf, apres: photos[0].out });

    if (MODE === 'write' && aRecadrer && erreurs === 0) {
      const env = Object.fromEntries(readFileSync(resolve(ROOT, '.env'), 'utf-8').split('\n').map((l) => l.match(/^([A-Z_]+)=["']?([^"'\r\n]*)/)).filter(Boolean).map((m) => [m[1], m[2]]));
      // Photos non recadrées de la même pièce : renvoyées telles quelles, converties en PNG (la fonction les range en .png).
      const bufs = await Promise.all(photos.map((f) => (f.besoin ? f.out : sharp(f.buf, { failOn: 'none' }).png().toBuffer())));
      // 19/10 : UNE photo par envoi (le 1er remplace la galerie, les suivants s'ajoutent). Avant : 4 par envoi, et la
      // fonction en a accepté une partie seulement sur 2 pièces (3 photos → 1 et 2), restaurées depuis la sauvegarde.
      // Un échec en cours de galerie est signalé ÉCHEC_PARTIEL : la pièce est à restaurer depuis _bak_images_recadrage_1910.
      let ok = true;
      for (let k = 0; k < bufs.length; k++) {
        const res = await fetch(`${env.VITE_SUPABASE_URL}/functions/v1/process-images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-secret': env.ADMIN_BULK_SECRET },
          body: JSON.stringify({ entity_type: 'part', entity_id: p.id, images_base64: [bufs[k].toString('base64')], alt_base: p.name, reset: k === 0 }),
        });
        const t = await res.text();
        const nOk = (t.match(/"processed_count"\s*:\s*(\d+)/) || [])[1];
        if (!res.ok || !/"success"\s*:\s*true/.test(t) || Number(nOk) !== 1) {
          ok = false;
          console.log(`::warning title=${k === 0 ? 'ÉCHEC' : 'ÉCHEC_PARTIEL'} ${p.slug}::photo ${k + 1}/${bufs.length} · ${(bufs[k].length / 1048576).toFixed(1)} Mo · HTTP ${res.status} ${t.slice(0, 140)}`);
          break;
        }
      }
      report[report.length - 1].ecrit = ok;
    }
  }

  // Planche avant / après (contrôle visuel avant tout write)
  if (avantApres.length) {
    const C = 220, tiles = [];
    for (const [i, x] of avantApres.entries()) {
      for (const [j, b] of [x.avant, x.apres].entries()) {
        const t = await sharp(b).resize(C - 20, C - 20, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } }).flatten({ background: '#F2EFE8' }).png().toBuffer();
        tiles.push({ input: t, left: (i % 6) * (2 * C + 20) + j * C + 10, top: Math.floor(i / 6) * C + 10 });
      }
    }
    const rows = Math.ceil(avantApres.length / 6);
    await sharp({ create: { width: 6 * (2 * C + 20), height: rows * C, channels: 3, background: '#FFFFFF' } }).composite(tiles).jpeg({ quality: 80 }).toFile(resolve(OUT, 'planche.jpg'));
  }

  const n = (f) => report.filter(f).length;
  const resume = {
    mode: MODE, pieces: report.length, photosLues: vues,
    aRecadrer: n((r) => r.aRecadrer), dejaBonnes: n((r) => !r.aRecadrer && !r.opaques && !r.erreurs),
    avecFondPlein: n((r) => r.opaques > 0), avecErreur: n((r) => r.erreurs > 0),
    ecrites: n((r) => r.ecrit === true), echecsEcriture: n((r) => r.ecrit === false),
  };
  writeFileSync(resolve(OUT, `report-${MODE}.json`), JSON.stringify({ resume, report }, null, 1));
  console.log(`::notice title=recadrage ${MODE}::${JSON.stringify(resume)}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
