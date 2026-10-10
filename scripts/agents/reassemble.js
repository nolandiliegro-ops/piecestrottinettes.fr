#!/usr/bin/env node
/**
 * scripts/agents/reassemble.js — réapplique les règles d'extract-core aux brouillons existants, SANS appel IA (0 €).
 * Usage : node scripts/agents/reassemble.js --data-dir <dossier> --vocab <vocab.json> [--dry]
 * Le vocab vient d'une lecture des tables fitment_* (format de loadVocab). --dry : compte sans écrire.
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { assembleScooter, sourcesReport } from './lib/extract-core.js';

const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(`--${n}`); return i !== -1 && args[i + 1] ? args[i + 1] : d; };
const DATA = resolve(process.cwd(), opt('data-dir', 'extraction'));
const DRY = args.includes('--dry');
const vocab = JSON.parse(readFileSync(resolve(process.cwd(), opt('vocab')), 'utf-8'));
vocab.brake = vocab.brake_rows.map((r) => r.code);
for (const k of ['brake', 'disc_d', 'pcd', 'holes']) if (!vocab[k]?.length) throw new Error(`vocab ${k} vide`);

let before = 0, after = 0, changed = [];
for (const f of readdirSync(DATA).filter((x) => x.endsWith('.draft.json') && !x.startsWith('vsett-banc'))) {
  const out = f.replace('.draft.json', '');
  const d = JSON.parse(readFileSync(resolve(DATA, f), 'utf-8'));
  let touched = false;
  d.results = (d.results || []).map((r) => {
    if (!r.raw) return r;
    before += r.ready ? 1 : 0;
    const n = assembleScooter(d.brandName, r.scooter.name, r.raw.specs || {}, r.raw.keys || {}, vocab);
    n.raw = r.raw; if (r.disc_pass) n.disc_pass = r.disc_pass;
    after += n.ready ? 1 : 0;
    if (n.ready !== r.ready) { touched = true; changed.push(`${n.scooter.name} : ${r.ready ? 'PRÊT' : 'MANQUE'} → ${n.ready ? 'PRÊT' : 'MANQUE'}`); }
    return n;
  });
  if (!touched || DRY) continue;
  const prev = (() => { try { return JSON.parse(readFileSync(resolve(DATA, `${out}.json`), 'utf-8')); } catch { return {}; } })();
  writeFileSync(resolve(DATA, `${out}.json`), JSON.stringify({ ...prev, brandName: d.brandName, scooters: d.results.filter((r) => r.ready).map((r) => r.scooter) }, null, 2));
  writeFileSync(resolve(DATA, f), JSON.stringify(d, null, 2));
  const old = readFileSync(resolve(DATA, `${out}.sources.md`), 'utf-8');
  const head = old.match(/Modèle IA : ([^\n]+?)\.\n/); const cost = old.match(/Coût mesuré : (\d+) tokens entrée, (\d+) sortie, (\d+) recherches/);
  writeFileSync(resolve(DATA, `${out}.sources.md`), sourcesReport(d.brandName, d.results, { date: new Date().toISOString().slice(0, 10), model: `${head ? head[1] : '?'} · réassemblé (règle entraxe 09/10)`, usage: cost ? { input_tokens: +cost[1], output_tokens: +cost[2], web_searches: +cost[3] } : null }));
}
console.log(changed.join('\n') || '(aucun changement)');
console.log(`Prêts : ${before} → ${after}${DRY ? ' (simulation)' : ''}`);
