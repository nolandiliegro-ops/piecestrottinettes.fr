// scripts/sync-airtable-wattiz.js
// Sync Airtable (base catalogue relationnelle) → Supabase via bulk-insert-parts.
//
// Base : appCVWWSvCrOFSMpZ — modèle relationnel multi-fournisseurs.
//   Pièces ↔ Categories ↔ Marques ↔ Modèle Trott ↔ Liaison ↔ Fournisseurs
//
// Lit la table Pièces, résout les liens (Catégorie, fournisseur via Liaison),
// puis insère par catégorie avec skip_ai=true. La compatibilité est gérée
// ensuite par le bouton retrigger (specs + IA), pas ici.
//
// Usage :
//   node scripts/sync-airtable-wattiz.js            # insertion réelle
//   node scripts/sync-airtable-wattiz.js --dry-run  # mappe + affiche, sans POST

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

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
const DRY_RUN = process.argv.includes('--dry-run');

const AIRTABLE_API_KEY = ENV.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = ENV.AIRTABLE_BASE_ID || 'appCVWWSvCrOFSMpZ';
const AIRTABLE_TABLE_ID = ENV.AIRTABLE_TABLE_ID || 'tblV3rukuKXNjvWVw'; // Pièces
const SUPABASE_URL = ENV.SUPABASE_URL || ENV.VITE_SUPABASE_URL;
const ADMIN_BULK_SECRET = ENV.ADMIN_BULK_SECRET;

// Tables liées (résolution des record IDs → valeurs lisibles)
const TABLE_CATEGORIES = 'tbl0VC6e7p0psD9mx';
const TABLE_LIAISON = 'tbl2NhTcgrEJSDjUl';
const TABLE_FOURNISSEURS = 'tblQqhH4EXv20ynm5';

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

async function fetchTable(tableId, fields) {
  let allRecords = [];
  let offset = null;
  do {
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableId}`);
    url.searchParams.set('pageSize', '100');
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

function filterAndMap(records, lookups) {
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

    const part = {
      _categoryName: categoryName,
      name: f['Name'],
      slug: slugify(f['Name']),
      sku: f['Référence constructeur'],
      price: f['Prix affiché client TTC'] ?? null,
      stock_quantity: f['Stock Steedy'] ?? 0,
      image_url: firstAttachmentUrl(f['Photo principale']),
      description: f['Description SEO'] || null,
      meta_title: f['Meta title SEO'] || null,
      meta_description: f['Meta description SEO'] || null,
      is_featured: f['Is featured (homepage)'] === true,
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
    const { _categoryName, ...cleanPart } = p;
    groups[cat].push(cleanPart);
  }
  return groups;
}

async function bulkInsert(parts) {
  const url = `${SUPABASE_URL}/functions/v1/bulk-insert-parts`;
  const groups = groupByCategory(parts);
  const categories = Object.keys(groups);
  console.log(`[sync] ${categories.length} catégories à insérer`);

  let totalInserted = 0;
  let errors = 0;

  for (const categoryName of categories) {
    const partsInCat = groups[categoryName];
    process.stdout.write(`[sync] → ${categoryName} (${partsInCat.length} pièces)... `);

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

      const result = await res.json();
      const inserted = result.results?.inserted ?? result.inserted ?? partsInCat.length;
      const updated = result.results?.updated ?? 0;
      totalInserted += inserted;
      console.log(`✅ ${inserted} insérées · 🔄 ${updated} maj`);
    } catch (e) {
      errors++;
      console.log(`❌ ${e.message}`);
    }
  }

  console.log(`\n[sync] ✅ Total: ${totalInserted} pièces insérées (published: false)`);
  console.log(`[sync] ⚠️  Erreurs catégories: ${errors}`);
}

function printDryRun(parts) {
  const groups = groupByCategory(parts);
  console.log('\n[sync] === DRY-RUN (aucun POST) ===');
  for (const [categoryName, partsInCat] of Object.entries(groups)) {
    console.log(`\n▼ ${categoryName} (${partsInCat.length})`);
    for (const p of partsInCat) {
      const sup = p.supplier ? `${p.supplier.name}${p.supplier.sku ? '/' + p.supplier.sku : ''}` : '—';
      console.log(
        `  • ${p.name} | sku=${p.sku} | price=${p.price} | stock=${p.stock_quantity} | ` +
        `img=${p.image_url ? 'oui' : 'non'} | supplier=${sup}`,
      );
    }
  }
  console.log('\n[sync] Dry-run terminé. Relancer sans --dry-run pour insérer.');
}

(async () => {
  try {
    if (DRY_RUN) console.log('[sync] Mode DRY-RUN activé.');
    const lookups = await buildLookups();
    console.log('[sync] Lecture table Pièces...');
    const records = await fetchTable(AIRTABLE_TABLE_ID);
    console.log(`[sync] ${records.length} records Pièces`);

    const parts = filterAndMap(records, lookups);
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
