#!/usr/bin/env node
// READ-ONLY : construit group-B-freinage.json
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const content = readFileSync(resolve(__dirname, '../.env'), 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const m = line.match(/^([^#=][^=]*)=["']?([^"'\r\n]*)["']?/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

const env = loadEnv();
const URL = env.VITE_SUPABASE_URL;
const KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function rest(path) {
  const res = await fetch(`${URL}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${path} :: ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

const DISQUES = '33300187-0bb5-4467-96d0-8076cdfbfd4f';
const PLAQUETTES = '5e58939f-d061-4d67-8c95-4be337dfe3e3';

const groupA = JSON.parse(readFileSync(resolve(__dirname, 'data/groupA-brake-partids.json'), 'utf-8'));
const gaSet = new Set(groupA.part_ids);

// 1. all published brake parts
const fields = 'id,sku,name,description,ean,image_url,images,characteristics,attributes,technical_metadata,category_id,published';
const parts = await rest(
  `parts?category_id=in.(${DISQUES},${PLAQUETTES})&published=eq.true&select=${fields}&order=sku`
);
console.log('Published brake parts total:', parts.length);

// 2. compat counts
const ids = parts.map((p) => p.id);
const compat = await rest(`part_compatibility?part_id=in.(${ids.join(',')})&select=part_id`);
const compatCount = {};
for (const c of compat) compatCount[c.part_id] = (compatCount[c.part_id] || 0) + 1;

// 3. classify
const inA = parts.filter((p) => gaSet.has(p.id));
const zeroCompatNonA = parts.filter((p) => !gaSet.has(p.id) && !compatCount[p.id]);
const withCompatNonA = parts.filter((p) => !gaSet.has(p.id) && compatCount[p.id]);

console.log('  - in Group A:', inA.length);
console.log('  - NOT in A & 0 compat (=> Group B):', zeroCompatNonA.length);
console.log('  - NOT in A & has compat:', withCompatNonA.length, withCompatNonA.map(p=>`${p.sku}:${compatCount[p.id]}`).join(' '));

// ---- extraction helpers ----
function textBlob(p) {
  const parts = [p.name, p.description, p.characteristics];
  if (p.attributes && typeof p.attributes === 'object') parts.push(JSON.stringify(p.attributes));
  if (p.technical_metadata && typeof p.technical_metadata === 'object') parts.push(JSON.stringify(p.technical_metadata));
  return parts.filter(Boolean).join(' \n ');
}
function extractCotes(blob) {
  const set = new Set();
  const re = /(\d{1,4}(?:[.,]\d{1,2})?)\s?mm\b/gi;
  let m;
  while ((m = re.exec(blob)) !== null) set.add(m[1].replace(',', '.') + 'mm');
  return [...set];
}
const BRANDS = ['Magura','Hope','SRAM','Avid','Shimano','Zoom','Nutt','Xtech','Logan','Hydraulic','Nami','Tektro','Clarks','Galfer','Brembo'];
function extractRefEtrier(blob) {
  const found = new Set();
  for (const b of BRANDS) {
    const re = new RegExp(`\\b${b}\\b[\\w\\-/ ]{0,20}`, 'i');
    const m = blob.match(re);
    if (m) found.add(m[0].trim());
  }
  return [...found];
}
function firstImage(p) {
  if (p.image_url) return p.image_url;
  if (Array.isArray(p.images) && p.images.length) {
    const im = p.images[0];
    return typeof im === 'string' ? im : (im?.url || im?.src || null);
  }
  return null;
}

const out = zeroCompatNonA.map((p) => {
  const blob = textBlob(p);
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category_id === DISQUES ? 'Disques' : 'Plaquettes',
    description: p.description || null,
    ean: p.ean || null,
    cotes: extractCotes(blob),
    ref_etrier: extractRefEtrier(blob),
    image_url: firstImage(p),
  };
});

// stats
const withEan = out.filter((o) => o.ean).length;
const withCotes = out.filter((o) => o.cotes.length).length;
const withRef = out.filter((o) => o.ref_etrier.length).length;
const withImg = out.filter((o) => o.image_url).length;

const payload = {
  generated_for: 'Groupe B freinage — resolution par recherche externe (photo/EAN/cotes/ref etrier)',
  source: 'parts published, categories Disques+Plaquettes, 0 compat, hors Group A',
  count: out.length,
  stats: { with_ean: withEan, with_cotes: withCotes, with_ref_etrier: withRef, with_image: withImg },
  part_ids: out.map((o) => o.id),
  parts: out,
};

const outPath = resolve(__dirname, 'data/group-B-freinage.json');
writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf-8');
console.log('\nWritten:', outPath);
console.log('Stats:', payload.stats);
console.log('\nSKUs:', out.map((o) => o.sku).join(', '));
