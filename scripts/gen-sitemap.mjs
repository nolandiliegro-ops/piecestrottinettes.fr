// Régénère public/sitemap.xml au build (statique, PAS d'Edge Function).
// Node pur (global fetch + node:fs), ESM, AUCUNE dépendance.
//
// Émet : pages statiques + /categorie/{slug} (catégories avec >=1 pièce published=true)
//        + /piece/{slug} + /scooter/{slug} + /marque/{slug}, tous published=true uniquement.
// FAIL-SOFT : toute erreur réseau/REST -> sitemap minimal (statiques + catégories si dispo) + exit 0.
//             Le build ne doit JAMAIS planter à cause du sitemap.

import { writeFileSync } from "node:fs";
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
  { path: "/pepites", priority: "0.7", changefreq: "weekly" },
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

function renderStaticBlock() {
  return STATIC_PAGES.map((p) =>
    urlEntry({ loc: p.path, lastmod: TODAY, changefreq: p.changefreq, priority: p.priority })
  ).join("");
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
      restGet("scooter_models?select=slug,created_at&published=eq.true&limit=5000"),
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
    body += `\n  <!-- Trottinettes -->\n`;
    for (const s of scooters) {
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

    const total =
      STATIC_PAGES.length + keptCategories.length + parts.length + scooters.length + brands.length;
    writeFileSync(OUT_PATH, wrap(body), "utf8");
    console.log(
      `[sitemap] OK -> ${total} URLs (${STATIC_PAGES.length} statiques, ${keptCategories.length} catégories, ${parts.length} pièces, ${scooters.length} scooters, ${brands.length} marques)`
    );
  } catch (err) {
    // FAIL-SOFT : sitemap minimal, le build continue.
    console.warn(`[sitemap] WARN: génération dynamique échouée (${err.message}). Fallback minimal.`);
    const minimal = `  <!-- Pages statiques (fallback) -->\n` + renderStaticBlock();
    writeFileSync(OUT_PATH, wrap(minimal), "utf8");
    console.log(`[sitemap] fallback écrit (${STATIC_PAGES.length} pages statiques).`);
    // Pas de process.exit() : on laisse l'event loop se vider naturellement (sortie code 0).
    // Forcer process.exit() pendant la fermeture des sockets undici crashe sur Node/Windows.
    process.exitCode = 0;
  }
}

main();
