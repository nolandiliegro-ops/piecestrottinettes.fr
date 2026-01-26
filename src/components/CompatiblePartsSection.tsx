import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PartCard from "./parts/PartCard";
import { useCompatibleParts, useCompatiblePartsCount } from "@/hooks/useScooterData";

interface CompatiblePartsSectionProps {
  activeModelSlug: string | null;
  activeModelName?: string;
}

const CompatiblePartsSection = ({ 
  activeModelSlug, 
  activeModelName 
}: CompatiblePartsSectionProps) => {
  const navigate = useNavigate();
  const { data: parts = [], isLoading } = useCompatibleParts(activeModelSlug, 8);
  const { data: totalCount = 0 } = useCompatiblePartsCount(activeModelSlug);

  const handleViewAll = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => navigate("/catalogue"), 300);
  };

  if (!activeModelSlug) {
    return (
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          className="flex flex-col items-center justify-center py-20 text-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Sparkles className="w-16 h-16 text-mineral mx-auto mb-4" />
          <h2 className="font-display text-3xl lg:text-4xl text-carbon mb-3">
            PIÈCES COMPATIBLES
          </h2>
          <p className="text-base text-muted-foreground max-w-md">
            Sélectionnez un modèle de trottinette pour découvrir les pièces compatibles
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 lg:px-8">
      {/* Header - Dynamic Call to Value */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-8 lg:mb-12"
      >
        {/* Titre Dynamique avec Badge */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-2 lg:gap-3 mb-3">
          <h2 className="font-display text-2xl lg:text-4xl text-carbon">
            {totalCount > 0 ? (
              <>
                <span className="text-mineral">{totalCount}</span> PIÈCES CERTIFIÉES
              </>
            ) : (
              "PIÈCES COMPATIBLES"
            )}
          </h2>
          
          {/* Badge 100% COMPATIBLE */}
          {activeModelName && totalCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-mineral/15 border border-mineral/30"
            >
              <ShieldCheck className="w-4 h-4 text-mineral" />
              <span className="text-xs font-semibold text-mineral tracking-wide uppercase">
                100% Compatible
              </span>
            </motion.div>
          )}
        </div>

        {/* Sous-titre Personnalisé */}
        {activeModelName && (
          <p className="text-sm lg:text-base text-muted-foreground max-w-md mx-auto">
            Pour votre <span className="text-mineral font-medium">{activeModelName}</span>
          </p>
        )}
      </motion.div>

      {/* Parts Grid - 4 columns on desktop */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {[...Array(8)].map((_, i) => (
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
          >
            {parts.map((part, index) => (
              <PartCard 
                key={part.id} 
                part={part} 
                index={index}
                className="bg-white/70 hover:bg-white/90"
              />
            ))}
          </motion.div>
        </AnimatePresence>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-base text-muted-foreground">
            Aucune pièce compatible trouvée pour ce modèle.
          </p>
        </motion.div>
      )}

      {/* View All Button */}
      {totalCount > 8 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-8 lg:mt-12 text-center"
        >
          <Button
            onClick={handleViewAll}
            className="rounded-full px-8 py-6 font-display text-base tracking-wide gap-2 bg-carbon text-greige hover:bg-carbon/90 hover:scale-105 transition-all"
          >
            VOIR LES {totalCount} PIÈCES
            <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default CompatiblePartsSection;
