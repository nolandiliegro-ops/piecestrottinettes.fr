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

export type SearchFilter = 'scooters' | 'parts' | 'tutorials' | null;

// Parse search query for prefix filters
const parseQuery = (query: string): { filter: SearchFilter; term: string } => {
  const prefixMatch = query.match(/^(part|piece|p|tuto|t|model|m):(.+)/i);
  if (prefixMatch) {
    const prefix = prefixMatch[1].toLowerCase();
    const term = prefixMatch[2].trim();
    if (['part', 'piece', 'p'].includes(prefix)) return { filter: 'parts', term };
    if (['tuto', 't'].includes(prefix)) return { filter: 'tutorials', term };
    if (['model', 'm'].includes(prefix)) return { filter: 'scooters', term };
  }
  return { filter: null, term: query };
};

// Generate fuzzy variants for common French typos
const generateFuzzyVariants = (term: string): string[] => {
  const variants = new Set<string>([term.toLowerCase()]);
  const lowerTerm = term.toLowerCase();
  
  // Common French letter substitutions and typos
  const replacements: [RegExp, string][] = [
    // Double letters
    [/tt/g, 't'],
    [/([^t])t([^t])/g, '$1tt$2'],
    [/ss/g, 's'],
    [/([^s])s([^s])/g, '$1ss$2'],
    [/ll/g, 'l'],
    [/([^l])l([^l])/g, '$1ll$2'],
    [/nn/g, 'n'],
    [/([^n])n([^n])/g, '$1nn$2'],
    [/rr/g, 'r'],
    [/([^r])r([^r])/g, '$1rr$2'],
    // Accents
    [/é/g, 'e'],
    [/è/g, 'e'],
    [/ê/g, 'e'],
    [/e/g, 'é'],
    [/à/g, 'a'],
    [/â/g, 'a'],
    [/ù/g, 'u'],
    [/û/g, 'u'],
    [/î/g, 'i'],
    [/ô/g, 'o'],
    // Common mistakes
    [/ph/g, 'f'],
    [/f/g, 'ph'],
    [/qu/g, 'k'],
    [/k/g, 'qu'],
  ];
  
  replacements.forEach(([pattern, replacement]) => {
    const variant = lowerTerm.replace(pattern, replacement);
    if (variant !== lowerTerm) variants.add(variant);
  });
  
  return [...variants].slice(0, 4); // Limit to 4 variants for performance
};

export const useUnifiedSearch = (query: string) => {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Parse the query to extract filter and clean term
  const { filter, term: searchTerm } = parseQuery(debouncedQuery);

  return useQuery({
    queryKey: ['unified-search', debouncedQuery],
    queryFn: async (): Promise<UnifiedSearchResults & { activeFilter: SearchFilter }> => {
      if (searchTerm.length < 2) {
        return { scooters: [], parts: [], tutorials: [], activeFilter: filter };
      }

      // Generate fuzzy variants
      const fuzzyVariants = generateFuzzyVariants(searchTerm);
      
      // Build OR conditions for fuzzy matching
      const buildFuzzyFilter = (variants: string[]) => {
        return variants.map(v => `%${v}%`);
      };

      const fuzzyPatterns = buildFuzzyFilter(fuzzyVariants);
      
      // Execute queries based on filter
      const shouldQueryScooters = filter === null || filter === 'scooters';
      const shouldQueryParts = filter === null || filter === 'parts';
      const shouldQueryTutorials = filter === null || filter === 'tutorials';

      // Build individual queries
      const scooterQuery = shouldQueryScooters 
        ? supabase
            .from('scooter_models')
            .select('slug, name, image_url, brand:brands(name)')
            .or(fuzzyPatterns.map(p => `name.ilike.${p}`).join(','))
            .limit(4)
        : null;

      const partsQuery = shouldQueryParts
        ? supabase
            .from('parts')
            .select('slug, name, price, image_url, category:categories(name)')
            .or(fuzzyPatterns.map(p => `name.ilike.${p}`).join(','))
            .limit(4)
        : null;

      const tutorialsQuery = shouldQueryTutorials
        ? supabase
            .from('tutorials')
            .select('slug, title, difficulty, scooter_model:scooter_models(name)')
            .or(fuzzyPatterns.map(p => `title.ilike.${p}`).join(','))
            .limit(3)
        : null;

      // Execute all queries in parallel
      const [scootersRes, partsRes, tutorialsRes] = await Promise.all([
        scooterQuery ?? Promise.resolve({ data: [] }),
        partsQuery ?? Promise.resolve({ data: [] }),
        tutorialsQuery ?? Promise.resolve({ data: [] }),
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

      return { scooters, parts, tutorials, activeFilter: filter };
    },
    enabled: searchTerm.length >= 2,
    staleTime: 30000,
  });
};
