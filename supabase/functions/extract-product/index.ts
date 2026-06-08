// Edge Function: extract-product
// Extract product data from a supplier URL and return normalized JSON.
// Auth: shared header `x-admin-secret` matching ADMIN_BULK_SECRET.
// No DB writes. Additive, isolated function.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type Output = {
  status: "ok" | "blocked" | "error";
  name: string;
  sku: string | null;
  ean: string | null;
  brand: string | null;
  category_hint: string | null;
  price: number | null;
  currency: string | null;
  images: string[];
  specs: string;
  compatibility: string[];
  source_url: string;
};

const emptyOut = (status: Output["status"], source_url: string): Output => ({
  status,
  name: "",
  sku: null,
  ean: null,
  brand: null,
  category_hint: null,
  price: null,
  currency: null,
  images: [],
  specs: "",
  compatibility: [],
  source_url,
});

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

async function fetchHtml(url: string): Promise<{ ok: boolean; status: number; html: string }> {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
      },
      signal: ctrl.signal,
      redirect: "follow",
    });
    const html = await res.text();
    return { ok: res.ok, status: res.status, html };
  } finally {
    clearTimeout(to);
  }
}

function decodeEntities(s: string): string {
  if (!s) return s;
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function parseJsonLd(html: string): any[] {
  const out: any[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const raw = m[1].trim();
    try {
      const parsed = JSON.parse(raw);
      out.push(parsed);
    } catch {
      // try to recover by stripping trailing commas
      try {
        out.push(JSON.parse(raw.replace(/,\s*([}\]])/g, "$1")));
      } catch {
        /* skip */
      }
    }
  }
  return out;
}

function findProductNode(node: any): any | null {
  if (!node) return null;
  if (Array.isArray(node)) {
    for (const n of node) {
      const r = findProductNode(n);
      if (r) return r;
    }
    return null;
  }
  if (typeof node === "object") {
    const t = node["@type"];
    const types = Array.isArray(t) ? t : [t];
    if (types.some((x) => typeof x === "string" && x.toLowerCase() === "product")) {
      return node;
    }
    if (node["@graph"]) {
      const r = findProductNode(node["@graph"]);
      if (r) return r;
    }
  }
  return null;
}

function metaContent(html: string, attr: "property" | "name", key: string): string | null {
  const re = new RegExp(
    `<meta[^>]+${attr}=["']${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*content=["']([^"']*)["']`,
    "i",
  );
  const m = html.match(re);
  if (m) return decodeEntities(m[1]);
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+${attr}=["']${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`,
    "i",
  );
  const m2 = html.match(re2);
  return m2 ? decodeEntities(m2[1]) : null;
}

function titleTag(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(m[1].trim()) : null;
}

function cleanHtmlForAI(html: string): string {
  let h = html;
  h = h.replace(/<!--[\s\S]*?-->/g, "");
  h = h.replace(/<script[\s\S]*?<\/script>/gi, "");
  h = h.replace(/<style[\s\S]*?<\/style>/gi, "");
  h = h.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
  h = h.replace(/<svg[\s\S]*?<\/svg>/gi, "");
  h = h.replace(/<nav[\s\S]*?<\/nav>/gi, "");
  h = h.replace(/<header[\s\S]*?<\/header>/gi, "");
  h = h.replace(/<footer[\s\S]*?<\/footer>/gi, "");
  // strip data: in src/srcset
  h = h.replace(/\s(src|srcset)=["']data:[^"']*["']/gi, "");
  // collapse whitespace
  h = h.replace(/\s{2,}/g, " ");
  if (h.length > 25000) h = h.slice(0, 25000);
  return h;
}

const IMG_BAD = /(logo|icon|sprite|placeholder|flag|pixel|blank|loader|favicon)/i;
const IMG_PATH_BAD = /(\/assets\/|\/cdn\/shop\/t\/|\/themes\/|\/theme\/)/i;

function absUrl(src: string, base: string): string | null {
  if (!src) return null;
  src = src.trim();
  if (!src || src.startsWith("data:")) return null;
  try {
    return new URL(src, base).href;
  } catch {
    return null;
  }
}

function isBadImageUrl(u: string): boolean {
  if (IMG_BAD.test(u)) return true;
  if (IMG_PATH_BAD.test(u)) return true;
  const path = u.split("?")[0].toLowerCase();
  if (path.endsWith(".svg")) return true;
  return false;
}

function collectImages(opts: {
  jsonldImages: string[];
  ogImage: string | null;
  htmlImgs: string[];
  base: string;
}): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (raw: string) => {
    const u = absUrl(raw, opts.base);
    if (!u) return;
    if (isBadImageUrl(u)) return;
    if (seen.has(u)) return;
    seen.add(u);
    out.push(u);
  };
  for (const i of opts.jsonldImages) push(i);
  if (out.length < 4 && opts.ogImage) push(opts.ogImage);
  if (out.length < 4) {
    for (const i of opts.htmlImgs) {
      push(i);
      if (out.length >= 4) break;
    }
  }
  return out.slice(0, 4);
}

function isValidEan13(s: string): boolean {
  if (!/^\d{13}$/.test(s)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const d = s.charCodeAt(i) - 48;
    sum += i % 2 === 0 ? d : d * 3;
  }
  const check = (10 - (sum % 10)) % 10;
  return check === s.charCodeAt(12) - 48;
}

function findEanInText(text: string): string | null {
  if (!text) return null;
  const re = /\d{13}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (isValidEan13(m[0])) return m[0];
  }
  return null;
}

function extractImgTags(html: string): string[] {
  const out: string[] = [];
  const re = /<img[^>]+(?:src|data-src|data-lazy|data-original)=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    out.push(m[1]);
  }
  return out;
}

function parsePriceNumber(raw: unknown): number | null {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s) return null;
  // remove currency symbols and spaces
  s = s.replace(/[€$£\s\u00A0]/g, "");
  // if both . and , present: assume . thousands, , decimal -> drop dots
  if (s.includes(",") && s.includes(".")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function detectCurrency(raw: string | null | undefined, fallbackHtml: string): string | null {
  if (raw) {
    const up = String(raw).toUpperCase().trim();
    if (/^[A-Z]{3}$/.test(up)) return up;
    if (up.includes("€") || up.includes("EUR")) return "EUR";
    if (up.includes("$") || up.includes("USD")) return "USD";
    if (up.includes("£") || up.includes("GBP")) return "GBP";
  }
  if (fallbackHtml.includes("€")) return "EUR";
  return null;
}

function extractPriceFromJsonLd(product: any): number | null {
  if (!product) return null;
  const offers = product.offers;
  const list = Array.isArray(offers) ? offers : offers ? [offers] : [];
  for (const off of list) {
    if (!off) continue;
    // skip installment-like specs
    const ps = off.priceSpecification;
    const psArr = Array.isArray(ps) ? ps : ps ? [ps] : [];
    const isInstallment = psArr.some((x: any) => {
      const t = JSON.stringify(x || "").toLowerCase();
      return /installment|mensual|younited|month/i.test(t);
    });
    if (isInstallment) continue;
    const p =
      off.price ?? off.lowPrice ?? off.highPrice ?? (psArr[0] && psArr[0].price);
    const n = parsePriceNumber(p);
    if (n != null && n > 0) return n;
  }
  return null;
}

function extractBrand(product: any): string | null {
  if (!product) return null;
  const b = product.brand;
  if (!b) return null;
  if (typeof b === "string") return b;
  if (typeof b === "object") return b.name || null;
  return null;
}

function extractImagesFromJsonLd(product: any): string[] {
  if (!product) return [];
  const i = product.image;
  if (!i) return [];
  if (typeof i === "string") return [i];
  if (Array.isArray(i)) {
    return i
      .map((x) => (typeof x === "string" ? x : x?.url))
      .filter((x): x is string => typeof x === "string");
  }
  if (typeof i === "object" && i.url) return [i.url];
  return [];
}

function extractEan(product: any): string | null {
  if (!product) return null;
  return (
    product.gtin13 ||
    product.gtin14 ||
    product.gtin12 ||
    product.gtin8 ||
    product.gtin ||
    product.ean ||
    null
  );
}

async function aiComplete(opts: {
  cleanedHtml: string;
  base: Partial<Output>;
  sourceUrl: string;
}): Promise<Partial<Output>> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return {};
  const sys = `Tu es un extracteur strict de fiches produit e-commerce (pièces et trottinettes électriques). Tu reçois (1) un HTML nettoyé d'une page produit fournisseur et (2) une base déjà extraite (JSON-LD/OG). Ta mission : COMPLÉTER les champs manquants. N'invente JAMAIS. Si une info n'est pas claire dans la page, mets null / "" / [].
Réponds UNIQUEMENT en JSON valide avec ce schéma exact :
{"name": string, "sku": string|null, "ean": string|null, "brand": string|null, "category_hint": string|null, "price": number|null, "currency": string|null, "specs": string, "compatibility": string[]}
- price : le prix d'achat principal affiché (ignore prix barré / mensualités / Younited / "à partir de X€/mois").
- specs : texte libre récapitulatif des caractéristiques techniques visibles.
- compatibility : array des modèles de trottinettes EXPLICITEMENT listés sur la page (section compatibilité/description). INTERDICTION ABSOLUE de déduire, supposer, ou compléter de mémoire. Si aucun modèle n'est explicitement écrit dans la page, renvoie []. Ne JAMAIS inférer des modèles à partir du nom du produit, de la marque, ou de connaissances générales.
- category_hint : catégorie ou type de produit (ex: "Pneu", "Chargeur", "Batterie", "Trottinette électrique").`;

  const userMsg = `BASE déjà extraite :
${JSON.stringify(opts.base)}

URL source : ${opts.sourceUrl}

HTML nettoyé :
${opts.cleanedHtml}`;

  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 25000);
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      signal: ctrl.signal,
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: userMsg },
        ],
        temperature: 0,
      }),
    });
    clearTimeout(to);
    if (!r.ok) {
      console.error("AI gateway error", r.status, await r.text().catch(() => ""));
      return {};
    }
    const data = await r.json();
    const raw = data.choices?.[0]?.message?.content || "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return {};
    const parsed = JSON.parse(match[0]);
    return {
      name: typeof parsed.name === "string" ? parsed.name : undefined,
      sku: parsed.sku ?? undefined,
      ean: parsed.ean ?? undefined,
      brand: parsed.brand ?? undefined,
      category_hint: parsed.category_hint ?? undefined,
      price: typeof parsed.price === "number" ? parsed.price : undefined,
      currency: parsed.currency ?? undefined,
      specs: typeof parsed.specs === "string" ? parsed.specs : "",
      compatibility: Array.isArray(parsed.compatibility)
        ? parsed.compatibility.filter((x: unknown) => typeof x === "string")
        : [],
    };
  } catch (e) {
    console.error("AI complete failed:", e);
    return {};
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Auth: shared secret
  const provided = req.headers.get("x-admin-secret");
  const expected = Deno.env.get("ADMIN_BULK_SECRET");
  if (!expected || provided !== expected) {
    return json({ error: "Unauthorized" }, 401);
  }

  let url = "";
  try {
    const body = await req.json();
    url = String(body?.url || "").trim();
    if (!url) return json({ error: "url required" }, 400);
    new URL(url); // validate
  } catch {
    return json({ error: "invalid body" }, 400);
  }

  try {
    // 1. Fetch
    let fetched;
    try {
      fetched = await fetchHtml(url);
    } catch (e) {
      console.error("fetch failed", e);
      return json(emptyOut("error", url));
    }
    if (!fetched.ok || [403, 429, 503].includes(fetched.status)) {
      console.log(`blocked: status=${fetched.status}`);
      return json(emptyOut("blocked", url));
    }
    const html = fetched.html || "";
    if (html.length < 500) {
      return json(emptyOut("blocked", url));
    }

    // 2. Standards extraction
    const ldDocs = parseJsonLd(html);
    let product: any = null;
    for (const doc of ldDocs) {
      product = findProductNode(doc);
      if (product) break;
    }

    const ogTitle = metaContent(html, "property", "og:title");
    const ogImage = metaContent(html, "property", "og:image");
    const ogPrice = metaContent(html, "property", "og:price:amount") ||
      metaContent(html, "property", "product:price:amount");
    const ogCurr = metaContent(html, "property", "og:price:currency") ||
      metaContent(html, "property", "product:price:currency");
    const metaDesc = metaContent(html, "name", "description");

    const base: Partial<Output> = {};
    if (product) {
      base.name = product.name || undefined;
      base.sku = product.sku || product.mpn || null;
      base.ean = extractEan(product);
      base.brand = extractBrand(product);
      base.category_hint = (typeof product.category === "string" ? product.category : null) || undefined;
      const ldPrice = extractPriceFromJsonLd(product);
      if (ldPrice != null) base.price = ldPrice;
      const ldCurr = product.offers?.priceCurrency ||
        (Array.isArray(product.offers) ? product.offers[0]?.priceCurrency : null);
      if (ldCurr) base.currency = String(ldCurr).toUpperCase();
    }
    if (!base.name) base.name = ogTitle || titleTag(html) || "";
    if (base.price == null && ogPrice) {
      const n = parsePriceNumber(ogPrice);
      if (n != null) base.price = n;
    }
    if (!base.currency) base.currency = detectCurrency(ogCurr, html);

    // 3. Clean HTML for AI
    const cleaned = cleanHtmlForAI(html);

    // 4. AI complete
    const ai = await aiComplete({ cleanedHtml: cleaned, base, sourceUrl: url });

    // 5. Merge — standards prioritaires sur identité/prix, IA sur specs/compat
    const merged: Output = emptyOut("ok", url);
    merged.name = (base.name || ai.name || "").toString().trim();
    merged.sku = (base.sku as string | null | undefined) ?? (ai.sku ?? null) ?? null;
    merged.ean = (base.ean as string | null | undefined) ?? (ai.ean ?? null) ?? null;
    merged.brand = (base.brand as string | null | undefined) ?? (ai.brand ?? null) ?? null;
    merged.category_hint = (base.category_hint as string | null | undefined) ?? (ai.category_hint ?? null) ?? null;
    merged.price = base.price != null ? base.price : ai.price ?? null;
    merged.currency = base.currency || ai.currency || detectCurrency(null, html);
    if (merged.currency) merged.currency = merged.currency.toUpperCase();
    merged.specs = (ai.specs || metaDesc || "").toString();
    merged.compatibility = Array.isArray(ai.compatibility) ? ai.compatibility : [];

    // Images — strict order
    const jsonldImgs = extractImagesFromJsonLd(product);
    const htmlImgs = extractImgTags(cleaned);
    merged.images = collectImages({
      jsonldImages: jsonldImgs,
      ogImage,
      htmlImgs,
      base: url,
    });

    console.log(
      `extract-product OK url=${url} name="${merged.name}" price=${merged.price} imgs=${merged.images.length} (ld=${jsonldImgs.length}, og=${ogImage ? 1 : 0}, html=${htmlImgs.length})`,
    );

    return json(merged);
  } catch (e) {
    console.error("extract-product fatal:", e);
    return json(emptyOut("error", url));
  }
});
