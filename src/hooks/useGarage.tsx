import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

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

      // Note: XP attribution removed to prevent spam (add/remove trottinette exploit)
      // XP is now only awarded for paid actions (purchases) or time-gated actions (maintenance)

      return { isOwned, scooterName };
    },
    onSuccess: async ({ isOwned, scooterName }) => {
      queryClient.invalidateQueries({ queryKey: ["user-garage"] });
      await refreshProfile();

      // Show success toast (without XP mention)
      toast.success(`${scooterName} ajoutée à votre garage !`, {
        description: isOwned ? "Dans votre écurie" : "Dans votre collection",
        duration: 4000,
      });
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

// Update nickname for a garage item
export const useUpdateNickname = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async ({ 
      garageItemId, 
      nickname 
    }: { 
      garageItemId: string; 
      nickname: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_garage")
        .update({ nickname: nickname.trim() || null })
        .eq("id", garageItemId)
        .eq("user_id", user.id);

      if (error) throw error;
      return { nickname };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-garage"] });
      toast.success("Surnom enregistré", { duration: 2000 });
    },
    onError: (error) => {
      console.error("Error updating nickname:", error);
      toast.error("Erreur lors de la sauvegarde");
    },
  });
};

// Update personal description for a garage item
export const useUpdatePersonalDescription = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async ({ 
      garageItemId, 
      description 
    }: { 
      garageItemId: string; 
      description: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_garage")
        .update({ personal_description: description })
        .eq("id", garageItemId)
        .eq("user_id", user.id);

      if (error) throw error;
      return { description };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-garage-scooters"] });
      toast.success("Description enregistrée", { duration: 2000 });
    },
    onError: (error) => {
      console.error("Error updating personal description:", error);
      toast.error("Erreur lors de la sauvegarde");
    },
  });
};
