import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image_url: string | null;
  parts_count: number;
}

export const useCategoryPartsCount = () => {
  return useQuery({
    queryKey: ["category-parts-count"],
    queryFn: async (): Promise<CategoryWithCount[]> => {
      // Get parent categories with part counts (published only)
      const { data, error } = await supabase
        .from("categories")
        .select(`
          id,
          name,
          slug,
          icon,
          image_url,
          parts:parts(count)
        `)
        .eq("parts.published", true)
        .is("parent_id", null)
        .order("display_order");

      if (error) throw error;

      return (data || []).map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        image_url: cat.image_url ?? null,
        parts_count: cat.parts?.[0]?.count || 0,
      }));
    },
  });
};
