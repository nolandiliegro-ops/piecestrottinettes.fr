import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parts_count: number;
}

export const useCategoryPartsCount = () => {
  return useQuery({
    queryKey: ["category-parts-count"],
    queryFn: async (): Promise<CategoryWithCount[]> => {
      // Get parent categories with part counts
      const { data, error } = await supabase
        .from("categories")
        .select(`
          id,
          name,
          slug,
          icon,
          parts:parts(count)
        `)
        .is("parent_id", null)
        .order("display_order");

      if (error) throw error;

      return (data || []).map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        parts_count: cat.parts?.[0]?.count || 0,
      }));
    },
  });
};
