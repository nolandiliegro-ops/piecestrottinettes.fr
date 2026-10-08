#!/usr/bin/env node
/**
 * scripts/agents/extract-queue.js — passe la file config/extraction-marques.json à l'extracteur.
 *
 * Usage : node scripts/agents/extract-queue.js --data-dir <dossier> [--max N]
 *   - une marque est FAITE si <data-dir>/<out>.sources.md existe → jamais refaite (pas de double dépense) ;
 *   - au plus N marques par run (défaut : max_marques_par_run de la config) ;
 *   - chaque passage est journalisé dans <data-dir>/_journal.md (date, marque, code de sortie, durée).
 * Code de sortie : 0 si toutes les marques tentées ont produit leur rapport, 1 sinon.
 */

import { readFileSync, existsSync, appendFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(`--${n}`); return i !== -1 && args[i + 1] ? args[i + 1] : d; };

const cfg = JSON.parse(readFileSync(resolve(ROOT, 'config/extraction-marques.json'), 'utf-8'));
const dataDir = resolve(process.cwd(), opt('data-dir', 'extraction'));
const max = Number(opt('max', String(cfg.max_marques_par_run ?? 1)));
mkdirSync(dataDir, { recursive: true });

const todo = (cfg.file || []).filter((it) => !existsSync(resolve(dataDir, `${it.out}.sources.md`)));
const batch = todo.slice(0, Math.max(0, max));
console.log(`File : ${cfg.file.length} marques · déjà faites : ${cfg.file.length - todo.length} · ce run : ${batch.map((b) => b.brand).join(', ') || 'rien'}`);

let failed = 0;
for (const it of batch) {
  const a = ['scripts/agents/extract-brand.js', '--brand', it.brand, '--out', it.out, '--out-dir', dataDir];
  if (it.models?.length) a.push('--models', it.models.join(','));
  if (it.max_models) a.push('--max-models', String(it.max_models));
  const t0 = Date.now();
  const r = spawnSync('node', a, { cwd: ROOT, stdio: 'inherit', env: process.env });
  const ok = r.status === 0 && existsSync(resolve(dataDir, `${it.out}.sources.md`));
  if (!ok) failed++;
  appendFileSync(resolve(dataDir, '_journal.md'),
    `- ${new Date().toISOString()} · ${it.brand} · ${ok ? 'OK' : `ÉCHEC (code ${r.status})`} · ${((Date.now() - t0) / 60000).toFixed(1)} min\n`);
}
console.log(`Run terminé : ${batch.length - failed}/${batch.length} marques extraites.`);
process.exit(failed ? 1 : 0);
