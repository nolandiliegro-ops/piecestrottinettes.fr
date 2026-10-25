#!/usr/bin/env node
// scripts/garde-doublons-core.mjs — calibration du CŒUR utilisé par process-images (supabase/functions/_shared/empreinte-core.ts).
// Reproduit la situation de production : ORIGINAL contre ORIGINAL (empreintes stockées) ; ancienne version : miniatures
// render (?width=400&resize=contain&format=origin). Négatifs = paires des fiches publiées ; positifs = 130 copies retirées le 24/10.
// LECTURE SEULE. Sortie : out/doublons-core/calib.json. Node ≥ 22 (import .ts).
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import { promisify } from 'util';
import sharp from 'sharp';
import { empreinte, ham, iou, ecartCouleur, SEUILS } from '../supabase/functions/_shared/empreinte-core.ts';
const pexec = promisify(execFile);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'out', 'doublons-core'); mkdirSync(OUT, { recursive: true });
const client = readFileSync(resolve(ROOT, 'src/integrations/supabase/client.ts'), 'utf-8');
const SB_URL = (client.match(/VITE_SUPABASE_URL\s*\|\|\s*"([^"]+)"/) || [])[1];
const ANON = (client.match(/VITE_SUPABASE_PUBLISHABLE_KEY\s*\|\|\s*"([^"]+)"/) || [])[1];
// 25/10 (2e passe) : les miniatures render déforment les couleurs (579/3 351 photos non reconnues face à leur propre
// miniature) → la production compare ORIGINAL contre ORIGINAL (empreintes stockées dans photo_empreintes).
const mini = (u) => u;
async function get(u) {
  for (let t = 0; t < 3; t++) {
    try { const { stdout } = await pexec('curl', ['-s', '-f', '-L', '--max-time', '40', u], { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 }); if (stdout.length > 100) return stdout; } catch {}
    await new Promise((r) => setTimeout(r, 800 * (t + 1)));
  }
  throw new Error('téléchargement impossible');
}
async function fpOf(u) { const b = await get(u); const { data, info } = await sharp(b, { failOn: 'none' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return empreinte({ width: info.width, height: info.height, data }); }
const cache = new Map();
const fp = (u) => { if (!cache.has(u)) cache.set(u, fpOf(u).catch((e) => ({ err: e.message }))); return cache.get(u); };
async function rows(table) { const out = []; for (let from = 0; ; from += 1000) { const r = await fetch(`${SB_URL}/rest/v1/${table}?select=slug,images&published=eq.true&order=slug`, { headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, Range: `${from}-${from + 999}` } }); const p = await r.json(); out.push(...p); if (p.length < 1000) break; } return out; }
const urlsOf = (s) => (Array.isArray(s.images) ? [...s.images] : []).sort((a, b) => (a?.position ?? 0) - (b?.position ?? 0)).map((i) => (typeof i === 'string' ? i : i?.url)).filter(Boolean);
async function pool(items, n, f) { let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) await f(items[i++]); })); }
const fiches = [...(await rows('scooter_models')), ...(await rows('parts'))];
const pos = JSON.parse(readFileSync(resolve(ROOT, 'config/photos/calib-positifs.json'), 'utf-8'));
const jobs = new Set();
for (const s of fiches) for (const u of urlsOf(s)) { jobs.add(u); jobs.add(mini(u)); }
for (const p of pos) { jobs.add(p.retiree); for (const g of p.gardees) jobs.add(mini(g)); }
await pool([...jobs], 8, fp);
const mes = (A, B) => ({ d: ham(A.hash, B.hash), io: iou(A.mask, B.mask), c: ecartCouleur(A.hist, B.hist) });
const neg = [];
for (const s of fiches) { const us = urlsOf(s); for (let a = 0; a < us.length; a++) for (let b = 0; b < us.length; b++) { if (a === b) continue; const A = await fp(us[a]), B = await fp(mini(us[b])); if (A.err || B.err || !A.opaque || !B.opaque) continue; neg.push({ slug: s.slug, ia: a, ib: b, ...mes(A, B) }); } }
const self = []; // la photo candidate est LA MÊME que sa miniature : doit toujours être un doublon
for (const s of fiches) for (const u of urlsOf(s)) { const A = await fp(u), B = await fp(mini(u)); if (!A.err && !B.err && A.opaque && B.opaque) self.push({ slug: s.slug, ...mes(A, B) }); }
const posM = [];
for (const p of pos) { const R = await fp(p.retiree); if (R.err) continue; let best = null; for (const g of p.gardees) { const G = await fp(mini(g)); if (G.err) continue; const m = mes(R, G); if (!best || m.d < best.d) best = { slug: p.slug, ...m }; } if (best) posM.push(best); }
const flag = (s) => (q) => !(q.c !== null && q.c > s.couleur) && (q.d <= s.dhash || (q.io !== null && q.io >= s.iou && q.d <= s.dhashAvecIou));
const grille = [];
for (const dh of [4, 6, 8, 10, 12]) for (const si of [0.93, 0.95, 0.97]) for (const dhi of [10, 12, 14]) for (const cc of [4, 6, 8, 10, 12, 16]) {
  const s = { dhash: dh, iou: si, dhashAvecIou: dhi, couleur: cc }, f = flag(s);
  grille.push({ ...s, faux_positifs: neg.filter(f).length, soi_rates: self.filter((q) => !f(q)).length, copies_detectees: posM.filter(f).length });
}
grille.sort((x, y) => x.faux_positifs - y.faux_positifs || x.soi_rates - y.soi_rates || y.copies_detectees - x.copies_detectees);
const f0 = flag(SEUILS);
const hist = (arr, k) => { const h = {}; for (const q of arr) { const v = Math.round(q[k]); h[v] = (h[v] || 0) + 1; } return h; };
writeFileSync(resolve(OUT, 'calib.json'), JSON.stringify({ fiches: fiches.length, paires: neg.length, soi: self.length, copies: posM.length, erreurs: (await Promise.all([...cache.values()])).filter((x) => x.err).length, seuils: SEUILS,
  actuels: { faux_positifs: neg.filter(f0), soi_rates: self.filter((q) => !f0(q)).slice(0, 30), copies_detectees: posM.filter(f0).length },
  soi_dhash: hist(self, 'd'), soi_couleur: hist(self, 'c'), grille: grille.slice(0, 60) }, null, 1));
console.log(`::notice title=calibration cœur::${neg.length} paires · soi ${self.length} (ratés ${self.filter((q) => !f0(q)).length}) · faux positifs ${neg.filter(f0).length} · copies ${posM.filter(f0).length}/${posM.length}`);
