import { motion } from "framer-motion";
import { ShieldCheck, Package, Star, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "@/lib/formatPrice";

interface Part {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  image_url: string | null;
  stock_quantity: number | null;
  difficulty_level: number | null;
}

interface GamingCarouselCardProps {
  part: Part;
  isCenter: boolean;
  distanceFromCenter: number;
  index: number;
}

const GamingCarouselCard = ({ part, isCenter, distanceFromCenter, index }: GamingCarouselCardProps) => {
  const navigate = useNavigate();
  
  // Dynamic scale and opacity based on position
  const getScale = () => {
    if (isCenter) return 1.1;
    if (distanceFromCenter === 1) return 1;
    return 0.95;
  };
  
  const getOpacity = () => {
    if (isCenter) return 1;
    if (distanceFromCenter === 1) return 0.9;
    return 0.7;
  };

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => navigate(`/piece/${part.slug}`), 300);
  };

  // Generate mock rating for demo
  const rating = 4 + Math.random();
  const reviewCount = Math.floor(Math.random() * 50) + 10;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ 
        opacity: getOpacity(), 
        y: 0,
        scale: getScale(),
      }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.05,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ 
        y: -12,
        scale: getScale() * 1.02,
        transition: { duration: 0.3 }
      }}
      onClick={handleClick}
      className={`relative cursor-pointer rounded-2xl overflow-hidden ${
        isCenter ? "gaming-card-center z-10" : ""
      }`}
      style={{
        background: "rgba(26, 26, 26, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: isCenter 
          ? "2px solid rgba(147, 181, 161, 0.6)" 
          : "2px solid rgba(147, 181, 161, 0.25)",
        boxShadow: isCenter 
          ? "0 12px 40px rgba(147, 181, 161, 0.35), inset 0 1px 0 rgba(255,255,255,0.1)"
          : "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      {/* Spotlight effect for center card */}
      {isCenter && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(circle at 50% 30%, rgba(147, 181, 161, 0.15) 0%, transparent 60%)",
          }}
        />
      )}

      {/* Product Image */}
      <div className="relative p-4 md:p-6">
        <motion.div
          className="relative w-full aspect-square max-w-[200px] mx-auto"
          whileHover={{ 
            rotateY: 10,
            scale: 1.05,
          }}
          transition={{ duration: 0.4 }}
          style={{ perspective: "800px" }}
        >
          {/* Spotlight behind image */}
          <div 
            className="absolute inset-0 -z-10"
            style={{
              background: "radial-gradient(circle at 50% 50%, rgba(147, 181, 161, 0.2) 0%, transparent 70%)",
              filter: "blur(20px)",
              transform: "scale(1.2)",
            }}
          />
          
          {part.image_url ? (
            <img
              src={part.image_url}
              alt={part.name}
              className={`w-full h-full object-contain ${isCenter ? "gaming-product-glow" : ""}`}
              style={{ background: "transparent" }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-16 h-16 text-white/20" />
            </div>
          )}
        </motion.div>
      </div>

      {/* Product Info */}
      <div className="px-4 pb-5 space-y-3">
        {/* Product Name */}
        <h3 
          className="text-white text-sm md:text-base font-semibold line-clamp-2 text-center min-h-[40px]"
          style={{ textShadow: "0 2px 10px rgba(0,0,0,0.3)" }}
        >
          {part.name}
        </h3>

        {/* Rating Stars */}
        <div className="flex items-center justify-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              className={`w-3.5 h-3.5 ${
                i < Math.floor(rating) 
                  ? "text-yellow-400 fill-yellow-400" 
                  : "text-white/20"
              }`}
            />
          ))}
          <span className="text-white/50 text-xs ml-1">({reviewCount})</span>
        </div>

        {/* Price with Glow */}
        <div className="text-center">
          <span 
            className="text-xl md:text-2xl font-extrabold"
            style={{
              color: "hsl(var(--mineral))",
              textShadow: isCenter 
                ? "0 0 20px rgba(147, 181, 161, 0.6)" 
                : "0 0 10px rgba(147, 181, 161, 0.3)",
            }}
          >
            {formatPrice(part.price || 0)}
          </span>
        </div>

        {/* Compatible Badge - Hexagonal Style */}
        <div className="flex justify-center">
          <div 
            className="inline-flex items-center gap-1.5 px-3 py-1.5"
            style={{
              background: "rgba(147, 181, 161, 0.15)",
              border: "1px solid rgba(147, 181, 161, 0.4)",
              clipPath: "polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)",
              boxShadow: "0 0 10px rgba(147, 181, 161, 0.2)",
            }}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-mineral" />
            <span className="text-mineral text-xs font-bold uppercase tracking-wide">
              Compatible
            </span>
          </div>
        </div>

        {/* Stock Status */}
        {part.stock_quantity !== null && (
          <div className="flex items-center justify-center gap-1.5">
            <div 
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: part.stock_quantity > 0 ? "#22c55e" : "#ef4444",
                boxShadow: part.stock_quantity > 0 
                  ? "0 0 6px rgba(34, 197, 94, 0.6)" 
                  : "0 0 6px rgba(239, 68, 68, 0.6)",
              }}
            />
            <span className="text-white/50 text-xs">
              {part.stock_quantity > 0 ? (
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-green-400" />
                  En stock
                </span>
              ) : "Rupture"}
            </span>
          </div>
        )}
      </div>

      {/* Hover Glow Overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          boxShadow: "inset 0 0 30px rgba(147, 181, 161, 0.15)",
        }}
      />
    </motion.div>
  );
};

export default GamingCarouselCard;
