#!/usr/bin/env node
/**
 * scripts/calib-doublon-chasse.mjs — calibration de l'anti-doublon CANDIDATE ↔ GALERIE EN LIGNE (25/10/2026).
 *
 * Échec mesuré le 25/10 (chasse-2510b) : 8 photos identiques à la principale en ligne sont passées, parce que la
 * candidate est RE-DÉTOURÉE depuis la source (bords, ombre, recadrage différents) alors que la photo en ligne a été
 * détourée une autre fois. Les seuils de empreinte-core (calibrés ORIGINAL contre ORIGINAL) ne voient pas ce cas.
 *
 * Mesure, LECTURE SEULE. Pour chaque image : empreinte de production (core + lib) + mesures tolérantes au détourage :
 *   - pHash 63 bits (DCT 32x32 du gris sur la boîte du produit, étiré) et pHash « carré » (boîte posée dans un carré) ;
 *   - silhouette 32x32 ÉTIRÉE sur la boîte (insensible aux marges) + rapport largeur/hauteur ;
 *   - corrélation des gris 16x16 sur la boîte.
 * Paires étiquetées (config/photos/calib-chasse-verite.json) :
 *   pos  = même image : 12 relues à l'œil + 33 photos écrites le 25/10 (candidate du lot ↔ son fichier en ligne) ;
 *   neg  = photos différentes : toutes les paires de photos des fiches publiées (galeries validées) + écrites ↔ ancienne principale ;
 *   unk  = autres paires candidate ↔ galerie et candidate ↔ candidate (à relire si une règle les signale).
 * Sortie : out/calib-chasse/paires.json (mesures par paire) + vignettes 96 px des images citées (pour la relecture).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { feats, mesures } from './lib/empreinte-tolerante.mjs';
import { cutout, download } from './lib/cutout-galerie.mjs';

const pexec = promisify(execFile);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'out', 'calib-chasse'); mkdirSync(resolve(OUT, 'v'), { recursive: true });
const client = readFileSync(resolve(ROOT, 'src/integrations/supabase/client.ts'), 'utf-8');
const SB_URL = (client.match(/VITE_SUPABASE_URL\s*\|\|\s*"([^"]+)"/) || [])[1];
const ANON = (client.match(/VITE_SUPABASE_PUBLISHABLE_KEY\s*\|\|\s*"([^"]+)"/) || [])[1];
const verite = JSON.parse(readFileSync(resolve(ROOT, 'config/photos/calib-chasse-verite.json'), 'utf-8'));
const lots = Object.fromEntries(['chasse-2510a', 'chasse-2510b'].map((l) => [l, JSON.parse(readFileSync(resolve(ROOT, 'config/photos', `${l}.json`), 'utf-8'))]));

async function get(u) {
  for (let t = 0; t < 3; t++) {
    try { const { stdout } = await pexec('curl', ['-s', '-f', '-L', '--max-time', '40', u], { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 }); if (stdout.length > 100) return stdout; } catch {}
    await new Promise((r) => setTimeout(r, 800 * (t + 1)));
  }
  throw new Error('téléchargement impossible');
}

const cache = new Map(); let nThumb = 0; const thumbs = {};
function F(key, loader) {
  if (!cache.has(key)) cache.set(key, (async () => { try { const f = await feats(await loader()); if (f) { thumbs[key] = `v/${++nThumb}.jpg`; writeFileSync(resolve(OUT, thumbs[key]), f.thumb); } return f; } catch (e) { return { err: e.message }; } })());
  return cache.get(key);
}
const online = (u) => F(u, () => get(u));
const cand = (lot, slug, i, url) => F(`${lot}|${slug}|#${i}`, () => cutout(url));
async function pool(items, n, f) { let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) await f(items[i++]); })); }

const paires = [];
const push = (lab, ka, kb, A, B, extra = {}) => { if (!A || !B || A.err || B.err) return; paires.push({ lab, a: ka, b: kb, ta: thumbs[ka], tb: thumbs[kb], ...extra, ...mesures(A, B) }); };

// 1) lots du chasseur : candidates ↔ galerie d'avant, candidates ↔ candidates
const posK = new Set(verite.pos_connus.map((p) => `${p.lot}|${p.slug}|#${p.i}|${p.courant}`));
const ecr = verite.ecrites;
const ecrSet = new Set(ecr.map((e) => `${e.lot}|${e.slug}|#${e.i}`));
const taches = [];
for (const [lot, L] of Object.entries(lots)) for (const m of L.models) {
  m.candidates.forEach((u, i) => taches.push(() => cand(lot, m.slug, i, u)));
  (m.current || []).forEach((u) => taches.push(() => online(u)));
}
ecr.forEach((e) => taches.push(() => online(e.url)));
await pool(taches, 6, (t) => t());
for (const [lot, L] of Object.entries(lots)) for (const m of L.models) {
  for (let i = 0; i < m.candidates.length; i++) {
    const ka = `${lot}|${m.slug}|#${i}`, A = await cand(lot, m.slug, i, m.candidates[i]);
    for (let k = 0; k < (m.current || []).length; k++) {
      const B = await online(m.current[k]);
      const lab = posK.has(`${ka}|${k}`) ? 'pos' : ecrSet.has(ka) && k === 0 ? 'neg' : 'unk';
      push(lab, ka, m.current[k], A, B, { slug: m.slug, type: 'cand-galerie', k });
    }
    for (let j = i + 1; j < m.candidates.length; j++) push('unk', ka, `${lot}|${m.slug}|#${j}`, A, await cand(lot, m.slug, j, m.candidates[j]), { slug: m.slug, type: 'cand-cand' });
  }
}
for (const e of ecr) { const m = lots[e.lot].models.find((x) => x.slug === e.slug); push('pos', `${e.lot}|${e.slug}|#${e.i}`, e.url, await cand(e.lot, e.slug, e.i, m.candidates[e.i]), await online(e.url), { slug: e.slug, type: 'ecrite' }); }

// 2) galeries publiées (validées par vision) : toutes les paires d'une même fiche = photos DIFFÉRENTES
async function rows(table) { const out = []; for (let from = 0; ; from += 1000) { const r = await fetch(`${SB_URL}/rest/v1/${table}?select=slug,images&published=eq.true&order=slug`, { headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, Range: `${from}-${from + 999}` } }); const p = await r.json(); out.push(...p); if (p.length < 1000) break; } return out; }
const urlsOf = (s) => (Array.isArray(s.images) ? s.images : []).map((i) => (typeof i === 'string' ? i : i?.url)).filter(Boolean);
const fiches = await rows('scooter_models');
// les fiches touchées aujourd'hui sortent du négatif « galerie validée » (leur galerie vient d'être modifiée, relue à part)
const touchees = new Set([...Object.values(lots).flatMap((L) => L.models.map((m) => m.slug))]);
const pub = fiches.filter((s) => !touchees.has(s.slug));
await pool(pub.flatMap((s) => urlsOf(s)), 8, online);
for (const s of pub) { const us = urlsOf(s); for (let a = 0; a < us.length; a++) for (let b = a + 1; b < us.length; b++) push('neg', us[a], us[b], await online(us[a]), await online(us[b]), { slug: s.slug, type: 'galerie' }); }

const err = (await Promise.all([...cache.values()])).filter((x) => x?.err).length;
writeFileSync(resolve(OUT, 'paires.json'), JSON.stringify(paires));
const c = (l) => paires.filter((p) => p.lab === l).length;
console.log(`::notice title=calib-chasse::${paires.length} paires · pos ${c('pos')} · neg ${c('neg')} · unk ${c('unk')} · images ${cache.size} (erreurs ${err})`);
