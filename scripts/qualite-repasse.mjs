#!/usr/bin/env node
/**
 * Repasse QUALITÉ sur les photos de trottinettes déjà en ligne — 26/10/2026.
 * Même module que le verrou d'import (scripts/lib/photo-qualite.mjs) : nettoyage des fantômes et débris, recadrage serré.
 * Règle de Nolan (25/10 soir) : on ne dépublie RIEN ; une fiche dont la photo principale reste insuffisante (basse
 * définition, coupée) est listée « à refaire » (rangée en fin de liste, puis chasse photo), jamais retirée.
 *
 *   node scripts/qualite-repasse.mjs --dry   → out/qualite-repasse/report.json + planche-N.jpg (avant / après), AUCUNE écriture
 *   node scripts/qualite-repasse.mjs --write → process-images (galerie renvoyée dans le MÊME ORDRE, 1re avec reset),
 *                                              seulement pour les fiches où quelque chose change. Backup SQL AVANT (go Nolan).
 * Une photo est réécrite si : fantômes/débris retirés, OU marge > 7 % du plus grand côté (recadrage), OU refusée.
 * Une photo refusée (sale même nettoyée, < 500 px) quitte la galerie, sauf si c'est la seule photo de la fiche.
 * La photo principale n'est jamais retirée : si elle est refusée, la fiche part « à refaire » telle quelle.
 * Idempotent : relancé après écriture, les photos déjà nettoyées et cadrées ne changent plus (marge 4 %, 0 fantôme).
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ameliorerEtJuger, mesurerPropre, SEUILS } from './lib/photo-qualite.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'out/qualite-repasse');
mkdirSync(OUT, { recursive: true });
const MODE = process.argv.includes('--write') ? 'write' : 'dry';
const LIMIT = (() => { const i = process.argv.indexOf('--limit'); return i > 0 ? Number(process.argv[i + 1]) : Infinity; })();
const SLUGS = (() => { const i = process.argv.indexOf('--slugs'); return i > 0 ? new Set(process.argv[i + 1].split(',')) : null; })();
const MARGE_MAX = 0.07;

const client = readFileSync(resolve(ROOT, 'src/integrations/supabase/client.ts'), 'utf-8');
const SB_URL = (client.match(/VITE_SUPABASE_URL\s*\|\|\s*"([^"]+)"/) || [])[1];
const ANON = (client.match(/VITE_SUPABASE_PUBLISHABLE_KEY\s*\|\|\s*"([^"]+)"/) || [])[1];

async function scooters() {
  const r = await fetch(`${SB_URL}/rest/v1/scooter_models?select=id,name,slug,image_url,images&published=eq.true&order=name`, { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } });
  if (!r.ok) throw new Error(`lecture scooter_models HTTP ${r.status}`);
  const j = await r.json();
  if (!Array.isArray(j) || j.length < 400) throw new Error(`lecture suspecte : ${Array.isArray(j) ? j.length : 'pas une liste'} trottinettes publiées (attendu ≈ 505)`);
  return j;
}
const urlsOf = (s) => { const imgs = Array.isArray(s.images) ? [...s.images].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map((i) => i.url).filter(Boolean) : []; if (!imgs.length && s.image_url) imgs.push(s.image_url); return imgs; };

async function margeMax(buf) {
  const { data, info } = await sharp(buf, { failOn: 'none' }).ensureAlpha().resize(400, 400, { fit: 'inside' }).raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height; let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] >= 16) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return 0; const D = Math.max(W, H);
  return Math.max(y0 / D, (H - 1 - y1) / D, x0 / D, (W - 1 - x1) / D);
}

async function tuile(buf, t, rouge) {
  const img = await sharp(buf, { failOn: 'none' }).resize(230, 205, { fit: 'inside' }).png().toBuffer(); const m = await sharp(img).metadata();
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><rect width="240" height="240" fill="${rouge ? '#b98a8a' : '#8f8f8f'}"/><rect y="212" width="240" height="28" fill="#fff"/><text x="5" y="231" font-family="DejaVu Sans" font-size="12" font-weight="bold">${String(t).replace(/[&<>"]/g, '').slice(0, 34)}</text></svg>`);
  return sharp({ create: { width: 240, height: 240, channels: 3, background: '#8f8f8f' } }).composite([{ input: svg, top: 0, left: 0 }, { input: img, top: 4 + Math.round((205 - m.height) / 2), left: Math.round((240 - m.width) / 2) }]).jpeg({ quality: 76 }).toBuffer();
}

async function main() {
  const env = MODE === 'write' ? Object.fromEntries(readFileSync(resolve(ROOT, '.env'), 'utf-8').split('\n').map((l) => l.match(/^([A-Z_]+)=["']?([^"'\r\n]*)/)).filter(Boolean).map((m) => [m[1], m[2]])) : {};
  let list = await scooters();
  if (SLUGS) list = list.filter((s) => SLUGS.has(s.slug));
  list = list.slice(0, LIMIT);
  const report = []; const lignes = [];
  for (const s of list) {
    const photos = [];
    for (const [pos, u] of urlsOf(s).entries()) {
      try {
        const r = await fetch(u); if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const buf = Buffer.from(await r.arrayBuffer());
        const avant = await mesurerPropre(buf); const marge = await margeMax(buf);
        const q = await ameliorerEtJuger(buf);
        const sale = avant.fantome > SEUILS.fantome || avant.ilots >= SEUILS.ilots;
        const change = q.refus || sale || marge > MARGE_MAX;
        photos.push({ pos, url: u, buf, q, sale, marge: Math.round(marge * 1000) / 1000, change });
      } catch (e) { photos.push({ pos, url: u, erreur: e.message }); }
    }
    const transitoire = photos.some((p) => p.erreur && !/HTTP 4\d\d/.test(p.erreur));
    const ok = photos.filter((p) => !p.erreur);
    // galerie de sortie : même ordre ; refusée retirée sauf principale ou seule photo
    const sortie = ok.filter((p, k) => !p.q.refus || k === 0 || ok.length === 1);
    const retirees = ok.length - sortie.length;
    const aEcrire = !transitoire && sortie.length > 0 && (retirees > 0 || sortie.some((p) => p.change));
    const princ = ok[0];
    const aRefaire = !princ || !princ.q.principale_ok;
    report.push({
      id: s.id, slug: s.slug, nom: s.name, photos: photos.length, aEcrire, retirees, transitoire,
      principale: princ ? { defauts: princ.q.defauts, trottPx: princ.q.mesures.trottPx, sale: princ.sale, marge: princ.marge } : null,
      aRefaire, detail: photos.map((p) => ({ pos: p.pos, url: p.url, erreur: p.erreur, change: p.change, refus: p.q?.refus, defauts: p.q?.defauts, trottPx: p.q?.mesures?.trottPx })),
    });
    if (princ && (princ.change || aRefaire)) lignes.push([await tuile(princ.buf, `AVANT ${s.slug}`, false), await tuile(princ.q.buf, aRefaire ? `À REFAIRE ${princ.q.defauts.join(' ')}` : 'APRÈS', aRefaire)]);

    if (MODE === 'write' && aEcrire) {
      let envoyees = 0;
      for (let k = 0; k < sortie.length; k++) {
        await new Promise((r) => setTimeout(r, 400));
        const p = sortie[k]; const png = p.q.refus ? p.buf : p.q.buf;
        const res = await fetch(`${env.VITE_SUPABASE_URL}/functions/v1/process-images`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-secret': env.ADMIN_BULK_SECRET },
          body: JSON.stringify({ entity_type: 'scooter', entity_id: s.id, images_base64: [png.toString('base64')], alt_base: s.name, reset: k === 0 }),
        });
        let j = null; try { j = await res.json(); } catch { /* non-JSON */ }
        if (res.ok && j?.success === true && j?.processed_count > 0) envoyees++;
        else { console.log(`::warning title=${s.slug}::photo ${k} non écrite : ${j?.error ?? j?.failed_urls?.[0]?.reason ?? 'HTTP ' + res.status}`); if (k === 0) break; }
      }
      report[report.length - 1].ecrites = envoyees;
      if (envoyees !== sortie.length) console.log(`::error title=${s.slug}::${envoyees}/${sortie.length} photos écrites — à contrôler en base`);
    }
  }
  for (let p = 0; p * 10 < lignes.length; p++) {
    const part = lignes.slice(p * 10, (p + 1) * 10); const comp = [];
    part.forEach((l, i) => l.forEach((t, c) => comp.push({ input: t, left: (i % 2) * 480 + c * 240, top: Math.floor(i / 2) * 240 })));
    await sharp({ create: { width: 960, height: Math.ceil(part.length / 2) * 240, channels: 3, background: '#fff' } }).composite(comp).jpeg({ quality: 74 }).toFile(resolve(OUT, `planche-${p + 1}.jpg`));
  }
  const n = (f) => report.filter(f).length;
  const resume = {
    mode: MODE, trottinettes: report.length, photos: report.reduce((a, r) => a + r.photos, 0),
    fichesARecrire: n((r) => r.aEcrire), photosChangees: report.reduce((a, r) => a + r.detail.filter((d) => d.change).length, 0),
    photosRetirees: report.reduce((a, r) => a + r.retirees, 0), principalesARefaire: n((r) => r.aRefaire),
    transitoires: n((r) => r.transitoire), ecritesOK: MODE === 'write' ? n((r) => r.aEcrire && r.ecrites === r.photos - r.retirees) : null,
    planches: Math.ceil(lignes.length / 10),
  };
  writeFileSync(resolve(OUT, `report-${MODE}.json`), JSON.stringify({ resume, report }, null, 1));
  console.log(`::notice title=qualite-repasse::${JSON.stringify(resume)}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
