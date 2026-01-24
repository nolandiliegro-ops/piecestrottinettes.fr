import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

// 🔧 Helper de timeout - Force une erreur si la requête dépasse le délai
const withTimeout = <T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(errorMessage)), ms)
    )
  ]);
};

// Type for part with category and technical metadata
export interface CompatiblePart {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  difficulty_level: number | null;
  stock_quantity: number | null;
  technical_metadata: Record<string, unknown> | null;
  is_featured?: boolean;
  category: {
    id: string;
    name: string;
    icon: string | null;
    slug: string;
  } | null;
}

// Hook pour récupérer toutes les marques
export const useBrands = () => {
  return useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      console.log('[useBrands] 🚀 Début requête...');
      console.log('[useBrands] 🌐 Navigator online:', navigator.onLine);
      console.log('[useBrands] 📍 Window focused:', document.hasFocus());
      
      const fetchBrands = async () => {
        const { data, error } = await supabase
          .from("brands")
          .select("*")
          .order("name");
        
        console.log('[useBrands] 📦 Réponse brute:', { dataLength: data?.length, error });
        
        if (error) {
          console.error('[useBrands] 🔴 Erreur:', error);
          throw error;
        }
        return data || [];
      };
      
      try {
        // Timeout après 5 secondes
        const data = await withTimeout(
          fetchBrands(), 
          5000, 
          'Timeout: La base de données ne répond pas après 5s'
        );
        
        console.log('[useBrands] ✅ Succès:', data.length, 'marques');
        return data;
      } catch (error: any) {
        // Log spécifique pour "message channel closed"
        if (error?.message?.includes('channel') || error?.message?.includes('closed')) {
          console.error('[useBrands] 🔴 CHANNEL ERROR - Possible extension blocking');
          toast.error('Connexion interrompue. Désactivez vos extensions et réessayez.');
        }
        throw error;
      }
    },
    staleTime: 0,
    gcTime: 0, // Pas de cache
    refetchOnMount: 'always',
    retry: 1,
    retryDelay: 1000,
  });
};

// Hook pour récupérer les modèles de trottinettes (avec filtrage optionnel par marque)
export const useScooterModels = (brandSlug?: string | null) => {
  return useQuery({
    queryKey: ["scooter_models", brandSlug],
    queryFn: async () => {
      console.log('[useScooterModels] 🚀 Début requête... brandSlug:', brandSlug);
      console.log('[useScooterModels] 🌐 Navigator online:', navigator.onLine);
      
      const fetchModels = async () => {
        let query = supabase
          .from("scooter_models")
          .select(`
            *,
            brand:brands(id, name, slug)
          `)
          .order("name");

        if (brandSlug) {
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
        
        console.log('[useScooterModels] 📦 Réponse brute:', { dataLength: data?.length, error });
        
        if (error) {
          console.error('[useScooterModels] 🔴 Erreur:', error);
          throw error;
        }
        return data || [];
      };
      
      try {
        // Timeout après 5 secondes
        const data = await withTimeout(
          fetchModels(), 
          5000, 
          'Timeout: Les modèles ne répondent pas après 5s'
        );
        
        console.log('[useScooterModels] ✅ Succès:', data.length, 'modèles');
        return data;
      } catch (error: any) {
        if (error?.message?.includes('channel') || error?.message?.includes('closed')) {
          console.error('[useScooterModels] 🔴 CHANNEL ERROR - Possible extension blocking');
          toast.error('Connexion interrompue. Désactivez vos extensions.');
        }
        throw error;
      }
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    retry: 1,
    retryDelay: 1000,
  });
};

// Interface pour les catégories avec parent_id
export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  display_order: number | null;
  parent_id: string | null;
}

// Hook pour récupérer les catégories
export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, icon, display_order, parent_id")
        .order("display_order");
      
      if (error) {
        console.error('[useCategories] Erreur:', error);
        throw error;
      }
      console.log('[useCategories] ✅ Données récupérées:', data?.length || 0, 'catégories');
      return data || [];
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });
};

// Hook pour récupérer uniquement les catégories parentes (sans parent_id)
export const useParentCategories = () => {
  return useQuery({
    queryKey: ["parent-categories"],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, icon, display_order, parent_id")
        .is("parent_id", null)
        .order("display_order");
      
      if (error) throw error;
      return data || [];
    },
  });
};

// Hook pour récupérer les sous-catégories d'une catégorie parente
export const useSubCategories = (parentId: string | null) => {
  return useQuery({
    queryKey: ["sub-categories", parentId],
    queryFn: async (): Promise<Category[]> => {
      if (!parentId) return [];
      
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, icon, display_order, parent_id")
        .eq("parent_id", parentId)
        .order("display_order");
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!parentId,
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

// Hook pour récupérer les pièces compatibles avec un modèle de trottinette
export const useCompatibleParts = (scooterModelSlug: string | null, limit: number = 4) => {
  return useQuery({
    queryKey: ["compatible_parts", scooterModelSlug, limit],
    queryFn: async (): Promise<CompatiblePart[]> => {
      if (!scooterModelSlug) return [];

      // First get the scooter model ID from slug
      const { data: scooterModel, error: scooterError } = await supabase
        .from("scooter_models")
        .select("id")
        .eq("slug", scooterModelSlug)
        .single();

      if (scooterError || !scooterModel) return [];

      // Get compatible parts via part_compatibility junction table
      const { data: compatibilityData, error: compatError } = await supabase
        .from("part_compatibility")
        .select(`
          part_id,
          parts (
            id,
            name,
            slug,
            description,
            price,
            image_url,
            difficulty_level,
            stock_quantity,
            technical_metadata,
            category:categories (
              id,
              name,
              icon,
              slug
            )
          )
        `)
        .eq("scooter_model_id", scooterModel.id)
        .limit(limit);

      if (compatError) throw compatError;

      // Transform and filter the data - ensure category is properly extracted
      return (compatibilityData || [])
        .map((item) => item.parts)
        .filter((part): part is NonNullable<typeof part> => part !== null)
        .map((part) => {
          // Handle category - could be object, array, or null
          let categoryData: CompatiblePart['category'] = null;
          if (part.category) {
            if (Array.isArray(part.category) && part.category.length > 0) {
              const cat = part.category[0];
              categoryData = { id: cat.id, name: cat.name, icon: cat.icon, slug: cat.slug };
            } else if (typeof part.category === 'object' && 'id' in part.category) {
              categoryData = part.category as CompatiblePart['category'];
            }
          }
          
          return {
            id: part.id,
            name: part.name,
            slug: part.slug,
            description: part.description,
            price: part.price,
            image_url: part.image_url,
            difficulty_level: part.difficulty_level,
            stock_quantity: part.stock_quantity,
            technical_metadata: part.technical_metadata as Record<string, unknown> | null,
            category: categoryData,
          };
        });
    },
    enabled: !!scooterModelSlug,
  });
};

// Hook pour compter le total de pièces compatibles
export const useCompatiblePartsCount = (scooterModelSlug: string | null) => {
  return useQuery({
    queryKey: ["compatible_parts_count", scooterModelSlug],
    queryFn: async (): Promise<number> => {
      if (!scooterModelSlug) return 0;

      const { data: scooterModel } = await supabase
        .from("scooter_models")
        .select("id")
        .eq("slug", scooterModelSlug)
        .single();

      if (!scooterModel) return 0;

      const { count, error } = await supabase
        .from("part_compatibility")
        .select("*", { count: "exact", head: true })
        .eq("scooter_model_id", scooterModel.id);

      if (error) return 0;
      return count || 0;
    },
    enabled: !!scooterModelSlug,
  });
};
