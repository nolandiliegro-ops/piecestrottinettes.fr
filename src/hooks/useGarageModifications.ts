import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useExperiencePoints } from './useExperiencePoints';
import { toast } from 'sonner';

interface GarageModification {
  id: string;
  user_garage_id: string;
  part_id: string;
  order_item_id: string | null;
  installed_at: string;
  difficulty_level: number | null;
  notes: string | null;
  xp_earned: number;
  created_at: string;
  part: {
    id: string;
    name: string;
    image_url: string | null;
    difficulty_level: number | null;
    category: {
      name: string;
    } | null;
  } | null;
}

// Fetch modifications for a garage item
export const useGarageModifications = (garageItemId: string | undefined) => {
  return useQuery({
    queryKey: ['garage-modifications', garageItemId],
    queryFn: async () => {
      if (!garageItemId) return [];
      
      const { data, error } = await supabase
        .from('garage_modifications')
        .select(`
          id,
          user_garage_id,
          part_id,
          order_item_id,
          installed_at,
          difficulty_level,
          notes,
          xp_earned,
          created_at,
          part:parts(
            id,
            name,
            image_url,
            difficulty_level,
            category:categories(name)
          )
        `)
        .eq('user_garage_id', garageItemId)
        .order('installed_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as GarageModification[];
    },
    enabled: !!garageItemId,
  });
};

// Add a new modification
export const useAddGarageModification = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const { addPoints } = useExperiencePoints();

  return useMutation({
    mutationFn: async ({
      garageItemId,
      partId,
      notes,
      orderItemId,
    }: {
      garageItemId: string;
      partId: string;
      notes?: string;
      orderItemId?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Get part info for XP calculation
      const { data: part, error: partError } = await supabase
        .from('parts')
        .select('name, difficulty_level, category:categories(name)')
        .eq('id', partId)
        .maybeSingle();

      if (partError) throw partError;
      if (!part) throw new Error('Part not found');

      const categoryName = part.category?.name || 'Autres';
      const difficultyLevel = part.difficulty_level || 2;

      // Check if this is the first part in this category for this garage item
      const { data: existingMods } = await supabase
        .from('garage_modifications')
        .select('id, part:parts(category:categories(name))')
        .eq('user_garage_id', garageItemId);

      const isFirstInCategory = !existingMods?.some(
        mod => mod.part?.category?.name === categoryName
      );

      // Calculate XP via RPC
      const { data: xpEarned, error: xpError } = await supabase.rpc('calculate_modification_xp', {
        p_difficulty_level: difficultyLevel,
        p_category_name: categoryName,
        p_is_first_in_category: isFirstInCategory,
      });

      if (xpError) {
        console.error('XP calculation error:', xpError);
      }

      const finalXp = xpEarned || 15;

      // Insert the modification
      const { data, error } = await supabase
        .from('garage_modifications')
        .insert({
          user_garage_id: garageItemId,
          part_id: partId,
          order_item_id: orderItemId || null,
          difficulty_level: difficultyLevel,
          notes: notes || null,
          xp_earned: finalXp,
        })
        .select()
        .single();

      if (error) throw error;

      return { 
        modification: data, 
        xpEarned: finalXp, 
        partName: part.name,
        isFirstInCategory 
      };
    },
    onSuccess: async ({ xpEarned, partName }) => {
      queryClient.invalidateQueries({ queryKey: ['garage-modifications'] });
      
      // Award XP via the Edge Function
      addPoints({ 
        pointsToAdd: xpEarned, 
        action: `Pièce installée : ${partName}` 
      });
      
      toast.success('Modification enregistrée !', {
        description: `+${xpEarned} XP gagnés`,
      });
    },
    onError: (error) => {
      console.error('Error adding modification:', error);
      toast.error('Erreur lors de l\'enregistrement');
    },
  });
};

// Delete a modification
export const useDeleteGarageModification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (modificationId: string) => {
      const { error } = await supabase
        .from('garage_modifications')
        .delete()
        .eq('id', modificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garage-modifications'] });
      toast.success('Modification supprimée');
    },
    onError: (error) => {
      console.error('Error deleting modification:', error);
      toast.error('Erreur lors de la suppression');
    },
  });
};

// Check if an order item has been marked as installed
export const useIsOrderItemInstalled = (orderItemId: string | undefined) => {
  return useQuery({
    queryKey: ['order-item-installed', orderItemId],
    queryFn: async () => {
      if (!orderItemId) return null;
      
      const { data, error } = await supabase
        .from('garage_modifications')
        .select('id, installed_at, user_garage_id')
        .eq('order_item_id', orderItemId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!orderItemId,
  });
};

// Check multiple order items at once (for orders page)
export const useOrderItemsInstallationStatus = (orderItemIds: string[]) => {
  return useQuery({
    queryKey: ['order-items-installation-status', orderItemIds],
    queryFn: async () => {
      if (!orderItemIds.length) return {};
      
      const { data, error } = await supabase
        .from('garage_modifications')
        .select('id, installed_at, order_item_id')
        .in('order_item_id', orderItemIds);
      
      if (error) throw error;
      
      // Create a map of order_item_id -> installation info
      const statusMap: Record<string, { installed: boolean; installedAt: string }> = {};
      data?.forEach(mod => {
        if (mod.order_item_id) {
          statusMap[mod.order_item_id] = {
            installed: true,
            installedAt: mod.installed_at,
          };
        }
      });
      
      return statusMap;
    },
    enabled: orderItemIds.length > 0,
  });
};
