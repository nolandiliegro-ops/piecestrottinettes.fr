import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const COMPONENT_PROMPTS: Record<string, string> = {
  motor_watts:
    "Analyze this image of an electric scooter motor hub. Extract any visible technical markings: wattage (W), voltage (V), brand name, model number. Return structured data.",
  brake_type:
    "Analyze this image of an electric scooter braking system. Identify the brake type: disc, drum, eabs, or none. Note any brand markings or specifications visible.",
  wheel_size:
    "Analyze this image of an electric scooter wheel/tire. Extract the tire size markings (e.g., 10x2.5), tire brand, and any other specifications visible on the sidewall.",
  folding_mechanism:
    "Analyze this image of an electric scooter folding mechanism. Identify the type: lever_front, lever_rear, or none. Note the mechanism style and any brand markings.",
  led_position:
    "Analyze this image of an electric scooter LED lighting. Identify position: front, rear, both, or none. Note LED type and any specifications visible.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image_base64, component_type } = await req.json();

    if (!image_base64 || !component_type) {
      return new Response(
        JSON.stringify({ error: "image_base64 and component_type required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = COMPONENT_PROMPTS[component_type] || 
      "Analyze this image of an electric scooter component. Extract any visible technical markings, specifications, brand names, or model numbers.";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image_base64}` } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_technical_markers",
              description: "Extract structured technical markers from scooter component image",
              parameters: {
                type: "object",
                properties: {
                  motor_watts: { type: "number", description: "Motor power in watts" },
                  brake_type: { type: "string", enum: ["disc", "drum", "eabs", "none"] },
                  wheel_size: { type: "string", description: "Wheel/tire size e.g. 10x2.5" },
                  folding_mechanism: { type: "string", enum: ["lever_front", "lever_rear", "none"] },
                  led_position: { type: "string", enum: ["front", "rear", "both", "none"] },
                  brand_marking: { type: "string", description: "Any brand name visible" },
                  model_marking: { type: "string", description: "Any model number visible" },
                  additional_specs: { type: "string", description: "Other specifications found" },
                },
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_technical_markers" } },
      }),
    });

    if (!response.ok) {
      const errorStatus = response.status;
      if (errorStatus === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please retry later", markers: {} }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (errorStatus === 402) {
        return new Response(
          JSON.stringify({ error: "Credits exhausted", markers: {} }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", errorStatus, t);
      return new Response(
        JSON.stringify({ error: "AI analysis failed", markers: {} }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    let markers: Record<string, any> = {};

    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        // Filter out null/empty values
        markers = Object.fromEntries(
          Object.entries(parsed).filter(([, v]) => v !== null && v !== undefined && v !== "")
        );
      } catch {
        console.error("Failed to parse tool call arguments");
      }
    }

    return new Response(
      JSON.stringify({ markers, confidence: Object.keys(markers).length > 0 ? 0.85 : 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("extract-markers error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", markers: {} }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
