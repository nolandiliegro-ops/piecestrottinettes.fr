import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CategoryImage {
  id: string;
  category_id: string;
  image_url: string;
  prompt: string | null;
  subtitle: string | null;
  alt_text: string | null;
  seo_name: string | null;
  created_at: string;
}

export interface CategoryImageData {
  image_url: string;
  subtitle: string | null;
  alt_text: string | null;
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

      const imageMap: Record<string, CategoryImageData> = {};
      (data as CategoryImage[])?.forEach((img) => {
        if (img.category_id) {
          imageMap[img.category_id] = {
            image_url: img.image_url,
            subtitle: img.subtitle,
            alt_text: img.alt_text,
          };
        }
      });

      return imageMap;
    },
  });
};
