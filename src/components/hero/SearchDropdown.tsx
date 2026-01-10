import { motion, AnimatePresence } from "framer-motion";
import { Bike } from "lucide-react";

interface SearchResult {
  slug: string;
  name: string;
  brandName: string;
}

interface SearchDropdownProps {
  results: SearchResult[];
  isVisible: boolean;
  isLoading: boolean;
  onSelect: (slug: string) => void;
}

const SearchDropdown = ({ 
  results, 
  isVisible, 
  isLoading,
  onSelect 
}: SearchDropdownProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="absolute top-full left-0 right-0 mt-2 z-50 glass rounded-xl overflow-hidden shadow-xl border border-foreground/10"
        >
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-muted-foreground animate-pulse">
              Recherche...
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              Aucun résultat trouvé
            </div>
          ) : (
            <ul className="py-1">
              {results.map((result, index) => (
                <motion.li
                  key={result.slug}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <button
                    onClick={() => onSelect(result.slug)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary/10 transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Bike className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {result.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {result.brandName}
                      </p>
                    </div>
                  </button>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchDropdown;
