import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAllParts, type CataloguePart } from "@/hooks/useCatalogueData";

// Ligne catégorie complète pour la page front /categorie/:slug (Palier 3).
// `categories` = source canonique unique. Pas de colonne `published` : toutes les
// catégories sont live, le 404 (slug introuvable) est géré par la page (SB2), sans redirect.
export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  seo_name: string | null;
  description: string | null;
  image_url: string | null;
  alt_text: string | null;
  accent_label: string | null;
  neon_color: string | null;
  color: string | null;
  lucide_icon: string | null;
  meta_title: string | null;
  meta_description: string | null;
  product_count: number | null;
}

const CATEGORY_COLUMNS =
  "id, name, slug, seo_name, description, image_url, alt_text, accent_label, neon_color, color, lucide_icon, meta_title, meta_description, product_count";

// A. Une catégorie par slug (null si introuvable → 404 géré côté page).
const useCategoryBySlug = (slug?: string) =>
  useQuery({
    queryKey: ["category-by-slug", slug],
    queryFn: async (): Promise<CategoryData | null> => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("categories")
        .select(CATEGORY_COLUMNS)
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as CategoryData) ?? null;
    },
    enabled: !!slug,
  });

export const useCategoryData = (slug: string | undefined) => {
  const { data: category, isLoading: categoryLoading } = useCategoryBySlug(slug);

  // Pièces de la catégorie (réutilise le hook catalogue ; déjà triées par name).
  const { data: rawParts = [] } = useAllParts(category?.id ?? null);

  // Tri DISPO-FIRST en 3 buckets concaténés (partition stable, ordre conservé dans chaque bucket) :
  //   1. dispo (stock null || > 0) ET mis en avant (is_featured)
  //   2. dispo ET non mis en avant
  //   3. rupture (stock === 0)
  const parts = useMemo<CataloguePart[]>(() => {
    const featured = rawParts.filter((p) => (p.stock_quantity === null || p.stock_quantity > 0) && p.is_featured);
    const inStock = rawParts.filter((p) => (p.stock_quantity === null || p.stock_quantity > 0) && !p.is_featured);
    const outOfStock = rawParts.filter((p) => p.stock_quantity === 0);
    return [...featured, ...inStock, ...outOfStock];
  }, [rawParts]);

  return {
    category: category ?? null,
    parts,
    // La page est "loading" tant qu'on ne sait pas si la catégorie existe (même logique que useBrandData).
    isLoading: categoryLoading,
  };
};
