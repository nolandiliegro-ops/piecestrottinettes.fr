// =====================================================================
// _shared/fitment_matcher.ts — Moteur K : matching déterministe par clés
// =====================================================================
// Remplace les passes A (regex) et B (IA) pour les catégories de
// KEY_WIRED_CATEGORIES : la clé de montage est câblée des deux côtés
// (parts.fitment_specs / parts.electrical_specs côté pièce, colonnes
// fitment_* + scooter_battery_configs côté trottinette).
//
// Doctrine (arbitrages du 30/08) :
//   - lignes écrites : auto_suggested=true, JAMAIS 'validated' (admin seul
//     valide). Le DELETE du retrigger (auto=true non-validated) les couvre
//     nativement → idempotence sans étendre son scope.
//   - match complet → confidence 'high', suggestion_reason 'fitment:...'
//   - SEUL cas partiel : Ø jante matche mais une clé secondaire manque d'un
//     côté → 'medium', raison 'fitment:partial rim=…' suivie de ' width=?' et/ou
//     ' section=?' selon la clé manquante (pneumatique : section seule ;
//     plein : largeur de jante ET section, décision 16/09).
//   - pneumatique : tire_family identique des deux côtés exigé. Plein : trotte
//     candidate ssi tire_family='solid' OU solid_conversion='yes' (une trotte
//     pneumatique convertible) ; 'no' ou NULL → aucune ligne (🔵 côté client).
//     published=true toujours exigé.
//   - règle dure : pièce non "matchable" (clés minimales absentes) → AUCUNE
//     suggestion (ni regex ni IA) — état 🔵 côté client.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { intersectPublishedConfigVoltages } from "./compatibility-helpers.ts";

/**
 * Copie Deno de STRICT_CATEGORIES (scripts/lib/validate-part-keys.js) — les EF
 * ne peuvent pas importer hors de supabase/functions/. Tenir les deux en phase.
 * 'plaquettes' volontairement absente (rejoindra après la séance magasin).
 * 'pneus' = slug BASE de la catégorie "Pneus gonflables".
 */
export const KEY_WIRED_CATEGORIES = [
  "chargeurs",
  "chambres-a-air",
  "pneus",
  "pneus-gonflables",
  "pneus-pleins",
  "disques",
];

export interface FitmentSpecs {
  tire_family?: string;
  rim_diameters?: string[];
  /** Largeurs de jante acceptées (codes fitment_rim_widths) — pneus pleins. */
  rim_widths?: string[];
  tire_sections?: string[];
  brake_disc?: { diameters?: string[]; pcds?: string[]; holes?: string[] };
  brake_caliper?: string[];
}

export interface FitmentPartInput {
  fitment_specs?: FitmentSpecs | null;
  electrical_specs?: { voltages?: number[]; connector?: string | null } | null;
}

export type FitmentKind = "electrical" | "tire" | "disc";

export interface FitmentOutcome {
  count: number;
  highCount: number;
  partialCount: number;
  scooterIds: Set<string>;
}

const isStrArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === "string" && x.trim() !== "");

/** Famille attendue par catégorie clé (mêmes kinds que REQUIRED_KEYS_BY_CATEGORY). */
export function fitmentKindForCategory(
  categorySlug: string,
): { kind: FitmentKind; family?: "pneumatic" | "solid" } | null {
  switch (categorySlug.trim().toLowerCase()) {
    case "chargeurs":
      return { kind: "electrical" };
    case "pneus":
    case "pneus-gonflables":
    case "chambres-a-air":
      return { kind: "tire", family: "pneumatic" };
    case "pneus-pleins":
      return { kind: "tire", family: "solid" };
    case "disques":
      return { kind: "disc" };
    default:
      return null;
  }
}

/**
 * Clés MINIMALES pour que le moteur K puisse matcher (règle dure du routeur).
 * Plus tolérant que le sync strict : tire_sections optionnel côté pièce (le
 * cas partiel acté le couvre) ; le disque exige ses 3 ensembles.
 */
export function isFitmentMatchable(
  rule: { kind: FitmentKind; family?: string },
  part: FitmentPartInput,
): boolean {
  if (rule.kind === "electrical") {
    const v = part.electrical_specs?.voltages;
    return Array.isArray(v) && v.length > 0 && v.every(Number.isInteger);
  }
  const fs = part.fitment_specs;
  if (rule.kind === "tire") {
    return fs?.tire_family === rule.family && isStrArray(fs?.rim_diameters);
  }
  if (rule.kind === "disc") {
    const d = fs?.brake_disc;
    return isStrArray(d?.diameters) && isStrArray(d?.pcds) && isStrArray(d?.holes);
  }
  return false;
}

// ─── Prédicats de match PURS (testables sans I/O) ───────────────────────────

export interface TireScooterRow {
  id: string;
  tire_family: string | null;
  rim_diameter_code: string | null;
  tire_section_code: string | null;
  /** Largeur de jante (code fitment_rim_widths) — lue pour les pneus pleins. */
  rim_width_code?: string | null;
  /** 'yes' | 'no' | null : une trotte pneumatique passe-t-elle en plein ? */
  solid_conversion?: string | null;
}

export interface DiscScooterRow {
  id: string;
  disc_diameter_code: string | null;
  disc_pcd_code: string | null;
  disc_holes_code: string | null;
}

export interface MatchedRow {
  scooterId: string;
  confidence: "high" | "medium";
  reason: string;
}

/**
 * Roue : tire_family identique EXIGÉ (high comme partial, NULL trotte = pas de
 * match). Ø jante ∈ rim_diameters exigé. Section : les deux côtés renseignés
 * → high ssi le code trotte ∈ tire_sections (sinon INCOMPATIBLE, pas partial) ;
 * un des deux côtés absent → partial medium (seul medium acté).
 */
export function matchTireScooters(
  spec: { family: string; rimDiameters: string[]; tireSections?: string[] | null },
  scooters: TireScooterRow[],
): MatchedRow[] {
  const out: MatchedRow[] = [];
  const sections = isStrArray(spec.tireSections) ? spec.tireSections : null;
  for (const s of scooters) {
    if (s.tire_family !== spec.family) continue;
    if (!s.rim_diameter_code || !spec.rimDiameters.includes(s.rim_diameter_code)) continue;
    if (sections && s.tire_section_code) {
      if (!sections.includes(s.tire_section_code)) continue;
      out.push({
        scooterId: s.id,
        confidence: "high",
        reason: `fitment:${spec.family} rim=${s.rim_diameter_code} section=${s.tire_section_code}`,
      });
    } else {
      out.push({
        scooterId: s.id,
        confidence: "medium",
        reason: `fitment:partial rim=${s.rim_diameter_code}`,
      });
    }
  }
  return out;
}

/**
 * Pneu plein (décision 16/09). Candidate ssi tire_family='solid' OU
 * solid_conversion='yes' ('no' ou NULL sur une pneumatique → aucune ligne).
 * Ø jante ∈ rim_diameters exigé. Largeur et section : clé DURE quand les deux
 * côtés la portent (∉ → exclu). high ssi Ø + largeur + section concordent ;
 * une clé absente d'un côté (ou des deux) → medium, raison précise par clé
 * manquante : 'fitment:partial rim=<code>' + ' width=?' et/ou ' section=?'.
 */
export function matchSolidScooters(
  spec: { rimDiameters: string[]; rimWidths?: string[] | null; tireSections?: string[] | null },
  scooters: TireScooterRow[],
): MatchedRow[] {
  const out: MatchedRow[] = [];
  const widths = isStrArray(spec.rimWidths) ? spec.rimWidths : null;
  const sections = isStrArray(spec.tireSections) ? spec.tireSections : null;
  for (const s of scooters) {
    if (s.tire_family !== "solid" && s.solid_conversion !== "yes") continue;
    if (!s.rim_diameter_code || !spec.rimDiameters.includes(s.rim_diameter_code)) continue;
    const widthBoth = Boolean(widths && s.rim_width_code);
    if (widthBoth && !widths!.includes(s.rim_width_code!)) continue;
    const sectionBoth = Boolean(sections && s.tire_section_code);
    if (sectionBoth && !sections!.includes(s.tire_section_code!)) continue;
    if (widthBoth && sectionBoth) {
      out.push({
        scooterId: s.id,
        confidence: "high",
        reason: `fitment:solid rim=${s.rim_diameter_code} width=${s.rim_width_code} section=${s.tire_section_code}`,
      });
    } else {
      const missing = (widthBoth ? "" : " width=?") + (sectionBoth ? "" : " section=?");
      out.push({
        scooterId: s.id,
        confidence: "medium",
        reason: `fitment:partial rim=${s.rim_diameter_code}${missing}`,
      });
    }
  }
  return out;
}

/** Disque : les 3 codes trotte non-NULL et chacun ∈ son ensemble pièce. Pas de partial. */
export function matchDiscScooters(
  spec: { diameters: string[]; pcds: string[]; holes: string[] },
  scooters: DiscScooterRow[],
): MatchedRow[] {
  const out: MatchedRow[] = [];
  for (const s of scooters) {
    if (!s.disc_diameter_code || !spec.diameters.includes(s.disc_diameter_code)) continue;
    if (!s.disc_pcd_code || !spec.pcds.includes(s.disc_pcd_code)) continue;
    if (!s.disc_holes_code || !spec.holes.includes(s.disc_holes_code)) continue;
    out.push({
      scooterId: s.id,
      confidence: "high",
      reason: `fitment:disc d=${s.disc_diameter_code} pcd=${s.disc_pcd_code} holes=${s.disc_holes_code}`,
    });
  }
  return out;
}

// ─── Moteur K (effet DB) ────────────────────────────────────────────────────

const EMPTY: FitmentOutcome = { count: 0, highCount: 0, partialCount: 0, scooterIds: new Set() };

export async function suggestCompatibilitiesFitment(
  supabase: SupabaseClient,
  partId: string,
  part: FitmentPartInput,
  categorySlug: string,
  excludeScooterIds?: Set<string>,
): Promise<FitmentOutcome> {
  const rule = fitmentKindForCategory(categorySlug);
  if (!rule || !isFitmentMatchable(rule, part)) return { ...EMPTY, scooterIds: new Set() };

  let matched: MatchedRow[] = [];

  if (rule.kind === "electrical") {
    // Même mécanique que le chemin B1.4b (variantes scooter_battery_configs,
    // dont bi-voltage), mais avec une raison fitment: par voltage matché.
    const voltages = part.electrical_specs!.voltages!.map(Number);
    const [cfgRes, pubRes] = await Promise.all([
      supabase
        .from("scooter_battery_configs")
        .select("scooter_model_id, voltage")
        .in("voltage", voltages),
      supabase.from("scooter_models").select("id").eq("published", true),
    ]);
    if (cfgRes.error || pubRes.error) {
      // Fail-closed : erreur → aucune suggestion.
      if (cfgRes.error) console.error(`[fitment] Erreur fetch battery_configs:`, cfgRes.error.message);
      if (pubRes.error) console.error(`[fitment] Erreur fetch scooter_models:`, pubRes.error.message);
      return { ...EMPTY, scooterIds: new Set() };
    }
    const publishedIds = new Set((pubRes.data ?? []).map((r) => r.id as string));
    const configs = (cfgRes.data ?? []) as Array<{ scooter_model_id: string; voltage: number }>;
    const ids = intersectPublishedConfigVoltages(configs, publishedIds);
    const voltageById = new Map<string, number>();
    for (const c of configs) {
      if (ids.has(c.scooter_model_id) && !voltageById.has(c.scooter_model_id)) {
        voltageById.set(c.scooter_model_id, c.voltage);
      }
    }
    matched = [...ids].map((id) => ({
      scooterId: id,
      confidence: "high" as const,
      reason: `fitment:voltage=${voltageById.get(id)}`,
    }));
  } else if (rule.kind === "tire") {
    const fs = part.fitment_specs!;
    const { data, error } = await supabase
      .from("scooter_models")
      .select("id, tire_family, rim_diameter_code, tire_section_code, rim_width_code, solid_conversion")
      .eq("published", true)
      .in("rim_diameter_code", fs.rim_diameters!);
    if (error) {
      console.error(`[fitment] Erreur fetch scooters (tire):`, error.message);
      return { ...EMPTY, scooterIds: new Set() };
    }
    const rows = (data ?? []) as TireScooterRow[];
    matched = rule.family === "solid"
      ? matchSolidScooters(
        { rimDiameters: fs.rim_diameters!, rimWidths: fs.rim_widths ?? null, tireSections: fs.tire_sections ?? null },
        rows,
      )
      : matchTireScooters(
        { family: rule.family!, rimDiameters: fs.rim_diameters!, tireSections: fs.tire_sections ?? null },
        rows,
      );
  } else {
    const d = part.fitment_specs!.brake_disc!;
    const { data, error } = await supabase
      .from("scooter_models")
      .select("id, disc_diameter_code, disc_pcd_code, disc_holes_code")
      .eq("published", true)
      .in("disc_diameter_code", d.diameters!);
    if (error) {
      console.error(`[fitment] Erreur fetch scooters (disc):`, error.message);
      return { ...EMPTY, scooterIds: new Set() };
    }
    matched = matchDiscScooters(
      { diameters: d.diameters!, pcds: d.pcds!, holes: d.holes! },
      (data ?? []) as DiscScooterRow[],
    );
  }

  if (excludeScooterIds && excludeScooterIds.size > 0) {
    matched = matched.filter((m) => !excludeScooterIds.has(m.scooterId));
  }
  if (matched.length === 0) return { ...EMPTY, scooterIds: new Set() };

  const rows = matched.map((m) => ({
    part_id: partId,
    scooter_model_id: m.scooterId,
    auto_suggested: true,
    confidence_level: m.confidence,
    suggestion_reason: m.reason,
  }));

  const { error: insertErr } = await supabase
    .from("part_compatibility")
    .upsert(rows, { onConflict: "part_id,scooter_model_id", ignoreDuplicates: true });
  if (insertErr) {
    console.error(`[fitment] Erreur insert compat ${partId}:`, insertErr.message);
    return { ...EMPTY, scooterIds: new Set() };
  }

  return {
    count: rows.length,
    highCount: matched.filter((m) => m.confidence === "high").length,
    partialCount: matched.filter((m) => m.confidence === "medium").length,
    scooterIds: new Set(matched.map((m) => m.scooterId)),
  };
}
