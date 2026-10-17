#!/usr/bin/env node
/**
 * scripts/catalogue-revendeurs.mjs — 17/10/2026. LECTURE SEULE (aucune écriture en base).
 * Aspire les catalogues publics de revendeurs de pièces (interfaces Shopify /products.json et WooCommerce Store API),
 * ne garde que pneus / chambres à air / disques / plaquettes, et écrit out/catalogue/<domaine>.jsonl
 * (titre, url, texte de la fiche nettoyé). Le croisement avec nos modèles se fait ensuite, hors de ce script.
 * Entrée : config/catalogue/domaines.txt (un domaine par ligne).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
const OUT = 'out/catalogue'; mkdirSync(OUT, { recursive: true });
const doms = readFileSync('config/catalogue/domaines.txt', 'utf-8').split('\n').map((s) => s.trim()).filter((s) => s && !s.startsWith('#'));
const KEEP = /pneu|chambre|tube|tire|tyre|disque|disc|rotor|plaquette|pad|jante|rim|roue|wheel/i;
const UA = { 'user-agent': 'Mozilla/5.0 (compatible; pt-catalogue/1.0)', accept: 'application/json' };
const strip = (h) => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&#8217;|&rsquo;/g, "'").replace(/\s+/g, ' ').trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJson(url) {
  for (let i = 0; i < 3; i++) {
    try { const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30000) }); if (r.status === 429) { await sleep(5000); continue; } if (!r.ok) return { err: r.status }; return { j: await r.json() }; } catch (e) { if (i === 2) return { err: e.message.slice(0, 60) }; await sleep(2000); }
  }
  return { err: 'retry' };
}
const summary = [];
for (const d of doms) {
  const base = `https://${d}`; const rows = []; let kind = null, total = 0, err = null;
  // Shopify
  for (let p = 1; p <= 60; p++) {
    const { j, err: e } = await getJson(`${base}/products.json?limit=250&page=${p}`);
    if (!j?.products) { if (p === 1) err = `shopify:${e ?? 'non'}`; break; }
    kind = 'shopify'; if (!j.products.length) break; total += j.products.length;
    for (const x of j.products) { const text = `${x.title} ${x.product_type} ${(x.tags || []).join(' ')} ${strip(x.body_html)}`; if (KEEP.test(`${x.title} ${x.product_type}`)) rows.push({ t: x.title, u: `${base}/products/${x.handle}`, x: text.slice(0, 4000) }); }
    await sleep(700);
  }
  // WooCommerce Store API
  if (!kind) {
    for (let p = 1; p <= 80; p++) {
      const { j, err: e } = await getJson(`${base}/wp-json/wc/store/v1/products?per_page=100&page=${p}`);
      if (!Array.isArray(j)) { if (p === 1) err = `${err} woo:${e ?? 'non'}`; break; }
      kind = 'woo'; if (!j.length) break; total += j.length;
      for (const x of j) { const cats = (x.categories || []).map((c) => c.name).join(' '); const text = `${x.name} ${cats} ${strip(x.short_description)} ${strip(x.description)}`; if (KEEP.test(`${x.name} ${cats}`)) rows.push({ t: strip(x.name), u: x.permalink, x: text.slice(0, 4000) }); }
      await sleep(700);
    }
  }
  writeFileSync(`${OUT}/${d}.jsonl`, rows.map((r) => JSON.stringify(r)).join('\n'));
  summary.push({ d, kind, total, gardes: rows.length, err: kind ? null : err });
  console.log(`::notice title=${d}::${kind ?? 'ÉCHEC'} · ${total} produits · ${rows.length} gardés${kind ? '' : ' · ' + err}`);
}
writeFileSync(`${OUT}/_resume.json`, JSON.stringify(summary, null, 1));
