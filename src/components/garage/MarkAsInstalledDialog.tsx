import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, Check, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useGarageScooters } from '@/hooks/useGarageScooters';
import { useAddGarageModification } from '@/hooks/useGarageModifications';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import XPPreview from './XPPreview';
import DifficultyIndicator from '@/components/parts/DifficultyIndicator';

interface MarkAsInstalledDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partId: string;
  partName: string;
  partImage?: string | null;
  categoryName?: string | null;
  difficultyLevel?: number | null;
  orderItemId?: string;
}

const MarkAsInstalledDialog = ({
  open,
  onOpenChange,
  partId,
  partName,
  partImage,
  categoryName,
  difficultyLevel,
  orderItemId,
}: MarkAsInstalledDialogProps) => {
  const [selectedScooterId, setSelectedScooterId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const { scooters, loading: scootersLoading } = useGarageScooters();
  const addModification = useAddGarageModification();

  // Check if this would be first in category for selected scooter
  const { data: isFirstInCategory = false } = useQuery({
    queryKey: ['first-in-category-check', selectedScooterId, categoryName],
    queryFn: async () => {
      if (!selectedScooterId || !categoryName) return false;
      
      const { data } = await supabase
        .from('garage_modifications')
        .select('id, part:parts(category:categories(name))')
        .eq('user_garage_id', selectedScooterId);
      
      // Check if any existing modification has the same category
      return !data?.some(mod => mod.part?.category?.name === categoryName);
    },
    enabled: !!selectedScooterId && !!categoryName,
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedScooterId('');
      setNotes('');
    }
  }, [open]);

  // Auto-select if only one scooter
  useEffect(() => {
    if (scooters && scooters.length === 1 && !selectedScooterId) {
      setSelectedScooterId(scooters[0].id);
    }
  }, [scooters, selectedScooterId]);

  const handleConfirm = async () => {
    if (!selectedScooterId) return;
    
    await addModification.mutateAsync({
      garageItemId: selectedScooterId,
      partId,
      notes: notes.trim() || undefined,
      orderItemId,
    });
    
    onOpenChange(false);
  };

  const hasScooters = scooters && scooters.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white/95 backdrop-blur-xl border-white/20 rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-carbon tracking-wide">
            Marquer comme installé
          </DialogTitle>
          <DialogDescription className="text-carbon/60">
            Enregistrez cette installation dans votre garage et gagnez des XP !
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Part Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 p-4 bg-greige/50 rounded-xl border border-carbon/5"
          >
            <div className="w-16 h-16 rounded-xl bg-white/80 overflow-hidden flex-shrink-0 border border-carbon/10">
              {partImage ? (
                <img 
                  src={partImage}
                  alt={partName}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">
                  🔧
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-carbon text-sm line-clamp-2">
                {partName}
              </p>
              <div className="flex items-center gap-3 mt-1.5">
                {categoryName && (
                  <span className="text-xs text-mineral font-medium">
                    {categoryName}
                  </span>
                )}
                {difficultyLevel && (
                  <DifficultyIndicator level={difficultyLevel} />
                )}
              </div>
            </div>
          </motion.div>

          {/* Scooter Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-carbon block">
              Sur quelle trottinette ?
            </label>
            
            {scootersLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-mineral" />
              </div>
            ) : !hasScooters ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                <p className="text-sm text-amber-700">
                  Ajoutez d'abord une trottinette à votre garage
                </p>
              </div>
            ) : (
              <select
                value={selectedScooterId}
                onChange={(e) => setSelectedScooterId(e.target.value)}
                className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm rounded-xl 
                         border border-mineral/20 text-carbon text-sm
                         focus:outline-none focus:ring-2 focus:ring-mineral/30 focus:border-mineral/40
                         transition-all duration-200"
              >
                <option value="">Sélectionner...</option>
                {scooters.map(scooter => (
                  <option key={scooter.id} value={scooter.id}>
                    {scooter.nickname || scooter.scooter_model.name}
                    {scooter.scooter_model.brand && ` (${scooter.scooter_model.brand})`}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-carbon block">
              Notes <span className="text-carbon/40 font-normal">(optionnel)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 500))}
              placeholder="Installation facile, remplacement préventif..."
              rows={3}
              className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm rounded-xl 
                       border border-mineral/20 text-carbon text-sm resize-none
                       placeholder:text-carbon/40
                       focus:outline-none focus:ring-2 focus:ring-mineral/30 focus:border-mineral/40
                       transition-all duration-200"
            />
            <p className="text-[10px] text-carbon/40 text-right">
              {notes.length}/500
            </p>
          </div>

          {/* XP Preview */}
          <AnimatePresence>
            {selectedScooterId && (
              <XPPreview
                difficultyLevel={difficultyLevel || null}
                categoryName={categoryName || null}
                isFirstInCategory={isFirstInCategory}
              />
            )}
          </AnimatePresence>

          {/* Confirm Button */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Button
              onClick={handleConfirm}
              disabled={!selectedScooterId || addModification.isPending}
              className="w-full h-12 bg-mineral hover:bg-mineral/90 text-white 
                       font-display text-sm uppercase tracking-wider rounded-xl
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-300"
            >
              {addModification.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Check className="w-5 h-5 mr-2" />
              )}
              Confirmer l'installation
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MarkAsInstalledDialog;
