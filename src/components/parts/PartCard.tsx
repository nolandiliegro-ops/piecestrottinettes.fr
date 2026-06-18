import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShoppingCart, Check, Star, Shield, Sparkles } from "lucide-react";
import { forwardRef, MouseEvent, useId } from "react";
import PartFavoriteButton from "./PartFavoriteButton";
import { CompatiblePart } from "@/hooks/useScooterData";
import { getPrimaryImage } from "@/lib/entityImage";
import { optimizedImage } from "@/lib/imageTransform";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { pickBadge, STAMP_META, hexToRgba } from "@/lib/partStamps";
import { resolveCategoryColor } from "@/lib/categoryColors";
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

// Assombrit une couleur hex (#RRGGBB) pour rester lisible sur fond blanc (eyebrow catégorie).
function darkenForLight(hex: string): string {
  const h = hex.replace("#", ""); if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  const f = 0.55;
  const d = (c: number) => Math.round(c * f).toString(16).padStart(2, "0");
  return `#${d(r)}${d(g)}${d(b)}`;
}

function DifficultyKey({ level }: { level: number | null }) {
  const lvl = Math.min(Math.max(level ?? 1, 1), 5);
  const color = ["#6BAA7A", "#4A7C59", "#EAB308", "#F97316", "#DC2626"][lvl - 1];
  const keyPath ="M19.4 3.6a5 5 0 0 0-6.7 6.5L3.5 19.3a1.6 1.6 0 0 0 0 2.3l-.1-.1a1.6 1.6 0 0 0 2.3 0l9.2-9.2a5 5 0 0 0 6.5-6.7l-3 3-2.6-.5-.5-2.6z";
  const uid = useId();
  const clipId = `diffkey-${lvl}-${uid}`;
  const labels = ["très facile", "facile", "moyenne", "difficile", "expert"];
  const aria = `Difficulté de pose : ${labels[lvl - 1]} (${lvl}/5)`;
  return (
    <svg width={30} height={30} viewBox="0 0 24 24" role="img" aria-label={aria}>
      <title>{aria}</title>
      <defs><clipPath id={clipId}><path d={keyPath} /></clipPath></defs>
      <g clipPath={`url(#${clipId})`}>
        <rect x="0" y="0" width="24" height="24" fill={color} />
      </g>
      <path d={keyPath} fill="none" stroke="rgba(0,0,0,0.38)" strokeWidth={1.2} />
    </svg>
  );
}

const PartCard = forwardRef<HTMLDivElement, PartCardProps>(
  function PartCardInner({ part, index, className }, ref) {
  const { addItem, setIsOpen } = useCart();
  const specs = extractSpecs(part.technical_metadata);
  const isOutOfStock = part.stock_quantity !== null && part.stock_quantity === 0;
  // Stamp ATELIER (BEST / SÉCU / NOUVEAU) — logique partagée. created_at absent du
  // type catalogue ⇒ NOUVEAU jamais déclenché ici (voulu).
  const badge = pickBadge(part);
  // Prix splitté (entier gros + centimes + virgule FR), sans toucher au helper partagé formatPrice.
  const priceParts = part.price !== null
    ? (() => {
        const [int, dec] = part.price.toFixed(2).split(".");
        return { int, dec };
      })()
    : null;
  const primaryImage = getPrimaryImage(part.images, part.image_url, "");
  // Image affichée (grille ~250px) servie en WebP redimensionné, ratio préservé, sans rognage.
  const displayImage = optimizedImage(primaryImage, 400);
  
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
      image_url: primaryImage || part.image_url,
      stock_quantity: part.stock_quantity || 0,
    });

    toast.success(
      <div className="flex items-center gap-3">
        {primaryImage ? (
          <img 
            src={displayImage}
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
      whileHover={{ 
        scale: 1.02, 
        y: -8,
        transition: { duration: 0.4, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.98 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={cn(
        "group relative rounded-xl p-5 cursor-pointer",
        "bg-white",
        "border border-[#ECE7DD]",
        "shadow-[0_6px_18px_-12px_rgba(26,26,26,0.25)]",
        "hover:shadow-[0_16px_34px_-16px_rgba(26,26,26,0.30)]",
        "hover:border-[#dcd3c2]",
        "transition-all duration-300 ease-out",
        className
      )}
    >
      {/* Subtle Gradient Overlay */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-mineral/3 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

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
            whileHover={{ scale: 1.05 }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-semibold tracking-wide uppercase text-white"
            style={{
              background: "rgba(147, 181, 161, 0.8)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
            }}
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
        {/* ATELIER stamp (BEST / SÉCU / NOUVEAU) — thème clair, via @/lib/partStamps */}
        {badge && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.08 + 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute top-3 left-3 z-10"
          >
            <span
              className="inline-flex items-center gap-1 uppercase text-[9.5px] lg:text-[10px]"
              style={{
                padding: "4px 7px",
                borderRadius: 6,
                fontFamily: "'Inter', sans-serif",
                fontWeight: 800,
                letterSpacing: "0.05em",
                lineHeight: 1,
                color: STAMP_META[badge].lightText,
                backgroundColor: hexToRgba(STAMP_META[badge].full, 0.12),
                border: `1px solid ${hexToRgba(STAMP_META[badge].full, 0.55)}`,
              }}
            >
              {badge === "BEST" && <Star size={11} strokeWidth={2.4} fill="currentColor" aria-hidden />}
              {badge === "SÉCU" && <Shield size={11} strokeWidth={2.4} aria-hidden />}
              {badge === "NOUVEAU" && <Sparkles size={11} strokeWidth={2.4} aria-hidden />}
              {STAMP_META[badge].label}
            </span>
          </motion.div>
        )}

        {primaryImage ? (
          <img 
            src={displayImage}
            alt={part.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="text-4xl opacity-30">🔧</div>
        )}
        
        {/* Subtle Hover Effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-mineral/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Favorite Button - Top Right (when no compatibility badge) */}
        {!selectedScooter && (
          <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <PartFavoriteButton partId={part.id} partName={part.name} size="sm" />
          </div>
        )}

        {/* Favorite Button - Bottom Left (alternative position) */}
        {selectedScooter && (
          <div className="absolute bottom-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <PartFavoriteButton partId={part.id} partName={part.name} size="sm" />
          </div>
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
        {part.category?.name && (
          <span
            className="text-[10px] font-extrabold uppercase tracking-[0.08em] leading-none"
            style={{ color: darkenForLight(resolveCategoryColor(null, part.category.slug)) }}
          >
            {part.category.name}
          </span>
        )}
        <h4
          className="text-[13px] lg:text-[14px] leading-tight line-clamp-2"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            color: "#5B6470",
            marginBottom: 2,
            minHeight: "2.2em",
          }}
        >
          {part.name}
        </h4>

        {/* Price - Split Typography (entier + centimes + virgule FR) */}
        {priceParts && (
          <motion.div
            whileHover={{ scale: 1.04 }}
            transition={{ duration: 0.2 }}
            className="inline-flex items-baseline"
            style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#1A1A1A", lineHeight: 0.9 }}
          >
            <span style={{ fontSize: 36, letterSpacing: "0.01em" }}>{priceParts.int}</span>
            <span style={{ fontSize: 20 }}>,{priceParts.dec}</span>
            <span style={{ fontSize: 18, marginLeft: 3 }}>€</span>
          </motion.div>
        )}

        {/* Technical Specs Row - Difficulty only */}
        <div className="flex items-center pt-3 border-t border-[#ECE7DD]">
          {/* Difficulty Indicator */}
          <DifficultyKey level={part.difficulty_level} />
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
              {part.stock_quantity <= 3 ? `Plus que ${part.stock_quantity}` : "En stock"}
            </span>
          </motion.div>
        )}

        {/* Quick-Add Button - ATELIER orange, toujours visible (canon RelatedProducts) */}
        <button
          onClick={handleQuickAdd}
          disabled={isOutOfStock || part.price === null}
          className="mt-3 min-h-[44px] w-full flex items-center justify-center gap-2 rounded-xl bg-[#FF6600] hover:bg-[#E55C00] text-white font-bold text-sm transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{isOutOfStock || part.price === null ? "Indisponible" : "Ajouter"}</span>
        </button>
      </div>

      {/* Subtle Corner Accent */}
      <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden rounded-tr-xl pointer-events-none">
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
