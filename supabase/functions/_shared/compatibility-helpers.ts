// =====================================================================
// _shared/compatibility-helpers.ts
// =====================================================================
// Helpers partagés entre les edge functions bulk-insert-parts et
// retrigger-compatibility-matching. Le cross-import direct entre 2 edge
// functions n'est pas supporté par le runtime Supabase ; toute logique
// commune (corsHeaders + types + Passe A regex specs) vit ici.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── CORS partagé ───────────────────────────────────────────────────────────

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

// ─── Types partagés ─────────────────────────────────────────────────────────

export interface CompatibilityHints {
  tire_size?: string | null;
  voltage?: number | null;
}

/** Forme minimale acceptée par resolveCompatibilityHints. */
export interface PartHintInput {
  name: string;
  slug?: string;
  description?: string;
  technical_metadata?: Record<string, unknown>;
  compatibility_hints?: CompatibilityHints;
}

export interface PassAOutcome {
  count: number;
  scooterIds: Set<string>;
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
  part: PartHintInput,
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
// PASSE A — matching specs (effet DB)
// =====================================================================

export async function suggestCompatibilities(
  supabase: SupabaseClient,
  partId: string,
  hints: CompatibilityHints,
  excludeScooterIds?: Set<string>,
): Promise<PassAOutcome> {
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
      console.error(`[compat-helpers] Erreur match tire_size:`, error.message);
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
      console.error(`[compat-helpers] Erreur match voltage:`, error.message);
    } else {
      const voltSet = new Set((data ?? []).map((r) => r.id as string));
      if (initialized) {
        candidateIds = new Set([...candidateIds].filter((id) => voltSet.has(id)));
      } else {
        candidateIds = voltSet;
      }
    }
  }

  // Exclusion (utile pour retrigger : ne pas re-créer les validated)
  if (excludeScooterIds && excludeScooterIds.size > 0) {
    candidateIds = new Set(
      [...candidateIds].filter((id) => !excludeScooterIds.has(id)),
    );
  }

  if (candidateIds.size === 0) {
    return { count: 0, scooterIds: new Set() };
  }

  // Confiance proportionnelle aux specs concordantes : les deux (tire ∩ voltage)
  // → high ; une seule des deux → medium. Plus de "high" systématique.
  const confidence = tire && voltage != null ? "high" : "medium";

  const rows = Array.from(candidateIds).map((scooterId) => ({
    part_id: partId,
    scooter_model_id: scooterId,
    auto_suggested: true,
    confidence_level: confidence,
    suggestion_reason: null as string | null,
  }));

  const { error: insertErr } = await supabase
    .from("part_compatibility")
    .upsert(rows, {
      onConflict: "part_id,scooter_model_id",
      ignoreDuplicates: true,
    });

  if (insertErr) {
    console.error(`[compat-helpers] Erreur insert compatibilities ${partId}:`, insertErr.message);
    return { count: 0, scooterIds: new Set() };
  }
  return { count: rows.length, scooterIds: candidateIds };
}
