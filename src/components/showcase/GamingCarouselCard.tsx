import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Heart, Eye, ShoppingCart, Zap, Check, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "@/lib/formatPrice";
import { useIsCompatibleWithSelected } from "@/hooks/useIsCompatibleWithSelected";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";
import QuickViewModal from "./QuickViewModal";

interface Part {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  image_url: string | null;
  stock_quantity: number | null;
  difficulty_level: number | null;
  description?: string | null;
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
  
  // Interactive states
  const [isHovered, setIsHovered] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  
  // Hooks
  const { addItem, setIsOpen } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
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

  // Image size based on position
  const getImageSize = () => {
    if (isCenter) return "1000px";
    if (distanceFromCenter === 1) return "760px";
    return "640px";
  };

  // Navigation handler - Fixed 404 bug
  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      navigate(`/piece/${part.slug}`);
    }, 150);
  };

  // Image click opens Quick View for center card
  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCenter) {
      setShowQuickView(true);
    } else {
      handleClick();
    }
  };

  // Add to cart with visual toast
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (part.price === null) return;
    
    addItem({
      id: part.id,
      name: part.name,
      price: part.price,
      image_url: part.image_url,
      stock_quantity: part.stock_quantity || 0,
    });
    
    toast.success(
      <div className="flex items-center gap-3">
        {part.image_url && (
          <img 
            src={part.image_url} 
            alt={part.name}
            className="w-10 h-10 rounded-lg object-contain bg-greige p-1"
          />
        )}
        <div>
          <p className="font-medium text-carbon text-sm">{part.name}</p>
          <p className="text-xs text-muted-foreground">Ajouté au panier</p>
        </div>
      </div>,
      { action: { label: "Voir", onClick: () => setIsOpen(true) } }
    );
  };

  // Toggle favorite
  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(part.id, part.name);
  };

  // Quick view
  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowQuickView(true);
  };

  // Direct order with animation
  const handleDirectOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOrdering || part.price === null) return;
    
    setIsOrdering(true);
    
    setTimeout(() => {
      addItem({
        id: part.id,
        name: part.name,
        price: part.price!,
        image_url: part.image_url,
        stock_quantity: part.stock_quantity || 0,
      });
      
      setIsOrdering(false);
      setOrderSuccess(true);
      
      toast.success("Pièce ajoutée au panier", {
        action: { label: "Voir le panier", onClick: () => setIsOpen(true) }
      });
      
      setTimeout(() => setOrderSuccess(false), 1500);
    }, 500);
  };

  return (
    <>
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
        onMouseEnter={() => isCenter && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
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
          onClick={handleImageClick}
        >
          {part.image_url ? (
            <img
              src={part.image_url}
              alt={part.name}
              className={`w-full h-auto object-contain mx-auto ${isCenter ? "floating-product-image cursor-pointer" : ""}`}
              style={{ 
                maxWidth: getImageSize(),
                maxHeight: getImageSize(),
                filter: isCenter 
                  ? undefined
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

          {/* Action Bar - Only on center product when hovered */}
          <AnimatePresence>
            {isHovered && isCenter && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20"
              >
                <div 
                  className="flex items-center gap-3 px-4 py-2.5 rounded-2xl"
                  style={{
                    background: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: "1px solid rgba(147, 181, 161, 0.2)",
                    boxShadow: "0 8px 32px rgba(26, 26, 26, 0.12)"
                  }}
                >
                  {/* Favorite Button */}
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleToggleFavorite}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                    style={{
                      background: isFavorite(part.id) 
                        ? "rgba(239, 68, 68, 0.1)" 
                        : "rgba(26, 26, 26, 0.05)"
                    }}
                    aria-label={isFavorite(part.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                  >
                    <Heart 
                      className={`w-5 h-5 transition-colors ${
                        isFavorite(part.id) 
                          ? "fill-red-500 text-red-500" 
                          : "text-carbon/60 hover:text-carbon"
                      }`} 
                    />
                  </motion.button>

                  {/* Quick View Button */}
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleQuickView}
                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-carbon/5 hover:bg-carbon/10 transition-colors"
                    aria-label="Aperçu rapide"
                  >
                    <Eye className="w-5 h-5 text-carbon/60 hover:text-carbon" />
                  </motion.button>

                  {/* Cart Button */}
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleAddToCart}
                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-mineral/10 hover:bg-mineral/20 transition-colors"
                    aria-label="Ajouter au panier"
                  >
                    <ShoppingCart className="w-5 h-5 text-mineral" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
            
            {/* Price / Commander Direct Button */}
            <AnimatePresence mode="wait">
              {isHovered ? (
                <motion.button
                  key="order-button"
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -5 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  onClick={handleDirectOrder}
                  disabled={isOrdering || part.price === null}
                  className={`w-full max-w-xs mx-auto py-3 px-6 rounded-xl font-semibold text-white transition-all duration-300 ${
                    orderSuccess ? "bg-green-500" : "bg-mineral hover:bg-mineral-dark"
                  }`}
                  style={{
                    boxShadow: orderSuccess
                      ? "0 8px 24px rgba(34, 197, 94, 0.4)"
                      : "0 8px 24px rgba(147, 181, 161, 0.4)"
                  }}
                  aria-label="Commander directement"
                >
                  {isOrdering ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : orderSuccess ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      <span>Ajouté !</span>
                    </motion.div>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Zap className="w-4 h-4" />
                      <span>Commander Direct</span>
                    </span>
                  )}
                </motion.button>
              ) : (
                <motion.span
                  key="price"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-2xl md:text-3xl font-extrabold block text-mineral"
                >
                  {formatPrice(part.price || 0)}
                </motion.span>
              )}
            </AnimatePresence>

            {/* Compatibility Badge */}
            {selectedScooter && isCompatible && (
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="flex flex-col items-center gap-2 pt-2"
              >
                <motion.div
                  animate={{ 
                    boxShadow: [
                      `0 0 6px ${brandColors.glowColor}`,
                      `0 0 12px ${brandColors.glowColor}`,
                      `0 0 6px ${brandColors.glowColor}`,
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider text-white"
                  style={{
                    background: "rgba(147, 181, 161, 0.85)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.25)",
                  }}
                >
                  <motion.div
                    animate={{ 
                      scale: [1, 1.4, 1],
                      opacity: [1, 0.6, 1]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: brandColors.accent }}
                  />
                  <span>Compatible</span>
                </motion.div>
                
                <p className="text-xs text-muted-foreground/70 font-light italic leading-relaxed text-center max-w-[260px]">
                  Ce produit est également compatible avec votre{" "}
                  <span className="font-medium text-foreground/80 not-italic">
                    {selectedScooter.name}
                  </span>
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Quick View Modal */}
      <QuickViewModal 
        part={part}
        isOpen={showQuickView}
        onClose={() => setShowQuickView(false)}
        isCompatible={isCompatible}
        selectedScooterName={selectedScooter?.name}
      />
    </>
  );
};

export default GamingCarouselCard;
