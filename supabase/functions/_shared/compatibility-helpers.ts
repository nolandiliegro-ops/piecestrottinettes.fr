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
  /**
   * Voltages structurés autoritatifs issus de parts.electrical_specs.voltages.
   * Présent uniquement pour les pièces électriques taguées. Quand renseigné,
   * il court-circuite le voltage scalaire (regex/technical_metadata) et sera
   * matché par INTERSECTION contre scooter_battery_configs (B1.4b).
   */
  voltages?: number[] | null;
}

/** Forme minimale acceptée par resolveCompatibilityHints. */
export interface PartHintInput {
  name: string;
  slug?: string;
  description?: string;
  technical_metadata?: Record<string, unknown>;
  compatibility_hints?: CompatibilityHints;
  /**
   * Specs électriques structurées de la pièce (colonne parts.electrical_specs).
   * Le voltage nominal batterie y vit dans `voltages` (jamais la tension de
   * sortie charge). Le connecteur est ignoré en B1.4 (affinage → B1.6).
   */
  electrical_specs?: {
    voltages?: number[];
    connector?: string | null;
  } | null;
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
  // B1.4a — chemin électrique autoritatif. Si la pièce porte des voltages
  // structurés (electrical_specs.voltages non vide), on les prend tels quels
  // et on COURT-CIRCUITE extractVoltageFromName (le regex sur le nom, source
  // du bug "72V ➡️ 84V"). Le voltage scalaire legacy reste null pour cette pièce.
  const elecVoltages = part.electrical_specs?.voltages;
  const hasElectrical = Array.isArray(elecVoltages) && elecVoltages.length > 0;
  const electricalPatch = hasElectrical
    ? { voltages: elecVoltages!.map(Number) }
    : {};

  const explicit = part.compatibility_hints;
  const hasExplicitTire = explicit?.tire_size != null && explicit.tire_size !== "";
  const hasExplicitVoltage = explicit?.voltage != null;

  if (hasExplicitTire || hasExplicitVoltage) {
    return {
      tire_size: hasExplicitTire ? String(explicit!.tire_size) : null,
      voltage: hasExplicitVoltage ? Number(explicit!.voltage) : null,
      ...electricalPatch,
    };
  }

  const tire = extractTireSizeFromName(part.name);
  // Voltage regex ignoré dès qu'on a des voltages structurés.
  const volt = hasElectrical ? null : extractVoltageFromName(part.name);
  if (tire == null && volt == null && !hasElectrical) return null;
  return { tire_size: tire, voltage: volt, ...electricalPatch };
}

/**
 * B1.4b — INTERSECTION voltage électrique (logique pure, testable).
 * Prend les configs batterie déjà pré-filtrées par voltage (issues d'un
 * .in("voltage", voltages)) et l'ensemble des scooter_model_id publiés, et
 * retourne l'ensemble DÉDUPÉ des model_ids qui matchent ET sont publiés.
 * Un même modèle peut avoir plusieurs configs au bon voltage → dédup via Set.
 * Publication gérée en JS (pas d'embed !inner PostgREST — arbitrage B1.4).
 */
export function intersectPublishedConfigVoltages(
  configs: Array<{ scooter_model_id: string; voltage: number }>,
  publishedModelIds: Set<string>,
): Set<string> {
  const out = new Set<string>();
  for (const c of configs) {
    const id = c?.scooter_model_id;
    if (id && publishedModelIds.has(id)) out.add(id);
  }
  return out;
}

/**
 * B1.6 — Catégories dont les pièces sont ÉLECTRIQUES (fallback rétro-compat).
 * Slugs normalisés (lowercase). Depuis B3, le signal autoritaire est
 * categories.spec_type (cf. ELECTRICAL_SPEC_TYPES) ; ce slug ne sert plus que
 * de dernier recours et sera retiré quand spec_type sera fiable partout.
 */
export const ELECTRICAL_CATEGORY_SLUGS = ["chargeurs"];

/**
 * B3 — Types de specs (categories.spec_type) « électriques » : matchés par
 * INTERSECTION voltage (Passe A) et exclus de la Passe B IA.
 * charger / controller / battery UNIQUEMENT.
 * `display` est VOLONTAIREMENT exclu : un afficheur se matche au connecteur/
 * modèle, pas au voltage ; le mettre ici sur-matcherait toutes les trottinettes
 * du même voltage (bruit). Il reste `generic` → IA (sa règle connecteur = bloc
 * ultérieur). `tire` est géré à part par isTirePart (skip IA aussi).
 */
export const ELECTRICAL_SPEC_TYPES = ["charger", "controller", "battery"];

/**
 * B1.6/B3 — Prédicat PUR : la pièce est-elle électrique (→ intersection voltage
 * + skip Passe B IA) ? Ordre d'AUTORITÉ :
 *   1. specType ∈ ELECTRICAL_SPEC_TYPES (autoritaire — categories.spec_type)
 *   2. electrical_specs.voltages non vide (pièce taguée mais spec_type absent)
 *   3. categorySlug ∈ ELECTRICAL_CATEGORY_SLUGS (fallback rétro-compat ; égalité
 *      stricte normalisée, JAMAIS includes → "support-batterie" non capté)
 */
export function isElectricalPart(part: {
  specType?: string | null;
  categorySlug?: string | null;
  electrical_specs?: { voltages?: number[]; connector?: string | null } | null;
}): boolean {
  const specType = part.specType?.trim().toLowerCase();
  if (specType && ELECTRICAL_SPEC_TYPES.includes(specType)) return true;

  const voltages = part.electrical_specs?.voltages;
  if (Array.isArray(voltages) && voltages.length > 0) return true;

  const slug = part.categorySlug?.trim().toLowerCase();
  if (slug && ELECTRICAL_CATEGORY_SLUGS.includes(slug)) return true;

  return false;
}

/**
 * B3 — Prédicat PUR : la pièce est-elle un PNEU (→ règle tire_size seule en
 * Passe A + skip Passe B IA) ? Basé sur categories.spec_type='tire', fiable via
 * la migration 20260704030135. Pas de fallback slug volontairement (le matching
 * tire_size de la Passe A reste, lui, piloté par le nom).
 */
export function isTirePart(part: { specType?: string | null }): boolean {
  return part.specType?.trim().toLowerCase() === "tire";
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
  const voltages = hints.voltages;
  const hasElectrical = Array.isArray(voltages) && voltages.length > 0;
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
      // Fail-closed : une erreur ici laissait initialized=false → les branches
      // suivantes prenaient le set complet SANS filtre pneu (matching élargi
      // par une erreur transitoire). On abandonne la suggestion à la place.
      console.error(`[compat-helpers] Erreur match tire_size (fail-closed):`, error.message);
      return { count: 0, scooterIds: new Set() };
    }
    for (const r of data ?? []) candidateIds.add(r.id as string);
    initialized = true;
  }

  if (hasElectrical) {
    // ─── Chemin ÉLECTRIQUE (B1.4b) : intersection d'ensembles ────────────────
    // Une variante est compatible ssi son voltage ∈ electrical_specs.voltages.
    // On tape scooter_battery_configs (vraies variantes, dont bi-voltage), PAS
    // scooter_models.voltage (mono-valeur). Court-circuite la branche legacy.
    const [cfgRes, pubRes] = await Promise.all([
      supabase
        .from("scooter_battery_configs")
        .select("scooter_model_id, voltage")
        .in("voltage", voltages!),
      supabase
        .from("scooter_models")
        .select("id")
        .eq("published", true),
    ]);
    if (cfgRes.error || pubRes.error) {
      if (cfgRes.error) {
        console.error(`[compat-helpers] Erreur fetch battery_configs:`, cfgRes.error.message);
      }
      if (pubRes.error) {
        console.error(`[compat-helpers] Erreur fetch scooter_models publiés:`, pubRes.error.message);
      }
      // Fail-closed : en cas d'erreur, aucun candidat électrique n'est ajouté.
    } else {
      const publishedIds = new Set((pubRes.data ?? []).map((r) => r.id as string));
      const electricalSet = intersectPublishedConfigVoltages(
        (cfgRes.data ?? []) as Array<{ scooter_model_id: string; voltage: number }>,
        publishedIds,
      );
      if (initialized) {
        candidateIds = new Set([...candidateIds].filter((id) => electricalSet.has(id)));
      } else {
        candidateIds = electricalSet;
      }
    }
  } else if (voltage != null) {
    // ─── Chemin LEGACY scalaire (inchangé) : scooter_models.voltage ──────────
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

  // Confiance : match électrique par intersection voltage (structuré, autoritatif)
  // → "high" systématique (arbitrage B1.4). Sinon, chemin legacy : les deux specs
  // (tire ∩ voltage) → high ; une seule → medium.
  const confidence = hasElectrical
    ? "high"
    : tire && voltage != null
    ? "high"
    : "medium";

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
