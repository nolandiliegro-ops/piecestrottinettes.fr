import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { createElement } from "react";
import confetti from "canvas-confetti";
import XPToast from "@/components/garage/XPToast";
import LevelUpToast from "@/components/garage/LevelUpToast";
import { getXPLevel } from "@/lib/xpLevels";

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

      // Calculate levels before/after
      const previousLevel = getXPLevel(data.previousPoints);
      const newLevel = getXPLevel(data.newTotal);

      // Detect level-up
      if (newLevel.level > previousLevel.level) {
        // Trigger confetti celebration
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFAB00', '#D50000', '#2962FF', '#00C853', '#FFD700'],
        });

        // Second burst for extra celebration
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 100,
            origin: { y: 0.5, x: 0.3 },
            colors: ['#FFAB00', '#FFD700', '#FFA500'],
          });
          confetti({
            particleCount: 100,
            spread: 100,
            origin: { y: 0.5, x: 0.7 },
            colors: ['#FFAB00', '#FFD700', '#FFA500'],
          });
        }, 250);

        // Show special Level-Up toast
        toast.custom(
          () => createElement(LevelUpToast, { newLevel, previousLevel }),
          { duration: 5000 }
        );
      } else {
        // Show normal XP toast
        toast.custom(
          () => createElement(XPToast, { points: data.pointsAdded, action: data.action }),
          { duration: 4000 }
        );
      }
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
