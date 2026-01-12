import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface GarageScooter {
  id: string;
  scooter_model: {
    id: string;
    name: string;
    brand: string;
    image?: string;
    max_speed_kmh?: number;
    max_range_km?: number;
    power_w?: number;
    model_variant?: string;
    voltage?: number;
    battery_ah?: number;
  };
  nickname?: string;
  added_at: string;
}

export const useGarageScooters = () => {
  const { user } = useAuth();
  const [scooters, setScooters] = useState<GarageScooter[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchGarageScooters = async () => {
      if (!user) {
        setScooters([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Query user_garage table with scooter_models join
        const { data, error: fetchError } = await supabase
          .from('user_garage')
          .select(`
            id,
            nickname,
            added_at,
            scooter_model:scooter_models (
              id,
              name,
              brand,
              image,
              max_speed_kmh,
              max_range_km,
              power_w,
              model_variant,
              voltage,
              battery_ah
            )
          `)
          .eq('user_id', user.id)
          .order('added_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        // Transform data to match expected structure
        const transformedData = data?.map((item: any) => ({
          id: item.id,
          nickname: item.nickname,
          added_at: item.added_at,
          scooter_model: {
            id: item.scooter_model.id,
            name: item.scooter_model.name,
            brand: item.scooter_model.brand,
            image: item.scooter_model.image,
            max_speed_kmh: item.scooter_model.max_speed_kmh,
            max_range_km: item.scooter_model.max_range_km,
            power_w: item.scooter_model.power_w,
            model_variant: item.scooter_model.model_variant,
            voltage: item.scooter_model.voltage,
            battery_ah: item.scooter_model.battery_ah,
          },
        })) || [];

        setScooters(transformedData);
      } catch (err) {
        console.error('Error fetching garage scooters:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setScooters([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGarageScooters();
  }, [user]);

  return { scooters, loading, error };
};
