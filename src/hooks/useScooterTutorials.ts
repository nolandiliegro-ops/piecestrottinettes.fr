import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Tutorial {
  id: string;
  title: string;
  youtube_video_id: string;
  difficulty: number;
  duration_minutes: number;
  scooter_model_id: string | null;
  description: string | null;
  slug: string;
}

interface UseScooterTutorialsResult {
  tutorials: Tutorial[];
  isLoading: boolean;
  modelSpecificCount: number;
  genericCount: number;
}

export const useScooterTutorials = (scooterModelId?: string | null): UseScooterTutorialsResult => {
  const { data, isLoading } = useQuery({
    queryKey: ['scooter-tutorials-all', scooterModelId],
    queryFn: async (): Promise<{ tutorials: Tutorial[]; modelSpecificCount: number; genericCount: number }> => {
      const tutorials: Tutorial[] = [];
      let modelSpecificCount = 0;
      let genericCount = 0;
      
      // 1. Tutoriels spécifiques au modèle
      if (scooterModelId) {
        const { data: modelTutorials } = await supabase
          .from('tutorials')
          .select('id, title, youtube_video_id, difficulty, duration_minutes, scooter_model_id, description, slug')
          .eq('scooter_model_id', scooterModelId)
          .order('difficulty', { ascending: true });
        
        if (modelTutorials) {
          tutorials.push(...modelTutorials);
          modelSpecificCount = modelTutorials.length;
        }
      }
      
      // 2. Tutoriels génériques (maintenance universelle)
      const { data: genericTutorials } = await supabase
        .from('tutorials')
        .select('id, title, youtube_video_id, difficulty, duration_minutes, scooter_model_id, description, slug')
        .is('scooter_model_id', null)
        .order('difficulty', { ascending: true });
      
      if (genericTutorials) {
        tutorials.push(...genericTutorials);
        genericCount = genericTutorials.length;
      }
      
      return { tutorials, modelSpecificCount, genericCount };
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
  });

  return {
    tutorials: data?.tutorials || [],
    isLoading,
    modelSpecificCount: data?.modelSpecificCount || 0,
    genericCount: data?.genericCount || 0,
  };
};
