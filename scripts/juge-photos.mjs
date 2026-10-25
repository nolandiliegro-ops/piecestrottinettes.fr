#!/usr/bin/env node
/**
 * scripts/juge-photos.mjs — audit VISION des photos de trottinettes (25/10/2026). LECTURE SEULE.
 * Passe chaque photo des trottinettes publiées (ou --slugs a,b) au juge scripts/lib/photo-juge.mjs.
 * Contrôle de calibration intégré : les 19 photos retirées le 25/10 (personne / appli) DOIVENT sortir en refus.
 * Sorties (out/juge/) : verdicts.json (une ligne par photo), fiches.json (plan de correction par fiche :
 * photos à retirer, nouvel ordre avec le 3/4 propre en tête, fiches sans 3/4 propre), refus-N.jpg, sans34-N.jpg.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import { promisify } from 'util';
import sharp from 'sharp';
import { juger, MODELE } from './lib/photo-juge.mjs';
const pexec = promisify(execFile);

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'out', 'juge');
mkdirSync(OUT, { recursive: true });
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const SLUGS = arg('--slugs')?.split(',').filter(Boolean) ?? null;
const LIMIT = Number(arg('--limit') || 0);
const DEPUIS = Number(arg('--depuis') || 0); // ronde du lundi : seulement les fiches créées depuis N jours

const client = readFileSync(resolve(ROOT, 'src/integrations/supabase/client.ts'), 'utf-8');
const SB = (client.match(/VITE_SUPABASE_URL\s*\|\|\s*"([^"]+)"/) || [])[1];
const ANON = (client.match(/VITE_SUPABASE_PUBLISHABLE_KEY\s*\|\|\s*"([^"]+)"/) || [])[1];
const H = { apikey: ANON, Authorization: `Bearer ${ANON}` };

async function get(u) {
  for (let t = 0; t < 3; t++) {
    try { const { stdout } = await pexec('curl', ['-s', '-f', '-L', '--max-time', '40', u], { encoding: 'buffer', maxBuffer: 64 << 20 }); if (stdout.length > 200) return stdout; } catch { /* nouvel essai */ }
    await new Promise((r) => setTimeout(r, 1000 * (t + 1)));
  }
  throw new Error('téléchargement impossible');
}
const urlsOf = (s) => (Array.isArray(s.images) ? [...s.images] : []).sort((a, b) => (a?.position ?? 0) - (b?.position ?? 0)).map((i) => (typeof i === 'string' ? i : i?.url)).filter(Boolean);

// 19 photos retirées le 25/10 (personne, main + appli) : contrôle de rappel du juge
const CALIB_DOSSIER = `${SB}/storage/v1/object/public/scooter-photos/`;
const CALIB = ['7b1ae49b-b47c-4b2e-b02d-b330a27c3a1c/1792892462873', '50590cd1-9cad-4724-bdbf-8260d45fbf93/1792892436599', 'd6824bc0-d2e9-43eb-aff1-a9aa01827d7a/1792892475811', 'e6127ed9-f2f1-4622-b283-9d4ca46fe3d1/1792892541080', 'e6127ed9-f2f1-4622-b283-9d4ca46fe3d1/1792892548848', '785f95dc-24ac-43cf-8880-edd402614062/1792892498878', 'e8597b33-76d7-4da6-8b9c-68bdbc83e0cc/1792892526138', 'eda559f0-7f7b-44c4-83fe-83005318f974/1792891430950', '170453b2-496c-42d1-9db0-4a86ce22abcb/1792891372329', '8c252f57-9237-4cc9-bb1c-eec6976c0ed2/1792891395188', '8c252f57-9237-4cc9-bb1c-eec6976c0ed2/1792891408038', '4157b83b-f330-4dff-8f0e-23bc36b9a993/1792891448792', '4157b83b-f330-4dff-8f0e-23bc36b9a993/1792891459434', '278a9897-9bfd-4140-9984-f9e7f17688c5/1792891465936', '926ea597-f150-4d43-bbe5-6bf1670e0e6e/1792892666119', '2449892e-e19e-4a8b-82b7-42bc20d17a4b/1792891413680', '8d5457c6-769f-45bc-abca-f5fb8d6f944b/1792892684314', '7273c19a-fd84-4b15-9f96-b5b82a43298b/1792892720139', '546154f2-c1cd-4b52-961d-23e038fb8351/1792892573688'].map((p) => `${CALIB_DOSSIER}${p}_0.png`);

let fiches = [];
for (let from = 0; ; from += 1000) {
  const q = SLUGS ? `&slug=in.(${SLUGS.join(',')})` : '&published=eq.true' + (DEPUIS ? `&created_at=gte.${new Date(Date.now() - DEPUIS * 864e5).toISOString()}` : '');
  const r = await fetch(`${SB}/rest/v1/scooter_models?select=id,slug,images,image_url${q}&order=slug`, { headers: { ...H, Range: `${from}-${from + 999}` } });
  const p = await r.json(); if (!Array.isArray(p)) throw new Error(JSON.stringify(p).slice(0, 200));
  fiches.push(...p); if (p.length < 1000) break;
}
if (!fiches.length) { if (DEPUIS) { console.log('::notice title=juge photos::aucune trottinette créée sur la période'); process.exit(0); } throw new Error('0 fiche lue (RLS ?)'); }
if (LIMIT) fiches = fiches.slice(0, LIMIT);
const taches = [...fiches.flatMap((s) => urlsOf(s).map((u, i) => ({ slug: s.slug, id: s.id, i, url: u }))), ...(SLUGS || DEPUIS ? [] : CALIB.map((u, k) => ({ slug: '_calib', i: k, url: u })))];
console.log(`${fiches.length} fiches, ${taches.length} photos à juger (modèle ${MODELE})`);

const res = []; const bufs = new Map(); let tin = 0, tout = 0, k = 0, err = 0;
await Promise.all(Array.from({ length: 6 }, async () => {
  while (k < taches.length) {
    const t = taches[k++];
    try {
      const b = await get(t.url); bufs.set(t.url, b);
      const v = await juger(b);
      tin += (v.usage?.input_tokens ?? 0) + (v.usage?.cache_read_input_tokens ?? 0); tout += v.usage?.output_tokens ?? 0;
      delete v.usage; res.push({ ...t, ...v });
    } catch (e) { err++; res.push({ ...t, erreur: e.message }); }
    if (res.length % 100 === 0) console.log(`  ${res.length}/${taches.length}`);
  }
}));

const ok = res.filter((r) => !r.erreur);
const calib = ok.filter((r) => r.slug === '_calib');
const calibRates = calib.filter((r) => !r.refus);
const plan = [];
for (const s of fiches) {
  const vs = ok.filter((r) => r.slug === s.slug).sort((a, b) => a.i - b.i);
  if (!vs.length) continue;
  const gardees = vs.filter((r) => !r.refus).sort((a, b) => a.rang_principale - b.rang_principale || a.i - b.i);
  const retirer = vs.filter((r) => r.refus).map((r) => ({ i: r.i, url: r.url, motifs: r.motifs, note: r.note }));
  const ordre = gardees.map((r) => r.url);
  const principaleActuelleOk = vs[0]?.i === 0 && vs[0].principale_ok;
  const a34 = gardees.some((r) => r.principale_ok);
  if (retirer.length || !principaleActuelleOk) plan.push({ slug: s.slug, id: s.id, avant: vs.length, retirer, ordre, change_principale: ordre[0] !== urlsOf(s)[0], a_un_34_propre: a34, restantes: ordre.length });
}
writeFileSync(resolve(OUT, 'verdicts.json'), JSON.stringify(res, null, 0));
writeFileSync(resolve(OUT, 'fiches.json'), JSON.stringify(plan, null, 1));

async function tuile(r, l1, l2, coul) {
  const W = 220, Hh = 250, b = bufs.get(r.url);
  const im = b ? await sharp(b, { failOn: 'none' }).flatten({ background: '#cfcfcf' }).resize(210, 200, { fit: 'inside' }).png().toBuffer() : null;
  const m = im ? await sharp(im).metadata() : null;
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, '').slice(0, 34);
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${Hh}"><rect width="${W}" height="${Hh}" fill="#cfcfcf"/><rect x="2" y="2" width="${W - 4}" height="${Hh - 4}" fill="none" stroke="${coul}" stroke-width="4"/><rect y="${Hh - 44}" width="${W}" height="44" fill="#fff"/><text x="5" y="${Hh - 28}" font-family="DejaVu Sans" font-size="11" font-weight="bold">${esc(l1)}</text><text x="5" y="${Hh - 10}" font-family="DejaVu Sans" font-size="11" fill="${coul}">${esc(l2)}</text></svg>`);
  const comp = [{ input: svg, top: 0, left: 0 }]; if (im) comp.push({ input: im, top: 4 + Math.round((200 - m.height) / 2), left: Math.round((W - m.width) / 2) });
  return sharp({ create: { width: W, height: Hh, channels: 3, background: '#cfcfcf' } }).composite(comp).jpeg({ quality: 72 }).toBuffer();
}
async function planches(items, nom) {
  const PER = 24, C = 6;
  for (let p = 0; p * PER < items.length; p++) {
    const part = items.slice(p * PER, (p + 1) * PER); const comp = [];
    for (const [k2, it] of part.entries()) comp.push({ input: await tuile(...it), left: (k2 % C) * 220, top: Math.floor(k2 / C) * 250 });
    await sharp({ create: { width: C * 220, height: Math.ceil(part.length / C) * 250, channels: 3, background: '#fff' } }).composite(comp).jpeg({ quality: 72 }).toFile(resolve(OUT, `${nom}-${p + 1}.jpg`));
  }
}
await planches(ok.filter((r) => r.refus && r.slug !== '_calib').map((r) => [r, `${r.slug} #${r.i}`, r.motifs.join(', '), '#c62828']), 'refus');
await planches(plan.filter((f) => !f.a_un_34_propre).flatMap((f) => ok.filter((r) => r.slug === f.slug && !r.refus).map((r) => [r, `${r.slug} #${r.i}`, r.vue, '#1565c0'])), 'sans34');

const nRefus = ok.filter((r) => r.refus && r.slug !== '_calib').length;
console.log(`::notice title=juge photos::${fiches.length} fiches · ${ok.length - calib.length} photos jugées · ${nRefus} refusées · ${plan.filter((f) => f.change_principale).length} principales à changer · ${plan.filter((f) => !f.a_un_34_propre).length} fiches sans 3/4 propre · ${err} erreur(s) · calibration ${calib.length - calibRates.length}/${calib.length} refusées · ${tin} jetons entrée, ${tout} sortie`);
if (calibRates.length) console.log(`::warning title=juge calibration::non détectées : ${calibRates.map((r) => r.url.split('/').pop() + ' (' + r.vue + ')').join(' ')}`);
if (DEPUIS && plan.length) process.exitCode = 3; // ronde : ticket à ouvrir
