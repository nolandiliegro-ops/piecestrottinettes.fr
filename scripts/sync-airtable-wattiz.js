// scripts/sync-airtable-wattiz.js
// Sync Airtable Wattiz → Supabase via bulk-insert-parts

import 'dotenv/config';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appDxDZLEUhixqTXi';
const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID || 'tblAarioxwA7r5623';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const ADMIN_BULK_SECRET = process.env.ADMIN_BULK_SECRET;

if (!AIRTABLE_API_KEY) { console.error('❌ AIRTABLE_API_KEY manquante'); process.exit(1); }
if (!SUPABASE_URL) { console.error('❌ SUPABASE_URL manquante'); process.exit(1); }
if (!ADMIN_BULK_SECRET) { console.error('❌ ADMIN_BULK_SECRET manquante'); process.exit(1); }

const CATEGORY_MAP = {
  'Trottinette / ROUES / Pneus Plein':                 'Pneu plein',
  'Trottinette / ROUES / Chambres à air':              'Chambres à Air',
  'Trottinette / Freinage / Plaquettes de frein':      'Plaquettes',
  'Trottinette / BATTERIES ET CHARGEURS / Chargeurs':  'Chargeurs',
};

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

function parseImages(imagesField) {
  if (!imagesField) return [];
  return imagesField.split(' - ').map(s => s.trim()).filter(Boolean);
}

async function fetchAirtableRecords() {
  console.log('[wattiz-sync] Lecture Airtable...');
  let allRecords = [];
  let offset = null;
  do {
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`);
    url.searchParams.set('pageSize', '100');
    if (offset) url.searchParams.set('offset', offset);
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
    });
    if (!res.ok) throw new Error(`Airtable ${res.status}: ${await res.text()}`);
    const data = await res.json();
    allRecords = allRecords.concat(data.records);
    offset = data.offset;
  } while (offset);
  console.log(`[wattiz-sync] ${allRecords.length} records totaux`);
  return allRecords;
}

function filterAndMap(records) {
  const filtered = [];
  const skipped = { notFlagged: 0, badCategory: 0, missingFields: 0 };
  for (const r of records) {
    const f = r.fields;
    if (!f['pieces trottinettes '] || !f['Priotité site']) {
      skipped.notFlagged++;
      continue;
    }
    const catName = f['CATEGORIES']?.name || f['CATEGORIES'];
    const categoryId = CATEGORY_MAP[catName];
    if (!categoryId) {
      skipped.badCategory++;
      continue;
    }
    if (!f['NAME'] || !f['SKU'] || f['PRICE_HT'] == null) {
      skipped.missingFields++;
      continue;
    }
    const images = parseImages(f['IMAGES']);
    filtered.push({
      _categoryName: CATEGORY_MAP[catName],
      name: f['NAME'],
      slug: slugify(f['NAME']),
      sku: f['SKU'],
      price: f['PRICE_HT'] / 100,
      image_url: images[0] || null,
      stock_quantity: 0,
      technical_metadata: {
        type: f['TYPE']?.name || null,
        brand: f['MARQUE']?.name || null,
        weight_g: f['WEIGHT_KG'] || null,
        dimensions: {
          width_cm: f['WIDTH_CM'] || null,
          height_cm: f['HEIGHT_CM'] || null,
          depth_cm: f['DEPTH_CM'] || null,
        },
        features: f['FEATURES']?.name || null,
        public_price_ttc: f['PUBLIC_PRICE_TTC'] ? f['PUBLIC_PRICE_TTC'] / 100 : null,
        images: images,
      },
      supplier: {
        name: 'wattiz',
        url: f['PRODUIT'] || null,
        sku: f['SKU'],
        ean: f['EAN'] || null,
        airtable_id: r.id,
      },
    });
  }
  console.log(`[wattiz-sync] Filtré: ${filtered.length} | Skip non-flaggés: ${skipped.notFlagged} | Skip cat non whitelist: ${skipped.badCategory} | Skip champs manquants: ${skipped.missingFields}`);
  return filtered;
}

async function bulkInsert(parts) {
  const url = `${SUPABASE_URL}/functions/v1/bulk-insert-parts`;

  const groups = {};
  for (const p of parts) {
    const cat = p._categoryName;
    if (!groups[cat]) groups[cat] = [];
    const { _categoryName, ...cleanPart } = p;
    groups[cat].push(cleanPart);
  }

  const categories = Object.keys(groups);
  console.log(`[wattiz-sync] ${categories.length} catégories à insérer`);

  let totalInserted = 0;
  let errors = 0;

  for (const categoryName of categories) {
    const partsInCat = groups[categoryName];
    process.stdout.write(`[wattiz-sync] → ${categoryName} (${partsInCat.length} pièces)... `);

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
      const inserted = result.inserted || result.count || partsInCat.length;
      totalInserted += inserted;
      console.log(`✅ ${inserted} insérés`);
    } catch (e) {
      errors++;
      console.log(`❌ ${e.message}`);
    }
  }

  console.log(`\n[wattiz-sync] ✅ Total: ${totalInserted} pièces insérées (published: false)`);
  console.log(`[wattiz-sync] ⚠️  Erreurs catégories: ${errors}`);
}

(async () => {
  try {
    const records = await fetchAirtableRecords();
    const parts = filterAndMap(records);
    if (parts.length === 0) {
      console.log('[wattiz-sync] Aucune pièce à insérer. Arrêt.');
      return;
    }
    await bulkInsert(parts);
    console.log('\n[wattiz-sync] 🎉 Terminé. Va sur /admin → "Pièces Bot" pour valider.');
  } catch (e) {
    console.error('[wattiz-sync] ❌ Fatal:', e);
    process.exit(1);
  }
})();
