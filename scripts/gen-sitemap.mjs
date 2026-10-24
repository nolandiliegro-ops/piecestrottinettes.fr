// Régénère public/sitemap.xml au build (statique, PAS d'Edge Function).
// Node pur (global fetch + node:fs), ESM, AUCUNE dépendance.
//
// Émet : pages statiques + /categorie/{slug} (catégories avec >=1 pièce published=true)
//        + /piece/{slug} + /scooter/{slug} + /marque/{slug}, tous published=true uniquement.
// FAIL-SOFT : toute erreur réseau/REST -> sitemap minimal (statiques + catégories si dispo) + exit 0.
//             Le build ne doit JAMAIS planter à cause du sitemap.

import { writeFileSync, readFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const SITE_URL = "https://piecestrottinettes.fr";

// anon key = clé publique (safe à exposer, RLS côté DB). Fallback hardcodé miroir de
// src/integrations/supabase/client.ts → marche même si l'env build est vide.
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://kqsxscjtlipregkrmucg.supabase.co";
const ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtxc3hzY2p0bGlwcmVna3JtdWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNTIzMTEsImV4cCI6MjA4MzYyODMxMX0.CGoIqbXIqfXYCa8AWrDFXfb9zruegjpg-E6MT_rPwAE";

const OUT_PATH = resolve(dirname(fileURLToPath(import.meta.url)), "..", "public", "sitemap.xml");

// Pages statiques indexables (routes réelles confirmées dans App.tsx).
const STATIC_PAGES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/catalogue", priority: "0.9", changefreq: "daily" },
  { path: "/trottinettes", priority: "0.8", changefreq: "weekly" },
  { path: "/marques", priority: "0.7", changefreq: "weekly" },
  { path: "/pepites", priority: "0.7", changefreq: "weekly" },
  { path: "/atelier", priority: "0.8", changefreq: "weekly" },
  { path: "/atelier/videos", priority: "0.6", changefreq: "weekly" },
  { path: "/blog", priority: "0.8", changefreq: "weekly" },
  { path: "/tutos", priority: "0.6", changefreq: "monthly" },
  { path: "/contact", priority: "0.5", changefreq: "monthly" },
  { path: "/cgv", priority: "0.3", changefreq: "yearly" },
  { path: "/mentions-legales", priority: "0.3", changefreq: "yearly" },
];

const TODAY = new Date().toISOString().split("T")[0];

const xmlEscape = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

// Normalise une date (ISO ou null) en YYYY-MM-DD, fallback TODAY.
const toLastmod = (value) => (value ? String(value).split("T")[0] : TODAY);

async function restGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
  });
  if (!res.ok) {
    // Consommer le corps même en erreur libère la socket undici → sortie propre du process.
    await res.text().catch(() => {});
    throw new Error(`REST ${path} -> HTTP ${res.status}`);
  }
  return res.json();
}

function urlEntry({ loc, lastmod, changefreq, priority }) {
  let out = `  <url>\n    <loc>${SITE_URL}${loc}</loc>\n`;
  if (lastmod) out += `    <lastmod>${lastmod}</lastmod>\n`;
  if (changefreq) out += `    <changefreq>${changefreq}</changefreq>\n`;
  if (priority) out += `    <priority>${priority}</priority>\n`;
  out += `  </url>\n`;
  return out;
}

// Pas de lastmod sur les statiques (24/10, audit SEO) : la date du build à chaque déploiement « ment » à Google,
// qui finit par ignorer tous les lastmod du sitemap.
function renderStaticBlock() {
  return STATIC_PAGES.map((p) =>
    urlEntry({ loc: p.path, changefreq: p.changefreq, priority: p.priority })
  ).join("");
}

// Trottinettes qui ont une fiche « Tout savoir » (public/fiches/<slug>.json ou src/data/scooterSeo.ts) :
// la page a du contenu même sans pièce compatible. Miroir de la règle noindex de src/pages/ScooterDetail.tsx.
function scooterSlugsWithFiche(root) {
  const slugs = new Set();
  try {
    for (const f of readdirSync(resolve(root, "public", "fiches"))) if (f.endsWith(".json")) slugs.add(f.slice(0, -5));
  } catch { /* dossier absent : aucune fiche JSON */ }
  try {
    const src = readFileSync(resolve(root, "src", "data", "scooterSeo.ts"), "utf8");
    for (const m of src.matchAll(/^  "([a-z0-9-]+)": \{/gm)) slugs.add(m[1]);
  } catch { /* fichier absent */ }
  return slugs;
}

function wrap(body) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\n${body}\n</urlset>\n`;
}

async function main() {
  let body = "";
  try {
    // allSettled : on attend TOUTES les requêtes (et leurs bodies consommés dans restGet)
    // avant de décider. Évite les sockets undici en suspens → sortie process propre.
    const settled = await Promise.allSettled([
      restGet("parts?select=slug,updated_at,category_id&published=eq.true&limit=5000"),
      restGet("scooter_models?select=slug,created_at,compatible_parts_count&published=eq.true&limit=5000"),
      restGet("brands?select=slug,created_at&published=eq.true&limit=5000"),
      restGet("categories?select=slug,id,created_at&limit=5000"),
    ]);
    const failed = settled.find((r) => r.status === "rejected");
    if (failed) throw failed.reason;
    const [parts, scooters, brands, categories] = settled.map((r) => r.value);

    // Comptage réel des pièces publiées par catégorie (product_count en DB est périmé → ignoré).
    const publishedByCategory = new Map();
    for (const p of parts) {
      if (!p.category_id) continue;
      publishedByCategory.set(p.category_id, (publishedByCategory.get(p.category_id) || 0) + 1);
    }

    // 1. Pages statiques
    body += `  <!-- Pages statiques -->\n`;
    body += renderStaticBlock();

    // 2. Catégories AVEC >=1 pièce publiée (anti-thin-content : pas de page vide soumise)
    const keptCategories = categories
      .filter((c) => (publishedByCategory.get(c.id) || 0) > 0)
      .sort((a, b) => a.slug.localeCompare(b.slug));
    body += `\n  <!-- Catégories (>=1 pièce publiée) -->\n`;
    for (const c of keptCategories) {
      body += urlEntry({
        loc: `/categorie/${xmlEscape(c.slug)}`,
        lastmod: toLastmod(c.created_at),
        changefreq: "weekly",
        priority: "0.8",
      });
    }

    // 3. Pièces /piece/{slug} (singulier)
    body += `\n  <!-- Pièces -->\n`;
    for (const p of parts) {
      body += urlEntry({
        loc: `/piece/${xmlEscape(p.slug)}`,
        lastmod: toLastmod(p.updated_at),
        changefreq: "weekly",
        priority: "0.7",
      });
    }

    // 4. Scooters /scooter/{slug} (singulier). /showroom parké (duplicate content, canonical à part).
    //    24/10 (audit SEO) : sans pièce compatible NI fiche « Tout savoir », la page est vide (noindex) → exclue.
    const withFiche = scooterSlugsWithFiche(resolve(dirname(OUT_PATH), ".."));
    const keptScooters = scooters.filter((s) => (s.compatible_parts_count ?? 0) > 0 || withFiche.has(s.slug));
    body += `\n  <!-- Trottinettes -->\n`;
    for (const s of keptScooters) {
      body += urlEntry({
        loc: `/scooter/${xmlEscape(s.slug)}`,
        lastmod: toLastmod(s.created_at),
        changefreq: "weekly",
        priority: "0.7",
      });
    }

    // 5. Marques /marque/{slug}
    body += `\n  <!-- Marques -->\n`;
    for (const b of brands) {
      body += urlEntry({
        loc: `/marque/${xmlEscape(b.slug)}`,
        lastmod: toLastmod(b.created_at),
        changefreq: "weekly",
        priority: "0.6",
      });
    }

    // 6. Articles du blog (23/10/2026) : public/blog/index.json, fichier local du repo.
    const blogIndex = resolve(dirname(OUT_PATH), "blog", "index.json");
    let articles = [];
    try {
      if (existsSync(blogIndex)) articles = JSON.parse(readFileSync(blogIndex, "utf8"));
    } catch (e) {
      console.warn(`[sitemap] WARN: blog/index.json illisible (${e.message}), articles ignorés.`);
    }
    body += `\n  <!-- Blog -->\n`;
    for (const a of articles) {
      if (!a || !a.slug) continue;
      body += urlEntry({
        loc: `/blog/${xmlEscape(a.slug)}`,
        lastmod: toLastmod(a.updated),
        changefreq: "monthly",
        priority: "0.7",
      });
    }

    // 7. Questions de riders répondues par l'atelier (24/10/2026) : vue publique, fail-soft.
    let questions = [];
    try {
      questions = await restGet("rider_questions_publiques?select=slug,repondu_le&order=repondu_le.desc&limit=5000");
    } catch (e) {
      console.warn(`[sitemap] WARN: questions atelier ignorées (${e.message}).`);
    }
    body += `\n  <!-- Questions de l'atelier -->\n`;
    for (const q of questions) {
      if (!q || !q.slug) continue;
      body += urlEntry({ loc: `/atelier/questions/${xmlEscape(q.slug)}`, lastmod: toLastmod(q.repondu_le), changefreq: "monthly", priority: "0.6" });
    }

    const total =
      STATIC_PAGES.length + keptCategories.length + parts.length + keptScooters.length + brands.length + articles.length + questions.length;
    writeFileSync(OUT_PATH, wrap(body), "utf8");
    console.log(
      `[sitemap] OK -> ${total} URLs (${STATIC_PAGES.length} statiques, ${keptCategories.length} catégories, ${parts.length} pièces, ${keptScooters.length} scooters (${scooters.length - keptScooters.length} vides exclus), ${brands.length} marques, ${articles.length} articles, ${questions.length} questions)`
    );
  } catch (err) {
    // FAIL-SOFT : le build continue. 24/10 (audit SEO) : on GARDE le sitemap existant s'il est plus riche que le
    // minimal (avant : écrasé par 11 pages statiques, en silence → plus de 1 000 URLs perdues pour Google).
    const existing = existsSync(OUT_PATH) ? (readFileSync(OUT_PATH, "utf8").match(/<url>/g) || []).length : 0;
    if (existing > STATIC_PAGES.length) {
      console.error(`[sitemap] ERREUR: génération dynamique échouée (${err.message}). Sitemap existant CONSERVÉ (${existing} URLs, peut être daté).`);
    } else {
      console.error(`[sitemap] ERREUR: génération dynamique échouée (${err.message}). Fallback minimal.`);
      const minimal = `  <!-- Pages statiques (fallback) -->\n` + renderStaticBlock();
      writeFileSync(OUT_PATH, wrap(minimal), "utf8");
      console.log(`[sitemap] fallback écrit (${STATIC_PAGES.length} pages statiques).`);
    }
    // Pas de process.exit() : on laisse l'event loop se vider naturellement (sortie code 0).
    // Forcer process.exit() pendant la fermeture des sockets undici crashe sur Node/Windows.
    process.exitCode = 0;
  }
}

main();
