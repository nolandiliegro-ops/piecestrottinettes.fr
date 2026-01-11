import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PartCard from "./parts/PartCard";
import { useCompatibleParts, useCompatiblePartsCount } from "@/hooks/useScooterData";

interface BentoDiscoverySectionProps {
  activeModelSlug: string | null;
  activeModelName?: string;
}

const BentoDiscoverySection = ({ 
  activeModelSlug, 
  activeModelName 
}: BentoDiscoverySectionProps) => {
  const navigate = useNavigate();
  const { data: parts = [], isLoading } = useCompatibleParts(activeModelSlug, 6);
  const { data: totalCount = 0 } = useCompatiblePartsCount(activeModelSlug);

  const handleViewAll = () => {
    navigate("/catalogue");
  };

  if (!activeModelSlug) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Sparkles className="w-16 h-16 text-mineral mx-auto mb-4" />
          <h3 className="font-display text-2xl text-carbon mb-2">
            DÉCOUVREZ VOS PIÈCES
          </h3>
          <p className="text-sm text-muted-foreground">
            Sélectionnez un modèle de trottinette pour voir les pièces compatibles
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Compact Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <h2 className="font-display text-2xl lg:text-3xl text-carbon mb-1">
          PIÈCES COMPATIBLES
        </h2>
        {activeModelName && (
          <p className="text-xs text-muted-foreground">
            Pour votre <span className="text-mineral font-medium">{activeModelName}</span>
          </p>
        )}
      </motion.div>

      {/* Scrollable Parts Grid - Compact */}
      <div className="flex-1 overflow-y-auto scrollbar-hide pr-2">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white/40 rounded-xl p-4">
                <Skeleton className="aspect-square rounded-lg mb-3" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : parts.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModelSlug}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 gap-3"
            >
              {parts.map((part, index) => (
                <PartCard 
                  key={part.id} 
                  part={part} 
                  index={index}
                  className="bg-white/60 hover:bg-white/80"
                />
              ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm text-muted-foreground">
              Aucune pièce compatible trouvée pour ce modèle.
            </p>
          </motion.div>
        )}
      </div>

      {/* CTA - Fixed at bottom */}
      {totalCount > 6 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-6 pt-4 border-t border-white/30"
        >
          <Button
            onClick={handleViewAll}
            className="w-full rounded-full py-6 font-display text-base tracking-wide gap-2 bg-carbon text-greige hover:bg-carbon/90 hover:scale-[1.02] transition-all"
          >
            VOIR LES {totalCount} PIÈCES
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default BentoDiscoverySection;
