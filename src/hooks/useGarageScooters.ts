import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

interface GarageScooter {
  id: string;
  scooter_model: {
    id: string;
    name: string;
    slug: string;
    brand: string;
    image_url?: string | null;
    max_speed_kmh?: number | null;
    range_km?: number | null;
    power_watts?: number | null;
    voltage?: number | null;
    amperage?: number | null;
    youtube_video_id?: string | null;
    compatible_parts_count?: number | null;
  };
  nickname?: string | null;
  added_at: string;
  is_owned: boolean;
  current_km: number | null;
  custom_photo_url?: string | null;
  last_maintenance_date?: string | null;
}

export const useGarageScooters = () => {
  const { user } = useAuthContext();

  const query = useQuery({
    queryKey: ["user-garage", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_garage")
        .select(`
          id,
          nickname,
          added_at,
          is_owned,
          current_km,
          custom_photo_url,
          last_maintenance_date,
          scooter_model:scooter_models(
            id,
            name,
            slug,
            image_url,
            max_speed_kmh,
            range_km,
            power_watts,
            voltage,
            amperage,
            youtube_video_id,
            compatible_parts_count,
            brand:brands(id, name, slug)
          )
        `)
        .eq("user_id", user.id)
        .order("added_at", { ascending: false });

      if (error) throw error;

      // Transform to flatten brand.name -> brand string
      return (data || []).map((item: any) => ({
        id: item.id,
        nickname: item.nickname,
        added_at: item.added_at,
        is_owned: item.is_owned,
        current_km: item.current_km,
        custom_photo_url: item.custom_photo_url,
        last_maintenance_date: item.last_maintenance_date,
        scooter_model: item.scooter_model ? {
          id: item.scooter_model.id,
          name: item.scooter_model.name,
          slug: item.scooter_model.slug,
          // Handle brand - could be object {id, name, slug} or just {name}
          brand: typeof item.scooter_model.brand === 'object' 
            ? (item.scooter_model.brand?.name || 'Unknown')
            : (item.scooter_model.brand || 'Unknown'),
          image_url: item.scooter_model.image_url,
          max_speed_kmh: item.scooter_model.max_speed_kmh,
          range_km: item.scooter_model.range_km,
          power_watts: item.scooter_model.power_watts,
          voltage: item.scooter_model.voltage,
          amperage: item.scooter_model.amperage,
          youtube_video_id: item.scooter_model.youtube_video_id,
          compatible_parts_count: item.scooter_model.compatible_parts_count,
        } : null,
      }))
      // Filter out scooters with null scooter_model to prevent crashes
      .filter((item: any) => item.scooter_model !== null) as GarageScooter[];
    },
    enabled: !!user,
  });

  return {
    scooters: query.data || null,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
