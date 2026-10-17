#!/usr/bin/env node
/**
 * scripts/ewheel-pneus.mjs — 17/10/2026. LECTURE SEULE.
 * Aspire les collections pneus / chambres / pneus pleins d'eWheel (Shopify public) avec TOUTES les données
 * utiles à l'import : référence, code-barres, prix public, dispo, photos, texte (compat « Marque#Modèle »).
 * Sortie : out/fournisseurs/ewheel/pneus.jsonl + _resume.json. Aucune écriture ailleurs.
 */
import { writeFileSync, mkdirSync } from 'fs';
const OUT = 'out/fournisseurs/ewheel'; mkdirSync(OUT, { recursive: true });
const BASE = 'https://ewheel.es';
const COLLS = ['rueda-neumatico-patinete', 'rueda-camara-patinete', 'rueda-rueda-maciza-patinete', 'rueda-neumatico-ebike', 'rueda-camara-ebike'];
const UA = { 'user-agent': 'Mozilla/5.0 (compatible; pt-catalogue/1.2)', accept: 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJson(url) {
  for (let i = 0; i < 4; i++) {
    try { const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30000) });
      if (r.status === 429) { await sleep(10000); continue; }
      if (!r.ok) return { err: r.status }; return { j: await r.json() };
    } catch (e) { if (i === 3) return { err: String(e.message).slice(0, 80) }; await sleep(3000); }
  }
  return { err: 'retry' };
}
const strip = (h) => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const seen = new Set(); const rows = []; const resume = [];
for (const c of COLLS) {
  let n = 0, err = null;
  for (let p = 1; p <= 20; p++) {
    const { j, err: e } = await getJson(`${BASE}/collections/${c}/products.json?limit=250&page=${p}`);
    if (!j?.products) { err = e ?? 'non'; break; }
    if (!j.products.length) break;
    for (const x of j.products) {
      n++;
      if (seen.has(x.id)) continue; seen.add(x.id);
      rows.push({
        collection: c, id: x.id, handle: x.handle, url: `${BASE}/products/${x.handle}`,
        title: x.title, vendor: x.vendor, type: x.product_type, tags: x.tags,
        body: strip(x.body_html).slice(0, 4000),
        variants: (x.variants || []).map((v) => ({ title: v.title, sku: v.sku, barcode: v.barcode, price: v.price, available: v.available, grams: v.grams })),
        images: (x.images || []).map((i) => i.src),
        updated_at: x.updated_at,
      });
    }
    if (j.products.length < 250) break;
    await sleep(600);
  }
  resume.push({ collection: c, produits: n, err });
  console.log(`::notice title=${c}::${n} produits${err ? ' · ERREUR ' + err : ''}`);
}
writeFileSync(`${OUT}/pneus.jsonl`, rows.map((r) => JSON.stringify(r)).join('\n'));
writeFileSync(`${OUT}/_resume.json`, JSON.stringify({ date: new Date().toISOString(), uniques: rows.length, collections: resume }, null, 1));
console.log(`::notice title=Total::${rows.length} produits uniques`);
if (!rows.length) process.exit(1);
