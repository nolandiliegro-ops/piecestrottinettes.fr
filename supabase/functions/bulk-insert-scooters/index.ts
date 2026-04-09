import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

interface ScooterInput {
  name: string;
  slug: string;
  image_url?: string;
  power_watts?: number;
  range_km?: number;
  max_speed_kmh?: number;
  voltage?: number;
  amperage?: number;
  tire_size?: string;
  year?: number;
  description?: string;
  meta_title?: string;
  meta_description?: string;
  search_terms?: string;
  youtube_video_id?: string;
  affiliate_link?: string;
  technical_signature?: Record<string, unknown>;
}

interface RequestBody {
  brandName: string;
  brandSlug?: string;
  brandLogoUrl?: string;
  scooters: ScooterInput[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate admin secret
    const adminSecret = req.headers.get("x-admin-secret");
    const expectedSecret = Deno.env.get("ADMIN_BULK_SECRET");

    if (!expectedSecret || adminSecret !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse body
    const body: RequestBody = await req.json();
    const { brandName, brandSlug, brandLogoUrl, scooters } = body;

    if (!brandName || !Array.isArray(scooters) || scooters.length === 0) {
      return new Response(
        JSON.stringify({ error: "brandName (string) and scooters (non-empty array) are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create service_role client to bypass RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Upsert brand
    const slug = brandSlug || brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .upsert({ name: brandName, slug, logo_url: brandLogoUrl || null }, { onConflict: "slug" })
      .select("id")
      .single();

    if (brandError || !brand) {
      return new Response(
        JSON.stringify({ error: "Failed to upsert brand", detail: brandError?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Upsert scooter models
    const results = { inserted: 0, updated: 0, errors: [] as { name: string; error: string }[] };

    for (const scooter of scooters) {
      if (!scooter.name || !scooter.slug) {
        results.errors.push({ name: scooter.name || "unknown", error: "name and slug are required" });
        continue;
      }

      const row = {
        brand_id: brand.id,
        name: scooter.name,
        slug: scooter.slug,
        image_url: scooter.image_url || null,
        power_watts: scooter.power_watts || null,
        range_km: scooter.range_km || null,
        max_speed_kmh: scooter.max_speed_kmh || null,
        voltage: scooter.voltage || null,
        amperage: scooter.amperage || null,
        tire_size: scooter.tire_size || null,
        year: scooter.year || null,
        description: scooter.description || null,
        meta_title: scooter.meta_title || null,
        meta_description: scooter.meta_description || null,
        search_terms: scooter.search_terms || null,
        youtube_video_id: scooter.youtube_video_id || null,
        affiliate_link: scooter.affiliate_link || null,
        technical_signature: scooter.technical_signature || {},
      };

      // Check if exists
      const { data: existing } = await supabase
        .from("scooter_models")
        .select("id")
        .eq("slug", scooter.slug)
        .maybeSingle();

      const { error: upsertError } = await supabase
        .from("scooter_models")
        .upsert(row, { onConflict: "slug" });

      if (upsertError) {
        results.errors.push({ name: scooter.name, error: upsertError.message });
      } else if (existing) {
        results.updated++;
      } else {
        results.inserted++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        brand: { id: brand.id, name: brandName, slug },
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal error", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
