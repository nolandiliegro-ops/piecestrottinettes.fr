#!/usr/bin/env node
/**
 * scripts/agents/fill-seo-scooters.js — PASSE DESCRIPTIONS TROTTINETTES (lot du 13/10/2026)
 *
 * Mesuré le 13/10 : 146 fiches publiées, description moyenne 464 caractères (~75 mots), aucune ne
 * donne les dimensions d'usure (pneu, disque, prise, tension de charge) alors que ce sont les
 * requêtes longue traîne qui convertissent (« pneu <modèle> taille », « chargeur <modèle> »).
 *
 * Rédaction SANS recherche web, UNIQUEMENT à partir des données du catalogue (specs, clés de montage,
 * pièces compatibles réellement reliées) : zéro invention possible sur les cotes. Sortie :
 * <data-dir>/seo/trottinettes-ia.json (texte brut, paragraphes séparés par \n — format lu par
 * ScooterDescription.tsx). N'ÉCRIT RIEN EN BASE : Claude (conversation) relit et applique avec backup.
 *
 * Usage : node scripts/agents/fill-seo-scooters.js --data-dir <dossier> --plafond-tokens N
 *         [--model <id>] [--concurrence 4] [--slugs a,b] [--refaire]
 */

import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(`--${n}`); return i !== -1 && args[i + 1] ? args[i + 1] : d; };
const DATA = resolve(process.cwd(), opt('data-dir', 'extraction'));
const MODEL = opt('model', 'claude-sonnet-5-5');
const CAP = Number(opt('plafond-tokens', '0')); // GARDE-FOU : sans plafond, rien ne part
const CONC = Math.max(1, Math.min(6, Number(opt('concurrence', '4'))));
const ONLY = opt('slugs') ? opt('slugs').split(',').map((s) => s.trim()) : null;
const REDO = args.includes('--refaire');

const env = { ...process.env };
function publicSupabase() {
  try {
    const src = readFileSync(resolve(ROOT, 'src/integrations/supabase/client.ts'), 'utf-8');
    return { url: src.match(/VITE_SUPABASE_URL\s*\|\|\s*"([^"]+)"/)?.[1], key: src.match(/VITE_SUPABASE_PUBLISHABLE_KEY\s*\|\|\s*"([^"]+)"/)?.[1] };
  } catch { return {}; }
}
const pub = publicSupabase();
const SB_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL || pub.url;
const SB_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY || pub.key;
async function rest(path) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
  if (!res.ok) throw new Error(`REST ${path} → ${res.status}`);
  return res.json();
}

const usage = { input_tokens: 0, output_tokens: 0 };
async function claude({ system, prompt, tool }) {
  for (let retry = 0; retry < 4; retry++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 2500, system, messages: [{ role: 'user', content: prompt }], tools: [tool] }), // tool_choice forcé refusé par ce modèle (400 du 13/10) : consigne dans le système
    });
    if ([429, 500, 529].includes(res.status)) { await new Promise((r) => setTimeout(r, (Number(res.headers.get('retry-after')) || 30 * (retry + 1)) * 1000)); continue; }
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 400)}`);
    const data = await res.json();
    usage.input_tokens += data.usage?.input_tokens || 0;
    usage.output_tokens += data.usage?.output_tokens || 0;
    const call = (data.content || []).find((c) => c.type === 'tool_use');
    if (call) return call.input;
    const txt = (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n').trim();
    if (txt.length > 400) return { description: txt }; // repli : texte brut rendu sans outil
    throw new Error('pas d\'appel outil');
  }
  throw new Error('Anthropic indisponible après 4 essais');
}

const CHARGE_V = { 24: 29.4, 36: 42, 48: 54.6, 52: 58.8, 60: 67.2, 72: 84, 84: 100.8 };

const SYSTEM = `Tu rédiges la présentation d'une fiche trottinette sur piecestrottinettes.fr, boutique française de pièces détachées adossée à un atelier de réparation à Marseille.
La page vise : « pièces <modèle> », « pneu <modèle> », « chambre à air <modèle> », « plaquettes <modèle> », « chargeur <modèle> ».
RÈGLES :
- Utilise UNIQUEMENT les données fournies. Une donnée absente = tu n'en parles pas (jamais « environ », jamais déduit d'un modèle voisin).
- Français, tutoiement, ton direct d'atelier, phrases courtes, zéro superlatif creux, zéro prix, zéro délai, zéro promesse de garantie.
- 3 ou 4 paragraphes, 170 à 260 mots au total, texte brut (pas de HTML, pas de markdown, pas de titres) :
  1. Le modèle en une phrase claire (motorisation, batterie, usage) ;
  2. Les pièces d'usure et LEURS COTES quand elles sont fournies : taille de pneu, type (gonflable/plein), disque de frein (diamètre, entraxe, trous), plaquettes, prise de charge et tension du chargeur (tension de charge fournie) ;
  3. Conseil d'entretien concret lié à CE modèle (pression/usure pneu, rodage plaquettes, charge) ;
  4. Une phrase qui renvoie vers les pièces compatibles listées sur la fiche, en citant 2 ou 3 familles réellement présentes dans la liste fournie.
- Le nom complet du modèle apparaît 2 à 3 fois, naturellement.
Réponds UNIQUEMENT en appelant l'outil submit_description.`;

const tool = {
  name: 'submit_description',
  description: 'Présentation SEO de la fiche trottinette.',
  input_schema: { type: 'object', properties: { description: { type: 'string', description: 'Paragraphes séparés par un saut de ligne' } }, required: ['description'] },
};

async function main() {
  if (!CAP) { console.log('--plafond-tokens absent : aucun run sans plafond. Arrêt.'); return; }
  if (!env.ANTHROPIC_API_KEY || !SB_URL || !SB_KEY) { console.error('❌ ANTHROPIC_API_KEY / Supabase public absents — arrêt avant tout appel'); process.exit(1); }
  const models = await rest('scooter_models?select=id,slug,name,description,power_watts,voltage,amperage,range_km,max_speed_kmh,weight_kg,max_load_kg,tire_size,wheel_inches,tire_family,rim_type,brake_type,disc_diameter_code,disc_pcd_code,disc_holes_code,suspension,ip_rating,foldable,charge_connectors,solid_conversion,brands!scooter_models_brand_id_fkey(name)&published=eq.true&order=slug');
  if (models.length < 100) { console.log(`::error title=fill-seo-scooters::${models.length} modèles lus (attendu ≥ 100) — arrêt.`); process.exit(1); }
  // PostgREST plafonne à 1 000 lignes par requête : on pagine (mesuré le 13/10 : 1 000 lignes rendues sur > 1 600).
  const compat = [];
  for (let off = 0; ; off += 1000) {
    const page = await rest(`part_compatibility?select=scooter_model_id,parts!part_compatibility_part_id_fkey(name,published,categories!parts_category_id_fkey(name))&order=id&limit=1000&offset=${off}`);
    compat.push(...page);
    if (page.length < 1000) break;
  }
  if (compat.length < 500) { console.log(`::error title=fill-seo-scooters::${compat.length} liens de compatibilité lus (attendu ≥ 500, RLS ?) — arrêt.`); process.exit(1); }
  const partsBy = new Map();
  for (const c of compat) {
    if (!c.parts?.published) continue;
    const l = partsBy.get(c.scooter_model_id) || []; l.push(`${c.parts.categories?.name || 'Pièce'} : ${c.parts.name}`); partsBy.set(c.scooter_model_id, l);
  }

  const dir = resolve(DATA, 'seo'); mkdirSync(dir, { recursive: true });
  const outPath = resolve(dir, 'trottinettes-ia.json');
  const results = existsSync(outPath) ? JSON.parse(readFileSync(outPath, 'utf-8')) : {};
  const todo = models.filter((m) => (!ONLY || ONLY.includes(m.slug)) && (REDO || results[m.slug]?.model !== MODEL));
  console.log(`📝 Passe descriptions trottinettes — ${models.length} fiches, ${todo.length} à rédiger · ${MODEL} · plafond ${CAP} tokens`);
  const t0 = Date.now();
  let i = 0, done = 0, stop = false;
  const save = () => writeFileSync(outPath, JSON.stringify(results, null, 2));
  async function worker() {
    while (!stop && i < todo.length) {
      const m = todo[i++];
      if (usage.input_tokens + usage.output_tokens >= CAP) { if (!stop) console.log(`Plafond ${CAP} tokens atteint : arrêt.`); stop = true; break; }
      const facts = {
        modele: m.name, marque: m.brands?.name, puissance_w: m.power_watts, tension_batterie_v: m.voltage, capacite_ah: m.amperage,
        tension_de_charge_v: CHARGE_V[m.voltage] ?? null, autonomie_km: m.range_km, vitesse_max_kmh: m.max_speed_kmh, poids_kg: m.weight_kg,
        charge_max_kg: m.max_load_kg, taille_pneu: m.tire_size, roue_pouces: m.wheel_inches, type_pneu: m.tire_family, type_jante: m.rim_type,
        freinage: m.brake_type, disque_diametre_mm: m.disc_diameter_code, disque_entraxe_mm: m.disc_pcd_code, disque_trous: m.disc_holes_code,
        suspension: m.suspension, indice_ip: m.ip_rating, pliable: m.foldable, prise_de_charge: m.charge_connectors?.join(', ') || null,
        passage_pneus_pleins_possible: m.solid_conversion,
      };
      const clean = Object.fromEntries(Object.entries(facts).filter(([, v]) => v !== null && v !== undefined && v !== ''));
      const parts = (partsBy.get(m.id) || []).slice(0, 25);
      const prompt = `Données du catalogue (seules sources autorisées) :\n${JSON.stringify(clean, null, 1)}\n\nPièces compatibles reliées à ce modèle (${(partsBy.get(m.id) || []).length}) :\n${parts.map((p) => `- ${p}`).join('\n') || '- (aucune pour l\'instant)'}\n\nPrésentation actuelle (à remplacer, peut contenir des infos utiles déjà vérifiées) :\n${(m.description || '').slice(0, 900)}`;
      try {
        const got = await claude({ system: SYSTEM, prompt, tool });
        const text = String(got.description || '').replace(/<[^>]+>/g, '').replace(/\n{2,}/g, '\n').trim();
        const words = text.split(/\s+/).length;
        results[m.slug] = { description: text, words, before_chars: (m.description || '').length, parts_linked: (partsBy.get(m.id) || []).length, model: MODEL, date: new Date().toISOString().slice(0, 10) };
        done++;
        console.log(`  ✓ ${m.name} : ${words} mots (avant ${(m.description || '').length} car.)`);
        save();
      } catch (e) { console.error(`  ✖ ${m.slug} : ${e.message}`); console.log(`::warning title=fill-seo-scooters ${m.slug}::${String(e.message).slice(0, 200)}`); }
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));
  save();
  const line = `- ${new Date().toISOString()} · PASSE DESCRIPTIONS TROTTINETTES · ${done}/${todo.length} · ${((Date.now() - t0) / 60000).toFixed(1)} min · ${usage.input_tokens} in / ${usage.output_tokens} out\n`;
  appendFileSync(resolve(DATA, '_journal.md'), line);
  console.log(`::notice title=fill-seo-scooters::${line.trim()}`);
}

main().catch((e) => { console.error('❌', e.message); console.log(`::error title=fill-seo-scooters::${String(e.message).slice(0, 300)}`); process.exit(1); });
