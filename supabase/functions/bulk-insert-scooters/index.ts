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

// Charge les 7 référentiels fitment_* en Set<string>, une fois par requête.
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
      errors: [] as { name: string; error: string }[],
      // Codes de montage hors référentiel : colonne sautée, modèle quand même traité.
      warnings: [] as FitmentWarning[],
      rows: [] as { name: string; slug: string; id: string | null; status: "inserted" | "updated" | "skipped" | "error" }[],
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

      // 9 clés de montage — guard-preserve + validation référentiel (voir
      // fitmentCodeFields) : clé absente / vide / hors référentiel → colonne
      // JAMAIS touchée (pas d'écrasement par NULL, pas de code inconnu).
      const fitmentPatch = fitmentCodeFields(scooter, vocab, results.warnings);

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
        };

        const displayName = scooter.name ?? (existing.name as string) ?? scooter.slug;

        // Payload sans aucune clé exploitable → no-op assumé (rien à écrire).
        if (Object.keys(partialRow).length === 0) {
          results.updated++;
          results.rows.push({ name: displayName, slug: scooter.slug, id: existing.id, status: "updated" });
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
          results.rows.push({ name: displayName, slug: scooter.slug, id: existing.id, status: "updated" });
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
          results.rows.push({ name: scooter.name, slug: scooter.slug, id: insertedRow.id, status: "inserted" });
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
