// scripts/_list-categories.mjs
// Lecture seule : liste slug / name / spec_type des catégories (clé anon).
// Sert à vérifier les slugs référencés par scripts/lib/validate-part-keys.js.

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

const u = new URL(`${url}/rest/v1/categories`);
u.searchParams.set('select', 'slug,name,spec_type');
u.searchParams.set('order', 'slug');
const res = await fetch(u, { headers: { apikey: anon, Authorization: `Bearer ${anon}` } });
if (!res.ok) {
  console.error(`REST categories ${res.status}: ${(await res.text()).slice(0, 200)}`);
  process.exit(1);
}
for (const c of await res.json()) {
  console.log(`${c.slug}\t${c.spec_type ?? '—'}\t${c.name}`);
}
