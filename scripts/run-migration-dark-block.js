#!/usr/bin/env node
/**
 * scripts/run-migration-dark-block.js
 *
 * Sanity check apres application de
 *   scripts/migrations/add_dark_block_color.sql
 * via Lovable (le DDL ne peut pas etre execute via PostgREST).
 *
 * Verifie :
 *  - la colonne dark_block_color existe et est accessible (RLS public SELECT)
 *  - sa valeur est un hex non null (defaut '#3A3A3A')
 *
 * Usage :
 *   node scripts/run-migration-dark-block.js
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = resolve(__dirname, '../.env');
  let content;
  try {
    content = readFileSync(envPath, 'utf-8');
  } catch {
    console.error('.env introuvable :', envPath);
    process.exit(1);
  }
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
  const ANON_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !ANON_KEY) {
    console.error('Variables manquantes : VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY');
    process.exit(1);
  }

  console.log('-> Sanity check dark_block_color...');

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/home_bridge_settings?select=id,dark_block_color,watermark_text`,
    {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
    },
  );

  if (!res.ok) {
    const text = await res.text();
    console.error(`HTTP ${res.status} — la migration a-t-elle ete appliquee ?`);
    console.error(text);
    process.exit(1);
  }

  const rows = await res.json();
  if (rows.length === 0) {
    console.error('Aucune row dans home_bridge_settings.');
    process.exit(1);
  }

  const r = rows[0];
  if (typeof r.dark_block_color !== 'string') {
    console.error(`Colonne dark_block_color manquante ou null. Recu :`, r);
    console.error('La migration n\'a pas ete appliquee, ou la colonne porte un autre nom.');
    process.exit(1);
  }

  console.log('   Colonne presente ');
  console.log(`   - id               : ${r.id}`);
  console.log(`   - dark_block_color : ${r.dark_block_color}`);
  console.log(`   - watermark_text   : ${r.watermark_text}`);
  console.log('\nTermine.');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
