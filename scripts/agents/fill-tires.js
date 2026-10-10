#!/usr/bin/env node
/**
 * scripts/agents/fill-tires.js — PASSE PNEUS + JANTE (lot du 10/10/2026)
 *
 * Constat mesuré le 10/10 : 34 modèles publiés sur 51 sans AUCUNE pièce reliée, faute de section de pneu /
 * jante (vides dans 35 brouillons). Cette passe relit les brouillons et ne cherche QUE tire_section, rim_diameter,
 * tire_family, double source toujours exigée (extract-core).
 *
 * Usage : node scripts/agents/fill-tires.js --data-dir <dossier> [--brands "kugoo,engwe"] [--model <id>]
 *         [--max-searches 8] [--max-brands N] --plafond-tokens N (obligatoire)
 *   - ne traite que les modèles PRÊTS sans section de pneu ;
 *   - un modèle déjà passé avec le même modèle IA n'est jamais repassé (pas de double dépense) ;
 *   - réécrit <out>.json / .draft.json / .sources.md et journalise dans _journal.md.
 */

import { readFileSync, writeFileSync, readdirSync, appendFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { assembleScooter, sourcesReport } from './lib/extract-core.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(`--${n}`); return i !== -1 && args[i + 1] ? args[i + 1] : d; };
const DATA = resolve(process.cwd(), opt('data-dir', 'extraction'));
const MODEL = opt('model', 'claude-sonnet-5-5');
const MAX_SEARCHES = Number(opt('max-searches', '8'));
const MAX_BRANDS = Number(opt('max-brands', '999'));
const CAP = Number(opt('plafond-tokens', '0')); // GARDE-FOU : sans plafond, rien ne part
const ONLY = opt('brands') ? opt('brands').split(',').map((s) => s.trim()) : null;
const BRAKE_KEYS = ['brake_type', 'disc_diameter', 'disc_pcd', 'disc_holes'];

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
if (!env.ANTHROPIC_API_KEY || !SB_URL || !SB_KEY) { console.error('❌ ANTHROPIC_API_KEY / Supabase public absents — arrêt avant tout appel'); process.exit(1); }

async function rest(path) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
  if (!res.ok) throw new Error(`REST ${path} → ${res.status}`);
  return res.json();
}
async function loadVocab() {
  const codes = async (t) => (await rest(`${t}?select=code`)).map((r) => String(r.code));
  const v = {
    brake_rows: await rest('fitment_brake_types?select=code,has_disc'),
    caliper: await codes('fitment_caliper_families'), rim_type: await codes('fitment_rim_types'),
    rim_d: await codes('fitment_rim_diameters'), section: await codes('fitment_tire_sections'),
    disc_d: await codes('fitment_disc_diameters'), pcd: await codes('fitment_disc_pcd'), holes: await codes('fitment_disc_holes'),
  };
  v.brake = v.brake_rows.map((r) => r.code);
  for (const k of ['brake', 'disc_d', 'pcd', 'holes', 'section', 'rim_d']) if (!v[k].length) throw new Error(`Référentiel ${k} lu VIDE — arrêt.`);
  return v;
}

const usage = { input_tokens: 0, output_tokens: 0, web_searches: 0 };
async function claude({ system, prompt, tool }) {
  const messages = [{ role: 'user', content: prompt }];
  for (let turn = 0, retry = 0; turn < 4; turn++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 6000, system, messages, tools: [tool, { type: 'web_search_20250305', name: 'web_search', max_uses: MAX_SEARCHES }] }),
    });
    if ([429, 500, 529].includes(res.status) && retry < 3) {
      const wait = Math.min(120, Number(res.headers.get('retry-after')) || 30 * (retry + 1));
      await new Promise((r) => setTimeout(r, wait * 1000)); retry++; turn--; continue;
    }
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 400)}`);
    const data = await res.json();
    usage.input_tokens += data.usage?.input_tokens || 0;
    usage.output_tokens += data.usage?.output_tokens || 0;
    usage.web_searches += data.usage?.server_tool_use?.web_search_requests || 0;
    const call = (data.content || []).find((c) => c.type === 'tool_use' && c.name === tool.name);
    if (call) return call.input;
    messages.push({ role: 'assistant', content: data.content });
    if (data.stop_reason !== 'pause_turn') messages.push({ role: 'user', content: `Conclus maintenant en appelant ${tool.name} (null + source vide pour l'introuvable).` });
  }
  throw new Error(`Aucun appel à ${tool.name} après 4 tours`);
}

const F = (type, extra = {}) => ({
  type: 'object',
  properties: {
    value: { type: [type, 'null'], ...extra },
    source_url: { type: ['string', 'null'] },
    source_url_2: { type: ['string', 'null'], description: 'DEUXIÈME page, sur un AUTRE site, même valeur' },
    source_type: { type: 'string', enum: ['constructeur', 'distributeur', 'revendeur', 'site_test', 'forum', 'inconnu'] },
  },
  required: ['value', 'source_url', 'source_type'],
});

// ─── PASSE PNEUS (10/10) : 34 modèles publiés sans aucune pièce reliée, faute de section de pneu / jante ───
const TIRE_KEYS = ['tire_section', 'rim_diameter', 'tire_family'];

const SYSTEM = `Tu es l'extracteur de clés PNEU / JANTE de piecestrottinettes.fr (pièces détachées, marché français).
- Chaque valeur avec l'URL EXACTE de la page qui la donne, et une 2e page sur un AUTRE site qui affiche la même valeur. Sans URL : null. Ne jamais déduire ni arrondir.
- Meilleures sources : fiches de PNEU ou CHAMBRE À AIR DE RECHANGE « compatible <modèle> » (revendeurs FR, Amazon, AliExpress, boutiques de pièces), puis fiche constructeur.
- Notation ETRTO « 90/65-6.5 » : section 90/65, jante 6.5. « 10x2.50 » : section 10x2.50. Chambre « 50-134 » ou « 10x2.125 sur jante 6.5 » : jante en pouces ou en mm selon la fiche.
- Le DIAMÈTRE DE JANTE se lit dans le SUFFIXE de la référence d'une pièce de rechange qui nomme le modèle : « 10x2.70-6.5 » → 6.5 · « 90/65-6.5 » → 6.5 · « 10x2.50-6 » → 6 · chambre « 50-134 » ou « diam 134mm » → 134mm. Les pouces seuls (« 10 pouces », « 10x2.125 » sans suffixe) ne donnent JAMAIS la jante : renvoie null plutôt que deviner.
- Les fournisseurs de pièces (Wattiz, e-watts, trotnation, wee-bot, scooterpassion) titrent souvent « Pneu <taille>-<jante> <modèle> » : c'est la meilleure source. « Compatible avec … » listant 20 modèles = commercial, pas une source.
- La page doit viser le MÊME modèle et la même génération (même taille de roue).
- Réponds UNIQUEMENT en appelant l'outil.`;

const tool = (v) => ({
  name: 'submit_tire',
  description: 'Clés pneu / jante sourcées.',
  input_schema: {
    type: 'object',
    properties: {
      tire_section: F('string'), rim_diameter: F('string'),
      tire_family: F('string', { enum: ['pneumatic', 'solid', null] }),
    },
    required: ['tire_section', 'rim_diameter', 'tire_family'],
  },
});

const prompt = (name, wheel, v) => `Trottinette électrique « ${name} »${wheel ? ` (roues ${wheel} pouces)` : ''}.
Trouve la SECTION DU PNEU et le DIAMÈTRE DE JANTE, plus pneu gonflable ou plein.
Fais plusieurs recherches DÉDIÉES : « pneu ${name} », « chambre à air ${name} », « ${name} tire size », « pneu compatible ${name} ».
- tire_section : code parmi ${v.section.join(', ')}.
- rim_diameter : code parmi ${v.rim_d.join(', ')}.
- tire_family : pneumatic ou solid.
Une valeur hors de ces listes : renvoie-la quand même avec sa source (elle sera signalée, pas importée).`;

const takeIfEmpty = (cur, nxt) => (!cur || !cur.source_url || cur.value === null) ? nxt : cur;

async function main() {
  if (!CAP) { console.log('--plafond-tokens absent : aucun run sans plafond. Arrêt.'); return; }
  const vocab = await loadVocab();
  const files = readdirSync(DATA).filter((f) => f.endsWith('.draft.json') && !f.startsWith('vsett-banc'))
    .filter((f) => !ONLY || ONLY.includes(f.replace('.draft.json', ''))).slice(0, MAX_BRANDS);
  let gainedAll = 0, tried = 0;
  for (const f of files) {
    const out = f.replace('.draft.json', '');
    const draft = JSON.parse(readFileSync(resolve(DATA, f), 'utf-8'));
    const before = { ...usage };
    const t0 = Date.now();
    let touched = 0, gained = 0;
    for (let i = 0; i < (draft.results || []).length; i++) {
      const r = draft.results[i];
      // Cible (corrigée le 10/10) : modèle PRÊT à qui il manque la section OU la jante. Le moteur exige les DEUX ;
      // l'ancienne cible (section seule) ignorait 7 Pure à section connue mais jante vide.
      if (!r.ready || (r.scooter.tire_section && r.scooter.rim_diameter)) continue;
      if (r.tire_pass?.model === MODEL) continue; // jamais deux fois avec le même modèle IA
      if (usage.input_tokens + usage.output_tokens >= CAP) { console.log(`Plafond ${CAP} tokens atteint : arrêt.`); break; }
      tried++; touched++;
      try {
        const got = await claude({ system: SYSTEM, prompt: prompt(r.scooter.name, r.scooter.wheel_inches, vocab), tool: tool(vocab) });
        const keys = { ...(r.raw?.keys || {}) };
        for (const k of TIRE_KEYS) keys[k] = takeIfEmpty(keys[k], got[k]);
        const n = assembleScooter(draft.brandName, r.scooter.name, r.raw?.specs || {}, keys, vocab);
        n.raw = { specs: r.raw?.specs, keys };
        if (r.disc_pass) n.disc_pass = r.disc_pass;
        n.tire_pass = { model: MODEL, date: new Date().toISOString().slice(0, 10), found: Object.fromEntries(TIRE_KEYS.map((k) => [k, got[k]?.value ?? null])) };
        draft.results[i] = n;
        const win = Boolean(n.scooter.tire_section && n.scooter.rim_diameter); // gain réel = clé roue fermée
        if (win) { gained++; gainedAll++; }
        console.log(`  ${win ? '✅' : '⚠️'} ${r.scooter.name} → section ${n.scooter.tire_section || 'non retenue'} · jante ${n.scooter.rim_diameter || 'non retenue'}`);
      } catch (e) { console.error(`  ✖ ${r.scooter.name} : ${e.message}`); }
    }
    if (!touched) continue;
    const ready = draft.results.filter((r) => r.ready).map((r) => r.scooter);
    const prevJson = (() => { try { return JSON.parse(readFileSync(resolve(DATA, `${out}.json`), 'utf-8')); } catch { return {}; } })();
    writeFileSync(resolve(DATA, `${out}.json`), JSON.stringify({ ...prevJson, brandName: draft.brandName, scooters: ready }, null, 2));
    writeFileSync(resolve(DATA, f), JSON.stringify(draft, null, 2));
    const u = { input_tokens: usage.input_tokens - before.input_tokens, output_tokens: usage.output_tokens - before.output_tokens, web_searches: usage.web_searches - before.web_searches };
    writeFileSync(resolve(DATA, `${out}.sources.md`), sourcesReport(draft.brandName, draft.results, { date: new Date().toISOString().slice(0, 10), model: `passe pneus ${MODEL}`, usage: u }));
    appendFileSync(resolve(DATA, '_journal.md'), `- ${new Date().toISOString()} · ${draft.brandName} · PASSE PNEUS · +${gained} section(s) sur ${touched} · ${((Date.now() - t0) / 60000).toFixed(1)} min · ${u.input_tokens} in / ${u.output_tokens} out / ${u.web_searches} rech.\n`);
  }
  console.log(`Passe pneus terminée : ${gainedAll}/${tried} modèles avec section · ${usage.input_tokens} in / ${usage.output_tokens} out / ${usage.web_searches} recherches`);
}

main().catch((e) => { console.error('❌', e.message); process.exit(1); });
