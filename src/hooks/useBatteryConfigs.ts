import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BatteryConfig {
  voltage: number;
  amperage: number;
  is_default: boolean;
}

export const useBatteryConfigs = (scooterSlug: string | null) => {
  return useQuery({
    queryKey: ['battery-configs', scooterSlug],
    queryFn: async () => {
      if (!scooterSlug) return [];
      
      // First get the scooter model id from slug
      const { data: scooterData, error: scooterError } = await supabase
        .from('scooter_models')
        .select('id')
        .eq('slug', scooterSlug)
        .maybeSingle();
      
      if (scooterError || !scooterData) {
        console.error('Error fetching scooter model:', scooterError);
        return [];
      }
      
      // Then get battery configs for this model
      const { data, error } = await supabase
        .from('scooter_battery_configs')
        .select('voltage, amperage, is_default')
        .eq('scooter_model_id', scooterData.id)
        .order('voltage')
        .order('amperage');
      
      if (error) {
        console.error('Error fetching battery configs:', error);
        return [];
      }
      
      return (data as BatteryConfig[]) || [];
    },
    enabled: !!scooterSlug,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Helper to get available voltages from configs
export const getAvailableVoltages = (configs: BatteryConfig[]): number[] => {
  return [...new Set(configs.map(c => c.voltage))].sort((a, b) => a - b);
};

// Helper to get available amperages for a specific voltage
export const getAvailableAmperages = (configs: BatteryConfig[], voltage: number): number[] => {
  return configs
    .filter(c => c.voltage === voltage)
    .map(c => c.amperage)
    .sort((a, b) => a - b);
};

// Helper to get default config
export const getDefaultConfig = (configs: BatteryConfig[]): BatteryConfig | null => {
  return configs.find(c => c.is_default) || configs[0] || null;
};
