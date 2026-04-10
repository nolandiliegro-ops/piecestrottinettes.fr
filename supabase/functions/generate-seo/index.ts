const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Tu es expert SEO e-commerce spécialisé pièces détachées trottinettes électriques en France.
Niche : intention d'achat forte, visiteurs cherchent une pièce précise pour réparer leur trottinette.
Marques prioritaires : Xiaomi M365/Pro/Pro2/4Pro/Essential, Ninebot Max G30/F20/F25/F30/E22/E25, Kaabo, Dualtron.
Structures requêtes cibles : [type pièce] + [marque] + [modèle], [type pièce] + [dimension], [problème] + [modèle].
Template title : [Nom Pièce Précis] pour [Marque] [Modèles] | piecestrottinettes.fr — max 60 chars.
RÈGLE ABSOLUE meta_description : MAXIMUM 155 caractères, point final. Compte les caractères. Format : [modèles compatibles]. [bénéfice principal]. Livraison rapide. Si tu dépasses 155 caractères tu as échoué.
Template description : commencer par modèles compatibles, puis caractéristiques, puis conseil installation — 80-120 mots.
Réponds UNIQUEMENT avec le texte demandé, sans guillemets, sans explication, sans balises.`;

function buildUserPrompt(field: string, data: Record<string, unknown>): string {
  const dataStr = Object.entries(data)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
    .join(" | ");

  if (field === "meta_title") {
    return `Génère un meta title SEO pour : ${dataStr}`;
  }
  if (field === "meta_description") {
    return `Génère une meta description SEO pour : ${dataStr}`;
  }
  return `Génère une description produit SEO pour : ${dataStr}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY manquant" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { field, data } = body as { type: string; field: string; data: Record<string, unknown> };

    if (!field || !data) {
      return new Response(
        JSON.stringify({ error: "field et data sont requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userPrompt = buildUserPrompt(field, data);

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any)?.error?.message || `Erreur Anthropic ${res.status}`);
    }

    const anthropicData = await res.json();
    const generated = (anthropicData as any).content?.[0]?.text?.trim();

    if (!generated) {
      throw new Error("Réponse vide de l'IA");
    }

    return new Response(
      JSON.stringify({ generated }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
