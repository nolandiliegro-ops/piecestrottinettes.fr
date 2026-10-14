#!/usr/bin/env node
/**
 * scripts/agents/fill-gamme.js — PASSE GAMME (14/10/2026)
 *
 * Question de Nolan (14/10) : « sur les 50 marques, combien ont TOUS les modèles ? » — aucune donnée ne le
 * disait : ni la base ni les brouillons ne connaissent la gamme complète d'une marque. Cette passe la mesure :
 * pour chaque marque publiée, la liste des modèles vendus en France (en vente + arrêtés encore très présents
 * dans le parc depuis 2019, car ce sont eux qui consomment des pièces), sourcée. Comparée ensuite au catalogue
 * publié et aux brouillons de l'extracteur → taux de couverture par marque.
 * Résultat : <data-dir>/gamme/gamme-ia.json + journal. N'ÉCRIT RIEN EN BASE.
 *
 * Usage : node scripts/agents/fill-gamme.js --data-dir <dossier> --plafond-tokens N
 *         [--model <id>] [--max-searches 3] [--concurrence 3] [--brands a,b] [--refaire]
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
const MAX_SEARCHES = Number(opt('max-searches', '3'));
const CAP = Number(opt('plafond-tokens', '0'));
const CONC = Math.max(1, Math.min(5, Number(opt('concurrence', '3'))));
const ONLY = opt('brands') ? opt('brands').split(',').map((s) => s.trim()) : null;
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

const usage = { input_tokens: 0, output_tokens: 0, web_searches: 0 };
// claude-sonnet-5-5 refuse tool_choice forcé (13/10) : consigne + relance, comme fill-seo-brands
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
    if (data.stop_reason !== 'pause_turn') messages.push({ role: 'user', content: `Conclus maintenant en appelant ${tool.name}.` });
  }
  throw new Error(`Aucun appel à ${tool.name} après 4 tours`);
}

const SYSTEM = `Tu inventories la gamme de trottinettes électriques d'une marque pour piecestrottinettes.fr (pièces détachées, France).
Liste TOUS les modèles de trottinettes électriques de la marque qui comptent pour un vendeur de pièces en France :
- statut « en_vente » : vendus aujourd'hui en France (site officiel FR, revendeurs FR) ;
- statut « arrete » : arrêtés mais sortis depuis 2019 et encore courants dans le parc (forums, revendeurs de pièces).
Règles : un modèle = un châssis. Les variantes de batterie ou de couleur ne sont PAS des modèles distincts (mets-les dans « variantes »). Une version « Pro », « Max », « Plus », « Lite » ou une génération (2, 3, 4) EST un modèle distinct. Pas d'accessoires, pas de vélos, pas de gyroroues, pas de trottinettes enfant non électriques. Nom sans la marque.
N'invente rien : un modèle sans source lue ne figure pas. Exhaustif plutôt que court, mais 25 modèles maximum (les plus vendus en premier).
Réponds UNIQUEMENT en appelant l'outil.`;

const tool = {
  name: 'submit_gamme',
  description: 'Gamme de la marque sur le marché français.',
  input_schema: {
    type: 'object',
    properties: {
      models: { type: 'array', items: { type: 'object', properties: {
        name: { type: 'string' }, statut: { type: 'string', enum: ['en_vente', 'arrete'] },
        variantes: { type: ['string', 'null'] }, source: { type: ['string', 'null'] } }, required: ['name', 'statut'] } },
      doutes: { type: ['string', 'null'] },
    },
    required: ['models'],
  },
};

async function main() {
  if (!CAP) { console.log('--plafond-tokens absent : aucun run sans plafond. Arrêt.'); return; }
  if (!env.ANTHROPIC_API_KEY || !SB_URL || !SB_KEY) { console.error('❌ ANTHROPIC_API_KEY / Supabase public absents — arrêt avant tout appel'); process.exit(1); }
  const brands = await rest('brands?select=id,slug,name&published=eq.true&order=slug');
  if (brands.length < 40) { console.log(`::error title=fill-gamme::${brands.length} marques lues (attendu ≥ 40) — arrêt.`); process.exit(1); }
  const models = await rest('scooter_models?select=brand_id,name&published=eq.true');
  if (models.length < 100) { console.log(`::error title=fill-gamme::${models.length} modèles lus (attendu ≥ 100) — arrêt.`); process.exit(1); }

  const dir = resolve(DATA, 'gamme'); mkdirSync(dir, { recursive: true });
  const outPath = resolve(dir, 'gamme-ia.json');
  const results = existsSync(outPath) ? JSON.parse(readFileSync(outPath, 'utf-8')) : {};
  const todo = brands.filter((b) => (!ONLY || ONLY.includes(b.slug)) && (REDO || !results[b.slug]));
  console.log(`📋 Passe GAMME — ${brands.length} marques, ${todo.length} à traiter · ${MODEL} · plafond ${CAP} tokens`);
  const t0 = Date.now();
  let i = 0, done = 0, stop = false;
  const save = () => writeFileSync(outPath, JSON.stringify(results, null, 2));
  async function worker() {
    while (!stop && i < todo.length) {
      const b = todo[i++];
      if (usage.input_tokens + usage.output_tokens >= CAP) { if (!stop) console.log(`Plafond ${CAP} tokens atteint : arrêt.`); stop = true; break; }
      const mine = models.filter((m) => m.brand_id === b.id).map((m) => m.name);
      const prompt = `Marque : « ${b.name} ».
Déjà au catalogue (${mine.length}) — pour contexte, ne les exclus pas : ${mine.join(' · ') || '(aucun)'}.
Inventorie la gamme complète de ${b.name} pertinente en France.`;
      try {
        const got = await claude({ system: SYSTEM, prompt, tool });
        results[b.slug] = { name: b.name, catalogue: mine, ...got, model: MODEL, date: new Date().toISOString().slice(0, 10) };
        done++;
        console.log(`  ✓ ${b.name} → ${got.models?.length ?? 0} modèles (catalogue ${mine.length})`);
        save();
      } catch (e) { console.error(`  ✖ ${b.slug} : ${e.message}`); console.log(`::warning title=fill-gamme ${b.slug}::${String(e.message).slice(0, 200)}`); }
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));
  save();
  const line = `- ${new Date().toISOString()} · PASSE GAMME · ${done}/${todo.length} · ${((Date.now() - t0) / 60000).toFixed(1)} min · ${usage.input_tokens} in / ${usage.output_tokens} out / ${usage.web_searches} rech.\n`;
  appendFileSync(resolve(DATA, '_journal.md'), line);
  console.log(`::notice title=fill-gamme::${line.trim()}`);
}
main().catch((e) => { console.error('❌', e.message); console.log(`::error title=fill-gamme::${String(e.message).slice(0, 300)}`); process.exit(1); });
