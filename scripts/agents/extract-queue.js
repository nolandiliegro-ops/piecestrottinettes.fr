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

// Faite = rapport présent ET au moins un modèle traité (une marque sortie vide se refait).
const done = (it) => {
  try { return (JSON.parse(readFileSync(resolve(dataDir, `${it.out}.draft.json`), 'utf-8')).results || []).length > 0; }
  catch { return false; }
};
// Mode AJOUT (décision 09/10) : chaque marque déjà extraite reçoit N modèles de plus, une seule fois.
const ADD = Number(cfg.ajout_modeles || 0);
const draftOf = (it) => { try { return JSON.parse(readFileSync(resolve(dataDir, `${it.out}.draft.json`), 'utf-8')); } catch { return null; } };
const addDone = (it) => { const d = draftOf(it); return !d || !(d.results || []).length || Boolean(d.ajout); };
const todo = (cfg.file || []).filter((it) => (ADD ? !addDone(it) : !done(it)));
const batch = todo.slice(0, Math.max(0, max));
console.log(`File : ${cfg.file.length} marques · déjà faites : ${cfg.file.length - todo.length} · ce run : ${batch.map((b) => b.brand).join(', ') || 'rien'}`);

let failed = 0;
let lastWhy = null;
let attempted = 0;
for (const it of batch) {
  attempted++;
  const a = ['scripts/agents/extract-brand.js', '--brand', it.brand, '--out', it.out, '--out-dir', dataDir];
  if (it.models?.length) a.push('--models', it.models.join(','));
  if (it.max_models) a.push('--max-models', String(it.max_models));
  if (ADD) a.push('--add-models', String(ADD));
  const t0 = Date.now();
  const r = spawnSync('node', a, { cwd: ROOT, stdio: ['ignore', 'inherit', 'pipe'], env: process.env, encoding: 'utf-8' });
  if (r.stderr) process.stderr.write(r.stderr);
  const ok = r.status === 0 && (ADD ? Boolean(draftOf(it)?.ajout) : done(it));
  // La cause de l'échec va au journal (le log brut GitHub n'est pas lisible depuis la session Claude)
  const why = ok ? '' : ` · ${(r.stderr || '').replace(/\s+/g, ' ').trim().slice(-300) || 'aucun modèle traité'}`;
  appendFileSync(resolve(dataDir, '_journal.md'),
    `- ${new Date().toISOString()} · ${it.brand}${ADD ? ` · AJOUT +${ADD}` : ''} · ${ok ? 'OK' : `ÉCHEC (code ${r.status})`} · ${((Date.now() - t0) / 60000).toFixed(1)} min${why}\n`);
  if (!ok) {
    failed++;
    // Deux échecs de suite avec la même cause = panne générale (crédit, clé) : on arrête, on ne brûle pas la file
    // Signature calculée sur la sortie COMPLÈTE, identifiants de requête et noms de modèle retirés
    const sig = (r.stderr || '').replace(/req_[A-Za-z0-9]+/g, '').replace(/[✖❌]\s*[^:]+:/g, '').replace(/\s+/g, ' ').trim().slice(-200);
    if (why && sig === lastWhy) { console.log('Deux échecs identiques de suite : arrêt du run.'); break; }
    lastWhy = sig;
  } else lastWhy = null;
}
console.log(`Run terminé : ${attempted - failed}/${attempted} marques extraites (${batch.length - attempted} non tentées).`);
process.exit(failed ? 1 : 0);
