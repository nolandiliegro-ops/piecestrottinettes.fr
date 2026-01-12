import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Part {
  id: string;
  name: string;
  price: number;
  image?: string;
  image_url?: string;
  stock_quantity: number;
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

        // Query part_compatibility table to get compatible parts for this scooter model
        const { data: compatibilityData, error: compatibilityError } = await supabase
          .from('part_compatibility')
          .select('part_id')
          .eq('scooter_model_id', scooterModelId);

        if (compatibilityError) {
          throw compatibilityError;
        }

        // If no compatible parts found, return empty array
        if (!compatibilityData || compatibilityData.length === 0) {
          setParts([]);
          setLoading(false);
          return;
        }

        // Extract part IDs
        const partIds = compatibilityData.map(item => item.part_id);

        // Fetch parts details with category information
        const { data: partsData, error: partsError } = await supabase
          .from('parts')
          .select(`
            id,
            name,
            price,
            image_url,
            stock_quantity,
            category:categories (
              id,
              name,
              slug
            )
          `)
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
