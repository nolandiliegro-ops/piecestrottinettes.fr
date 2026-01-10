import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Category prompts for macro-photography style images
const categoryPrompts: Record<string, string> = {
  pneus: "Macro professional studio photography of a high-performance electric scooter tire showing deep tread patterns, cinematic lighting, carbon black and deep grey background, high contrast, luxury automotive style, 8k resolution",
  "chambres-air": "Macro professional studio photography of a premium rubber inner tube with valve stem detail, cinematic lighting, carbon black background, luxury automotive style, 8k resolution",
  freinage: "Macro professional studio photography of a perforated stainless steel disc brake with a Mineral Green caliper, cinematic lighting, carbon black background, high contrast, luxury automotive style, 8k resolution",
  chargeurs: "Macro professional studio photography of a high-end electric scooter charger with LED indicator and premium cable, cinematic lighting, carbon black background, luxury automotive style, 8k resolution",
  batteries: "Macro professional studio photography of lithium battery cells with visible copper contacts and circuit board, cinematic lighting, carbon black background, luxury automotive style, 8k resolution",
  accessoires: "Macro professional studio photography of premium scooter accessories including carbon fiber fender and aluminum parts, cinematic lighting, carbon black background, luxury automotive style, 8k resolution",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { categoryId, categorySlug } = await req.json();

    if (!categoryId || !categorySlug) {
      return new Response(
        JSON.stringify({ error: "categoryId and categorySlug are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = categoryPrompts[categorySlug];
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: `No prompt found for category: ${categorySlug}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating image for category: ${categorySlug}`);

    // Create AbortController with 45s timeout for AI generation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    // Call Lovable AI Gateway for image generation
    let aiResponse: Response;
    try {
      aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image-preview",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          modalities: ["image", "text"],
        }),
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        console.error("AI request timed out after 45s for:", categorySlug);
        return new Response(
          JSON.stringify({ error: "Image generation timed out. Please retry." }),
          { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw fetchError;
    }

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to generate image" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const imageBase64 = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageBase64) {
      console.error("No image in AI response:", JSON.stringify(aiData));
      return new Response(
        JSON.stringify({ error: "No image generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Convert base64 to blob
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    // Upload to Supabase Storage
    const fileName = `${categorySlug}-${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from("category-images")
      .upload(fileName, imageBytes, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to upload image" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("category-images")
      .getPublicUrl(fileName);

    const imageUrl = urlData.publicUrl;

    // Upsert into category_images table
    const { error: dbError } = await supabase
      .from("category_images")
      .upsert(
        {
          category_id: categoryId,
          image_url: imageUrl,
          prompt: prompt,
        },
        { onConflict: "category_id" }
      );

    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to save image reference" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully generated and saved image for ${categorySlug}: ${imageUrl}`);

    return new Response(
      JSON.stringify({ success: true, imageUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-category-image:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
