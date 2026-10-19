#!/usr/bin/env node
/**
 * scripts/agents/fill-fiches-scooters.js — PASSE « FICHES TOUT SAVOIR » (19/10/2026)
 *
 * Produit, pour chaque trottinette publiée, la fiche complète du gabarit validé sur 8 modèles
 * (src/data/scooterSeo.ts) : intro, fiche technique, tailles d'usure, forts/limites, entretien, prix,
 * FAQ, sources, vidéo YouTube.
 *
 * Partage du travail — ce qui NE PEUT PAS être inventé ne passe pas par l'IA :
 *  - fiche technique de base  → colonnes vérifiées de scooter_models (déterministe)
 *  - tailles d'usure / pièces → liens réels de part_compatibility (déterministe, pièces publiées)
 *  - texte, forts/limites, FAQ, prix, sources → Claude + web_search, UNE URL source par fiche minimum
 *  - vidéo → candidats proposés par Claude, retenus SEULEMENT si oEmbed YouTube répond, que le titre
 *    cite le modèle et que la date de mise en ligne est lisible (JSON-LD VideoObject)
 *
 * Sorties (branche donnees-extraction, JAMAIS main, JAMAIS la base) :
 *   <data>/fiches/<slug>.json      fiche au format ScooterSeo, prête à copier dans public/fiches/
 *   <data>/fiches/_rapport.json    statut, écarts base ↔ sources, vidéos rejetées, tokens, par modèle
 *
 * Usage : node scripts/agents/fill-fiches-scooters.js --data-dir <dossier> --plafond-tokens N
 *         [--model <id>] [--max-searches 4] [--concurrence 4] [--slugs a,b] [--limite N] [--refaire]
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
const MAX_SEARCHES = Math.max(1, Math.min(6, Number(opt('max-searches', '4'))));
const CONC = Math.max(1, Math.min(6, Number(opt('concurrence', '4'))));
const ONLY = opt('slugs') ? opt('slugs').split(',').map((s) => s.trim()).filter(Boolean) : null;
const LIMIT = Number(opt('limite', '0'));
const REDO = args.includes('--refaire');
const DRY = args.includes('--a-blanc'); // construit les entrées sans appeler l'API (test local)

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
  if (!res.ok) throw new Error(`REST ${path.slice(0, 60)} → ${res.status}`);
  return res.json();
}

// Fiches écrites à la main : jamais écrasées.
const HAND = new Set([...readFileSync(resolve(ROOT, 'src/data/scooterSeo.ts'), 'utf-8').matchAll(/^\s{2}"([a-z0-9-]+)":\s*\{/gm)].map((m) => m[1]));

// ─── Claude + web_search ─────────────────────────────────────────────────────
const usage = { input_tokens: 0, output_tokens: 0, web_searches: 0 };
async function claude({ system, prompt, tool }) {
  for (let retry = 0; retry < 4; retry++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: MODEL, max_tokens: 6000,
        system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: prompt }],
        tools: [tool, { type: 'web_search_20250305', name: 'web_search', max_uses: MAX_SEARCHES }],
      }),
    });
    if ([429, 500, 529].includes(res.status)) { await new Promise((r) => setTimeout(r, (Number(res.headers.get('retry-after')) || 30 * (retry + 1)) * 1000)); continue; }
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    const u = { in: (data.usage?.input_tokens || 0) + (data.usage?.cache_read_input_tokens || 0) + (data.usage?.cache_creation_input_tokens || 0), out: data.usage?.output_tokens || 0, ws: data.usage?.server_tool_use?.web_search_requests || 0 };
    usage.input_tokens += u.in; usage.output_tokens += u.out; usage.web_searches += u.ws;
    const call = (data.content || []).find((c) => c.type === 'tool_use' && c.name === tool.name);
    if (call) return { input: call.input, u };
    throw new Error(`pas d'appel ${tool.name} (stop_reason ${data.stop_reason})`);
  }
  throw new Error('Anthropic indisponible après 4 essais');
}

// ─── Données déterministes ───────────────────────────────────────────────────
const CHARGE_V = { 24: 29.4, 36: 42, 48: 54.6, 52: 58.8, 60: 67.2, 72: 84, 84: 100.8 };
const fr = (n) => String(n).replace('.', ',');
const BRAKE = {
  disc_hydraulic: 'disques hydrauliques', disc_mechanical: 'disques mécaniques', disc_unknown_actuation: 'disques',
  ebs_front_disc_rear: 'électronique avant + disque arrière', drum_front_ebs_rear: 'tambour avant + électronique arrière',
  drum: 'tambours', drum_front_disc_rear: 'tambour avant + disque arrière', ebs_front_drum_rear: 'électronique avant + tambour arrière',
  fender_foot_ebs: 'garde-boue (pied) + électronique', disc_front_drum_rear: 'disque avant + tambour arrière',
};
const tireDim = (m) => (m.tire_section_code && m.rim_diameter_code ? `${m.tire_section_code}-${m.rim_diameter_code}` : m.tire_size || null);
const cap = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);

function specsFromDb(m) {
  const s = [];
  if (m.power_watts) s.push(['Puissance', `${m.power_watts.toLocaleString('fr-FR')} W`]);
  s.push(['Vitesse', '25 km/h sur la voie publique']);
  if (m.range_km) s.push(['Autonomie annoncée', `jusqu'à ${m.range_km} km`]);
  if (m.voltage) s.push(['Batterie', `${m.voltage} V${m.amperage ? `, ${fr(m.amperage)} Ah` : ''}`]);
  if (m.weight_kg) s.push(['Poids', `${fr(m.weight_kg)} kg`]);
  if (m.max_load_kg) s.push(['Charge max', `${fr(m.max_load_kg)} kg`]);
  const wheel = m.wheel_inches || m.wheel_size_inches;
  const dim = tireDim(m);
  if (wheel || dim) s.push(['Roues', [wheel ? `${fr(wheel)} pouces` : null, dim && !/^\d+([.,]\d)?\s*("|pouces?)$/i.test(dim) ? dim : null].filter(Boolean).join(', ') || dim]);
  if (m.brake_type) {
    const d = m.disc_diameter_code && /disc/.test(m.brake_type) ? ` (${m.disc_diameter_code} mm)` : '';
    if (BRAKE[m.brake_type]) s.push(['Freins', cap(`${BRAKE[m.brake_type]}${d}`)]);
  }
  if (m.suspension) s.push(['Suspension', cap(m.suspension)]);
  if (m.ip_rating) s.push(['Étanchéité', m.ip_rating]);
  if (m.charge_connectors?.length) s.push(['Prise de charge', m.charge_connectors.join(' / ')]);
  if (m.voltage && CHARGE_V[m.voltage]) s.push(['Chargeur', `${m.voltage} V (${fr(CHARGE_V[m.voltage])} V en sortie)`]);
  return s;
}

const FAM = [
  { slug: 'pneus', label: 'Pneu', cta: 'Pneus', size: (m) => tireDim(m) },
  { slug: 'chambres-a-air', label: 'Chambre à air', cta: 'Chambres à air', size: (m) => tireDim(m) },
  { slug: 'pneus-pleins', label: 'Pneu plein', cta: 'Pneus pleins', size: (m) => tireDim(m) },
  { slug: 'plaquettes', label: 'Plaquettes', cta: 'Plaquettes', size: (m) => (m.caliper_family ? `étrier ${m.caliper_family.replace(/_/g, ' ')}` : null) },
  { slug: 'disques', label: 'Disque de frein', cta: 'Disques', size: (m) => (m.disc_diameter_code ? [`${m.disc_diameter_code} mm`, m.disc_holes_code ? `${m.disc_holes_code} trous` : null, m.disc_pcd_code ? `entraxe ${m.disc_pcd_code} mm` : null].filter(Boolean).join(', ') : null) },
  { slug: 'chargeurs', label: 'Chargeur', cta: 'Chargeurs', size: (m) => (m.voltage ? `${m.voltage} V → ${fr(CHARGE_V[m.voltage] ?? '')} V${m.charge_connectors?.length ? `, prise ${m.charge_connectors[0]}` : ''}` : null) },
];
function partsFromDb(m, linked) {
  const out = [];
  for (const f of FAM) {
    const list = linked.filter((p) => p.cat === f.slug);
    if (!list.length) continue;
    // Pièce d'appel : en stock d'abord, puis la moins chère.
    const best = [...list].sort((a, b) => (b.stock > 0) - (a.stock > 0) || (a.price ?? 9e9) - (b.price ?? 9e9))[0];
    out.push({ label: f.label, size: String(f.size(m) || best.name).replace(/(\d+(?:[.,]\d)?)"/, '$1 pouces'), count: list.length, to: `/piece/${best.slug}`, cta: f.cta });
  }
  return out;
}

// ─── Consigne de rédaction ───────────────────────────────────────────────────
const SYSTEM = `Tu rédiges la fiche « Tout savoir sur la <modèle> » d'une trottinette électrique pour piecestrottinettes.fr, boutique française de pièces détachées adossée à un atelier de réparation à Marseille. La page vise Google sur « <modèle> avis », « <modèle> fiche technique », « pneu / plaquettes / chargeur <modèle> ».

MÉTHODE : fais tes recherches web (fiche constructeur ou distributeur officiel FR d'abord, puis un ou deux tests de presse FR : Frandroid, Les Numériques, Cleanrider, Techno-Science, 01net…, puis une vidéo YouTube de test, en français de préférence). Puis appelle UNE SEULE FOIS l'outil submit_fiche.

RÈGLES DURES :
- RIEN D'INVENTÉ. Chaque affirmation vient des données catalogue fournies (vérifiées) ou d'une page que tu as réellement lue, citée dans sources. Une info non trouvée = non écrite. Jamais « environ » pour combler un trou.
- Les données catalogue font foi pour les cotes (pneu, disque, prise, tension). Si une source les contredit, ne recopie PAS la source dans le texte : signale-le dans ecarts.
- Un point fort ou une limite tiré d'un test se termine par le nom du média entre parenthèses, ex. « (Frandroid) ».
- Vitesse : en France la voie publique est limitée à 25 km/h ; une vitesse supérieure n'est mentionnée que « sur terrain privé ».
- Français, tutoiement dans l'entretien et la FAQ, ton direct d'atelier, phrases courtes, zéro superlatif creux, zéro emoji.
- intro : 2 paragraphes de 45 à 90 mots. Le 1er dit ce qu'est le modèle (positionnement, sortie / prix de lancement si sourcés). Le 2e dit sa motorisation, sa batterie, ses roues et son usage.
- pros : 3 ou 4. cons : 3 ou 4 (toujours au moins une limite honnête : poids, confort, autonomie réelle, entretien…).
- care : 3 conseils d'entretien concrets propres à CE modèle (type de pneu, type de frein, poids, étanchéité).
- faq : 4 à 6 questions que les gens tapent vraiment (taille de pneu, plaquettes ou disque, chargeur, autonomie réelle, pneus pleins, légalité si > 25 km/h). Réponses de 1 à 3 phrases, en t'appuyant sur les données catalogue.
- price : seulement un prix de lancement ou un prix public relevé sur une source datée ; sinon null.
- metaTitle ≤ 60 caractères, forme « <Nom> : fiche technique, avis et pièces ». metaDescription 130 à 158 caractères, avec 2 ou 3 cotes du catalogue.
- extra_specs : seulement des lignes ABSENTES des données catalogue et lues sur une source (ex. « Étanchéité », « Sortie », « Temps de charge »). Jamais une ligne qui redit ou contredit le catalogue.
- videos : jusqu'à 3 URL YouTube de TEST ou de PRÉSENTATION de CE modèle précis (pas un autre modèle de la gamme), la meilleure d'abord. Pour une Dualtron, cherche d'abord la chaîne « Dualtron Store ® officiel ». N'invente jamais un identifiant : seulement des URL vues dans tes résultats.
- Si tu ne trouves AUCUNE source fiable sur ce modèle précis, appelle submit_fiche avec status "introuvable" et des tableaux vides.`;

const TOOL = {
  name: 'submit_fiche',
  description: 'Fiche « Tout savoir » complète du modèle.',
  input_schema: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['ok', 'introuvable'] },
      displayName: { type: 'string', description: 'Marque + modèle, tel qu\'un acheteur le nomme' },
      metaTitle: { type: 'string' }, metaDescription: { type: 'string' },
      intro: { type: 'array', items: { type: 'string' } },
      extra_specs: { type: 'array', items: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 2 } },
      pros: { type: 'array', items: { type: 'string' } }, cons: { type: 'array', items: { type: 'string' } },
      care: { type: 'array', items: { type: 'string' } },
      price: { type: ['object', 'null'], properties: { text: { type: 'string' }, source: { type: 'string' } } },
      faq: { type: 'array', items: { type: 'object', properties: { q: { type: 'string' }, a: { type: 'string' } }, required: ['q', 'a'] } },
      sources: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, url: { type: 'string' } }, required: ['label', 'url'] } },
      videos: { type: 'array', items: { type: 'string' } },
      ecarts: { type: 'array', items: { type: 'string' }, description: 'Contradictions entre données catalogue et sources, une par ligne : champ, valeur catalogue, valeur source, URL' },
    },
    required: ['status', 'displayName', 'intro', 'pros', 'cons', 'care', 'faq', 'sources'],
  },
};

// ─── Vidéo : vérification réelle ─────────────────────────────────────────────
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const ytId = (u) => String(u).match(/(?:v=|youtu\.be\/|\/shorts\/|\/embed\/)([A-Za-z0-9_-]{11})/)?.[1] || null;
async function checkVideo(url, m, brand) {
  const id = ytId(url);
  if (!id) return { ok: false, why: 'URL non YouTube' };
  const o = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`).catch(() => null);
  if (!o?.ok) return { ok: false, id, why: `oEmbed ${o?.status ?? 'erreur'} (privée, supprimée ou intégration interdite)` };
  const meta = await o.json();
  // Le titre doit citer le modèle : chaque mot distinctif du nom (hors marque) doit y figurer.
  const words = norm(m.name).split(' ').filter((w) => w.length > 1 && !norm(brand).split(' ').includes(w));
  const t = ` ${norm(meta.title)} `;
  const hit = words.filter((w) => t.includes(` ${w} `) || t.includes(w)).length;
  if (words.length && hit < Math.ceil(words.length * 0.75)) return { ok: false, id, why: `titre hors sujet : « ${meta.title} »` };
  let uploadDate = null;
  const page = await fetch(`https://www.youtube.com/watch?v=${id}&hl=fr`, { headers: { 'accept-language': 'fr-FR,fr;q=0.9' } }).then((r) => (r.ok ? r.text() : '')).catch(() => '');
  uploadDate = page.match(/"uploadDate":"(\d{4}-\d{2}-\d{2})/)?.[1] || page.match(/itemprop="(?:uploadDate|datePublished)" content="(\d{4}-\d{2}-\d{2})/)?.[1] || page.match(/"publishDate":"(\d{4}-\d{2}-\d{2})/)?.[1] || null;
  if (!uploadDate) return { ok: false, id, why: 'date de mise en ligne illisible' };
  return { ok: true, video: { id, title: meta.title, channel: meta.author_name, uploadDate } };
}

// ─── Contrôle de la fiche avant écriture ─────────────────────────────────────
const words = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;
function audit(f) {
  const pb = [];
  if (!Array.isArray(f.intro) || f.intro.length < 2) pb.push('intro < 2 paragraphes');
  else if (f.intro.some((p) => words(p) < 30 || words(p) > 130)) pb.push('paragraphe d\'intro hors 30–130 mots');
  if ((f.pros || []).length < 2) pb.push('moins de 2 points forts');
  if ((f.cons || []).length < 2) pb.push('moins de 2 limites');
  if ((f.care || []).length < 2) pb.push('moins de 2 conseils d\'entretien');
  if ((f.faq || []).length < 3) pb.push('moins de 3 questions FAQ');
  const src = (f.sources || []).filter((s) => /^https?:\/\/[^ ]+\.[a-z]{2,}/i.test(s.url || '') && !/piecestrottinettes\.fr/i.test(s.url));
  if (!src.length) pb.push('aucune source exploitable');
  if (!f.metaTitle || f.metaTitle.length > 70) pb.push('metaTitle absent ou > 70 car.');
  if (!f.metaDescription || f.metaDescription.length > 170) pb.push('metaDescription absente ou > 170 car.');
  const blob = JSON.stringify([f.intro, f.pros, f.cons, f.care, f.faq]);
  if (/\b(environ|à peu près)\b/i.test(blob) && /\b(environ)\b.*\b(km|kg|W)\b/i.test(blob)) pb.push('« environ » sur une cote (à relire)');
  return { pb, src };
}

async function main() {
  if (!CAP && !DRY) { console.log('--plafond-tokens absent : aucun run sans plafond. Arrêt.'); return; }
  if (!DRY && !env.ANTHROPIC_API_KEY) { console.error('❌ ANTHROPIC_API_KEY absente — arrêt avant tout appel'); process.exit(1); }
  if (!SB_URL || !SB_KEY) { console.error('❌ Supabase public absent'); process.exit(1); }

  const models = await rest('scooter_models?select=id,slug,name,description,tire_section_code,rim_diameter_code,power_watts,voltage,amperage,range_km,max_speed_kmh,weight_kg,max_load_kg,tire_size,wheel_inches,wheel_size_inches,tire_family,rim_type,brake_type,caliper_family,disc_diameter_code,disc_pcd_code,disc_holes_code,suspension,ip_rating,foldable,charge_connectors,solid_conversion,year,top_rank,is_top_moment,is_featured_home,compatible_parts_count,brands!scooter_models_brand_id_fkey(name)&published=eq.true&order=slug');
  if (models.length < 100) { console.log(`::error title=fiches::${models.length} modèles lus (attendu ≥ 100) — arrêt.`); process.exit(1); }
  const compat = [];
  for (let off = 0; ; off += 1000) {
    const page = await rest(`part_compatibility?select=scooter_model_id,parts!part_compatibility_part_id_fkey(slug,name,price,stock_quantity,published,categories!parts_category_id_fkey(slug))&order=id&limit=1000&offset=${off}`);
    compat.push(...page);
    if (page.length < 1000) break;
  }
  if (compat.length < 500) { console.log(`::error title=fiches::${compat.length} liens de compatibilité lus (attendu ≥ 500, RLS ?) — arrêt.`); process.exit(1); }
  const linkedBy = new Map();
  for (const c of compat) {
    const p = c.parts; if (!p?.published) continue;
    const l = linkedBy.get(c.scooter_model_id) || [];
    if (!l.some((x) => x.slug === p.slug)) l.push({ slug: p.slug, name: p.name, price: p.price, stock: p.stock_quantity, cat: p.categories?.slug });
    linkedBy.set(c.scooter_model_id, l);
  }

  const dir = resolve(DATA, 'fiches'); mkdirSync(dir, { recursive: true });
  const repPath = resolve(dir, '_rapport.json');
  const rapport = existsSync(repPath) ? JSON.parse(readFileSync(repPath, 'utf-8')) : {};
  // Priorité : Top du moment / accueil, puis les modèles qui ont le plus de pièces à vendre.
  const prio = (m) => (m.top_rank ? 0 : m.is_featured_home || m.is_top_moment ? 1 : 2);
  let todo = models
    .filter((m) => (ONLY ? true : !HAND.has(m.slug))) // --slugs explicite : banc possible sur une fiche à la main
    .filter((m) => (!ONLY || ONLY.includes(m.slug)) && (REDO || !existsSync(resolve(dir, `${m.slug}.json`))))
    .filter((m) => REDO || ONLY || rapport[m.slug]?.status !== 'introuvable')
    .sort((a, b) => prio(a) - prio(b) || (a.top_rank ?? 99) - (b.top_rank ?? 99) || (b.compatible_parts_count || 0) - (a.compatible_parts_count || 0) || a.slug.localeCompare(b.slug));
  if (LIMIT > 0) todo = todo.slice(0, LIMIT);
  console.log(`📚 Passe fiches — ${models.length} publiés, ${HAND.size} fiches à la main, ${todo.length} à produire · ${MODEL} · ${MAX_SEARCHES} recherches max · plafond ${CAP} tokens`);
  if (DRY) {
    const m = todo[0];
    console.log(JSON.stringify({ slug: m.slug, specs: specsFromDb(m), parts: partsFromDb(m, linkedBy.get(m.id) || []) }, null, 1));
    console.log('À blanc : aucune requête API.');
    return;
  }

  const t0 = Date.now();
  let i = 0, done = 0, refused = 0, stop = false;
  const saveRep = () => writeFileSync(repPath, JSON.stringify(rapport, null, 1));
  async function worker() {
    while (!stop && i < todo.length) {
      const m = todo[i++];
      if (usage.input_tokens + usage.output_tokens >= CAP) { if (!stop) console.log(`Plafond ${CAP} tokens atteint : arrêt propre.`); stop = true; break; }
      const brand = m.brands?.name || '';
      const linked = linkedBy.get(m.id) || [];
      const facts = Object.fromEntries(Object.entries({
        marque: brand, modele: m.name, annee: m.year, puissance_w: m.power_watts, tension_batterie_v: m.voltage, capacite_ah: m.amperage,
        tension_de_charge_v: CHARGE_V[m.voltage] ?? null, autonomie_km: m.range_km, poids_kg: m.weight_kg, charge_max_kg: m.max_load_kg,
        taille_pneu: tireDim(m), roue_pouces: m.wheel_inches || m.wheel_size_inches, type_pneu: m.tire_family, type_jante: m.rim_type,
        freinage: m.brake_type, etrier: m.caliper_family, disque_diametre_mm: m.disc_diameter_code, disque_entraxe_mm: m.disc_pcd_code, disque_trous: m.disc_holes_code,
        suspension: m.suspension, indice_ip: m.ip_rating, pliable: m.foldable, prise_de_charge: m.charge_connectors?.join(', ') || null,
        passage_pneus_pleins: m.solid_conversion,
      }).filter(([, v]) => v !== null && v !== undefined && v !== ''));
      const fams = [...new Set(linked.map((p) => p.cat))];
      const prompt = `Modèle : « ${brand} ${m.name} » (slug ${m.slug}).\n\nDonnées catalogue VÉRIFIÉES (font foi) :\n${JSON.stringify(facts, null, 1)}\n\nFamilles de pièces compatibles réellement en vente sur le site pour ce modèle : ${fams.join(', ') || 'aucune pour l\'instant'}.\n\nFais tes recherches, puis appelle submit_fiche.`;
      const t = Date.now();
      try {
        const { input: f, u } = await claude({ system: SYSTEM, prompt, tool: TOOL });
        const rep = { status: f.status, tokens_in: u.in, tokens_out: u.out, searches: u.ws, ecarts: f.ecarts || [], videos_rejetees: [], model: MODEL, date: new Date().toISOString().slice(0, 10) };
        if (f.status !== 'ok') { rapport[m.slug] = rep; refused++; console.log(`  · ${m.slug} : introuvable`); saveRep(); continue; }
        const { pb, src } = audit(f);
        let video;
        for (const v of (f.videos || []).slice(0, 3)) {
          const r = await checkVideo(v, m, brand);
          if (r.ok) { video = r.video; break; }
          rep.videos_rejetees.push(`${v} — ${r.why}`);
        }
        const fiche = {
          displayName: f.displayName || `${brand} ${m.name}`,
          metaTitle: f.metaTitle, metaDescription: f.metaDescription,
          intro: f.intro,
          specs: [...specsFromDb(m), ...(f.extra_specs || []).filter((r) => Array.isArray(r) && r[0] && r[1] && !specsFromDb(m).some(([k]) => norm(k) === norm(r[0])))].slice(0, 14),
          pros: f.pros, cons: f.cons,
          parts: partsFromDb(m, linked),
          care: f.care,
          ...(f.price?.text && f.price?.source ? { price: { text: f.price.text, source: f.price.source } } : {}),
          faq: f.faq,
          sources: src.map((s) => ({ label: s.label, url: s.url })),
          ...(video ? { video } : {}),
        };
        rep.problemes = pb; rep.video = video ? video.id : null; rep.secondes = Math.round((Date.now() - t) / 1000);
        if (pb.some((p) => /aucune source|intro < 2/.test(p))) { rep.status = 'rejetee'; refused++; console.log(`  ✖ ${m.slug} rejetée : ${pb.join(' · ')}`); }
        else { writeFileSync(resolve(dir, `${m.slug}.json`), JSON.stringify(fiche, null, 1)); done++; console.log(`  ✓ ${fiche.displayName} · ${fiche.parts.length} familles · ${video ? 'vidéo ✓' : 'sans vidéo'} · ${u.ws} rech. · ${u.in + u.out} tok${pb.length ? ` · ⚠ ${pb.join(' · ')}` : ''}`); }
        rapport[m.slug] = rep; saveRep();
      } catch (e) {
        console.error(`  ✖ ${m.slug} : ${e.message}`);
        console.log(`::warning title=fiches ${m.slug}::${String(e.message).slice(0, 200)}`);
        if (/credit balance|invalid x-api-key|authentication/i.test(e.message)) { stop = true; console.log('::error title=fiches::panne générale (crédit ou clé API) — arrêt.'); }
      }
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));
  saveRep();
  const line = `- ${new Date().toISOString()} · PASSE FICHES · ${done} écrites, ${refused} introuvables/rejetées, ${todo.length - done - refused} non traitées · ${((Date.now() - t0) / 60000).toFixed(1)} min · ${usage.input_tokens} in / ${usage.output_tokens} out / ${usage.web_searches} recherches\n`;
  appendFileSync(resolve(DATA, '_journal.md'), line);
  console.log(`::notice title=fiches::${line.trim()}`);
}

main().catch((e) => { console.error('❌', e.message); console.log(`::error title=fiches::${String(e.message).slice(0, 300)}`); process.exit(1); });
