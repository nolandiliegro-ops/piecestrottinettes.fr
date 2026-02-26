import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonResponse = (body: object, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/** Fetch the top 10 known confusions from scan_validations */
async function getKnownConfusions(supabase: any): Promise<string> {
  try {
    const { data } = await supabase
      .from("scan_validations")
      .select("ai_brand, ai_model, corrected_model_id, scooter_models!scan_validations_corrected_model_id_fkey(name, brands(name))")
      .eq("is_validated", false)
      .not("corrected_model_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!data || data.length === 0) return "";

    // Aggregate confusion pairs
    const confusionMap = new Map<string, { correct: string; count: number }>();
    for (const row of data) {
      const aiName = `${row.ai_brand} ${row.ai_model}`.trim();
      const correctModel = row.scooter_models;
      if (!correctModel) continue;
      const correctName = `${correctModel.brands?.name || ""} ${correctModel.name}`.trim();
      const key = `${aiName}→${correctName}`;
      const existing = confusionMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        confusionMap.set(key, { correct: correctName, count: 1 });
      }
    }

    // Sort by frequency and take top 10
    const topConfusions = [...confusionMap.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10);

    if (topConfusions.length === 0) return "";

    let block = "\n\nCONFUSIONS CONNUES (ne fais PAS ces erreurs) :\n";
    for (const [key, val] of topConfusions) {
      const [wrong] = key.split("→");
      block += `- "${wrong}" est souvent confondue avec "${val.correct}". Vérifie attentivement.\n`;
    }
    return block;
  } catch (e) {
    console.error("Failed to fetch confusions:", e);
    return "";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image_base64 } = await req.json();

    if (!image_base64) {
      return jsonResponse({ error: "image_base64 is required" }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch known confusions for dynamic prompt enrichment
    const confusionsBlock = await getKnownConfusions(supabase);

    const systemPrompt = `Tu es un expert mondial en trottinettes électriques. Ton rôle est d'identifier précisément la marque et le modèle d'une trottinette électrique à partir d'une photo.

RÈGLES STRICTES :
1. Si l'image ne contient PAS de trottinette électrique, réponds UNIQUEMENT : {"found": false, "reason": "no_scooter"}
2. Si tu identifies une trottinette, réponds UNIQUEMENT en JSON : {"found": true, "brand": "...", "model": "...", "sn": "..."}
3. Pour le champ "brand", utilise le nom officiel du fabricant (Xiaomi, Segway-Ninebot, Dualtron, Kaabo, VSETT, Inokim, etc.)
4. Pour le champ "model", utilise le nom commercial précis (ex: "Mi Electric Scooter Pro 2", "Thunder 3", "Wolf Warrior 11+")
5. Si une étiquette de numéro de série (SN) est visible (souvent sur le côté ou dessous du plateau/deck), extrais le SN complet. Sinon, mets null.
6. Ne devine PAS si tu n'es pas sûr. Préfère {"found": false, "reason": "uncertain"} plutôt qu'une mauvaise identification.
7. Examine attentivement les logos, les autocollants, la forme du guidon, le design du deck, et les phares pour distinguer les modèles similaires.

Réponds UNIQUEMENT avec le JSON, rien d'autre.${confusionsBlock}`;

    // Send image to Gemini for identification
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Identifie cette trottinette électrique. Si ce n'est pas une trottinette, dis-le." },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image_base64}` } },
            ],
          },
        ],
        temperature: 0,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return jsonResponse({ error: "Trop de requêtes, réessayez dans quelques secondes." }, 429);
      if (status === 402) return jsonResponse({ error: "Crédits IA insuffisants." }, 402);
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", status, errorText);
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from AI response
    let aiResult;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      aiResult = JSON.parse(jsonMatch[0]);
    } catch {
      console.error("Failed to parse AI response:", rawContent);
      return jsonResponse({ found: false, reason: "parse_error", raw: rawContent });
    }

    if (!aiResult.found) {
      return jsonResponse({ found: false, reason: aiResult.reason || "not_identified" });
    }

    // Fuzzy search in database
    const aiBrand = aiResult.brand || "";
    const aiModel = aiResult.model || "";
    const searchTerm = `${aiBrand} ${aiModel}`.trim();

    const { data: fuzzyResults, error: fuzzyError } = await supabase.rpc("search_scooter_fuzzy", {
      search_query: searchTerm,
    });

    if (fuzzyError) {
      console.error("Fuzzy search error:", fuzzyError);
      // Fallback to ILIKE
      const { data: ilikeResults } = await supabase
        .from("scooter_models")
        .select("id, name, slug, brand:brands(name)")
        .or(`name.ilike.%${aiModel}%,search_terms.ilike.%${aiModel}%`)
        .limit(1);

      if (ilikeResults && ilikeResults.length > 0) {
        const match = ilikeResults[0];
        return jsonResponse({
          found: true,
          scooter_model_id: match.id,
          name: match.name,
          slug: match.slug,
          brand: (match.brand as any)?.name || aiBrand,
          ai_brand: aiBrand,
          ai_model: aiModel,
          sn: aiResult.sn || null,
          confidence: "ilike",
        });
      }

      return jsonResponse({
        found: false,
        reason: "no_match",
        ai_brand: aiBrand,
        ai_model: aiModel,
        sn: aiResult.sn || null,
      });
    }

    if (fuzzyResults && fuzzyResults.length > 0) {
      const best = fuzzyResults[0];
      return jsonResponse({
        found: true,
        scooter_model_id: best.id,
        name: best.name,
        slug: best.slug,
        brand: best.brand_name,
        ai_brand: aiBrand,
        ai_model: aiModel,
        sn: aiResult.sn || null,
        confidence: best.similarity > 0.5 ? "high" : "medium",
        similarity: best.similarity,
      });
    }

    return jsonResponse({
      found: false,
      reason: "no_match",
      ai_brand: aiBrand,
      ai_model: aiModel,
      sn: aiResult.sn || null,
    });
  } catch (error) {
    console.error("scan-trott error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
