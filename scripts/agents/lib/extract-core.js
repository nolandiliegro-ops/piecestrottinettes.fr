// scripts/agents/lib/extract-core.js
// Cœur PUR de l'extracteur de marque (aucun I/O, aucun env) → testable isolément.
// Transforme les champs extraits ({ value, source_url, source_type }) en scooter
// au contrat d'import de sync-scooters.js, et rend un verdict PRÊT / MANQUE.
//
// Règles métier (skill pt-import-pipeline) :
//  - toute valeur sans URL source est ÉCARTÉE (jamais d'invention) ;
//  - poids net ; plusieurs batteries = le plus lourd (consigne donnée au modèle) ;
//  - un poids venu d'un site de test n'est PAS écrit : il part en « à valider Nolan » ;
//  - solid_conversion vide = inconnu, jamais deviné ;
//  - codes de montage validés contre les référentiels fitment_* lus en base.

import { slugify } from '../../lib/slugify.js';

export const DISC_KEYS = ['disc_diameter', 'disc_pcd', 'disc_holes'];

// Champ obligatoire pour qu'un modèle soit PRÊT (miroir de publishIfComplete).
export const REQUIRED = ['weight_kg', 'brake_type', 'source_image_urls'];

// Clés qui font vendre une pièce : exigent DEUX sources sur deux sites différents (banc du 08/10 :
// disque du Vsett 10+ trouvé 145 au 1er run, 160 au 2e — une source seule ne suffit pas).
export const CORROBORATED = ['disc_diameter', 'disc_pcd', 'disc_holes', 'rim_diameter', 'tire_section', 'weight_kg'];

const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return null; } };

/** Vrai si la valeur a deux URLs sur deux domaines distincts (notre propre catalogue compte pour un). */
export function corroborated(field) {
  const a = host(field?.source_url), b = host(field?.source_url_2);
  return Boolean(a && b && a !== b);
}

/**
 * Fiche de disque de rechange visant le modèle exact : l'URL parle de disque/rotor ET contient
 * tous les éléments chiffrés du nom du modèle (« G2 Max » → g2 + max ; « Mini Pro V6 » → mini, pro, v6).
 */
export function isSpareDiscPage(url, brandName, fullName) {
  if (typeof url !== 'string') return false;
  const u = url.toLowerCase().replace(/[^a-z0-9]+/g, ' ');
  if (!/\b(disque|disques|disc|discs|disk|rotor|rotors)\b/.test(u)) return false;
  const model = fullName.toLowerCase().replace(brandName.toLowerCase(), '').replace(/\+/g, ' plus');
  const tokens = model.split(/[^a-z0-9]+/).filter((t) => t.length >= 2 || /\d/.test(t));
  if (!tokens.length) return false;
  const words = ` ${u} `;
  return tokens.every((t) => words.includes(` ${t} `));
}

/** Valeur exploitable seulement si elle a une source http(s). */
export function sourced(field) {
  if (!field || field.value === null || field.value === undefined || field.value === '') return null;
  const url = field.source_url;
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) return null;
  return field;
}

function num(field) {
  const f = sourced(field);
  if (!f) return null;
  const n = typeof f.value === 'number' ? f.value : Number(String(f.value).replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function int(field) {
  const n = num(field);
  return n !== null && Number.isInteger(n) ? n : null;
}

function code(field, allowed) {
  const f = sourced(field);
  if (!f) return null;
  const v = String(f.value).trim();
  return allowed && allowed.length && !allowed.includes(v) ? null : v;
}

/** Freins sans disque (tambour pur, EBS + tambour) : clés disque non exigées. */
export function needsDiscKeys(brakeType, vocab) {
  if (!brakeType) return true;
  const row = (vocab.brake_rows || []).find((r) => r.code === brakeType);
  if (row) return row.has_disc !== false;
  return !/^drum$|^drum_front_ebs_rear$/.test(brakeType);
}

/** Tout-terrain éditorial (aucune formule ne tient, cf. 28/09) : repère simple et explicite. */
export function offroadScore({ wheel_inches, suspension, tire_section }) {
  const w = Number(wheel_inches) || 0;
  let s = w >= 11 ? 45 : w >= 10 ? 35 : w >= 9 ? 25 : 18;
  if (suspension && /double|dual|av.*ar|front.*rear/i.test(String(suspension))) s += 5;
  if (tire_section && /90\/65|100\/90|11x|10x3/i.test(String(tire_section))) s += 3;
  return Math.min(s, 100);
}

export function buildSeo({ name, disc_diameter, disc_holes, tire_label, voltage }) {
  const bits = [];
  if (disc_diameter) bits.push(`disque de frein ${disc_diameter} mm${disc_holes ? ` ${disc_holes} trous` : ''}`);
  bits.push('plaquettes');
  if (tire_label) bits.push(`pneus ${tire_label}`);
  if (voltage) bits.push(`chargeurs ${voltage}V`);
  const low = name.toLowerCase();
  return {
    meta_title: `${name} - Pièces détachées | PiècesTrottinettes.fr`,
    meta_description: `Pièces détachées ${name} : ${bits.join(', ')}. Compatibilité vérifiée, livraison rapide.`,
    search_terms: [low, `pieces ${low}`, `disque frein ${low}`, `plaquettes ${low}`, `pneu ${low}`].join(', '),
  };
}

/**
 * Assemble un scooter au contrat d'import + son verdict.
 * @param {string} brandName
 * @param {object} specs  champs extraits (spec fields)
 * @param {object} keys   champs extraits (mounting keys)
 * @param {object} vocab  { brake, caliper, rim_type, rim_d, section, disc_d, pcd, holes, rim_w, brake_rows }
 */
export function assembleScooter(brandName, modelName, specs, keys, vocab) {
  const name = modelName.toLowerCase().startsWith(brandName.toLowerCase()) ? modelName : `${brandName} ${modelName}`;
  const s = { name, slug: slugify(name.replace(/\+/g, ' plus')) }; // « 10+ » → vsett-10-plus, convention des fiches publiées
  const missing = [];
  const toValidate = [];
  const sources = {};

  const put = (k, v, field) => {
    if (v === null || v === undefined) return;
    s[k] = v;
    sources[k] = { url: field.source_url, type: field.source_type || 'inconnu' };
  };

  // Specs numériques
  // Colonnes ENTIÈRES en base (mesuré le 10/10 : amperage 23.4 a fait rejeter tout le modèle Speedway 5).
  // Une valeur à virgule n'est jamais arrondie : elle n'est pas envoyée et reste signalée au rapport.
  const INT_COLS = ['voltage', 'amperage', 'power_watts', 'max_speed_private_kmh', 'range_km', 'year'];
  const notInt = [];
  for (const k of ['voltage', 'amperage', 'power_watts', 'max_speed_private_kmh', 'range_km', 'max_load_kg', 'year']) {
    const n = num(specs[k]);
    if (n !== null && INT_COLS.includes(k) && !Number.isInteger(n)) { notInt.push(`${k}=${n}`); continue; }
    put(k, n, specs[k]);
  }
  s.max_speed_kmh = 25; // vitesse route légale FR, convention de toutes les fiches publiées

  // Poids : site de test → à valider par Nolan, jamais écrit d'office
  const w = num(specs.weight_kg);
  const unconfirmed = [];
  if (w !== null) {
    if (specs.weight_kg.source_type === 'site_test') toValidate.push({ key: 'weight_kg', value: w, url: specs.weight_kg.source_url });
    else if (!corroborated(specs.weight_kg)) unconfirmed.push({ key: 'weight_kg', value: w, url: specs.weight_kg.source_url });
    else put('weight_kg', w, specs.weight_kg);
  }

  for (const k of ['suspension', 'ip_rating', 'tire_size']) {
    const f = sourced(specs[k]);
    if (f) put(k, String(f.value).trim(), f);
  }
  const fold = sourced(specs.foldable);
  if (fold && typeof fold.value === 'boolean') put('foldable', fold.value, fold);
  const wi = num(specs.wheel_inches);
  if (wi !== null) put('wheel_inches', wi, specs.wheel_inches); // NOMBRE : le serveur refuse le texte « 8 » (10/10)

  // Photos : og:image relevées par le script sur les fiches produit (fiables) + URLs directes d'image du modèle
  const og = (Array.isArray(specs._og_images) ? specs._og_images : []).filter((u) => typeof u === 'string' && /^https?:\/\//i.test(u));
  const direct = (Array.isArray(specs.image_urls) ? specs.image_urls : [])
    .filter((u) => typeof u === 'string' && /^https?:\/\/.+\.(jpe?g|png|webp)(\?|$)/i.test(u));
  const imgs = [...new Set([...og, ...direct])].slice(0, 4);
  if (imgs.length) { s.source_image_urls = imgs; sources.source_image_urls = { url: imgs[0], type: og.length ? 'og:image fiche produit' : 'image' }; }

  // Clés de montage
  put('brake_type', code(keys.brake_type, vocab.brake), keys.brake_type);
  put('disc_diameter', (() => { const n = int(keys.disc_diameter); return n !== null && (!vocab.disc_d?.length || vocab.disc_d.includes(String(n))) ? n : null; })(), keys.disc_diameter);
  put('disc_pcd', (() => { const n = int(keys.disc_pcd); return n !== null && (!vocab.pcd?.length || vocab.pcd.includes(String(n))) ? n : null; })(), keys.disc_pcd);
  put('disc_holes', (() => { const n = int(keys.disc_holes); return n !== null && (!vocab.holes?.length || vocab.holes.includes(String(n))) ? n : null; })(), keys.disc_holes);
  put('rim_diameter', code(keys.rim_diameter, vocab.rim_d), keys.rim_diameter);
  put('tire_section', code(keys.tire_section, vocab.section), keys.tire_section);
  put('caliper_family', code(keys.caliper_family, vocab.caliper), keys.caliper_family);
  put('rim_type', code(keys.rim_type, vocab.rim_type), keys.rim_type);
  put('tire_family', code(keys.tire_family, ['pneumatic', 'solid']), keys.tire_family);

  // Double source exigée sur les clés qui font vendre une pièce : sinon retirée, gardée « à trancher »
  // Exception ENTRAXE (décision de Nolan, 09/10) : une seule source acceptée si diamètre ET trous sont
  // doublement sourcés ET que la source est une fiche de disque de rechange visant le modèle exact.
  const pcdSingle = s.disc_pcd !== undefined && !corroborated(keys.disc_pcd)
    && s.disc_diameter !== undefined && corroborated(keys.disc_diameter)
    && s.disc_holes !== undefined && corroborated(keys.disc_holes)
    && isSpareDiscPage(keys.disc_pcd.source_url, brandName, name);
  for (const k of CORROBORATED.filter((x) => x !== 'weight_kg')) {
    if (k === 'disc_pcd' && pcdSingle) { sources.disc_pcd.url2 = null; sources.disc_pcd.rule = 'entraxe 1 source (fiche disque compatible)'; continue; }
    if (s[k] !== undefined && !corroborated(keys[k])) {
      unconfirmed.push({ key: k, value: s[k], url: keys[k].source_url });
      delete s[k]; delete sources[k];
    } else if (s[k] !== undefined) {
      sources[k].url2 = keys[k].source_url_2;
    }
  }
  if (s.weight_kg !== undefined) sources.weight_kg.url2 = specs.weight_kg.source_url_2;
  // solid_conversion : JAMAIS importé automatiquement (banc du 08/10 : « yes » déduit d'une simple page de chambre à air).
  // Proposé au rapport seulement ; c'est le savoir d'atelier de Nolan qui tranche.
  const proposals = [];
  const sc = code(keys.solid_conversion, ['yes', 'no']);
  if (sc) proposals.push({ key: 'solid_conversion', value: sc, url: keys.solid_conversion.source_url });

  // Valeur trouvée mais hors référentiel : on la garde pour le rapport, pas pour l'import
  const offVocab = [];
  for (const [k, list] of [['rim_diameter', vocab.rim_d], ['tire_section', vocab.section], ['caliper_family', vocab.caliper], ['brake_type', vocab.brake]]) {
    const f = sourced(keys[k]);
    if (f && s[k] === undefined && list?.length) offVocab.push(`${k}=${f.value}`);
  }

  // Éditorial + SEO
  s.score_offroad = offroadScore({ wheel_inches: s.wheel_inches, suspension: s.suspension, tire_section: s.tire_section });
  const desc = sourced(specs.description_fr) ? String(specs.description_fr.value).trim() : (typeof specs.description_fr?.value === 'string' ? specs.description_fr.value.trim() : '');
  if (desc) s.description = desc;
  Object.assign(s, buildSeo({ name, disc_diameter: s.disc_diameter, disc_holes: s.disc_holes, tire_label: s.tire_section, voltage: s.voltage }));

  // Verdict
  for (const k of REQUIRED) if (s[k] === undefined) missing.push(k);
  // Décision de Nolan (10/10) : un modèle complet SAUF les clés disque est publiable, sans disques proposés.
  // Les clés disque manquantes ne bloquent plus : elles vont dans discMissing (import --allow-missing-keys,
  // publication par SQL), et restent la cible de la passe disques.
  const discMissing = needsDiscKeys(s.brake_type, vocab) ? DISC_KEYS.filter((k) => s[k] === undefined) : [];

  return { scooter: s, sources, missing, discMissing, notInt, toValidate, offVocab, proposals, unconfirmed, ready: missing.length === 0 && toValidate.length === 0 };
}

/** Rapport de sources lisible (markdown), un tableau par modèle. */
export function sourcesReport(brandName, results, meta = {}) {
  const lines = [`# Extraction ${brandName} — ${meta.date || ''}`, ''];
  const ready = results.filter((r) => r.ready).length;
  lines.push(`**${ready} PRÊT / ${results.length} modèles.** Modèle IA : ${meta.model || '?'}${meta.escalated ? ` · relance : ${meta.escalated}` : ''}.`, '');
  if (meta.usage) lines.push(`Coût mesuré : ${meta.usage.input_tokens} tokens entrée, ${meta.usage.output_tokens} sortie, ${meta.usage.web_searches} recherches web.`, '');
  for (const r of results) {
    lines.push(`## ${r.scooter.name} — ${r.ready ? 'PRÊT' : 'MANQUE'}`);
    if (r.missing.length) lines.push(`- Manque : ${r.missing.join(', ')}`);
    if (r.notInt?.length) lines.push(`- Valeur à virgule pour une colonne entière, NON importée : ${r.notInt.join(' · ')}`);
    if (r.discMissing?.length) lines.push(`- Publiable SANS disques (règle du 10/10) — inconnu : ${r.discMissing.join(', ')}`);
    if (r.toValidate.length) lines.push(`- À valider par Nolan (site de test) : ${r.toValidate.map((t) => `${t.key}=${t.value} (${t.url})`).join(' · ')}`);
    if (r.offVocab.length) lines.push(`- Trouvé mais hors référentiel (non importé) : ${r.offVocab.join(' · ')}`);
    if (r.unconfirmed?.length) lines.push(`- Une seule source, NON importé : ${r.unconfirmed.map((t) => `${t.key}=${t.value} (${t.url})`).join(' · ')}`);
    if (r.sources?.disc_pcd?.rule) lines.push(`- Entraxe ${r.scooter.disc_pcd} mm sur UNE source (règle du 09/10 : fiche disque compatible, diamètre + trous doublés) — à surveiller au premier retour SAV`);
    if (r.proposals?.length) lines.push(`- Proposé, NON importé (à trancher par Nolan) : ${r.proposals.map((t) => `${t.key}=${t.value} (${t.url})`).join(' · ')}`);
    lines.push('', '| Clé | Valeur | Type de source | Source | 2e source |', '|---|---|---|---|---|');
    for (const [k, src] of Object.entries(r.sources)) {
      const v = Array.isArray(r.scooter[k]) ? `${r.scooter[k].length} photo(s)` : r.scooter[k];
      lines.push(`| ${k} | ${v} | ${src.type} | ${src.url} | ${src.url2 || ''} |`);
    }
    lines.push('');
  }
  return lines.join('\n');
}
