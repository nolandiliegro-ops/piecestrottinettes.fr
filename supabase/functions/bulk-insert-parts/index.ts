import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

interface PartInput {
  name: string;
  slug: string;
  price?: number;
  image_url?: string;
  description?: string;
  stock_quantity?: number;
  difficulty_level?: number;
  sku?: string;
  meta_title?: string;
  meta_description?: string;
  youtube_video_id?: string;
  estimated_install_time_minutes?: number;
  required_tools?: string[];
  technical_metadata?: Record<string, unknown>;
  is_featured?: boolean;
}

interface RequestBody {
  categoryName: string;
  categorySlug?: string;
  parts: PartInput[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const adminSecret = req.headers.get("x-admin-secret");
    const expectedSecret = Deno.env.get("ADMIN_BULK_SECRET");

    if (!expectedSecret || adminSecret !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: RequestBody = await req.json();
    const { categoryName, categorySlug, parts } = body;

    if (!categoryName || !Array.isArray(parts) || parts.length === 0) {
      return new Response(
        JSON.stringify({ error: "categoryName (string) and parts (non-empty array) are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Upsert category
    const slug = categorySlug || categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { data: category, error: catError } = await supabase
      .from("categories")
      .upsert({ name: categoryName, slug }, { onConflict: "slug" })
      .select("id")
      .single();

    if (catError || !category) {
      return new Response(
        JSON.stringify({ error: "Failed to upsert category", detail: catError?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Upsert parts
    const results = { inserted: 0, updated: 0, errors: [] as { name: string; error: string }[] };

    for (const part of parts) {
      if (!part.name || !part.slug) {
        results.errors.push({ name: part.name || "unknown", error: "name and slug are required" });
        continue;
      }

      const row = {
        category_id: category.id,
        name: part.name,
        slug: part.slug,
        price: part.price ?? null,
        image_url: part.image_url || null,
        description: part.description || null,
        stock_quantity: part.stock_quantity ?? 0,
        difficulty_level: part.difficulty_level ?? null,
        sku: part.sku || null,
        meta_title: part.meta_title || null,
        meta_description: part.meta_description || null,
        youtube_video_id: part.youtube_video_id || null,
        estimated_install_time_minutes: part.estimated_install_time_minutes ?? null,
        required_tools: part.required_tools || null,
        technical_metadata: part.technical_metadata || {},
        is_featured: part.is_featured ?? false,
        published: false,
      };

      // Check if exists
      const { data: existing } = await supabase
        .from("parts")
        .select("id")
        .eq("slug", part.slug)
        .maybeSingle();

      const { error: upsertError } = await supabase
        .from("parts")
        .upsert(row, { onConflict: "slug" });

      if (upsertError) {
        results.errors.push({ name: part.name, error: upsertError.message });
      } else if (existing) {
        results.updated++;
      } else {
        results.inserted++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        category: { id: category.id, name: categoryName, slug },
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
