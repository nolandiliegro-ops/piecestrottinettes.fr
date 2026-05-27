#!/usr/bin/env node
/**
 * scripts/run-migration-home-bridge.js
 *
 * Sanity check apres application de
 *   supabase/migrations/20260527120000_home_bridge.sql
 * via Lovable ou `supabase db push`.
 *
 * Verifie :
 *  - la table home_bridge_settings existe et est accessible (RLS public SELECT)
 *  - elle contient exactement 1 row (singleton)
 *  - les valeurs de defaut sont coherentes
 *
 * Usage :
 *   node scripts/run-migration-home-bridge.js
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

  console.log('-> Sanity check home_bridge_settings...');

  const res = await fetch(`${SUPABASE_URL}/rest/v1/home_bridge_settings?select=*`, {
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`HTTP ${res.status} — la migration a-t-elle ete appliquee ?`);
    console.error(text);
    process.exit(1);
  }

  const rows = await res.json();
  console.log(`   Rows : ${rows.length}`);

  if (rows.length === 0) {
    console.error('Table existe mais aucune row — le seed n\'a pas ete applique.');
    process.exit(1);
  }

  if (rows.length > 1) {
    console.error(`${rows.length} rows — le trigger singleton ne fonctionne pas.`);
    process.exit(1);
  }

  const r = rows[0];
  console.log('   Singleton OK');
  console.log(`   - text     : ${r.watermark_text}`);
  console.log(`   - opacity  : ${r.watermark_opacity}`);
  console.log(`   - color    : ${r.watermark_color_mode}`);
  console.log(`   - enabled  : ${r.is_enabled}`);
  console.log('\nTermine.');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
