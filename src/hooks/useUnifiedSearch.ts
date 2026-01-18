import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SearchResultScooter {
  slug: string;
  name: string;
  brandName: string;
  imageUrl: string | null;
}

export interface SearchResultPart {
  slug: string;
  name: string;
  category: string;
  price: number | null;
  imageUrl: string | null;
}

export interface SearchResultTutorial {
  slug: string;
  title: string;
  difficulty: number;
  scooterName: string | null;
}

export interface UnifiedSearchResults {
  scooters: SearchResultScooter[];
  parts: SearchResultPart[];
  tutorials: SearchResultTutorial[];
}

export const useUnifiedSearch = (query: string) => {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  return useQuery({
    queryKey: ['unified-search', debouncedQuery],
    queryFn: async (): Promise<UnifiedSearchResults> => {
      if (debouncedQuery.length < 2) {
        return { scooters: [], parts: [], tutorials: [] };
      }

      const searchTerm = `%${debouncedQuery}%`;

      // Execute all queries in parallel
      const [scootersRes, partsRes, tutorialsRes] = await Promise.all([
        // Scooter Models with brand
        supabase
          .from('scooter_models')
          .select('slug, name, image_url, brand:brands(name)')
          .or(`name.ilike.${searchTerm}`)
          .limit(4),

        // Parts with category
        supabase
          .from('parts')
          .select('slug, name, price, image_url, category:categories(name)')
          .ilike('name', searchTerm)
          .limit(4),

        // Tutorials with scooter model
        supabase
          .from('tutorials')
          .select('slug, title, difficulty, scooter_model:scooter_models(name)')
          .ilike('title', searchTerm)
          .limit(3),
      ]);

      // Transform results
      const scooters: SearchResultScooter[] = (scootersRes.data || []).map((s: any) => ({
        slug: s.slug,
        name: s.name,
        brandName: s.brand?.name || '',
        imageUrl: s.image_url,
      }));

      const parts: SearchResultPart[] = (partsRes.data || []).map((p: any) => ({
        slug: p.slug,
        name: p.name,
        category: p.category?.name || '',
        price: p.price,
        imageUrl: p.image_url,
      }));

      const tutorials: SearchResultTutorial[] = (tutorialsRes.data || []).map((t: any) => ({
        slug: t.slug,
        title: t.title,
        difficulty: t.difficulty,
        scooterName: t.scooter_model?.name || null,
      }));

      return { scooters, parts, tutorials };
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000,
  });
};
