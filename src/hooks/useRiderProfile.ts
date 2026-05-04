import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export const useRiderProfile = () => {
  const { user, refreshProfile } = useAuth();
  const qc = useQueryClient();

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ["profile", user?.id] });
    await refreshProfile();
  };

  const updateAvatar = useMutation({
    mutationFn: async (url: string | null) => {
      if (!user) throw new Error("Non authentifié");
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: url, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e?.message ?? "Erreur avatar"),
  });

  const updateBio = useMutation({
    mutationFn: async (bio: string | null) => {
      if (!user) throw new Error("Non authentifié");
      const value = bio?.trim() || null;
      if (value && value.length > 150) throw new Error("Bio trop longue (max 150)");
      const { error } = await supabase
        .from("profiles")
        .update({ bio: value, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e?.message ?? "Erreur bio"),
  });

  const updateLocation = useMutation({
    mutationFn: async (location: string | null) => {
      if (!user) throw new Error("Non authentifié");
      const value = location?.trim() || null;
      if (value && value.length > 60) throw new Error("Ville trop longue (max 60)");
      const { error } = await supabase
        .from("profiles")
        .update({ rider_location: value, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e?.message ?? "Erreur ville"),
  });

  const deleteAvatar = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Non authentifié");
      // best-effort storage cleanup
      await supabase.storage.from("rider-avatars").remove([`${user.id}/avatar.webp`]);
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Photo supprimée");
      await invalidate();
    },
    onError: (e: any) => toast.error(e?.message ?? "Erreur suppression"),
  });

  return { updateAvatar, updateBio, updateLocation, deleteAvatar };
};
