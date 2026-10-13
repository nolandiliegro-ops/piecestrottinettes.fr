#!/usr/bin/env node
/**
 * scripts/agents/fill-seo-brands.js — PASSE SEO MARQUES (lot du 13/10/2026)
 *
 * Mesuré le 13/10 sur les 50 marques publiées : 40 sans pays ni année de création ni accroche,
 * 45 sans note d'expert (editorial_verdict), 44 sans site officiel, 50 sans FAQ.
 * Les pages /marque/<slug> sont nos pages d'atterrissage « pièces détachées <marque> » : ce sont
 * elles qui doivent ranker.
 *
 * La passe lit en public les marques publiées (et leurs modèles publiés), demande à Claude (recherche
 * web) les FAITS sourcés (pays, année, site officiel) et rédige l'éditorial (accroche, note d'atelier,
 * FAQ pièces/entretien) À PARTIR de ces faits et des modèles du catalogue. Résultat :
 * <data-dir>/seo/marques-ia.json + journal. N'ÉCRIT RIEN EN BASE : Claude (conversation) relit et
 * applique avec backup.
 *
 * Usage : node scripts/agents/fill-seo-brands.js --data-dir <dossier> --plafond-tokens N
 *         [--model <id>] [--max-searches 3] [--concurrence 3] [--slugs a,b] [--refaire]
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
const CAP = Number(opt('plafond-tokens', '0')); // GARDE-FOU : sans plafond, rien ne part
const CONC = Math.max(1, Math.min(5, Number(opt('concurrence', '3'))));
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
    if (data.stop_reason !== 'pause_turn') messages.push({ role: 'user', content: `Conclus maintenant en appelant ${tool.name} (null pour tout fait non sourcé).` });
  }
  throw new Error(`Aucun appel à ${tool.name} après 4 tours`);
}

const SYSTEM = `Tu es le rédacteur SEO et l'expert atelier de piecestrottinettes.fr : boutique française de pièces détachées pour trottinettes électriques, adossée à un atelier de réparation à Marseille.
Tu prépares la page /marque/<marque>, qui doit ranker sur « pièces détachées <marque> », « pièces <marque> », « réparation <marque> ».

FAITS (pays, année de création, site officiel) :
- Uniquement s'ils sont sourcés par une page web que tu as lue (site officiel, Wikipédia, presse). Donne l'URL. Sinon null. Jamais déduit.
- Pays = pays du siège de la marque (en français : « Chine », « Corée du Sud », « France »…). Année = création de la MARQUE (pas du groupe, pas du premier modèle), sauf si la source ne distingue pas : alors null.
- Attention aux confusions classiques : Dualtron est une gamme du constructeur coréen Minimotors (ne pas lui attribuer l'année de Minimotors) ; Segway et Ninebot appartiennent au même groupe mais restent deux marques ; Speedway est aussi une gamme Minimotors.

RÉDACTION (en français, tutoiement, ton direct d'atelier, zéro superlatif creux, zéro invention) :
- tagline : 3 à 7 mots, l'ADN de la marque (ex. « Bimoteur, suspension, endurance »).
- editorial_verdict : 60 à 100 mots, commence par « Côté atelier, » : ce que la marque vaut en usage et en réparation, les pièces d'usure à surveiller (pneus, chambres à air, plaquettes, disques, chargeur) en t'appuyant UNIQUEMENT sur les modèles et données fournis et sur des faits sourcés.
- faq : 4 à 5 questions que se pose un propriétaire (où trouver les pièces, quel pneu/chambre à air, quelle plaquette, quel chargeur, entretien), réponses de 35 à 70 mots, concrètes, qui citent des modèles du catalogue fourni. Si une donnée manque (dimension, tension), dis de vérifier sur la fiche du modèle sur piecestrottinettes.fr plutôt que d'inventer.
- Ne cite jamais un prix, un délai de livraison ou une garantie.
Réponds UNIQUEMENT en appelant l'outil.`;

const tool = {
  name: 'submit_brand_seo',
  description: 'Faits sourcés et éditorial SEO de la marque.',
  input_schema: {
    type: 'object',
    properties: {
      country: { type: ['string', 'null'] },
      country_source: { type: ['string', 'null'] },
      founded_year: { type: ['integer', 'null'] },
      founded_year_source: { type: ['string', 'null'] },
      website_url: { type: ['string', 'null'], description: 'Site OFFICIEL de la marque (pas un revendeur)' },
      tagline: { type: 'string' },
      editorial_verdict: { type: 'string' },
      faq: { type: 'array', items: { type: 'object', properties: { q: { type: 'string' }, a: { type: 'string' } }, required: ['q', 'a'] } },
      doutes: { type: ['string', 'null'], description: 'Ce que tu n\'as pas pu confirmer' },
    },
    required: ['country', 'founded_year', 'website_url', 'tagline', 'editorial_verdict', 'faq'],
  },
};

const fmtModel = (m) => {
  const bits = [m.name];
  if (m.voltage) bits.push(`${m.voltage} V`);
  if (m.tire_size) bits.push(`pneus ${m.tire_size}`);
  if (m.brake_type) bits.push(`frein ${m.brake_type}`);
  if (m.disc_diameter_code) bits.push(`disque ${m.disc_diameter_code} mm`);
  if (m.charge_connectors?.length) bits.push(`prise ${m.charge_connectors.join('/')}`);
  return bits.join(' · ');
};

async function main() {
  if (!CAP) { console.log('--plafond-tokens absent : aucun run sans plafond. Arrêt.'); return; }
  if (!env.ANTHROPIC_API_KEY || !SB_URL || !SB_KEY) { console.error('❌ ANTHROPIC_API_KEY / Supabase public absents — arrêt avant tout appel'); process.exit(1); }
  const brands = await rest('brands?select=id,slug,name,description,tagline,country,founded_year,website_url,editorial_verdict&published=eq.true&order=slug');
  if (brands.length < 40) { console.log(`::error title=fill-seo-brands::${brands.length} marques lues (attendu ≥ 40) — arrêt.`); process.exit(1); }
  const models = await rest('scooter_models?select=brand_id,name,voltage,tire_size,brake_type,disc_diameter_code,charge_connectors&published=eq.true');
  if (models.length < 100) { console.log(`::error title=fill-seo-brands::${models.length} modèles lus (attendu ≥ 100) — arrêt.`); process.exit(1); }

  const dir = resolve(DATA, 'seo'); mkdirSync(dir, { recursive: true });
  const outPath = resolve(dir, 'marques-ia.json');
  const results = existsSync(outPath) ? JSON.parse(readFileSync(outPath, 'utf-8')) : {};
  const todo = brands.filter((b) => (!ONLY || ONLY.includes(b.slug)) && (REDO || results[b.slug]?.model !== MODEL));
  console.log(`🏷  Passe SEO marques — ${brands.length} marques, ${todo.length} à traiter · ${MODEL} · plafond ${CAP} tokens`);
  const t0 = Date.now();
  let i = 0, done = 0, stop = false;
  const save = () => writeFileSync(outPath, JSON.stringify(results, null, 2));
  async function worker() {
    while (!stop && i < todo.length) {
      const b = todo[i++];
      if (usage.input_tokens + usage.output_tokens >= CAP) { if (!stop) console.log(`Plafond ${CAP} tokens atteint : arrêt.`); stop = true; break; }
      const mine = models.filter((m) => m.brand_id === b.id);
      const prompt = `Marque : « ${b.name} » (page https://piecestrottinettes.fr/marque/${b.slug}).
Déjà en base (à vérifier, peut être faux) : pays=${b.country ?? '—'} · année=${b.founded_year ?? '—'} · site=${b.website_url ?? '—'} · accroche=${b.tagline ?? '—'}.
Présentation actuelle : ${(b.description || '').slice(0, 700)}
Modèles de cette marque au catalogue (${mine.length}) :
${mine.map((m) => `- ${fmtModel(m)}`).join('\n') || '- (aucun)'}
Cherche les faits (pays, année de création de la marque, site officiel) puis rédige accroche, note d'atelier et FAQ.`;
      try {
        const got = await claude({ system: SYSTEM, prompt, tool });
        results[b.slug] = { ...got, name: b.name, before: { country: b.country, founded_year: b.founded_year, website_url: b.website_url, tagline: b.tagline, had_verdict: Boolean(b.editorial_verdict) }, model: MODEL, date: new Date().toISOString().slice(0, 10) };
        done++;
        console.log(`  ✓ ${b.name} → ${got.country ?? '?'} · ${got.founded_year ?? '?'} · ${got.website_url ?? '?'} · FAQ ${got.faq?.length ?? 0}`);
        save();
      } catch (e) { console.error(`  ✖ ${b.slug} : ${e.message}`); console.log(`::warning title=fill-seo-brands ${b.slug}::${String(e.message).slice(0, 200)}`); }
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));
  save();
  const line = `- ${new Date().toISOString()} · PASSE SEO MARQUES · ${done}/${todo.length} · ${((Date.now() - t0) / 60000).toFixed(1)} min · ${usage.input_tokens} in / ${usage.output_tokens} out / ${usage.web_searches} rech.\n`;
  appendFileSync(resolve(DATA, '_journal.md'), line);
  console.log(`::notice title=fill-seo-brands::${line.trim()}`);
}

main().catch((e) => { console.error('❌', e.message); console.log(`::error title=fill-seo-brands::${String(e.message).slice(0, 300)}`); process.exit(1); });
