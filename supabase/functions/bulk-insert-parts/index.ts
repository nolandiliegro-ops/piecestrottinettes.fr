import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  suggestCompatibilities,
  resolveCompatibilityHints,
  type CompatibilityHints,
} from "../_shared/compatibility-helpers.ts";
import { suggestCompatibilitiesAI } from "../_shared/ai_matcher.ts";

// Re-exports pour préserver la compat des consommateurs / tests historiques
// qui pouvaient importer depuis ce fichier.
export {
  corsHeaders,
  extractTireSizeFromName,
  extractVoltageFromName,
  buildTireSizeRegex,
  resolveCompatibilityHints,
  suggestCompatibilities,
} from "../_shared/compatibility-helpers.ts";
export type { CompatibilityHints, PassAOutcome } from "../_shared/compatibility-helpers.ts";

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
  skip_ai?: boolean;
}

interface Results {
  inserted: number;
  updated: number;
  suppliers_added: number;
  compatibilities_suggested: number;
  compatibilities_suggested_ai: number;
  ai_calls: number;
  errors: { name: string; error: string }[];
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
    const skip_ai = body.skip_ai === true;

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
      compatibilities_suggested_ai: 0,
      ai_calls: 0,
      errors: [],
    };

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      console.warn("[bulk-insert-parts] ANTHROPIC_API_KEY absente — Passe B IA désactivée");
    }

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
        let passACount = 0;
        let passBCount = 0;
        let aiDurationMs = 0;
        let aiStatus = "skipped";

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

        // Suggestions compat UNIQUEMENT à la création
        if (wasNew) {
          const { count } = await supabase
            .from("part_compatibility")
            .select("id", { count: "exact", head: true })
            .eq("part_id", partId);

          if ((count ?? 0) === 0) {
            // Passe A — regex specs
            const hints = resolveCompatibilityHints(part);
            let passAScooterIds = new Set<string>();
            if (hints) {
              try {
                const passA = await suggestCompatibilities(supabase, partId, hints);
                passACount = passA.count;
                passAScooterIds = passA.scooterIds;
                results.compatibilities_suggested += passA.count;
              } catch (e) {
                console.error(`[bulk-insert-parts] suggestion A exception ${part.name}:`, e);
                results.errors.push({ name: part.name, error: `compat A: ${String(e)}` });
              }
            }

            // Passe B — IA Claude (jamais bloquante)
            if (!skip_ai && anthropicKey) {
              try {
                const passB = await suggestCompatibilitiesAI(
                  supabase,
                  partId,
                  {
                    name: part.name,
                    description: part.description ?? null,
                    technical_metadata: part.technical_metadata ?? null,
                  },
                  passAScooterIds,
                  anthropicKey,
                );
                passBCount = passB.count;
                aiDurationMs = passB.durationMs;
                aiStatus = passB.status;
                results.compatibilities_suggested_ai += passB.count;
                results.ai_calls += 1;
              } catch (e) {
                console.error(`[bulk-insert-parts] AI matcher exception ${part.name}:`, e);
                aiStatus = "error";
              }
            } else if (skip_ai) {
              console.log(`[bulk-insert-parts] skip_ai=true → Passe B IA désactivée pour ${part.name}`);
              aiStatus = "skipped_by_flag";
            }
          }
        }

        console.log(
          `[bulk-insert-parts] PIECE "${part.name}" ` +
          `${wasNew ? "CREATED" : "UPDATED"} ` +
          `suppliers_added=${suppliersAddedThis} ` +
          `passe_A_matched=${passACount} passe_B_matched=${passBCount} ` +
          `total_unique=${passACount + passBCount} ` +
          `api_call_time_ms=${aiDurationMs} ai_status=${aiStatus}`,
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
