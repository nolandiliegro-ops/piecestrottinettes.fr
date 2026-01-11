import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Gauge } from "lucide-react";
import DifficultyIndicator from "./DifficultyIndicator";
import { CompatiblePart } from "@/hooks/useScooterData";
import { cn } from "@/lib/utils";

interface PartCardProps {
  part: CompatiblePart & { slug?: string; torque_nm?: number | null };
  index: number;
  className?: string;
}

// Extract key specs from technical_metadata JSONB
const extractSpecs = (metadata: Record<string, unknown> | null): { torque?: string; other?: string } => {
  if (!metadata) return {};
  
  const result: { torque?: string; other?: string } = {};
  
  // Extract torque specifically
  if (metadata.torque_nm !== undefined && metadata.torque_nm !== null) {
    result.torque = `${metadata.torque_nm} Nm`;
  }
  
  // Get first other spec
  const keyMapping: Record<string, string> = {
    weight_g: "g",
    diameter_mm: "mm",
    capacity_ah: "Ah",
    voltage: "V",
    wattage: "W",
  };

  for (const [key, suffix] of Object.entries(keyMapping)) {
    if (metadata[key] !== undefined && metadata[key] !== null && !result.other) {
      const value = metadata[key];
      if (typeof value === "number" || typeof value === "string") {
        result.other = `${value}${suffix}`;
      }
    }
  }

  return result;
};

const PartCard = ({ part, index, className }: PartCardProps) => {
  const specs = extractSpecs(part.technical_metadata);
  
  // Use torque_nm from part directly if available, otherwise from metadata
  const torqueValue = part.torque_nm ?? (part.technical_metadata?.torque_nm as number | undefined);
  const displayTorque = torqueValue ? `${torqueValue} Nm` : specs.torque;

  const cardContent = (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{
        duration: 0.4,
        delay: index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={cn(
        "group relative rounded-xl p-4 transition-all duration-300 cursor-pointer",
        "bg-white/70 backdrop-blur-sm",
        "border border-mineral/10",
        "hover:scale-[1.01] hover:shadow-lg",
        "hover:border-mineral/40",
        className
      )}
    >
      {/* Subtle Gradient Overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-mineral/3 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Image Container - Compact */}
      <div className="relative aspect-square rounded-lg overflow-hidden bg-white/30 mb-3 flex items-center justify-center max-h-[180px]">
        {part.image_url ? (
          <img 
            src={part.image_url} 
            alt={part.name}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="text-4xl opacity-30">🔧</div>
        )}
        
        {/* Subtle Hover Effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-mineral/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <div className="relative space-y-2">
        {/* Name */}
        <h4 className="font-display text-base leading-tight text-carbon line-clamp-2 group-hover:text-mineral transition-colors duration-300">
          {part.name}
        </h4>

        {/* Price - Luxury Typography */}
        {part.price !== null && (
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-light text-mineral tracking-wide">
              {part.price.toFixed(2)}
            </span>
            <span className="text-sm text-muted-foreground opacity-70">€</span>
          </div>
        )}

        {/* Technical Specs Row - Enhanced with Torque Icon */}
        <div className="flex items-center justify-between pt-3 border-t border-white/20">
          {/* Torque Display with Icon */}
          <div className="flex items-center gap-2">
            {displayTorque ? (
              <>
                <Gauge className="w-4 h-4 text-mineral" />
                <span className="text-xs font-mono text-carbon font-medium">
                  {displayTorque}
                </span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground font-mono">
                -- Nm
              </span>
            )}
          </div>

          {/* Difficulty Indicator */}
          <DifficultyIndicator level={part.difficulty_level} />
        </div>

        {/* Stock Indicator - Luxury Badge */}
        {part.stock_quantity !== null && part.stock_quantity > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 + 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mineral/10 border border-mineral/20"
          >
            <div className="w-2 h-2 rounded-full bg-mineral animate-pulse" />
            <span className="text-xs text-mineral font-medium">
              En stock ({part.stock_quantity})
            </span>
          </motion.div>
        )}

        {/* Out of Stock Badge */}
        {part.stock_quantity !== null && part.stock_quantity === 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border border-muted">
            <div className="w-2 h-2 rounded-full bg-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">
              Rupture de stock
            </span>
          </div>
        )}
      </div>

      {/* Subtle Corner Accent */}
      <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden rounded-tr-2xl pointer-events-none">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-mineral/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </motion.div>
  );

  // Wrap with Link if slug is available
  if (part.slug) {
    return (
      <Link to={`/piece/${part.slug}`} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};

export default PartCard;
