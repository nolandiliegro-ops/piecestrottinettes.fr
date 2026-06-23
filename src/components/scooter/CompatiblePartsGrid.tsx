import { motion } from "framer-motion";
import { Package, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ScooterCompatiblePart } from "@/hooks/useScooterDetail";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PartCard from "@/components/parts/PartCard";

interface CompatiblePartsGridProps {
  parts: ScooterCompatiblePart[];
  isLoading: boolean;
  scooterName: string;
}

const CompatiblePartsGrid = ({ parts, isLoading, scooterName }: CompatiblePartsGridProps) => {
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
        {parts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-7">
            {parts.map((part, index) => (
              <PartCard key={part.id} part={{ ...part, description: null }} index={index} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-card rounded-2xl border border-border"
          >
            <Package className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-display text-2xl text-foreground mb-2">
              Aucune pièce référencée
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Nous n'avons pas encore de pièces compatibles pour ce modèle. Consultez notre catalogue complet.
            </p>
            <Link to="/catalogue">
              <Button className="gap-2">
                Explorer le catalogue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default CompatiblePartsGrid;
