#!/usr/bin/env node
// scripts/_test-qualite-photo.mjs — banc du contrôle qualité de détourage (26/10/2026). Lecture seule, aucun envoi, sans IA.
// Cas réels de la prod : chaque photo passe par ameliorerEtJuger ; on vérifie le verdict attendu et on produit une
// planche avant / après (out/qualite-test/planche.jpg) pour le contrôle à l'œil.
import { execFileSync } from 'child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
import { ameliorerEtJuger } from './lib/photo-qualite.mjs';

const B = 'https://kqsxscjtlipregkrmucg.supabase.co/storage/v1/object/public/scooter-photos/';
const get = (p) => execFileSync('curl', ['-s', '-f', '-L', '--max-time', '60', B + p], { maxBuffer: 128 << 20 });
mkdirSync('out/qualite-test', { recursive: true });

// attendu : 'principale' | 'galerie' | 'refus'
const CAS = [
  ['navee-k100 (traînées de pub, 600 px, collée au bord)', '4157b83b-f330-4dff-8f0e-23bc36b9a993/1792891453867_0.png', ['galerie', 'refus']],
  ['navee-e25-pro (toile carrée 2000 px pleine de vide)', 'eda559f0-7f7b-44c4-83fe-83005318f974/1792891436580_0.png', ['principale']],
  ['navee-gt5-pro (référence propre, déjà cadrée)', '3d1fc80b-431f-458d-bc02-70db5d62b26f/1792448677434_0.png', ['principale']],
  ['isinwheel-s9-pro (référence propre)', '76474606-db65-4d08-8248-0dfb2b828227/1792442259396_0.png', ['principale']],
  ['xiaomi-6-max principale 47 px (cassée)', 'de62fad3-80f7-467a-a5a6-6cd14551aa31/1792168415110_0.png', ['refus']],
  ['ninebot-f2-e-ii (450 px)', '759fe38e-1e1a-4626-a328-0d52f6e690f3/1792941746566_0.png', ['galerie', 'refus']],
];

let ok = true; const lignes = []; const rapport = [];
for (const [nom, chemin, attendu] of CAS) {
  const avant = get(chemin);
  const q = await ameliorerEtJuger(avant);
  const v = q.refus ? 'refus' : q.principale_ok ? 'principale' : 'galerie';
  const bon = attendu.includes(v);
  if (!bon) ok = false;
  console.log(`${bon ? 'OK ' : 'KO '} ${nom} → ${v}${q.defauts.length ? ' (' + q.defauts.join(', ') + ')' : ''} · trott ${q.mesures.trottPx} px · ${q.mesures.efface} px effacés`);
  rapport.push({ nom, chemin, verdict: v, attendu, defauts: q.defauts, mesures: q.mesures });
  const tuile = async (b, t) => {
    const img = await sharp(b, { failOn: 'none' }).resize(380, 380, { fit: 'inside' }).png().toBuffer(); const m = await sharp(img).metadata();
    const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="430"><rect width="400" height="430" fill="#8f8f8f"/><rect y="400" width="400" height="30" fill="#fff"/><text x="6" y="420" font-family="DejaVu Sans" font-size="13" font-weight="bold">${t.replace(/[&<>"]/g, '').slice(0, 52)}</text></svg>`);
    return sharp({ create: { width: 400, height: 430, channels: 3, background: '#8f8f8f' } }).composite([{ input: svg, top: 0, left: 0 }, { input: img, top: Math.round((400 - m.height) / 2), left: Math.round((400 - m.width) / 2) }]).jpeg({ quality: 82 }).toBuffer();
  };
  lignes.push([await tuile(avant, 'AVANT ' + nom), await tuile(q.buf, `APRÈS → ${v}`)]);
}
const comp = []; lignes.forEach((l, r) => l.forEach((t, c) => comp.push({ input: t, left: c * 400, top: r * 430 })));
await sharp({ create: { width: 800, height: lignes.length * 430, channels: 3, background: '#fff' } }).composite(comp).jpeg({ quality: 80 }).toFile('out/qualite-test/planche.jpg');
writeFileSync('out/qualite-test/report.json', JSON.stringify(rapport, null, 1));
console.log(ok ? '::notice title=qualite-test::banc OK' : '::error title=qualite-test::ÉCHEC');
process.exitCode = ok ? 0 : 1;
