import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CompatiblePartRich } from "./useCompatiblePartsRich";

// Résultat de recherche = pièce enrichie + son type de match (option B exact/related).
export type ProductSearchRow = CompatiblePartRich & {
  matchType: "exact" | "related";
};

export interface UseProductSearchArgs {
  query: string;
  scooterId?: string | null;
  categoryIds?: string[] | null;
  limit?: number;
  offset?: number;
}

export interface UseProductSearchResult {
  parts: ProductSearchRow[];        // tous les résultats (exact d'abord, déjà ordonné par la RPC)
  exactParts: ProductSearchRow[];   // match_type = 'exact' (mot dans le nom)
  relatedParts: ProductSearchRow[]; // match_type = 'related' (compat / description / specs)
  total: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isActive: boolean; // true dès que la recherche est branchée (query >= 2 car)
}

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 250;

// La RPC renvoie `category` en jsonb -> normalisation vers la shape CompatiblePartRich.
const normalizeCategory = (raw: unknown): CompatiblePartRich["category"] => {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!o.id) return null;
  return {
    id: String(o.id),
    name: String(o.name ?? ""),
    slug: String(o.slug ?? ""),
    icon: (o.icon as string | null) ?? null,
    color: (o.color as string | null) ?? null,
  };
};

/**
 * Recherche full-text produits via la RPC Postgres `search_parts_fuzzy`
 * (pg_trgm word_similarity + fallback ILIKE, JOIN compat au query-time).
 * Cumulable avec un scooter sélectionné et/ou des catégories cochées.
 * Désactivée tant que la requête fait moins de 2 caractères.
 */
export const useProductSearch = ({
  query,
  scooterId = null,
  categoryIds = null,
  limit = 24,
  offset = 0,
}: UseProductSearchArgs): UseProductSearchResult => {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const trimmed = debouncedQuery.trim();
  const isActive = trimmed.length >= MIN_QUERY_LENGTH;

  // Clé stable : un tableau vide et null doivent matcher le même cache.
  const catKey = categoryIds && categoryIds.length > 0 ? [...categoryIds].sort() : null;

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ["product-search", trimmed, scooterId ?? null, catKey, limit, offset],
    queryFn: async (): Promise<ProductSearchRow[]> => {
      const { data, error } = await supabase.rpc("search_parts_fuzzy", {
        q: trimmed,
        p_scooter_id: scooterId ?? null,
        p_category_ids: catKey,
        p_limit: limit,
        p_offset: offset,
      });
      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        price: row.price,
        image_url: row.image_url,
        images: (row.images as unknown as CompatiblePartRich["images"]) ?? null,
        stock_quantity: row.stock_quantity,
        is_featured: row.is_featured,
        created_at: row.created_at,
        category: normalizeCategory(row.category),
        matchType: row.match_type === "related" ? "related" : "exact",
      }));
    },
    enabled: isActive,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const rows = data ?? [];

  return {
    parts: rows,
    exactParts: rows.filter((r) => r.matchType === "exact"),
    relatedParts: rows.filter((r) => r.matchType === "related"),
    total: rows.length,
    isLoading,
    isFetching,
    isError,
    isActive,
  };
};
