import { motion } from "framer-motion";
import { ShieldCheck, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "@/lib/formatPrice";
import GamingStatBar from "./GamingStatBar";

interface Part {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  image_url: string | null;
  stock_quantity: number | null;
  difficulty_level: number | null;
}

interface GamingProductCardProps {
  part: Part;
  direction: number;
}

const GamingProductCard = ({ part, direction }: GamingProductCardProps) => {
  const navigate = useNavigate();
  
  // Generate stats based on product data
  const stats = [
    { name: "Qualité", value: 95 },
    { name: "Compatibilité", value: 100 },
    { name: "Durabilité", value: part.difficulty_level ? 100 - (part.difficulty_level * 5) : 85 },
  ];

  const handleBuyClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => navigate(`/piece/${part.slug}`), 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, x: direction > 0 ? 100 : -100 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.8, x: direction > 0 ? -100 : 100 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex flex-col items-center justify-center px-4 py-6"
    >
      {/* Spotlight Radial Effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 40%, rgba(147, 181, 161, 0.25) 0%, rgba(147, 181, 161, 0.08) 30%, transparent 60%)",
          filter: "blur(40px)",
        }}
      />

      {/* Light Rays Effect */}
      <div className="gaming-light-rays pointer-events-none" />

      {/* Legendary Flash Effect */}
      <motion.div
        initial={{ opacity: 0.6, scale: 1.2 }}
        animate={{ opacity: 0, scale: 2 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 bg-white/20 rounded-full pointer-events-none"
        style={{ filter: "blur(30px)" }}
      />

      {/* Product Image - THE STAR */}
      <motion.div
        className="relative w-[280px] h-[280px] md:w-[380px] md:h-[380px] lg:w-[450px] lg:h-[450px] mx-auto mb-6"
        animate={{ 
          rotateY: [0, 2, 0, -2, 0],
        }}
        transition={{ 
          rotateY: { duration: 6, repeat: Infinity, ease: "easeInOut" }
        }}
        whileHover={{ 
          rotateY: 15,
          scale: 1.05,
        }}
        style={{ perspective: "1000px" }}
      >
        {part.image_url ? (
          <img
            src={part.image_url}
            alt={part.name}
            className="w-full h-full object-contain gaming-product-glow"
            style={{ 
              background: "transparent",
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-32 h-32 text-white/20" />
          </div>
        )}
      </motion.div>

      {/* Product Name */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-white text-xl md:text-2xl lg:text-3xl font-display text-center uppercase tracking-wider mb-4"
        style={{ 
          textShadow: "0 0 20px rgba(255,255,255,0.3)",
        }}
      >
        {part.name}
      </motion.h2>

      {/* Price with Glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="text-3xl md:text-4xl lg:text-5xl font-black text-center mb-4"
        style={{
          color: "hsl(var(--mineral))",
        }}
      >
        <motion.span
          animate={{
            textShadow: [
              "0 0 20px rgba(147, 181, 161, 0.5)",
              "0 0 40px rgba(147, 181, 161, 0.9)",
              "0 0 20px rgba(147, 181, 161, 0.5)",
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {formatPrice(part.price || 0)}
        </motion.span>
      </motion.div>

      {/* Compatible Badge - Hexagonal Neon */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="inline-flex items-center gap-2 px-5 py-2.5 mb-6"
        style={{
          background: "rgba(147, 181, 161, 0.15)",
          border: "1px solid rgba(147, 181, 161, 0.5)",
          clipPath: "polygon(8% 0%, 92% 0%, 100% 50%, 92% 100%, 8% 100%, 0% 50%)",
          boxShadow: "0 0 20px rgba(147, 181, 161, 0.3), inset 0 0 20px rgba(147, 181, 161, 0.1)",
        }}
      >
        <ShieldCheck className="w-5 h-5 text-mineral" />
        <span className="text-mineral font-bold uppercase tracking-wider text-sm">
          100% Compatible
        </span>
      </motion.div>

      {/* Stats Bars */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-md mb-8"
      >
        <GamingStatBar stats={stats} />
      </motion.div>

      {/* Buy Button - Gaming Style */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        onClick={handleBuyClick}
        className="px-8 py-4 font-bold text-base md:text-lg uppercase tracking-wider"
        style={{
          background: "linear-gradient(135deg, hsl(var(--mineral)) 0%, hsl(var(--mineral-dark)) 100%)",
          border: "none",
          borderRadius: "8px",
          color: "#0a0a0a",
          boxShadow: "0 0 30px rgba(147, 181, 161, 0.4), 0 4px 20px rgba(0,0,0,0.3)",
        }}
        whileHover={{
          scale: 1.05,
          boxShadow: "0 0 50px rgba(147, 181, 161, 0.8), 0 8px 30px rgba(0,0,0,0.4)",
        }}
        whileTap={{ scale: 0.98 }}
      >
        Voir le Produit
      </motion.button>

      {/* Stock Indicator */}
      {part.stock_quantity !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-4 flex items-center gap-2"
        >
          <div 
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: part.stock_quantity > 0 ? "#22c55e" : "#ef4444",
              boxShadow: part.stock_quantity > 0 
                ? "0 0 8px rgba(34, 197, 94, 0.6)" 
                : "0 0 8px rgba(239, 68, 68, 0.6)",
            }}
          />
          <span className="text-white/60 text-sm">
            {part.stock_quantity > 0 ? `${part.stock_quantity} en stock` : "Rupture de stock"}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
};

export default GamingProductCard;
