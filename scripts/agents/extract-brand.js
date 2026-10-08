#!/usr/bin/env node
/**
 * scripts/agents/extract-brand.js — L'EXTRACTEUR DE MARQUE (lot du 08/10/2026)
 *
 * Une marque → le fichier d'import complet de sync-scooters.js, sans rien écrire en base.
 *   1. liste des modèles vendus en France (ou --models)
 *   2. par modèle : specs + poids + photos, puis clés de montage (2 appels Claude + web_search)
 *   3. relance Opus ciblée sur les seuls champs manquants (désactivable : --no-escalate)
 *   4. validation contre les référentiels fitment_* lus en base (lecture publique)
 *   5. sorties dans scripts/data/ (gitignoré) :
 *        <slug>.json          → modèles PRÊT uniquement, à passer à sync-scooters.js --publish
 *        <slug>.draft.json    → tous les modèles, manques compris
 *        <slug>.sources.md    → une URL par valeur, verdict PRÊT / MANQUE par modèle
 *
 * Usage :
 *   node scripts/agents/extract-brand.js --brand "Speedway"
 *   node scripts/agents/extract-brand.js --brand "Vsett" --models "9+,10+,11+" --out vsett-banc
 *   options : --max-models 3 · --model <id> · --escalate-model <id> · --no-escalate
 *
 * .env (racine du dépôt) : ANTHROPIC_API_KEY, VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY.
 * Aucun secret d'écriture n'est utilisé : ce script ne touche pas la base.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { slugify } from '../lib/slugify.js';
import { findMissingBrakeKeys } from '../lib/validate-brake-keys.js';
import { assembleScooter, sourcesReport } from './lib/extract-core.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

// ─── Arguments ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const opt = (name, def = null) => { const i = args.indexOf(`--${name}`); return i !== -1 && args[i + 1] ? args[i + 1] : def; };
const BRAND = opt('brand');
if (!BRAND) { console.error('Usage: node scripts/agents/extract-brand.js --brand "<Marque>" [--models "a,b"] [--max-models 3] [--out <nom>] [--no-escalate]'); process.exit(1); }
const MODELS = opt('models') ? opt('models').split(',').map((m) => m.trim()).filter(Boolean) : null;
const MAX_MODELS = Number(opt('max-models', '3'));
const MODEL = opt('model', 'claude-sonnet-5-5');
const ESCALATE_MODEL = args.includes('--no-escalate') ? null : opt('escalate-model', 'claude-opus-5-5');
const OUT = slugify(opt('out', BRAND));

// ─── .env ─────────────────────────────────────────────────────────────────────
function loadEnv() {
  let content;
  try { content = readFileSync(resolve(ROOT, '.env'), 'utf-8'); }
  catch { console.error('❌ .env introuvable à la racine du dépôt'); process.exit(1); }
  const env = {};
  for (const line of content.split('\n')) {
    const m = line.match(/^([^#=][^=]*)=["']?([^"'\r\n]*)["']?/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}
const env = { ...loadEnv(), ...process.env };
for (const k of ['ANTHROPIC_API_KEY', 'VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY']) {
  if (!env[k]) { console.error(`❌ ${k} absent du .env — arrêt avant tout appel`); process.exit(1); }
}

// ─── Lecture publique de la base (référentiels + nos titres de pièces) ────────
async function rest(path) {
  const res = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
  });
  if (!res.ok) throw new Error(`REST ${path} → ${res.status} ${await res.text()}`);
  return res.json();
}

async function loadVocab() {
  const codes = async (t) => (await rest(`${t}?select=code`)).map((r) => String(r.code));
  const vocab = {
    brake_rows: await rest('fitment_brake_types?select=code,has_disc'),
    caliper: await codes('fitment_caliper_families'),
    rim_type: await codes('fitment_rim_types'),
    rim_d: await codes('fitment_rim_diameters'),
    section: await codes('fitment_tire_sections'),
    disc_d: await codes('fitment_disc_diameters'),
    pcd: await codes('fitment_disc_pcd'),
    holes: await codes('fitment_disc_holes'),
  };
  vocab.brake = vocab.brake_rows.map((r) => r.code);
  // Garde « le silence n'est pas un succès » : un référentiel vide = lecture refusée, pas une base vide.
  for (const k of ['brake', 'caliper', 'rim_d', 'section', 'disc_d', 'pcd', 'holes']) {
    if (!vocab[k].length) throw new Error(`Référentiel ${k} lu VIDE — lecture refusée ? Arrêt.`);
  }
  return vocab;
}

async function ourPartTitles(brand) {
  const q = encodeURIComponent(`*${brand}*`);
  const rows = await rest(`parts?select=name&name=ilike.${q}&limit=60`);
  return rows.map((r) => r.name);
}

// ─── Claude + web_search, sortie forcée par tool_use ──────────────────────────
const usage = { input_tokens: 0, output_tokens: 0, web_searches: 0 };

async function claude({ model, system, prompt, tool, maxSearches = 8 }) {
  const messages = [{ role: 'user', content: prompt }];
  for (let turn = 0; turn < 4; turn++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model, max_tokens: 8000, system, messages,
        tools: [tool, { type: 'web_search_20250305', name: 'web_search', max_uses: maxSearches }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 400)}`);
    const data = await res.json();
    usage.input_tokens += data.usage?.input_tokens || 0;
    usage.output_tokens += data.usage?.output_tokens || 0;
    usage.web_searches += data.usage?.server_tool_use?.web_search_requests || 0;
    const call = (data.content || []).find((c) => c.type === 'tool_use' && c.name === tool.name);
    if (call) return call.input;
    // pause_turn (boucle de recherche longue) ou réponse texte : on relance en lui demandant de conclure
    messages.push({ role: 'assistant', content: data.content });
    if (data.stop_reason !== 'pause_turn') {
      messages.push({ role: 'user', content: `Conclus maintenant en appelant l'outil ${tool.name} avec ce que tu as trouvé (null + source vide pour l'introuvable).` });
    }
  }
  throw new Error(`Aucun appel à ${tool.name} après 4 tours`);
}

const F = (type, extra = {}) => ({
  type: 'object',
  properties: {
    value: { type: [type, 'null'], ...extra },
    source_url: { type: ['string', 'null'], description: 'URL exacte de la page qui donne cette valeur' },
    source_type: { type: 'string', enum: ['constructeur', 'distributeur', 'revendeur', 'site_test', 'forum', 'inconnu'] },
  },
  required: ['value', 'source_url', 'source_type'],
});

const SYSTEM = `Tu es l'extracteur de fiches techniques de piecestrottinettes.fr (pièces détachées de trottinettes électriques, marché français).
RÈGLES ABSOLUES :
- Chaque valeur vient avec l'URL EXACTE de la page qui la donne. Pas d'URL = value null. Ne JAMAIS déduire, arrondir ou deviner.
- La page doit correspondre au MÊME modèle, même année/génération, même taille de roue. Sinon : ignore-la.
- Ordre de confiance des sources : constructeur > distributeur officiel > revendeur spécialisé > site de test > forum.
- Contradiction entre sources : prends la majorité des sources indépendantes, préfère la fiche fournisseur de pièces pour une cote mécanique.
- Réponds UNIQUEMENT en appelant l'outil demandé.`;

const TOOL_MODELS = {
  name: 'submit_models',
  description: 'Modèles de la marque actuellement vendus en France.',
  input_schema: { type: 'object', properties: { models: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, source_url: { type: ['string', 'null'] } }, required: ['name'] } } }, required: ['models'] },
};

const TOOL_SPECS = {
  name: 'submit_specs',
  description: 'Fiche technique d\'un modèle, chaque valeur sourcée.',
  input_schema: {
    type: 'object',
    properties: {
      voltage: F('number'), amperage: F('number'), power_watts: F('number'),
      max_speed_private_kmh: F('number'), range_km: F('number'),
      weight_kg: F('number'), max_load_kg: F('number'),
      wheel_inches: F('number'), tire_size: F('string'), suspension: F('string'),
      ip_rating: F('string'), foldable: F('boolean'), year: F('number'),
      image_urls: { type: 'array', items: { type: 'string' }, description: '2 à 4 URLs DIRECTES de fichiers image (.jpg/.png/.webp) : photo produit seule sur fond neutre, fiche revendeur de préférence. Pas de collage marketing, pas de gros plan, pas de personne.' },
      description_fr: F('string'),
    },
    required: ['weight_kg', 'image_urls'],
  },
};

function toolKeys(vocab) {
  const e = (list) => ({ enum: [...list, null] });
  return {
    name: 'submit_keys',
    description: 'Clés de montage d\'un modèle (codes des référentiels), chaque valeur sourcée.',
    input_schema: {
      type: 'object',
      properties: {
        brake_type: F('string', e(vocab.brake)),
        disc_diameter: F('integer'), disc_pcd: F('integer'), disc_holes: F('integer'),
        rim_diameter: F('string', e(vocab.rim_d)),
        tire_section: F('string', e(vocab.section)),
        caliper_family: F('string', e(vocab.caliper)),
        rim_type: F('string', e(vocab.rim_type)),
        tire_family: F('string', e(['pneumatic', 'solid'])),
        solid_conversion: F('string', e(['yes', 'no'])),
      },
      required: ['brake_type', 'disc_diameter', 'disc_pcd', 'disc_holes'],
    },
  };
}

const specsPrompt = (brand, model) => `Trottinette électrique « ${brand} ${model} ».
Trouve, avec une URL source par valeur : tension (V), ampérage batterie (Ah), puissance totale moteur(s) (W), vitesse débridée/terrain privé (km/h), autonomie constructeur (km), POIDS NET (kg), charge max (kg), taille de roue (pouces), taille de pneu (texte), suspension, indice IP, pliable, année.
POIDS : poids net du produit, jamais le poids emballé/brut. Plusieurs batteries ou versions : prends le poids le PLUS LOURD. Indique source_type=site_test si la valeur vient d'un site de test/comparatif.
PHOTOS : 2 à 4 URLs directes d'images produit (og:image ou CDN de fiche revendeur).
description_fr : 2 à 3 phrases factuelles en français (moteur, batterie, pneus, freins, vitesse bridée 25 km/h), terminées par « Sur PiècesTrottinettes.fr, retrouvez toutes les pièces détachées compatibles. » ; source_url = la page principale utilisée.`;

const keysPrompt = (brand, model, titles, vocab) => `Trottinette électrique « ${brand} ${model} ». Trouve ses CLÉS DE MONTAGE, une URL source par valeur :
- brake_type (code parmi : ${vocab.brake.join(', ')}).
- disque de frein : diamètre en mm (disc_diameter), entraxe de fixation en mm (disc_pcd, valeurs connues : ${vocab.pcd.join('/')}), nombre de trous de fixation (disc_holes : ${vocab.holes.join('/')}). Les fiches de disques de rechange « compatible ${brand} ${model} » sont la meilleure source.
- tire_section et rim_diameter : la notation ETRTO « 90/65-6.5 » donne section 90/65 et jante 6.5 ; une chambre à air « 50-134 » donne jante 134mm. Codes autorisés section : ${vocab.section.join(', ')} ; jante : ${vocab.rim_d.join(', ')}.
- caliper_family : déduite de la forme de plaquette vendue « compatible ${brand} ${model} ». Codes : ${vocab.caliper.join(', ')}.
- rim_type : monobloc ou demi_jante (jante en deux parties boulonnées).
- tire_family : pneumatic ou solid. solid_conversion : yes/no SEULEMENT si une source le dit explicitement, sinon null.
Code exact absent des listes : value null (ne force jamais un code voisin).
Nos propres titres de pièces mentionnant la marque (ils sont une source valable, source_url = https://piecestrottinettes.fr) :
${titles.length ? titles.map((t) => `- ${t}`).join('\n') : '- (aucun)'}`;

// ─── Orchestration ────────────────────────────────────────────────────────────
async function extractModel(brand, model, vocab, titles) {
  console.log(`  → ${model} : specs…`);
  let specs = await claude({ model: MODEL, system: SYSTEM, prompt: specsPrompt(brand, model), tool: TOOL_SPECS });
  console.log(`  → ${model} : clés de montage…`);
  let keys = await claude({ model: MODEL, system: SYSTEM, prompt: keysPrompt(brand, model, titles, vocab), tool: toolKeys(vocab) });
  let r = assembleScooter(brand, model, specs, keys, vocab);

  if (!r.ready && ESCALATE_MODEL && r.missing.length) {
    console.log(`  ↻ ${model} : relance ${ESCALATE_MODEL} sur ${r.missing.join(', ')}`);
    const specMissing = r.missing.some((k) => ['weight_kg', 'source_image_urls'].includes(k));
    const keyMissing = r.missing.some((k) => !['weight_kg', 'source_image_urls'].includes(k));
    const focus = `\nPRIORITÉ ABSOLUE, champs restés introuvables au premier passage : ${r.missing.join(', ')}. Cherche-les spécifiquement (au moins 3 requêtes dédiées à chacun).`;
    if (specMissing) specs = { ...specs, ...pick(await claude({ model: ESCALATE_MODEL, system: SYSTEM, prompt: specsPrompt(brand, model) + focus, tool: TOOL_SPECS }), specs) };
    if (keyMissing) keys = { ...keys, ...pick(await claude({ model: ESCALATE_MODEL, system: SYSTEM, prompt: keysPrompt(brand, model, titles, vocab) + focus, tool: toolKeys(vocab) }), keys) };
    r = assembleScooter(brand, model, specs, keys, vocab);
  }
  return r;
}

/** Garde les champs de la relance seulement là où le premier passage n'avait rien de sourcé. */
function pick(second, first) {
  const out = {};
  for (const [k, v] of Object.entries(second || {})) {
    const had = first?.[k];
    const empty = !had || (Array.isArray(had) ? had.length === 0 : !had.source_url || had.value === null);
    if (empty) out[k] = v;
  }
  return out;
}

async function main() {
  const t0 = Date.now();
  console.log(`🔎 Extraction « ${BRAND} » — modèle ${MODEL}${ESCALATE_MODEL ? `, relance ${ESCALATE_MODEL}` : ''}`);
  const vocab = await loadVocab();
  const titles = await ourPartTitles(BRAND);
  console.log(`   référentiels chargés · ${titles.length} titre(s) de pièces maison mentionnant ${BRAND}`);

  let models = MODELS;
  if (!models) {
    const found = await claude({ model: MODEL, system: SYSTEM, tool: TOOL_MODELS, maxSearches: 5,
      prompt: `Liste les modèles de trottinettes électriques de la marque « ${BRAND} » actuellement vendus en France (revendeurs FR), du plus vendu au moins vendu. Un nom de modèle par entrée, sans la marque, sans variante de batterie.` });
    models = found.models.map((m) => m.name).slice(0, MAX_MODELS);
  }
  console.log(`   modèles : ${models.join(' · ')}`);

  const results = [];
  for (const m of models) {
    try { results.push(await extractModel(BRAND, m, vocab, titles)); }
    catch (e) { console.error(`  ✖ ${m} : ${e.message}`); }
  }

  const ready = results.filter((r) => r.ready).map((r) => r.scooter);
  const faults = findMissingBrakeKeys([{ brandName: BRAND, scooters: ready.filter((s) => !/^drum/.test(s.brake_type || '')) }]);
  if (faults.length) throw new Error(`Incohérence interne : modèle PRÊT sans clés disque ${JSON.stringify(faults)}`);

  const dir = resolve(ROOT, 'scripts/data');
  mkdirSync(dir, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  writeFileSync(resolve(dir, `${OUT}.json`), JSON.stringify({ brandName: BRAND, scooters: ready }, null, 2));
  writeFileSync(resolve(dir, `${OUT}.draft.json`), JSON.stringify({ brandName: BRAND, results }, null, 2));
  writeFileSync(resolve(dir, `${OUT}.sources.md`), sourcesReport(BRAND, results, { date, model: MODEL, escalated: ESCALATE_MODEL, usage }));

  const min = ((Date.now() - t0) / 60000).toFixed(1);
  console.log('\n══════════ RÉSULTAT ══════════');
  for (const r of results) console.log(`${r.ready ? '✅ PRÊT  ' : '⚠️ MANQUE'} ${r.scooter.name}${r.missing.length ? ` — ${r.missing.join(', ')}` : ''}${r.toValidate.length ? ` — à valider : ${r.toValidate.map((t) => t.key).join(', ')}` : ''}`);
  console.log(`${ready.length} PRÊT / ${results.length} · ${min} min · ${usage.input_tokens} tokens entrée, ${usage.output_tokens} sortie, ${usage.web_searches} recherches web`);
  console.log(`Fichiers : scripts/data/${OUT}.json · ${OUT}.draft.json · ${OUT}.sources.md`);
  if (ready.length) console.log(`Import : node scripts/sync-scooters.js --file scripts/data/${OUT}.json --publish`);
}

main().catch((e) => { console.error('❌', e.message); process.exit(1); });
