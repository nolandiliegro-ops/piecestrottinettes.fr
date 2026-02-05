import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Check, Loader2, X } from 'lucide-react';
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

interface QuickAddModificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchPart {
  id: string;
  name: string;
  image_url: string | null;
  difficulty_level: number | null;
  category: { name: string } | null;
}

const QuickAddModificationDialog = ({
  open,
  onOpenChange,
}: QuickAddModificationDialogProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPart, setSelectedPart] = useState<SearchPart | null>(null);
  const [selectedScooterId, setSelectedScooterId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const { scooters, loading: scootersLoading } = useGarageScooters();
  const addModification = useAddGarageModification();

  // Search parts
  const { data: searchResults = [], isLoading: searchLoading } = useQuery({
    queryKey: ['search-parts', searchQuery],
    queryFn: async () => {
      if (searchQuery.length < 2) return [];
      
      const { data, error } = await supabase
        .from('parts')
        .select('id, name, image_url, difficulty_level, category:categories(name)')
        .ilike('name', `%${searchQuery}%`)
        .limit(10);
      
      if (error) throw error;
      return data as SearchPart[];
    },
    enabled: searchQuery.length >= 2,
  });

  // Check if first in category
  const categoryName = selectedPart?.category?.name;
  const { data: isFirstInCategory = false } = useQuery({
    queryKey: ['first-in-category-check', selectedScooterId, categoryName],
    queryFn: async () => {
      if (!selectedScooterId || !categoryName) return false;
      
      const { data } = await supabase
        .from('garage_modifications')
        .select('id, part:parts(category:categories(name))')
        .eq('user_garage_id', selectedScooterId);
      
      return !data?.some(mod => mod.part?.category?.name === categoryName);
    },
    enabled: !!selectedScooterId && !!categoryName,
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSelectedPart(null);
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
    if (!selectedScooterId || !selectedPart) return;
    
    await addModification.mutateAsync({
      garageItemId: selectedScooterId,
      partId: selectedPart.id,
      notes: notes.trim() || undefined,
    });
    
    onOpenChange(false);
  };

  const hasScooters = scooters && scooters.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white/95 backdrop-blur-xl border-white/20 rounded-2xl max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-carbon tracking-wide">
            Ajouter une modification
          </DialogTitle>
          <DialogDescription className="text-carbon/60">
            Enregistrez une pièce que vous avez installée
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Part Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-carbon block">
              Quelle pièce avez-vous installée ?
            </label>
            
            {selectedPart ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 p-3 bg-mineral/10 rounded-xl border border-mineral/20"
              >
                <div className="w-12 h-12 rounded-lg bg-white overflow-hidden flex-shrink-0">
                  {selectedPart.image_url ? (
                    <img 
                      src={selectedPart.image_url}
                      alt={selectedPart.name}
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">
                      🔧
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-carbon text-sm truncate">
                    {selectedPart.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedPart.category?.name && (
                      <span className="text-xs text-mineral">
                        {selectedPart.category.name}
                      </span>
                    )}
                    {selectedPart.difficulty_level && (
                      <DifficultyIndicator level={selectedPart.difficulty_level} />
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPart(null)}
                  className="p-1.5 hover:bg-carbon/10 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-carbon/60" />
                </button>
              </motion.div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-carbon/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une pièce..."
                  className="w-full pl-10 pr-4 py-3 bg-white/60 backdrop-blur-sm rounded-xl 
                           border border-mineral/20 text-carbon text-sm
                           placeholder:text-carbon/40
                           focus:outline-none focus:ring-2 focus:ring-mineral/30 focus:border-mineral/40
                           transition-all duration-200"
                />
                
                {/* Search Results Dropdown */}
                <AnimatePresence>
                  {searchQuery.length >= 2 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl 
                               border border-carbon/10 shadow-xl max-h-60 overflow-y-auto z-50"
                    >
                      {searchLoading ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="w-5 h-5 animate-spin text-mineral" />
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div className="p-4 text-center text-sm text-carbon/50">
                          Aucun résultat pour "{searchQuery}"
                        </div>
                      ) : (
                        <div className="py-1">
                          {searchResults.map((part, index) => (
                            <motion.button
                              key={part.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.03 }}
                              onClick={() => {
                                setSelectedPart(part);
                                setSearchQuery('');
                              }}
                              className="w-full flex items-center gap-3 p-3 hover:bg-greige/50 
                                       transition-colors text-left"
                            >
                              <div className="w-10 h-10 rounded-lg bg-greige overflow-hidden flex-shrink-0">
                                {part.image_url ? (
                                  <img 
                                    src={part.image_url}
                                    alt={part.name}
                                    className="w-full h-full object-contain p-1"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-lg">
                                    🔧
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-carbon text-sm truncate">
                                  {part.name}
                                </p>
                                {part.category?.name && (
                                  <p className="text-xs text-carbon/50">
                                    {part.category.name}
                                  </p>
                                )}
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

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
            {selectedScooterId && selectedPart && (
              <XPPreview
                difficultyLevel={selectedPart.difficulty_level}
                categoryName={selectedPart.category?.name || null}
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
              disabled={!selectedScooterId || !selectedPart || addModification.isPending}
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

export default QuickAddModificationDialog;
