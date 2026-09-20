import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

// ─── Signature de version : présente sur TOUTE réponse 200 des deux actions.
// Un smoke-test externe (action "snapshot", lecture pure) doit pouvoir
// distinguer cette version d'une version antérieure sans rien écrire en base.
const ENGINE = "key-hunter-ingest";
const CONTRACT = 2;

// Périmètre strict : UNIQUEMENT ces deux tables. Rien d'autre, jamais.
const TABLE_FITMENT_RAW = "fitment_raw";
const TABLE_ALIAS = "supplier_model_alias";

// Plafonds de protection (correction 4) : l'appelant découpe au-delà.
const MAX_ROWS = 5000;
const MAX_ALIASES = 5000;

// Taille des lots d'écriture et des pages de lecture.
const BATCH_SIZE = 500;
const PAGE_SIZE = 1000; // plafond PostgREST par requête
const MAX_PAGES = 200; // garde-fou anti-boucle infinie

// Colonnes générées (pt_model_key(raw_model)) sur les DEUX tables : jamais en
// écriture, Postgres rejetterait toute valeur fournie. id : la clé de conflit
// est dedup_key / (source, raw_model), jamais l'id. Retirés silencieusement.
const FORBIDDEN_WRITE_FIELDS = new Set(["alias_key", "id"]);

// Champs NOT NULL sur fitment_raw.
const ROW_REQUIRED_FIELDS = ["source", "category", "claim_type", "dedup_key"] as const;

// ─── Réponses ────────────────────────────────────────────────────────────────
function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── Comparaison en temps constant : ne fuit ni l'égalité partielle ni la
// longueur du secret attendu.
function secretsEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const ba = encoder.encode(a);
  const bb = encoder.encode(b);
  const len = Math.max(ba.length, bb.length);
  let diff = ba.length === bb.length ? 0 : 1;
  for (let i = 0; i < len; i++) {
    const x = i < ba.length ? ba[i] : 0;
    const y = i < bb.length ? bb[i] : 0;
    diff |= x ^ y;
  }
  return diff === 0;
}

// ─── Sanitisation d'un payload d'écriture : retire les champs interdits
// (correction 5), ne touche à rien d'autre, jamais de null ajouté.
function sanitizePayload(
  input: unknown,
): Record<string, unknown> | null {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return null;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (FORBIDDEN_WRITE_FIELDS.has(k)) continue;
    out[k] = v;
  }
  return out;
}

// ─── Pagination générique par 1000, tout ou rien : lève en cas d'échec.
// order() sur une clé stable pour une pagination fiable.
async function fetchAllPages<T>(
  queryFactory: (
    from: number,
    to: number,
  ) => PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>,
  stage: string,
): Promise<T[]> {
  const out: T[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await queryFactory(from, to);
    if (error) {
      throw new Error(`[${stage}] lecture page ${page} : ${error.message}`);
    }
    const rows = data ?? [];
    out.push(...rows);
    if (rows.length < PAGE_SIZE) return out; // dernière page
  }
  throw new Error(
    `[${stage}] garde-fou atteint (${MAX_PAGES} pages de ${PAGE_SIZE}) — volume inattendu`,
  );
}

// ─── ACTION snapshot : lecture seule, TOUT OU RIEN (correction 3).
// La moindre lecture incomplète renvoie 500 — un référentiel amputé rendu en
// 200 ferait travailler le job nocturne sur des données fausses.
async function handleSnapshot(supabase: SupabaseClient): Promise<Response> {
  try {
    const humanAliases = await fetchAllPages<{
      source: string;
      raw_model: string;
      scooter_model_slug: string;
    }>(
      (from, to) =>
        supabase
          .from(TABLE_ALIAS)
          .select("source, raw_model, scooter_model_slug")
          .not("scooter_model_slug", "is", null)
          .order("source")
          .order("raw_model")
          .range(from, to)
          .then((r) => ({ data: r.data, error: r.error })),
      "human_aliases",
    );

    const dedupRows = await fetchAllPages<{ dedup_key: string }>(
      (from, to) =>
        supabase
          .from(TABLE_FITMENT_RAW)
          .select("dedup_key")
          .order("dedup_key")
          .range(from, to)
          .then((r) => ({ data: r.data, error: r.error })),
      "dedup_keys",
    );

    const aliasPairs = await fetchAllPages<{ source: string; raw_model: string }>(
      (from, to) =>
        supabase
          .from(TABLE_ALIAS)
          .select("source, raw_model")
          .order("source")
          .order("raw_model")
          .range(from, to)
          .then((r) => ({ data: r.data, error: r.error })),
      "alias_pairs",
    );

    // Référentiel catalogue en lecture seule : le job appelant n'a besoin
    // d'aucune credential Supabase. Jamais d'écriture sur ces deux tables.
    const scooterModels = await fetchAllPages<{
      slug: string;
      name: string;
      brand: { name: string } | null;
      published: boolean;
      tire_family: string | null;
      rim_diameter_code: string | null;
      tire_section_code: string | null;
      caliper_family: string | null;
      disc_diameter_code: string | null;
      disc_pcd_code: string | null;
      disc_holes_code: string | null;
    }>(
      (from, to) =>
        supabase
          .from("scooter_models")
          .select(
            "slug, name, brand:brands(name), published, tire_family, rim_diameter_code, tire_section_code, caliper_family, disc_diameter_code, disc_pcd_code, disc_holes_code",
          )
          .eq("published", true)
          .order("slug")
          .range(from, to)
          .then((r) => ({ data: r.data, error: r.error })),
      "scooter_models",
    );

    const parts = await fetchAllPages<{ id: string; fitment_specs: unknown }>(
      (from, to) =>
        supabase
          .from("parts")
          .select("id, fitment_specs")
          .eq("published", true)
          .not("fitment_specs", "is", null)
          .order("id")
          .range(from, to)
          .then((r) => ({ data: r.data, error: r.error })),
      "parts",
    );

    const dedupKeys = dedupRows.map((r) => r.dedup_key);

    return jsonResponse(200, {
      engine: ENGINE,
      contract: CONTRACT,
      action: "snapshot",
      human_aliases: humanAliases,
      dedup_keys: dedupKeys,
      alias_pairs: aliasPairs,
      scooter_models: scooterModels,
      parts: parts,
      counts: {
        human_aliases: humanAliases.length,
        dedup_keys: dedupKeys.length,
        alias_pairs: aliasPairs.length,
        scooter_models: scooterModels.length,
        parts: parts.length,
      },
    });
  } catch (err) {
    const message = String(err);
    const stageMatch = message.match(/^\[([^\]]+)\]/);
    return jsonResponse(500, {
      error: "Snapshot failed",
      stage: stageMatch ? stageMatch[1] : "unknown",
      detail: message,
    });
  }
}

// ─── Upsert par lots de 500, un try/catch par lot : un échec est journalisé
// et renvoyé dans errors, les lots suivants sont quand même tentés.
async function upsertInBatches(
  supabase: SupabaseClient,
  table: string,
  rows: Record<string, unknown>[],
  onConflict: string,
  ignoreDuplicates: boolean,
  stage: string,
  errors: { stage: string; batch: number; range: string; message: string }[],
): Promise<number> {
  let sent = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const batchIndex = Math.floor(i / BATCH_SIZE) + 1;
    try {
      const { error } = await supabase
        .from(table)
        .upsert(batch, { onConflict, ignoreDuplicates });
      if (error) {
        errors.push({
          stage,
          batch: batchIndex,
          range: `${i}-${i + batch.length - 1}`,
          message: error.message,
        });
      } else {
        sent += batch.length;
      }
    } catch (e) {
      errors.push({
        stage,
        batch: batchIndex,
        range: `${i}-${i + batch.length - 1}`,
        message: String(e),
      });
    }
  }
  return sent;
}

// ─── ACTION ingest : écriture, zéro SELECT (correction 1).
async function handleIngest(
  supabase: SupabaseClient,
  body: Record<string, unknown>,
): Promise<Response> {
  const errors: {
    stage: string;
    batch?: number;
    range?: string;
    message: string;
  }[] = [];

  const rawRows = body.rows;
  const rawAliases = body.aliases;

  // rows / aliases présents mais non-tableaux → 400.
  if (rawRows !== undefined && !Array.isArray(rawRows)) {
    return jsonResponse(400, { error: "rows and aliases must be arrays" });
  }
  if (rawAliases !== undefined && !Array.isArray(rawAliases)) {
    return jsonResponse(400, { error: "rows and aliases must be arrays" });
  }

  const rowsIn: unknown[] = rawRows ?? [];
  const aliasesIn: unknown[] = rawAliases ?? [];

  // Plafonds (correction 4) : aucune écriture au-delà.
  if (rowsIn.length > MAX_ROWS || aliasesIn.length > MAX_ALIASES) {
    return jsonResponse(413, { error: "Payload too large", max: MAX_ROWS });
  }

  // ── Validation + sanitisation des rows ──
  const rowsWithSlug: Record<string, unknown>[] = [];
  const rowsWithoutSlug: Record<string, unknown>[] = [];
  rowsIn.forEach((item, index) => {
    const cleaned = sanitizePayload(item);
    if (!cleaned) {
      errors.push({
        stage: "validation",
        message: `rows[${index}] : objet attendu`,
      });
      return;
    }
    const missing = ROW_REQUIRED_FIELDS.filter((f) => {
      const v = cleaned[f];
      return v === undefined || v === null || v === "";
    });
    if (missing.length > 0) {
      errors.push({
        stage: "validation",
        message: `rows[${index}] : champ(s) requis manquant(s) : ${missing.join(", ")}`,
      });
      return;
    }
    // Partition sur la PRÉSENCE de la clé model_slug (jamais sa valeur) :
    // une clé absente ne doit jamais devenir un null qui écraserait un slug
    // résolu à la main.
    if ("model_slug" in cleaned) rowsWithSlug.push(cleaned);
    else rowsWithoutSlug.push(cleaned);
  });

  // ── Validation + sanitisation des aliases ──
  // Correction 2 : la résolution est un geste HUMAIN. Tout alias portant un
  // scooter_model_slug non vide OU un status ≠ "unresolved" est REJETÉ.
  // Chaque alias accepté part avec status: "unresolved" en dur — la FK et le
  // CHECK smalias_resolved_chk sont satisfaits par construction.
  const aliases: Record<string, unknown>[] = [];
  aliasesIn.forEach((item, index) => {
    const cleaned = sanitizePayload(item);
    if (!cleaned) {
      errors.push({
        stage: "validation",
        message: `aliases[${index}] : objet attendu`,
      });
      return;
    }
    const source = cleaned.source;
    const rawModel = cleaned.raw_model;
    if (!source || !rawModel) {
      errors.push({
        stage: "validation",
        message: `aliases[${index}] : source et raw_model sont requis`,
      });
      return;
    }
    const slug = cleaned.scooter_model_slug;
    if (slug !== undefined && slug !== null && slug !== "") {
      errors.push({
        stage: "validation",
        message: `aliases[${index}] (${source}/${rawModel}) : scooter_model_slug interdit — la résolution est un geste humain`,
      });
      return;
    }
    const status = cleaned.status;
    if (status !== undefined && status !== "unresolved") {
      errors.push({
        stage: "validation",
        message: `aliases[${index}] (${source}/${rawModel}) : status "${status}" interdit — seul "unresolved" est accepté`,
      });
      return;
    }
    cleaned.scooter_model_slug = null;
    cleaned.status = "unresolved";
    aliases.push(cleaned);
  });

  // Rien à écrire → 200 compteurs à zéro, aucune écriture.
  const upserted = { rows_with_slug: 0, rows_without_slug: 0, aliases: 0 };
  const batches = { rows_with_slug: 0, rows_without_slug: 0, aliases: 0 };

  if (rowsWithSlug.length === 0 && rowsWithoutSlug.length === 0 && aliases.length === 0) {
    return jsonResponse(200, {
      engine: ENGINE,
      contract: CONTRACT,
      action: "ingest",
      received: { rows: rowsIn.length, aliases: aliasesIn.length },
      upserted,
      batches,
      errors,
    });
  }

  // ── Écriture ──
  upserted.rows_with_slug = await upsertInBatches(
    supabase, TABLE_FITMENT_RAW, rowsWithSlug, "dedup_key", false,
    "rows_with_slug", errors,
  );
  upserted.rows_without_slug = await upsertInBatches(
    supabase, TABLE_FITMENT_RAW, rowsWithoutSlug, "dedup_key", false,
    "rows_without_slug", errors,
  );
  // insert-only : jamais toucher à une résolution humaine existante.
  upserted.aliases = await upsertInBatches(
    supabase, TABLE_ALIAS, aliases, "source,raw_model", true,
    "aliases", errors,
  );

  batches.rows_with_slug = Math.ceil(rowsWithSlug.length / BATCH_SIZE);
  batches.rows_without_slug = Math.ceil(rowsWithoutSlug.length / BATCH_SIZE);
  batches.aliases = Math.ceil(aliases.length / BATCH_SIZE);

  return jsonResponse(200, {
    engine: ENGINE,
    contract: CONTRACT,
    action: "ingest",
    received: { rows: rowsIn.length, aliases: aliasesIn.length },
    upserted,
    batches,
    errors,
  });
}

// ─── Handler principal ───────────────────────────────────────────────────────
const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse(405, { error: "Method not allowed" });
    }

    // Auth : secret DÉDIÉ, jamais ADMIN_BULK_SECRET. Secret attendu absent,
    // header absent ou différent → 401, avant toute lecture ou écriture.
    const expectedSecret = Deno.env.get("KEY_HUNTER_SECRET");
    const providedSecret = req.headers.get("x-admin-secret");
    if (!expectedSecret || !providedSecret || !secretsEqual(providedSecret, expectedSecret)) {
      return jsonResponse(401, { error: "Unauthorized" });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonResponse(400, { error: "Invalid JSON body" });
    }
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return jsonResponse(400, { error: "Invalid JSON body" });
    }
    const action = (body as Record<string, unknown>).action;
    if (action !== "snapshot" && action !== "ingest") {
      return jsonResponse(400, {
        error: "Unknown action",
        allowed: ["snapshot", "ingest"],
      });
    }

    // service_role : les deux tables ont RLS activée sans policy (volontaire).
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!serviceRoleKey || !supabaseUrl) {
      return jsonResponse(500, { error: "Server misconfigured" });
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (action === "snapshot") return await handleSnapshot(supabase);
    return await handleIngest(supabase, body as Record<string, unknown>);
  } catch (err) {
    return jsonResponse(500, { error: "Internal error", detail: String(err) });
  }
};

// import.meta.main est false sous `deno test` → module importable sans serveur.
if (import.meta.main) {
  Deno.serve(handler);
}
