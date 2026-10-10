#!/usr/bin/env node
/**
 * scripts/agents/fill-discs.js — PASSE DISQUES (lot du 09/10/2026)
 *
 * Constat mesuré le 09/10 sur 14 marques : 21 modèles sur 21 non prêts bloquent sur une clé disque
 * (entraxe 21×, trous 17×, diamètre 14×, type de frein 3×) — jamais sur le poids ni les photos.
 * Cette passe relit les brouillons existants et ne recherche QUE ces clés, sans refaire specs ni photos.
 *
 * Usage : node scripts/agents/fill-discs.js --data-dir <dossier> [--brands "kugoo,engwe"] [--model <id>]
 *         [--max-searches 8] [--max-brands N]
 *   - ne traite que les modèles dont TOUS les manques sont des clés de frein ;
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
  for (const k of ['brake', 'disc_d', 'pcd', 'holes']) if (!v[k].length) throw new Error(`Référentiel ${k} lu VIDE — arrêt.`);
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

const SYSTEM = `Tu es l'extracteur de clés de freinage de piecestrottinettes.fr (pièces détachées, marché français).
- Chaque valeur avec l'URL EXACTE de la page qui la donne, et une 2e page sur un AUTRE site qui affiche la même valeur. Sans URL : null. Ne jamais déduire ni arrondir.
- Meilleures sources : fiches de DISQUE DE RECHANGE « compatible <modèle> » (revendeurs FR, AliExpress, Amazon, boutiques de pièces) — elles affichent diamètre, nombre de trous et entraxe (« entraxe », « bolt circle », « PCD », « distance entre trous »). Puis vues éclatées / manuels constructeur.
- La page doit viser le MÊME modèle et la même génération.
- Si le modèle n'a PAS de frein à disque (frein à pied sur garde-boue, tambour, électronique seul), dis-le dans no_disc avec sa source, et laisse les clés disque à null.
- Réponds UNIQUEMENT en appelant l'outil.`;

const tool = (v) => ({
  name: 'submit_brake',
  description: 'Clés de freinage sourcées.',
  input_schema: {
    type: 'object',
    properties: {
      brake_type: F('string', { enum: [...v.brake, null] }),
      disc_diameter: F('integer'), disc_pcd: F('integer'), disc_holes: F('integer'),
      no_disc: F('string'),
    },
    required: ['brake_type', 'disc_diameter', 'disc_pcd', 'disc_holes'],
  },
});

const prompt = (name, missing, v) => `Trottinette électrique « ${name} ». Clés manquantes : ${missing.join(', ')}.
Fais plusieurs recherches DÉDIÉES, par exemple : « disque de frein ${name} », « disque ${name} 140mm 6 trous », « ${name} brake disc bolt », « ${name} disc rotor PCD ».
- brake_type : code parmi ${v.brake.join(', ')}.
- disc_diameter (mm, connus : ${v.disc_d.join('/')}), disc_pcd = entraxe des vis de fixation (mm, connus : ${v.pcd.join('/')}), disc_holes (connus : ${v.holes.join('/')}).
Une valeur hors de ces listes : renvoie-la quand même avec sa source (elle sera signalée, pas importée).`;

const takeIfEmpty = (cur, nxt) => (!cur || !cur.source_url || cur.value === null) ? nxt : cur;

async function main() {
  if (!CAP) { console.log('--plafond-tokens absent : aucun run sans plafond. Arrêt.'); return; }
  const vocab = await loadVocab();
  const files = readdirSync(DATA).filter((f) => f.endsWith('.draft.json') && !f.startsWith('vsett-banc'))
    .filter((f) => !ONLY || ONLY.includes(f.replace('.draft.json', ''))).slice(0, MAX_BRANDS);
  let filled = 0, tried = 0;
  for (const f of files) {
    const out = f.replace('.draft.json', '');
    const draft = JSON.parse(readFileSync(resolve(DATA, f), 'utf-8'));
    const before = { ...usage };
    const t0 = Date.now();
    let touched = 0, gained = 0;
    for (let i = 0; i < (draft.results || []).length; i++) {
      const r = draft.results[i];
      if (r.ready || !r.missing.length || !r.missing.every((k) => BRAKE_KEYS.includes(k))) continue;
      if (r.disc_pass?.model === MODEL) continue; // déjà passé avec ce modèle IA : jamais de double dépense
      if (usage.input_tokens + usage.output_tokens >= CAP) { console.log(`Plafond ${CAP} tokens atteint : arrêt.`); break; }
      tried++; touched++;
      try {
        const got = await claude({ system: SYSTEM, prompt: prompt(r.scooter.name, r.missing, vocab), tool: tool(vocab) });
        const keys = { ...(r.raw?.keys || {}) };
        for (const k of BRAKE_KEYS) keys[k] = takeIfEmpty(keys[k], got[k]);
        const n = assembleScooter(draft.brandName, r.scooter.name, r.raw?.specs || {}, keys, vocab);
        n.raw = { specs: r.raw?.specs, keys };
        n.disc_pass = { model: MODEL, date: new Date().toISOString().slice(0, 10), no_disc: got.no_disc?.value ? got.no_disc : null, found: Object.fromEntries(BRAKE_KEYS.map((k) => [k, got[k]?.value ?? null])) };
        draft.results[i] = n;
        if (n.ready) { gained++; filled++; }
        console.log(`  ${n.ready ? '✅' : '⚠️'} ${r.scooter.name} → ${n.ready ? 'PRÊT' : `manque ${n.missing.join(', ')}`}${n.disc_pass.no_disc ? ' · SANS DISQUE selon source' : ''}`);
      } catch (e) { console.error(`  ✖ ${r.scooter.name} : ${e.message}`); }
    }
    if (!touched) continue;
    const ready = draft.results.filter((r) => r.ready).map((r) => r.scooter);
    const prevJson = (() => { try { return JSON.parse(readFileSync(resolve(DATA, `${out}.json`), 'utf-8')); } catch { return {}; } })();
    writeFileSync(resolve(DATA, `${out}.json`), JSON.stringify({ ...prevJson, brandName: draft.brandName, scooters: ready }, null, 2));
    writeFileSync(resolve(DATA, f), JSON.stringify(draft, null, 2));
    const u = { input_tokens: usage.input_tokens - before.input_tokens, output_tokens: usage.output_tokens - before.output_tokens, web_searches: usage.web_searches - before.web_searches };
    writeFileSync(resolve(DATA, `${out}.sources.md`), sourcesReport(draft.brandName, draft.results, { date: new Date().toISOString().slice(0, 10), model: `passe disques ${MODEL}`, usage: u }));
    appendFileSync(resolve(DATA, '_journal.md'), `- ${new Date().toISOString()} · ${draft.brandName} · PASSE DISQUES · +${gained} prêt(s) sur ${touched} · ${ready.length} prêt(s) au total · ${((Date.now() - t0) / 60000).toFixed(1)} min · ${u.input_tokens} in / ${u.output_tokens} out / ${u.web_searches} rech.\n`);
  }
  console.log(`Passe disques terminée : ${filled}/${tried} modèles débloqués · ${usage.input_tokens} in / ${usage.output_tokens} out / ${usage.web_searches} recherches`);
}

main().catch((e) => { console.error('❌', e.message); process.exit(1); });
