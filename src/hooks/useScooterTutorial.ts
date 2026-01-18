import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Tutorial {
  id: string;
  title: string;
  youtube_video_id: string;
  difficulty: number;
  duration_minutes: number;
  scooter_model_id: string | null;
}

interface UseScooterTutorialResult {
  tutorial: Tutorial | null;
  isLoading: boolean;
  isGeneric: boolean;
  isDemo: boolean;
}

export const useScooterTutorial = (scooterModelId?: string | null): UseScooterTutorialResult => {
  const { data: tutorial, isLoading } = useQuery({
    queryKey: ['scooter-tutorial', scooterModelId],
    queryFn: async (): Promise<Tutorial | null> => {
      // 1. Chercher tutorial spécifique au modèle
      if (scooterModelId) {
        const { data: specificTutorial } = await supabase
          .from('tutorials')
          .select('id, title, youtube_video_id, difficulty, duration_minutes, scooter_model_id')
          .eq('scooter_model_id', scooterModelId)
          .order('difficulty', { ascending: true })
          .limit(1)
          .maybeSingle();
        
        if (specificTutorial) return specificTutorial;
      }
      
      // 2. Fallback vers tutorial générique (safe charging, maintenance)
      const { data: genericTutorial } = await supabase
        .from('tutorials')
        .select('id, title, youtube_video_id, difficulty, duration_minutes, scooter_model_id')
        .is('scooter_model_id', null)
        .order('difficulty', { ascending: true })
        .limit(1)
        .maybeSingle();
      
      return genericTutorial || null;
    },
    enabled: true, // Toujours actif pour avoir au moins le fallback
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
  });

  return {
    tutorial: tutorial || null,
    isLoading,
    isGeneric: !!tutorial && !tutorial.scooter_model_id,
    isDemo: !tutorial,
  };
};
