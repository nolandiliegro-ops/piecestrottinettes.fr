#!/usr/bin/env node
// scripts/suppliers/plug-crawl.mjs
// « Chercheur de prises » : lit les catalogues PUBLICS des boutiques concurrentes
// (API WooCommerce Store / Shopify products.json, sans connexion, sans Firecrawl)
// et extrait, pour chaque chargeur ou PORT DE CHARGE vendu « pour <modèle> » :
//   { source, kind (chargeur|port|adaptateur), title, model_hints[], plug, voltage_out, ean, sku, url, image }
// Aucune écriture en base : la corroboration (2 sources indépendantes) et l'écriture
// se font ensuite, côté Claude, dans fitment_raw (claim_type charge_port_*).
//
// Usage : node scripts/suppliers/plug-crawl.mjs --out ../data/fournisseurs/prises

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const OUT = resolve(args.includes('--out') ? args[args.indexOf('--out') + 1] : './prises-out');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const UA = { 'user-agent': 'pt-catalogue-reader/1.0', accept: 'application/json' };

// ---------- Dictionnaire prises (ordre = priorité ; codes = fitment_charge_connectors) ----------
export const PLUG_RULES = [
  [/lp[\s-]?16/i, 'LP16-3'],
  [/gx[\s-]?16[\s-]?4|gx16.{0,6}4\s?(pins?|p\b|broches)/i, 'GX16-4'],
  [/gx[\s-]?16[\s-]?2\s?p|gx16.{0,6}2\s?(pins?|broches)/i, 'GX16-2'],
  [/gx[\s-]?16/i, 'GX16-3'],
  [/gx[\s-]?12/i, 'GX12-3'],
  [/xlr/i, 'XLR-3'],
  [/xt[\s-]?90/i, 'XT90'],
  [/xt[\s-]?60/i, 'XT60'],
  [/\bcq\b/i, 'CQ'],
  [/julet/i, 'JULET'],
  [/rca\s?10\s?mm|10\s?mm\s?rca/i, 'RCA10'],
  [/rca|rond\s?8\s?mm|8\s?mm/i, 'RCA'],
  [/magn[ée]tique/i, 'XIAOMI-MAG'],
  [/dc\s?5[.,]5\s?[x*\/×-]?\s?2[.,]1|5[.,]5\s?[x*\/×]\s?2[.,]1/i, 'DC5.5x2.1'],
  [/dc\s?5[.,]5\s?[x*\/×-]?\s?2[.,]5|5[.,]5\s?[x*\/×]\s?2[.,]5/i, 'DC5.5x2.5'],
  [/\biec\b|c13|c14|câble secteur|cable secteur/i, 'IEC'],
  [/connecteur\s+(type\s+)?xiaomi|t[êe]te\s+xiaomi|xiaomi[\s-]style/i, 'TYPE-XIAOMI'],
];

export function detectPlug(text) {
  const t = String(text || '');
  for (const [re, code] of PLUG_RULES) if (re.test(t)) return code;
  return null;
}

// Adaptateur : la prise qui compte est celle CÔTÉ TROTTINETTE, après « vers » (GX16 vers RCA → RCA).
export function plugFor(kind, title, desc) {
  if (kind === 'adaptateur') {
    const m = String(title || '').match(/\bvers\b(.*)$/i);
    if (m) return detectPlug(m[1]);
  }
  return detectPlug(title) || detectPlug(desc);
}

// Disque : diamètre (mm), nombre de trous de fixation, entraxe (PCD) si écrit.
export function detectDisc(text) {
  const t = String(text || '');
  const d = t.match(/(\d{3})\s?mm/i) || t.match(/[ØΦø]\s?(\d{3})/);
  const h = t.match(/(\d)\s?(trous|holes|vis|fixations)/i);
  const pcd = t.match(/(?:entraxe|pcd)\D{0,6}(\d{2,3}(?:[.,]\d)?)/i);
  return { diameter: d ? Number(d[1]) : null, holes: h ? Number(h[1]) : null, pcd: pcd ? Number(pcd[1].replace(',', '.')) : null };
}

// Tension de SORTIE du chargeur (54.6V, 42V, 67.2V…) ; la nominale se déduit ensuite.
export function detectVoltageOut(text) {
  const vs = [...String(text || '').matchAll(/(\d{2}(?:[.,]\d)?)\s?v\b/gi)].map((m) => parseFloat(m[1].replace(',', '.')));
  if (vs.length === 0) return null;
  return Math.max(...vs);
}

export function detectKind(text) {
  const t = String(text || '').toLowerCase();
  if (/disque|\bdisc\b|rotor/.test(t)) return 'disque';
  if (/plaquette|brake pad/.test(t)) return 'plaquette';
  if (/[ée]trier|caliper/.test(t)) return 'etrier';
  if (/chambre\s+[àa]\s+air|inner tube/.test(t)) return 'chambre';
  if (/pneu|tire|tyre/.test(t)) return 'pneu';
  if (/port\s+de\s+charge|prise\s+de\s+charge|charging\s+port|charge\s+port/.test(t)) return 'port';
  if (/adaptat|embout|convertisseur/.test(t)) return 'adaptateur';
  if (/chargeur|charger|cargador/.test(t)) return 'chargeur';
  return null;
}

// ---------- Sources ----------
// WooCommerce Store API (publique). Une recherche par terme, pagination X-WP-TotalPages.
async function wooSearch(base, term, source) {
  const out = [];
  for (let page = 1; page <= 30; page++) {
    const url = `${base}/wp-json/wc/store/v1/products?search=${encodeURIComponent(term)}&per_page=100&page=${page}`;
    const res = await fetch(url, { headers: UA });
    if (!res.ok) { if (page === 1) throw new Error(`${source} ${term} : HTTP ${res.status}`); break; }
    const arr = await res.json();
    if (!Array.isArray(arr) || arr.length === 0) break;
    for (const p of arr) {
      const cats = (p.categories || []).map((c) => c.name).join(' | ');
      const desc = String(p.short_description || '').replace(/<[^>]+>/g, ' ');
      out.push({
        source, title: p.name, cats, desc: desc.slice(0, 600),
        sku: p.sku || null, url: p.permalink, image: p.images?.[0]?.src || null,
        price: p.prices?.price ? Number(p.prices.price) / 10 ** (p.prices.currency_minor_unit ?? 2) : null,
      });
    }
    const total = Number(res.headers.get('x-wp-totalpages') || 1);
    if (page >= total) break;
    await sleep(500);
  }
  return out;
}

// Shopify products.json (publique).
async function shopifyAll(base, source) {
  const out = [];
  for (let page = 1; page <= 40; page++) {
    const res = await fetch(`${base}/products.json?limit=250&page=${page}`, { headers: UA });
    if (!res.ok) { if (page === 1) throw new Error(`${source} : HTTP ${res.status}`); break; }
    const j = await res.json();
    if (!j.products || j.products.length === 0) break;
    for (const p of j.products) {
      const body = String(p.body_html || '').replace(/<[^>]+>/g, ' ');
      for (const v of p.variants || [{}]) {
        out.push({
          source, title: v.title && v.title !== 'Default Title' ? `${p.title} — ${v.title}` : p.title,
          cats: [p.product_type, ...(p.tags || [])].join(' | '), desc: body.slice(0, 600),
          sku: v.sku || null, ean: v.barcode || null, url: `${base}/products/${p.handle}`,
          image: p.images?.[0]?.src?.split('?')[0] || null, price: v.price ? Number(v.price) : null,
        });
      }
    }
    await sleep(400);
  }
  return out;
}

// Liste des boutiques : une source qui échoue est NOTÉE, jamais bloquante (sauf si TOUTES échouent).
export const SOURCES = [
  { id: 'e-watts', type: 'woo', base: 'https://e-watts.fr', terms: ['chargeur', 'port de charge', 'adaptateur chargeur', 'disque', 'plaquette', 'pneu', 'chambre a air', 'etrier'] },
  { id: 'ewheel', type: 'shopify', base: 'https://ewheel.es/fr' },
];

const RELEVANT = /chargeur|charger|cargador|port de charge|prise de charge|charging port|adaptat|disque|disc|plaquette|pad|pneu|tire|tyre|chambre|tube|[ée]trier|caliper/i;

async function main() {
  const rows = [];
  const report = [];
  for (const s of SOURCES) {
    try {
      let got = [];
      if (s.type === 'woo') for (const t of s.terms) { got.push(...(await wooSearch(s.base, t, s.id))); await sleep(500); }
      else got = await shopifyAll(s.base, s.id);
      const seen = new Set();
      const kept = got.filter((r) => RELEVANT.test(r.title + ' ' + r.cats) && !seen.has(r.url + r.title) && seen.add(r.url + r.title));
      for (const r of kept) {
        const kind = detectKind(r.title);
        rows.push({ ...r, kind, plug: ['chargeur', 'port', 'adaptateur'].includes(kind) ? plugFor(kind, r.title, r.desc) : null, voltage_out: kind === 'chargeur' ? detectVoltageOut(r.title) : null, disc: kind === 'disque' ? detectDisc(`${r.title} ${r.desc}`) : null });
      }
      report.push(`- ${s.id} : ${got.length} lus · ${kept.length} pertinents`);
    } catch (e) {
      report.push(`- ${s.id} : ÉCHEC ${e.message}`);
    }
  }
  if (rows.length === 0) throw new Error('0 ligne utile toutes sources confondues — rien n\'est écrit.\n' + report.join('\n'));
  const withPlug = rows.filter((r) => r.plug).length;
  mkdirSync(OUT, { recursive: true });
  writeFileSync(resolve(OUT, 'prises-brut.json'), JSON.stringify(rows, null, 1));
  writeFileSync(resolve(OUT, 'prises-resume.md'),
    `# Chercheur de prises — ${new Date().toISOString().slice(0, 10)}\n\n${report.join('\n')}\n\n- Lignes : ${rows.length}\n- Avec prise détectée : ${withPlug}\n` +
    `- Par type : ${['chargeur', 'port', 'adaptateur', 'disque', 'plaquette', 'etrier', 'pneu', 'chambre'].map((k) => `${k} ${rows.filter((r) => r.kind === k).length}`).join(' · ')}\n`);
  console.log(`[prises] ${rows.length} lignes · ${withPlug} avec prise\n${report.join('\n')}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error('[prises] ÉCHEC :', e.message); process.exit(1); });
}
