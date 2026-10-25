import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

/** Commentaires de la carte Rider Story (table rider_card_comments, 25/10/2026). */
export interface CardComment {
  id: string;
  card_owner_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author: { display_name: string | null; username: string | null; avatar_url: string | null } | null;
}

// Table créée le 25/10 : pas encore dans les types générés.
const table = () => (supabase as unknown as { from: (t: string) => any }).from("rider_card_comments");

export const useCardComments = (ownerId: string | null | undefined) =>
  useQuery<CardComment[]>({
    queryKey: ["rider-card-comments", ownerId ?? null],
    enabled: !!ownerId,
    queryFn: async () => {
      const { data, error } = await table()
        .select("id, card_owner_id, author_id, body, created_at, author:profiles!rider_card_comments_author_id_fkey(display_name, username, avatar_url)")
        .eq("card_owner_id", ownerId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as CardComment[];
    },
  });

export const useAddCardComment = () => {
  const qc = useQueryClient();
  const { user } = useAuthContext();
  return useMutation({
    mutationFn: async ({ ownerId, body }: { ownerId: string; body: string }) => {
      if (!user) throw new Error("auth");
      const text = body.trim().slice(0, 280);
      if (!text) throw new Error("empty");
      const { error } = await table().insert({ card_owner_id: ownerId, author_id: user.id, body: text });
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["rider-card-comments", v.ownerId] }),
    onError: (err: any) => {
      if (err?.message === "auth") toast.info("Connecte-toi pour commenter");
      else if (err?.message === "empty") return;
      else if (String(err?.message ?? "").includes("Limite")) toast.info("10 commentaires par jour maximum");
      else toast.error("Commentaire non envoyé");
    },
  });
};

export const useDeleteCardComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; ownerId: string }) => {
      const { error } = await table().delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["rider-card-comments", v.ownerId] }),
    onError: () => toast.error("Suppression impossible"),
  });
};
