#!/usr/bin/env node
/**
 * scripts/agents/fill-plugs.js — PASSE PRISES DE CHARGE (lot du 13/10/2026)
 *
 * Constat mesuré le 13/10 : 83 modèles publiés sur 146 n'ont aucune prise de charge
 * (scooter_models.charge_connectors) → aucun chargeur ni adaptateur ne leur est proposé.
 * Modèle commercial (Nolan, 13/10) : chaque trottinette = 1 chargeur à sa tension + 1 adaptateur
 * vers SA prise. La prise est donc LA clé qui manque.
 *
 * Cette passe lit en public (clé publishable) les modèles publiés sans prise, demande à Claude
 * (recherche web) la prise de charge AVEC deux pages de deux sites différents, et écrit le résultat
 * dans <data-dir>/prises/prises-ia.json + journal. N'ÉCRIT RIEN EN BASE : Claude (conversation)
 * relit et applique avec backup, seulement sur double source.
 *
 * Usage : node scripts/agents/fill-plugs.js --data-dir <dossier> --plafond-tokens N
 *         [--model <id>] [--max-searches 6] [--concurrence 3] [--slugs a,b]
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
const MAX_SEARCHES = Number(opt('max-searches', '6'));
const CAP = Number(opt('plafond-tokens', '0')); // GARDE-FOU : sans plafond, rien ne part
const CONC = Math.max(1, Math.min(5, Number(opt('concurrence', '3'))));
const ONLY = opt('slugs') ? opt('slugs').split(',').map((s) => s.trim()) : null;

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

const usage = { input_tokens: 0, output_tokens: 0, web_searches: 0 };
async function claude({ system, prompt, tool }) {
  const messages = [{ role: 'user', content: prompt }];
  for (let turn = 0, retry = 0; turn < 4; turn++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 4000, system, messages, tools: [tool, { type: 'web_search_20250305', name: 'web_search', max_uses: MAX_SEARCHES }] }),
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
    if (data.stop_reason !== 'pause_turn') messages.push({ role: 'user', content: `Conclus maintenant en appelant ${tool.name} (null + sources vides si introuvable).` });
  }
  throw new Error(`Aucun appel à ${tool.name} après 4 tours`);
}

const SYSTEM = `Tu es le chercheur de prises de charge de piecestrottinettes.fr (pièces détachées, marché français).
But : connaître la PRISE DE CHARGE (le connecteur du port de charge sur la trottinette) d'un modèle précis, pour lui vendre un chargeur + l'adaptateur vers cette prise.
- Réponds avec l'URL EXACTE d'une page qui montre ou nomme cette prise pour CE modèle (même génération), et une 2e page sur un AUTRE site qui donne la même prise. Recopie la phrase exacte qui le dit (quote).
- Meilleures sources : fiches « chargeur pour <modèle> » et « port de charge <modèle> » des boutiques de pièces (e-watts, ewheel, trottwheelshop, mrtrottinette, voltride, AliExpress, Amazon), fiches d'adaptateurs « GX16 vers … compatible <modèle> », manuels constructeur, vidéos/forums de réparation.
- Ne jamais déduire d'une autre marque ni d'un modèle voisin. Un chargeur « universel » qui liste 40 modèles n'est pas une preuve de prise. Sans preuve : null.
- Réponds UNIQUEMENT en appelant l'outil.`;

const tool = (codes) => ({
  name: 'submit_plug',
  description: 'Prise de charge sourcée.',
  input_schema: {
    type: 'object',
    properties: {
      connector: { type: ['string', 'null'], enum: [...codes, 'AUTRE', null], description: 'Code de prise, AUTRE si aucun code ne convient, null si introuvable' },
      connector_other: { type: ['string', 'null'], description: 'Si AUTRE : description précise (nom, nombre de broches, diamètre)' },
      charger_output_v: { type: ['number', 'null'], description: 'Tension de sortie du chargeur d\'origine si trouvée (ex. 42, 54.6, 67.2)' },
      source_url: { type: ['string', 'null'] },
      source_quote: { type: ['string', 'null'] },
      source_url_2: { type: ['string', 'null'], description: 'Page sur un AUTRE site, même prise' },
      source_quote_2: { type: ['string', 'null'] },
      confidence: { type: 'string', enum: ['haute', 'moyenne', 'faible'] },
    },
    required: ['connector', 'source_url', 'source_url_2', 'confidence'],
  },
});

const prompt = (m, codes) => `Trottinette électrique « ${m.brand} ${m.name} »${m.voltage ? ` (batterie ${m.voltage} V)` : ''}.
Trouve sa prise de charge. Fais des recherches DÉDIÉES, par exemple : « chargeur ${m.brand} ${m.name} connecteur », « port de charge ${m.brand} ${m.name} », « ${m.brand} ${m.name} charger plug », « adaptateur charge ${m.brand} ${m.name} ».
Codes possibles :
${codes.map((c) => `- ${c.code} : ${c.label_client}${c.note ? ` (${c.note})` : ''}`).join('\n')}
Attention : DC5.5x2.1 et DC5.5x2.5 se confondent (seul le trou central diffère) ; LP16-3 ≠ GX16-3 ; RCA = rond 8 mm type Xiaomi.`;

async function main() {
  if (!CAP) { console.log('--plafond-tokens absent : aucun run sans plafond. Arrêt.'); return; }
  if (!env.ANTHROPIC_API_KEY || !SB_URL || !SB_KEY) { console.error('❌ ANTHROPIC_API_KEY / Supabase public absents — arrêt avant tout appel'); process.exit(1); }
  const codes = await rest('fitment_charge_connectors?select=code,label_client,note&order=code');
  if (codes.length < 10) throw new Error(`Référentiel prises lu avec ${codes.length} lignes — arrêt.`);
  const rows = await rest('scooter_models?select=slug,name,voltage,charge_connectors,published,brands!scooter_models_brand_id_fkey(name),scooter_battery_configs!scooter_battery_configs_scooter_model_id_fkey(voltage,is_default)&published=eq.true&charge_connectors=is.null&order=slug');
  if (!rows.length) { console.log('::error title=fill-plugs::0 modèle lu (lecture refusée ou filtre) — arrêt.'); process.exit(1); }
  const models = rows.map((r) => ({
    slug: r.slug, name: r.name.replace(new RegExp(`^${(r.brands?.name || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+`, 'i'), ''),
    brand: r.brands?.name || '', voltage: (r.scooter_battery_configs || []).find((c) => c.is_default)?.voltage || r.voltage || null,
  })).filter((m) => !ONLY || ONLY.includes(m.slug));

  const dir = resolve(DATA, 'prises'); mkdirSync(dir, { recursive: true });
  const outPath = resolve(dir, 'prises-ia.json');
  const results = existsSync(outPath) ? JSON.parse(readFileSync(outPath, 'utf-8')) : {};
  const todo = models.filter((m) => results[m.slug]?.model !== MODEL); // jamais de double dépense
  console.log(`🔌 Passe prises — ${models.length} modèle(s) publiés sans prise, ${todo.length} à chercher · ${MODEL} · ${CONC} en parallèle · plafond ${CAP} tokens`);
  const t0 = Date.now();
  let i = 0, done = 0, found = 0, dbl = 0, stop = false;
  const save = () => writeFileSync(outPath, JSON.stringify(results, null, 2));
  async function worker() {
    while (!stop && i < todo.length) {
      const m = todo[i++];
      if (usage.input_tokens + usage.output_tokens >= CAP) { if (!stop) console.log(`Plafond ${CAP} tokens atteint : arrêt.`); stop = true; break; }
      try {
        const got = await claude({ system: SYSTEM, prompt: prompt(m, codes), tool: tool(codes.map((c) => c.code)) });
        const two = Boolean(got.connector && got.source_url && got.source_url_2 && new URL(got.source_url).host !== new URL(got.source_url_2).host);
        results[m.slug] = { ...got, brand: m.brand, name: m.name, voltage: m.voltage, double_source: two, model: MODEL, date: new Date().toISOString().slice(0, 10) };
        done++; if (got.connector) found++; if (two) dbl++;
        console.log(`  ${two ? '✅' : got.connector ? '⚠️' : '·'} ${m.brand} ${m.name} → ${got.connector || 'introuvable'}${got.connector === 'AUTRE' ? ` (${got.connector_other})` : ''}${two ? ' · 2 sources' : ''}`);
        save();
      } catch (e) { console.error(`  ✖ ${m.slug} : ${e.message}`); console.log(`::warning title=fill-plugs ${m.slug}::${String(e.message).slice(0, 200)}`); }
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));
  save();
  const line = `- ${new Date().toISOString()} · PASSE PRISES · ${found}/${done} trouvées dont ${dbl} à 2 sources · ${((Date.now() - t0) / 60000).toFixed(1)} min · ${usage.input_tokens} in / ${usage.output_tokens} out / ${usage.web_searches} rech.\n`;
  appendFileSync(resolve(DATA, '_journal.md'), line);
  console.log(`Passe prises terminée : ${line}`);
  console.log(`::notice title=fill-plugs::${line.trim()}`);
}

main().catch((e) => { console.error('❌', e.message); console.log(`::error title=fill-plugs::${String(e.message).slice(0, 300)}`); process.exit(1); });
