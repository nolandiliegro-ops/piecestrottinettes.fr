import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface UserProfile {
  id: string;
  display_name: string | null;
  performance_points: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export const useProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch profile
  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data as UserProfile;
    },
    enabled: !!user?.id,
  });

  // Update profile
  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<Pick<UserProfile, "display_name">>) => {
      if (!user?.id) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from("profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Profil mis à jour");
    },
    onError: (error) => {
      console.error("Profile update error:", error);
      toast.error("Erreur lors de la mise à jour du profil");
    },
  });

  // Get garage stats
  const { data: garageStats } = useQuery({
    queryKey: ["garage-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return { total: 0, owned: 0, favorites: 0 };

      const { data, error } = await supabase
        .from("user_garage")
        .select("is_owned")
        .eq("user_id", user.id);

      if (error) throw error;

      const total = data?.length || 0;
      const owned = data?.filter((g) => g.is_owned).length || 0;
      const favorites = total - owned;

      return { total, owned, favorites };
    },
    enabled: !!user?.id,
  });

  // Get order stats
  const { data: orderStats } = useQuery({
    queryKey: ["order-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return { count: 0, lastOrder: null };

      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, created_at, total_ttc, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return {
        count: data?.length || 0,
        lastOrder: data?.[0] || null,
      };
    },
    enabled: !!user?.id,
  });

  // Change password
  const changePassword = useMutation({
    mutationFn: async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Mot de passe mis à jour");
    },
    onError: (error) => {
      console.error("Password change error:", error);
      toast.error("Erreur lors du changement de mot de passe");
    },
  });

  // Delete account
  const deleteAccount = useMutation({
    mutationFn: async () => {
      // Note: Full account deletion requires a server-side function
      // For now, we'll sign out the user
      await supabase.auth.signOut();
    },
    onSuccess: () => {
      toast.success("Déconnexion effectuée");
    },
  });

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    garageStats,
    orderStats,
    changePassword,
    deleteAccount,
    user,
  };
};
