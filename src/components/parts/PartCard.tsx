import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import DifficultyIndicator from "./DifficultyIndicator";
import { CompatiblePart } from "@/hooks/useScooterData";
import { cn } from "@/lib/utils";

interface PartCardProps {
  part: CompatiblePart;
  index: number;
  className?: string;
}

// Extract key specs from technical_metadata JSONB
const extractSpecs = (metadata: Record<string, unknown> | null): string[] => {
  if (!metadata) return [];
  
  const specs: string[] = [];
  
  // Common spec keys to display
  const keyMapping: Record<string, string> = {
    torque_nm: "Nm",
    weight_g: "g",
    diameter_mm: "mm",
    capacity_ah: "Ah",
    voltage: "V",
    wattage: "W",
    size: "",
    dimensions: "",
  };

  for (const [key, suffix] of Object.entries(keyMapping)) {
    if (metadata[key] !== undefined && metadata[key] !== null) {
      const value = metadata[key];
      if (typeof value === "number" || typeof value === "string") {
        specs.push(`${value}${suffix}`);
      }
    }
  }

  return specs.slice(0, 3); // Max 3 specs
};

const PartCard = ({ part, index, className }: PartCardProps) => {
  const specs = extractSpecs(part.technical_metadata);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={cn(
        "group relative bg-card rounded-xl p-4 transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-lg hover:shadow-mineral/20",
        "border border-border/50 hover:border-mineral/50",
        className
      )}
    >
      {/* Category Badge */}
      {part.category && (
        <Badge 
          variant="secondary" 
          className="absolute top-3 left-3 z-10 text-xs gap-1 bg-background/80 backdrop-blur-sm"
        >
          {part.category.icon && <span>{part.category.icon}</span>}
          {part.category.name}
        </Badge>
      )}

      {/* Image Placeholder */}
      <div className="aspect-square rounded-lg bg-muted/50 mb-3 flex items-center justify-center overflow-hidden">
        {part.image_url ? (
          <img 
            src={part.image_url} 
            alt={part.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="text-4xl opacity-30">🔧</div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2">
        <h4 className="font-display text-lg leading-tight text-foreground line-clamp-2">
          {part.name}
        </h4>

        {/* Price & Difficulty Row */}
        <div className="flex items-center justify-between">
          {part.price !== null && (
            <span className="text-lg font-semibold text-foreground">
              {part.price.toFixed(2)} €
            </span>
          )}
          <DifficultyIndicator level={part.difficulty_level} />
        </div>

        {/* Technical Specs */}
        {specs.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {specs.map((spec, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
              >
                {spec}
              </span>
            ))}
          </div>
        )}

        {/* Stock indicator */}
        {part.stock_quantity !== null && part.stock_quantity > 0 && (
          <p className="text-xs text-mineral font-medium">
            En stock ({part.stock_quantity})
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default PartCard;
