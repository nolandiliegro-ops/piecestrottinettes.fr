import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

interface ScooterInput {
  name?: string; // requis à l'INSERT uniquement (update partiel par slug possible sans name)
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
  // Clés de montage frein (contrat d'import — étape 2). Entiers nus, mêmes
  // unités que scooter_models.disc_*_code : Ø mm / entraxe mm / nb trous.
  disc_diameter?: number;
  disc_pcd?: number;
  disc_holes?: number;
}

interface BrandInput {
  tagline?: string;
  description?: string;
  editorial_verdict?: string;
  editorial_summary?: string;
  country?: string;
  founded_year?: number;
  accent_color?: string;
  logo_url?: string;
  hero_image_url?: string;
  website_url?: string;
  youtube_video_id?: string;
  display_order?: number;
  published?: boolean;
}

interface RequestBody {
  brandName: string;
  brandSlug?: string;
  brandLogoUrl?: string;
  brand?: BrandInput;
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
    const { brandName, brandSlug, brandLogoUrl, brand: brandInput, scooters } = body;

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

    // Base obligatoire : name + slug uniquement.
    const brandUpsert: Record<string, unknown> = { name: brandName, slug };

    // Habillage optionnel : on ne fusionne QUE les clés fournies (≠ undefined ET ≠ null),
    // pour ne JAMAIS écraser une valeur posée à la main par un null (override-safe).
    const b: BrandInput = brandInput ?? {};
    const editableBrandKeys = [
      "tagline", "description", "editorial_verdict", "editorial_summary",
      "country", "founded_year", "accent_color", "hero_image_url",
      "website_url", "youtube_video_id", "display_order",
    ] as const;
    for (const key of editableBrandKeys) {
      const val = (b as Record<string, unknown>)[key];
      if (val !== undefined && val !== null) brandUpsert[key] = val;
    }

    // logo_url : priorité bloc brand > top-level brandLogoUrl. N'écrit JAMAIS null
    // (corrige le bug "logo_url: brandLogoUrl || null" qui écrasait à null en ré-import brut).
    const resolvedLogo = b.logo_url ?? brandLogoUrl;
    if (resolvedLogo != null) brandUpsert.logo_url = resolvedLogo;

    // published : posé UNIQUEMENT si fourni dans le bloc brand. Sinon non touché
    // (défaut DB false à la création, valeur existante préservée sinon).
    if (b.published !== undefined && b.published !== null) brandUpsert.published = b.published;

    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .upsert(brandUpsert, { onConflict: "slug" })
      .select("id")
      .single();

    if (brandError || !brand) {
      return new Response(
        JSON.stringify({ error: "Failed to upsert brand", detail: brandError?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Upsert scooter models
    const results = {
      inserted: 0,
      updated: 0,
      errors: [] as { name: string; error: string }[],
      rows: [] as { name: string; slug: string; id: string | null; status: "inserted" | "updated" | "skipped" | "error" }[],
    };

    for (const scooter of scooters) {
      if (!scooter.slug) {
        results.errors.push({ name: scooter.name || "unknown", error: "slug is required" });
        results.rows.push({
          name: scooter.name || "unknown",
          slug: "",
          id: null,
          status: "skipped",
        });
        continue;
      }

      // Clés de montage frein — guard-preserve (même motif que electrical_specs
      // dans bulk-insert-parts) : clé absente ou non entière → colonne
      // disc_*_code JAMAIS touchée (pas d'écrasement par NULL).
      const discPatch = {
        ...(Number.isInteger(scooter.disc_diameter) ? { disc_diameter_code: scooter.disc_diameter } : {}),
        ...(Number.isInteger(scooter.disc_pcd) ? { disc_pcd_code: scooter.disc_pcd } : {}),
        ...(Number.isInteger(scooter.disc_holes) ? { disc_holes_code: scooter.disc_holes } : {}),
      };

      // Lookup AVANT écriture : détermine inserted vs updated ET le chemin.
      const { data: existing } = await supabase
        .from("scooter_models")
        .select("id, name")
        .eq("slug", scooter.slug)
        .maybeSingle();

      if (existing) {
        // ── UPDATE PARTIEL : uniquement les clés fournies dans le payload. ──
        // Un payload minimal { slug, disc_* } ne touche QUE les colonnes
        // disc_*_code. published et brand_id ne sont JAMAIS inclus : le premier
        // est piloté dans l'admin, le second ne change pas via un ré-import
        // (l'ancien upsert re-draftait published:false et pouvait re-brander —
        // les deux étaient des écrasements silencieux).
        const partialRow: Record<string, unknown> = {
          ...(scooter.name !== undefined ? { name: scooter.name } : {}),
          ...(scooter.image_url !== undefined ? { image_url: scooter.image_url } : {}),
          ...(scooter.power_watts !== undefined ? { power_watts: scooter.power_watts } : {}),
          ...(scooter.range_km !== undefined ? { range_km: scooter.range_km } : {}),
          ...(scooter.max_speed_kmh !== undefined ? { max_speed_kmh: scooter.max_speed_kmh } : {}),
          ...(scooter.voltage !== undefined ? { voltage: scooter.voltage } : {}),
          ...(scooter.amperage !== undefined ? { amperage: scooter.amperage } : {}),
          ...(scooter.tire_size !== undefined ? { tire_size: scooter.tire_size } : {}),
          ...(scooter.year !== undefined ? { year: scooter.year } : {}),
          ...(scooter.description !== undefined ? { description: scooter.description } : {}),
          ...(scooter.meta_title !== undefined ? { meta_title: scooter.meta_title } : {}),
          ...(scooter.meta_description !== undefined ? { meta_description: scooter.meta_description } : {}),
          ...(scooter.search_terms !== undefined ? { search_terms: scooter.search_terms } : {}),
          ...(scooter.youtube_video_id !== undefined ? { youtube_video_id: scooter.youtube_video_id } : {}),
          ...(scooter.affiliate_link !== undefined ? { affiliate_link: scooter.affiliate_link } : {}),
          ...(scooter.technical_signature !== undefined ? { technical_signature: scooter.technical_signature } : {}),
          ...discPatch,
        };

        const displayName = scooter.name ?? (existing.name as string) ?? scooter.slug;

        // Payload sans aucune clé exploitable → no-op assumé (rien à écrire).
        if (Object.keys(partialRow).length === 0) {
          results.updated++;
          results.rows.push({ name: displayName, slug: scooter.slug, id: existing.id, status: "updated" });
          continue;
        }

        const { error: updateError } = await supabase
          .from("scooter_models")
          .update(partialRow)
          .eq("id", existing.id);

        if (updateError) {
          results.errors.push({ name: displayName, error: updateError.message });
          results.rows.push({ name: displayName, slug: scooter.slug, id: existing.id, status: "error" });
        } else {
          results.updated++;
          results.rows.push({ name: displayName, slug: scooter.slug, id: existing.id, status: "updated" });
        }
      } else {
        // ── INSERT : comportement historique conservé (défauts || null, draft). ──
        if (!scooter.name) {
          results.errors.push({ name: "unknown", error: `name is required to create a new scooter (slug=${scooter.slug})` });
          results.rows.push({ name: "unknown", slug: scooter.slug, id: null, status: "skipped" });
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
          published: false, // Bot imports always start as drafts
          ...discPatch,
        };

        const { data: insertedRow, error: insertError } = await supabase
          .from("scooter_models")
          .insert(row)
          .select("id")
          .single();

        if (insertError || !insertedRow) {
          results.errors.push({ name: scooter.name, error: insertError?.message || "insert returned no row" });
          results.rows.push({ name: scooter.name, slug: scooter.slug, id: null, status: "error" });
        } else {
          results.inserted++;
          results.rows.push({ name: scooter.name, slug: scooter.slug, id: insertedRow.id, status: "inserted" });
        }
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
