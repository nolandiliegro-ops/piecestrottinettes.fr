// scripts/_smoke-read-fitment.mjs
// Lecture seule (clé anon) : état fitment_specs/published/sku des 2 pièces exemple
// de l'étape 3. Usage : node scripts/_smoke-read-fitment.mjs

import { readFileSync } from 'fs';
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
const url = env.VITE_SUPABASE_URL;
const anon = env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!url || !anon) {
  console.error('VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY manquante');
  process.exit(1);
}

const SLUGS = ['disque-frein-160-6-trous-example', 'pneu-10x2125-tubeless-example'];
const u = new URL(`${url}/rest/v1/parts`);
u.searchParams.set('select', 'slug,fitment_specs,published,sku');
u.searchParams.set('slug', `in.(${SLUGS.map((s) => `"${s}"`).join(',')})`);
u.searchParams.set('order', 'slug');
const res = await fetch(u, { headers: { apikey: anon, Authorization: `Bearer ${anon}` } });
if (!res.ok) {
  console.error(`REST parts ${res.status}: ${(await res.text()).slice(0, 200)}`);
  process.exit(1);
}
console.log(JSON.stringify(await res.json(), null, 2));
