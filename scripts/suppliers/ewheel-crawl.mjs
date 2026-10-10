#!/usr/bin/env node
// scripts/suppliers/ewheel-crawl.mjs
// Lecture du catalogue eWheel (Shopify B2B) SANS connexion : /products.json (liste)
// puis /fr/products/<handle>.js (description) pour les catégories utiles au moteur
// de compatibilité (pneus, chambres, disques, plaquettes, chargeurs, jantes, roues).
//
// Sortie (dossier --out) :
//   ewheel-catalogue.json : [{ sku, title, handle, price_public?, available, images[], compat[] }]
//   ewheel-resume.md      : comptes (produits lus, utiles, mono-modèle, multi-modèles, sans liste)
//
// La liste de compat eWheel est en fin de description, champs séparés par « | »,
// chaque modèle sous la forme « Marque#Modèle ». Règle pt-compat-matching :
//   1 seul modèle cité  → CANDIDATE clé (à corroborer)
//   plusieurs modèles   → PISTE seulement, jamais une clé (listes commerciales, mesurées fausses le 10/10)
// Aucun secret, aucune écriture en base. Prix sans connexion = prix public éventuel, PAS le prix d'achat.
//
// Usage : node scripts/suppliers/ewheel-crawl.mjs --out ../data/fournisseurs/ewheel

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = 'https://ewheel.es';
const UTILE = /pneu|chambre|disque|plaquette|chargeur|jante|roue/i;
const HORS = /v[ée]lo|fat-?bike|ebike|machine|presse|levier/i;

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const OUT = resolve(outIdx >= 0 ? args[outIdx + 1] : './ewheel-out');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    const res = await fetch(url, { headers: { 'user-agent': 'pt-catalogue-reader/1.0', accept: 'application/json' } });
    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('json') && !ct.includes('javascript')) throw new Error(`${url} : réponse non JSON (${ct})`);
      return res.json();
    }
    if (res.status === 429 || res.status >= 500) { await sleep(2000 * i); continue; }
    throw new Error(`${url} : HTTP ${res.status}`);
  }
  throw new Error(`${url} : échec après ${tries} essais`);
}

// Format observé le 10/10/2026 : « … | Roue | Pneus |  |  |  | 94||1614660 Dualtron#Dualtron City;Kaabo#Kaabo Mantis 10 »
// → dernier segment après « || », identifiant numérique en tête, modèles séparés par « ; ».
export function parseCompat(descriptionHtml) {
  const text = String(descriptionHtml || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ');
  const cut = text.lastIndexOf('||');
  if (cut === -1) return [];
  const tail = text.slice(cut + 2).replace(/^\s*\d+\s*/, '');
  return [...new Set(
    tail.split(';')
      .map((s) => s.trim())
      .filter((s) => s.includes('#'))
      .map((s) => s.split('#').slice(1).join('#').replace(/\s+/g, ' ').trim()),
  )].filter(Boolean);
}

async function main() {
  const products = [];
  for (let page = 1; page <= 40; page++) {
    const j = await getJson(`${BASE}/fr/products.json?limit=250&page=${page}`);
    if (!j.products || j.products.length === 0) break;
    products.push(...j.products);
    await sleep(400);
  }
  if (products.length === 0) throw new Error('0 produit lu : la liste eWheel a changé ou bloque — rien n\'est écrit.');

  const utiles = products.filter((p) => UTILE.test(p.title) && !HORS.test(p.title));
  // Garde du 10/10 : sans /fr/, la liste sort en espagnol et 0 titre ne matche — un run vert vide.
  if (utiles.length === 0) throw new Error(`0 produit utile sur ${products.length} : titres pas en français ? rien n'est écrit.`);
  const rows = [];
  for (const p of utiles) {
    let compat = [];
    try {
      const d = await getJson(`${BASE}/fr/products/${p.handle}.js`);
      compat = parseCompat(d.description);
    } catch (e) {
      compat = null; // lecture ratée : on le dit, on ne l'invente pas
    }
    const v = (p.variants || [])[0] || {};
    rows.push({
      sku: v.sku || null,
      title: p.title,
      handle: p.handle,
      price_public: v.price ?? null,
      available: v.available ?? null,
      images: (p.images || []).slice(0, 3).map((i) => String(i.src).split('?')[0]),
      compat,
    });
    await sleep(250);
  }

  const mono = rows.filter((r) => Array.isArray(r.compat) && r.compat.length === 1).length;
  const multi = rows.filter((r) => Array.isArray(r.compat) && r.compat.length > 1).length;
  const sans = rows.filter((r) => Array.isArray(r.compat) && r.compat.length === 0).length;
  const rates = rows.filter((r) => r.compat === null).length;
  if (utiles.length > 0 && rates === utiles.length) throw new Error('Toutes les fiches ont échoué : rien n\'est écrit.');

  mkdirSync(OUT, { recursive: true });
  writeFileSync(resolve(OUT, 'ewheel-catalogue.json'), JSON.stringify(rows, null, 1));
  writeFileSync(
    resolve(OUT, 'ewheel-resume.md'),
    `# eWheel — lecture du ${new Date().toISOString().slice(0, 10)}\n\n` +
      `- Produits lus : ${products.length}\n- Utiles (roue, frein, charge) : ${utiles.length}\n` +
      `- Mono-modèle (candidates clé) : ${mono}\n- Multi-modèles (pistes seulement) : ${multi}\n` +
      `- Sans liste : ${sans}\n- Fiches illisibles : ${rates}\n`,
  );
  console.log(`[ewheel] ${products.length} lus · ${utiles.length} utiles · mono ${mono} · multi ${multi} · sans ${sans} · illisibles ${rates}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error('[ewheel] ÉCHEC :', e.message); process.exit(1); });
}
