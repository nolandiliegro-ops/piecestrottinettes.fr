import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import DifficultyIndicator from "./DifficultyIndicator";
import { CompatiblePart } from "@/hooks/useScooterData";
import { cn } from "@/lib/utils";

interface PartCardProps {
  part: CompatiblePart & { slug?: string };
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
        "group relative rounded-2xl p-5 transition-all duration-300 cursor-pointer",
        "bg-white/40 backdrop-blur-md",
        "border border-white/20",
        "hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(147,181,161,0.3)]",
        className
      )}
    >
      {/* Image */}
      <div className="aspect-square rounded-xl overflow-hidden bg-white/30 mb-4 flex items-center justify-center">
        {part.image_url ? (
          <img 
            src={part.image_url} 
            alt={part.name}
            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="text-4xl opacity-30">🔧</div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-3">
        {/* Name */}
        <h4 className="font-display text-lg leading-tight text-carbon line-clamp-2">
          {part.name}
        </h4>

        {/* Price - Mineral Green elegant */}
        {part.price !== null && (
          <span className="block text-xl font-light text-mineral tracking-wide">
            {part.price.toFixed(2)} <span className="text-sm opacity-70">€</span>
          </span>
        )}

        {/* Technical Metadata Row */}
        <div className="flex items-center justify-between pt-3 border-t border-white/20">
          <span className="text-xs text-muted-foreground font-mono">
            {specs.torque || "-- Nm"}
          </span>
          <DifficultyIndicator level={part.difficulty_level} />
        </div>

        {/* Stock indicator */}
        {part.stock_quantity !== null && part.stock_quantity > 0 && (
          <p className="text-xs text-mineral font-medium">
            En stock ({part.stock_quantity})
          </p>
        )}
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
