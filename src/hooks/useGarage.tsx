import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import LuxurySuccessToast from "@/components/garage/LuxurySuccessToast";

export interface GarageItem {
  id: string;
  user_id: string;
  scooter_model_id: string;
  is_owned: boolean;
  nickname: string | null;
  current_km: number | null;
  next_maintenance_km: number | null;
  custom_photo_url: string | null;
  added_at: string;
  scooter_model?: {
    id: string;
    name: string;
    slug: string;
    brand_id: string;
    power_watts: number | null;
    max_speed_kmh: number | null;
    range_km: number | null;
    image_url: string | null;
    brand?: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

// Fetch user's garage with scooter details
export const useUserGarage = () => {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ["user-garage", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_garage")
        .select(`
          *,
          scooter_model:scooter_models(
            id,
            name,
            slug,
            brand_id,
            power_watts,
            max_speed_kmh,
            range_km,
            image_url,
            brand:brands(id, name, slug)
          )
        `)
        .eq("user_id", user.id)
        .order("added_at", { ascending: false });

      if (error) throw error;
      return data as GarageItem[];
    },
    enabled: !!user,
  });
};

// Check if a scooter is in user's garage (by slug)
export const useIsInGarage = (scooterSlug: string) => {
  const { data: garage } = useUserGarage();
  
  if (!garage) return { inGarage: false, isOwned: false, garageItem: null };
  
  // Match by slug instead of UUID
  const garageItem = garage.find((item) => item.scooter_model?.slug === scooterSlug);
  
  return {
    inGarage: !!garageItem,
    isOwned: garageItem?.is_owned ?? false,
    garageItem,
  };
};

// Add scooter to garage (accepts slug, resolves to UUID)
export const useAddToGarage = () => {
  const queryClient = useQueryClient();
  const { user, refreshProfile } = useAuthContext();

  return useMutation({
    mutationFn: async ({ 
      scooterSlug, 
      isOwned, 
      scooterName,
      nickname,
      currentKm
    }: { 
      scooterSlug: string; 
      isOwned: boolean; 
      scooterName: string;
      nickname?: string;
      currentKm?: number;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Resolve slug to UUID
      const { data: scooterModel, error: lookupError } = await supabase
        .from("scooter_models")
        .select("id")
        .eq("slug", scooterSlug)
        .maybeSingle();

      if (lookupError) throw lookupError;
      if (!scooterModel) throw new Error(`Scooter model "${scooterSlug}" not found`);

      // Add to garage with resolved UUID
      const { error: garageError } = await supabase
        .from("user_garage")
        .insert({
          user_id: user.id,
          scooter_model_id: scooterModel.id,
          is_owned: isOwned,
          nickname: nickname || null,
          current_km: currentKm || null,
        });

      if (garageError) throw garageError;

      // Update performance points (+100 if nickname provided, otherwise +5/+10)
      const pointsToAdd = nickname ? 100 : (isOwned ? 10 : 5);
      
      // Get current points and update
      const { data: profile } = await supabase
        .from("profiles")
        .select("performance_points")
        .eq("id", user.id)
        .single();

      await supabase
        .from("profiles")
        .update({ 
          performance_points: (profile?.performance_points || 0) + pointsToAdd 
        })
        .eq("id", user.id);

      return { isOwned, pointsToAdd, scooterName };
    },
    onSuccess: async ({ isOwned, pointsToAdd, scooterName }) => {
      queryClient.invalidateQueries({ queryKey: ["user-garage"] });
      await refreshProfile();

      // Show luxury success toast
      toast.custom(
        (t) => <LuxurySuccessToast scooterName={scooterName} points={pointsToAdd} />,
        {
          duration: 5000,
        }
      );
    },
    onError: (error) => {
      console.error("Error adding to garage:", error);
      toast.error("Erreur lors de l'ajout au garage");
    },
  });
};

// Remove scooter from garage
export const useRemoveFromGarage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (garageItemId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_garage")
        .delete()
        .eq("id", garageItemId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-garage"] });
      toast("Véhicule retiré de votre garage", {
        description: "À bientôt !",
      });
    },
    onError: (error) => {
      console.error("Error removing from garage:", error);
      toast.error("Erreur lors du retrait");
    },
  });
};

// Toggle owned status (Collection ↔ Stable)
export const useToggleOwned = () => {
  const queryClient = useQueryClient();
  const { user, refreshProfile } = useAuthContext();

  return useMutation({
    mutationFn: async ({ 
      garageItemId, 
      newIsOwned 
    }: { 
      garageItemId: string; 
      newIsOwned: boolean;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Update is_owned status
      const { error: updateError } = await supabase
        .from("user_garage")
        .update({ is_owned: newIsOwned })
        .eq("id", garageItemId)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      // If promoting to Stable, add +5 bonus points
      if (newIsOwned) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("performance_points")
          .eq("id", user.id)
          .single();

        await supabase
          .from("profiles")
          .update({ 
            performance_points: (profile?.performance_points || 0) + 5 
          })
          .eq("id", user.id);
      }

      return { newIsOwned };
    },
    onSuccess: async ({ newIsOwned }) => {
      queryClient.invalidateQueries({ queryKey: ["user-garage"] });
      await refreshProfile();

      if (newIsOwned) {
        toast.success("Promu dans votre écurie !", {
          description: "+5 Performance Points bonus",
        });
      } else {
        toast("Déplacé dans votre collection");
      }
    },
    onError: (error) => {
      console.error("Error toggling owned status:", error);
      toast.error("Erreur lors de la modification");
    },
  });
};
