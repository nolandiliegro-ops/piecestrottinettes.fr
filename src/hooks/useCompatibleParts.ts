import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { classifyCompat } from '@/lib/compatibilityStatus';

interface Part {
  id: string;
  name: string;
  price: number;
  image?: string;
  image_url?: string;
  stock_quantity: number;
  difficulty_level?: number | null;
  slug?: string | null;
  category: {
    name: string;
  };
}

export const useCompatibleParts = (scooterModelId?: string) => {
  const [parts, setParts] = useState<Part[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCompatibleParts = async () => {
      if (!scooterModelId) {
        setParts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // LOT 3 : surface sans section 🟡 (Garage) → verified UNIQUEMENT,
        // classé par la règle unique src/lib/compatibilityStatus.ts.
        const { data: compatibilityData, error: compatibilityError } = await supabase
          .from('part_compatibility')
          .select('part_id, confidence_level, suggestion_reason')
          .eq('scooter_model_id', scooterModelId);

        if (compatibilityError) {
          throw compatibilityError;
        }

        const verifiedRows = (compatibilityData || []).filter(
          (row) => classifyCompat(row) === 'verified'
        );

        // If no compatible parts found, return empty array
        if (verifiedRows.length === 0) {
          setParts([]);
          setLoading(false);
          return;
        }

        // Extract part IDs
        const partIds = verifiedRows.map(item => item.part_id);

        // Fetch parts details with category information
        const { data: partsData, error: partsError } = await supabase
          .from('parts')
          .select(`
            id,
            name,
            price,
            image_url,
            stock_quantity,
            difficulty_level,
            slug,
            category:categories (
              id,
              name,
              slug
            )
          `)
          .eq('published', true)
          .in('id', partIds)
          .order('name', { ascending: true });

        if (partsError) {
          throw partsError;
        }

        // Transform data to match expected structure
        // Supabase returns category as an object {id, name, slug} - extract only name
        const transformedData = partsData?.map((item: any) => {
          // Handle category - could be object, array, or null
          let categoryName = 'Autre';
          if (item.category) {
            if (Array.isArray(item.category) && item.category.length > 0) {
              categoryName = item.category[0]?.name || 'Autre';
            } else if (typeof item.category === 'object' && item.category.name) {
              categoryName = item.category.name;
            }
          }
          
          return {
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image_url,
            stock_quantity: item.stock_quantity,
            difficulty_level: item.difficulty_level,
            slug: item.slug,
            category: {
              name: categoryName,
            },
          };
        }) || [];

        setParts(transformedData);
      } catch (err) {
        console.error('Error fetching compatible parts:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setParts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCompatibleParts();
  }, [scooterModelId]);

  return { parts, loading, error };
};
