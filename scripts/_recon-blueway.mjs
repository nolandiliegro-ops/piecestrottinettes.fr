// scripts/_recon-blueway.mjs
// ============================================================================
// M-B — RECON de b2b.bluewaycorp.com.
//
// CE N'EST PAS L'ADAPTATEUR. C'est le script de reconnaissance qui a servi a
// decider s'il valait le coup d'en ecrire un. Il ne doit etre appele par rien.
//
// LECTURE SEULE : aucune ecriture Supabase, aucun INSERT, aucun service role.
// Sortie = des fichiers JSON locaux, hors du repo, rien d'autre.
//
// ── VERDICT DU 04/09 : NO-GO AVANT LE 14/09 ────────────────────────────────
// Blueway est une source UNIQUE de poids 3, sous le seuil d'ecriture auto de 4.
// Elle ne peut donc RIEN ecrire seule dans part_compatibility : sans source n2
// pour corroborer, chaque revendication finit en file 1-touch. Le cout (49 min
// de crawl a 1 s pour 2942 fiches) n'achete aucune compat automatique avant le
// lancement.
// A REPRENDRE APRES M-C, quand la table d'alias existera : c'est elle qui fera
// monter le taux de reconnaissance de modele. Aujourd'hui, sur le cache de
// 1600 fiches, seulement 33 couples cumulent « categorie que nous vendons » ET
// « modele reconnu en match EXACT » (extrapole ~61 sur le catalogue entier).
// Le reste des « ressemblances » vient d'une inclusion de chaine qui se trompe
// une fois sur deux : Dualtron Eagle -> dualtron-eagle-pro, Dualtron Thunder ->
// dualtron-thunder-3, Dualtron X -> dualtron-x2. Ce sont des modeles
// DIFFERENTS, pas des alias.
//
// ── 3 DEFAUTS A CORRIGER AVANT DE LE PROMOUVOIR EN ADAPTATEUR ──────────────
// (a) LE PARSEUR geom MORD. 1 succes sur 5, et il fabrique du faux : le titre
//     « Hard / Solid tyre 8" - 200X60 » sort geom_signature = "0x60" (le regex
//     a mordu sur "00X60"). Une chambre a air dont le titre ne porte qu'un
//     diametre (8") ne rend rien. A reecrire avant tout usage de geom.
// (b) LE CHAMP Brand DE LA SOURCE N'EST PAS FIABLE. Le pneu
//     « Hard/Solid tyre ... Dualtron Raptor 2 » porte Brand = Zero. Seul
//     `Modelo` fait foi. CONSEQUENCE DURE : le filtre hors-perimetre doit
//     travailler par MODELE, jamais par marque seule — d'autant qu'Inmotion
//     vend chez Blueway des monoroues (V9, V13) ET des trottinettes (S1F/L9,
//     Climber, E20) : rejeter la marque entiere perdrait 240 couples legitimes.
// (c) LE CHAMP TYPE FOURNISSEUR N'EST PAS LA VERITE CATEGORIELLE.
//     « Front Rim Assembly » (une roue complete) est type `Tyres` cote source.
//     Le type dit ce que le fournisseur a range ou, pas ce que l'objet est.
//
// robots.txt de la source : /*?attrib= , /*?order= , /*?search= sont Disallow.
// Ce script ne construit AUCUNE URL a query string. Il part du sitemap.xml
// declare dans robots.txt et ne visite que des /shop/<slug>-<id> nus.
// Crawl-delay auto-impose : 1000 ms (aucun n'est declare par la source).
// ============================================================================
//
//  /!\ REGLE D'ARBITRAGE A NE JAMAIS PERDRE — LE VETO PHYSIQUE
//
//  L'ARBITRE A UN VETO PHYSIQUE QUE LE SCORE NE PEUT JAMAIS OUTREPASSER.
//  Si la tension de sortie d'un chargeur ne correspond pas au pack nominal du
//  modele revendique, la revendication est REJETEE, meme a score 6.
//  Le poids arbitre la CONFIANCE, jamais la PHYSIQUE.
//  Le bareme fait foi (src/lib/batteryVoltage.ts).
//
//  Contre-exemple qui a motive la regle, sorti de cette recon meme :
//  produit `fast-charger-84v-official-minimotors` (sortie 95,4 V), titre
//  « DUALTRON STORM LIMITED », mais Modelo TYPE = « Dualtron X Limited,
//  Dualtron New storm, Rovoron S7 ». La Storm non-LTD est un pack 72 V.
//  Un champ type B2B pesant 3 revendique donc un chargeur 95,4 V sur un pack
//  72 V : exactement la surcharge purgee le 03/09. Le veto doit tomber avant
//  que le score ne soit meme regarde.
//  Verifie en base le 04/09 : `dualtron-storm` = 72 V / 35 Ah (publiee),
//  `dualtron-storm-ltd-2025` = 84 V / 45 Ah (fiche distincte).
//  chargeVoltageOf(72) = 84,0 V. 95,4 != 84,0 -> REJET.
//
//  EXTENSION DE LA REGLE — UN VETO QUI NE PEUT PAS CONCLURE NE VAUT PAS UN
//  FEU VERT. Si chargeVoltageOf(nominal) renvoie null (hors bareme, ou 84 V
//  dont la tension de charge n'a jamais ete lue sur une etiquette d'origine),
//  le veto ne peut pas se prononcer : la revendication tombe en file 1-touch,
//  JAMAIS en ✅ automatique. Sans ca, le trou volontaire du bareme sur 84 V
//  devient une porte d'entree. Cas concret : la ligne
//  `blueway:47:dualtron-x-limited` du meme produit.
// ============================================================================

import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { tmpdir } from "os";

// Le cache (parsed/rows/sample/summary/errors.json) vit HORS du repo, par
// defaut dans le temp de l'OS : il ne doit jamais apparaitre dans git status.
const OUT_DIR = process.env.RECON_OUT || resolve(tmpdir(), "recon-blueway");
const BASE = "https://b2b.bluewaycorp.com";
const UA = "piecestrottinettes-recon/0.1";
const CRAWL_DELAY_MS = 1000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Normalisation canonique (regle unique, sert au dedup_key) ───────────────
// 1. NFD puis suppression des diacritiques
// 2. minuscules
// 3. tout groupe de caracteres non [a-z0-9] devient un seul "-"
// 4. "-" de tete et de queue supprimes
function norm(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ── Filtre hors perimetre ───────────────────────────────────────────────────
// Blueway est massivement monoroue. Sans filtre dur on injecte des milliers de
// revendications EUC dans fitment_raw.
const BRAND_EUC = ["king song", "kingsong", "leaperkim", "nosfet"];
const BRAND_EBIKE = ["littium"];
// Signatures modele monoroue (Inmotion vend les DEUX : V* = roue, S/L/P/E = trott)
const MODEL_EUC = [
  /^ks[-\s]?\d/i,
  /^inmotion\s*v\d/i,
  /^v\d{1,2}[a-z]*$/i,
  /patton/i,
  /lynx/i,
  /oryx/i,
  /sherman/i,
  /abrams/i,
  /commander/i,
  /^s(16|18|20|22)/i,
  /aeon/i,
  /aero/i,
  /nikola/i,
  /monster/i,
];

function outOfScope(brand, modelo) {
  const b = (brand || "").toLowerCase();
  if (BRAND_EBIKE.some((x) => b.includes(x))) return "hors perimetre : velo electrique";
  if (BRAND_EUC.some((x) => b.includes(x))) return "hors perimetre : monoroue (marque)";
  if (MODEL_EUC.some((re) => re.test(modelo || ""))) return "hors perimetre : monoroue (modele)";
  return null;
}

// ID Odoo = suffixe numerique de l'URL produit (/shop/<slug>-<id>).
function odooIdFromUrl(url) {
  const m = String(url || "").match(/-(\d+)$/);
  return m ? m[1] : null;
}

// ── Parsing d'une fiche produit Odoo ────────────────────────────────────────
function decodeEntities(s) {
  return s
    .replace(/&#34;/g, "\"")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function parseProduct(html, url) {
  // Titre : og:title est propre (le <title> ajoute " | BW ")
  const og = html.match(/property="og:title"\s+content="([^"]*)"/);
  const title = og ? decodeEntities(og[1]).trim() : null;

  // Attributs types : Odoo expose tout dans data-attribute_exclusions
  // -> mapped_attribute_names = { "<value_id>": "<Attribut>: <Valeur>" }
  const blob = html.match(/data-attribute_exclusions="([^"]*)"/);
  const attrs = { brand: null, sparePart: null, modelos: [] };
  if (blob) {
    let parsed = null;
    try {
      parsed = JSON.parse(decodeEntities(blob[1]));
    } catch {
      /* fiche sans variantes */
    }
    const map = (parsed && parsed.mapped_attribute_names) || {};
    for (const label of Object.values(map)) {
      const m = String(label).match(/^\s*([^:]+?)\s*:\s*(.+?)\s*$/);
      if (!m) continue;
      const k = m[1].trim().toLowerCase();
      const value = m[2];
      if (k === "brand") attrs.brand = value;
      else if (k === "spare part") attrs.sparePart = value;
      else if (k === "modelo") attrs.modelos.push(value);
    }
  }

  // Internal Reference -> supplier_sku
  const ref = html.match(/Internal Reference:\s*<\/b>[\s\S]{0,200}?<span[^>]*>([^<]*)<\/span>/);
  const supplierSku = ref ? decodeEntities(ref[1]).trim() : null;

  const tmpl = html.match(/class="product_template_id"[^>]*value="(\d+)"/);

  return {
    url,
    title,
    brand: attrs.brand,
    sparePart: attrs.sparePart,
    modelos: attrs.modelos,
    supplierSku,
    templateId: tmpl ? tmpl[1] : null,
  };
}

// ── Mapping "Spare part" -> NOTRE vocabulaire ───────────────────────────────
// REGLE VALABLE POUR TOUTES LES SOURCES FUTURES :
//   fitment_raw.category porte TOUJOURS notre vocabulaire, jamais celui du
//   fournisseur. Valeurs autorisees = nos 7 categories + 'hors-perimetre'.
//   La valeur fournisseur EXACTE va systematiquement dans
//   raw_payload.spare_part, verbatim, y compris quand le mapping est direct.
//   Remappage vague 2 sans re-crawl :
//     WHERE category='hors-perimetre' AND raw_payload->>'spare_part'='Batteries'
const HORS = "hors-perimetre";
const CATEGORY_MAP = {
  Chargers: "chargeurs",
  "Inner tube": "chambres-a-air",
  Tyres: null, // deduit du titre (pneus / pneus-pleins)
  Bracking: null, // deduit du titre (plaquettes / disques / hors-perimetre)
  Motors: HORS,
  Controllers: HORS,
  Batteries: HORS,
  Displays: HORS,
  Wires: HORS,
  "Mechanical Parts": HORS,
  "Other Parts": HORS,
};

// La categorie n'est PAS la cle de compatibilite, c'est du confort de tri.
// Quand elle vient du titre et non d'un champ type, on pose category_inferred.
function resolveCategory(sparePart, title) {
  const mapped = Object.prototype.hasOwnProperty.call(CATEGORY_MAP, sparePart)
    ? CATEGORY_MAP[sparePart]
    : HORS;
  if (mapped !== null) return { category: mapped, inferred: false };

  const t = (title || "").toLowerCase();
  if (sparePart === "Tyres") {
    return {
      category: /\b(solid|full|plein|pleine|tubeless-solid)\b/.test(t) ? "pneus-pleins" : "pneus",
      inferred: true,
    };
  }
  // Bracking : fourre-tout freinage cote source
  if (/plaquette|brake pad|pastilla/.test(t)) return { category: "plaquettes", inferred: true };
  if (/\b(disc|disco|disque|rotor)\b/.test(t)) return { category: "disques", inferred: true };
  return { category: HORS, inferred: true }; // etriers, leviers, durites
}

// ── geom / geom_signature : uniquement pneus & chambres a air ───────────────
// Parse la geometrie depuis le titre (ex "10x2.50", "90/65-6.5").
function parseGeom(title, sparePart) {
  if (sparePart !== "Tyres" && sparePart !== "Inner tube") return { geom: null, sig: null };
  const t = title || "";
  let m = t.match(/(\d{1,2})\s*[xX*]\s*(\d{1,2}(?:[.,]\d{1,2})?)/);
  if (m) {
    const d = parseFloat(m[1]);
    const w = parseFloat(m[2].replace(",", "."));
    return { geom: { rim_in: d, section_in: w, raw: m[0] }, sig: d + "x" + w };
  }
  m = t.match(/(\d{2,3})\s*\/\s*(\d{2,3})\s*-\s*(\d{1,2}(?:[.,]\d)?)/);
  if (m) {
    const rim = parseFloat(m[3].replace(",", "."));
    return {
      geom: { rim_in: rim, section_mm: parseFloat(m[1]), aspect: parseFloat(m[2]), raw: m[0] },
      sig: m[1] + "/" + m[2] + "-" + rim,
    };
  }
  return { geom: null, sig: null };
}

// ── Fabrique une ligne fitment_raw par couple (produit x Modelo) ────────────
function toRows(p, scrapedAt) {
  const cat = resolveCategory(p.sparePart, p.title);
  const g = parseGeom(p.title, p.sparePart);
  // Identite = l'ID Odoo, suffixe numerique de l'URL. Stable, jamais absent.
  // L'Internal Reference est une DONNEE (supplier_sku), jamais une identite :
  // si elle change ou apparait cote fournisseur, la cle basculerait et la meme
  // revendication serait collectee deux fois.
  const odooId = odooIdFromUrl(p.url) || p.templateId;
  return p.modelos.map((modelo) => ({
    source: "blueway",
    source_url: p.url,
    supplier_sku: p.supplierSku,
    ean13: null, // non expose par la source
    category: cat.category,
    claim_type: "typed_b2b", // poids 3 dans l'arbitre
    dedup_key: "blueway:" + odooId + ":" + norm(modelo),
    raw_title: p.title,
    raw_model: modelo, // verbatim, jamais normalise en base
    model_slug: null, // resolution d'alias = M-C, jamais a la collecte
    raw_payload: {
      brand: p.brand,
      spare_part: p.sparePart, // valeur fournisseur VERBATIM, systematiquement
      category_inferred: cat.inferred,
      modelos: p.modelos,
      odoo_id: odooId,
      template_id: p.templateId,
    },
    geom: g.geom,
    geom_signature: g.sig,
    scraped_at: scrapedAt,
    // hors schema, pour la recon uniquement :
    _rejected: outOfScope(p.brand, modelo),
  }));
}

// ── Pipeline ────────────────────────────────────────────────────────────────
async function get(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(res.status + " " + url);
  return res.text();
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const scrapedAt = new Date().toISOString();

  console.log("[1/4] sitemap.xml (comptage catalogue, aucun fetch de fiche)");
  const xml = await get(BASE + "/sitemap.xml");
  const all = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const allProducts = [
    ...new Set(
      all.filter((u) => u.includes("/shop/") && !u.includes("/shop/category/") && !u.includes("?")),
    ),
  ];
  console.log("      " + all.length + " URL, dont " + allProducts.length + " fiches produit");
  await sleep(CRAWL_DELAY_MS);

  // Le perimetre de fitment_raw = les PIECES. On enumere la categorie
  // SPARE PARTS page par page (URL sans ?attrib/?order/?search : autorise par
  // robots.txt) plutot que de crawler les ~3000 fiches du sitemap entier.
  console.log("[2/4] enumeration SPARE PARTS");
  const seen = new Set();
  let pagesVisited = 0;
  // RECON_NO_ENUM=1 : on ne retape meme pas les pages de listing (analyse pure
  // sur cache). Evite de solliciter la source pour rien.
  const MAX_PAGES = process.env.RECON_NO_ENUM === "1" ? 0 : Number(process.env.RECON_MAX_PAGES || 60);
  for (let page = 1; page <= MAX_PAGES; page++) {
    pagesVisited = page;
    const u =
      page === 1
        ? BASE + "/shop/category/spare-parts-13?ppg=80"
        : BASE + "/shop/category/spare-parts-13/page/" + page + "?ppg=80";
    let html;
    try {
      html = await get(u);
    } catch {
      break;
    }
    const before = seen.size;
    // Odoo suffixe les liens produit de "?category=13" : on strippe la query
    // et on ne visite que l'URL nue.
    for (const m of html.matchAll(/href="(\/shop\/[^"#]+)"/g)) {
      const p = m[1].split("?")[0];
      if (p.startsWith("/shop/category/")) continue;
      if (["/shop/cart", "/shop/checkout", "/shop/wishlist"].includes(p)) continue;
      if (p.startsWith("/shop/change_pricelist")) continue;
      seen.add(BASE + p);
    }
    console.log("      page " + page + " -> " + (seen.size - before) + " nouvelles (" + seen.size + ")");
    await sleep(CRAWL_DELAY_MS);
    if (seen.size === before) break;
  }
  let products = [...seen];
  // RECON_LIMIT : smoke du parseur sans lancer les centaines de fetch.
  if (process.env.RECON_LIMIT) products = products.slice(0, Number(process.env.RECON_LIMIT));

  // Cache : on ne refetch jamais une fiche deja parsee (politesse + reprise).
  const CACHE = OUT_DIR + "/parsed.json";
  const parsed = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf-8")) : [];
  const done = new Set(parsed.map((p) => p.url));
  // RECON_NO_FETCH=1 : on n'interroge AUCUNE fiche, on ne fait que l'enumeration
  // des pages de listing et l'agregation sur le cache.
  const NO_FETCH = process.env.RECON_NO_FETCH === "1";
  const todo = NO_FETCH ? [] : products.filter((u) => !done.has(u));
  const errors = [];
  console.log(
    "[3/4] " + products.length + " fiches, " + done.size + " en cache, " + todo.length + " a fetch",
  );
  for (let i = 0; i < todo.length; i++) {
    try {
      parsed.push(parseProduct(await get(todo[i]), todo[i]));
    } catch (e) {
      errors.push({ url: todo[i], error: e.message });
    }
    if ((i + 1) % 50 === 0) {
      console.log("      " + (i + 1) + "/" + todo.length);
      writeFileSync(CACHE, JSON.stringify(parsed, null, 2));
    }
    await sleep(CRAWL_DELAY_MS);
  }

  console.log("[4/4] scooter_models (lecture anon, read-only) + agregation");
  // Cle anon publique, deja en dur dans src/integrations/supabase/client.ts
  // (RLS cote DB). Lecture seule, aucun write possible avec cette cle.
  const SB = "https://kqsxscjtlipregkrmucg.supabase.co";
  const ANON =
    process.env.SB_ANON ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtxc3hzY2p0bGlwcmVna3JtdWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNTIzMTEsImV4cCI6MjA4MzYyODMxMX0.CGoIqbXIqfXYCa8AWrDFXfb9zruegjpg-E6MT_rPwAE";
  let models = [];
  {
    const r = await fetch(SB + "/rest/v1/scooter_models?select=name,slug,published&limit=500", {
      headers: { apikey: ANON, Authorization: "Bearer " + ANON },
    });
    models = await r.json();
  }
  const modelKeys = new Set(models.map((m) => norm(m.slug)));
  const modelNameKeys = models.map((m) => ({ slug: m.slug, key: norm(m.name), published: m.published }));

  // (agregation)
  const rows = parsed.flatMap((p) => toRows(p, scrapedAt));
  // Ressemblance grossiere : egalite normalisee, ou l'un contient l'autre sur
  // >= 6 caracteres. La vraie resolution d'alias est M-C.
  for (const r of rows) {
    const k = norm(r.raw_model);
    let hit = modelKeys.has(k) ? k : null;
    let how = hit ? "exact" : null;
    if (!hit) {
      const exact = modelNameKeys.find((m) => m.key === k);
      if (exact) {
        hit = exact.slug;
        how = "exact";
      }
    }
    if (!hit) {
      const c = modelNameKeys.find(
        (m) => m.key.length >= 6 && (k.includes(m.key) || m.key.includes(k)),
      );
      if (c) {
        hit = c.slug;
        how = "inclusion";
      }
    }
    r._model_guess = hit;
    r._model_guess_how = how;
  }

  writeFileSync(OUT_DIR + "/parsed.json", JSON.stringify(parsed, null, 2));
  writeFileSync(OUT_DIR + "/rows.json", JSON.stringify(rows, null, 2));
  writeFileSync(OUT_DIR + "/errors.json", JSON.stringify(errors, null, 2));

  const kept = rows.filter((r) => !r._rejected);
  const VENDUES = ["chargeurs", "pneus", "pneus-pleins", "chambres-a-air", "plaquettes", "disques"];
  const sortDesc = (o) =>
    Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]));
  const byBrand = {};
  const byCat = {};
  for (const r of kept) {
    const b = r.raw_payload.brand || "(vide)";
    byBrand[b] = (byBrand[b] || 0) + 1;
    byCat[r.category] = (byCat[r.category] || 0) + 1;
  }
  const modelos = {};
  for (const r of kept) modelos[r.raw_model] = (modelos[r.raw_model] || 0) + 1;

  // Rejet au niveau FICHE : une fiche est rejetee si TOUS ses Modelo le sont.
  const fichesRejetees = parsed.filter(
    (p) => p.modelos.length > 0 && p.modelos.every((m) => outOfScope(p.brand, m)),
  ).length;
  const fichesExploitees = parsed.filter((p) => p.modelos.length > 0).length;

  const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : 0);
  const summary = {
    // etape 1
    sitemap_urls: all.length,
    sitemap_products: allProducts.length,
    spare_parts_total_enumere: products.length,
    pages_listing_visitees: pagesVisited,
    // etape 2 (sur le cache)
    cache_fiches: parsed.length,
    fetch_errors: errors.length,
    a_fiches_exploitees: fichesExploitees,
    a_pct: pct(fichesExploitees, parsed.length),
    b_fiches_rejetees_euc: fichesRejetees,
    b_pct: pct(fichesRejetees, parsed.length),
    c_fiches_retenues: fichesExploitees - fichesRejetees,
    c_pct: pct(fichesExploitees - fichesRejetees, parsed.length),
    d_couples_total: rows.length,
    d_couples_rejetes: rows.length - kept.length,
    d_couples_retenus: kept.length,
    e_par_brand: sortDesc(byBrand),
    f_par_category: sortDesc(byCat),
    g_couples_modele_ressemblant: kept.filter((r) => r._model_guess).length,
    g_dont_exact: kept.filter((r) => r._model_guess_how === "exact").length,
    g_dont_inclusion_douteuse: kept.filter((r) => r._model_guess_how === "inclusion").length,
    h_et_g_exact: kept.filter(
      (r) => r._model_guess_how === "exact" && VENDUES.includes(r.category),
    ).length,
    h_couples_categorie_vendue: kept.filter((r) => VENDUES.includes(r.category)).length,
    h_et_g: kept.filter((r) => r._model_guess && VENDUES.includes(r.category)).length,
    i_modelos_distincts: Object.keys(modelos).length,
    i_top20: Object.entries(sortDesc(modelos)).slice(0, 20),
  };
  writeFileSync(OUT_DIR + "/summary.json", JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));

  // ── Echantillon 20 lignes, compose, sorti du cache uniquement ─────────────
  const used = new Set();
  const take = (pred, n) => {
    const out = [];
    for (const r of rows) {
      if (out.length >= n) break;
      if (used.has(r.dedup_key)) continue;
      if (!pred(r)) continue;
      used.add(r.dedup_key);
      out.push(r);
    }
    return out;
  };
  const is84 = (r) => (r.source_url || "").includes("fast-charger-84v-official-minimotors");
  // Diversification : au plus une ligne par produit dans les buckets 2 et 3,
  // sinon l'echantillon montre cinq fois la meme fiche.
  const usedProducts = new Set();
  const takeDistinct = (pred, n) => {
    const out = [];
    for (const r of rows) {
      if (out.length >= n) break;
      if (used.has(r.dedup_key) || usedProducts.has(r.source_url)) continue;
      if (!pred(r)) continue;
      used.add(r.dedup_key);
      usedProducts.add(r.source_url);
      out.push(r);
    }
    return out;
  };
  const multi = [
    ...take((r) => is84(r), 3),
    ...takeDistinct((r) => r.raw_payload.modelos.length > 1 && !r._rejected && !is84(r), 2),
  ];
  // Categories mecaniques : on force la presence des pneus et chambres a air,
  // sinon Bracking rafle les 5 places et geom n'est jamais demontre.
  const mecha = [
    ...takeDistinct((r) => r.raw_payload.spare_part === "Tyres" && !r._rejected, 2),
    ...takeDistinct((r) => r.raw_payload.spare_part === "Inner tube" && !r._rejected, 1),
    ...takeDistinct((r) => r.raw_payload.spare_part === "Bracking" && !r._rejected, 2),
  ];
  const PERIM = ["dualtron", "vsett", "zero", "kaabo"];
  const perim = [];
  for (const b of PERIM) {
    perim.push(
      ...takeDistinct(
        (r) =>
          (r.raw_payload.brand || "").toLowerCase() === b &&
          !r._rejected &&
          VENDUES.includes(r.category),
        1,
      ),
    );
  }
  perim.push(
    ...takeDistinct(
      (r) => PERIM.includes((r.raw_payload.brand || "").toLowerCase()) && !r._rejected,
      5 - perim.length,
    ),
  );
  const rejets = [
    ...takeDistinct((r) => r._rejected === "hors perimetre : velo electrique", 1),
    ...takeDistinct((r) => r._rejected === "hors perimetre : monoroue (marque)", 2),
    ...takeDistinct((r) => r._rejected === "hors perimetre : monoroue (modele)", 2),
  ];
  rejets.push(...takeDistinct((r) => !!r._rejected, 5 - rejets.length));
  const sample = { multi, mecha, perim, rejets };
  writeFileSync(OUT_DIR + "/sample.json", JSON.stringify(sample, null, 2));

  // Rendu tabulaire colonne par colonne de fitment_raw (+ 2 colonnes de recon).
  const COLS = [
    "source", "supplier_sku", "ean13", "category", "claim_type", "dedup_key",
    "raw_model", "model_slug", "geom_signature", "brand", "spare_part",
    "category_inferred", "_rejected", "_model_guess", "raw_title",
  ];
  const cell = (r, c) => {
    if (c === "brand" || c === "spare_part" || c === "category_inferred") {
      return String(r.raw_payload[c] ?? "");
    }
    if (c === "geom_signature") return r.geom_signature ?? "";
    return String(r[c] ?? "");
  };
  const lines = [];
  for (const [k, label] of [
    ["multi", "1. Modelo MULTI-VALUE"],
    ["mecha", "2. Categories mecaniques (geom)"],
    ["perim", "3. Perimetre lancement"],
    ["rejets", "4. REJETES par le filtre EUC"],
  ]) {
    lines.push("### " + label + " (" + sample[k].length + ")");
    lines.push(COLS.join(" | "));
    for (const r of sample[k]) lines.push(COLS.map((c) => cell(r, c)).join(" | "));
    lines.push("");
  }
  // geom complet des lignes mecaniques
  lines.push("### geom (JSON) des lignes mecaniques");
  for (const r of mecha) lines.push(r.dedup_key + " -> " + JSON.stringify(r.geom));
  writeFileSync(OUT_DIR + "/sample.txt", lines.join("\n"));
  console.log(
    "echantillon : multi=" + multi.length + " mecha=" + mecha.length +
      " perim=" + perim.length + " rejets=" + rejets.length,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
