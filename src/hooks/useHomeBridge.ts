import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type HomeBridgeColorMode = "auto" | "dark" | "light";

export type HomeBridgeSettings = {
  id: string;
  watermark_text: string;
  watermark_opacity: number;
  watermark_color_mode: HomeBridgeColorMode;
  is_enabled: boolean;
};

const QUERY_KEY = ["home_bridge_settings"] as const;

export const useHomeBridge = () =>
  useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<HomeBridgeSettings | null> => {
      const { data, error } = await supabase
        .from("home_bridge_settings")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data as HomeBridgeSettings | null;
    },
    staleTime: 5 * 60 * 1000,
  });

export const useUpdateHomeBridge = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Omit<HomeBridgeSettings, "id">>;
    }) => {
      const { data, error } = await supabase
        .from("home_bridge_settings")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as HomeBridgeSettings;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};
