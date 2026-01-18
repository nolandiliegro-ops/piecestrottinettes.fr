import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bike, Wrench, Play, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UnifiedSearchResults } from '@/hooks/useUnifiedSearch';
import { formatPrice } from '@/lib/formatPrice';

interface EliteSearchDropdownProps {
  results: UnifiedSearchResults | undefined;
  isVisible: boolean;
  isLoading: boolean;
  onClose: () => void;
}

// Difficulty indicator for tutorials
const DifficultyDots = ({ level }: { level: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3].map((dot) => (
      <span
        key={dot}
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          dot <= level ? 'bg-mineral' : 'bg-mineral/20'
        )}
      />
    ))}
  </div>
);

const EliteSearchDropdown = ({ 
  results, 
  isVisible, 
  isLoading, 
  onClose 
}: EliteSearchDropdownProps) => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(-1);

  // Flatten all results for keyboard navigation
  const allItems = [
    ...(results?.scooters || []).map((s) => ({ type: 'scooter' as const, ...s })),
    ...(results?.parts || []).map((p) => ({ type: 'part' as const, ...p })),
    ...(results?.tutorials || []).map((t) => ({ type: 'tutorial' as const, ...t })),
  ];

  const totalResults = allItems.length;
  const hasResults = totalResults > 0;

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isVisible) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev < totalResults - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : totalResults - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && allItems[activeIndex]) {
          handleSelect(allItems[activeIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [isVisible, totalResults, activeIndex, allItems, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  const handleSelect = (item: typeof allItems[0]) => {
    switch (item.type) {
      case 'scooter':
        navigate(`/trottinette/${item.slug}`);
        break;
      case 'part':
        navigate(`/piece/${item.slug}`);
        break;
      case 'tutorial':
        navigate(`/tutos`);
        break;
    }
    onClose();
  };

  // Get the flat index for an item
  const getFlatIndex = (type: 'scooter' | 'part' | 'tutorial', index: number) => {
    let offset = 0;
    if (type === 'part') offset = results?.scooters?.length || 0;
    if (type === 'tutorial') offset = (results?.scooters?.length || 0) + (results?.parts?.length || 0);
    return offset + index;
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl 
                   border-[0.5px] border-mineral/10 shadow-2xl rounded-xl overflow-hidden z-50"
      >
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-mineral" />
          </div>
        )}

        {/* No Results */}
        {!isLoading && !hasResults && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-carbon/50">Aucun résultat</p>
            <p className="text-xs text-carbon/30 mt-1">Essayez un autre terme</p>
          </div>
        )}

        {/* Results by Category */}
        {!isLoading && hasResults && (
          <div className="max-h-[400px] overflow-y-auto">
            
            {/* MODÈLES Section */}
            {results?.scooters && results.scooters.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0 }}
              >
                <div className="px-4 py-2 border-b border-mineral/5">
                  <span className="text-[10px] tracking-[0.2em] uppercase text-mineral/60 font-semibold flex items-center gap-2">
                    <Bike className="w-3 h-3" />
                    MODÈLES
                  </span>
                </div>
                {results.scooters.map((scooter, idx) => (
                  <motion.div
                    key={scooter.slug}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * (idx + 1) }}
                    onClick={() => handleSelect({ type: 'scooter', ...scooter })}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200',
                      activeIndex === getFlatIndex('scooter', idx) 
                        ? 'bg-mineral/10' 
                        : 'hover:bg-mineral/5'
                    )}
                  >
                    {scooter.imageUrl ? (
                      <img 
                        src={scooter.imageUrl} 
                        alt={scooter.name}
                        className="w-10 h-10 object-contain rounded-lg bg-greige p-1"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-greige flex items-center justify-center">
                        <Bike className="w-5 h-5 text-mineral/40" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-carbon truncate">{scooter.name}</p>
                      <p className="text-xs text-carbon/50">{scooter.brandName}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* PIÈCES Section */}
            {results?.parts && results.parts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="px-4 py-2 border-b border-mineral/5 bg-mineral/[0.02]">
                  <span className="text-[10px] tracking-[0.2em] uppercase text-mineral/60 font-semibold flex items-center gap-2">
                    <Wrench className="w-3 h-3" />
                    PIÈCES
                  </span>
                </div>
                {results.parts.map((part, idx) => (
                  <motion.div
                    key={part.slug}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * (idx + 1) + 0.1 }}
                    onClick={() => handleSelect({ type: 'part', ...part })}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200',
                      activeIndex === getFlatIndex('part', idx) 
                        ? 'bg-mineral/10' 
                        : 'hover:bg-mineral/5'
                    )}
                  >
                    {part.imageUrl ? (
                      <img 
                        src={part.imageUrl} 
                        alt={part.name}
                        className="w-10 h-10 object-contain rounded-lg bg-greige p-1"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-greige flex items-center justify-center">
                        <Wrench className="w-5 h-5 text-mineral/40" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-carbon truncate">{part.name}</p>
                      <div className="flex items-center gap-2 text-xs text-carbon/50">
                        <span>{part.category}</span>
                        {part.price && (
                          <>
                            <span>•</span>
                            <span className="font-medium text-mineral">{formatPrice(part.price)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* ACADEMY Section */}
            {results?.tutorials && results.tutorials.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="px-4 py-2 border-b border-mineral/5 bg-mineral/[0.02]">
                  <span className="text-[10px] tracking-[0.2em] uppercase text-mineral/60 font-semibold flex items-center gap-2">
                    <Play className="w-3 h-3" />
                    ACADEMY
                  </span>
                </div>
                {results.tutorials.map((tutorial, idx) => (
                  <motion.div
                    key={tutorial.slug}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * (idx + 1) + 0.2 }}
                    onClick={() => handleSelect({ type: 'tutorial', ...tutorial })}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200',
                      activeIndex === getFlatIndex('tutorial', idx) 
                        ? 'bg-mineral/10' 
                        : 'hover:bg-mineral/5'
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <Play className="w-5 h-5 text-red-500" fill="currentColor" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-carbon truncate">{tutorial.title}</p>
                      <div className="flex items-center gap-2 text-xs text-carbon/50">
                        <DifficultyDots level={tutorial.difficulty} />
                        {tutorial.scooterName && (
                          <>
                            <span>•</span>
                            <span>{tutorial.scooterName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        )}

        {/* Keyboard hints */}
        {hasResults && (
          <div className="px-4 py-2 border-t border-mineral/5 bg-mineral/[0.02] flex items-center justify-center gap-4 text-[10px] text-carbon/40">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-mineral/20 font-mono">↑↓</kbd>
              naviguer
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-mineral/20 font-mono">↵</kbd>
              sélectionner
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-mineral/20 font-mono">esc</kbd>
              fermer
            </span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default EliteSearchDropdown;
