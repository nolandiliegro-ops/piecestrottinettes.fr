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

  const updateDisplayName = useMutation({
    mutationFn: async (displayName: string) => {
      if (!user) throw new Error("Non authentifié");
      const value = displayName?.trim();
      if (!value) throw new Error("Le nom de rider ne peut pas être vide");
      if (value.length > 30) throw new Error("Nom trop long (max 30)");
      if (!/^[a-zA-Z0-9 ._-]+$/.test(value)) {
        throw new Error("Caractères non autorisés (lettres, chiffres, espace, . _ - uniquement)");
      }
      // Unicité
      const { data: existing, error: checkErr } = await supabase
        .from("profiles")
        .select("id")
        .eq("display_name", value)
        .neq("id", user.id)
        .maybeSingle();
      if (checkErr) throw checkErr;
      if (existing) throw new Error("Ce nom est déjà pris");

      const { error } = await supabase
        .from("profiles")
        .update({ display_name: value, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: any) => toast.error(e?.message ?? "Erreur nom de rider"),
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
