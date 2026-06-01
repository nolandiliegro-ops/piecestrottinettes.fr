import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Palier 1 : categories est la SOURCE CANONIQUE de l'image + métadonnées visuelles.
// Ce hook lit désormais categories (image_url / alt_text / accent_label) au lieu de
// category_images (table conservée orpheline, drop au Palier 2). La forme de sortie
// est inchangée (Record<categoryId, CategoryImageData>) pour ne pas casser les lecteurs.
interface CategoryRow {
  id: string;
  image_url: string | null;
  alt_text: string | null;
  accent_label: string | null;
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
        .from("categories")
        .select("id, image_url, alt_text, accent_label");

      if (error) {
        console.error("Error fetching category images:", error);
        return {};
      }

      const imageMap: Record<string, CategoryImageData> = {};
      (data as CategoryRow[])?.forEach((cat) => {
        // Pas d'image → on n'indexe pas (les lecteurs gèrent l'état vide via fallback).
        if (cat.id && cat.image_url) {
          imageMap[cat.id] = {
            image_url: cat.image_url,
            subtitle: cat.accent_label,
            alt_text: cat.alt_text,
          };
        }
      });

      return imageMap;
    },
  });
};
