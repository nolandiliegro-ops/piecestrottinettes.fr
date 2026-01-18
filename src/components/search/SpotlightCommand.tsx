import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Bike, 
  Wrench, 
  Play, 
  Home, 
  BookOpen,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';
import { useSpotlight } from '@/contexts/SpotlightContext';
import { useUnifiedSearch } from '@/hooks/useUnifiedSearch';
import { formatPrice } from '@/lib/formatPrice';
import { cn } from '@/lib/utils';

// Quick actions when search is empty
const quickActions = [
  { 
    id: 'garage',
    label: 'Aller au Garage', 
    icon: Bike, 
    href: '/garage', 
    shortcut: 'G',
    description: 'Voir mes trottinettes'
  },
  { 
    id: 'academy',
    label: 'Voir l\'Academy', 
    icon: Play, 
    href: '/tutos', 
    shortcut: 'A',
    description: 'Tutoriels et guides'
  },
  { 
    id: 'catalogue',
    label: 'Catalogue Pièces', 
    icon: Wrench, 
    href: '/catalogue', 
    shortcut: 'C',
    description: 'Toutes les pièces détachées'
  },
  { 
    id: 'scooters',
    label: 'Trottinettes', 
    icon: ShoppingBag, 
    href: '/trottinettes', 
    shortcut: 'T',
    description: 'Explorer les modèles'
  },
];

// Difficulty dots component
const DifficultyDots = ({ level }: { level: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3].map((dot) => (
      <div
        key={dot}
        className={cn(
          "w-1.5 h-1.5 rounded-full transition-colors",
          dot <= level ? "bg-primary" : "bg-mineral/20"
        )}
      />
    ))}
  </div>
);

const SpotlightCommand = () => {
  const { isOpen, closeSpotlight } = useSpotlight();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  
  const { data: searchResults, isLoading } = useUnifiedSearch(searchQuery);
  
  const hasResults = searchResults && (
    searchResults.scooters.length > 0 || 
    searchResults.parts.length > 0 || 
    searchResults.tutorials.length > 0
  );

  // Build flat list of all items for keyboard navigation
  const allItems = searchQuery.length >= 2 
    ? [
        ...searchResults?.scooters.map((s) => ({ type: 'scooter' as const, data: s })) || [],
        ...searchResults?.parts.map((p) => ({ type: 'part' as const, data: p })) || [],
        ...searchResults?.tutorials.map((t) => ({ type: 'tutorial' as const, data: t })) || [],
      ]
    : quickActions.map((a) => ({ type: 'action' as const, data: a }));

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [searchQuery, searchResults]);

  // Reset search when closed
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setActiveIndex(0);
    }
  }, [isOpen]);

  const handleSelect = useCallback((item: typeof allItems[number]) => {
    closeSpotlight();
    
    if (item.type === 'action') {
      navigate(item.data.href);
    } else if (item.type === 'scooter') {
      navigate(`/scooter/${item.data.slug}`);
    } else if (item.type === 'part') {
      navigate(`/piece/${item.data.slug}`);
    } else if (item.type === 'tutorial') {
      navigate(`/tutos`);
    }
  }, [closeSpotlight, navigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) => Math.min(prev + 1, allItems.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (allItems[activeIndex]) {
            handleSelect(allItems[activeIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          closeSpotlight();
          break;
        // Quick action shortcuts (only when search is empty)
        case 'g':
        case 'G':
          if (searchQuery.length === 0 && !e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            navigate('/garage');
            closeSpotlight();
          }
          break;
        case 'a':
        case 'A':
          if (searchQuery.length === 0 && !e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            navigate('/tutos');
            closeSpotlight();
          }
          break;
        case 'c':
        case 'C':
          if (searchQuery.length === 0 && !e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            navigate('/catalogue');
            closeSpotlight();
          }
          break;
        case 't':
        case 'T':
          if (searchQuery.length === 0 && !e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            navigate('/trottinettes');
            closeSpotlight();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, allItems, activeIndex, handleSelect, closeSpotlight, searchQuery, navigate]);

  // Get flat index for highlighting
  const getFlatIndex = (type: string, index: number): number => {
    if (searchQuery.length < 2) return index;
    
    let offset = 0;
    if (type === 'part') {
      offset = searchResults?.scooters.length || 0;
    } else if (type === 'tutorial') {
      offset = (searchResults?.scooters.length || 0) + (searchResults?.parts.length || 0);
    }
    return offset + index;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={closeSpotlight}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ 
              duration: 0.2, 
              ease: [0.16, 1, 0.3, 1]
            }}
            className="fixed left-1/2 top-[15vh] z-[101] w-full max-w-2xl -translate-x-1/2 px-4"
          >
            <div className="overflow-hidden rounded-2xl bg-white/95 backdrop-blur-2xl 
                          border-[0.5px] border-mineral/10 
                          shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
              
              {/* Search Input */}
              <div className="relative flex items-center border-b border-mineral/10">
                <Search className="absolute left-5 w-5 h-5 text-mineral/50" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Rechercher modèles, pièces, tutos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-16 w-full bg-transparent pl-14 pr-20 text-lg 
                           placeholder:text-carbon/40 focus:outline-none"
                />
                <div className="absolute right-5 flex items-center gap-2">
                  <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded-md 
                                bg-mineral/10 px-2 font-mono text-[11px] text-carbon/60">
                    ⌘K
                  </kbd>
                </div>
              </div>

              {/* Content */}
              <div className="max-h-[60vh] overflow-y-auto">
                {/* Quick Actions (when search is empty) */}
                {searchQuery.length < 2 && (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: { 
                        opacity: 1,
                        transition: { staggerChildren: 0.05 }
                      }
                    }}
                    className="p-2"
                  >
                    <div className="px-3 py-2">
                      <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-mineral/60">
                        ACTIONS RAPIDES
                      </span>
                    </div>
                    {quickActions.map((action, index) => (
                      <motion.div
                        key={action.id}
                        variants={{
                          hidden: { opacity: 0, x: -10 },
                          visible: { opacity: 1, x: 0 }
                        }}
                        onClick={() => {
                          navigate(action.href);
                          closeSpotlight();
                        }}
                        className={cn(
                          "flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer",
                          "transition-all duration-150",
                          activeIndex === index 
                            ? "bg-mineral/10" 
                            : "hover:bg-mineral/5"
                        )}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl 
                                      bg-gradient-to-br from-primary/20 to-primary/5">
                          <action.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-carbon">{action.label}</p>
                          <p className="text-xs text-mineral/60">{action.description}</p>
                        </div>
                        <kbd className="h-6 min-w-6 flex items-center justify-center rounded-md 
                                      bg-mineral/10 px-2 font-mono text-[11px] text-carbon/60">
                          {action.shortcut}
                        </kbd>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* Loading State */}
                {searchQuery.length >= 2 && isLoading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-3 text-mineral/60">
                      <div className="w-5 h-5 border-2 border-mineral/30 border-t-primary rounded-full animate-spin" />
                      <span className="text-sm">Recherche en cours...</span>
                    </div>
                  </div>
                )}

                {/* No Results */}
                {searchQuery.length >= 2 && !isLoading && !hasResults && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Search className="w-10 h-10 text-mineral/30 mb-3" />
                    <p className="text-sm text-carbon/70">Aucun résultat pour "{searchQuery}"</p>
                    <p className="text-xs text-mineral/60 mt-1">Essayez avec d'autres termes</p>
                  </div>
                )}

                {/* Search Results */}
                {searchQuery.length >= 2 && !isLoading && hasResults && (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: { 
                        opacity: 1,
                        transition: { staggerChildren: 0.08 }
                      }
                    }}
                    className="p-2"
                  >
                    {/* Scooters Section */}
                    {searchResults?.scooters && searchResults.scooters.length > 0 && (
                      <motion.div
                        variants={{
                          hidden: { opacity: 0, y: 10 },
                          visible: { opacity: 1, y: 0 }
                        }}
                        className="mb-2"
                      >
                        <div className="flex items-center gap-2 px-3 py-2">
                          <Bike className="w-3.5 h-3.5 text-mineral/50" />
                          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-mineral/60">
                            MODÈLES
                          </span>
                        </div>
                        {searchResults.scooters.map((scooter, index) => (
                          <div
                            key={scooter.slug}
                            onClick={() => handleSelect({ type: 'scooter', data: scooter })}
                            className={cn(
                              "flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer",
                              "transition-all duration-150",
                              activeIndex === getFlatIndex('scooter', index)
                                ? "bg-mineral/10"
                                : "hover:bg-mineral/5"
                            )}
                          >
                            {scooter.imageUrl ? (
                              <img 
                                src={scooter.imageUrl} 
                                alt={scooter.name}
                                className="w-10 h-10 object-contain rounded-lg bg-greige/50 p-1"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-greige/50 flex items-center justify-center">
                                <Bike className="w-5 h-5 text-mineral/40" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-carbon truncate">{scooter.name}</p>
                              <p className="text-xs text-mineral/60">{scooter.brandName}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-mineral/30" />
                          </div>
                        ))}
                      </motion.div>
                    )}

                    {/* Parts Section */}
                    {searchResults?.parts && searchResults.parts.length > 0 && (
                      <motion.div
                        variants={{
                          hidden: { opacity: 0, y: 10 },
                          visible: { opacity: 1, y: 0 }
                        }}
                        className="mb-2"
                      >
                        <div className="flex items-center gap-2 px-3 py-2">
                          <Wrench className="w-3.5 h-3.5 text-mineral/50" />
                          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-mineral/60">
                            PIÈCES
                          </span>
                        </div>
                        {searchResults.parts.map((part, index) => (
                          <div
                            key={part.slug}
                            onClick={() => handleSelect({ type: 'part', data: part })}
                            className={cn(
                              "flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer",
                              "transition-all duration-150",
                              activeIndex === getFlatIndex('part', index)
                                ? "bg-mineral/10"
                                : "hover:bg-mineral/5"
                            )}
                          >
                            {part.imageUrl ? (
                              <img 
                                src={part.imageUrl} 
                                alt={part.name}
                                className="w-10 h-10 object-contain rounded-lg bg-greige/50 p-1"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-greige/50 flex items-center justify-center">
                                <Wrench className="w-5 h-5 text-mineral/40" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-carbon truncate">{part.name}</p>
                              <p className="text-xs text-mineral/60">{part.category}</p>
                            </div>
                            {part.price && (
                              <span className="text-sm font-semibold text-primary">
                                {formatPrice(part.price)}
                              </span>
                            )}
                          </div>
                        ))}
                      </motion.div>
                    )}

                    {/* Tutorials Section */}
                    {searchResults?.tutorials && searchResults.tutorials.length > 0 && (
                      <motion.div
                        variants={{
                          hidden: { opacity: 0, y: 10 },
                          visible: { opacity: 1, y: 0 }
                        }}
                      >
                        <div className="flex items-center gap-2 px-3 py-2">
                          <Play className="w-3.5 h-3.5 text-mineral/50" />
                          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-mineral/60">
                            ACADEMY
                          </span>
                        </div>
                        {searchResults.tutorials.map((tutorial, index) => (
                          <div
                            key={tutorial.slug}
                            onClick={() => handleSelect({ type: 'tutorial', data: tutorial })}
                            className={cn(
                              "flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer",
                              "transition-all duration-150",
                              activeIndex === getFlatIndex('tutorial', index)
                                ? "bg-mineral/10"
                                : "hover:bg-mineral/5"
                            )}
                          >
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 
                                          flex items-center justify-center">
                              <Play className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-carbon truncate">{tutorial.title}</p>
                              {tutorial.scooterName && (
                                <p className="text-xs text-mineral/60">{tutorial.scooterName}</p>
                              )}
                            </div>
                            <DifficultyDots level={tutorial.difficulty} />
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Footer with keyboard hints */}
              <div className="flex items-center justify-between border-t border-mineral/10 
                            px-4 py-2.5 bg-mineral/5">
                <div className="flex items-center gap-4 text-[11px] text-mineral/60">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-white border border-mineral/20 font-mono">↑↓</kbd>
                    naviguer
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-white border border-mineral/20 font-mono">↵</kbd>
                    sélectionner
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-white border border-mineral/20 font-mono">esc</kbd>
                    fermer
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SpotlightCommand;
