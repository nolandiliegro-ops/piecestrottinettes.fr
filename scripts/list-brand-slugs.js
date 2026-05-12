#!/usr/bin/env node
/**
 * scripts/list-brand-slugs.js
 * Liste tous les slugs d'une marque en BDD (filtre JS sur brand.slug).
 *
 * Usage :
 *   node scripts/list-brand-slugs.js
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = resolve(__dirname, '../.env');
  let content;
  try { content = readFileSync(envPath, 'utf-8'); }
  catch { console.error('❌ .env introuvable :', envPath); process.exit(1); }
  const env = {};
  for (const line of content.split('\n')) {
    const m = line.match(/^([^#=][^=]*)=["']?([^"'\r\n]*)["']?/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

async function main() {
  const env = loadEnv();

  const SUPABASE_URL = env.VITE_SUPABASE_URL;
  const ANON_KEY     = env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !ANON_KEY) {
    console.error('❌ Variables manquantes dans .env : VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY');
    process.exit(1);
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/scooter_models?select=slug,name,brand:brands(slug,name)&order=name.asc`,
    { headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` } }
  );

  if (!res.ok) {
    console.error('❌ Erreur Supabase :', res.status, await res.text());
    process.exit(1);
  }

  const rows = await res.json();
  const dualtron = rows.filter(r => r.brand?.slug === 'dualtron');

  for (const r of dualtron) {
    console.log(`  - ${r.slug} → "${r.name}"`);
  }

  console.log(`\n${dualtron.length} scooters Dualtron trouvés`);
}

main();
