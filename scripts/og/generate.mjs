// Images d'aperçu de lien (Open Graph) au gabarit « Vitrine » — choisi par Nolan le 26/10/2026
// (page de choix : https://claude.ai/artifact/Xg9Jd3tGWizJiXNwcau7ug).
// Usage (GitHub Actions, workflow og-images.yml) :
//   node scripts/og/generate.mjs <mode> [arg]
//     dry <n>            : rend n exemples de chaque type dans out/og-dry/ (aucun envoi)
//     all                : rend et envoie toutes les fiches publiées + les images de page
//     only <k:slug,...>  : rend et envoie seulement ces fiches (ex. scooter:dualtron-thunder-3)
// Envoi : POST functions/v1/og-image (x-admin-secret). Lecture des données : REST public (clé anon).
// N'écrit dans aucune table.
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(process.env.PW_REQUIRE || import.meta.url);
const { chromium } = require("playwright");
const FONTS = process.env.OG_FONTS || "/tmp/pw/node_modules/@fontsource";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const SB = process.env.SB_URL || "https://kqsxscjtlipregkrmucg.supabase.co";
const KEY = process.env.OG_TEST ? "test" : readFileSync(`${ROOT}/src/integrations/supabase/client.ts`, "utf8").match(/VITE_SUPABASE_PUBLISHABLE_KEY\s*\|\|\s*"([^"]+)"/)[1];
const SECRET = process.env.ADMIN_BULK_SECRET || "";
const [mode = "dry", arg = "3"] = process.argv.slice(2);

async function rest(path) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const r = await fetch(`${SB}/rest/v1/${path}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Range: `${from}-${from + 999}` } });
    if (!r.ok) throw new Error(`${path} → ${r.status} ${await r.text()}`);
    const rows = await r.json();
    out.push(...rows);
    if (rows.length < 1000) return out;
  }
}

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const euro = (n) => `${Number(n).toFixed(2).replace(".", ",")} €`;
const num = (n) => Number(n).toLocaleString("fr-FR").replace(/ /g, " ");

// Nom de trottinette sans la marque répétée (même règle que src/lib/scooterName.ts).
function splitScooter(brand, name) {
  const n = String(name || "").trim();
  const b = String(brand || "").trim();
  const rest = n.toLowerCase().startsWith(b.toLowerCase() + " ") ? n.slice(b.length + 1) : n;
  return [b, rest];
}

// Pièce : ligne 1 = famille (ou début du nom), ligne 2 = la taille si on la trouve, sinon la suite du nom.
function splitPart(name, cat) {
  const n = String(name || "").replace(/\s+/g, " ").trim();
  const size = n.match(/\b\d{1,2}(?:[.,]\d{1,3})?\s?[x×\/]\s?\d{1,3}(?:[.,]\d{1,3})?(?:\s?-\s?\d{1,2}(?:[.,]\d)?)?\b/);
  const fam = cat || n.split(" ").slice(0, 3).join(" ");
  if (size) return [fam, size[0].replace(/\s/g, "").replace(/x/i, " × ")];
  const words = n.split(" ");
  const famWords = fam.split(" ").length;
  const rest = n.toLowerCase().startsWith(fam.toLowerCase()) ? words.slice(famWords) : words.slice(0, 4);
  return [fam, rest.slice(0, 4).join(" ") || n];
}

function card({ a, b, img, pills, price, tag, round = false }) {
  // Taille calée sur la ligne la plus longue (Unbounded 900 capitales ≈ 0,82 em par signe) ; au-delà, la ligne 2 passe sur deux lignes.
  const W = 580;
  const fit = (n) => Math.floor(W / (0.82 * Math.max(n, 1)));
  let sz = Math.min(76, fit(Math.max(a.length, b.length)));
  let wrap = false;
  if (sz < 46) { wrap = true; sz = Math.min(64, fit(Math.max(a.length, Math.ceil(b.length / 2) + 2))); }
  const pillsHtml = pills.filter(Boolean).map(([v, u]) => `<span class="pill"><b>${esc(v)}</b>${esc(u)}</span>`).join("");
  const priceHtml = price ? `<span class="pill dark">${esc(price)}</span>` : "";
  const imgHtml = img
    ? `<img class="prod" src="${esc(img)}" onerror="this.onerror=null;this.src='file://${ROOT}/public/brand/icone-pt.svg';this.style.filter='none'" style="${round ? "right:110px;top:115px;width:400px;height:400px" : "right:60px;top:36px;width:440px;height:560px"}">`
    : `<img class="prod" src="file://${ROOT}/public/brand/icone-pt.svg" style="right:150px;top:150px;width:330px;height:330px;filter:none">`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Unb;src:url(file://${FONTS}/unbounded/files/unbounded-latin-900-normal.woff2);font-weight:900}
@font-face{font-family:Jak;src:url(file://${FONTS}/plus-jakarta-sans/files/plus-jakarta-sans-latin-700-normal.woff2);font-weight:700}
@font-face{font-family:Jak;src:url(file://${FONTS}/plus-jakarta-sans/files/plus-jakarta-sans-latin-800-normal.woff2);font-weight:800}
*{box-sizing:border-box;margin:0;padding:0}html,body{width:1200px;height:630px;overflow:hidden}
body{font-family:Jak,sans-serif;color:#1A1A1A;background:#FAFAF8;position:relative}
.rond{position:absolute;right:-70px;top:60px;width:620px;height:620px;border-radius:50%;background:#F5F0E8}
.col{position:absolute;left:64px;top:52px;bottom:52px;width:${W}px;display:flex;flex-direction:column;justify-content:space-between}
.logo{height:78px;align-self:flex-start}
.t{font-family:Unb;font-weight:900;font-style:italic;text-transform:uppercase;line-height:.95;letter-spacing:-.01em;font-size:${sz}px}
.t div{white-space:nowrap}.t .b{color:#4A7C59${"}"}${wrap ? ".t .b{white-space:normal;text-wrap:balance}" : ""}
.pills{display:flex;flex-wrap:wrap;gap:14px}
.pill{display:inline-flex;align-items:center;gap:8px;height:60px;padding:0 22px;background:#fff;box-shadow:inset 0 0 0 2px #E2DCD0;font-weight:800;font-size:28px;white-space:nowrap;clip-path:polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)}
.pill b{color:#4A7C59}.pill.dark{background:#1A1A1A;color:#fff;box-shadow:none;font-size:30px}
.tag{font-size:22px;font-weight:700;color:#6B665C;letter-spacing:.02em}
.prod{position:absolute;object-fit:contain;filter:drop-shadow(0 18px 24px rgba(0,0,0,.18))}
</style></head><body><div class="rond"></div>${imgHtml}
<div class="col"><img class="logo" src="file://${ROOT}/public/brand/logo-pt-2026.svg">
<div class="t"><div>${esc(a)}</div><div class="b">${esc(b)}</div></div>
<div class="pills">${pillsHtml}${priceHtml}</div><div class="tag">${esc(tag)}</div></div></body></html>`;
}

async function collect() {
  const [scooters, parts, brands, cats] = await Promise.all([
    rest("scooter_models?select=slug,name,image_url,power_watts,max_speed_private_kmh,max_speed_kmh,range_km,brand:brands!scooter_models_brand_id_fkey(name)&published=eq.true"),
    rest("parts?select=slug,name,price,image_url,category_id&published=eq.true"),
    rest("brands?select=slug,name,hero_image_url,logo_url,showcase_model_id&published=eq.true"),
    rest("categories?select=id,slug,name,seo_name,image_url,product_count"),
  ]);
  const catById = new Map(cats.map((c) => [c.id, c]));
  const items = [];
  for (const s of scooters) {
    const [a, b] = splitScooter(s.brand?.name, s.name);
    items.push({ k: "scooter", s: s.slug, a, b, img: s.image_url,
      pills: [s.power_watts && [num(s.power_watts), "W"], (s.max_speed_private_kmh || s.max_speed_kmh) && [String(s.max_speed_private_kmh || s.max_speed_kmh), "km/h"], s.range_km && [String(s.range_km), "km"]],
      tag: "Fiche technique · pièces compatibles" });
  }
  for (const p of parts) {
    const cat = catById.get(p.category_id);
    const [a, b] = splitPart(p.name, cat?.seo_name || cat?.name);
    items.push({ k: "part", s: p.slug, a, b, img: p.image_url, round: true,
      pills: [["Compatibilité", "vérifiée"]], price: p.price ? euro(p.price) : null,
      tag: "Compatible avec ta trott · atelier Marseille" });
  }
  const showcase = new Map(scooters.map((s) => [s.slug, s]));
  const byBrand = new Map();
  for (const s of scooters) { const n = s.brand?.name; if (!n) continue; (byBrand.get(n) || byBrand.set(n, []).get(n)).push(s); }
  for (const br of brands) {
    const models = byBrand.get(br.name) || [];
    const vedette = models.find((m) => m.image_url);
    items.push({ k: "brand", s: br.slug, a: "Trottinettes", b: br.name, img: vedette?.image_url || null,
      pills: [[String(models.length), models.length > 1 ? "modèles" : "modèle"], ["Pièces", "compatibles"]],
      tag: "Fiches, pièces et où les acheter" });
  }
  const minPrice = new Map();
  for (const p of parts) if (p.price) minPrice.set(p.category_id, Math.min(minPrice.get(p.category_id) ?? 1e9, Number(p.price)));
  const nbPart = new Map();
  for (const p of parts) nbPart.set(p.category_id, (nbPart.get(p.category_id) || 0) + 1);
  for (const c of cats) {
    const n = nbPart.get(c.id) || 0;
    if (!n) continue;
    const photo = parts.find((p) => p.category_id === c.id && p.image_url)?.image_url;
    items.push({ k: "category", s: c.slug, a: "Pièces", b: c.seo_name || c.name, img: photo || null, round: true,
      pills: [[String(n), n > 1 ? "pièces" : "pièce"]], price: minPrice.has(c.id) ? `dès ${euro(minPrice.get(c.id))}` : null,
      tag: "Compatibles avec ta trott · atelier Marseille" });
  }
  items.push({ k: "page", s: "default", a: "Plus jamais", b: "la mauvaise pièce", img: showcase.get("dualtron-thunder-3")?.image_url || scooters.find((s) => s.image_url)?.image_url,
    pills: [[String(scooters.length), "trottinettes"], [String(parts.length), "pièces"]], tag: "Pièces détachées · atelier Marseille" });
  return items;
}

async function main() {
  let items = process.env.OG_TEST ? JSON.parse(readFileSync(process.env.OG_TEST, "utf8")) : await collect();
  if (mode === "dry") {
    const n = Number(arg) || 3;
    const pick = [];
    for (const k of ["scooter", "part", "brand", "category", "page"]) pick.push(...items.filter((i) => i.k === k).slice(0, n));
    items = pick;
  } else if (mode === "only") {
    const want = new Set(String(arg).split(","));
    items = items.filter((i) => want.has(`${i.k}:${i.s}`));
  } else if (mode !== "all") throw new Error(`mode inconnu : ${mode}`);
  if (mode !== "dry" && !SECRET) throw new Error("ADMIN_BULK_SECRET absent");

  const outDir = `${ROOT}/out/og-${mode}`;
  mkdirSync(outDir, { recursive: true });
  const TMP = `${outDir}/_carte.html`;
  const browser = await chromium.launch(process.env.OG_CHROME ? { executablePath: process.env.OG_CHROME } : {});
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  const report = { mode, total: items.length, ok: 0, echecs: [] };
  for (const it of items) {
    try {
      writeFileSync(TMP, card(it));
      await page.goto(`file://${TMP}`, { waitUntil: "networkidle", timeout: 30000 });
      await page.evaluate(() => document.fonts.ready);
      const buf = await page.screenshot({ type: "jpeg", quality: 84 });
      if (mode === "dry") { writeFileSync(`${outDir}/${it.k}-${it.s}.jpg`, buf); report.ok++; continue; }
      const r = await fetch(`${SB}/functions/v1/og-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": SECRET, apikey: KEY },
        body: JSON.stringify({ k: it.k, s: it.s, b64: buf.toString("base64") }),
      });
      if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
      report.ok++;
    } catch (e) { report.echecs.push({ k: it.k, s: it.s, err: String(e.message || e).slice(0, 200) }); }
  }
  await browser.close();
  writeFileSync(`${outDir}/report.json`, JSON.stringify(report, null, 1));
  console.log(`og ${mode} : ${report.ok}/${report.total} ok, ${report.echecs.length} échecs`);
  if (report.echecs.length) console.log(JSON.stringify(report.echecs.slice(0, 20)));
}
main().catch((e) => { console.error(e); process.exit(1); });
