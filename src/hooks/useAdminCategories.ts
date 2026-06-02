import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import imageCompression from "browser-image-compression";

// Source unique d'édition des catégories (Palier 2, bloc B).
// TOUTES les écritures pointent `categories` — `category_images` n'est plus touchée.

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;            // emoji legacy : conservé en BDD, plus édité côté UI
  lucide_icon: string | null;
  display_order: number | null;
  display_order_home: number | null;
  show_on_home: boolean;
  parent_id: string | null;
  product_count: number | null;
  meta_title: string | null;
  meta_description: string | null;
  color: string | null;
  neon_color: string | null;
  accent_label: string | null;
  alt_text: string | null;
  seo_name: string | null;
  image_url: string | null;
  parts_count: number;
}

export interface CategoryWrite {
  name: string;
  slug: string;
  lucide_icon: string | null;
  parent_id: string | null;
  display_order: number | null;
  neon_color: string | null;
  accent_label: string | null;
  show_on_home: boolean;
  display_order_home: number | null;
  meta_title: string | null;
  meta_description: string | null;
  alt_text: string | null;
  seo_name: string | null;
}

export const ADMIN_CATEGORIES_KEY = ["admin-categories"] as const;

// Keys publiques à rafraîchir après toute écriture (cohérence admin ↔ home ↔ catalogue).
const RELATED_KEYS: ReadonlyArray<ReadonlyArray<string>> = [
  ["categories"],            // useCategories (catalogue / divers)
  ["all-parent-categories"], // useShopByCategoryDataV2 (home, bloc A)
  ["category-images"],       // useCategoryImages (thumbnails catalogue)
  ["parent-categories"],     // useParentCategories
];

export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const SELECT_COLUMNS =
  "id, name, slug, icon, lucide_icon, display_order, display_order_home, show_on_home, " +
  "parent_id, product_count, meta_title, meta_description, color, neon_color, accent_label, " +
  "alt_text, seo_name, image_url, parts:parts(count)";

const mapRow = (c: any): AdminCategory => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  icon: c.icon ?? null,
  lucide_icon: c.lucide_icon ?? null,
  display_order: c.display_order ?? null,
  display_order_home: c.display_order_home ?? null,
  show_on_home: c.show_on_home ?? true,
  parent_id: c.parent_id ?? null,
  product_count: c.product_count ?? null,
  meta_title: c.meta_title ?? null,
  meta_description: c.meta_description ?? null,
  color: c.color ?? null,
  neon_color: c.neon_color ?? null,
  accent_label: c.accent_label ?? null,
  alt_text: c.alt_text ?? null,
  seo_name: c.seo_name ?? null,
  image_url: c.image_url ?? null,
  parts_count: c.parts?.[0]?.count ?? 0,
});

export const useAdminCategories = () =>
  useQuery({
    queryKey: ADMIN_CATEGORIES_KEY,
    queryFn: async (): Promise<AdminCategory[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select(SELECT_COLUMNS)
        .order("display_order", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data || []).map(mapRow);
    },
  });

const useInvalidateCategories = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ADMIN_CATEGORIES_KEY });
    RELATED_KEYS.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
  };
};

export const useCreateCategory = () => {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: async (input: CategoryWrite): Promise<AdminCategory> => {
      const { data, error } = await supabase
        .from("categories")
        .insert(input)
        .select(SELECT_COLUMNS)
        .single();
      if (error) throw error;
      return mapRow(data);
    },
    onSuccess: invalidate,
  });
};

export const useUpdateCategory = () => {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<CategoryWrite> }) => {
      const { error } = await supabase.from("categories").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
};

export const useDeleteCategory = () => {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: async (category: Pick<AdminCategory, "id">) => {
      // Garde-fous : refuser si pièces liées ou sous-catégories.
      const { count: partsCount } = await supabase
        .from("parts")
        .select("*", { count: "exact", head: true })
        .eq("category_id", category.id);
      if (partsCount && partsCount > 0) {
        throw new Error(`Impossible de supprimer : ${partsCount} pièce(s) liée(s)`);
      }
      const { count: subCount } = await supabase
        .from("categories")
        .select("*", { count: "exact", head: true })
        .eq("parent_id", category.id);
      if (subCount && subCount > 0) {
        throw new Error(`Impossible de supprimer : ${subCount} sous-catégorie(s) liée(s)`);
      }
      // Palier 2 : on n'écrit QUE sur categories (plus de delete category_images).
      const { error } = await supabase.from("categories").delete().eq("id", category.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
};

export const useReorderCategories = () => {
  const invalidate = useInvalidateCategories();
  return useMutation({
    // Upsert batch : 1 seule requête (name/slug requis pour satisfaire NOT NULL,
    // valeurs inchangées ; seul display_order bouge).
    mutationFn: async (ordered: Pick<AdminCategory, "id" | "name" | "slug">[]) => {
      const rows = ordered.map((c, index) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        display_order: index,
      }));
      const { error } = await supabase.from("categories").upsert(rows, { onConflict: "id" });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
};

async function compressImage(file: File): Promise<File> {
  return imageCompression(file, {
    maxWidthOrHeight: 1200,
    maxSizeMB: 0.5,
    fileType: "image/webp",
    useWebWorker: true,
  });
}

function buildSeoFileName(slug: string, seoName: string | null, name: string): string {
  const base = seoName?.trim() || name.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/-+$/, "");
  return `${slug}-${base}.webp`;
}

export const useUploadCategoryImage = () => {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: async ({ category, file }: { category: AdminCategory; file: File }) => {
      const compressed = await compressImage(file);
      const seoFileName = buildSeoFileName(category.slug, category.seo_name, category.name);
      const path = `${category.id}/${seoFileName}`;
      const { error: uploadError } = await supabase.storage
        .from("category-images")
        .upload(path, compressed, { upsert: true, contentType: "image/webp" });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("category-images").getPublicUrl(path);
      const { error } = await supabase
        .from("categories")
        .update({ image_url: urlData.publicUrl })
        .eq("id", category.id);
      if (error) throw error;
      return urlData.publicUrl;
    },
    onSuccess: invalidate,
  });
};
