import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Favorite {
  id: string;
  user_id: string;
  part_id: string;
  created_at: string;
}

export interface FavoriteWithPart extends Favorite {
  parts: {
    id: string;
    name: string;
    slug: string;
    price: number | null;
    image_url: string | null;
    stock_quantity: number | null;
    difficulty_level: number | null;
    is_featured: boolean | null;
  };
}

export const useFavorites = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all favorites for the current user
  const {
    data: favorites = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("favorites")
        .select(`
          id,
          user_id,
          part_id,
          created_at,
          parts (
            id,
            name,
            slug,
            price,
            image_url,
            stock_quantity,
            difficulty_level,
            is_featured
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as FavoriteWithPart[];
    },
    enabled: !!user?.id,
  });

  // Check if a part is favorited
  const isFavorite = (partId: string): boolean => {
    return favorites.some((fav) => fav.part_id === partId);
  };

  // Get favorite entry for a part
  const getFavorite = (partId: string): FavoriteWithPart | undefined => {
    return favorites.find((fav) => fav.part_id === partId);
  };

  // Add to favorites
  const addFavorite = useMutation({
    mutationFn: async (partId: string) => {
      if (!user?.id) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from("favorites")
        .insert({
          user_id: user.id,
          part_id: partId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", user?.id] });
    },
    onError: (error) => {
      console.error("Add favorite error:", error);
      toast.error("Erreur lors de l'ajout aux favoris");
    },
  });

  // Remove from favorites
  const removeFavorite = useMutation({
    mutationFn: async (partId: string) => {
      if (!user?.id) throw new Error("Non authentifié");

      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("part_id", partId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", user?.id] });
    },
    onError: (error) => {
      console.error("Remove favorite error:", error);
      toast.error("Erreur lors du retrait des favoris");
    },
  });

  // Toggle favorite status
  const toggleFavorite = async (partId: string, partName?: string) => {
    if (!user) {
      toast.info("Connectez-vous pour ajouter des favoris", {
        description: "Créez un compte pour sauvegarder vos pièces préférées",
      });
      return;
    }

    const isCurrentlyFavorite = isFavorite(partId);

    if (isCurrentlyFavorite) {
      await removeFavorite.mutateAsync(partId);
      toast.success("Retiré des favoris");
    } else {
      await addFavorite.mutateAsync(partId);
      toast.success(`❤️ ${partName || "Pièce"} ajoutée aux favoris`);
    }
  };

  return {
    favorites,
    isLoading,
    error,
    isFavorite,
    getFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isToggling: addFavorite.isPending || removeFavorite.isPending,
    user,
  };
};
