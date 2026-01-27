import { motion } from "framer-motion";
import { Sparkles, ShieldCheck } from "lucide-react";
import GamingShowcase from "./showcase/GamingShowcase";
import { useCompatibleParts, useCompatiblePartsCount } from "@/hooks/useScooterData";

interface CompatiblePartsSectionProps {
  activeModelSlug: string | null;
  activeModelName?: string;
}

const CompatiblePartsSection = ({ 
  activeModelSlug, 
  activeModelName 
}: CompatiblePartsSectionProps) => {
  const { data: parts = [], isLoading } = useCompatibleParts(activeModelSlug, 12);
  const { data: totalCount = 0 } = useCompatiblePartsCount(activeModelSlug);

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
      </motion.div>

      {/* Gaming Showcase */}
      <GamingShowcase 
        parts={parts}
        activeModelName={activeModelName}
        isLoading={isLoading}
      />
    </div>
  );
};

export default CompatiblePartsSection;
