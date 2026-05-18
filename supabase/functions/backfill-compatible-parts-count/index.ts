// =====================================================================
// backfill-compatible-parts-count
// =====================================================================
// One-shot maintenance Edge Function : recalcule la colonne cachée
// scooter_models.compatible_parts_count à partir de la source de vérité
// "signal pur+sûr" (Option A+ pragmatique) :
//   COUNT(DISTINCT part_id) dans part_compatibility
//   WHERE parts.published = true
//     AND confidence_level IN ('validated', 'high')
// 'validated' = curation manuelle admin ; 'high' = IA très sûre / specs match.
// On exclut 'medium' et 'low' (suggestions douteuses) pour ne pas surcompter.
//
// La colonne cachée n'avait jamais été mise à jour depuis le seed initial
// de janvier 2026. Voir Notion roadmap pour la mise en place future de
// triggers Postgres (INSERT/DELETE sur part_compatibility + UPDATE sur
// parts.published) qui rendront ce backfill obsolète.
//
// Auth : header x-admin-secret = ADMIN_BULK_SECRET
//
// USAGE ONE-SHOT (à exécuter une fois après déploiement par Lovable) :
//   curl -X POST \
//     https://kqsxscjtlipregkrmucg.supabase.co/functions/v1/backfill-compatible-parts-count \
//     -H "x-admin-secret: $ADMIN_BULK_SECRET" \
//     -H "Content-Type: application/json"
//
// Après exécution réussie, cette fonction peut rester en place pour des
// re-backfills futurs (idempotent) ou être supprimée du repo si on bascule
// sur des triggers Postgres.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/compatibility-helpers.ts";

interface ScooterRow {
  id: string;
  slug: string;
  name: string;
  compatible_parts_count: number | null;
}

interface CompatRow {
  part_id: string;
}

interface BackfillResult {
  id: string;
  slug: string;
  name: string;
  old_count: number;
  new_count: number;
  diff: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ─── Auth ────────────────────────────────────────────────────────
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

    // ─── Client Supabase service role ───────────────────────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ─── 1) Liste tous les modèles ─────────────────────────────────
    const { data: scooters, error: scootersErr } = await supabase
      .from("scooter_models")
      .select("id, slug, name, compatible_parts_count")
      .order("name");

    if (scootersErr) {
      console.error("[backfill-compat] fetch scooters:", scootersErr.message);
      return new Response(
        JSON.stringify({ error: "Failed to list scooters", detail: scootersErr.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const scooterList = (scooters || []) as ScooterRow[];
    console.log(`[backfill-compat] start: ${scooterList.length} scooters to scan`);

    // ─── 2) Pour chaque scooter : recalcule + update si diff ───────
    const changed: BackfillResult[] = [];
    let totalCorrections = 0;
    const errors: { slug: string; error: string }[] = [];

    for (const sm of scooterList) {
      // Fetch toutes les rows part_compatibility joined sur parts.published=true
      const { data: compatRows, error: compatErr } = await supabase
        .from("part_compatibility")
        .select("part_id, parts!inner(id, published)")
        .eq("scooter_model_id", sm.id)
        .eq("parts.published", true)
        .in("confidence_level", ["validated", "high"]);

      if (compatErr) {
        console.error(
          `[backfill-compat] count error ${sm.slug}:`,
          compatErr.message,
        );
        errors.push({ slug: sm.slug, error: compatErr.message });
        continue;
      }

      // DISTINCT côté JS pour matcher COUNT(DISTINCT part_id) du SQL
      const uniquePartIds = new Set(
        (compatRows as CompatRow[] | null || []).map((r) => r.part_id),
      );
      const newCount = uniquePartIds.size;
      const oldCount = sm.compatible_parts_count ?? 0;

      if (newCount === oldCount) {
        continue;
      }

      const { error: updateErr } = await supabase
        .from("scooter_models")
        .update({ compatible_parts_count: newCount })
        .eq("id", sm.id);

      if (updateErr) {
        console.error(
          `[backfill-compat] update error ${sm.slug}:`,
          updateErr.message,
        );
        errors.push({ slug: sm.slug, error: updateErr.message });
        continue;
      }

      const diff = newCount - oldCount;
      totalCorrections += Math.abs(diff);
      changed.push({
        id: sm.id,
        slug: sm.slug,
        name: sm.name,
        old_count: oldCount,
        new_count: newCount,
        diff,
      });
      console.log(
        `[backfill-compat] ${sm.slug}: ${oldCount} → ${newCount} (${diff >= 0 ? "+" : ""}${diff})`,
      );
    }

    console.log(
      `[backfill-compat] done: ${changed.length}/${scooterList.length} scooters updated, total_corrections=${totalCorrections}`,
    );

    return new Response(
      JSON.stringify({
        success: true,
        scooters_total: scooterList.length,
        scooters_updated: changed.length,
        total_corrections: totalCorrections,
        before_after: changed,
        errors,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("[backfill-compat] Internal error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", detail: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
