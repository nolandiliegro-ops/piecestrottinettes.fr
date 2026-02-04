import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { createElement } from "react";
import XPToast from "@/components/garage/XPToast";

interface AddPointsParams {
  pointsToAdd: number;
  action: string;
}

interface AddPointsResponse {
  success: boolean;
  previousPoints: number;
  pointsAdded: number;
  newTotal: number;
  action: string;
}

export const useExperiencePoints = () => {
  const queryClient = useQueryClient();
  const { user, refreshProfile } = useAuthContext();

  const addPointsMutation = useMutation({
    mutationFn: async ({ pointsToAdd, action }: AddPointsParams): Promise<AddPointsResponse> => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("add-experience-points", {
        body: { 
          userId: user.id, 
          pointsToAdd, 
          action 
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Failed to add points");
      
      return data;
    },
    onSuccess: async (data) => {
      // Invalidate profile queries to refresh points display
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      await refreshProfile();

      // Show premium animated XP toast using createElement to avoid JSX in .ts file
      toast.custom(
        () => createElement(XPToast, { points: data.pointsAdded, action: data.action }),
        { duration: 4000 }
      );
    },
    onError: (error) => {
      console.error("Error adding experience points:", error);
      // Silently fail - don't show error toast to user for XP issues
    },
  });

  return {
    addPoints: addPointsMutation.mutate,
    addPointsAsync: addPointsMutation.mutateAsync,
    isLoading: addPointsMutation.isPending,
  };
};
