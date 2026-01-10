import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

// Hook pour récupérer toutes les marques
export const useBrands = () => {
  return useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });
};

// Hook pour récupérer les modèles de trottinettes (avec filtrage optionnel par marque)
export const useScooterModels = (brandSlug?: string | null) => {
  return useQuery({
    queryKey: ["scooter_models", brandSlug],
    queryFn: async () => {
      let query = supabase
        .from("scooter_models")
        .select(`
          *,
          brand:brands(id, name, slug)
        `)
        .order("name");

      if (brandSlug) {
        // Filtrer par slug de marque via la relation
        const { data: brand } = await supabase
          .from("brands")
          .select("id")
          .eq("slug", brandSlug)
          .single();

        if (brand) {
          query = query.eq("brand_id", brand.id);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

// Hook pour récupérer les catégories
export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("display_order");
      
      if (error) throw error;
      return data;
    },
  });
};

// Hook pour recherche prédictive avec debounce
export const useSearchScooters = (query: string) => {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return useQuery({
    queryKey: ["search_scooters", debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.length < 2) return [];

      const { data, error } = await supabase
        .from("scooter_models")
        .select(`
          slug,
          name,
          brand:brands(name)
        `)
        .or(`name.ilike.%${debouncedQuery}%,brands.name.ilike.%${debouncedQuery}%`)
        .limit(5);

      if (error) throw error;
      
      return (data || []).map((item) => ({
        slug: item.slug,
        name: item.name,
        brandName: item.brand?.name || "",
      }));
    },
    enabled: debouncedQuery.length >= 2,
  });
};
