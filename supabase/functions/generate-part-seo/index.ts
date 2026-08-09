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
- Structure : [Bénéfice technique / résolution problème] + [Famille de dimension ou voltage] + 'Expédition 24h.' — vise 140 à 155 caractères, ne dépasse JAMAIS 155.
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

// ─── Garde-fous déterministes (longueurs + phrase canonique) ───────────────────

const MAX_META_TITLE = 65;
const MAX_META_DESCRIPTION = 155;

// Suffixe de marque : seule troncature autorisée par la règle A. Espaces tolérés
// autour du pipe, insensible à la casse, uniquement en fin de chaîne.
const BRAND_SUFFIX_RE = /\s*\|\s*piecestrottinettes\.fr\s*$/i;

// Phrase imposée par la règle C.2. Doit être reproduite mot pour mot.
const CANONICAL_SENTENCE = "Vérifie les dimensions inscrites sur ta pièce d'origine";

// Longueur en points de code — même compteur que enrich.js / backfill-seo.mjs
// ([...s].length), sinon un emoji dans le nom fausserait la mesure.
function len(s: string): number {
  return [...s].length;
}

// Les LLM alternent apostrophe droite (') et typographique (’). On normalise ce
// seul caractère avant comparaison : la phrase reste vérifiée mot pour mot
// (accents et casse compris), on tolère juste la variante de glyphe.
function normalizeApostrophes(s: string): string {
  return s.replace(/[’ʼ‛′]/g, "'");
}

function hasCanonicalSentence(description: string): boolean {
  return normalizeApostrophes(description).includes(
    normalizeApostrophes(CANONICAL_SENTENCE),
  );
}

// Post-traitement du meta_title : trim systématique ; au-delà de 65 caractères,
// retrait du suffixe de marque. Jamais de troncature au milieu du texte — si le
// titre dépasse encore, la validation le signale et déclenche la relance.
function normalizeMetaTitle(raw: string): string {
  const trimmed = raw.trim();
  if (len(trimmed) <= MAX_META_TITLE) return trimmed;
  const stripped = trimmed.replace(BRAND_SUFFIX_RE, "").trim();
  return stripped.length > 0 ? stripped : trimmed;
}

// Retourne la liste des violations (vide = conforme).
function collectViolations(
  metaTitle: string,
  metaDescription: string,
  description: string,
): string[] {
  const violations: string[] = [];
  if (len(metaTitle) > MAX_META_TITLE) {
    violations.push(
      `meta_title trop long : ${len(metaTitle)} caractères alors que le maximum est ${MAX_META_TITLE}. ` +
        `Raccourcis le texte lui-même (le suffixe '| piecestrottinettes.fr' a déjà été retiré automatiquement), ` +
        `sans jamais amputer le mot-clé principal ni la dimension.`,
    );
  }
  if (len(metaDescription) > MAX_META_DESCRIPTION) {
    violations.push(
      `meta_description trop longue : ${len(metaDescription)} caractères alors que le maximum est ${MAX_META_DESCRIPTION}. ` +
        `Réécris-la plus courte en gardant la structure imposée.`,
    );
  }
  if (!hasCanonicalSentence(description)) {
    violations.push(
      `La phrase obligatoire "${CANONICAL_SENTENCE}" est absente de la description. ` +
        `Elle doit figurer telle quelle dans la section <h2>Compatibilité</h2>, mot pour mot, ` +
        `sans reformulation ni synonyme, suivie de "La liste complète des modèles vérifiés et garantis est affichée ci-dessous."`,
    );
  }
  return violations;
}

function buildCorrectiveMessage(violations: string[]): string {
  return (
    "Ta réponse précédente est refusée. Violations relevées :\n" +
    violations.map((v, i) => `${i + 1}. ${v}`).join("\n") +
    "\n\nCorrige UNIQUEMENT ces points. Conserve le reste du contenu à l'identique : " +
    "mêmes H2 dans le même ordre, mêmes données techniques, aucune donnée inventée, " +
    "aucune liste de modèles de trottinettes.\n" +
    "Réponds uniquement avec l'objet JSON complet, sans aucun texte ni balise autour."
  );
}

// ─── Appel gateway (une tentative) ─────────────────────────────────────────────

type GatewayMessage = { role: "system" | "user" | "assistant"; content: string };

type AttemptResult =
  | {
    ok: true;
    raw: string;
    description: string;
    meta_title: string;
    meta_description: string;
  }
  | { ok: false; error: string };

async function runAttempt(
  messages: GatewayMessage[],
  lovableKey: string,
): Promise<AttemptResult> {
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
        messages,
      }),
    });
  } catch (e) {
    return { ok: false, error: `gateway_fetch_failed: ${String(e)}` };
  }

  if (!gatewayRes.ok) {
    let msg: string;
    if (gatewayRes.status === 429) msg = "rate_limited";
    else if (gatewayRes.status === 402) msg = "credits_exhausted";
    else msg = `gateway_error: ${gatewayRes.status}`;
    // Consume body to avoid resource leak
    try { await gatewayRes.text(); } catch { /* noop */ }
    return { ok: false, error: msg };
  }

  let gatewayJson: any;
  try {
    gatewayJson = await gatewayRes.json();
  } catch {
    return { ok: false, error: "gateway_invalid_json" };
  }

  const content: string | undefined = gatewayJson?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    return { ok: false, error: "gateway_empty_content" };
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
    return { ok: false, error: `parse_failed: ${content.slice(0, 200)}` };
  }

  const isNonEmptyString = (v: unknown): v is string =>
    typeof v === "string" && v.trim().length > 0;

  if (
    !isNonEmptyString(parsed.description) ||
    !isNonEmptyString(parsed.meta_title) ||
    !isNonEmptyString(parsed.meta_description)
  ) {
    return { ok: false, error: "validation_failed" };
  }

  return {
    ok: true,
    raw: content,
    description: parsed.description,
    meta_title: parsed.meta_title,
    meta_description: parsed.meta_description,
  };
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

  const baseMessages: GatewayMessage[] = [
    { role: "system", content: buildSystemPrompt(userPayload) },
    { role: "user", content: userMessage },
  ];

  const first = await runAttempt(baseMessages, lovableKey);
  if (!first.ok) return jsonResponse(errorPayload(first.error));

  // Post-traitement déterministe AVANT validation : le strip du suffixe de marque
  // peut à lui seul faire repasser le titre sous 65 et éviter une relance.
  let chosen = first;
  let metaTitle = normalizeMetaTitle(first.meta_title);
  let violations = collectViolations(metaTitle, first.meta_description, first.description);

  // UNE seule relance corrective, uniquement si le premier jet viole une règle.
  if (violations.length > 0) {
    const second = await runAttempt(
      [
        ...baseMessages,
        { role: "assistant", content: first.raw },
        { role: "user", content: buildCorrectiveMessage(violations) },
      ],
      lovableKey,
    );
    // Une relance en erreur (réseau/parse) n'invalide pas le premier jet : on le
    // conserve et il repartira avec ses warnings.
    if (second.ok) {
      const retryTitle = normalizeMetaTitle(second.meta_title);
      const retryViolations = collectViolations(
        retryTitle,
        second.meta_description,
        second.description,
      );
      // On ne garde la relance que si elle ne régresse pas.
      if (retryViolations.length <= violations.length) {
        chosen = second;
        metaTitle = retryTitle;
        violations = retryViolations;
      }
    }
  }

  // Toujours status "ok" : les appelants (enrich.js, backfill-seo.mjs) écrivent sur
  // ce seul critère. Les violations résiduelles remontent en "warnings" — clé
  // additive, ignorée par les deux appelants qui ne lisent que les champs nommés.
  const body: Record<string, unknown> = {
    status: "ok",
    description: chosen.description,
    meta_title: metaTitle,
    meta_description: chosen.meta_description,
  };
  if (violations.length > 0) body.warnings = violations;

  return jsonResponse(body);
});
