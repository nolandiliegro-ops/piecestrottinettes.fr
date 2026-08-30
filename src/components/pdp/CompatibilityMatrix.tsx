import { forwardRef } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Zap, HelpCircle, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { CompatibleScooter } from "@/hooks/usePartDetail";
import { unverifiedLabel } from "@/lib/compatibilityStatus";
import { Skeleton } from "@/components/ui/skeleton";

interface CompatibilityMatrixProps {
  scooters: CompatibleScooter[];
  isLoading: boolean;
}

const CompatibilityMatrix = forwardRef<HTMLDivElement, CompatibilityMatrixProps>(
  function CompatibilityMatrixInner({ scooters, isLoading }, ref) {
    // LOT 3 — ventilation via la règle unique (déjà classé par le hook) :
    // ✅ verified en chips ; 🟡 unverified en SECTION SÉPARÉE avec la raison
    // (jamais un badge, jamais un %) ; 🔵 zéro affichable → « on te la trouve ».
    const verified = scooters.filter((s) => s.status === "verified");
    const unverified = scooters.filter((s) => s.status === "unverified");

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="h-full bg-white/40 backdrop-blur-md border border-white/20 rounded-2xl p-5 md:p-6 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/20">
          <Zap className="w-5 h-5 text-mineral" />
          <h2 className="font-display text-lg uppercase tracking-wide text-carbon">
            Compatibilité
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
          ) : verified.length > 0 || unverified.length > 0 ? (
            <div className="space-y-5">
              {verified.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {verified.map((scooter, index) => (
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
              )}

              {unverified.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-700 mb-2">
                    À vérifier
                  </h3>
                  <div className="space-y-2">
                    {unverified.map((scooter) => (
                      <div
                        key={scooter.id}
                        className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50/70 border border-amber-200/60 text-carbon"
                      >
                        <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-sm font-medium block">
                            {scooter.brand.name} {scooter.name}
                          </span>
                          <span className="text-sm text-carbon/60">
                            {unverifiedLabel(scooter.reason)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-6">
              <Search className="w-10 h-10 text-green-700/50 mb-3" />
              <p className="text-sm font-semibold text-carbon">On te la trouve</p>
              <p className="text-sm text-carbon/60 mt-1 max-w-[240px]">
                Aucune compatibilité vérifiée pour l'instant — dis-nous ton modèle,
                on vérifie pour toi.
              </p>
              <Link
                to="/contact"
                className="mt-4 inline-flex items-center justify-center min-h-[44px] bg-green-700 hover:bg-green-800 text-white rounded-lg px-6 py-3 font-semibold text-sm transition-colors"
              >
                Demander une vérification
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    );
  }
);

export default CompatibilityMatrix;
