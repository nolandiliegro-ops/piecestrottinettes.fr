import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
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
  const { data: parts = [], isLoading } = useCompatibleParts(activeModelSlug, 4);
  const { data: totalCount = 0 } = useCompatiblePartsCount(activeModelSlug);

  const handleViewAll = () => {
    // Future: Navigate to /catalogue with filter
    console.log("Navigate to catalogue for:", activeModelSlug);
  };

  if (!activeModelSlug) return null;

  return (
    <section 
      id="bento-discovery"
      className="py-16 lg:py-24 bg-greige"
    >
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="font-display text-4xl lg:text-5xl text-foreground mb-2">
            PIÈCES COMPATIBLES
          </h2>
          {activeModelName && (
            <p className="text-muted-foreground">
              Sélection pour votre <span className="text-primary font-medium">{activeModelName}</span>
            </p>
          )}
        </motion.div>

        {/* Bento Grid */}
        <div className="max-w-5xl mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card rounded-xl p-4">
                  <Skeleton className="aspect-square rounded-lg mb-3" />
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : parts.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeModelSlug}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
              >
                {parts.map((part, index) => (
                  <PartCard key={part.id} part={part} index={index} />
                ))}
              </motion.div>
            </AnimatePresence>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-muted-foreground">
                Aucune pièce compatible trouvée pour ce modèle.
              </p>
            </motion.div>
          )}
        </div>

        {/* CTA */}
        {totalCount > 4 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center mt-10"
          >
            <Button
              onClick={handleViewAll}
              size="lg"
              className="rounded-full px-8 font-display text-lg tracking-wide gap-2 bg-carbon text-greige hover:bg-carbon/90"
            >
              VOIR LES {totalCount} PIÈCES
              <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default BentoDiscoverySection;
