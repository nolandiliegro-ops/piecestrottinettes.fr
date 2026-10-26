#!/usr/bin/env node
// scripts/aplatir-blanc.mjs — 26/10/2026. Prépare les photos principales à l'AGRANDISSEMENT IA (Higgsfield upscale).
// Mesuré le 26/10 : l'agrandisseur ignore l'alpha — il remplit le fond en noir et fait réapparaître les couleurs cachées
// sous les pixels transparents (traînées de la K100). Donc : photo nettoyée (photo-qualite) puis posée sur BLANC, RGB des
// pixels transparents compris. Sortie out/aplat/<slug>.png, servie par raw.githubusercontent.com (branche donnees-photos).
// Après agrandissement, la chaîne photos-galerie re-détoure (image non transparente), nettoie, recadre et juge.
//   node scripts/aplatir-blanc.mjs --slugs a,b,c        (lecture seule en base)
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ameliorerEtJuger } from './lib/photo-qualite.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'out/aplat'); mkdirSync(OUT, { recursive: true });
const i = process.argv.indexOf('--slugs'); const SLUGS = i > 0 ? process.argv[i + 1].split(',') : [];
const client = readFileSync(resolve(ROOT, 'src/integrations/supabase/client.ts'), 'utf-8');
const SB = (client.match(/VITE_SUPABASE_URL\s*\|\|\s*"([^"]+)"/) || [])[1];
const ANON = (client.match(/VITE_SUPABASE_PUBLISHABLE_KEY\s*\|\|\s*"([^"]+)"/) || [])[1];

const rows = await (await fetch(`${SB}/rest/v1/scooter_models?select=slug,image_url&published=eq.true&slug=in.(${SLUGS.join(',')})`, { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } })).json();
if (!Array.isArray(rows) || rows.length !== SLUGS.length) { console.log(`::error title=aplat::${Array.isArray(rows) ? rows.length : 0}/${SLUGS.length} fiches lues`); process.exit(1); }
const res = [];
for (const r of rows) {
  try {
    const buf = Buffer.from(await (await fetch(r.image_url)).arrayBuffer());
    const q = await ameliorerEtJuger(buf);
    const { width, height } = await sharp(q.buf).metadata();
    await sharp(q.buf).flatten({ background: '#ffffff' }).png().toFile(resolve(OUT, `${r.slug}.png`));
    res.push({ slug: r.slug, width, height });
  } catch (e) { res.push({ slug: r.slug, erreur: e.message }); }
}
writeFileSync(resolve(OUT, 'aplat.json'), JSON.stringify(res, null, 1));
console.log(`::notice title=aplat::${res.filter((x) => !x.erreur).length}/${res.length} images sur fond blanc`);
