#!/usr/bin/env node
/**
 * scripts/catalogue-collections.mjs — 17/10/2026. LECTURE SEULE.
 * Shopify : /collections.json → collections dont le titre nomme une marque de trottinette → /collections/<h>/products.json
 * WooCommerce : /wp-json/wc/store/v1/products (catégories structurées).
 * Garde pneus / chambres / disques / plaquettes. Sortie : out/collections/<domaine>.jsonl  { coll, t, u }
 * (coll = titre de la collection ou catégorie = le(s) modèle(s) équipé(s)).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
const OUT = 'out/collections'; mkdirSync(OUT, { recursive: true });
const doms = readFileSync('config/catalogue/collections.txt', 'utf-8').split('\n').map((s) => s.trim()).filter((s) => s && !s.startsWith('#'));
const BRANDS = /xiaomi|ninebot|segway|dualtron|minimotors|kaabo|vsett|zero|kukirin|kugoo|navee|iscooter|isinwheel|hiboy|urbanglide|urban glide|cecotec|aprilia|ducati|jeep|joyor|teverun|nami|inokim|inmotion|engwe|smartgyro|wispeed|speedway|zwheel|yeep|pure|niu|apollo|e-?twow|beaster|bogist|dyu|hikerboy|hitway|halo|kingsong|kuickwheel|langfeite|laotie|micro|ootd|oxelo|punk|soflow|velity|weped|mobygum|egret|razor|lexgo|wegoboard/i;
const KEEP = /pneu|chambre|tube|tire|tyre|reifen|schlauch|disque|disc|rotor|bremsscheibe|plaquette|pad|belag/i;
const UA = { 'user-agent': 'Mozilla/5.0 (compatible; pt-catalogue/1.1)', accept: 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJson(url) {
  for (let i = 0; i < 3; i++) {
    try { const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30000) }); if (r.status === 429) { await sleep(8000); continue; } if (!r.ok) return { err: r.status }; return { j: await r.json() }; } catch (e) { if (i === 2) return { err: e.message.slice(0, 60) }; await sleep(2000); }
  }
  return { err: 'retry' };
}
const strip = (h) => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&#215;/g, 'x').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const summary = [];
for (const d of doms) {
  const base = `https://${d}`; const rows = []; let kind = null, colls = 0, err = null;
  const all = [];
  for (let p = 1; p <= 40; p++) {
    const { j, err: e } = await getJson(`${base}/collections.json?limit=250&page=${p}`);
    if (!j?.collections) { if (p === 1) err = `collections:${e ?? 'non'}`; break; }
    kind = 'shopify'; if (!j.collections.length) break; all.push(...j.collections); await sleep(500);
  }
  const target = all.filter((c) => BRANDS.test(c.title) && c.products_count !== 0);
  for (const c of target) {
    colls++;
    for (let p = 1; p <= 8; p++) {
      const { j } = await getJson(`${base}/collections/${c.handle}/products.json?limit=250&page=${p}`);
      if (!j?.products?.length) break;
      for (const x of j.products) if (KEEP.test(`${x.title} ${x.product_type}`)) rows.push({ coll: c.title, t: strip(x.title), u: `${base}/products/${x.handle}` });
      if (j.products.length < 250) break;
      await sleep(400);
    }
    await sleep(400);
  }
  if (!kind) {
    for (let p = 1; p <= 80; p++) {
      const { j, err: e } = await getJson(`${base}/wp-json/wc/store/v1/products?per_page=100&page=${p}`);
      if (!Array.isArray(j)) { if (p === 1) err = `${err} woo:${e ?? 'non'}`; break; }
      kind = 'woo'; if (!j.length) break;
      for (const x of j) { const t = strip(x.name); if (!KEEP.test(t)) continue; for (const c of x.categories || []) if (BRANDS.test(c.name)) rows.push({ coll: strip(c.name), t, u: x.permalink }); }
      await sleep(600);
    }
  }
  writeFileSync(`${OUT}/${d}.jsonl`, rows.map((r) => JSON.stringify(r)).join('\n'));
  summary.push({ d, kind, collections_marque: colls, lignes: rows.length, err: kind ? null : err });
  console.log(`::notice title=${d}::${kind ?? 'ÉCHEC'} · ${colls} collections marque · ${rows.length} lignes${kind ? '' : ' · ' + err}`);
}
writeFileSync(`${OUT}/_resume.json`, JSON.stringify(summary, null, 1));
