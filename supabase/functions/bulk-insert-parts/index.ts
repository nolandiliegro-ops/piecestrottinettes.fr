import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

const ALLOWED_SUPPLIERS = [
  "wattiz", "ewheel", "voltcorp", "bluewaycorp",
  "dualtronstore", "weebot", "autre",
] as const;
type SupplierName = typeof ALLOWED_SUPPLIERS[number];

interface SupplierInput {
  name: SupplierName;
  sku?: string;
  url?: string;
  buy_price_ht?: number;
  stock_supplier?: number;
  shipping_time_days?: number;
  notes?: string;
}

interface CompatibilityHints {
  tire_size?: string | null;
  voltage?: number | null;
}

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
  supplier?: SupplierInput;
  compatibility_hints?: CompatibilityHints;
}

interface RequestBody {
  categoryName: string;
  categorySlug?: string;
  parts: PartInput[];
}

interface Results {
  inserted: number;
  updated: number;
  suppliers_added: number;
  compatibilities_suggested: number;
  errors: { name: string; error: string }[];
}

// =====================================================================
// PURE HELPERS — exportés pour les tests
// =====================================================================

/**
 * Extrait la dimension de pneu (en pouces) du nom d'une pièce.
 * "Pneu 10x2.50" → "10" ; "Chargeur 100V" → null.
 */
export function extractTireSizeFromName(name: string): string | null {
  const match = name.match(/(\d{1,2}(?:\.\d{1,2})?)\s*[x×]\s*\d/i);
  return match ? match[1] : null;
}

/**
 * Extrait un voltage du nom d'une pièce.
 * "Chargeur 52V 2A" → 52 ; "Pneu 10x2.50" → null ; "12V" → null (hors plage).
 */
export function extractVoltageFromName(name: string): number | null {
  const match = name.match(/(\d{2,3})\s*(?:V|volts?)\b/i);
  if (!match) return null;
  const v = parseInt(match[1], 10);
  if (v < 24 || v > 144) return null;
  return v;
}

/**
 * Construit une regex POSIX qui matche la taille de pneu comme nombre complet.
 * "10" matche "10x", "10 pouces" mais PAS "100".
 */
export function buildTireSizeRegex(size: string): string {
  const esc = size.replace(/\./g, "\\.");
  return `(^|[^0-9])${esc}([^0-9.]|$)`;
}

/**
 * Décide les hints de compat à utiliser : explicit > fallback regex > null.
 */
export function resolveCompatibilityHints(
  part: PartInput,
): CompatibilityHints | null {
  const explicit = part.compatibility_hints;
  const hasExplicitTire = explicit?.tire_size != null && explicit.tire_size !== "";
  const hasExplicitVoltage = explicit?.voltage != null;

  if (hasExplicitTire || hasExplicitVoltage) {
    return {
      tire_size: hasExplicitTire ? String(explicit!.tire_size) : null,
      voltage: hasExplicitVoltage ? Number(explicit!.voltage) : null,
    };
  }

  const tire = extractTireSizeFromName(part.name);
  const volt = extractVoltageFromName(part.name);
  if (tire == null && volt == null) return null;
  return { tire_size: tire, voltage: volt };
}

// =====================================================================
// ÉTAPES MÉTIER
// =====================================================================

async function upsertSupplier(
  supabase: SupabaseClient,
  partId: string,
  supplier: SupplierInput,
): Promise<boolean> {
  if (!ALLOWED_SUPPLIERS.includes(supplier.name)) {
    console.warn(`[bulk-insert-parts] Supplier ignoré (whitelist) : ${supplier.name}`);
    return false;
  }

  const { count, error: countErr } = await supabase
    .from("part_suppliers")
    .select("id", { count: "exact", head: true })
    .eq("part_id", partId);

  if (countErr) {
    console.error(`[bulk-insert-parts] Erreur count suppliers ${partId}:`, countErr.message);
    return false;
  }

  const { data: existing } = await supabase
    .from("part_suppliers")
    .select("id, is_primary")
    .eq("part_id", partId)
    .eq("supplier_name", supplier.name)
    .maybeSingle();

  const shouldBePrimary = (count ?? 0) === 0;

  const row = {
    part_id: partId,
    supplier_name: supplier.name,
    supplier_sku: supplier.sku ?? null,
    supplier_url: supplier.url ?? null,
    buy_price_ht: supplier.buy_price_ht ?? null,
    stock_supplier: supplier.stock_supplier ?? null,
    shipping_time_days: supplier.shipping_time_days ?? 2,
    is_primary: existing ? existing.is_primary : shouldBePrimary,
    notes: supplier.notes ?? null,
  };

  const { error: upsertErr } = await supabase
    .from("part_suppliers")
    .upsert(row, { onConflict: "part_id,supplier_name" });

  if (upsertErr) {
    console.error(`[bulk-insert-parts] Erreur upsert supplier ${partId}/${supplier.name}:`, upsertErr.message);
    return false;
  }
  return true;
}

async function suggestCompatibilities(
  supabase: SupabaseClient,
  partId: string,
  hints: CompatibilityHints,
): Promise<number> {
  const tire = hints.tire_size;
  const voltage = hints.voltage;
  let candidateIds = new Set<string>();
  let initialized = false;

  if (tire) {
    const regex = buildTireSizeRegex(tire);
    const { data, error } = await supabase
      .from("scooter_models")
      .select("id")
      .eq("published", true)
      .filter("tire_size", "~*", regex);
    if (error) {
      console.error(`[bulk-insert-parts] Erreur match tire_size:`, error.message);
    } else {
      for (const r of data ?? []) candidateIds.add(r.id as string);
      initialized = true;
    }
  }

  if (voltage != null) {
    const { data, error } = await supabase
      .from("scooter_models")
      .select("id")
      .eq("published", true)
      .eq("voltage", voltage);
    if (error) {
      console.error(`[bulk-insert-parts] Erreur match voltage:`, error.message);
    } else {
      const voltSet = new Set((data ?? []).map((r) => r.id as string));
      if (initialized) {
        // intersection
        candidateIds = new Set([...candidateIds].filter((id) => voltSet.has(id)));
      } else {
        candidateIds = voltSet;
      }
    }
  }

  if (candidateIds.size === 0) return 0;

  const rows = Array.from(candidateIds).map((scooterId) => ({
    part_id: partId,
    scooter_model_id: scooterId,
    auto_suggested: true,
  }));

  const { error: insertErr } = await supabase
    .from("part_compatibility")
    .insert(rows);

  if (insertErr) {
    console.error(`[bulk-insert-parts] Erreur insert compatibilities ${partId}:`, insertErr.message);
    return 0;
  }
  return rows.length;
}

// =====================================================================
// HANDLER
// =====================================================================

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
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body: RequestBody = await req.json();
    const { categoryName, categorySlug, parts } = body;

    if (!categoryName || !Array.isArray(parts) || parts.length === 0) {
      return new Response(
        JSON.stringify({ error: "categoryName (string) and parts (non-empty array) are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const slug = categorySlug ||
      categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const { data: category, error: catError } = await supabase
      .from("categories")
      .upsert({ name: categoryName, slug }, { onConflict: "slug" })
      .select("id")
      .single();

    if (catError || !category) {
      return new Response(
        JSON.stringify({ error: "Failed to upsert category", detail: catError?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const results: Results = {
      inserted: 0,
      updated: 0,
      suppliers_added: 0,
      compatibilities_suggested: 0,
      errors: [],
    };

    for (const part of parts) {
      try {
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

        const { data: existing } = await supabase
          .from("parts")
          .select("id")
          .eq("slug", part.slug)
          .maybeSingle();

        const wasNew = !existing;

        const { error: upsertError } = await supabase
          .from("parts")
          .upsert(row, { onConflict: "slug" });

        if (upsertError) {
          results.errors.push({ name: part.name, error: upsertError.message });
          continue;
        }

        const { data: partRow, error: selectErr } = await supabase
          .from("parts")
          .select("id")
          .eq("slug", part.slug)
          .maybeSingle();

        if (selectErr || !partRow) {
          results.errors.push({ name: part.name, error: "Could not retrieve part id post-upsert" });
          continue;
        }

        const partId = partRow.id as string;
        let suppliersAddedThis = 0;
        let suggestionsThis = 0;

        if (wasNew) results.inserted++;
        else results.updated++;

        if (part.supplier && part.supplier.name) {
          try {
            const ok = await upsertSupplier(supabase, partId, part.supplier);
            if (ok) {
              results.suppliers_added++;
              suppliersAddedThis = 1;
            }
          } catch (e) {
            console.error(`[bulk-insert-parts] supplier exception ${part.name}:`, e);
            results.errors.push({ name: part.name, error: `supplier: ${String(e)}` });
          }
        }

        // Suggestion compat UNIQUEMENT à la création
        if (wasNew) {
          const { count } = await supabase
            .from("part_compatibility")
            .select("id", { count: "exact", head: true })
            .eq("part_id", partId);

          if ((count ?? 0) === 0) {
            const hints = resolveCompatibilityHints(part);
            if (hints) {
              try {
                const n = await suggestCompatibilities(supabase, partId, hints);
                suggestionsThis = n;
                results.compatibilities_suggested += n;
              } catch (e) {
                console.error(`[bulk-insert-parts] suggestion exception ${part.name}:`, e);
                results.errors.push({ name: part.name, error: `compat: ${String(e)}` });
              }
            }
          }
        }

        console.log(
          `[bulk-insert-parts] ${wasNew ? "CREATED" : "UPDATED"} "${part.name}" — ` +
          `suppliers_added=${suppliersAddedThis} compatibilities_suggested=${suggestionsThis}`,
        );
      } catch (loopErr) {
        console.error(`[bulk-insert-parts] Exception part loop:`, loopErr);
        results.errors.push({ name: part.name || "unknown", error: String(loopErr) });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        category: { id: category.id, name: categoryName, slug },
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[bulk-insert-parts] Internal error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
