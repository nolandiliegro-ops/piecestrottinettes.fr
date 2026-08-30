// =====================================================================
// backfill-compatible-parts-count
// =====================================================================
// One-shot maintenance Edge Function : recalcule la colonne cachée
// scooter_models.compatible_parts_count sur la règle AFFICHABLE du LOT 3
// (✅ verified + 🟡 unverified — le même chiffre que la fiche trotte et le
// compteur Header) :
//   COUNT(DISTINCT part_id) dans part_compatibility
//   WHERE parts.published = true
//     AND ( confidence_level IN ('validated', 'high')
//        OR (confidence_level = 'medium' AND suggestion_reason LIKE 'fitment:partial%') )
// Règle DUPLIQUÉE de src/lib/compatibilityStatus.ts (classifyCompat) — SOURCE
// UNIQUE côté front, non importable depuis une EF Deno : toute évolution de la
// classification se fait LÀ-BAS d'abord, puis se recopie ici.
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
  confidence_level: string;
  suggestion_reason: string | null;
}

// Copie de la branche "affichable" de classifyCompat (src/lib/compatibilityStatus.ts,
// source unique) : verified ∪ unverified, c.-à-d. validated, high, ou medium
// avec raison fitment:partial. Tenir en phase avec le front.
function isDisplayable(row: CompatRow): boolean {
  if (row.confidence_level === "validated" || row.confidence_level === "high") {
    return true;
  }
  return (
    row.confidence_level === "medium" &&
    (row.suggestion_reason ?? "").startsWith("fitment:partial")
  );
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
      // Fetch toutes les rows part_compatibility joined sur parts.published=true,
      // élargi à medium PUIS filtré par isDisplayable (règle affichable LOT 3).
      const { data: compatRows, error: compatErr } = await supabase
        .from("part_compatibility")
        .select("part_id, confidence_level, suggestion_reason, parts!inner(id, published)")
        .eq("scooter_model_id", sm.id)
        .eq("parts.published", true)
        .in("confidence_level", ["validated", "high", "medium"]);

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
        (compatRows as CompatRow[] | null || [])
          .filter(isDisplayable)
          .map((r) => r.part_id),
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
