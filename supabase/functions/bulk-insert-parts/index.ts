import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  suggestCompatibilities,
  resolveCompatibilityHints,
  isElectricalPart,
  isTirePart,
  type CompatibilityHints,
} from "../_shared/compatibility-helpers.ts";
import { suggestCompatibilitiesAI } from "../_shared/ai_matcher.ts";

// Re-exports pour préserver la compat des consommateurs / tests historiques
// qui pouvaient importer depuis ce fichier.
export {
  corsHeaders,
  extractTireSizeFromName,
  extractVoltageFromName,
  buildTireSizeRegex,
  resolveCompatibilityHints,
  suggestCompatibilities,
} from "../_shared/compatibility-helpers.ts";
export type { CompatibilityHints, PassAOutcome } from "../_shared/compatibility-helpers.ts";

const ALLOWED_SUPPLIERS = [
  "wattiz", "ewheel", "voltcorp", "bluewaycorp",
  "dualtronstore", "weebot", "autre",
] as const;
type SupplierName = typeof ALLOWED_SUPPLIERS[number];

interface SupplierInput {
  name: SupplierName;
  sku?: string;
  url?: string;
  buy_price_ht?: number;
  stock_supplier?: number;
  shipping_time_days?: number;
  notes?: string;
}

interface PartInput {
  name: string;
  slug: string;
  price?: number;
  image_url?: string;
  description?: string;
  stock_quantity?: number;
  difficulty_level?: number;
  sku?: string;
  meta_title?: string;
  meta_description?: string;
  youtube_video_id?: string;
  estimated_install_time_minutes?: number;
  required_tools?: string[];
  technical_metadata?: Record<string, unknown>;
  is_featured?: boolean;
  supplier?: SupplierInput;
  compatibility_hints?: CompatibilityHints;
  ean?: string;
  characteristics?: string;
  compatibility_source?: string;
  electrical_specs?: Record<string, unknown> | null;
  fitment_specs?: Record<string, unknown> | null;
  // Opt-in de réécriture des champs gelés sur une pièce publiée (cf. allowsOverwrite).
  // Absent = rien n'est libéré. Extensible ("price", "images"…) sans nouveau flag.
  allow_overwrite?: OverwritableField[];
}

interface RequestBody {
  categoryName: string;
  categorySlug?: string;
  parts: PartInput[];
  skip_ai?: boolean;
}

interface Results {
  inserted: number;
  updated: number;
  suppliers_added: number;
  compatibilities_suggested: number;
  compatibilities_suggested_ai: number;
  ai_calls: number;
  errors: { name: string; error: string }[];
  rows: { name: string; slug: string; id: string | null; status: "inserted" | "updated" | "skipped" | "error" }[];
}

// =====================================================================
// RÉSOLUTION CATÉGORIE — helpers purs (testables, sans I/O)
// =====================================================================

/**
 * Slug canonique — COPIE EXACTE du slugify de src/components/admin/CategoriesManager.tsx.
 * NFD + strip des diacritiques (à → a) pour produire le MÊME slug que l'UI admin.
 * « Chambres à air » → "chambres-a-air".
 */
const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");

export function canonicalSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS_RE, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Nom normalisé pour le matching insensible casse/accents/espaces de bord.
 * « Chambres à Air  » → "chambres a air".
 */
export function normalizeName(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS_RE, "")
    .trim();
}

interface ExistingCategory {
  id: string;
  name: string;
  slug: string;
}

// ─── Convention d'override unique ──────────────────────────────────────────────
// Règle générale : sur une pièce PUBLIÉE, certains champs sont gelés — ils portent
// une valeur que l'app ou le SEO ont acquise et qu'un ré-import ne doit pas écraser.
// On libère champ par champ, pièce par pièce, via part.allow_overwrite.
// Une seule convention pour tous les champs gelables, plutôt qu'un flag ad hoc par cas.
export type OverwritableField = "slug" | "seo";

// true UNIQUEMENT si le champ est explicitement listé. Clé absente, valeur non
// tableau, ou entrée non-string → false (pas de libération par accident).
export function allowsOverwrite(
  part: { allow_overwrite?: unknown },
  field: OverwritableField,
): boolean {
  const list = part?.allow_overwrite;
  if (!Array.isArray(list)) return false;
  return list.some((f) => typeof f === "string" && f.trim() === field);
}

export type CategoryMatchResult =
  | { status: "ok"; id: string }
  | { status: "unknown" }
  | { status: "ambiguous"; slugs: string[] };

/**
 * Match-ou-flag : résout une catégorie d'import contre les catégories EXISTANTES,
 * sans jamais en créer ni en deviner.
 *  - 0 candidat  → { status: "unknown" }     (catégorie à créer dans l'admin)
 *  - 1 candidat  → { status: "ok", id }
 *  - ≥2 candidats → { status: "ambiguous", slugs } (doublon en base, à merger)
 *
 * Un candidat = ligne dont le slug égale le slug canonique OU dont le nom
 * normalisé égale le nom normalisé recherché. Dédupliqué par id.
 */
export function resolveCategoryMatch(
  categoryName: string,
  categorySlug: string | undefined,
  existing: ExistingCategory[],
): CategoryMatchResult {
  const slug = (categorySlug && categorySlug.trim()) || canonicalSlug(categoryName);
  const normName = normalizeName(categoryName);

  const byId = new Map<string, ExistingCategory>();
  for (const c of existing) {
    if (c.slug === slug || normalizeName(c.name) === normName) {
      byId.set(c.id, c);
    }
  }

  const candidates = [...byId.values()];
  if (candidates.length === 0) return { status: "unknown" };
  if (candidates.length === 1) return { status: "ok", id: candidates[0].id };
  return { status: "ambiguous", slugs: candidates.map((c) => c.slug).sort() };
}

// =====================================================================
// ÉTAPES MÉTIER
// =====================================================================

async function upsertSupplier(
  supabase: SupabaseClient,
  partId: string,
  supplier: SupplierInput,
): Promise<boolean> {
  if (!ALLOWED_SUPPLIERS.includes(supplier.name)) {
    console.warn(`[bulk-insert-parts] Supplier ignoré (whitelist) : ${supplier.name}`);
    return false;
  }

  const { count, error: countErr } = await supabase
    .from("part_suppliers")
    .select("id", { count: "exact", head: true })
    .eq("part_id", partId);

  if (countErr) {
    console.error(`[bulk-insert-parts] Erreur count suppliers ${partId}:`, countErr.message);
    return false;
  }

  const { data: existing } = await supabase
    .from("part_suppliers")
    .select("id, is_primary")
    .eq("part_id", partId)
    .eq("supplier_name", supplier.name)
    .maybeSingle();

  const shouldBePrimary = (count ?? 0) === 0;

  const row = {
    part_id: partId,
    supplier_name: supplier.name,
    supplier_sku: supplier.sku ?? null,
    supplier_url: supplier.url ?? null,
    buy_price_ht: supplier.buy_price_ht ?? null,
    stock_supplier: supplier.stock_supplier ?? null,
    shipping_time_days: supplier.shipping_time_days ?? 2,
    is_primary: existing ? existing.is_primary : shouldBePrimary,
    notes: supplier.notes ?? null,
  };

  const { error: upsertErr } = await supabase
    .from("part_suppliers")
    .upsert(row, { onConflict: "part_id,supplier_name" });

  if (upsertErr) {
    console.error(`[bulk-insert-parts] Erreur upsert supplier ${partId}/${supplier.name}:`, upsertErr.message);
    return false;
  }
  return true;
}

// =====================================================================
// HANDLER
// =====================================================================

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const adminSecret = req.headers.get("x-admin-secret");
    const expectedSecret = Deno.env.get("ADMIN_BULK_SECRET");

    if (!expectedSecret || adminSecret !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body: RequestBody = await req.json();
    const { categoryName, categorySlug, parts } = body;
    const skip_ai = body.skip_ai === true;

    if (!categoryName || !Array.isArray(parts) || parts.length === 0) {
      return new Response(
        JSON.stringify({ error: "categoryName (string) and parts (non-empty array) are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const slug = (categorySlug && categorySlug.trim()) || canonicalSlug(categoryName);
    const autoCreate = Deno.env.get("BULK_AUTOCREATE_CATEGORIES") === "true";

    let category: { id: string };
    // B3 — spec_type de la catégorie résolue (autoritaire pour le routeur famille).
    let categorySpecType: string | null = null;

    if (autoCreate) {
      // FILET DE SECOURS (flag=true) : ancien comportement — upsert par slug,
      // peut créer une catégorie. À n'activer que ponctuellement.
      const { data: cat, error: catError } = await supabase
        .from("categories")
        .upsert({ name: categoryName, slug }, { onConflict: "slug" })
        .select("id, spec_type")
        .single();

      if (catError || !cat) {
        return new Response(
          JSON.stringify({ error: "Failed to upsert category", detail: catError?.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      category = { id: cat.id };
      categorySpecType = (cat as { spec_type?: string | null }).spec_type ?? null;
    } else {
      // MODE PAR DÉFAUT (flag=false) : match-ou-flag. AUCUNE écriture dans categories.
      const { data: existing, error: listError } = await supabase
        .from("categories")
        .select("id, name, slug, spec_type");

      if (listError || !existing) {
        return new Response(
          JSON.stringify({ error: "Failed to load categories", detail: listError?.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const match = resolveCategoryMatch(categoryName, categorySlug, existing);

      if (match.status === "unknown") {
        return new Response(
          JSON.stringify({
            error: "Catégorie inconnue",
            categoryName,
            slug,
            hint: "Créer la catégorie dans l'admin (CategoriesManager) avant import.",
          }),
          { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (match.status === "ambiguous") {
        return new Response(
          JSON.stringify({
            error: "Doublon en base",
            categoryName,
            duplicate_slugs: match.slugs,
            hint:
              `Doublon en base (${match.slugs.length} lignes : ${match.slugs.join(", ")}) ` +
              `— à merger avant import.`,
          }),
          { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      category = { id: match.id };
      categorySpecType =
        (existing as Array<{ id: string; spec_type?: string | null }>)
          .find((c) => c.id === match.id)?.spec_type ?? null;
    }

    const results: Results = {
      inserted: 0,
      updated: 0,
      suppliers_added: 0,
      compatibilities_suggested: 0,
      compatibilities_suggested_ai: 0,
      ai_calls: 0,
      errors: [],
      rows: [],
    };

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      console.warn("[bulk-insert-parts] ANTHROPIC_API_KEY absente — Passe B IA désactivée");
    }

    for (const part of parts) {
      try {
        if (!part.name || !part.slug) {
          results.errors.push({ name: part.name || "unknown", error: "name and slug are required" });
          results.rows.push({ name: part.name || "unknown", slug: part.slug || "", id: null, status: "skipped" });
          continue;
        }

        const row = {
          category_id: category.id,
          name: part.name,
          slug: part.slug,
          price: part.price ?? null,
          image_url: part.image_url || null,
          description: part.description || null,
          stock_quantity: part.stock_quantity ?? 0,
          difficulty_level: part.difficulty_level ?? null,
          sku: part.sku || null,
          meta_title: part.meta_title || null,
          meta_description: part.meta_description || null,
          youtube_video_id: part.youtube_video_id || null,
          estimated_install_time_minutes: part.estimated_install_time_minutes ?? null,
          required_tools: part.required_tools || null,
          technical_metadata: part.technical_metadata || {},
          is_featured: part.is_featured ?? false,
          published: false,
          ean: part.ean ?? null,
          characteristics: part.characteristics ?? null,
          compatibility_source: part.compatibility_source ?? null,
          // Guard preserve : clé posée UNIQUEMENT si le payload la fournit.
          // Absente → .update() ne touche pas la colonne (backfill préservé) ;
          // à l'insert → DEFAULT (null). Miroir du guard du script sync.
          ...(part.electrical_specs != null
            ? { electrical_specs: part.electrical_specs }
            : {}),
          ...(part.fitment_specs != null
            ? { fitment_specs: part.fitment_specs }
            : {}),
        };

        // ── Matching en cascade : SKU prioritaire, puis slug ───────────────────
        // 1) sku non vide + ligne avec ce sku → UPDATE cette ligne (pièce renommée :
        //    slug différent mais même Référence constructeur). parts.sku est UNIQUE
        //    (parts_sku_key) : un INSERT avec un sku déjà pris échouerait, d'où le match.
        // 2) sinon ligne avec le même slug     → UPDATE par slug (comportement historique).
        // 3) sinon                              → INSERT.
        // Pièces SANS sku : on saute l'étape 1 (sku UNIQUE autorise plusieurs NULL,
        // donc aucune collision) → comportement strictement inchangé.
        const sku = (part.sku ?? "").trim();
        const selectCols = "id, slug, sku, price, price_override, published, stock_quantity, slug_locked_at, technical_metadata";

        let existing:
          | { id: string; slug: string; sku: string | null; price: number | null;
              price_override: boolean | null; published: boolean; stock_quantity: number;
              slug_locked_at: string | null;
              technical_metadata: Record<string, unknown> | null }
          | null = null;
        let matchedBy: "sku" | "slug" | null = null;

        if (sku) {
          const { data: bySku } = await supabase
            .from("parts").select(selectCols).eq("sku", sku).maybeSingle();
          if (bySku) { existing = bySku; matchedBy = "sku"; }
        }

        if (!existing) {
          const { data: bySlug } = await supabase
            .from("parts").select(selectCols).eq("slug", part.slug).maybeSingle();
          if (bySlug) { existing = bySlug; matchedBy = "slug"; }
        }

        const wasNew = !existing;

        // ── Gel du slug des pièces publiées ────────────────────────────────────
        // Le slug d'une pièce publiée EST une URL indexée (/piece/<slug>) : la changer
        // produit un 404 et détruit le référencement acquis. Il est donc immuable par
        // défaut, quel que soit le slug recalculé côté payload. Opt-in explicite via
        // allow_overwrite pour le libérer (le commit qui écrit les alias de redirection
        // viendra ensuite ; tant qu'il n'est pas là, préférer ne pas libérer).
        // Pièce non publiée → comportement historique inchangé (le slug suit le nom).
        //
        // Calculé ICI, avant le garde-fou collision : celui-ci doit raisonner sur le slug
        // réellement écrit. Le placer après comparerait contre un part.slug qu'on n'écrit
        // pas quand le gel s'applique → rejet à tort d'une pièce valide.
        // Gel si publiée OU si le slug a déjà été publié un jour (slug_locked_at,
        // write-once posé par trigger) : ferme la fenêtre dépublication → republication.
        const freezeSlug =
          (existing?.published === true || existing?.slug_locked_at != null) &&
          !allowsOverwrite(part, "slug");
        const effectiveSlug = freezeSlug ? existing!.slug : part.slug;
        row.slug = effectiveSlug;

        // ── Garde-fou collision slug ───────────────────────────────────────────
        // On va écrire slug = effectiveSlug. Si une AUTRE ligne (id différent) le détient
        // déjà, l'écriture violerait parts_slug_unique → erreur claire, aucune pièce
        // écrasée (ne peut survenir que sur un match par sku qui change le slug).
        // Sous gel, effectiveSlug === existing.slug : la condition est fausse et le
        // garde-fou ne s'exécute pas — il n'y a plus de changement de slug à protéger.
        if (existing && existing.slug !== effectiveSlug) {
          const { data: slugOwner } = await supabase
            .from("parts").select("id, sku").eq("slug", effectiveSlug).maybeSingle();
          if (slugOwner && slugOwner.id !== existing.id) {
            const msg =
              `Collision slug : "${effectiveSlug}" déjà utilisé par une autre pièce ` +
              `(sku=${slugOwner.sku ?? "—"}, id=${slugOwner.id}). Pièce non écrasée.`;
            results.errors.push({ name: part.name, error: msg });
            results.rows.push({ name: part.name, slug: effectiveSlug, id: existing.id, status: "error" });
            continue;
          }
        }

        // Override admin prioritaire (logique "Option B", cf. images) : si la pièce
        // existe et price_override=true, on NE réécrase PAS le prix depuis Airtable —
        // on conserve la valeur en base. price_override n'est jamais inclus dans `row`,
        // donc l'update laisse le flag intact ; à l'insert il prend le DEFAULT false ;
        // seul l'admin le pose.
        if (existing?.price_override === true) {
          row.price = existing.price;
        }

        // Même principe pour published et stock_quantity : pilotés DANS l'app (admin),
        // jamais par Airtable. Sur une pièce déjà en base, on conserve l'existant au lieu
        // de l'écraser (sinon re-dépublication + stock remis à 0 à chaque sync).
        // Nouvelle pièce (pas d'existing) : comportement initial conservé via le row
        // (published:false, stock_quantity: part.stock_quantity ?? 0).
        if (existing) {
          row.published = existing.published;
          row.stock_quantity = existing.stock_quantity;
          // Fusion technical_metadata : sac JSON partagé entre writers (airtable_id posé
          // par sync-airtable, absent du payload de sync-parts). Merge shallow — les clés
          // du payload gagnent, les clés existantes absentes du payload survivent. PAS un
          // guard-preserve : le payload sync-airtable envoie toujours un bag partiel, la
          // clé serait présente et l'écrasement total persisterait.
          row.technical_metadata = {
            ...(existing.technical_metadata ?? {}),
            ...(part.technical_metadata ?? {}),
          };
        }

        // ── Écriture : UPDATE ciblé par id si match (le slug peut changer), sinon INSERT.
        // On n'utilise plus upsert(onConflict:"slug") : sur un slug modifié il tenterait
        // un INSERT et rebutterait sur parts_sku_key. L'UPDATE par id contourne ça.
        let partId: string;
        if (existing) {
          const { error: updateError } = await supabase
            .from("parts").update(row).eq("id", existing.id);
          if (updateError) {
            results.errors.push({ name: part.name, error: updateError.message });
            results.rows.push({ name: part.name, slug: effectiveSlug, id: existing.id, status: "error" });
            continue;
          }
          partId = existing.id;
        } else {
          const { data: inserted, error: insertError } = await supabase
            .from("parts").insert(row).select("id").maybeSingle();
          if (insertError || !inserted) {
            results.errors.push({ name: part.name, error: insertError?.message ?? "insert returned no row" });
            results.rows.push({ name: part.name, slug: effectiveSlug, id: null, status: "error" });
            continue;
          }
          partId = inserted.id as string;
        }
        let suppliersAddedThis = 0;
        let passACount = 0;
        let passBCount = 0;
        let aiDurationMs = 0;
        let aiStatus = "skipped";

        if (wasNew) results.inserted++;
        else results.updated++;
        // slug = celui RÉELLEMENT écrit (gel appliqué), pas celui proposé par le payload :
        // l'appelant s'en sert pour relire l'état image en base (fetchPartsImageState).
        // Renvoyer le slug du payload ferait porter la lecture sur une ligne inexistante
        // → pièce vue "sans image" → ré-détourage à chaque run.
        results.rows.push({ name: part.name, slug: effectiveSlug, id: partId, status: wasNew ? "inserted" : "updated" });

        if (part.supplier && part.supplier.name) {
          try {
            const ok = await upsertSupplier(supabase, partId, part.supplier);
            if (ok) {
              results.suppliers_added++;
              suppliersAddedThis = 1;
            }
          } catch (e) {
            console.error(`[bulk-insert-parts] supplier exception ${part.name}:`, e);
            results.errors.push({ name: part.name, error: `supplier: ${String(e)}` });
          }
        }

        // Suggestions compat UNIQUEMENT à la création
        if (wasNew) {
          const { count } = await supabase
            .from("part_compatibility")
            .select("id", { count: "exact", head: true })
            .eq("part_id", partId);

          if ((count ?? 0) === 0) {
            // Passe A — regex specs
            const hints = resolveCompatibilityHints(part);
            let passAScooterIds = new Set<string>();
            if (hints) {
              try {
                const passA = await suggestCompatibilities(supabase, partId, hints);
                passACount = passA.count;
                passAScooterIds = passA.scooterIds;
                results.compatibilities_suggested += passA.count;
              } catch (e) {
                console.error(`[bulk-insert-parts] suggestion A exception ${part.name}:`, e);
                results.errors.push({ name: part.name, error: `compat A: ${String(e)}` });
              }
            }

            // Passe B — IA Claude (jamais bloquante) — SAUF pièces électriques
            const electricalSpecs = (part.electrical_specs ?? null) as
              | { voltages?: number[]; connector?: string | null }
              | null;
            if (
              isElectricalPart({
                specType: categorySpecType,
                categorySlug: slug,
                electrical_specs: electricalSpecs,
              })
            ) {
              // B3 — famille électrique → intersection voltage (Passe A) + skip IA.
              console.log(`[bulk-insert-parts] pièce électrique → Passe B IA skippée pour ${part.name}`);
              aiStatus = "skipped_electrical";
            } else if (isTirePart({ specType: categorySpecType })) {
              // B3 — famille pneu → tire_size (Passe A) + skip IA.
              console.log(`[bulk-insert-parts] pneu → Passe B IA skippée pour ${part.name}`);
              aiStatus = "skipped_tire";
            } else if (!skip_ai && anthropicKey) {
              try {
                const passB = await suggestCompatibilitiesAI(
                  supabase,
                  partId,
                  {
                    name: part.name,
                    description: part.description ?? null,
                    technical_metadata: part.technical_metadata ?? null,
                    category: categoryName,
                    categorySlug: slug,
                    categorySpecType,
                    electrical_specs: electricalSpecs,
                  },
                  passAScooterIds,
                  anthropicKey,
                );
                passBCount = passB.count;
                aiDurationMs = passB.durationMs;
                aiStatus = passB.status;
                results.compatibilities_suggested_ai += passB.count;
                results.ai_calls += 1;
              } catch (e) {
                console.error(`[bulk-insert-parts] AI matcher exception ${part.name}:`, e);
                aiStatus = "error";
              }
            } else if (skip_ai) {
              console.log(`[bulk-insert-parts] skip_ai=true → Passe B IA désactivée pour ${part.name}`);
              aiStatus = "skipped_by_flag";
            }
          }
        }

        console.log(
          `[bulk-insert-parts] PIECE "${part.name}" ` +
          `${wasNew ? "CREATED" : "UPDATED"} matched_by=${matchedBy ?? "new"} ` +
          `suppliers_added=${suppliersAddedThis} ` +
          `passe_A_matched=${passACount} passe_B_matched=${passBCount} ` +
          `total_unique=${passACount + passBCount} ` +
          `api_call_time_ms=${aiDurationMs} ai_status=${aiStatus}`,
        );
      } catch (loopErr) {
        console.error(`[bulk-insert-parts] Exception part loop:`, loopErr);
        results.errors.push({ name: part.name || "unknown", error: String(loopErr) });
        results.rows.push({ name: part.name || "unknown", slug: part.slug || "", id: null, status: "error" });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        category: { id: category.id, name: categoryName, slug },
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[bulk-insert-parts] Internal error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
};

// En production l'Edge Function démarre le serveur ; en test (import du module)
// import.meta.main est false → pas de Deno.serve, le module reste importable.
if (import.meta.main) {
  Deno.serve(handler);
}
