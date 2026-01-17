import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CompatiblePart } from "@/hooks/useScooterData";

// Extended part type with category_id for filtering
export interface CataloguePart extends CompatiblePart {
  category_id: string | null;
  is_featured?: boolean;
}

/**
 * Hook to fetch all parts with optional category filter
 */
export const useAllParts = (categoryId: string | null) => {
  return useQuery({
    queryKey: ["all_parts", categoryId],
    queryFn: async (): Promise<CataloguePart[]> => {
      let query = supabase
        .from("parts")
        .select(`
          id,
          name,
          slug,
          description,
          price,
          image_url,
          difficulty_level,
          stock_quantity,
          technical_metadata,
          category_id,
          is_featured,
          category:categories (
            id,
            name,
            icon,
            slug
          )
        `)
        .order("name");

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((part) => ({
        ...part,
        technical_metadata: part.technical_metadata as Record<string, unknown> | null,
      }));
    },
  });
};
