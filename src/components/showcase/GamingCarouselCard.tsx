import { motion } from "framer-motion";
import { Package, ShieldCheck, ShieldX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "@/lib/formatPrice";
import { useIsCompatibleWithSelected } from "@/hooks/useIsCompatibleWithSelected";

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

const GamingCarouselCard = ({ 
  part, 
  isCenter, 
  distanceFromCenter,
}: GamingCarouselCardProps) => {
  const navigate = useNavigate();
  
  // Dynamic compatibility check with Header/Garage scooter
  const { isCompatible, selectedScooter, brandColors } = useIsCompatibleWithSelected(part.id);

  // Scale based on distance - central product is HUGE (1.4)
  const getScale = () => {
    if (isCenter) return 1.6;
    if (distanceFromCenter === 1) return 1.0;
    if (distanceFromCenter === 2) return 0.9;
    return 0.85;
  };

  // Opacity based on distance - more contrast
  const getOpacity = () => {
    if (isCenter) return 1;
    if (distanceFromCenter === 1) return 0.8;
    if (distanceFromCenter === 2) return 0.6;
    return 0.5;
  };

  // Blur for depth effect
  const getBlur = () => {
    if (isCenter) return 0;
    if (distanceFromCenter === 1) return 0.5;
    if (distanceFromCenter === 2) return 0.8;
    return 1;
  };

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      navigate(`/pieces/${part.slug}`);
    }, 150);
  };

  // Image size based on position
  const getImageSize = () => {
    if (isCenter) return "1000px";
    if (distanceFromCenter === 1) return "760px";
    return "640px";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ 
        opacity: getOpacity(), 
        y: 0,
        scale: getScale(),
        filter: `blur(${getBlur()}px)`,
      }}
      transition={{ 
        duration: 0.6, 
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      onClick={handleClick}
      className={`relative cursor-pointer ${isCenter ? "floating-product-center z-10" : ""}`}
    >
      {/* Floating Product Image */}
      <motion.div
        className="relative"
        whileHover={{ 
          rotateY: isCenter ? 5 : 3,
          scale: 1.03,
        }}
        transition={{ duration: 0.4 }}
        style={{ 
          perspective: "1000px",
          transformStyle: "preserve-3d",
        }}
      >
        {part.image_url ? (
          <img
            src={part.image_url}
            alt={part.name}
            className={`w-full h-auto object-contain mx-auto ${isCenter ? "floating-product-image" : ""}`}
            style={{ 
              maxWidth: getImageSize(),
              maxHeight: getImageSize(),
              filter: isCenter 
                ? undefined // Animation CSS handles this
                : `drop-shadow(0 15px 30px rgba(26, 26, 26, 0.12))`,
            }}
          />
        ) : (
          <div 
            className="flex items-center justify-center rounded-2xl bg-white/30"
            style={{
              width: getImageSize(),
              height: getImageSize(),
            }}
          >
            <Package className="w-16 h-16 text-carbon/20" />
          </div>
        )}
      </motion.div>

      {/* Product Info - Only for center card */}
      {isCenter && (
        <motion.div 
          className="mt-8 text-center space-y-3"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <h3 className="text-carbon text-lg md:text-xl font-semibold line-clamp-2 px-4">
            {part.name}
          </h3>
          <span 
            className="text-2xl md:text-3xl font-extrabold block"
            style={{ color: "hsl(var(--mineral))" }}
          >
            {formatPrice(part.price || 0)}
          </span>
          {/* Dynamic Compatibility Badge - Only when Garage scooter is selected */}
          {selectedScooter && (
            <div className="flex justify-center pt-1">
              {isCompatible ? (
                /* Green Compatible Badge with Brand LED Glow */
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    boxShadow: [
                      `0 0 8px ${brandColors.glowColor}`,
                      `0 0 16px ${brandColors.glowColor}`,
                      `0 0 8px ${brandColors.glowColor}`,
                    ]
                  }}
                  transition={{ 
                    opacity: { duration: 0.3 },
                    scale: { duration: 0.3 },
                    boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-sm font-bold uppercase tracking-wide"
                  style={{
                    background: "rgba(147, 181, 161, 0.85)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                  }}
                >
                  {/* Pulsing dot with brand accent */}
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
                    style={{ backgroundColor: brandColors.accent }}
                  />
                  <ShieldCheck className="w-4 h-4" />
                  <span>Compatible</span>
                </motion.div>
              ) : (
                /* Red Non-Compatible Badge */
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-sm font-bold uppercase tracking-wide"
                  style={{
                    background: "rgba(220, 38, 38, 0.85)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                  }}
                >
                  <ShieldX className="w-4 h-4" />
                  <span>Non Compatible</span>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default GamingCarouselCard;
