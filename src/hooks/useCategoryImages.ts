import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CategoryImage {
  id: string;
  category_id: string;
  image_url: string;
  prompt: string | null;
  created_at: string;
}

export const useCategoryImages = () => {
  return useQuery({
    queryKey: ["category-images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("category_images")
        .select("*");

      if (error) {
        console.error("Error fetching category images:", error);
        return {};
      }

      // Create a map of category_id -> image_url
      const imageMap: Record<string, string> = {};
      (data as CategoryImage[])?.forEach((img) => {
        imageMap[img.category_id] = img.image_url;
      });

      return imageMap;
    },
  });
};
