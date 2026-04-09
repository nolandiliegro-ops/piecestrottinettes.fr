import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, Trash2, Bot, Zap, Gauge, Route, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const usePendingScooters = () => {
  return useQuery({
    queryKey: ['pending-scooters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scooter_models')
        .select('*, brand:brands(id, name, slug)')
        .eq('published', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
};

const PendingScootersManager = () => {
  const queryClient = useQueryClient();
  const { data: pending = [], isLoading } = usePendingScooters();
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      setPublishingId(id);
      const { error } = await supabase
        .from('scooter_models')
        .update({ published: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-scooters'] });
      queryClient.invalidateQueries({ queryKey: ['scooter_models'] });
      toast.success('Trottinette publiée !');
      setPublishingId(null);
    },
    onError: () => {
      toast.error('Erreur lors de la publication');
      setPublishingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      setDeletingId(id);
      const { error } = await supabase
        .from('scooter_models')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-scooters'] });
      toast.success('Trottinette supprimée');
      setDeletingId(null);
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
      setDeletingId(null);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (pending.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Bot className="w-12 h-12 text-[hsl(0_0%_30%)] mb-4" />
        <p className="text-[hsl(0_0%_55%)] text-sm">Aucune trottinette en attente de validation</p>
        <p className="text-[hsl(0_0%_40%)] text-xs mt-1">Les imports bot apparaîtront ici</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[hsl(0_0%_55%)] text-sm">
        {pending.length} trottinette{pending.length > 1 ? 's' : ''} en attente
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {pending.map((scooter) => (
          <Card key={scooter.id} className="bg-[hsl(0_0%_12%)] border-[hsl(0_0%_18%)] overflow-hidden">
            <CardContent className="p-0">
              {/* Image */}
              <div className="relative h-40 bg-[hsl(0_0%_8%)] flex items-center justify-center">
                {scooter.image_url ? (
                  <img
                    src={scooter.image_url}
                    alt={scooter.name}
                    className="h-full w-full object-contain p-4"
                  />
                ) : (
                  <div className="text-[hsl(0_0%_25%)] text-4xl">🛴</div>
                )}
                <Badge className="absolute top-2 left-2 bg-violet-600/90 text-white text-[10px] gap-1">
                  <Bot className="w-3 h-3" />
                  Bot
                </Badge>
              </div>

              {/* Info */}
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-[hsl(0_0%_45%)] text-xs">{scooter.brand?.name || '—'}</p>
                  <h3 className="text-[hsl(0_0%_90%)] font-semibold text-sm truncate">{scooter.name}</h3>
                </div>

                {/* Specs row */}
                <div className="flex flex-wrap gap-2 text-[10px]">
                  {scooter.power_watts && (
                    <span className="flex items-center gap-1 text-[hsl(0_0%_55%)] bg-[hsl(0_0%_15%)] px-2 py-0.5 rounded-full">
                      <Zap className="w-3 h-3 text-amber-500" />{scooter.power_watts}W
                    </span>
                  )}
                  {scooter.max_speed_kmh && (
                    <span className="flex items-center gap-1 text-[hsl(0_0%_55%)] bg-[hsl(0_0%_15%)] px-2 py-0.5 rounded-full">
                      <Gauge className="w-3 h-3 text-blue-400" />{scooter.max_speed_kmh}km/h
                    </span>
                  )}
                  {scooter.range_km && (
                    <span className="flex items-center gap-1 text-[hsl(0_0%_55%)] bg-[hsl(0_0%_15%)] px-2 py-0.5 rounded-full">
                      <Route className="w-3 h-3 text-green-400" />{scooter.range_km}km
                    </span>
                  )}
                  {scooter.year && (
                    <span className="flex items-center gap-1 text-[hsl(0_0%_55%)] bg-[hsl(0_0%_15%)] px-2 py-0.5 rounded-full">
                      <Calendar className="w-3 h-3 text-muted-foreground" />{scooter.year}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
                    onClick={() => publishMutation.mutate(scooter.id)}
                    disabled={publishingId === scooter.id}
                  >
                    {publishingId === scooter.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                    Publier
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-destructive/30 text-destructive hover:bg-destructive/10 text-xs gap-1.5"
                        disabled={deletingId === scooter.id}
                      >
                        {deletingId === scooter.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[hsl(0_0%_12%)] border-[hsl(0_0%_18%)]">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-[hsl(0_0%_90%)]">Supprimer cette trottinette ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          "{scooter.name}" sera définitivement supprimée.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-[hsl(0_0%_15%)] border-[hsl(0_0%_20%)] text-[hsl(0_0%_70%)]">
                          Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground"
                          onClick={() => deleteMutation.mutate(scooter.id)}
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export { usePendingScooters };
export default PendingScootersManager;
