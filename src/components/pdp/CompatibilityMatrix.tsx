import { motion } from "framer-motion";
import { CheckCircle2, Zap, AlertTriangle } from "lucide-react";
import { CompatibleScooter } from "@/hooks/usePartDetail";
import { Skeleton } from "@/components/ui/skeleton";

interface CompatibilityMatrixProps {
  scooters: CompatibleScooter[];
  isLoading: boolean;
}

const CompatibilityMatrix = ({ scooters, isLoading }: CompatibilityMatrixProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="h-full bg-white/40 backdrop-blur-md border border-white/20 rounded-2xl p-5 md:p-6 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/20">
        <Zap className="w-5 h-5 text-mineral" />
        <h2 className="font-display text-lg uppercase tracking-wide text-carbon">
          Compatibilité Certifiée
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : scooters.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {scooters.map((scooter, index) => (
              <motion.div
                key={scooter.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-mineral/10 border border-mineral/20 text-carbon"
              >
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm font-medium">
                  {scooter.brand.name} {scooter.name}
                </span>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-6">
            <AlertTriangle className="w-10 h-10 text-amber-500/50 mb-3" />
            <p className="text-sm text-carbon/60 font-medium">
              Aucune compatibilité listée
            </p>
            <p className="text-xs text-carbon/40 mt-1">
              Vérifiez les spécifications de votre modèle
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CompatibilityMatrix;
