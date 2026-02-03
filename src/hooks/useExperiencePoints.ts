import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

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

// XP Toast component defined inline to avoid JSX parsing issues
const createXPToast = (points: number, action: string) => {
  return toast.success(`+${points} XP`, {
    description: action,
    duration: 4000,
    icon: "🏆",
  });
};

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

      // Show XP toast with sonner
      createXPToast(data.pointsAdded, data.action);
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
