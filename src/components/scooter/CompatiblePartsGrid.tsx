import { motion } from "framer-motion";
import { Package, ArrowRight, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { ScooterCompatiblePart } from "@/hooks/useScooterDetail";
import { unverifiedLabel } from "@/lib/compatibilityStatus";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PartCard from "@/components/parts/PartCard";

interface CompatiblePartsGridProps {
  parts: ScooterCompatiblePart[];
  isLoading: boolean;
  scooterName: string;
}

const CompatiblePartsGrid = ({ parts, isLoading, scooterName }: CompatiblePartsGridProps) => {
  // LOT 3 — ventilation via la règle unique (statut déjà posé par le hook) :
  // ✅ verified en grille ; 🟡 unverified en SECTION SÉPARÉE sous la grille,
  // libellé sous chaque card (jamais de badge) ; 🔵 zéro affichable → CTA contact.
  const verified = parts.filter((p) => p.status === "verified");
  const unverified = parts.filter((p) => p.status === "unverified");

  if (isLoading) {
    return (
      <section className="py-12 lg:py-16 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-7">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 lg:py-16 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-6 h-6 text-primary" />
              <h2 className="font-display text-3xl lg:text-4xl text-foreground">
                PIÈCES COMPATIBLES
              </h2>
            </div>
            <p className="text-muted-foreground">
              {parts.length} pièce{parts.length > 1 ? "s" : ""} détachée{parts.length > 1 ? "s" : ""} compatible{parts.length > 1 ? "s" : ""} avec votre {scooterName}
            </p>
          </div>

          <Link to="/catalogue">
            <Button variant="outline" className="gap-2 group">
              Voir tout le catalogue
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>

        {/* Parts Grid — PartCard catalogue (design unique site) */}
        {verified.length > 0 || unverified.length > 0 ? (
          <>
            {verified.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-7">
                {verified.map((part, index) => (
                  <PartCard key={part.id} part={{ ...part, description: null }} index={index} />
                ))}
              </div>
            )}

            {unverified.length > 0 && (
              <div className="mt-10">
                <div className="flex items-center gap-2 mb-4">
                  <HelpCircle className="w-5 h-5 text-amber-600" />
                  <h3 className="font-display text-xl text-foreground">
                    À vérifier pour ta {scooterName}
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-7">
                  {unverified.map((part, index) => (
                    <div key={part.id}>
                      <PartCard part={{ ...part, description: null }} index={index} />
                      <p className="text-sm text-muted-foreground mt-2 px-1">
                        {unverifiedLabel(part.reason)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-card rounded-2xl border border-border"
          >
            <Package className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-display text-2xl text-foreground mb-2">
              On te la trouve
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Aucune pièce vérifiée pour ta {scooterName} pour l'instant — dis-nous
              ce que tu cherches, on la trouve pour toi.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center min-h-[44px] bg-green-700 hover:bg-green-800 text-white rounded-lg px-6 py-3 font-semibold text-sm transition-colors gap-2"
              >
                Demander une pièce
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/catalogue">
                <Button variant="outline" className="gap-2 min-h-[44px]">
                  Explorer le catalogue
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default CompatiblePartsGrid;
