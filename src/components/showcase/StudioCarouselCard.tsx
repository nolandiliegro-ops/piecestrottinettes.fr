import { motion } from "framer-motion";
import { ShoppingCart, Package } from "lucide-react";
import { formatPrice } from "@/lib/formatPrice";
import { useCart } from "@/hooks/useCart";
import DifficultyIndicator from "@/components/parts/DifficultyIndicator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Part {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  image_url: string | null;
  stock_quantity: number | null;
  difficulty_level: number | null;
  description?: string | null;
  category?: {
    id: string;
    name: string;
    icon: string | null;
    slug: string;
  } | null;
}

interface StudioCarouselCardProps {
  part: Part;
  isCenter: boolean;
  distanceFromCenter: number;
  index: number;
  onCardClick: (index: number, part: Part) => void;
}

const StudioCarouselCard = ({
  part,
  isCenter,
  distanceFromCenter,
  index,
  onCardClick,
}: StudioCarouselCardProps) => {
  const { addItem, setIsOpen } = useCart();
  const isInStock = (part.stock_quantity ?? 0) > 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (part.price === null || !isInStock) return;

    addItem({
      id: part.id,
      name: part.name,
      price: part.price,
      image_url: part.image_url,
      stock_quantity: part.stock_quantity || 0,
    });

    toast.success("Pièce ajoutée au panier", {
      action: { label: "Voir", onClick: () => setIsOpen(true) },
    });
  };

  // Stock badge color
  const stockColor =
    (part.stock_quantity ?? 0) > 5
      ? "border-green-400/60 text-green-700"
      : (part.stock_quantity ?? 0) > 0
      ? "border-orange-400/60 text-orange-700"
      : "border-red-400/60 text-red-600";

  // Dynamic scale & opacity based on distance
  const scale = isCenter ? 1.08 : 0.95;
  const opacity = isCenter ? 1 : 0.85;

  return (
    <motion.div
      className="cursor-pointer select-none"
      animate={{ scale, opacity }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={isCenter ? { y: -6, scale: 1.1 } : { scale: 0.98, opacity: 0.95 }}
      onClick={() => onCardClick(index, part)}
    >
      <div
        className={cn(
          "relative rounded-2xl overflow-hidden flex flex-col h-full",
          "transition-shadow duration-300"
        )}
        style={{
          background: "rgba(255, 255, 255, 0.6)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.4)",
          boxShadow: isCenter
            ? "0 16px 48px rgba(26, 26, 26, 0.12), 0 0 0 1px rgba(147, 181, 161, 0.15)"
            : "0 4px 16px rgba(26, 26, 26, 0.06)",
        }}
      >
        {/* Stock Badge */}
        <div
          className={cn(
            "absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider",
            stockColor
          )}
          style={{
            background: "rgba(255, 255, 255, 0.75)",
            backdropFilter: "blur(8px)",
            border: "1px solid",
          }}
        >
          {isInStock ? `Stock: ${part.stock_quantity}` : "Rupture"}
        </div>

        {/* Image */}
        <div className="relative flex items-center justify-center p-5 pt-10 pb-3" style={{ minHeight: "180px" }}>
          {part.image_url ? (
            <img
              src={part.image_url}
              alt={part.name}
              className="w-full max-h-[160px] object-contain"
              loading="lazy"
              style={{ filter: "drop-shadow(0 8px 20px rgba(26,26,26,0.1))" }}
            />
          ) : (
            <Package className="w-16 h-16 text-carbon/15" />
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-2 px-4 pb-4 flex-1">
          {/* Category */}
          {part.category?.name && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              {part.category.name}
            </span>
          )}

          {/* Name */}
          <h3 className="text-sm font-medium text-carbon leading-snug line-clamp-2 min-h-[2.5rem]">
            {part.name}
          </h3>

          {/* Difficulty */}
          <DifficultyIndicator level={part.difficulty_level} variant="dots" />

          {/* Price + Cart */}
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-carbon/5">
            <span className="text-lg font-bold text-mineral">
              {part.price !== null ? formatPrice(part.price) : "—"}
            </span>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleAddToCart}
              disabled={!isInStock || part.price === null}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
                isInStock
                  ? "bg-mineral text-white hover:bg-mineral-dark"
                  : "bg-carbon/10 text-carbon/30 cursor-not-allowed"
              )}
              aria-label="Ajouter au panier"
            >
              <ShoppingCart className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StudioCarouselCard;
