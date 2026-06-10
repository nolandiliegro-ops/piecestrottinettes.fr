// Edge Function: generate-part-seo
// Additif pur. Auth via x-admin-secret. Modèle: google/gemini-2.5-flash via Lovable AI Gateway.

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `Tu es rédacteur SEO expert pour piecestrottinettes.fr, e-commerce + média de référence sur les pièces détachées de trottinettes électriques. Voix : « Wikipédia de la trottinette » — factuelle, neutre, experte, doublée de l'expérience d'un réparateur professionnel (réseau Steedy Trott). Public : Français cherchant une pièce précise pour réparer sa trottinette, forte intention d'achat.

RÈGLE ABSOLUE — ZÉRO INVENTION. Tu utilises EXCLUSIVEMENT les données fournies (nom, caractéristiques, compatibilité, EAN). Tu n'inventes JAMAIS une compatibilité, une dimension, une pression (PSI), un poids, une référence ou un EAN. Si une donnée est absente, tu ne la mentionnes pas — tu n'extrapoles pas.

UNICITÉ — colonne vertébrale obligatoire. Beaucoup de pièces se ressemblent (ex : 34 pneus pleins). Pour rendre chaque fiche unique, construis TOUJOURS le texte autour de la donnée distinctive du produit : sa dimension exacte, sa liste précise de modèles compatibles, son usage spécifique. Ces éléments apparaissent dès la première phrase. Interdiction de produire un texte interchangeable d'un produit à l'autre.

STRUCTURE de la description (français, 150-220 mots, en HTML léger : <h2> et <p> uniquement) :

- 1 phrase d'accroche : type de pièce + dimension exacte + 2-3 modèles compatibles phares.

- <h2>Compatibilité</h2> : liste claire des modèles compatibles fournis.

- <h2>Caractéristiques techniques</h2> : dimensions, matériau, pression, poids, EAN — uniquement ce qui est fourni.

- <h2>Comment l'installer</h2> : conseil concret de réparateur (2-3 phrases) + niveau de difficulté réaliste.

- 2 à 3 questions-réponses courtes en fin de texte (mini-FAQ : compatibilité, montage, usage), factuelles.

Ton factuel. INTERDITS : superlatifs creux (« le meilleur », « incroyable »), promesses non fondées, bourrage de mots-clés.

META TITLE : ≤ 60 caractères. Commence par pièce + dimension + modèle principal. PAS de nom de site. Intention d'achat FR.

META DESCRIPTION : ≤ 155 caractères. Bénéfice concret + modèles compatibles + livraison rapide + incitation. FR.

SORTIE : un objet JSON STRICT, rien d'autre — aucun texte avant/après, aucune balise \`\`\`. Clés exactes : description, meta_title, meta_description.`;

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

// Strip ```json fences and extract first balanced {...} substring.
function extractJsonObject(raw: string): string | null {
  let s = raw.trim();
  // Strip code fences if present
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();

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
          { role: "system", content: SYSTEM_PROMPT },
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

  // Defensive parse
  let parsed: any = null;
  try {
    parsed = JSON.parse(content);
  } catch {
    const extracted = extractJsonObject(content);
    if (extracted) {
      try { parsed = JSON.parse(extracted); } catch { parsed = null; }
    }
  }

  if (!parsed || typeof parsed !== "object") {
    return jsonResponse(errorPayload("parse_failed"));
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
