import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Gauge, ShoppingCart, Trophy, Check } from "lucide-react";
import { forwardRef, MouseEvent } from "react";
import DifficultyIndicator from "./DifficultyIndicator";
import { CompatiblePart } from "@/hooks/useScooterData";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/formatPrice";
import { toast } from "sonner";
import { useIsCompatibleWithSelected } from "@/hooks/useIsCompatibleWithSelected";
import { useSelectedScooter } from "@/contexts/ScooterContext";

interface PartCardProps {
  part: CompatiblePart & { slug?: string; torque_nm?: number | null; is_featured?: boolean };
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

const PartCard = forwardRef<HTMLDivElement, PartCardProps>(
  function PartCardInner({ part, index, className }, ref) {
  const { addItem, setIsOpen } = useCart();
  const specs = extractSpecs(part.technical_metadata);
  const isOutOfStock = part.stock_quantity !== null && part.stock_quantity === 0;
  
  // Compatibility check with selected scooter
  const { isCompatible, selectedScooter } = useIsCompatibleWithSelected(part.id);
  
  // Get dynamic brand colors
  const { selectedBrandColors } = useSelectedScooter();
  
  // Use torque_nm from part directly if available, otherwise from metadata
  const torqueValue = part.torque_nm ?? (part.technical_metadata?.torque_nm as number | undefined);
  const displayTorque = torqueValue ? `${torqueValue} Nm` : specs.torque;

  // Quick-add to cart handler
  const handleQuickAdd = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isOutOfStock || part.price === null) return;

    addItem({
      id: part.id,
      name: part.name,
      price: part.price,
      image_url: part.image_url,
      stock_quantity: part.stock_quantity || 0,
    });

    toast.success(
      <div className="flex items-center gap-3">
        {part.image_url ? (
          <img 
            src={part.image_url} 
            alt={part.name}
            className="w-10 h-10 rounded-lg object-contain bg-greige p-1"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-greige flex items-center justify-center">
            🔧
          </div>
        )}
        <div>
          <p className="font-medium text-carbon text-sm">{part.name}</p>
          <p className="text-xs text-muted-foreground">Ajouté au panier</p>
        </div>
      </div>,
      {
        action: {
          label: "Voir",
          onClick: () => setIsOpen(true),
        },
      }
    );
  };

  const cardContent = (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{
        duration: 0.4,
        delay: index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={cn(
        "group relative rounded-xl p-5 transition-all duration-300 cursor-pointer",
        "bg-white/80 backdrop-blur-sm",
        "border border-carbon/10",
        "hover:shadow-xl",
        "hover:border-mineral/40",
        className
      )}
    >
      {/* Subtle Gradient Overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-mineral/3 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* COMPATIBLE Badge - Dynamic Neon LED Effect */}
      {selectedScooter && isCompatible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -10 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0,
          }}
          transition={{ 
            duration: 0.4, 
            delay: index * 0.05,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
          className="absolute top-3 right-3 z-20"
          style={{
            filter: `drop-shadow(0 0 10px ${selectedBrandColors.glowColor})`,
          }}
        >
          <motion.div 
            animate={{ 
              boxShadow: [
                `0 0 8px ${selectedBrandColors.glowColor}`,
                `0 0 16px ${selectedBrandColors.glowColor}`,
                `0 0 8px ${selectedBrandColors.glowColor}`,
              ]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full",
              "text-[10px] font-semibold tracking-wide uppercase",
              "backdrop-blur-sm border-[0.5px]",
              selectedBrandColors.bgClass,
              selectedBrandColors.textClass,
              selectedBrandColors.borderClass
            )}
          >
            {/* Pulsing dot */}
            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [1, 0.7, 1]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: selectedBrandColors.accent }}
            />
            <span>Compatible</span>
          </motion.div>
        </motion.div>
      )}

      {/* Image Container - Luxury Studio Style */}
      <div className="relative aspect-square rounded-lg overflow-hidden bg-[#F9F8F6] mb-3 flex items-center justify-center">
        {/* SÉLECTION EXPERT Badge - Carbon Black Luxury */}
        {part.is_featured && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.08 + 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute top-3 left-3 z-10"
          >
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-carbon text-white text-[10px] font-medium tracking-widest uppercase shadow-lg backdrop-blur-sm border border-white/10">
              <Trophy className="w-3 h-3" />
              <span>SÉLECTION EXPERT</span>
            </div>
          </motion.div>
        )}

        {part.image_url ? (
          <img 
            src={part.image_url} 
            alt={part.name}
            className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="text-4xl opacity-30">🔧</div>
        )}
        
        {/* Subtle Hover Effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-mineral/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Quick-Add Button - Only show if in stock */}
        {!isOutOfStock && part.price !== null && (
          <button
            onClick={handleQuickAdd}
            className="absolute bottom-3 right-3 w-10 h-10 rounded-xl bg-carbon/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-carbon hover:scale-110 active:scale-95 shadow-lg"
            title="Ajouter au panier"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        )}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <span className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-sm font-medium">
              Rupture de stock
            </span>
          </div>
        )}
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
            <span className={cn(
              "text-2xl font-light tracking-wide",
              isOutOfStock ? "text-muted-foreground" : "text-mineral"
            )}>
              {formatPrice(part.price)}
            </span>
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
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mineral/15 border border-mineral/20"
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
  }
);

export default PartCard;
