import { motion } from "framer-motion";
import { Package, ArrowRight, Gauge } from "lucide-react";
import { Link } from "react-router-dom";
import { ScooterCompatiblePart } from "@/hooks/useScooterDetail";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import DifficultyIndicator from "@/components/parts/DifficultyIndicator";

interface CompatiblePartsGridProps {
  parts: ScooterCompatiblePart[];
  isLoading: boolean;
  scooterName: string;
}

// Internal card component to avoid type conflicts
const PartGridCard = ({ part, index }: { part: ScooterCompatiblePart; index: number }) => {
  const torqueValue = (part.technical_metadata?.torque_nm as number | undefined);
  const displayTorque = torqueValue ? `${torqueValue} Nm` : null;

  return (
    <Link to={`/piece/${part.slug}`} className="block">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="group relative rounded-xl p-4 transition-all duration-300 cursor-pointer bg-card/80 backdrop-blur-sm border border-border hover:scale-[1.01] hover:shadow-lg hover:border-primary/40"
      >
        {/* Image */}
        <div className="relative aspect-square rounded-lg overflow-hidden bg-muted/50 mb-3 flex items-center justify-center">
          {part.image_url ? (
            <img src={part.image_url} alt={part.name} className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110" />
          ) : (
            <div className="text-4xl opacity-30">🔧</div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h4 className="font-display text-base leading-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-300">
            {part.name}
          </h4>

          {part.price !== null && (
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-light text-primary tracking-wide">{part.price.toFixed(2)}</span>
              <span className="text-sm text-muted-foreground opacity-70">€</span>
            </div>
          )}

          {/* Specs Row */}
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <div className="flex items-center gap-2">
              {displayTorque ? (
                <>
                  <Gauge className="w-4 h-4 text-primary" />
                  <span className="text-xs font-mono text-foreground font-medium">{displayTorque}</span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground font-mono">-- Nm</span>
              )}
            </div>
            <DifficultyIndicator level={part.difficulty_level} />
          </div>

          {/* Stock */}
          {part.stock_quantity !== null && part.stock_quantity > 0 && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-primary font-medium">En stock ({part.stock_quantity})</span>
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
};

const CompatiblePartsGrid = ({ parts, isLoading, scooterName }: CompatiblePartsGridProps) => {
  if (isLoading) {
    return (
      <section className="py-12 lg:py-16 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
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

        {/* Parts Grid */}
        {parts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
            {parts.map((part, index) => (
              <PartGridCard key={part.id} part={part} index={index} />
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
