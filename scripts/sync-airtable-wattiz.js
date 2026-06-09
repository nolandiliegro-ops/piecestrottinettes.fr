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

const AIRTABLE_API_KEY = ENV.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = ENV.AIRTABLE_BASE_ID || 'appCVWWSvCrOFSMpZ';
const AIRTABLE_TABLE_ID = ENV.AIRTABLE_TABLE_ID || 'tblV3rukuKXNjvWVw'; // Pièces
const SUPABASE_URL = ENV.SUPABASE_URL || ENV.VITE_SUPABASE_URL;
const ADMIN_BULK_SECRET = ENV.ADMIN_BULK_SECRET;

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
      description: f['Description SEO'] || null,
      meta_title: f['Meta title SEO'] || null,
      meta_description: f['Meta description SEO'] || null,
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

    const supplier = resolveSupplier(f['Liaisons fournisseurs'], lookups);
    if (supplier) part.supplier = supplier;

    filtered.push(part);
  }

  console.log(
    `[sync] Mappées: ${filtered.length} | Skip vides: ${skipped.empty} | ` +
    `Skip sans réf: ${skipped.missingFields} | Skip sans catégorie: ${skipped.noCategory}`,
  );
  return filtered;
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

async function bulkInsert(parts) {
  const url = `${SUPABASE_URL}/functions/v1/bulk-insert-parts`;
  const processImgUrl = `${SUPABASE_URL}/functions/v1/process-images`;
  const groups = groupByCategory(parts);
  const categories = Object.keys(groups);
  console.log(`[sync] ${categories.length} catégories à insérer`);

  let totalInserted = 0;
  let errors = 0;
  let imgOk = 0, imgErr = 0, imgSkip = 0;

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

    // ── Détourage des Photos source (lignes "inserted" uniquement) ──────────────
    const rows = result.results?.rows;
    if (Array.isArray(rows)) {
      const urlsBySlug = new Map(
        partsInCat
          .filter((p) => Array.isArray(p.source_image_urls) && p.source_image_urls.length > 0)
          .map((p) => [p.slug, p.source_image_urls]),
      );

      for (const r of rows) {
        // Sémantique conservée : seules les créations se détourent (pas les maj).
        if (r.status !== 'inserted') { imgSkip++; continue; }
        const srcUrls = urlsBySlug.get(r.slug);
        if (!srcUrls) { imgSkip++; continue; }
        if (!r.id) {
          console.log(`   ⚠  Images ${r.slug} : UUID absent dans la réponse, skip`);
          imgSkip++; continue;
        }
        process.stdout.write(`   🖼  Images ${r.slug} : traitement...`);
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
      console.log(
        `  • ${p.name} | sku=${p.sku} | price=${p.price} | stock=${p.stock_quantity} | ` +
        `ean=${p.ean ? 'oui' : 'non'} | specs=${p.characteristics ? 'oui' : 'non'} | ` +
        `compat=${p.compatibility_source ? 'oui' : 'non'} | photos_source=${nbPhotos} | ` +
        `photo_principale=${p._photoPrincipale ? 'oui' : 'non'} | supplier=${sup}`,
      );
    }
  }
  console.log('\n[sync] image_url sera null à l\'insert puis rempli par le détourage (process-images + trigger).');
  console.log('[sync] Dry-run terminé. Mettre DRY_RUN=false dans .env pour insérer + détourer.');
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
      [F_PIECE_EAN, F_PIECE_CARACTERISTIQUES, F_PIECE_COMPAT_SOURCE, F_PIECE_PHOTOS_SOURCE],
      true,
    )) {
      enrichById.set(r.id, r.fields);
    }

    const parts = filterAndMap(records, lookups, enrichById);
    if (parts.length === 0) {
      console.log('[sync] Aucune pièce à insérer. Arrêt.');
      return;
    }

    if (DRY_RUN) {
      printDryRun(parts);
      return;
    }

    await bulkInsert(parts);
    console.log('\n[sync] 🎉 Terminé. Va sur /admin → "Pièces Bot" pour valider, puis relance le matching (bouton retrigger).');
  } catch (e) {
    console.error('[sync] ❌ Fatal:', e);
    process.exit(1);
  }
})();
