import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image_base64 } = await req.json();

    if (!image_base64) {
      return new Response(
        JSON.stringify({ error: "image_base64 is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Step 1: Send image to Gemini for identification
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Tu es un expert mondial en trottinettes électriques. Ton rôle est d'identifier précisément la marque et le modèle d'une trottinette électrique à partir d'une photo.

RÈGLES STRICTES :
1. Si l'image ne contient PAS de trottinette électrique, réponds UNIQUEMENT : {"found": false, "reason": "no_scooter"}
2. Si tu identifies une trottinette, réponds UNIQUEMENT en JSON : {"found": true, "brand": "...", "model": "...", "sn": "..."}
3. Pour le champ "brand", utilise le nom officiel du fabricant (Xiaomi, Segway-Ninebot, Dualtron, Kaabo, VSETT, Inokim, etc.)
4. Pour le champ "model", utilise le nom commercial précis (ex: "Mi Electric Scooter Pro 2", "Thunder 3", "Wolf Warrior 11+")
5. Si une étiquette de numéro de série (SN) est visible (souvent sur le côté ou dessous du plateau/deck), extrais le SN complet. Sinon, mets null.
6. Ne devine PAS si tu n'es pas sûr. Préfère {"found": false, "reason": "uncertain"} plutôt qu'une mauvaise identification.

Réponds UNIQUEMENT avec le JSON, rien d'autre.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Identifie cette trottinette électrique. Si ce n'est pas une trottinette, dis-le.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${image_base64}`,
                },
              },
            ],
          },
        ],
        temperature: 0,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Trop de requêtes, réessayez dans quelques secondes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA insuffisants." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", status, errorText);
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";
    
    // Parse JSON from AI response (handle markdown code blocks)
    let aiResult;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      aiResult = JSON.parse(jsonMatch[0]);
    } catch {
      console.error("Failed to parse AI response:", rawContent);
      return new Response(
        JSON.stringify({ found: false, reason: "parse_error", raw: rawContent }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Check if AI found a scooter
    if (!aiResult.found || aiResult.found === false) {
      return new Response(
        JSON.stringify({ found: false, reason: aiResult.reason || "not_identified" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: Fuzzy search in database using pg_trgm
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const aiBrand = aiResult.brand || "";
    const aiModel = aiResult.model || "";
    const searchTerm = `${aiBrand} ${aiModel}`.trim();

    // Try fuzzy search with pg_trgm similarity on concatenated brand + model name
    const { data: fuzzyResults, error: fuzzyError } = await supabase.rpc("search_scooter_fuzzy", {
      search_query: searchTerm,
    });

    if (fuzzyError) {
      console.error("Fuzzy search error:", fuzzyError);
      // Fallback to ILIKE search
      const { data: ilikeResults } = await supabase
        .from("scooter_models")
        .select("id, name, slug, brand:brands(name)")
        .or(`name.ilike.%${aiModel}%,search_terms.ilike.%${aiModel}%`)
        .limit(1);

      if (ilikeResults && ilikeResults.length > 0) {
        const match = ilikeResults[0];
        return new Response(
          JSON.stringify({
            found: true,
            scooter_model_id: match.id,
            name: match.name,
            slug: match.slug,
            brand: (match.brand as any)?.name || aiBrand,
            sn: aiResult.sn || null,
            confidence: "ilike",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          found: false,
          reason: "no_match",
          ai_brand: aiBrand,
          ai_model: aiModel,
          sn: aiResult.sn || null,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (fuzzyResults && fuzzyResults.length > 0) {
      const best = fuzzyResults[0];
      return new Response(
        JSON.stringify({
          found: true,
          scooter_model_id: best.id,
          name: best.name,
          slug: best.slug,
          brand: best.brand_name,
          sn: aiResult.sn || null,
          confidence: best.similarity > 0.5 ? "high" : "medium",
          similarity: best.similarity,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        found: false,
        reason: "no_match",
        ai_brand: aiBrand,
        ai_model: aiModel,
        sn: aiResult.sn || null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("scan-trott error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
