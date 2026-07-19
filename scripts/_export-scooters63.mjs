#!/usr/bin/env node
// READ-ONLY : export scooter_models -> scripts/data/scooters-63.json
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

// FK hint explicite (scooter_models_brand_id_fkey) pour éviter l'ambiguïté d'embed brands
const select =
  'slug,name,tire_size,brake_type,technical_signature,brand:brands!scooter_models_brand_id_fkey(name)';
const rows = await rest(`scooter_models?select=${select}&order=slug`);

// Récupère d'éventuelles infos frein nichées dans technical_signature
function freinFromSig(sig) {
  if (!sig || typeof sig !== 'object') return null;
  const out = {};
  for (const [k, v] of Object.entries(sig)) {
    if (/frein|brake|caliper|etrier|étrier|disc|disque|entraxe|pad|plaquet/i.test(k)) out[k] = v;
  }
  return Object.keys(out).length ? out : null;
}

const out = rows.map((r) => {
  const freinSig = freinFromSig(r.technical_signature);
  const o = {
    slug: r.slug,
    name: r.name,
    brand: r.brand?.name ?? null,
    tire_size: r.tire_size ?? null,
    brake_type: r.brake_type ?? null,
  };
  if (freinSig) o.frein_technical_signature = freinSig;
  return o;
});

const payload = {
  generated_for: 'Export read-only scooter_models (slug/name/brand/tire_size/brake_type + frein si present)',
  note: "Colonnes freinage dediees (caliper/disc/entraxe) inexistantes dans scooter_models ; seul brake_type existe. Les infos frein nichees dans technical_signature sont surfacees dans frein_technical_signature quand presentes.",
  count: out.length,
  scooters: out,
};

const outPath = resolve(__dirname, 'data/scooters-63.json');
writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf-8');
console.log('Written:', outPath);
console.log('Count:', out.length);
console.log('brake_type renseigne:', out.filter((o) => o.brake_type).length);
console.log('frein dans technical_signature:', out.filter((o) => o.frein_technical_signature).length);
