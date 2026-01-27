import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShieldCheck, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/formatPrice";

interface Part {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  image_url: string | null;
  stock_quantity: number | null;
}

interface PremiumProductCardProps {
  part: Part;
  index: number;
  distanceFromCenter?: number;
  isCenter?: boolean;
}

const PremiumProductCard = ({
  part,
  index,
  distanceFromCenter = 0,
  isCenter = false,
}: PremiumProductCardProps) => {
  // Scale and opacity based on distance from center
  const getScale = () => {
    if (distanceFromCenter === 0) return 1.05;
    if (distanceFromCenter === 1) return 0.95;
    return 0.9;
  };

  const getOpacity = () => {
    if (distanceFromCenter === 0) return 1;
    if (distanceFromCenter === 1) return 0.85;
    return 0.7;
  };

  const isInStock = (part.stock_quantity ?? 0) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ 
        opacity: getOpacity(), 
        scale: getScale(),
      }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.05,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className={cn(
        "h-full",
        isCenter && "premium-card-focus",
        !isCenter && "premium-card-side"
      )}
    >
      <Link to={`/pieces/${part.slug}`}>
        <motion.div
          className="relative h-full cursor-pointer overflow-hidden"
          style={{
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(147, 181, 161, 0.2)",
            borderRadius: "20px",
            padding: "24px",
            boxShadow: isCenter 
              ? "0 16px 48px rgba(147, 181, 161, 0.25)"
              : "0 8px 32px rgba(26, 26, 26, 0.08)",
          }}
          whileHover={{ 
            y: -8,
            boxShadow: "0 16px 48px rgba(147, 181, 161, 0.25)",
          }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {/* Compatible Badge */}
          <motion.div 
            className="absolute top-4 left-4 z-10"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.05 }}
          >
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{
                background: "rgba(147, 181, 161, 0.15)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(147, 181, 161, 0.3)",
              }}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-mineral" />
              <span className="text-[10px] font-semibold text-mineral uppercase tracking-wide">
                Compatible
              </span>
            </div>
          </motion.div>

          {/* Stock Badge */}
          <div className="absolute top-4 right-4 z-10">
            <div 
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium",
                isInStock 
                  ? "bg-green-100 text-green-700" 
                  : "bg-red-100 text-red-600"
              )}
            >
              <span 
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isInStock ? "bg-green-500 animate-pulse" : "bg-red-500"
                )}
              />
              {isInStock ? "En stock" : "Rupture"}
            </div>
          </div>

          {/* Product Image */}
          <motion.div 
            className="relative w-full aspect-square max-w-[200px] mx-auto mb-4"
            whileHover={{ 
              scale: 1.05, 
              rotate: 2,
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {part.image_url ? (
              <img 
                src={part.image_url} 
                alt={part.name}
                className="w-full h-full object-contain"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted/20 rounded-xl">
                <Package className="w-16 h-16 text-muted-foreground/40" />
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <div className="space-y-2">
            {/* Product Name */}
            <h3 
              className="font-semibold text-sm text-carbon line-clamp-2 leading-tight min-h-[2.5rem]"
            >
              {part.name}
            </h3>

            {/* Price */}
            <p 
              className="text-xl font-bold"
              style={{ color: "#93B5A1" }}
            >
              {part.price ? formatPrice(part.price) : "Prix sur demande"}
            </p>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
};

export default PremiumProductCard;
