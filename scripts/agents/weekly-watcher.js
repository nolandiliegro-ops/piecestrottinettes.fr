#!/usr/bin/env node
/**
 * Le Veilleur — Agent autonome de veille hebdomadaire
 *
 * Orchestration :
 *  1. Lit la dernière run dans watcher_runs (since)
 *  2. Crée une nouvelle ligne watcher_runs status='running'
 *  3. Pour chaque marque : searchNewScooters → score → dédup → bulk-insert-scooters (published=false)
 *  4. Pour chaque fournisseur : searchNewParts → score → dédup → bulk-insert-parts (published=false)
 *  5. Si pièces ajoutées : invoke retrigger-compatibility-matching {all_unmatched:true}
 *  6. Update watcher_runs status='success'|'partial'|'failed' + stats
 *  7. Envoie rapport email via Resend
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getLastSuccessDate,
  logRunStart,
  logRunComplete,
  logRunFail,
  fetchExistingSlugs,
  invokeEdgeFunction,
} from './lib/supabase-rest.js';
import { scoreScooter, scorePart } from './lib/scoring.js';
import { searchNewScooters, searchNewParts } from './lib/anthropic-client.js';
import { sendWatcherReport } from './lib/resend-mailer.js';
import { buildScooterSlug, buildPartSlug } from './lib/slugify.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'config', 'watcher-sources.json'), 'utf-8')
);

const startedAt = Date.now();
const errors = [];
const insertedScooters = [];
const insertedParts = [];
let stats = {
  scooters_found: 0,
  parts_found: 0,
  scooters_inserted: 0,
  parts_inserted: 0,
  scooters_skipped: 0,
  parts_skipped: 0,
  errors_count: 0,
};

let runId = null;

process.on('uncaughtException', async (err) => {
  console.error('[veilleur] UNCAUGHT:', err);
  errors.push(`uncaughtException: ${err.message}`);
  await finalize('failed', err.message).catch(() => {});
  process.exit(1);
});
process.on('unhandledRejection', async (reason) => {
  console.error('[veilleur] UNHANDLED:', reason);
  errors.push(`unhandledRejection: ${String(reason)}`);
  await finalize('failed', String(reason)).catch(() => {});
  process.exit(1);
});

async function getSinceDate() {
  try {
    const d = await getLastSuccessDate();
    if (d) return d;
  } catch (e) {
    console.warn('[veilleur] getSinceDate fallback:', e.message);
  }
  // Fallback : 7 jours en arrière
  return new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
}

async function startRun(triggeredBy) {
  return logRunStart(triggeredBy);
}

async function finalize(status, errorLog) {
  if (!runId) return;
  const duration = Math.round((Date.now() - startedAt) / 1000);
  stats.errors_count = errors.length;
  const patch = {
    status,
    duration_seconds: duration,
    ...stats,
    summary: {
      scooters: insertedScooters.slice(0, 50),
      parts: insertedParts.slice(0, 50),
      errors: errors.slice(0, 50),
    },
  };
  if (status === 'failed') {
    await logRunFail(runId, errorLog, patch);
  } else {
    await logRunComplete(runId, { ...patch, error_log: errorLog ? String(errorLog).slice(0, 5000) : null });
  }
}

async function processScooters(since) {
  console.log(`[veilleur] === PHASE 1 : Trottinettes (since ${since}) ===`);
  const existingSlugs = await fetchExistingSlugs('scooter_models');
  console.log(`[veilleur] ${existingSlugs.size} scooter slugs existants`);

  for (const brandConf of CONFIG.scooter_brands) {
    try {
      console.log(`[veilleur] → Marque ${brandConf.name}`);
      const found = await searchNewScooters({
        brand: brandConf.name,
        officialUrl: brandConf.official_url,
        since,
        model: CONFIG.anthropic.model,
        maxTokens: CONFIG.anthropic.max_tokens,
      });
      stats.scooters_found += found.length;
      console.log(`[veilleur]   ${found.length} modèles trouvés`);

      const toInsert = [];
      for (const s of found) {
        const slug = buildScooterSlug(s.brand, s.name, s.variant);
        if (existingSlugs.has(slug)) {
          stats.scooters_skipped++;
          continue;
        }
        const { score, reasons } = scoreScooter(
          s,
          CONFIG.scoring.weights,
          CONFIG.scoring.full_specs_min_fields
        );
        if (score < CONFIG.scoring.min_score_to_insert) {
          stats.scooters_skipped++;
          console.log(`[veilleur]   SKIP "${s.name}" score=${score} [${reasons.join(',')}]`);
          continue;
        }
        toInsert.push({ ...s, slug, _score: score });
      }

      if (toInsert.length === 0) continue;

      // Mapping vers le schéma attendu par bulk-insert-scooters (published=false)
      const payload = toInsert.map((s) => ({
        brand: s.brand,
        name: s.name,
        variant: s.variant || null,
        slug: s.slug,
        release_year: s.release_year || null,
        price: s.price || null,
        official_url: s.official_url || null,
        images: s.images || [],
        specs: s.specs || {},
        description: s.description || null,
        published: false,
        source: 'le-veilleur',
        score: s._score,
      }));

      try {
        const res = await invokeEdgeFunction('bulk-insert-scooters', { scooters: payload });
        const ok = res?.inserted_count ?? payload.length;
        stats.scooters_inserted += ok;
        for (const s of toInsert) {
          insertedScooters.push({ brand: s.brand, name: s.name, score: s._score });
          existingSlugs.add(s.slug);
        }
        console.log(`[veilleur]   ✅ ${ok} insérés`);
      } catch (e) {
        errors.push(`bulk-insert-scooters[${brandConf.name}]: ${e.message}`);
        console.error(`[veilleur]   ❌ insert: ${e.message}`);
      }
    } catch (e) {
      errors.push(`scooters[${brandConf.name}]: ${e.message}`);
      console.error(`[veilleur]   ❌ ${brandConf.name}: ${e.message}`);
    }
  }
}

async function processParts(since) {
  console.log(`[veilleur] === PHASE 2 : Pièces (since ${since}) ===`);
  const existingSlugs = await fetchExistingSlugs('parts');
  console.log(`[veilleur] ${existingSlugs.size} part slugs existants`);

  for (const supConf of CONFIG.parts_suppliers) {
    try {
      console.log(`[veilleur] → Fournisseur ${supConf.name}`);
      const found = await searchNewParts({
        supplier: supConf.name,
        supplierUrl: supConf.url,
        categories: supConf.categories,
        since,
        model: CONFIG.anthropic.model,
        maxTokens: CONFIG.anthropic.max_tokens,
      });
      stats.parts_found += found.length;
      console.log(`[veilleur]   ${found.length} pièces trouvées`);

      const toInsert = [];
      for (const p of found) {
        const slug = buildPartSlug(p.name, p.brand);
        if (existingSlugs.has(slug)) {
          stats.parts_skipped++;
          continue;
        }
        const { score, reasons } = scorePart(
          p,
          CONFIG.scoring.weights,
          CONFIG.scoring.full_specs_min_fields
        );
        if (score < CONFIG.scoring.min_score_to_insert) {
          stats.parts_skipped++;
          console.log(`[veilleur]   SKIP "${p.name}" score=${score} [${reasons.join(',')}]`);
          continue;
        }
        toInsert.push({ ...p, slug, _score: score, _supplier: supConf.name });
      }

      if (toInsert.length === 0) continue;

      const payload = toInsert.map((p) => ({
        name: p.name,
        brand: p.brand || null,
        sku: p.sku || null,
        category: p.category,
        slug: p.slug,
        price: p.price || null,
        stock_status: p.stock_status || 'unknown',
        official_url: p.official_url || null,
        images: p.images || [],
        description: p.description || null,
        technical_metadata: {
          ...(p.technical_metadata || {}),
          compatible_brands: p.compatible_brands || [],
          source_supplier: p._supplier,
        },
        published: false,
        source: 'le-veilleur',
        score: p._score,
      }));

      try {
        const res = await invokeEdgeFunction('bulk-insert-parts', { parts: payload });
        const ok = res?.inserted_count ?? payload.length;
        stats.parts_inserted += ok;
        for (const p of toInsert) {
          insertedParts.push({ name: p.name, brand: p.brand, supplier: p._supplier, score: p._score });
          existingSlugs.add(p.slug);
        }
        console.log(`[veilleur]   ✅ ${ok} insérés`);
      } catch (e) {
        errors.push(`bulk-insert-parts[${supConf.name}]: ${e.message}`);
        console.error(`[veilleur]   ❌ insert: ${e.message}`);
      }
    } catch (e) {
      errors.push(`parts[${supConf.name}]: ${e.message}`);
      console.error(`[veilleur]   ❌ ${supConf.name}: ${e.message}`);
    }
  }
}

async function retriggerCompatIfNeeded() {
  if (stats.parts_inserted === 0) {
    console.log('[veilleur] Aucune pièce insérée → skip retrigger-compatibility-matching');
    return;
  }
  console.log('[veilleur] === PHASE 3 : Retrigger compatibility matching ===');
  try {
    const res = await invokeEdgeFunction('retrigger-compatibility-matching', { all_unmatched: true });
    console.log(`[veilleur]   ✅ ${res.total_pieces_processed} pièces traitées, ${res.total_new_suggestions} suggestions`);
  } catch (e) {
    errors.push(`retrigger-compatibility-matching: ${e.message}`);
    console.error(`[veilleur]   ❌ ${e.message}`);
  }
}

async function main() {
  const triggeredBy = process.env.GITHUB_EVENT_NAME === 'workflow_dispatch' ? 'manual' : 'cron';
  console.log(`[veilleur] 🦅 Démarrage (${triggeredBy})`);

  const since = await getSinceDate();
  runId = await startRun(triggeredBy);
  console.log(`[veilleur] runId=${runId} since=${since}`);

  await processScooters(since);
  await processParts(since);
  await retriggerCompatIfNeeded();

  const finalStatus = errors.length === 0
    ? 'success'
    : (stats.scooters_inserted + stats.parts_inserted > 0 ? 'partial' : 'failed');

  await finalize(finalStatus, errors.length > 0 ? errors.join(' | ') : null);

  const durationSec = Math.round((Date.now() - startedAt) / 1000);
  const mailRes = await sendWatcherReport({
    runId,
    stats,
    scooters: insertedScooters,
    parts: insertedParts,
    errors,
    durationSec,
  });
  console.log('[veilleur] Email:', mailRes);

  console.log(`[veilleur] ✅ Terminé en ${durationSec}s — status=${finalStatus}`);
  console.log(`[veilleur]   scooters: ${stats.scooters_inserted}/${stats.scooters_found} | parts: ${stats.parts_inserted}/${stats.parts_found} | errors: ${errors.length}`);
}

main().catch(async (err) => {
  console.error('[veilleur] FATAL:', err);
  await finalize('failed', err.message);
  process.exit(1);
});
