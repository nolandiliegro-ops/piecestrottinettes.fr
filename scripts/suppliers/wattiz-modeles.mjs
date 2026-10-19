#!/usr/bin/env node
/**
 * scripts/suppliers/wattiz-modeles.mjs — 19/10/2026. LECTURE SEULE (aucune écriture en base, aucun secret).
 * Lit les pages publiques « Marque et Modèle » de Wattiz (fournisseur B2B de piecestrottinettes.fr) :
 * https://www.wattiz.fr/fr/s/<id>/<modele> liste les pièces vendues POUR ce modèle (pneus, chambres, jantes, chargeurs…).
 * Sortie : out/wattiz/modeles.jsonl — une ligne par modèle { id, slug, nom, n, produits: [{ id, t, u, cat }] }
 *          out/wattiz/_resume.json — comptes (modèles lus, en échec, produits).
 * Le croisement avec nos trottinettes et la lecture des tailles se font ensuite, hors de ce script.
 */
import { writeFileSync, mkdirSync } from 'fs';
const OUT = 'out/wattiz'; mkdirSync(OUT, { recursive: true });
const BASE = 'https://www.wattiz.fr';
const UA = { 'user-agent': 'Mozilla/5.0 (compatible; pt-catalogue/1.0)', accept: 'text/html' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dec = (s) => String(s || '').replace(/&amp;/g, '&').replace(/&#039;|&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

async function getHtml(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30000) });
      if (r.status === 429 || r.status >= 500) { await sleep(5000 * (i + 1)); continue; }
      if (!r.ok) return { err: r.status };
      return { h: await r.text() };
    } catch (e) { if (i === 2) return { err: String(e.message).slice(0, 60) }; await sleep(3000); }
  }
  return { err: 'retry' };
}

function produits(h) {
  const out = [];
  const re = /data-id-product="(\d+)"[\s\S]{0,1500}?<a href="(https:\/\/www\.wattiz\.fr\/fr\/([a-z0-9-]+)\/\d+-[^"#?]+\.html)[^"]*" title="([^"]+)"/g;
  let m;
  while ((m = re.exec(h))) out.push({ id: m[1], u: m[2], cat: m[3], t: dec(m[4]) });
  return out;
}

// 1. Liste des modèles : lue dans le menu « Marque et Modèle » d'une page modèle.
const seed = await getHtml(`${BASE}/fr/s/689/cecotec-bongo-serie-a`);
if (!seed.h) { console.log(`::error title=wattiz::page d'amorce illisible (${seed.err})`); process.exit(1); }
const modeles = new Map();
for (const m of seed.h.matchAll(/href="https:\/\/www\.wattiz\.fr\/fr\/s\/(\d+)\/([a-z0-9-]+)"[^>]*>([^<]*)</g)) {
  if (!modeles.has(m[1])) modeles.set(m[1], { id: m[1], slug: m[2], nom: dec(m[3]) });
}
modeles.set('689', { id: '689', slug: 'cecotec-bongo-serie-a', nom: 'Cecotec Bongo Serie A' });
console.log(`::notice title=wattiz::${modeles.size} pages modèle trouvées`);

// 2. Produits de chaque modèle (pagination ?page=N jusqu'à ce qu'aucun produit nouveau n'apparaisse).
const lignes = []; let echecs = 0, totalProduits = 0;
for (const mo of modeles.values()) {
  const vus = new Map(); let err = null;
  for (let p = 1; p <= 15; p++) {
    const { h, err: e } = await getHtml(`${BASE}/fr/s/${mo.id}/${mo.slug}${p > 1 ? `?page=${p}` : ''}`);
    if (!h) { err = e; break; }
    const ps = produits(h); let neufs = 0;
    for (const x of ps) if (!vus.has(x.id)) { vus.set(x.id, x); neufs++; }
    await sleep(800);
    if (!neufs || !h.includes(`page=${p + 1}`)) break;
  }
  if (err && !vus.size) echecs++;
  totalProduits += vus.size;
  lignes.push({ ...mo, n: vus.size, err, produits: [...vus.values()] });
}
writeFileSync(`${OUT}/modeles.jsonl`, lignes.map((l) => JSON.stringify(l)).join('\n'));
const resume = { date: new Date().toISOString(), modeles: lignes.length, avec_produits: lignes.filter((l) => l.n).length, echecs, produits: totalProduits };
writeFileSync(`${OUT}/_resume.json`, JSON.stringify(resume, null, 1));
console.log(`::notice title=wattiz::${resume.modeles} modèles · ${resume.avec_produits} avec produits · ${resume.echecs} en échec · ${resume.produits} produits`);
