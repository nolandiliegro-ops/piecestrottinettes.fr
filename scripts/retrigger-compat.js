#!/usr/bin/env node
/**
 * scripts/retrigger-compat.js
 * Relance le matching de compatibilité (Passe A specs + Passe B IA)
 * sur des pièces déjà existantes en base.
 *
 * Usage :
 *   node scripts/retrigger-compat.js --skus CA-24,CA-04,CA-08
 *   node scripts/retrigger-compat.js --part-ids uuid1,uuid2
 *   node scripts/retrigger-compat.js --all-unmatched
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);

function getArg(name) {
  const idx = args.indexOf(name);
  if (idx === -1) return null;
  return args[idx + 1] ?? null;
}

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

function buildBody() {
  if (args.includes('--all-unmatched')) {
    return { all_unmatched: true };
  }
  const skus = getArg('--skus');
  if (skus) return { skus: skus.split(',').map((s) => s.trim()).filter(Boolean) };

  const ids = getArg('--part-ids');
  if (ids) return { part_ids: ids.split(',').map((s) => s.trim()).filter(Boolean) };

  console.error('❌ Usage : --skus A,B,C  |  --part-ids uuid1,uuid2  |  --all-unmatched');
  process.exit(1);
}

async function main() {
  const env = loadEnv();
  const SUPABASE_URL = env.VITE_SUPABASE_URL;
  const ADMIN_SECRET = env.ADMIN_BULK_SECRET;

  if (!SUPABASE_URL || !ADMIN_SECRET) {
    console.error('❌ Variables manquantes dans .env : VITE_SUPABASE_URL, ADMIN_BULK_SECRET');
    process.exit(1);
  }

  const body = buildBody();
  const EDGE_URL = `${SUPABASE_URL}/functions/v1/retrigger-compatibility-matching`;

  console.log(`\n→ POST ${EDGE_URL}`);
  console.log(`→ Body : ${JSON.stringify(body)}\n`);

  let result;
  try {
    const res = await fetch(EDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': ADMIN_SECRET,
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    try { result = JSON.parse(text); }
    catch { console.error('❌ Réponse non-JSON :', text); process.exit(1); }

    if (!res.ok) {
      console.error(`❌ Erreur ${res.status} :`, result?.error ?? text);
      process.exit(1);
    }
  } catch (e) {
    console.error('❌ Requête échouée :', e.message);
    process.exit(1);
  }

  console.log(`✅ Pièces traitées : ${result.total_pieces_processed}`);
  console.log(`✅ Nouvelles suggestions : ${result.total_new_suggestions}`);
  console.log(`✅ Appels IA : ${result.total_ai_calls}\n`);

  if (result.warnings?.length) {
    console.log('⚠️  Warnings :');
    for (const w of result.warnings) console.log(`   - ${w}`);
    console.log();
  }

  console.log('Détail par pièce :');
  console.log('─'.repeat(100));
  for (const r of result.results ?? []) {
    const name = (r.part_name || '').slice(0, 38).padEnd(38);
    console.log(
      `  ${name} | validated=${String(r.validated_kept).padStart(2)} ` +
      `| removed=${String(r.auto_removed).padStart(2)} ` +
      `| A=${String(r.passe_A_added).padStart(2)} ` +
      `| B=${String(r.passe_B_added).padStart(2)} ` +
      `| ai=${r.ai_status}`,
    );
  }
  console.log('─'.repeat(100));
  console.log('\nTerminé.');
}

main();
