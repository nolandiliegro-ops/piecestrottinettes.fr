import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

interface ScooterInput {
  name?: string; // requis à l'INSERT uniquement (update partiel par slug possible sans name)
  slug: string;
  image_url?: string;
  power_watts?: number;
  range_km?: number;
  max_speed_kmh?: number;
  voltage?: number;
  amperage?: number;
  tire_size?: string;
  year?: number;
  description?: string;
  meta_title?: string;
  meta_description?: string;
  search_terms?: string;
  youtube_video_id?: string;
  affiliate_link?: string;
  technical_signature?: Record<string, unknown>;
  // Clés de montage (contrat d'import — étapes 2 et 4). Codes des référentiels
  // fitment_* : entier nu (160) ou string verbatim ("160", "6.5", "134mm").
  // Écrits en String(v).trim(), validés par fitmentCodeFields ci-dessous.
  disc_diameter?: number | string;
  disc_pcd?: number | string;
  disc_holes?: number | string;
  rim_diameter?: string;
  rim_width?: string; // largeur de jante (pneus pleins), codes fitment_rim_widths ("44mm")
  tire_section?: string;
  caliper_family?: string;
  tire_family?: string; // "pneumatic" | "solid" — text libre en base, ensemble en dur
  solid_conversion?: string; // "yes" | "no" — CHECK en base, ensemble en dur ici
  brake_type?: string; // codes fitment_brake_types ("disc_hydraulic", "drum"…)
  rim_type?: string; // codes fitment_rim_types ("monobloc", "demi_jante"…)
  // Specs (lot 2) — validées par specFields : valeur invalide = colonne sautée + warning.
  wheel_inches?: number;
  max_speed_private_kmh?: number;
  weight_kg?: number;
  max_load_kg?: number;
  suspension?: string;
  ip_rating?: string;
  foldable?: boolean;
  score_offroad?: number;
}

// ─── Clés de montage : garde-preserve + validation référentiel ─────────────────
// Même mécanisme que seoRowFields (bulk-insert-parts, 5a646c2) : seule une valeur
// réellement fournie entre dans la row. Clé absente, null ou vide → la colonne
// n'est JAMAIS posée (l'UPDATE la laisse intacte, l'INSERT prend le DEFAULT).
// En plus : code hors référentiel → colonne sautée + warning nominatif, jamais de
// rejet du modèle entier (la FK en base rejetterait TOUTES les colonnes d'un coup).
export const FITMENT_KEYS = [
  ["rim_diameter", "rim_diameter_code", "fitment_rim_diameters"],
  ["rim_width", "rim_width_code", "fitment_rim_widths"],
  ["tire_section", "tire_section_code", "fitment_tire_sections"],
  ["disc_diameter", "disc_diameter_code", "fitment_disc_diameters"],
  ["disc_pcd", "disc_pcd_code", "fitment_disc_pcd"],
  ["disc_holes", "disc_holes_code", "fitment_disc_holes"],
  ["caliper_family", "caliper_family", "fitment_caliper_families"],
  ["tire_family", "tire_family", "tire_family"],
  ["solid_conversion", "solid_conversion", "solid_conversion"],
  ["brake_type", "brake_type", "fitment_brake_types"],
  ["rim_type", "rim_type", "fitment_rim_types"],
] as const;

type FitmentKey = (typeof FITMENT_KEYS)[number][0];

// tire_family : aucune table fitment_tire_families, aucun FK, aucun CHECK (audit 09/09).
export const TIRE_FAMILIES: ReadonlySet<string> = new Set(["pneumatic", "solid"]);
// solid_conversion : CHECK IN ('yes','no') en base (LOT 1, 16/09), pas de table → ensemble en dur.
export const SOLID_CONVERSION: ReadonlySet<string> = new Set(["yes", "no"]);

export type FitmentVocab = Record<string, ReadonlySet<string>>;
export interface FitmentWarning { name: string; field: string; code: string }

export function fitmentCodeFields(
  scooter: { name?: string; slug?: string } & Partial<Record<FitmentKey, unknown>>,
  vocab: FitmentVocab,
  warnings: FitmentWarning[],
): Record<string, string> {
  const out: Record<string, string> = {};
  const name = scooter.name ?? scooter.slug ?? "unknown";
  for (const [key, column, ref] of FITMENT_KEYS) {
    const v = scooter[key];
    const provided = Number.isInteger(v) || (typeof v === "string" && v.trim() !== "");
    if (!provided) continue;
    const code = String(v).trim();
    if (vocab[ref]?.has(code)) out[column] = code;
    else warnings.push({ name, field: column, code });
  }
  return out;
}

// ─── Specs (lot 2) : même garde que fitmentCodeFields ──────────────────────────
// Clé absente / null (texte : vide ou espaces) → colonne jamais posée, sans warning.
// Valeur fournie mais invalide → colonne sautée + warning, jamais de null écrit,
// jamais de rejet du modèle entier.
type SpecRule = "positive" | "positiveInt" | "score" | "text" | "boolean";
export const SPEC_FIELDS: ReadonlyArray<readonly [string, SpecRule]> = [
  ["wheel_inches", "positive"],
  ["max_speed_private_kmh", "positiveInt"],
  ["weight_kg", "positive"],
  ["max_load_kg", "positive"],
  ["suspension", "text"],
  ["ip_rating", "text"],
  ["foldable", "boolean"],
  ["score_offroad", "score"],
];

export function specFields(
  scooter: { name?: string; slug?: string } & Record<string, unknown>,
  warnings: FitmentWarning[],
): Record<string, number | string | boolean> {
  const out: Record<string, number | string | boolean> = {};
  const name = scooter.name ?? scooter.slug ?? "unknown";
  for (const [field, rule] of SPEC_FIELDS) {
    const v = scooter[field];
    if (v === undefined || v === null) continue;
    if (rule === "text") {
      if (typeof v === "string") {
        if (v.trim() !== "") out[field] = v.trim();
        continue; // vide / espaces = non fourni, pas de warning
      }
    } else if (rule === "boolean") {
      if (typeof v === "boolean") { out[field] = v; continue; }
    } else if (typeof v === "number" && Number.isFinite(v)) {
      const ok = rule === "positive" ? v > 0
        : rule === "positiveInt" ? Number.isInteger(v) && v > 0
        : Number.isInteger(v) && v >= 0 && v <= 100; // score
      if (ok) { out[field] = v; continue; }
    }
    warnings.push({ name, field, code: String(v) });
  }
  return out;
}

// ─── Publication automatique (lot 3) ───────────────────────────────────────────
export const PUBLISH_COLUMNS =
  "published, images, image_url, weight_kg, meta_title, meta_description, brake_type, " +
  "disc_diameter_code, disc_pcd_code, disc_holes_code, score_performance, score_autonomy, score_offroad";

export interface PublishCheckRow {
  images?: unknown;
  image_url?: string | null;
  weight_kg?: number | null;
  meta_title?: string | null;
  meta_description?: string | null;
  brake_type?: string | null;
  disc_diameter_code?: string | null;
  disc_pcd_code?: string | null;
  disc_holes_code?: string | null;
  score_performance?: number | null;
  score_autonomy?: number | null;
  score_offroad?: number | null;
}

const isBlank = (v: unknown) => typeof v !== "string" || v.trim() === "";

/** Manques qui empêchent la publication d'un modèle. [] = publiable. */
export function missingForPublish(row: PublishCheckRow): string[] {
  const missing: string[] = [];
  const hasImages = Array.isArray(row.images) && row.images.length > 0;
  if (!hasImages && isBlank(row.image_url)) missing.push("photo");
  // Poids obligatoire (décision 28/09). Une chaîne numérique est acceptée au cas
  // où la colonne numeric reviendrait sérialisée en texte.
  const w: unknown = row.weight_kg;
  const weight = typeof w === "number" ? w : typeof w === "string" && w.trim() !== "" ? Number(w) : Number.NaN;
  if (!Number.isFinite(weight) || weight <= 0) missing.push("weight_kg");
  if (isBlank(row.meta_title)) missing.push("meta_title");
  if (isBlank(row.meta_description)) missing.push("meta_description");
  if (isBlank(row.brake_type)) {
    missing.push("brake_type");
  } else if (row.brake_type!.includes("disc")) {
    // Tambour / EBS (pas de "disc") : aucune clé disque exigée.
    for (const k of ["disc_diameter_code", "disc_pcd_code", "disc_holes_code"] as const) {
      if (isBlank(row[k])) missing.push(k);
    }
  }
  for (const k of ["score_performance", "score_autonomy", "score_offroad"] as const) {
    if (row[k] === null || row[k] === undefined) missing.push(k);
  }
  return missing;
}

type ResultRow = {
  name: string;
  slug: string;
  id: string | null;
  status: "inserted" | "updated" | "published" | "skipped" | "error";
  missing?: string[];
};

// Relit le modèle et le publie s'il est complet. Ne publie QUE ce modèle (jamais
// la marque). Toute erreur va dans results.errors : jamais d'exception qui
// arrête le lot. Un modèle déjà publié n'est ni relu en manques ni dépublié.
async function publishIfCompleteRow(
  supabase: SupabaseClient,
  row: ResultRow,
  results: { published: number; errors: { name: string; error: string }[] },
): Promise<void> {
  if (!row.id) return;
  try {
    const { data, error } = await supabase
      .from("scooter_models")
      .select(PUBLISH_COLUMNS)
      .eq("id", row.id)
      .maybeSingle();
    if (error || !data) {
      results.errors.push({ name: row.name, error: `publication : relecture impossible (${error?.message ?? "ligne introuvable"})` });
      return;
    }
    const current = data as PublishCheckRow & { published?: boolean | null };
    if (current.published === true) return;
    const missing = missingForPublish(current);
    if (missing.length > 0) {
      row.missing = missing;
      return;
    }
    // .eq("published", false) : aucune écriture si la ligne a changé entre-temps.
    const { data: upd, error: updErr } = await supabase
      .from("scooter_models")
      .update({ published: true })
      .eq("id", row.id)
      .eq("published", false)
      .select("id");
    if (updErr) {
      results.errors.push({ name: row.name, error: `publication : ${updErr.message}` });
      return;
    }
    if (Array.isArray(upd) && upd.length === 1) {
      results.published++;
      row.status = "published";
    }
  } catch (e) {
    results.errors.push({ name: row.name, error: `publication : ${e instanceof Error ? e.message : String(e)}` });
  }
}

// Charge les 9 référentiels fitment_* en Set<string>, une fois par requête.
// Lève si une lecture échoue → 500 par le catch global : jamais d'écriture sans référentiel.
export async function loadFitmentVocab(supabase: SupabaseClient): Promise<FitmentVocab> {
  const vocab: FitmentVocab = { tire_family: TIRE_FAMILIES, solid_conversion: SOLID_CONVERSION };
  for (const [, , ref] of FITMENT_KEYS) {
    if (ref in vocab) continue; // ensembles en dur, pas de table
    const { data, error } = await supabase.from(ref).select("code");
    if (error) throw new Error(`Référentiel ${ref} illisible : ${error.message}`);
    vocab[ref] = new Set((data ?? []).map((r: { code: string }) => r.code));
  }
  return vocab;
}

interface BrandInput {
  tagline?: string;
  description?: string;
  editorial_verdict?: string;
  editorial_summary?: string;
  country?: string;
  founded_year?: number;
  accent_color?: string;
  logo_url?: string;
  hero_image_url?: string;
  website_url?: string;
  youtube_video_id?: string;
  display_order?: number;
  published?: boolean;
}

interface RequestBody {
  brandName: string;
  brandSlug?: string;
  brandLogoUrl?: string;
  brand?: BrandInput;
  scooters: ScooterInput[];
  // true → après écriture réussie, publie chaque MODÈLE complet (jamais la marque).
  publishIfComplete?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate admin secret
    const adminSecret = req.headers.get("x-admin-secret");
    const expectedSecret = Deno.env.get("ADMIN_BULK_SECRET");

    if (!expectedSecret || adminSecret !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse body
    const body: RequestBody = await req.json();
    const { brandName, brandSlug, brandLogoUrl, brand: brandInput, scooters } = body;
    const doPublish = body.publishIfComplete === true;

    if (!brandName || !Array.isArray(scooters) || scooters.length === 0) {
      return new Response(
        JSON.stringify({ error: "brandName (string) and scooters (non-empty array) are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create service_role client to bypass RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 0. Référentiels fitment_* — AVANT toute écriture (brand comprise).
    const vocab = await loadFitmentVocab(supabase);

    // 1. Upsert brand
    // NFD + strip diacritiques : même algo que le slugify canonique (scripts/lib/slugify.js).
    // RegExp construite (pas littérale) : les diacritiques combinants sont invisibles dans le source.
    const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");
    const slug = brandSlug ||
      brandName.toLowerCase().normalize("NFD").replace(DIACRITICS_RE, "")
        .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    // Base obligatoire : name + slug uniquement.
    const brandUpsert: Record<string, unknown> = { name: brandName, slug };

    // Habillage optionnel : on ne fusionne QUE les clés fournies (≠ undefined ET ≠ null),
    // pour ne JAMAIS écraser une valeur posée à la main par un null (override-safe).
    const b: BrandInput = brandInput ?? {};
    const editableBrandKeys = [
      "tagline", "description", "editorial_verdict", "editorial_summary",
      "country", "founded_year", "accent_color", "hero_image_url",
      "website_url", "youtube_video_id", "display_order",
    ] as const;
    for (const key of editableBrandKeys) {
      const val = (b as Record<string, unknown>)[key];
      if (val !== undefined && val !== null) brandUpsert[key] = val;
    }

    // logo_url : priorité bloc brand > top-level brandLogoUrl. N'écrit JAMAIS null
    // (corrige le bug "logo_url: brandLogoUrl || null" qui écrasait à null en ré-import brut).
    const resolvedLogo = b.logo_url ?? brandLogoUrl;
    if (resolvedLogo != null) brandUpsert.logo_url = resolvedLogo;

    // published : posé UNIQUEMENT si fourni dans le bloc brand. Sinon non touché
    // (défaut DB false à la création, valeur existante préservée sinon).
    if (b.published !== undefined && b.published !== null) brandUpsert.published = b.published;

    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .upsert(brandUpsert, { onConflict: "slug" })
      .select("id")
      .single();

    if (brandError || !brand) {
      return new Response(
        JSON.stringify({ error: "Failed to upsert brand", detail: brandError?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Upsert scooter models
    const results = {
      inserted: 0,
      updated: 0,
      published: 0,
      errors: [] as { name: string; error: string }[],
      // Codes de montage hors référentiel / specs invalides : colonne sautée, modèle quand même traité.
      warnings: [] as FitmentWarning[],
      rows: [] as ResultRow[],
    };
    // Enregistre la ligne de résultat d'une écriture RÉUSSIE puis, si demandé, tente la publication.
    const succeeded = async (row: ResultRow) => {
      results.rows.push(row);
      if (doPublish) await publishIfCompleteRow(supabase, row, results);
    };

    for (const scooter of scooters) {
      if (!scooter.slug) {
        results.errors.push({ name: scooter.name || "unknown", error: "slug is required" });
        results.rows.push({
          name: scooter.name || "unknown",
          slug: "",
          id: null,
          status: "skipped",
        });
        continue;
      }

      // 11 clés de montage — guard-preserve + validation référentiel (voir
      // fitmentCodeFields) : clé absente / vide / hors référentiel → colonne
      // JAMAIS touchée (pas d'écrasement par NULL, pas de code inconnu).
      const fitmentPatch = fitmentCodeFields(scooter, vocab, results.warnings);
      // Specs (lot 2) : même garde, valeur invalide → colonne sautée + warning.
      const specPatch = specFields(scooter as unknown as Record<string, unknown>, results.warnings);

      // Lookup AVANT écriture : détermine inserted vs updated ET le chemin.
      const { data: existing } = await supabase
        .from("scooter_models")
        .select("id, name")
        .eq("slug", scooter.slug)
        .maybeSingle();

      if (existing) {
        // ── UPDATE PARTIEL : uniquement les clés fournies dans le payload. ──
        // Un payload minimal { slug, disc_* } ne touche QUE les colonnes
        // disc_*_code. published et brand_id ne sont JAMAIS inclus : le premier
        // est piloté dans l'admin, le second ne change pas via un ré-import
        // (l'ancien upsert re-draftait published:false et pouvait re-brander —
        // les deux étaient des écrasements silencieux).
        const partialRow: Record<string, unknown> = {
          ...(scooter.name !== undefined ? { name: scooter.name } : {}),
          ...(scooter.image_url !== undefined ? { image_url: scooter.image_url } : {}),
          ...(scooter.power_watts !== undefined ? { power_watts: scooter.power_watts } : {}),
          ...(scooter.range_km !== undefined ? { range_km: scooter.range_km } : {}),
          ...(scooter.max_speed_kmh !== undefined ? { max_speed_kmh: scooter.max_speed_kmh } : {}),
          ...(scooter.voltage !== undefined ? { voltage: scooter.voltage } : {}),
          ...(scooter.amperage !== undefined ? { amperage: scooter.amperage } : {}),
          ...(scooter.tire_size !== undefined ? { tire_size: scooter.tire_size } : {}),
          ...(scooter.year !== undefined ? { year: scooter.year } : {}),
          ...(scooter.description !== undefined ? { description: scooter.description } : {}),
          ...(scooter.meta_title !== undefined ? { meta_title: scooter.meta_title } : {}),
          ...(scooter.meta_description !== undefined ? { meta_description: scooter.meta_description } : {}),
          ...(scooter.search_terms !== undefined ? { search_terms: scooter.search_terms } : {}),
          ...(scooter.youtube_video_id !== undefined ? { youtube_video_id: scooter.youtube_video_id } : {}),
          ...(scooter.affiliate_link !== undefined ? { affiliate_link: scooter.affiliate_link } : {}),
          ...(scooter.technical_signature !== undefined ? { technical_signature: scooter.technical_signature } : {}),
          ...fitmentPatch,
          ...specPatch,
        };

        const displayName = scooter.name ?? (existing.name as string) ?? scooter.slug;

        // Payload sans aucune clé exploitable → no-op assumé (rien à écrire).
        // C'est le chemin du 2e appel { slug } + publishIfComplete de sync-scooters --publish.
        if (Object.keys(partialRow).length === 0) {
          results.updated++;
          await succeeded({ name: displayName, slug: scooter.slug, id: existing.id, status: "updated" });
          continue;
        }

        const { error: updateError } = await supabase
          .from("scooter_models")
          .update(partialRow)
          .eq("id", existing.id);

        if (updateError) {
          results.errors.push({ name: displayName, error: updateError.message });
          results.rows.push({ name: displayName, slug: scooter.slug, id: existing.id, status: "error" });
        } else {
          results.updated++;
          await succeeded({ name: displayName, slug: scooter.slug, id: existing.id, status: "updated" });
        }
      } else {
        // ── INSERT : comportement historique conservé (défauts || null, draft). ──
        if (!scooter.name) {
          results.errors.push({ name: "unknown", error: `name is required to create a new scooter (slug=${scooter.slug})` });
          results.rows.push({ name: "unknown", slug: scooter.slug, id: null, status: "skipped" });
          continue;
        }

        const row = {
          brand_id: brand.id,
          name: scooter.name,
          slug: scooter.slug,
          image_url: scooter.image_url || null,
          power_watts: scooter.power_watts || null,
          range_km: scooter.range_km || null,
          max_speed_kmh: scooter.max_speed_kmh || null,
          voltage: scooter.voltage || null,
          amperage: scooter.amperage || null,
          tire_size: scooter.tire_size || null,
          year: scooter.year || null,
          description: scooter.description || null,
          meta_title: scooter.meta_title || null,
          meta_description: scooter.meta_description || null,
          search_terms: scooter.search_terms || null,
          youtube_video_id: scooter.youtube_video_id || null,
          affiliate_link: scooter.affiliate_link || null,
          technical_signature: scooter.technical_signature || {},
          published: false, // Bot imports always start as drafts
          ...fitmentPatch,
          ...specPatch,
        };

        const { data: insertedRow, error: insertError } = await supabase
          .from("scooter_models")
          .insert(row)
          .select("id")
          .single();

        if (insertError || !insertedRow) {
          results.errors.push({ name: scooter.name, error: insertError?.message || "insert returned no row" });
          results.rows.push({ name: scooter.name, slug: scooter.slug, id: null, status: "error" });
        } else {
          results.inserted++;
          await succeeded({ name: scooter.name, slug: scooter.slug, id: insertedRow.id, status: "inserted" });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        brand: { id: brand.id, name: brandName, slug },
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal error", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

// import.meta.main est false sous `deno test` → pas de Deno.serve, le module reste importable.
if (import.meta.main) {
  Deno.serve(handler);
}
