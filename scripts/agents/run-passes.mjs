#!/usr/bin/env node
// scripts/agents/run-passes.mjs — enchaîne plusieurs passes dans UN SEUL run (13/10/2026).
// Pourquoi : toutes les passes partagent la file « extracteur-marques » ; deux pushes de config
// successifs font remplacer le run en attente par le suivant. Un seul run, plusieurs passes, aucune perte.
// Lit config/passe-disques.json : soit { passe, ... } (ancien format, une passe), soit
// { passes: [ { passe, model, max_searches, plafond_tokens_run, args: [...] } ] }.
// Chaque passe garde son propre plafond de tokens ; une passe qui échoue n'arrête pas les suivantes.
import { readFileSync } from 'fs';
import { spawnSync } from 'child_process';

const DATA = process.argv[2] || '../data';
const c = JSON.parse(readFileSync('config/passe-disques.json', 'utf-8'));
const SCRIPTS = { pneus: 'fill-tires', photos: 'fill-photos', prises: 'fill-plugs', disques: 'fill-discs', 'seo-marques': 'fill-seo-brands', 'seo-trottinettes': 'fill-seo-scooters', galerie: 'fill-gallery' };
const list = Array.isArray(c.passes) ? c.passes : [{ passe: c.passe, model: c.model, max_searches: c.max_searches, max_brands: c.max_brands, plafond_tokens_run: c.plafond_tokens_run, brands: c.brands }];
let failed = 0;
for (const p of list) {
  const script = SCRIPTS[p.passe];
  if (!script) { console.log(`::error title=run-passes::passe inconnue « ${p.passe} »`); failed++; continue; }
  if (!(p.plafond_tokens_run > 0)) { console.log(`::error title=run-passes::${p.passe} sans plafond — sautée`); failed++; continue; }
  const a = ['scripts/agents/' + script + '.js', '--data-dir', DATA, '--model', p.model || 'claude-sonnet-5-5', '--max-searches', String(p.max_searches ?? 4), '--plafond-tokens', String(p.plafond_tokens_run)];
  if (p.max_brands) a.push('--max-brands', String(p.max_brands));
  if (p.brands?.length) a.push('--brands', p.brands.join(','));
  if (Array.isArray(p.args)) a.push(...p.args.map(String));
  console.log(`\n══════ PASSE ${p.passe} → node ${a.join(' ')}`);
  const r = spawnSync('node', a, { stdio: 'inherit', env: process.env });
  if (r.status !== 0) { failed++; console.log(`::warning title=run-passes::passe ${p.passe} terminée avec le code ${r.status}`); }
}
console.log(`\nPasses terminées : ${list.length - failed}/${list.length} sans erreur.`);
