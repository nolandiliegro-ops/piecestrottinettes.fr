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
const useAllPublishedParts = (enabled: boolean) =>
  useQuery<CompatiblePartRich[], Error>({
    queryKey: ["all-published-parts", 150],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parts")
        .select(
          `id, name, slug, price, image_url, images, stock_quantity, is_featured,
           created_at, category:categories(id, name, slug, icon, color)`
        )
        .eq("published", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(150);
      if (error) throw error;

      return (data || []).map((p) => ({
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
      }));
    },
    enabled,
    staleTime: 5 * 60 * 1000,
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
  const { data: allParts = [], isLoading: allLoading } = useAllPublishedParts(!hasScooter);

  return useMemo<ShopByCategoryDataV2>(() => {
    // Determine the pool of parts in the current scope (scooter or all)
    const scopedParts: CompatiblePartRich[] = hasScooter ? compatParts : allParts;

    // Build per-slug counts FROM the scoped pool (so counts reflect what's actually shown)
    const countBySlug = new Map<string, number>();
    for (const p of scopedParts) {
      const slug = p.category?.slug;
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

    const filteredParts =
      activeSlugsSet.size === 0
        ? scopedParts
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
      totalCount: filteredParts.length,
      isLoading: catsLoading || (hasScooter ? compatLoading : allLoading),
    };
  }, [
    hasScooter,
    allCategories,
    compatParts,
    allParts,
    selectedCategories,
    catsLoading,
    compatLoading,
    allLoading,
  ]);
};
