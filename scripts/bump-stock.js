#!/usr/bin/env node
/**
 * scripts/bump-stock.js
 * Script ponctuel : passe TOUTES les pièces (table `parts`) à stock_quantity = 10.
 * Usage visuel uniquement (site non lancé, pas de vente réelle).
 *
 *   node scripts/bump-stock.js
 *
 * NB : utilise la clé locale (.env, sinon fallback hardcodé de client.ts).
 * Si cette clé est anon-only, les RLS bloquent l'UPDATE : le script le détecte
 * et s'arrête proprement sans rien forcer.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Fallback hardcodé (mêmes valeurs publiques que src/integrations/supabase/client.ts)
const FALLBACK_URL = 'https://kqsxscjtlipregkrmucg.supabase.co';
const FALLBACK_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtxc3hzY2p0bGlwcmVna3JtdWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNTIzMTEsImV4cCI6MjA4MzYyODMxMX0.CGoIqbXIqfXYCa8AWrDFXfb9zruegjpg-E6MT_rPwAE';

function loadEnv() {
  const envPath = resolve(__dirname, '../.env');
  try {
    const content = readFileSync(envPath, 'utf-8');
    const env = {};
    for (const line of content.split('\n')) {
      const m = line.match(/^([^#=][^=]*)=["']?([^"'\r\n]*)["']?/);
      if (m) env[m[1].trim()] = m[2].trim();
    }
    return env;
  } catch {
    return {};
  }
}

function decodeRole(jwt) {
  try {
    const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString('utf-8'));
    return payload.role || 'inconnu';
  } catch {
    return 'inconnu';
  }
}

async function countZeroOrNull(supabase) {
  const { count, error } = await supabase
    .from('parts')
    .select('*', { count: 'exact', head: true })
    .or('stock_quantity.is.null,stock_quantity.eq.0');
  if (error) throw error;
  return count ?? 0;
}

async function countInStock(supabase) {
  const { count, error } = await supabase
    .from('parts')
    .select('*', { count: 'exact', head: true })
    .gt('stock_quantity', 0);
  if (error) throw error;
  return count ?? 0;
}

async function countTotal(supabase) {
  const { count, error } = await supabase
    .from('parts')
    .select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}

async function main() {
  const env = loadEnv();
  const SUPABASE_URL = env.VITE_SUPABASE_URL || FALLBACK_URL;
  const SUPABASE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_KEY;
  const role = decodeRole(SUPABASE_KEY);

  console.log('→ Supabase URL :', SUPABASE_URL);
  console.log('→ Rôle de la clé :', role);
  console.log('');

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ── AVANT ──
  let total, zeroBefore, inStockBefore;
  try {
    total = await countTotal(supabase);
    zeroBefore = await countZeroOrNull(supabase);
    inStockBefore = await countInStock(supabase);
  } catch (e) {
    console.error('❌ Lecture impossible :', e.message);
    process.exit(1);
  }

  console.log('===== AVANT =====');
  console.log(`Total pièces           : ${total}`);
  console.log(`En rupture (0 ou null) : ${zeroBefore}`);
  console.log(`En stock (> 0)         : ${inStockBefore}`);
  console.log('');

  // ── UPDATE toutes les lignes → 10 ──
  // Filtre universel : id (PK NOT NULL) jamais égal au UUID zéro → matche toutes les lignes.
  console.log('… UPDATE parts.stock_quantity = 10 (toutes les lignes)');
  const { data: updated, error: updateErr } = await supabase
    .from('parts')
    .update({ stock_quantity: 10 })
    .neq('id', '00000000-0000-0000-0000-000000000000')
    .select('id');

  if (updateErr) {
    console.error('');
    console.error('❌ UPDATE refusé :', updateErr.message);
    console.error(`   La clé locale est "${role}". Sans droits d'écriture (RLS), l'UPDATE est bloqué.`);
    console.error('   Rien forcé. → À faire via Lovable.');
    process.exit(2);
  }

  const affected = Array.isArray(updated) ? updated.length : 0;

  // ── APRÈS ──
  const zeroAfter = await countZeroOrNull(supabase);
  const inStockAfter = await countInStock(supabase);

  console.log('');
  console.log('===== APRÈS =====');
  console.log(`Lignes modifiées       : ${affected}`);
  console.log(`En rupture (0 ou null) : ${zeroAfter}`);
  console.log(`En stock (> 0)         : ${inStockAfter}`);
  console.log('');

  // ── Détection d'un échec silencieux RLS (0 ligne affectée alors qu'il y en avait) ──
  if (affected === 0 && total > 0) {
    console.error('⚠️  Aucune ligne modifiée alors que la table en contient.');
    console.error(`   La clé "${role}" est probablement anon-only : les RLS ont filtré l'UPDATE`);
    console.error('   (succès apparent, 0 ligne touchée). Rien forcé. → À faire via Lovable.');
    process.exit(2);
  }

  if (zeroAfter === 0 && inStockAfter === total) {
    console.log('✅ Terminé : toutes les pièces sont en stock (10).');
  } else {
    console.log('⚠️  État incohérent après UPDATE — vérifie ci-dessus.');
  }
}

main().catch((e) => {
  console.error('❌ Erreur inattendue :', e.message);
  process.exit(1);
});
