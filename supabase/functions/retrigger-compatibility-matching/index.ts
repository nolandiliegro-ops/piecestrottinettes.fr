// =====================================================================
// retrigger-compatibility-matching
// =====================================================================
// Re-applique le matching de compatibilité (Passe A specs + Passe B IA)
// sur des pièces déjà existantes en base, SANS toucher aux compatibilités
// confidence_level='validated' (sacrées : validation manuelle admin).
//
// Body (un seul mode obligatoire) :
//   { "part_ids": ["uuid1", ...] }
//   { "skus":     ["CA-24", ...] }
//   { "all_unmatched": true }   // toutes les pièces sans aucune compat
//
// Auth : header x-admin-secret = ADMIN_BULK_SECRET

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  suggestCompatibilities,
  resolveCompatibilityHints,
  corsHeaders,
} from "../_shared/compatibility-helpers.ts";
import {
  suggestCompatibilitiesAI,
  extractHintsFromTechnicalMetadata,
} from "../_shared/ai_matcher.ts";

interface PartTarget {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  description: string | null;
  technical_metadata: Record<string, unknown> | null;
  category: { name: string } | { name: string }[] | null;
}

interface PartResult {
  part_id: string;
  part_name: string;
  validated_kept: number;
  auto_removed: number;
  passe_A_added: number;
  passe_B_added: number;
  ai_status: string;
}

interface ResolvedTargets {
  parts: PartTarget[];
  warnings: string[];
}

async function resolveTargets(
  supabase: SupabaseClient,
  body: { part_ids?: string[]; skus?: string[]; all_unmatched?: boolean },
): Promise<ResolvedTargets> {
  const warnings: string[] = [];

  if (body.part_ids && body.part_ids.length > 0) {
    const { data, error } = await supabase
      .from("parts")
      .select("id, name, slug, sku, description, technical_metadata, category:categories(name)")
      .in("id", body.part_ids);
    if (error) throw new Error(`fetch by ids: ${error.message}`);
    const found = new Set((data ?? []).map((p) => p.id));
    for (const id of body.part_ids) {
      if (!found.has(id)) warnings.push(`part_id ${id} not found`);
    }
    return { parts: (data ?? []) as PartTarget[], warnings };
  }

  if (body.skus && body.skus.length > 0) {
    const { data, error } = await supabase
      .from("parts")
      .select("id, name, slug, sku, description, technical_metadata, category:categories(name)")
      .in("sku", body.skus);
    if (error) throw new Error(`fetch by skus: ${error.message}`);
    const found = new Set((data ?? []).map((p) => p.sku));
    for (const sku of body.skus) {
      if (!found.has(sku)) warnings.push(`SKU ${sku} not found`);
    }
    return { parts: (data ?? []) as PartTarget[], warnings };
  }

  if (body.all_unmatched) {
    // Pièces sans aucune ligne dans part_compatibility
    const { data: allParts, error: pErr } = await supabase
      .from("parts")
      .select("id, name, slug, sku, description, technical_metadata, category:categories(name)");
    if (pErr) throw new Error(`fetch all parts: ${pErr.message}`);

    const { data: compats, error: cErr } = await supabase
      .from("part_compatibility")
      .select("part_id");
    if (cErr) throw new Error(`fetch compats: ${cErr.message}`);

    const linked = new Set((compats ?? []).map((c) => c.part_id as string));
    const unmatched = (allParts ?? []).filter((p) => !linked.has(p.id));
    return { parts: unmatched as PartTarget[], warnings };
  }

  return { parts: [], warnings: ["no target selector provided"] };
}

async function processOnePart(
  supabase: SupabaseClient,
  part: PartTarget,
  anthropicKey: string | undefined,
): Promise<PartResult> {
  // 1. SELECT compats existantes
  const { data: existing, error: exErr } = await supabase
    .from("part_compatibility")
    .select("id, scooter_model_id, auto_suggested, confidence_level")
    .eq("part_id", part.id);

  if (exErr) {
    console.error(`[retrigger-compat] fetch existing ${part.name}:`, exErr.message);
  }

  const validatedScooterIds = new Set<string>();
  const autoRowIds: string[] = [];
  for (const c of existing ?? []) {
    if (c.confidence_level === "validated") {
      validatedScooterIds.add(c.scooter_model_id as string);
    } else if (c.auto_suggested === true) {
      autoRowIds.push(c.id as string);
    }
  }

  // 2. DELETE des suggestions auto non-validées (remise à plat)
  let autoRemoved = 0;
  if (autoRowIds.length > 0) {
    const { error: delErr, count } = await supabase
      .from("part_compatibility")
      .delete({ count: "exact" })
      .in("id", autoRowIds);
    if (delErr) {
      console.error(`[retrigger-compat] delete auto ${part.name}:`, delErr.message);
    } else {
      autoRemoved = count ?? autoRowIds.length;
    }
  }

  // 3. Reconstruire les hints (technical_metadata d'abord, fallback regex via resolveCompatibilityHints)
  const metaHints = extractHintsFromTechnicalMetadata(part.technical_metadata);
  let hints: { tire_size: string | null; voltage: number | null } | null = null;
  if (metaHints.tire_size || metaHints.voltage != null) {
    hints = metaHints;
  } else {
    hints = resolveCompatibilityHints({
      name: part.name,
      slug: part.slug,
      description: part.description ?? undefined,
      technical_metadata: part.technical_metadata ?? undefined,
    });
  }

  // 4. Passe A
  let passACount = 0;
  let passAScooterIds = new Set<string>();
  if (hints) {
    try {
      const passA = await suggestCompatibilities(
        supabase,
        part.id,
        hints,
        validatedScooterIds, // exclude validated
      );
      passACount = passA.count;
      passAScooterIds = passA.scooterIds;
    } catch (e) {
      console.error(`[retrigger-compat] Passe A exception ${part.name}:`, e);
    }
  }

  // 5. Passe B (toujours, même si Passe A a skippé)
  let passBCount = 0;
  let aiStatus = "skipped";
  if (anthropicKey) {
    try {
      const exclude = new Set([...validatedScooterIds, ...passAScooterIds]);
      const categoryName = Array.isArray(part.category)
        ? part.category[0]?.name ?? null
        : part.category?.name ?? null;
      const passB = await suggestCompatibilitiesAI(
        supabase,
        part.id,
        {
          name: part.name,
          description: part.description,
          technical_metadata: part.technical_metadata,
          category: categoryName,
        },
        exclude,
        anthropicKey,
      );
      passBCount = passB.count;
      aiStatus = passB.status;
    } catch (e) {
      console.error(`[retrigger-compat] Passe B exception ${part.name}:`, e);
      aiStatus = "error";
    }
  }

  console.log(
    `[retrigger-compat] PIECE "${part.name}" ` +
    `validated_kept=${validatedScooterIds.size} auto_removed=${autoRemoved} ` +
    `passe_A=${passACount} passe_B=${passBCount} total=${passACount + passBCount}`,
  );

  return {
    part_id: part.id,
    part_name: part.name,
    validated_kept: validatedScooterIds.size,
    auto_removed: autoRemoved,
    passe_A_added: passACount,
    passe_B_added: passBCount,
    ai_status: aiStatus,
  };
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
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let body: { part_ids?: string[]; skus?: string[]; all_unmatched?: boolean };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const hasIds = Array.isArray(body.part_ids) && body.part_ids.length > 0;
    const hasSkus = Array.isArray(body.skus) && body.skus.length > 0;
    if (!hasIds && !hasSkus && body.all_unmatched !== true) {
      return new Response(
        JSON.stringify({ error: "part_ids, skus or all_unmatched=true required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { parts, warnings } = await resolveTargets(supabase, body);
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      console.warn("[retrigger-compat] ANTHROPIC_API_KEY absente — Passe B IA désactivée");
    }

    const results: PartResult[] = [];
    for (const part of parts) {
      try {
        const r = await processOnePart(supabase, part, anthropicKey);
        results.push(r);
      } catch (e) {
        console.error(`[retrigger-compat] processOnePart exception ${part.name}:`, e);
        results.push({
          part_id: part.id,
          part_name: part.name,
          validated_kept: 0,
          auto_removed: 0,
          passe_A_added: 0,
          passe_B_added: 0,
          ai_status: "error",
        });
      }
    }

    const total_new_suggestions = results.reduce((s, r) => s + r.passe_A_added + r.passe_B_added, 0);
    const total_ai_calls = results.filter((r) => r.ai_status === "ok" || r.ai_status === "error").length;

    return new Response(
      JSON.stringify({
        success: true,
        total_pieces_processed: results.length,
        processed: results.length,
        remaining: 0,
        total_new_suggestions,
        total_ai_calls,
        warnings,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[retrigger-compat] Internal error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
