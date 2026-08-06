// Edge Function: generate-part-seo
// Additif pur. Auth via x-admin-secret. Modèle: google/gemini-2.5-flash via Lovable AI Gateway.

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Rend une valeur du payload injectable dans le prompt : objet → JSON compact,
// absente/vide → "non fourni" (jamais de "null"/"undefined" bruts dans le prompt).
function promptValue(v: unknown): string {
  if (v == null) return "non fourni";
  if (typeof v === "string") return v.trim() === "" ? "non fourni" : v.trim();
  try { return JSON.stringify(v); } catch { return String(v); }
}

// Modèles phares = strictement ceux fournis dans le payload d'entrée
// (input.compatibility, extrait de la fiche fournisseur). Plafonné à 2 : le prompt
// n'autorise qu'1 ou 2 exemples cités, jamais une liste. Vide → aucune ligne injectée,
// la règle "jamais inventés" du prompt reste seule en vigueur.
function flagshipModels(compatibility: unknown): string[] {
  if (!Array.isArray(compatibility)) return [];
  return compatibility
    .map((m) => (typeof m === "string" ? m.trim() : ""))
    .filter((m) => m.length > 0)
    .slice(0, 2);
}

function buildSystemPrompt(payload: {
  name: unknown;
  specs: unknown;
  compatibility: unknown;
  category_hint: unknown;
}): string {
  const flagships = flagshipModels(payload.compatibility);
  const flagshipLine = flagships.length > 0
    ? `\nModèles phares fournis : ${flagships.join(", ")}.`
    : "";

  return `Tu es un expert SEO e-commerce et mécanicien spécialisé en trottinettes électriques pour piecestrottinettes.fr.
Rédige le contenu SEO pour la pièce : ${promptValue(payload.name)} | Catégorie : ${promptValue(payload.category_hint)} | Specs brutes : ${promptValue(payload.specs)}.${flagshipLine}
SORTIE ATTENDUE (JSON STRICT) :
{
  "meta_title": "string",
  "meta_description": "string",
  "description": "string (HTML)"
}
RÈGLES STRICTES DE RÉDACTION :
A. META TITLE (Champ 'meta_title') :
- Longueur : ≤ 65 caractères MAXIMUM.
- Placer le mot-clé principal et la dimension exacte tout au début.
- En cas de dépassement des 65 caractères, tronquer le suffixe '| piecestrottinettes.fr', mais NE JAMAIS tronquer le mot-clé ou la dimension.
B. META DESCRIPTION (Champ 'meta_description') :
- Longueur : 140 à 155 caractères MAXIMUM.
- Structure : [Bénéfice technique / résolution problème] + [Famille de dimension/voltage] + [Livraison 24h/Stock] + [CTA].
C. DESCRIPTION HTML (Champ 'description') :
Utiliser uniquement <h2>, <p>, <ul>, <li>, <strong>. Pas de <h1>, <html>, <body>, ni blocs de code markdown.
Structure HTML obligatoire :
1. <h2>[Nom de la pièce] : Spécifications et Compatibilité</h2>
   - Paragraphe de 2 à 3 phrases maximum focus sur la durabilité et la résolution du problème.
2. <h2>Compatibilité</h2>
   - RÈGLE ABSOLUE : Ne JAMAIS générer de liste à puces de modèles de trottinettes déduite de tes connaissances (la notation en pouces est un arrondi commercial qui masque des incompatibilités mécaniques réelles, ex: jantes 134mm vs 6.1").
   - Décrire uniquement la famille dimensionnelle, le diamètre de jante ou le voltage.
   - Interdire toute formule d'exclusivité ('uniquement', 'spécifique à').
   - Terminer obligatoirement par : 'Vérifie les dimensions inscrites sur ta pièce d'origine. La liste complète des modèles vérifiés et garantis est affichée ci-dessous.'
   - Si 1 ou 2 modèles phares sont explicitement fournis dans le contexte d'entrée, ils peuvent être cités en exemple (ex: 'Pour jante 6.1 pouces (type Xiaomi M365)...'), jamais inventés.
3. <h2>Caractéristiques techniques</h2>
   - RÈGLE DE VÉRITÉ : N'invente JAMAIS une donnée absente des données d'entrée (EAN, épaisseur, type de valve, pression, matériau). Donnée absente = ligne omise dans la liste <ul>.
4. <h2>Comment installer</h2>
   - Guide pratique étape par étape (3 à 4 étapes en <p> ou <ol>). Inclure les outils nécessaires et le piège au montage à éviter.
D. INTERDICTIONS DE STYLE :
- ZÉRO phrase d'introduction ou de conclusion générique.
- ZÉRO sous-bloc H3 ou FAQ.
- Ton : Expert atelier, direct, factuel.`;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorPayload(message: string) {
  return {
    status: "error" as const,
    description: "",
    meta_title: "",
    meta_description: "",
    message,
  };
}

// Retire d'éventuelles fences markdown (```json ... ```) autour de la réponse LLM.
function stripCodeFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

// Extrait le premier objet {...} équilibré d'une chaîne déjà dé-fencée.
function extractJsonObject(raw: string): string | null {
  const s = stripCodeFences(raw);

  const start = s.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc) { esc = false; continue; }
      if (ch === "\\") { esc = true; continue; }
      if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') { inStr = true; continue; }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Auth
  const adminSecret = Deno.env.get("ADMIN_BULK_SECRET");
  if (!adminSecret) {
    return jsonResponse(errorPayload("ADMIN_BULK_SECRET not configured"), 500);
  }
  const provided = req.headers.get("x-admin-secret");
  if (!provided || provided !== adminSecret) {
    return jsonResponse(errorPayload("unauthorized"), 401);
  }

  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableKey) {
    return jsonResponse(errorPayload("LOVABLE_API_KEY not configured"), 500);
  }

  let input: Record<string, unknown>;
  try {
    input = await req.json();
  } catch {
    return jsonResponse(errorPayload("invalid_json_body"));
  }

  const userPayload = {
    name: input.name ?? null,
    specs: input.specs ?? null,
    compatibility: input.compatibility ?? [],
    ean: input.ean ?? null,
    category_hint: input.category_hint ?? null,
    brand: input.brand ?? null,
  };

  const userMessage =
    JSON.stringify(userPayload) +
    "\n\nRéponds uniquement avec l'objet JSON, sans aucun texte ni balise autour.";

  let gatewayRes: Response;
  try {
    gatewayRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildSystemPrompt(userPayload) },
          { role: "user", content: userMessage },
        ],
      }),
    });
  } catch (e) {
    return jsonResponse(errorPayload(`gateway_fetch_failed: ${String(e)}`));
  }

  if (!gatewayRes.ok) {
    let msg: string;
    if (gatewayRes.status === 429) msg = "rate_limited";
    else if (gatewayRes.status === 402) msg = "credits_exhausted";
    else msg = `gateway_error: ${gatewayRes.status}`;
    // Consume body to avoid resource leak
    try { await gatewayRes.text(); } catch { /* noop */ }
    return jsonResponse(errorPayload(msg));
  }

  let gatewayJson: any;
  try {
    gatewayJson = await gatewayRes.json();
  } catch {
    return jsonResponse(errorPayload("gateway_invalid_json"));
  }

  const content: string | undefined = gatewayJson?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    return jsonResponse(errorPayload("gateway_empty_content"));
  }

  // Parse blindé : fences ```json retirées AVANT le JSON.parse ; en dernier recours,
  // extraction du premier objet {...} équilibré. Aucun fallback silencieux — un échec
  // remonte "parse_failed" avec un extrait brut pour diagnostic (l'appelant retente,
  // cf. SEO_MAX_ATTEMPTS dans enrich.js).
  const stripped = stripCodeFences(content);
  let parsed: any = null;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    const extracted = extractJsonObject(stripped);
    if (extracted) {
      try { parsed = JSON.parse(extracted); } catch { parsed = null; }
    }
  }

  if (!parsed || typeof parsed !== "object") {
    return jsonResponse(errorPayload(`parse_failed: ${content.slice(0, 200)}`));
  }

  const description = parsed.description;
  const meta_title = parsed.meta_title;
  const meta_description = parsed.meta_description;

  const isNonEmptyString = (v: unknown): v is string =>
    typeof v === "string" && v.trim().length > 0;

  if (
    !isNonEmptyString(description) ||
    !isNonEmptyString(meta_title) ||
    !isNonEmptyString(meta_description)
  ) {
    return jsonResponse(errorPayload("validation_failed"));
  }

  return jsonResponse({
    status: "ok",
    description,
    meta_title,
    meta_description,
  });
});
