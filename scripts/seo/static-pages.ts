// Pré-rendu du contenu pour les robots (31/10/2026).
// Constat Search Console : la version indexée des fiches (explorées début octobre) = 19 mots, menu seul, sans H1 ni
// canonical ; Google ne connaît que 161 pages sur 1 105. Le site est une SPA : sans JavaScript, le HTML ne contient
// qu'un <div id="root"> vide. Ce module écrit, au build, le CONTENU de chaque fiche dans son index.html (H1, prix,
// texte, trottinettes ou pièces compatibles, liens internes) + une balise canonical.
// - React remplace ce contenu au démarrage (createRoot vide le conteneur) : rien ne change pour le visiteur, à part
//   un premier affichage simple pendant le chargement du JavaScript.
// - Le bloc porte l'adresse de sa page (data-p) : s'il est servi sur une autre adresse (service worker qui renvoie
//   index.html en cache), un script en ligne le cache aussitôt.
// - Données lues en direct dans Supabase (clé publique, lecture seule) : toujours à jour à chaque publication.
//   Lecture impossible = on garde les pages telles qu'avant (aucun échec de build).
import fs from "fs";
import path from "path";

const SB = "https://kqsxscjtlipregkrmucg.supabase.co";
const SITE = "https://piecestrottinettes.fr";

const esc = (v: unknown) =>
  String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const euro = (n: unknown) => `${Number(n).toFixed(2).replace(".", ",")} €`;

type Row = Record<string, any>;

async function rest(key: string, q: string): Promise<Row[]> {
  const out: Row[] = [];
  for (let from = 0; from < 50000; from += 1000) {
    const r = await fetch(`${SB}/rest/v1/${q}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Range: `${from}-${from + 999}` },
      signal: AbortSignal.timeout(30000),
    });
    if (!r.ok) throw new Error(`${q.split("?")[0]} → ${r.status}`);
    const rows = (await r.json()) as Row[];
    out.push(...rows);
    if (rows.length < 1000) break;
  }
  return out;
}

// Texte de la base : on ne garde que des balises de mise en forme simples, sans aucun attribut.
const ALLOWED = new Set(["p", "ul", "ol", "li", "strong", "em", "b", "i", "br", "h2", "h3"]);
function cleanHtml(src: string): string {
  const s = String(src || "");
  if (!/<(p|ul|ol|li|strong|em|b|i|br|h2|h3|div|span)\b/i.test(s)) {
    return s.split(/\n+/).map((l) => l.trim()).filter(Boolean).map((l) => `<p>${esc(l)}</p>`).join("");
  }
  return s
    .replace(/<(script|style|iframe|object)[\s\S]*?<\/\1>/gi, "")
    .replace(/<\/?([a-z0-9]+)[^>]*>/gi, (m, tag) => {
      const t = String(tag).toLowerCase();
      if (!ALLOWED.has(t)) return "";
      return m.startsWith("</") ? `</${t}>` : t === "br" ? "<br>" : `<${t}>`;
    });
}

// Même règle que src/lib/scooterName.ts : la plupart des noms contiennent déjà la marque.
function fullName(brand: string | undefined, name: string): string {
  const b = String(brand || "").trim();
  const n = String(name || "").trim();
  return b && !n.toLowerCase().startsWith(b.toLowerCase()) ? `${b} ${n}` : n;
}

export type SeoData = {
  bodies: Map<string, { h1: string; html: string; title?: string; desc?: string }>;
};

export async function loadSeoData(key: string): Promise<SeoData> {
  const [parts, scooters, brands, cats, compat] = await Promise.all([
    rest(key, "parts?select=id,slug,name,price,description,category_id,stock_quantity&published=eq.true&order=name"),
    rest(key, "scooter_models?select=id,slug,name,description,power_watts,max_speed_kmh,range_km,weight_kg,commercial_status,brand:brands!scooter_models_brand_id_fkey(name,slug)&published=eq.true&order=name"),
    rest(key, "brands?select=slug,name&published=eq.true&order=name"),
    rest(key, "categories?select=id,slug,name,seo_name&order=name"),
    rest(key, "part_compatibility?select=part_id,scooter_model_id"),
  ]);
  const partById = new Map(parts.map((p) => [p.id, p]));
  const scooById = new Map(scooters.map((s) => [s.id, s]));
  const catById = new Map(cats.map((c) => [c.id, c]));
  const scootersOfPart = new Map<string, Row[]>();
  const partsOfScoot = new Map<string, Row[]>();
  for (const c of compat) {
    const p = partById.get(c.part_id), s = scooById.get(c.scooter_model_id);
    if (!p || !s) continue;
    (scootersOfPart.get(p.id) || scootersOfPart.set(p.id, []).get(p.id)!).push(s);
    (partsOfScoot.get(s.id) || partsOfScoot.set(s.id, []).get(s.id)!).push(p);
  }
  const catName = (c?: Row) => (c ? c.seo_name || c.name : "Pièces");
  const bodies: SeoData["bodies"] = new Map();
  const link = (href: string, text: string) => `<a href="${esc(href)}">${esc(text)}</a>`;

  for (const p of parts) {
    const cat = catById.get(p.category_id);
    const sc = (scootersOfPart.get(p.id) || []).map((s) => ({ s, n: fullName(s.brand?.name, s.name) }))
      .sort((a, b) => a.n.localeCompare(b.n, "fr"));
    let html = `<nav>${link("/", "Accueil")} › ${cat ? link(`/categorie/${cat.slug}`, catName(cat)) : "Pièces"}</nav>`;
    html += `<h1>${esc(p.name)}</h1>`;
    if (p.price) html += `<p><strong>${euro(p.price)}</strong> · ${Number(p.stock_quantity) > 0 ? "En stock" : "Sur commande"} · Expédiée depuis l'atelier de Marseille</p>`;
    html += cleanHtml(p.description);
    if (sc.length) {
      html += `<h2>Compatible avec ${sc.length} trottinette${sc.length > 1 ? "s" : ""}</h2><ul>`;
      html += sc.map(({ s, n }) => `<li>${link(`/scooter/${s.slug}`, n)}</li>`).join("") + "</ul>";
    }
    bodies.set(`/piece/${p.slug}`, { h1: p.name, html, title: p.price ? `${p.name} · ${euro(p.price)}` : p.name });
  }

  for (const s of scooters) {
    const n = fullName(s.brand?.name, s.name);
    const specs = [s.power_watts && `${s.power_watts} W`, s.max_speed_kmh && `${s.max_speed_kmh} km/h`, s.range_km && `${s.range_km} km d'autonomie`, s.weight_kg && `${String(s.weight_kg).replace(".", ",")} kg`].filter(Boolean);
    let html = `<nav>${link("/", "Accueil")} › ${link("/trottinettes", "Trottinettes")}${s.brand?.slug ? ` › ${link(`/marque/${s.brand.slug}`, s.brand.name)}` : ""}</nav>`;
    html += `<h1>${esc(n)}</h1>`;
    if (specs.length) html += `<p>${esc(specs.join(" · "))}</p>`;
    if (s.commercial_status === "arretee") html += `<p>Plus vendue neuve · on a ses pièces.</p>`;
    html += cleanHtml(s.description);
    const ps = partsOfScoot.get(s.id) || [];
    if (ps.length) {
      html += `<h2>${ps.length} pièce${ps.length > 1 ? "s" : ""} compatible${ps.length > 1 ? "s" : ""} avec la ${esc(n)}</h2>`;
      const byCat = new Map<string, Row[]>();
      for (const p of ps) (byCat.get(p.category_id) || byCat.set(p.category_id, []).get(p.category_id)!).push(p);
      for (const [cid, list] of [...byCat].sort((a, b) => catName(catById.get(a[0])).localeCompare(catName(catById.get(b[0])), "fr"))) {
        html += `<h3>${esc(catName(catById.get(cid)))}</h3><ul>`;
        html += list.slice(0, 40).map((p) => `<li>${link(`/piece/${p.slug}`, p.name)}${p.price ? ` · ${euro(p.price)}` : ""}</li>`).join("") + "</ul>";
      }
    }
    bodies.set(`/scooter/${s.slug}`, { h1: n, html, title: `${s.name} : fiche technique et pièces compatibles` });
  }

  const byBrand = new Map<string, Row[]>();
  for (const s of scooters) if (s.brand?.slug) (byBrand.get(s.brand.slug) || byBrand.set(s.brand.slug, []).get(s.brand.slug)!).push(s);
  for (const b of brands) {
    const ms = byBrand.get(b.slug) || [];
    let html = `<nav>${link("/", "Accueil")} › ${link("/marques", "Marques")}</nav><h1>Trottinettes ${esc(b.name)}</h1>`;
    html += `<p>${ms.length} modèle${ms.length > 1 ? "s" : ""} ${esc(b.name)} : fiches techniques, pièces compatibles vérifiées par l'atelier de Marseille, et où les acheter.</p><ul>`;
    html += ms.map((s) => `<li>${link(`/scooter/${s.slug}`, fullName(b.name, s.name))}</li>`).join("") + "</ul>";
    bodies.set(`/marque/${b.slug}`, { h1: `Trottinettes ${b.name}`, html, title: `Trottinettes ${b.name} : tous les modèles et leurs pièces` });
  }

  const partsByCat = new Map<string, Row[]>();
  for (const p of parts) (partsByCat.get(p.category_id) || partsByCat.set(p.category_id, []).get(p.category_id)!).push(p);
  const usedCats = cats.filter((c) => (partsByCat.get(c.id) || []).length);
  for (const c of usedCats) {
    const ps = partsByCat.get(c.id)!;
    let html = `<nav>${link("/", "Accueil")} › ${link("/catalogue", "Catalogue")}</nav><h1>${esc(catName(c))} pour trottinette électrique</h1>`;
    html += `<p>${ps.length} pièce${ps.length > 1 ? "s" : ""}, compatibilité vérifiée avec ta trottinette. Atelier à Marseille.</p><ul>`;
    html += ps.map((p) => `<li>${link(`/piece/${p.slug}`, p.name)}${p.price ? ` · ${euro(p.price)}` : ""}</li>`).join("") + "</ul>";
    bodies.set(`/categorie/${c.slug}`, { h1: catName(c), html, title: `${catName(c)} pour trottinette électrique` });
  }

  // Pages carrefour : ce sont elles qui font découvrir les 1 100 fiches aux robots.
  const catList = `<ul>${usedCats.map((c) => `<li>${link(`/categorie/${c.slug}`, catName(c))}</li>`).join("")}</ul>`;
  const brandList = `<ul>${brands.map((b) => `<li>${link(`/marque/${b.slug}`, `Trottinettes ${b.name}`)}</li>`).join("")}</ul>`;
  bodies.set("/", { h1: "Pièces détachées pour trottinette électrique", html:
    `<h1>Pièces détachées pour trottinette électrique</h1><p>${parts.length} pièces compatibles avec ${scooters.length} trottinettes, vérifiées et expédiées par l'atelier de Marseille.</p>`
    + `<nav><ul><li>${link("/catalogue", "Catalogue des pièces")}</li><li>${link("/trottinettes", "Toutes les trottinettes")}</li><li>${link("/marques", "Les marques")}</li><li>${link("/atelier", "L'Atelier")}</li><li>${link("/blog", "Le blog")}</li></ul></nav>`
    + `<h2>Pièces par famille</h2>${catList}<h2>Trottinettes par marque</h2>${brandList}` });
  bodies.set("/catalogue", { h1: "Catalogue des pièces", title: "Catalogue des pièces détachées pour trottinette électrique", html:
    `<nav>${link("/", "Accueil")}</nav><h1>Catalogue des pièces détachées pour trottinette électrique</h1><p>${parts.length} pièces.</p>${catList}` });
  bodies.set("/marques", { h1: "Les marques", title: "Marques de trottinettes électriques : modèles et pièces", html:
    `<nav>${link("/", "Accueil")}</nav><h1>Marques de trottinettes électriques</h1><p>${brands.length} marques, ${scooters.length} modèles.</p>${brandList}` });
  bodies.set("/trottinettes", { h1: "Trottinettes", title: "Toutes les trottinettes électriques et leurs pièces compatibles", html:
    `<nav>${link("/", "Accueil")}</nav><h1>Toutes les trottinettes électriques</h1><p>${scooters.length} modèles avec leurs pièces compatibles.</p>`
    + [...byBrand].map(([bs, ms]) => `<h2>${link(`/marque/${bs}`, ms[0].brand.name)}</h2><ul>${ms.map((s) => `<li>${link(`/scooter/${s.slug}`, fullName(ms[0].brand.name, s.name))}</li>`).join("")}</ul>`).join("") });
  return { bodies };
}

const STYLE = "font:16px/1.5 system-ui,sans-serif;color:#1A1A1A;background:#FAFAF8;max-width:760px;margin:0 auto;padding:16px";

// Injecte le contenu + la canonical dans un index.html. Idempotent : un bloc déjà présent est remplacé.
// Jamais de canonical sur l'accueil : dist/index.html sert de repli à TOUTES les adresses sans fichier propre
// (blog, atelier, garage…) ; une canonical « / » les ferait toutes passer pour des doublons de l'accueil.
export function injectBody(html: string, p: string, body: { html: string }): string {
  let out = html;
  if (p !== "/") {
    out = out.replace(/<link rel="canonical"[^>]*>/g, "")
      .replace("</head>", `<link rel="canonical" href="${esc(SITE + p)}" data-rh="true"></head>`);
  }
  const block = `<div id="seo-static" data-p="${esc(p)}" style="${STYLE}">${body.html}</div>`
    + `<script>(function(){var e=document.getElementById("seo-static");if(e&&location.pathname.replace(/\\/$/,"")!==e.getAttribute("data-p").replace(/\\/$/,""))e.style.display="none"})()</script>`;
  const re = /<div id="root">(?:<div id="seo-static"[\s\S]*?<\/script>)?<\/div>/;
  if (!re.test(out)) throw new Error(`conteneur root introuvable (${p})`);
  return out.replace(re, () => `<div id="root">${block}</div>`);
}

// Écrit (ou complète) dist/<p>/index.html pour chaque page connue. Les pages déjà écrites par og-pages gardent leurs
// balises d'aperçu ; les fiches absentes du manifeste (créées dans la semaine) reçoivent titre + contenu.
export function writeSeoPages(out: string, data: SeoData): { written: number; created: number } {
  const base = fs.readFileSync(path.join(out, "index.html"), "utf8");
  let written = 0, created = 0;
  for (const [p, body] of data.bodies) {
    const file = p === "/" ? path.join(out, "index.html") : path.join(out, p, "index.html");
    let html: string;
    if (fs.existsSync(file)) html = fs.readFileSync(file, "utf8");
    else {
      html = base;
      if (body.title) html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(body.title)}</title>`)
        .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(body.title)}$2`);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      created++;
    }
    try {
      fs.writeFileSync(file, injectBody(html, p, body));
      written++;
    } catch (e) {
      console.warn("[seo-static] page ignorée :", p, e);
    }
  }
  return { written, created };
}
