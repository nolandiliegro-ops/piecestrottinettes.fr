import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompatiblePartsRich, type CompatiblePartRich } from "./useCompatiblePartsRich";

export interface CategoryMetaV2 {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  display_order: number | null;
  display_order_home: number | null;
  color: string | null;
  image_url: string | null;
}

export interface CategoryGroupV2 {
  id: string;          // representative category id
  name: string;        // representative display name
  slug: string;        // representative slug (used for state/routing)
  slugs: string[];     // ALL slugs in the dedup group (used for filtering parts)
  icon: string | null;
  display_order: number | null;
  display_order_home: number | null;   // priorité de tri home (fallback display_order)
  color: string | null;       // accent hex from DB (fallback géré côté UI)
  image_url: string | null;   // illustration de la catégorie (bucket category-images)
  count: number;       // SUM across group, on the currently-scoped pool
}

export type ShopMode = "all" | "filtered-cats" | "trotti" | "trotti-cats";

export interface ShopByCategoryDataV2 {
  mode: ShopMode;
  filteredParts: CompatiblePartRich[];
  availableCategories: CategoryGroupV2[];
  totalCount: number;
  isLoading: boolean;
}

const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");

const normalizeName = (s: string): string =>
  s.toLowerCase().normalize("NFD").replace(DIACRITICS_RE, "").replace(/[^a-z0-9]/g, "");

const useAllParentCategories = () =>
  useQuery<CategoryMetaV2[], Error>({
    queryKey: ["all-parent-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, icon, display_order, display_order_home, color, image_url")
        .is("parent_id", null)
        .eq("show_on_home", true)
        .order("display_order_home", { ascending: true, nullsFirst: false })
        .order("display_order", { ascending: true, nullsFirst: false })
        .order("name", { ascending: true });
      if (error) throw error;
      return (data || []).map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        display_order: c.display_order,
        display_order_home: c.display_order_home,
        color: c.color,
        image_url: c.image_url,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

const normalizeCategory = (raw: unknown): CompatiblePartRich["category"] => {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    const first = raw[0] as Record<string, unknown> | undefined;
    if (!first) return null;
    return {
      id: String(first.id ?? ""),
      name: String(first.name ?? ""),
      slug: String(first.slug ?? ""),
      icon: (first.icon as string | null) ?? null,
      color: (first.color as string | null) ?? null,
    };
  }
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    return {
      id: String(o.id ?? ""),
      name: String(o.name ?? ""),
      slug: String(o.slug ?? ""),
      icon: (o.icon as string | null) ?? null,
      color: (o.color as string | null) ?? null,
    };
  }
  return null;
};

/**
 * All published parts, capped at 150 (D1).
 * Ordered is_featured DESC, created_at DESC.
 * Source for "all" / "filtered-cats" modes (no scooter selected).
 */
// 18/10 : avec une catégorie choisie, on interroge la base SUR cette catégorie (avant : on filtrait
// l'échantillon des 150 plus récentes → « Plaquettes 57 » affichait « Aucune pièce » dès que
// l'import de pneus a rempli l'échantillon).
const useAllPublishedParts = (enabled: boolean, slugs: string[] = []) =>
  useQuery<CompatiblePartRich[], Error>({
    queryKey: ["all-published-parts", slugs.length ? 150 : 1000, slugs],
    queryFn: async () => {
      let req = supabase
        .from("parts")
        .select(
          slugs.length
            ? `id, name, slug, price, image_url, images, stock_quantity, is_featured,
           created_at, category:categories!inner(id, name, slug, icon, color)`
            : `id, name, slug, price, image_url, images, stock_quantity, is_featured,
           created_at, fitment_specs, category:categories(id, name, slug, icon, color)`
        )
        .eq("published", true);
      if (slugs.length) req = req.in("category.slug", slugs);
      const { data, error } = await req
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        // 19/10 : sans filtre on prend tout le catalogue publié (≈ 660 lignes légères) pour pouvoir mélanger les
        // catégories ; les 150 derniers ne contenaient que le dernier import (chargeurs).
        .limit(slugs.length ? 150 : 1000);
      if (error) throw error;

      type Row = {
        id: string; name: string; slug: string; price: number | null; image_url: string | null;
        images: unknown; stock_quantity: number | null; is_featured: boolean | null; created_at: string;
        category: unknown; fitment_specs?: { brake_caliper?: unknown } | null;
      };
      return ((data || []) as unknown as Row[]).map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        image_url: p.image_url,
        images: (p.images as unknown as CompatiblePartRich["images"]) ?? null,
        stock_quantity: p.stock_quantity,
        is_featured: p.is_featured,
        created_at: p.created_at,
        category: normalizeCategory(p.category),
        // 19/10 : familles d'étrier, lues seulement pour écarter les plaquettes vélo de la rangée « Tout ».
        calipers: Array.isArray(p.fitment_specs?.brake_caliper) ? (p.fitment_specs!.brake_caliper as string[]) : null,
      }));
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

/**
 * 18/10 : la grille n'affiche que 150 pièces (D1), mais le compteur et les nombres par
 * catégorie doivent refléter TOUT le catalogue publié (l'accueil affichait « 150 pièces »
 * pour 302 publiées). Requête légère : seulement le slug de catégorie, paginée par 1 000.
 */
const useAllPublishedCategorySlugs = (enabled: boolean) =>
  useQuery<(string | null)[], Error>({
    queryKey: ["all-published-category-slugs"],
    queryFn: async () => {
      const out: (string | null)[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase
          .from("parts")
          .select("id, category:categories(slug)")
          .eq("published", true)
          .order("id", { ascending: true })
          .range(from, from + 999);
        if (error) throw error;
        for (const p of data || []) out.push(normalizeCategory(p.category)?.slug ?? null);
        if (!data || data.length < 1000) break;
      }
      return out;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

/**
 * 19/10 (Nolan) : familles d'étrier réellement montées sur une trottinette publiée. Une plaquette dont
 * AUCUNE famille n'y figure (Sram vélo, Shimano XTR, Hope, Magura 9.C…) reste en vente mais ne s'affiche
 * pas dans la rangée « Tout » de l'accueil. Lu en base, jamais une liste en dur.
 */
const useScooterCaliperFamilies = (enabled: boolean) =>
  useQuery<Set<string>, Error>({
    queryKey: ["scooter-caliper-families"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scooter_models")
        .select("caliper_family")
        .eq("published", true)
        .not("caliper_family", "is", null)
        .limit(1000);
      if (error) throw error;
      return new Set((data || []).map((r) => String(r.caliper_family)));
    },
    enabled,
    staleTime: 30 * 60 * 1000,
  });

const buildGroups = (
  cats: CategoryMetaV2[],
  countSlugToTotal: Map<string, number>
): CategoryGroupV2[] => {
  // Bucket categories by normalized display name (dedup case (a))
  const buckets = new Map<string, CategoryMetaV2[]>();
  for (const c of cats) {
    const key = normalizeName(c.name);
    const list = buckets.get(key) ?? [];
    list.push(c);
    buckets.set(key, list);
  }

  const groups: CategoryGroupV2[] = [];
  for (const list of buckets.values()) {
    const sorted = [...list].sort((a, b) => {
      const ao = a.display_order ?? Number.POSITIVE_INFINITY;
      const bo = b.display_order ?? Number.POSITIVE_INFINITY;
      if (ao !== bo) return ao - bo;
      return a.name.localeCompare(b.name);
    });
    const rep = sorted[0];
    const summedCount = list.reduce((acc, c) => acc + (countSlugToTotal.get(c.slug) ?? 0), 0);
    groups.push({
      id: rep.id,
      name: rep.name,
      slug: rep.slug,
      slugs: list.map((c) => c.slug),
      icon: rep.icon,
      display_order: rep.display_order,
      display_order_home: rep.display_order_home,
      color: rep.color,
      image_url: rep.image_url,
      count: summedCount,
    });
  }

  return groups
    .filter((g) => g.count > 0)
    .sort((a, b) => {
      // Tri home : display_order_home prioritaire, fallback display_order si null.
      const ao = a.display_order_home ?? a.display_order ?? Number.POSITIVE_INFINITY;
      const bo = b.display_order_home ?? b.display_order ?? Number.POSITIVE_INFINITY;
      if (ao !== bo) return ao - bo;
      return a.name.localeCompare(b.name);
    });
};

export const useShopByCategoryDataV2 = (
  scooterModelId: string | null | undefined,
  selectedCategories: Set<string>
): ShopByCategoryDataV2 => {
  const hasScooter = !!scooterModelId;

  const { data: allCategories = [], isLoading: catsLoading } = useAllParentCategories();
  const { data: compatParts = [], isLoading: compatLoading } =
    useCompatiblePartsRich(scooterModelId);
  // Slugs réels derrière les catégories choisies (une carte peut regrouper plusieurs catégories homonymes).
  const selectedSlugList = useMemo(() => {
    if (selectedCategories.size === 0) return [] as string[];
    const names = new Set(
      allCategories.filter((c) => selectedCategories.has(c.slug)).map((c) => normalizeName(c.name))
    );
    return allCategories.filter((c) => names.has(normalizeName(c.name))).map((c) => c.slug).sort();
  }, [allCategories, selectedCategories]);
  const { data: allParts = [], isLoading: allLoading } = useAllPublishedParts(
    !hasScooter && (selectedCategories.size === 0 || selectedSlugList.length > 0),
    selectedSlugList
  );
  const { data: allSlugs } = useAllPublishedCategorySlugs(!hasScooter);
  const { data: scooterCalipers } = useScooterCaliperFamilies(!hasScooter);

  return useMemo<ShopByCategoryDataV2>(() => {
    // Determine the pool of parts in the current scope (scooter or all)
    const scopedParts: CompatiblePartRich[] = hasScooter ? compatParts : allParts;

    // Build per-slug counts FROM the scoped pool (so counts reflect what's actually shown)
    const countBySlug = new Map<string, number>();
    // Sans trott : compter sur tout le catalogue publié (pas seulement les 150 affichées).
    const countSource: (string | null)[] =
      !hasScooter && allSlugs ? allSlugs : scopedParts.map((p) => p.category?.slug ?? null);
    for (const slug of countSource) {
      if (!slug) continue;
      countBySlug.set(slug, (countBySlug.get(slug) ?? 0) + 1);
    }

    const availableCategories = buildGroups(allCategories, countBySlug);

    // Resolve the active filter: union of slugs[] of selected representative slugs
    const activeSlugsSet = new Set<string>();
    if (selectedCategories.size > 0) {
      for (const group of availableCategories) {
        if (selectedCategories.has(group.slug)) {
          for (const s of group.slugs) activeSlugsSet.add(s);
        }
      }
    }

    // 19/10 (Nolan) : sur « Tout », un produit de chaque catégorie à tour de rôle (sinon la dernière catégorie
    // importée — les chargeurs — occupe toute la rangée). Ordre de tour : forte marge d'abord.
    const interleave = (list: CompatiblePartRich[]) => {
      const RANK = ["pneus", "chambres-a-air", "plaquettes", "chargeurs", "pneus-pleins", "disques"];
      const buckets = new Map<string, CompatiblePartRich[]>();
      for (const p of list) { const k = p.category?.slug ?? "_"; if (!buckets.has(k)) buckets.set(k, []); buckets.get(k)!.push(p); }
      const keys = [...buckets.keys()].sort((x, y) => (RANK.indexOf(x) + 1 || 99) - (RANK.indexOf(y) + 1 || 99));
      const out: CompatiblePartRich[] = [];
      for (let i = 0; out.length < list.length; i++) for (const k of keys) { const b = buckets.get(k)!; if (i < b.length) out.push(b[i]); }
      return out;
    };
    const filteredParts =
      activeSlugsSet.size === 0
        ? interleave(
            hasScooter || !scooterCalipers
              ? scopedParts
              : scopedParts.filter((p) => {
                  const cal = (p as CompatiblePartRich & { calipers?: string[] | null }).calipers;
                  return !cal || cal.length === 0 || cal.some((c) => scooterCalipers.has(c));
                })
          )
        : scopedParts.filter((p) => p.category && activeSlugsSet.has(p.category.slug));

    let mode: ShopMode;
    if (hasScooter && selectedCategories.size > 0) mode = "trotti-cats";
    else if (hasScooter) mode = "trotti";
    else if (selectedCategories.size > 0) mode = "filtered-cats";
    else mode = "all";

    return {
      mode,
      filteredParts,
      availableCategories,
      totalCount:
        !hasScooter && allSlugs
          ? activeSlugsSet.size === 0
            ? allSlugs.length
            : allSlugs.filter((sl) => sl !== null && activeSlugsSet.has(sl)).length
          : filteredParts.length,
      isLoading: catsLoading || (hasScooter ? compatLoading : allLoading),
    };
  }, [
    hasScooter,
    allCategories,
    compatParts,
    allParts,
    allSlugs,
    scooterCalipers,
    selectedCategories,
    catsLoading,
    compatLoading,
    allLoading,
  ]);
};
