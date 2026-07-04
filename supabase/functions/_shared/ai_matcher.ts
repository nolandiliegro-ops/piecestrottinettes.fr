// =====================================================================
// ai_matcher.ts — Passe B : matching de compatibilité par IA (Claude)
// =====================================================================
// Toutes les fonctions exportées sont PURES sauf callClaudeMatching et
// suggestCompatibilitiesAI (effets : fetch / DB).
// Les helpers purs sont testés dans logic_test.ts.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isElectricalPart, isTirePart } from "./compatibility-helpers.ts";

// ─── Types publics ──────────────────────────────────────────────────────────

export interface AIScooterRow {
  id: string;
  name: string;
  brand: string;
  tire_size: string | null;
  voltage: number | null;
  power_watts: number | null;
  range_km: number | null;
}

export interface AIPartInput {
  name: string;
  description?: string | null;
  technical_metadata?: Record<string, unknown> | null;
  /** Catégorie de la pièce (donnée existante) — oriente le raisonnement de l'IA. */
  category?: string | null;
  /** B1.6/B3 — signaux pour le garde défensif anti-Passe B (isElectricalPart / isTirePart). */
  categorySlug?: string | null;
  /** B3 — categories.spec_type (autoritaire) : charger/controller/battery → élec, tire → pneu. */
  categorySpecType?: string | null;
  electrical_specs?: { voltages?: number[]; connector?: string | null } | null;
}

export interface AIMatchInput {
  part: AIPartInput;
  scooters: AIScooterRow[];
}

export type AIConfidence = "high" | "medium" | "low";

export interface AIMatchResult {
  scooter_id: string;
  confidence: AIConfidence;
  reason: string;
}

export type AICallStatus = "ok" | "timeout" | "rate_limit" | "error" | "skipped";

export interface AICallOutcome {
  results: AIMatchResult[];
  durationMs: number;
  status: AICallStatus;
}

// ─── Constantes ─────────────────────────────────────────────────────────────

export const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";
const ALLOWED_MODEL_PREFIXES = [
  "claude-sonnet-",
  "claude-opus-",
  "claude-haiku-",
  "claude-3-",
];
const ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_TOKENS = 4096;

// ─── Helpers PURS ───────────────────────────────────────────────────────────

/**
 * Choisit le modèle Claude à utiliser.
 * - env vide / absent   → DEFAULT_MODEL (Sonnet 4.5)
 * - env valide          → utilisée telle quelle
 * - env invalide (gpt-…) → DEFAULT_MODEL + warning
 */
export function resolveModel(envValue: string | undefined): string {
  if (!envValue || envValue.trim() === "") return DEFAULT_MODEL;
  const trimmed = envValue.trim();
  const ok = ALLOWED_MODEL_PREFIXES.some((p) => trimmed.startsWith(p));
  if (!ok) {
    console.warn(
      `[ai_matcher] ANTHROPIC_MATCHING_MODEL invalide ("${trimmed}"), fallback ${DEFAULT_MODEL}`,
    );
    return DEFAULT_MODEL;
  }
  return trimmed;
}

/** Wrapper Promise.race timeout — extrait pour testabilité. */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  onTimeout: () => T,
): Promise<T> {
  return new Promise<T>((resolve) => {
    let done = false;
    const t = setTimeout(() => {
      if (done) return;
      done = true;
      resolve(onTimeout());
    }, ms);
    promise.then(
      (v) => {
        if (done) return;
        done = true;
        clearTimeout(t);
        resolve(v);
      },
      (_e) => {
        if (done) return;
        done = true;
        clearTimeout(t);
        resolve(onTimeout());
      },
    );
  });
}

/** Construit le prompt système + utilisateur. */
export function buildAIPrompt(input: AIMatchInput): { system: string; user: string } {
  const system =
    "Tu es un expert mécanique des trottinettes électriques. " +
    "Ta mission : déterminer si UNE pièce est RÉELLEMENT compatible avec des modèles précis, " +
    "uniquement sur preuve (specs concordantes ou modèle explicitement nommé). " +
    "Tu es STRICT et CONSERVATEUR : dans le doute, tu n'inclus PAS le modèle. " +
    "Mieux vaut omettre une compatibilité que d'en inventer une fausse. " +
    "Tu réponds UNIQUEMENT en JSON valide, sans markdown ni texte hors JSON.";

  const part = input.part;
  const scootersJson = JSON.stringify(
    input.scooters.map((s) => ({
      id: s.id,
      name: s.name,
      brand: s.brand,
      tire_size: s.tire_size,
      voltage: s.voltage,
      watts: s.power_watts,
      range_km: s.range_km,
    })),
  );

  const user =
    `PIÈCE À ANALYSER\n` +
    `- Catégorie: ${part.category ?? "inconnue"}\n` +
    `- Nom: ${part.name}\n` +
    `- Description: ${(part.description ?? "").replace(/<[^>]+>/g, "").slice(0, 600)}\n` +
    `- Attributs techniques: ${JSON.stringify(part.technical_metadata ?? {})}\n\n` +
    `SPEC DISCRIMINANTE À VÉRIFIER EN PRIORITÉ (selon la catégorie) :\n` +
    `- Pneus / Chambres à air : la taille (tire_size) DOIT correspondre exactement. Taille différente = incompatible.\n` +
    `- Plaquettes / Disques de frein : dépendent du SYSTÈME DE FREINAGE (étrier). Un frein hydraulique haut de gamme (ex. Magura MT) n'est PAS compatible avec un frein à disque mécanique standard. Sans preuve que le modèle utilise ce frein précis (frein/étrier nommé dans la pièce, ou modèle explicitement cité), NE PAS inclure.\n` +
    `- Chargeurs : le voltage DOIT correspondre exactement ; le connecteur doit correspondre s'il est connu.\n` +
    `- Autre : exige une concordance de specs explicite.\n\n` +
    `TROTTINETTES DISPONIBLES (${input.scooters.length}) — specs connues (null = INCONNU : ne suppose rien) :\n` +
    `${scootersJson}\n\n` +
    `RÈGLES DE DÉCISION\n` +
    `1. N'inclure un modèle QUE si tu as une preuve. Aucune preuve → ne pas l'inclure.\n` +
    `2. Si la spec discriminante du modèle est null/inconnue, tu NE PEUX PAS prouver la compatibilité → ne pas l'inclure en high/medium.\n` +
    `3. Confiance :\n` +
    `   - "high" : spec discriminante IDENTIQUE et vérifiée, OU modèle explicitement nommé dans le nom/la description de la pièce.\n` +
    `   - "medium" : forte présomption (ex. même tire_size pour un pneu) sans confirmation totale.\n` +
    `   - "low" : indice faible / incertain.\n` +
    `4. RÉALISME : une trottinette n'a typiquement qu'UN type de plaquette compatible, 1 à 2 tailles de chambre à air, quelques pneus. N'attribue pas "high" à 3 plaquettes différentes pour le même modèle — garde la plus probable.\n` +
    `5. Ne renvoie QUE les modèles compatibles. N'invente pas d'UUID (utilise ceux fournis).\n\n` +
    `FORMAT (JSON strict, rien d'autre) :\n` +
    `{ "compatibilities": [ {"scooter_id": "uuid", "compatible": true, "confidence": "high"|"medium"|"low", "reason": "preuve courte et factuelle"} ] }`;

  return { system, user };
}

/**
 * Parse la réponse Claude. Tolérant : extrait un JSON même entouré de markdown.
 * Filtre :
 *  - confidence ∈ {high, medium, low}
 *  - compatible === true
 *  - scooter_id présent dans validIds (anti-hallucination)
 *  - reason est une string non vide (sinon "")
 * Ne throw JAMAIS — retourne [] sur erreur.
 */
export function parseAIResponse(
  rawText: string,
  validIds?: Set<string>,
): AIMatchResult[] {
  if (!rawText || typeof rawText !== "string") return [];

  let jsonStr = rawText.trim();
  // Strip ```json ... ``` fences
  const fence = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) jsonStr = fence[1].trim();

  // Si pas un JSON pur, essaye de chopper l'objet contenant "compatibilities"
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    const m = jsonStr.match(/\{[\s\S]*"compatibilities"[\s\S]*\}/);
    if (!m) return [];
    try {
      parsed = JSON.parse(m[0]);
    } catch {
      return [];
    }
  }

  if (!parsed || typeof parsed !== "object") return [];
  const arr = (parsed as { compatibilities?: unknown }).compatibilities;
  if (!Array.isArray(arr)) return [];

  const out: AIMatchResult[] = [];
  for (const raw of arr) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const id = typeof r.scooter_id === "string" ? r.scooter_id : null;
    const compatible = r.compatible === true;
    const confidence = r.confidence;
    const reason = typeof r.reason === "string" ? r.reason : "";

    if (!id) continue;
    if (!compatible) continue;
    if (confidence !== "high" && confidence !== "medium" && confidence !== "low") continue;
    if (validIds && !validIds.has(id)) continue;

    out.push({ scooter_id: id, confidence, reason: reason.slice(0, 280) });
  }
  return out;
}

/** Retire les résultats IA déjà couverts par la Passe A (déduplication). */
export function dedupeAgainstPassA(
  aiResults: AIMatchResult[],
  passAScooterIds: Set<string>,
): AIMatchResult[] {
  if (passAScooterIds.size === 0) return aiResults;
  return aiResults.filter((r) => !passAScooterIds.has(r.scooter_id));
}

// ─── Appel Claude (avec timeout) ────────────────────────────────────────────

export async function callClaudeMatching(
  input: AIMatchInput,
  apiKey: string,
  opts: { timeoutMs?: number; model?: string } = {},
): Promise<AICallOutcome> {
  const start = Date.now();
  const validIds = new Set(input.scooters.map((s) => s.id));
  const model = opts.model ?? resolveModel(Deno.env.get("ANTHROPIC_MATCHING_MODEL") ?? undefined);
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const { system, user } = buildAIPrompt(input);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let outcome: AICallOutcome;
  try {
    const resp = await fetch(ANTHROPIC_ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: DEFAULT_MAX_TOKENS,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });

    if (resp.status === 429) {
      const txt = await resp.text().catch(() => "");
      console.warn(`[ai_matcher] Rate limit Claude (429): ${txt.slice(0, 200)}`);
      outcome = { results: [], durationMs: Date.now() - start, status: "rate_limit" };
    } else if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      console.error(`[ai_matcher] HTTP ${resp.status}: ${txt.slice(0, 300)}`);
      outcome = { results: [], durationMs: Date.now() - start, status: "error" };
    } else {
      const data = await resp.json().catch(() => null) as
        | { content?: { type?: string; text?: string }[] }
        | null;
      const text = data?.content?.find((c) => c?.type === "text")?.text ?? "";
      const results = parseAIResponse(text, validIds);
      outcome = { results, durationMs: Date.now() - start, status: "ok" };
    }
  } catch (e) {
    const isAbort = (e as Error)?.name === "AbortError";
    if (isAbort) {
      console.warn(`[ai_matcher] Timeout Claude (${timeoutMs}ms)`);
      outcome = { results: [], durationMs: Date.now() - start, status: "timeout" };
    } else {
      console.error(`[ai_matcher] Exception:`, e);
      outcome = { results: [], durationMs: Date.now() - start, status: "error" };
    }
  } finally {
    clearTimeout(timer);
  }

  return outcome;
}

// ─── Helper DB : extraction hints depuis technical_metadata ─────────────────

/**
 * Cherche tire_size + voltage dans technical_metadata (souvent rempli au scrap).
 * Tolère les clés "tire_size", "diametre", "voltage" en string ou number.
 */
export function extractHintsFromTechnicalMetadata(
  meta: Record<string, unknown> | null | undefined,
): { tire_size: string | null; voltage: number | null } {
  if (!meta || typeof meta !== "object") return { tire_size: null, voltage: null };

  // tire_size
  let tire_size: string | null = null;
  const tireRaw = meta.tire_size ?? meta.diametre ?? meta.diameter;
  if (typeof tireRaw === "string") {
    const m = tireRaw.match(/(\d{1,2}(?:\.\d{1,2})?)/);
    if (m) tire_size = m[1];
  } else if (typeof tireRaw === "number") {
    tire_size = String(tireRaw);
  }

  // voltage
  let voltage: number | null = null;
  const voltRaw = meta.voltage;
  if (typeof voltRaw === "number" && voltRaw >= 24 && voltRaw <= 144) {
    voltage = voltRaw;
  } else if (typeof voltRaw === "string") {
    const m = voltRaw.match(/(\d{2,3})/);
    if (m) {
      const v = parseInt(m[1], 10);
      if (v >= 24 && v <= 144) voltage = v;
    }
  }

  return { tire_size, voltage };
}

// ─── Orchestrateur Passe B (effet DB) ───────────────────────────────────────

export interface PassBOutcome {
  count: number;
  durationMs: number;
  status: AICallStatus;
}

/**
 * Passe B : appelle Claude, filtre, déduplique, INSERT batch dans part_compatibility.
 * Jamais bloquant : toute erreur → retour status='error' / count=0, le caller log et continue.
 */
export async function suggestCompatibilitiesAI(
  supabase: SupabaseClient,
  partId: string,
  part: AIPartInput,
  excludeScooterIds: Set<string>,
  apiKey: string,
): Promise<PassBOutcome> {
  // B1.6/B3 — garde défensif (ceinture-bretelles). Les call sites skippent déjà
  // élec ET pneu en amont ; ici on refuse toute Passe B AVANT le moindre fetch/
  // appel Claude si les signaux élec (spec_type/voltages/slug) OU pneu (spec_type)
  // sont présents, pour couvrir tout futur caller.
  if (
    isElectricalPart({
      specType: part.categorySpecType,
      categorySlug: part.categorySlug,
      electrical_specs: part.electrical_specs,
    }) ||
    isTirePart({ specType: part.categorySpecType })
  ) {
    return { count: 0, durationMs: 0, status: "skipped" };
  }

  // 1. Fetch scooters publiés avec leurs specs
  const { data: rawScooters, error: scootersErr } = await supabase
    .from("scooter_models")
    .select("id, name, tire_size, voltage, power_watts, range_km, brand:brands(name)")
    .eq("published", true);

  if (scootersErr || !rawScooters) {
    console.error("[ai_matcher] Erreur fetch scooter_models:", scootersErr?.message);
    return { count: 0, durationMs: 0, status: "error" };
  }

  const scooters: AIScooterRow[] = (rawScooters as Array<{
    id: string;
    name: string;
    tire_size: string | null;
    voltage: number | null;
    power_watts: number | null;
    range_km: number | null;
    brand: { name: string } | { name: string }[] | null;
  }>).map((s) => {
    const brandName = Array.isArray(s.brand) ? s.brand[0]?.name : s.brand?.name;
    return {
      id: s.id,
      name: s.name,
      brand: brandName ?? "",
      tire_size: s.tire_size,
      voltage: s.voltage,
      power_watts: s.power_watts,
      range_km: s.range_km,
    };
  });

  if (scooters.length === 0) {
    return { count: 0, durationMs: 0, status: "skipped" };
  }

  // 2. Appel Claude
  const outcome = await callClaudeMatching(
    { part, scooters },
    apiKey,
  );

  if (outcome.status !== "ok" || outcome.results.length === 0) {
    return { count: 0, durationMs: outcome.durationMs, status: outcome.status };
  }

  // 3. Déduplication + garde-fou : on n'insère PAS les "low" (bruit).
  //    Seules les suggestions high/medium entrent en base (auto_suggested).
  const fresh = dedupeAgainstPassA(outcome.results, excludeScooterIds)
    .filter((r) => r.confidence !== "low");
  if (fresh.length === 0) {
    return { count: 0, durationMs: outcome.durationMs, status: "ok" };
  }

  // 4. INSERT batch (upsert pour absorber races éventuelles)
  const rows = fresh.map((r) => ({
    part_id: partId,
    scooter_model_id: r.scooter_id,
    auto_suggested: true,
    confidence_level: r.confidence,
    suggestion_reason: r.reason || null,
  }));

  const { error: insertErr } = await supabase
    .from("part_compatibility")
    .upsert(rows, {
      onConflict: "part_id,scooter_model_id",
      ignoreDuplicates: true,
    });

  if (insertErr) {
    console.error(`[ai_matcher] Erreur insert AI compat ${partId}:`, insertErr.message);
    return { count: 0, durationMs: outcome.durationMs, status: "error" };
  }

  return { count: rows.length, durationMs: outcome.durationMs, status: "ok" };
}
