// scripts/sync-airtable-wattiz.js
// Sync Airtable (base catalogue relationnelle) → Supabase via bulk-insert-parts.
//
// Base : appCVWWSvCrOFSMpZ — modèle relationnel multi-fournisseurs.
//   Pièces ↔ Categories ↔ Marques ↔ Modèle Trott ↔ Liaison ↔ Fournisseurs
//
// Lit la table Pièces, résout les liens (Catégorie, fournisseur via Liaison),
// mappe les champs d'enrichissement (EAN, Caractéristiques, Compatibilité source,
// Photos source écrits par enrich.js), puis insère par catégorie avec skip_ai=true.
// Après chaque insertion, détoure en local les Photos source (@imgly) et les
// pousse via process-images. La compatibilité fine est gérée ensuite par le
// bouton retrigger (specs + IA), pas ici.
//
// DRY_RUN (.env) par défaut TRUE : mappe + affiche ce qui serait inséré/détouré,
// sans aucun POST. Mettre DRY_RUN=false dans .env pour écrire réellement.
//
// Usage :
//   node scripts/sync-airtable-wattiz.js

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { detoure } from './lib/detoure.js';
import {
  findMissingPartKeys,
  canonicalCategorySlug,
  REQUIRED_KEYS_BY_CATEGORY,
} from './lib/validate-part-keys.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Chargement manuel du .env (même approche que scripts/sync-parts.js ;
// pas de dépendance à dotenv qui n'est pas installé).
function loadEnv() {
  const envPath = resolve(__dirname, '../.env');
  let content;
  try { content = readFileSync(envPath, 'utf-8'); }
  catch { console.error('❌ .env introuvable :', envPath); process.exit(1); }
  const env = {};
  for (const line of content.split('\n')) {
    const m = line.match(/^([^#=][^=]*)=["']?([^"'\r\n]*)["']?/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

const ENV = loadEnv();
// DRY_RUN par défaut TRUE (aligné sur enrich.js) : on n'écrit que si DRY_RUN="false".
const DRY_RUN = String(ENV.DRY_RUN ?? 'true').toLowerCase() !== 'false';

// Flag PONCTUEL de redétourage forcé des photos (chambres à air uniquement).
// Défaut false → sync normal strictement inchangé. Quand true ET DRY_RUN=false :
// passe IMAGE-ONLY qui ré-détoure @imgly les photos source Airtable et ÉCRASE l'image
// en base — sans toucher prix/stock/published/SEO. À remettre false après usage.
const FORCE_REDETOURE = String(ENV.FORCE_REDETOURE ?? 'false').toLowerCase() === 'true';
// Catégorie ciblée (comparaison via slugify → robuste casse/accents).
const FORCE_REDETOURE_CATEGORY_SLUG = 'chambres-a-air';

const AIRTABLE_API_KEY = ENV.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = ENV.AIRTABLE_BASE_ID || 'appCVWWSvCrOFSMpZ';
const AIRTABLE_TABLE_ID = ENV.AIRTABLE_TABLE_ID || 'tblV3rukuKXNjvWVw'; // Pièces
const SUPABASE_URL = ENV.SUPABASE_URL || ENV.VITE_SUPABASE_URL;
const ADMIN_BULK_SECRET = ENV.ADMIN_BULK_SECRET;
// Clé publishable (anon) — lecture seule de l'état image des pièces (Option b).
// RLS "Public can read parts" USING(true) → lit toutes les pièces, y compris published:false.
const SUPABASE_ANON = ENV.VITE_SUPABASE_PUBLISHABLE_KEY;

// Tables liées (résolution des record IDs → valeurs lisibles)
const TABLE_CATEGORIES = 'tbl0VC6e7p0psD9mx';
const TABLE_LIAISON = 'tbl2NhTcgrEJSDjUl';
const TABLE_FOURNISSEURS = 'tblQqhH4EXv20ynm5';

// Champs d'enrichissement sur la table Pièces (écrits par enrich.js).
// Lus par FIELD ID via returnFieldsByFieldId=true → robustes aux renommages.
const F_PIECE_EAN = 'fldCdtbyVIh76jLT0';              // EAN
const F_PIECE_CARACTERISTIQUES = 'fldwCu08OnHRBZz4Y'; // Caractéristiques
const F_PIECE_COMPAT_SOURCE = 'fldotemKZlLMUP8Um';    // Compatibilité source
const F_PIECE_PHOTOS_SOURCE = 'fldiB7HKuHL7CU8yp';    // Photos source

// Clés de montage fitment_specs v2 (multipleSelects — codes alignés référentiels
// Supabase fitment_*). Le champ "🔑 Source dims" (fldeCTa0pcxMfKOov) n'est JAMAIS
// synchronisé (traçabilité Airtable uniquement).
const F_PIECE_FIT_RIM_DIAMETERS = 'fld1YZXXwOpnc32OT';   // 🔑 Ø jante → rim_diameters
const F_PIECE_FIT_TIRE_SECTIONS = 'fldqxzi9Be6PFUGHl';   // 🔑 Section pneu → tire_sections
const F_PIECE_FIT_DISC_DIAMETERS = 'fldb7H2rgpcHS55iI';  // 🔑 Ø disque → brake_disc.diameters
const F_PIECE_FIT_DISC_PCDS = 'fld4Uxfr2wNOMlvJ7';       // 🔑 Entraxe disque → brake_disc.pcds
const F_PIECE_FIT_DISC_HOLES = 'fldtYaZymwBvOuMvb';      // 🔑 Trous disque → brake_disc.holes
const F_PIECE_FIT_CALIPER = 'flde00F5A5d0lpFn3';         // 🔑 Étrier → brake_caliper

// Whitelist fournisseurs acceptée par bulk-insert-parts (part_suppliers.supplier_name)
const SUPPLIER_WHITELIST = [
  'wattiz', 'ewheel', 'voltcorp', 'bluewaycorp',
  'dualtronstore', 'weebot', 'autre',
];

if (!AIRTABLE_API_KEY) { console.error('❌ AIRTABLE_API_KEY manquante'); process.exit(1); }
if (!SUPABASE_URL) { console.error('❌ SUPABASE_URL manquante'); process.exit(1); }
if (!DRY_RUN && !ADMIN_BULK_SECRET) { console.error('❌ ADMIN_BULK_SECRET manquante'); process.exit(1); }

function slugify(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/ç/g, 'c')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// "volt-corp" → "voltcorp", "Wattiz" → "wattiz". Hors whitelist → "autre".
function normalizeSupplier(parser) {
  if (!parser) return null;
  const norm = String(parser).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (SUPPLIER_WHITELIST.includes(norm)) return norm;
  console.warn(`[sync] Fournisseur "${parser}" (→ "${norm}") hors whitelist → "autre"`);
  return 'autre';
}

function firstAttachmentUrl(field) {
  if (Array.isArray(field) && field.length > 0 && field[0]?.url) return field[0].url;
  return null;
}

// Photos source = chaîne d'URLs jointes par ", " (enrich.js fait joinList).
// Re-split en tableau, trim, ne garde que les URLs http(s). Défensif si déjà array.
function parsePhotosSource(value) {
  if (!value) return [];
  const arr = Array.isArray(value) ? value : String(value).split(/\s*,\s*/);
  return arr
    .map((x) => String(x).trim())
    .filter((x) => /^https?:\/\//i.test(x));
}

// Extrait le libellé d'une option de select Airtable.
// L'API REST v0 renvoie des STRINGS (single) / string[] (multiple) ; on tolère
// aussi la forme objet {name} (défensif, ex. si un jour returnFieldsByFieldId
// change le transport). Retourne toujours une string, ou null.
function selectName(opt) {
  if (opt == null) return null;
  if (typeof opt === 'string') return opt;
  if (typeof opt === 'object' && typeof opt.name === 'string') return opt.name;
  return null;
}

// Construit l'objet electrical_specs pour parts.electrical_specs (jsonb) depuis
// les champs Airtable "Voltages compatibles" (multipleSelects) + "Connecteur charge"
// (singleSelect). Convention : { voltages:[int,...], connector:string|null }.
//   - voltages : parseInt du libellé de chaque option ["72"] -> [72] (entiers, jamais strings).
//   - GUARD : si aucun voltage exploitable -> retourne null (l'appelant N'AJOUTE PAS la clé,
//     pour ne jamais écraser une valeur electrical_specs déjà présente en base).
function buildElectricalSpecs(voltagesField, connectorField) {
  const raw = Array.isArray(voltagesField) ? voltagesField : [];
  const voltages = raw
    .map(selectName)
    .map((n) => parseInt(n, 10))
    .filter((n) => Number.isFinite(n));
  if (voltages.length === 0) return null;
  return { voltages, connector: selectName(connectorField) };
}

// multipleSelects Airtable → tableau de codes strings VERBATIM (aucun parsing,
// aucun cast — les libellés d'options SONT les codes des référentiels fitment_*).
// Champ vide/absent → [].
function selectCodes(field) {
  const raw = Array.isArray(field) ? field : [];
  return raw.map(selectName).filter((s) => typeof s === 'string' && s.trim() !== '');
}

// Texte Airtable réellement rempli (une chaîne d'espaces compte comme vide).
// Sert au guard anti-écrasement des 3 champs SEO dans filterAndMap.
const nonEmptyText = (v) => typeof v === 'string' && v.trim() !== '';

// Construit l'objet fitment_specs v2 pour parts.fitment_specs (jsonb) depuis les
// champs 🔑 Airtable (lus par field ID). Même esprit que buildElectricalSpecs :
//   - GUARD : si AUCUN champ 🔑 n'est rempli → retourne null (l'appelant N'AJOUTE
//     PAS la clé → guard-preserve, ne jamais écraser une valeur déjà en base).
//   - Jamais de clé vide : chaque clé n'est posée que si elle a ≥1 code.
//   - tire_family n'a pas de champ Airtable : dérivé de la catégorie via le
//     mapping de validate-part-keys.js (pneus/chambres → "pneumatic",
//     pneus-pleins → "solid", autres → absent). N'est émis que si au moins un
//     champ 🔑 est rempli (tire_family seul n'est pas une dim sourcée).
function buildFitmentSpecs(enrich, categoryName) {
  const rimDiameters = selectCodes(enrich[F_PIECE_FIT_RIM_DIAMETERS]);
  const tireSections = selectCodes(enrich[F_PIECE_FIT_TIRE_SECTIONS]);
  const discDiameters = selectCodes(enrich[F_PIECE_FIT_DISC_DIAMETERS]);
  const discPcds = selectCodes(enrich[F_PIECE_FIT_DISC_PCDS]);
  const discHoles = selectCodes(enrich[F_PIECE_FIT_DISC_HOLES]);
  const brakeCaliper = selectCodes(enrich[F_PIECE_FIT_CALIPER]);

  const hasAny =
    rimDiameters.length || tireSections.length || discDiameters.length ||
    discPcds.length || discHoles.length || brakeCaliper.length;
  if (!hasAny) return null;

  const rule = REQUIRED_KEYS_BY_CATEGORY[canonicalCategorySlug(categoryName)];
  const tireFamily = rule?.kind === 'tire' ? rule.family : null;

  const brakeDisc = {
    ...(discDiameters.length ? { diameters: discDiameters } : {}),
    ...(discPcds.length ? { pcds: discPcds } : {}),
    ...(discHoles.length ? { holes: discHoles } : {}),
  };

  return {
    ...(tireFamily ? { tire_family: tireFamily } : {}),
    ...(rimDiameters.length ? { rim_diameters: rimDiameters } : {}),
    ...(tireSections.length ? { tire_sections: tireSections } : {}),
    ...(Object.keys(brakeDisc).length ? { brake_disc: brakeDisc } : {}),
    ...(brakeCaliper.length ? { brake_caliper: brakeCaliper } : {}),
  };
}

// byFieldId=true → returnFieldsByFieldId : r.fields keyé par field ID (et non par nom).
async function fetchTable(tableId, fields, byFieldId = false) {
  let allRecords = [];
  let offset = null;
  do {
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableId}`);
    url.searchParams.set('pageSize', '100');
    if (byFieldId) url.searchParams.set('returnFieldsByFieldId', 'true');
    if (offset) url.searchParams.set('offset', offset);
    if (Array.isArray(fields)) {
      for (const f of fields) url.searchParams.append('fields[]', f);
    }
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
    });
    if (!res.ok) throw new Error(`Airtable ${tableId} ${res.status}: ${await res.text()}`);
    const data = await res.json();
    allRecords = allRecords.concat(data.records);
    offset = data.offset;
  } while (offset);
  return allRecords;
}

async function buildLookups() {
  console.log('[sync] Lecture des tables liées (Categories, Fournisseurs, Liaison)...');

  const categoriesById = new Map();
  for (const r of await fetchTable(TABLE_CATEGORIES, ['Name'])) {
    if (r.fields['Name']) categoriesById.set(r.id, r.fields['Name']);
  }

  const fournisseursById = new Map();
  for (const r of await fetchTable(TABLE_FOURNISSEURS, ['Name', 'Modèle parser'])) {
    fournisseursById.set(r.id, r.fields['Modèle parser'] || null);
  }

  const liaisonsById = new Map();
  for (const r of await fetchTable(TABLE_LIAISON)) {
    const f = r.fields;
    const fournisseurLink = Array.isArray(f['Fournisseur']) ? f['Fournisseur'][0] : null;
    liaisonsById.set(r.id, {
      fournisseurRecId: fournisseurLink,
      skuFournisseur: f['SKU fournisseur'] || null,
      urlFournisseur: f['URL fournisseur'] || null,
      prixFournisseurHT: f['Prix fournisseur HT'] ?? null,
      stockQty: f['Stock qty'] ?? null,
      priorite: f['Priorité'] ?? null,
    });
  }

  console.log(`[sync] Lookups: ${categoriesById.size} catégories, ${fournisseursById.size} fournisseurs, ${liaisonsById.size} liaisons`);
  return { categoriesById, fournisseursById, liaisonsById };
}

// Résout le fournisseur primaire (Priorité la plus basse) d'une pièce.
function resolveSupplier(liaisonIds, lookups) {
  if (!Array.isArray(liaisonIds) || liaisonIds.length === 0) return null;

  const liaisons = liaisonIds
    .map((id) => lookups.liaisonsById.get(id))
    .filter(Boolean);
  if (liaisons.length === 0) return null;

  // Priorité 1 = primaire ; null traité comme +∞ (passe après les priorisés).
  liaisons.sort((a, b) => (a.priorite ?? Infinity) - (b.priorite ?? Infinity));
  const primary = liaisons[0];

  const parser = primary.fournisseurRecId
    ? lookups.fournisseursById.get(primary.fournisseurRecId)
    : null;
  const name = normalizeSupplier(parser);
  if (!name) return null;

  const supplier = { name };
  if (primary.skuFournisseur) supplier.sku = primary.skuFournisseur;
  if (primary.urlFournisseur) supplier.url = primary.urlFournisseur;
  if (primary.prixFournisseurHT != null) supplier.buy_price_ht = primary.prixFournisseurHT;
  if (primary.stockQty != null) supplier.stock_supplier = primary.stockQty;
  return supplier;
}

function filterAndMap(records, lookups, enrichById) {
  const filtered = [];
  const skipped = { empty: 0, missingFields: 0, noCategory: 0 };

  for (const r of records) {
    const f = r.fields;

    // Lignes vides (placeholders sans Name)
    if (!f['Name']) { skipped.empty++; continue; }

    if (!f['Référence constructeur']) { skipped.missingFields++; continue; }

    const catLink = Array.isArray(f['Catégorie']) ? f['Catégorie'][0] : null;
    const categoryName = catLink ? lookups.categoriesById.get(catLink) : null;
    if (!categoryName) { skipped.noCategory++; continue; }

    const compatibleModels = Array.isArray(f['Modèles compatibles'])
      ? f['Modèles compatibles']
      : [];

    // Champs d'enrichissement lus par field ID (2ᵉ passe returnFieldsByFieldId).
    const enrich = enrichById.get(r.id) || {};
    const ean = enrich[F_PIECE_EAN] || null;
    const characteristics = enrich[F_PIECE_CARACTERISTIQUES] || null;
    const compatibility_source = enrich[F_PIECE_COMPAT_SOURCE] || null;
    const source_image_urls = parsePhotosSource(enrich[F_PIECE_PHOTOS_SOURCE]);

    const part = {
      _categoryName: categoryName,
      // Photo principale (attachment Airtable) : affichage dry-run UNIQUEMENT,
      // jamais persistée (URL signée qui expire). image_url réel = photo détourée
      // via process-images + trigger trg_sync_part_image_url.
      _photoPrincipale: firstAttachmentUrl(f['Photo principale']),
      name: f['Name'],
      slug: slugify(f['Name']),
      sku: f['Référence constructeur'],
      price: f['Prix affiché client TTC'] ?? null,
      stock_quantity: f['Stock Steedy'] ?? 0,
      image_url: null,
      is_featured: f['Is featured (homepage)'] === true,
      ean,
      characteristics,
      compatibility_source,
      // Consommée côté client après insertion (détourage) ; ignorée par l'edge function.
      source_image_urls,
      technical_metadata: {
        source: 'airtable',
        airtable_id: r.id,
        // Référence humaine uniquement — n'alimente pas le matching de compat.
        compatible_model_record_ids: compatibleModels,
      },
    };

    // Champs SEO — GUARD anti-écrasement, même esprit que electrical_specs /
    // fitment_specs ci-dessous : clé ABSENTE si le champ Airtable est vide, pour
    // ne jamais pousser null par-dessus un SEO déjà en base (fiche live).
    // Un SEO n'est donc écrasé que par un SEO réellement rédigé, jamais par du vide.
    if (nonEmptyText(f['Description SEO'])) part.description = f['Description SEO'];
    if (nonEmptyText(f['Meta title SEO'])) part.meta_title = f['Meta title SEO'];
    if (nonEmptyText(f['Meta description SEO'])) part.meta_description = f['Meta description SEO'];

    const supplier = resolveSupplier(f['Liaisons fournisseurs'], lookups);
    if (supplier) part.supplier = supplier;

    // Specs électriques (chargeurs/électrique) depuis "Voltages compatibles" + "Connecteur charge".
    // GUARD anti-écrasement : clé ABSENTE si voltages vide (ne jamais pousser electrical_specs:null,
    // qui écraserait une valeur déjà en base). Même esprit que le preserve conditionnel côté bulk-insert.
    const electrical = buildElectricalSpecs(f['Voltages compatibles'], f['Connecteur charge']);
    if (electrical) part.electrical_specs = electrical;

    // Clés de montage fitment_specs v2 depuis les champs 🔑 (par field ID).
    // GUARD anti-écrasement identique à electrical_specs : clé ABSENTE si aucun
    // champ 🔑 rempli (ne jamais pousser fitment_specs:null ni un objet vide).
    const fitment = buildFitmentSpecs(enrich, categoryName);
    if (fitment) part.fitment_specs = fitment;

    filtered.push(part);
  }

  console.log(
    `[sync] Mappées: ${filtered.length} | Skip vides: ${skipped.empty} | ` +
    `Skip sans réf: ${skipped.missingFields} | Skip sans catégorie: ${skipped.noCategory}`,
  );
  return filtered;
}

// ─── Clés de montage (contrat — étape 3) : WARNING-ONLY sur ce chemin ──────────
// Aucun champ Airtable ne porte encore les dims fitment → on signale la dette
// sans jamais bloquer (un refus stopperait aussi les maj prix/stock). L'insert/
// update part SANS la clé fitment_specs (guard-preserve → colonne intacte).
// Bascule prévue vers un refus bloquant quand les champs Airtable existeront
// (même lib, warn → exit). Tourne aussi en DRY_RUN (visibilité sans écriture).
function warnMissingPartKeys(parts) {
  const byCategory = new Map();
  for (const p of parts) {
    if (!byCategory.has(p._categoryName)) byCategory.set(p._categoryName, []);
    byCategory.get(p._categoryName).push(p);
  }
  const batches = [...byCategory.entries()].map(([categoryName, catParts]) => ({
    categoryName,
    parts: catParts,
  }));

  const faults = findMissingPartKeys(batches);
  if (faults.length === 0) return;
  for (const f of faults) {
    console.warn(`[sync] ⚠  [${f.categoryName}] ${f.ref} — clés de montage manquantes : ${f.missing.join(', ')}`);
  }
  console.warn(
    `[sync] ⚠  ${faults.length} pièce(s) sans clés de montage (fitment_specs) — ` +
    `champs Airtable à créer, aucun blocage (warning-only).`,
  );
}

function groupByCategory(parts) {
  const groups = {};
  for (const p of parts) {
    const cat = p._categoryName;
    if (!groups[cat]) groups[cat] = [];
    // Strip les champs internes (préfixe _) ; source_image_urls reste dans le payload.
    const { _categoryName, _photoPrincipale, ...cleanPart } = p;
    groups[cat].push(cleanPart);
  }
  return groups;
}

// ─── process-images helper (détourage LOCAL @imgly + mode images_base64) ────────
//
// Repris de scripts/sync-parts.js. Pour chaque source_url : detoure(url) en local
// → Buffer PNG → base64 (sans préfixe data:) → 1 POST process-images avec
// images_base64:[b64]. reset:true sur la 1ère image (repart d'un tableau vide),
// reset:false ensuite (append). Une image qui échoue est comptée et la boucle
// continue. Aucun fallback Remove.bg, aucun envoi de source_urls.
//
// Retour : { ok, processed:perImgOk, failed:perImgErr, errors:[...] }
//   ok:true dès que perImgOk > 0 (succès partiel accepté).
async function processImages(entityId, sourceUrls, altBase, secret, url) {
  let perImgOk = 0;
  let perImgErr = 0;
  const errors = [];

  for (let i = 0; i < sourceUrls.length; i++) {
    const srcUrl = sourceUrls[i];
    try {
      const buf = await detoure(srcUrl); // LOCAL @imgly, URL → Buffer PNG
      const b64 = buf.toString('base64'); // sans préfixe data:

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({
          entity_type: 'part',
          entity_id: entityId,
          images_base64: [b64],
          alt_base: altBase,
          reset: i === 0,
        }),
      });

      const text = await res.text();
      let json;
      try { json = JSON.parse(text); }
      catch { perImgErr++; errors.push(`img ${i}: non-JSON: ${text.slice(0, 80)}`); continue; }

      if (!res.ok || json?.success !== true) {
        perImgErr++;
        errors.push(`img ${i}: ${json?.error ?? `HTTP ${res.status}`}`);
        continue;
      }
      perImgOk++;
    } catch (e) {
      // detourage (URL morte, échec moteur) ou réseau : on logue et on continue
      perImgErr++;
      errors.push(`img ${i}: ${e.message}`);
    }
  }

  return { ok: perImgOk > 0, processed: perImgOk, failed: perImgErr, errors };
}

// ─── Lecture état image en base (Option b — lecture seule, clé publishable) ─────
//
// "A une image" : prédicat STRICTEMENT identique à getPrimaryImage du front
// (src/lib/entityImage.ts) — images[] non vide dont [0].url est une string NON vide,
// OU image_url NON vide. Toute divergence ferait re-détourer (ou skipper) à tort.

function normalizeImages(images) {
  // jsonb peut, dans de rares cas, être stocké comme string JSON (cf. trigger
  // sync_part_image_url qui gère jsonb_typeof='string'). On reparse défensivement.
  if (typeof images === 'string') {
    try { return JSON.parse(images); } catch { return null; }
  }
  return images;
}

function partHasImage(row) {
  const images = normalizeImages(row?.images);
  if (
    Array.isArray(images) && images.length > 0 &&
    typeof images[0]?.url === 'string' && images[0].url !== ''
  ) {
    return true;
  }
  return typeof row?.image_url === 'string' && row.image_url !== '';
}

// Lit parts(slug, images, image_url) par lots de slugs → Map<slug, hasImage:boolean>.
// Un slug absent de la Map = pièce inexistante en base. Lève en cas d'échec HTTP
// (l'appelant retombe alors en inserted-only, prudent).
async function fetchPartsImageState(slugs) {
  const state = new Map();
  if (!SUPABASE_ANON || slugs.length === 0) return state;
  const CHUNK = 100;
  for (let i = 0; i < slugs.length; i += CHUNK) {
    const chunk = slugs.slice(i, i + CHUNK);
    const u = new URL(`${SUPABASE_URL}/rest/v1/parts`);
    u.searchParams.set('select', 'slug,images,image_url');
    u.searchParams.set('slug', `in.(${chunk.map((s) => `"${s}"`).join(',')})`);
    const res = await fetch(u.toString(), {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
    });
    if (!res.ok) {
      throw new Error(`REST parts ${res.status}: ${(await res.text()).slice(0, 120)}`);
    }
    for (const row of await res.json()) {
      state.set(row.slug, partHasImage(row));
    }
  }
  return state;
}

// Lit parts(id, slug) par lots → Map<slug, id>. Le redétourage forcé a besoin de l'UUID
// sans repasser par bulk-insert-parts. Lève en cas d'échec HTTP.
async function fetchPartIdsBySlug(slugs) {
  const map = new Map();
  if (!SUPABASE_ANON || slugs.length === 0) return map;
  const CHUNK = 100;
  for (let i = 0; i < slugs.length; i += CHUNK) {
    const chunk = slugs.slice(i, i + CHUNK);
    const u = new URL(`${SUPABASE_URL}/rest/v1/parts`);
    u.searchParams.set('select', 'id,slug');
    u.searchParams.set('slug', `in.(${chunk.map((s) => `"${s}"`).join(',')})`);
    const res = await fetch(u.toString(), {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
    });
    if (!res.ok) throw new Error(`REST parts ${res.status}: ${(await res.text()).slice(0, 120)}`);
    for (const row of await res.json()) map.set(row.slug, row.id);
  }
  return map;
}

async function bulkInsert(parts) {
  const url = `${SUPABASE_URL}/functions/v1/bulk-insert-parts`;
  const processImgUrl = `${SUPABASE_URL}/functions/v1/process-images`;
  const groups = groupByCategory(parts);
  const categories = Object.keys(groups);
  console.log(`[sync] ${categories.length} catégories à insérer`);

  let totalInserted = 0;
  let errors = 0;
  let imgOk = 0, imgErr = 0, imgSkip = 0;

  // Garde-fou Option b : sans clé publishable, impossible de lire l'état image des
  // "updated" → fallback inserted-only, avec un WARN bien visible (jamais silencieux).
  const imageCheckEnabled = Boolean(SUPABASE_ANON);
  if (!imageCheckEnabled) {
    console.warn(
      '\n╔══════════════════════════════════════════════════════════════════════╗' +
      '\n║  ⚠️  VITE_SUPABASE_PUBLISHABLE_KEY absente du .env                     ║' +
      '\n║  → Impossible de vérifier l\'image des pièces "updated".               ║' +
      '\n║  → FALLBACK : seules les pièces "inserted" seront détourées.          ║' +
      '\n║  → Les pièces déjà en base SANS image ne seront PAS re-détourées.     ║' +
      '\n╚══════════════════════════════════════════════════════════════════════╝\n',
    );
  }

  for (const categoryName of categories) {
    const partsInCat = groups[categoryName];
    process.stdout.write(`[sync] → ${categoryName} (${partsInCat.length} pièces)... `);

    let result;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': ADMIN_BULK_SECRET,
        },
        body: JSON.stringify({ categoryName, parts: partsInCat, skip_ai: true }),
      });

      if (!res.ok) {
        errors++;
        const text = await res.text();
        console.log(`❌ ${res.status}\n   ${text}`);
        continue;
      }

      result = await res.json();
      const inserted = result.results?.inserted ?? result.inserted ?? partsInCat.length;
      const updated = result.results?.updated ?? 0;
      totalInserted += inserted;
      console.log(`✅ ${inserted} insérées · 🔄 ${updated} maj`);
    } catch (e) {
      errors++;
      console.log(`❌ ${e.message}`);
      continue;
    }

    // ── Détourage des Photos source ────────────────────────────────────────────
    // Détoure si status==="inserted" OU (status==="updated" ET pas encore d'image en
    // base). "pas d'image" = prédicat identique au front (partHasImage / getPrimaryImage).
    const rows = result.results?.rows;
    if (Array.isArray(rows)) {
      const urlsBySlug = new Map(
        partsInCat
          .filter((p) => Array.isArray(p.source_image_urls) && p.source_image_urls.length > 0)
          .map((p) => [p.slug, p.source_image_urls]),
      );

      // Slugs "updated" candidats (ont des photos source) → on lit leur état image en
      // base pour ne re-détourer que celles qui n'ont pas encore d'image.
      const updatedSlugs = rows
        .filter((r) => r.status === 'updated' && urlsBySlug.has(r.slug))
        .map((r) => r.slug);

      let imgState = new Map(); // slug → bool (a déjà une image)
      if (imageCheckEnabled && updatedSlugs.length > 0) {
        try {
          imgState = await fetchPartsImageState(updatedSlugs);
        } catch (e) {
          console.warn(
            `\n   ⚠  Lecture images "updated" échouée (${categoryName}) : ${e.message}` +
            `\n   ⚠  → fallback inserted-only pour cette catégorie (pas de re-détourage des updated).`,
          );
          // Prudence : tout marquer "a une image" → les updated sont skip.
          imgState = new Map(updatedSlugs.map((s) => [s, true]));
        }
      }

      for (const r of rows) {
        const isInserted = r.status === 'inserted';
        const isUpdatedNoImage =
          imageCheckEnabled && r.status === 'updated' && imgState.get(r.slug) !== true;
        if (!isInserted && !isUpdatedNoImage) { imgSkip++; continue; }
        const srcUrls = urlsBySlug.get(r.slug);
        if (!srcUrls) { imgSkip++; continue; }
        if (!r.id) {
          console.log(`   ⚠  Images ${r.slug} : UUID absent dans la réponse, skip`);
          imgSkip++; continue;
        }
        const tag = isInserted ? 'nouvelle' : 'updated sans image';
        process.stdout.write(`   🖼  Images ${r.slug} (${tag}) : traitement...`);
        const imgResult = await processImages(r.id, srcUrls, r.name, ADMIN_BULK_SECRET, processImgUrl);
        if (imgResult.ok) {
          if (imgResult.failed > 0) {
            process.stdout.write(` ✅ ${imgResult.processed}/${srcUrls.length} ok, ${imgResult.failed} erreur(s)\n`);
          } else {
            process.stdout.write(` ✅ ${imgResult.processed}/${srcUrls.length} ok\n`);
          }
          imgOk++;
        } else {
          process.stdout.write(` ⚠  0/${srcUrls.length} ok — ${imgResult.errors.join('; ') || 'aucune image traitée'}\n`);
          imgErr++;
        }
      }
    }
  }

  console.log(`\n[sync] ✅ Total: ${totalInserted} pièces insérées (published: false)`);
  console.log(`[sync] 🖼  Images: ${imgOk} ok, ${imgErr} erreur(s), ${imgSkip} skip`);
  console.log(`[sync] ⚠️  Erreurs catégories: ${errors}`);
}

// ─── Redétourage forcé (FORCE_REDETOURE) — chambres à air, IMAGE UNIQUEMENT ──────
// Pour chaque chambre avec photos source Airtable : détoure @imgly local et ÉCRASE
// l'image en base (process-images reset:true). AUCUN upsert de pièce → prix, stock,
// published, SEO, slug, ean strictement inchangés.
async function forceRedetoureChambres(parts) {
  const processImgUrl = `${SUPABASE_URL}/functions/v1/process-images`;
  const targets = parts.filter(
    (p) => slugify(p._categoryName) === FORCE_REDETOURE_CATEGORY_SLUG &&
           Array.isArray(p.source_image_urls) && p.source_image_urls.length > 0,
  );
  console.log(`\n[force-redétoure] Chambres à air : ${targets.length} pièce(s) avec photos source.`);
  if (targets.length === 0) { console.log('[force-redétoure] Rien à faire.'); return; }

  let idBySlug;
  try {
    idBySlug = await fetchPartIdsBySlug(targets.map((p) => p.slug));
  } catch (e) {
    console.error(`[force-redétoure] ❌ Lecture des UUID échouée : ${e.message}. Abandon (rien écrit).`);
    return;
  }

  let ok = 0, err = 0, skip = 0;
  for (const p of targets) {
    const id = idBySlug.get(p.slug);
    if (!id) { console.log(`   ⚠  ${p.slug} : absente en base → skip`); skip++; continue; }
    process.stdout.write(`   🖼  ${p.slug} (redétoure forcé) : traitement...`);
    const r = await processImages(id, p.source_image_urls, p.name, ADMIN_BULK_SECRET, processImgUrl);
    if (r.ok) {
      process.stdout.write(` ✅ ${r.processed}/${p.source_image_urls.length} ok${r.failed ? `, ${r.failed} erreur(s)` : ''}\n`);
      ok++;
    } else {
      process.stdout.write(` ⚠  0/${p.source_image_urls.length} — ${r.errors.join('; ') || 'aucune image traitée'}\n`);
      err++;
    }
  }
  console.log(`\n[force-redétoure] ✅ ${ok} ré-détourée(s), ${err} erreur(s), ${skip} skip.`);
  console.log('[force-redétoure] Prix / stock / published / SEO : NON touchés (image uniquement).');
}

function printDryRun(parts) {
  // Groupement local SANS strip (on garde _photoPrincipale pour l'affichage).
  const groups = {};
  for (const p of parts) {
    (groups[p._categoryName] ??= []).push(p);
  }
  console.log('\n[sync] === DRY-RUN (aucun POST, aucun détourage) ===');
  for (const [categoryName, partsInCat] of Object.entries(groups)) {
    console.log(`\n▼ ${categoryName} (${partsInCat.length})`);
    for (const p of partsInCat) {
      const sup = p.supplier ? `${p.supplier.name}${p.supplier.sku ? '/' + p.supplier.sku : ''}` : '—';
      const nbPhotos = Array.isArray(p.source_image_urls) ? p.source_image_urls.length : 0;
      const elec = p.electrical_specs
        ? `[${p.electrical_specs.voltages.join(',')}]${p.electrical_specs.connector ? ' ' + p.electrical_specs.connector : ''}`
        : '—';
      const fit = p.fitment_specs ? JSON.stringify(p.fitment_specs) : '—';
      console.log(
        `  • ${p.name} | sku=${p.sku} | price=${p.price} | stock=${p.stock_quantity} | ` +
        `ean=${p.ean ? 'oui' : 'non'} | specs=${p.characteristics ? 'oui' : 'non'} | ` +
        `compat=${p.compatibility_source ? 'oui' : 'non'} | photos_source=${nbPhotos} | ` +
        `elec=${elec} | fit=${fit} | photo_principale=${p._photoPrincipale ? 'oui' : 'non'} | supplier=${sup}`,
      );
    }
  }
  console.log('\n[sync] image_url sera null à l\'insert puis rempli par le détourage (process-images + trigger).');
  console.log('[sync] Dry-run terminé. Mettre DRY_RUN=false dans .env pour insérer + détourer.');
}

// Aperçu lecture seule (DRY_RUN) : prédit quelles pièces seraient détourées en run réel,
// via le même état image que le run réel (fetchPartsImageState). Aucun POST.
//   - slug absent de la base  → serait "inserted" → détoure
//   - slug présent sans image → serait "updated"  → détoure
//   - slug présent avec image → skip
async function printDetourPreview(parts) {
  console.log('\n[sync] === APERÇU DÉTOURAGE (lecture seule, aucun POST) ===');
  if (!SUPABASE_ANON) {
    console.warn(
      '[sync] ⚠️  VITE_SUPABASE_PUBLISHABLE_KEY absente → aperçu indisponible.' +
      '\n[sync] ⚠️  En run réel : fallback inserted-only (les updated sans image ne seraient PAS détourées).',
    );
    return;
  }

  const candidates = parts.filter(
    (p) => Array.isArray(p.source_image_urls) && p.source_image_urls.length > 0,
  );
  if (candidates.length === 0) {
    console.log('[sync] Aucune pièce avec photos source → rien à détourer.');
    return;
  }

  const slugs = [...new Set(candidates.map((p) => p.slug))];
  let state;
  try {
    state = await fetchPartsImageState(slugs);
  } catch (e) {
    console.warn(`[sync] ⚠️  Lecture images échouée : ${e.message} → aperçu indisponible.`);
    return;
  }

  let willInsert = 0, willUpdateNoImg = 0, willSkip = 0;
  for (const p of candidates) {
    if (!state.has(p.slug)) {
      willInsert++;
      console.log(`  + ${p.slug} — nouvelle pièce → détoure`);
    } else if (state.get(p.slug) !== true) {
      willUpdateNoImg++;
      console.log(`  ~ ${p.slug} — déjà en base, sans image → détoure`);
    } else {
      willSkip++;
    }
  }
  console.log(
    `\n[sync] Aperçu : ${willInsert} nouvelle(s) + ${willUpdateNoImg} updated sans image ` +
    `= ${willInsert + willUpdateNoImg} à détourer · ${willSkip} déjà une image → skip.`,
  );
}

// Aperçu (DRY_RUN + FORCE_REDETOURE) : liste les chambres dont l'image serait ÉCRASÉE.
function printForceRedetourePreview(parts) {
  console.log('\n[sync] === APERÇU REDÉTOURAGE FORCÉ (chambres, lecture seule, aucun POST) ===');
  const inCat = parts.filter((p) => slugify(p._categoryName) === FORCE_REDETOURE_CATEGORY_SLUG);
  const targets = inCat.filter((p) => Array.isArray(p.source_image_urls) && p.source_image_urls.length > 0);
  const noPhoto = inCat.filter((p) => !Array.isArray(p.source_image_urls) || p.source_image_urls.length === 0);
  for (const p of targets) {
    console.log(`  ! ${p.slug} — ${p.source_image_urls.length} photo(s) source → image ÉCRASÉE`);
  }
  for (const p of noPhoto) console.log(`  · ${p.slug} — aucune photo source → inchangée`);
  console.log(
    `\n[sync] FORCE_REDETOURE : ${targets.length} chambre(s) seraient ré-détourée(s), ` +
    `${noPhoto.length} sans photo source (inchangée). Prix/stock/published/SEO non touchés.`,
  );
}

(async () => {
  try {
    if (DRY_RUN) console.log('[sync] Mode DRY-RUN activé.');
    const lookups = await buildLookups();
    console.log('[sync] Lecture table Pièces...');
    const records = await fetchTable(AIRTABLE_TABLE_ID);
    console.log(`[sync] ${records.length} records Pièces`);

    // 2ᵉ passe : champs d'enrichissement lus par FIELD ID (returnFieldsByFieldId).
    // Fusionnés par record id dans filterAndMap. L'existant (lu par nom) est intact.
    console.log('[sync] Lecture champs d\'enrichissement (par field ID)...');
    const enrichById = new Map();
    for (const r of await fetchTable(
      AIRTABLE_TABLE_ID,
      [
        F_PIECE_EAN, F_PIECE_CARACTERISTIQUES, F_PIECE_COMPAT_SOURCE, F_PIECE_PHOTOS_SOURCE,
        F_PIECE_FIT_RIM_DIAMETERS, F_PIECE_FIT_TIRE_SECTIONS, F_PIECE_FIT_DISC_DIAMETERS,
        F_PIECE_FIT_DISC_PCDS, F_PIECE_FIT_DISC_HOLES, F_PIECE_FIT_CALIPER,
      ],
      true,
    )) {
      enrichById.set(r.id, r.fields);
    }

    const parts = filterAndMap(records, lookups, enrichById);
    if (parts.length === 0) {
      console.log('[sync] Aucune pièce à insérer. Arrêt.');
      return;
    }

    warnMissingPartKeys(parts);

    if (DRY_RUN) {
      printDryRun(parts);
      await printDetourPreview(parts);
      if (FORCE_REDETOURE) printForceRedetourePreview(parts);
      return;
    }

    if (FORCE_REDETOURE) {
      await forceRedetoureChambres(parts);
      return;          // passe image-only : on NE lance PAS bulkInsert (pas de re-sync data)
    }

    await bulkInsert(parts);
    console.log('\n[sync] 🎉 Terminé. Va sur /admin → "Pièces Bot" pour valider, puis relance le matching (bouton retrigger).');
  } catch (e) {
    console.error('[sync] ❌ Fatal:', e);
    process.exit(1);
  }
})();
