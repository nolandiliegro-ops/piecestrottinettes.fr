// =====================================================================
// audit-compat-counts
// =====================================================================
// Edge Function LECTURE SEULE : audit complet des compteurs de pièces
// compatibles par scooter. Aucune modification BDD.
//
// Comparaison 4 sources :
//   - cached_value           = scooter_models.compatible_parts_count (stale)
//   - total_rows_compat      = toutes les rows part_compatibility
//   - validated_rows         = rows confidence_level='validated'
//   - auto_suggested_rows    = rows auto_suggested=true
//   - public_currently_displayed = COUNT DISTINCT part_id JOIN parts published=true
//                                  (= comportement après patch précédent useCompatiblePartsCount)
//   - public_after_fix       = idem + filtre confidence_level='validated'
//                              (= cible Option A : signal pur)
//
// Auth : header x-admin-secret = ADMIN_BULK_SECRET
//
// USAGE :
//   curl -X POST \
//     https://kqsxscjtlipregkrmucg.supabase.co/functions/v1/audit-compat-counts \
//     -H "x-admin-secret: $ADMIN_BULK_SECRET" \
//     -H "Content-Type: application/json"

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/compatibility-helpers.ts";

interface ScooterRow {
  id: string;
  slug: string;
  name: string;
  compatible_parts_count: number | null;
}

interface CompatJoinRow {
  scooter_model_id: string;
  part_id: string;
  auto_suggested: boolean;
  confidence_level: string;
  parts: { id: string; published: boolean } | { id: string; published: boolean }[] | null;
}

interface ScooterAudit {
  id: string;
  slug: string;
  name: string;
  cached_value: number;
  total_rows_compat: number;
  validated_rows: number;
  auto_suggested_rows: number;
  pending_high: number;
  pending_medium: number;
  pending_low: number;
  orphan_or_unpublished_rows: number;
  public_currently_displayed: number;
  public_after_fix: number;
  diff_current_vs_after: number;
  diff_cached_vs_after: number;
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
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ─── 1) Liste tous les scooters ─────────────────────────────────
    const { data: scooters, error: scootersErr } = await supabase
      .from("scooter_models")
      .select("id, slug, name, compatible_parts_count")
      .order("name");

    if (scootersErr) {
      console.error("[audit-compat] fetch scooters:", scootersErr.message);
      return new Response(
        JSON.stringify({ error: "Failed to list scooters", detail: scootersErr.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    const scooterList = (scooters || []) as ScooterRow[];

    // ─── 2) Toutes les rows part_compatibility + parts.published ────
    // Service role bypass RLS → on voit aussi les rows pointant vers
    // des parts non publiées (utile pour l'audit).
    const { data: compatRows, error: compatErr } = await supabase
      .from("part_compatibility")
      .select(
        "scooter_model_id, part_id, auto_suggested, confidence_level, parts(id, published)",
      );

    if (compatErr) {
      console.error("[audit-compat] fetch compat:", compatErr.message);
      return new Response(
        JSON.stringify({ error: "Failed to fetch compat rows", detail: compatErr.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const allCompat = (compatRows || []) as CompatJoinRow[];
    console.log(
      `[audit-compat] start: ${scooterList.length} scooters, ${allCompat.length} compat rows`,
    );

    // ─── 3) Aggregate par scooter ───────────────────────────────────
    interface Acc {
      total: number;
      validated: number;
      autoSuggested: number;
      pendingHigh: number;
      pendingMedium: number;
      pendingLow: number;
      orphan: number;
      publicCurrent: Set<string>;
      publicAfter: Set<string>;
    }
    const byScooter = new Map<string, Acc>();
    const ensure = (sid: string): Acc => {
      let acc = byScooter.get(sid);
      if (!acc) {
        acc = {
          total: 0,
          validated: 0,
          autoSuggested: 0,
          pendingHigh: 0,
          pendingMedium: 0,
          pendingLow: 0,
          orphan: 0,
          publicCurrent: new Set<string>(),
          publicAfter: new Set<string>(),
        };
        byScooter.set(sid, acc);
      }
      return acc;
    };

    for (const row of allCompat) {
      const acc = ensure(row.scooter_model_id);
      acc.total++;
      if (row.confidence_level === "validated") acc.validated++;
      if (row.auto_suggested === true) {
        acc.autoSuggested++;
        if (row.confidence_level === "high") acc.pendingHigh++;
        else if (row.confidence_level === "medium") acc.pendingMedium++;
        else if (row.confidence_level === "low") acc.pendingLow++;
      }

      // Resolve parts (PostgREST can return single object or array)
      const partsRel = row.parts;
      let published: boolean | null = null;
      if (partsRel) {
        if (Array.isArray(partsRel)) {
          published = partsRel.length > 0 ? !!partsRel[0].published : null;
        } else if (typeof partsRel === "object") {
          published = !!(partsRel as { published?: boolean }).published;
        }
      }

      if (published === true) {
        acc.publicCurrent.add(row.part_id);
        if (row.confidence_level === "validated") {
          acc.publicAfter.add(row.part_id);
        }
      } else {
        acc.orphan++;
      }
    }

    // ─── 4) Build per-scooter result ────────────────────────────────
    const results: ScooterAudit[] = scooterList.map((sm) => {
      const acc = byScooter.get(sm.id) || {
        total: 0,
        validated: 0,
        autoSuggested: 0,
        pendingHigh: 0,
        pendingMedium: 0,
        pendingLow: 0,
        orphan: 0,
        publicCurrent: new Set<string>(),
        publicAfter: new Set<string>(),
      };
      const cached = sm.compatible_parts_count ?? 0;
      const publicCurrent = acc.publicCurrent.size;
      const publicAfter = acc.publicAfter.size;
      return {
        id: sm.id,
        slug: sm.slug,
        name: sm.name,
        cached_value: cached,
        total_rows_compat: acc.total,
        validated_rows: acc.validated,
        auto_suggested_rows: acc.autoSuggested,
        pending_high: acc.pendingHigh,
        pending_medium: acc.pendingMedium,
        pending_low: acc.pendingLow,
        orphan_or_unpublished_rows: acc.orphan,
        public_currently_displayed: publicCurrent,
        public_after_fix: publicAfter,
        diff_current_vs_after: publicAfter - publicCurrent,
        diff_cached_vs_after: publicAfter - cached,
      };
    });

    // ─── 5) Global aggregates ───────────────────────────────────────
    const totals = {
      scooters_total: scooterList.length,
      rows_total: allCompat.length,
      rows_validated: 0,
      rows_auto_suggested: 0,
      rows_pending_high: 0,
      rows_pending_medium: 0,
      rows_pending_low: 0,
      rows_orphan_or_unpublished: 0,
      sum_public_currently_displayed: 0,
      sum_public_after_fix: 0,
      sum_cached_values: 0,
      scooters_that_lose_parts: 0,
      scooters_that_become_zero: 0,
    };
    for (const r of results) {
      totals.rows_validated += r.validated_rows;
      totals.rows_auto_suggested += r.auto_suggested_rows;
      totals.rows_pending_high += r.pending_high;
      totals.rows_pending_medium += r.pending_medium;
      totals.rows_pending_low += r.pending_low;
      totals.rows_orphan_or_unpublished += r.orphan_or_unpublished_rows;
      totals.sum_public_currently_displayed += r.public_currently_displayed;
      totals.sum_public_after_fix += r.public_after_fix;
      totals.sum_cached_values += r.cached_value;
      if (r.public_after_fix < r.public_currently_displayed) {
        totals.scooters_that_lose_parts++;
      }
      if (r.public_after_fix === 0 && r.public_currently_displayed > 0) {
        totals.scooters_that_become_zero++;
      }
    }

    console.log(
      `[audit-compat] done: ${results.length} scooters, ` +
        `${totals.rows_total} compat rows total, ` +
        `${totals.rows_validated} validated, ` +
        `${totals.rows_auto_suggested} auto-suggested (pending review)`,
    );

    return new Response(
      JSON.stringify(
        {
          success: true,
          totals,
          scooters: results,
        },
        null,
        2,
      ),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("[audit-compat] Internal error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", detail: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
