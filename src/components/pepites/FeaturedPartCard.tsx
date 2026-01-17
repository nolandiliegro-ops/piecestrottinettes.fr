import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Award, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/formatPrice";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

interface FeaturedPartCardProps {
  part: Tables<'parts'>;
  index: number;
}

const FeaturedPartCard = ({ part, index }: FeaturedPartCardProps) => {
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addItem({
      id: part.id,
      name: part.name,
      price: part.price || 0,
      image_url: part.image_url,
      stock_quantity: part.stock_quantity || 0,
    });
    
    toast.success("Pépite ajoutée au panier", {
      description: part.name,
      duration: 3000,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.7, 
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1] 
      }}
    >
      <Link to={`/piece/${part.slug}`} className="group block">
        <div className="relative bg-white/60 backdrop-blur-md rounded-3xl border border-white/20 overflow-hidden transition-all duration-500 ease-out group-hover:scale-[1.02] group-hover:shadow-2xl group-hover:shadow-mineral/20">
          {/* Image Container */}
          <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-greige to-white">
            {part.image_url ? (
              <img
                src={part.image_url}
                alt={part.name}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-mineral/5 to-mineral/10">
                <span className="text-6xl font-display text-mineral/20">PT</span>
              </div>
            )}
            
            {/* Mineral Green Glow Overlay on Hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-mineral/30 via-mineral/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Expert Badge - Shimmer Effect */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="absolute top-4 right-4"
            >
              <div className="relative flex items-center gap-2 px-3 py-2 bg-mineral text-white rounded-xl overflow-hidden">
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                <Award className="w-4 h-4 relative z-10" />
                <span className="text-xs font-semibold tracking-wide relative z-10">
                  COUP DE CŒUR
                </span>
              </div>
            </motion.div>
            
            {/* Quick Add Button - Reveals on Hover */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileHover={{ scale: 1.05 }}
              className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0"
            >
              <Button
                onClick={handleAddToCart}
                className="w-full bg-carbon hover:bg-carbon/90 text-white font-medium py-3 rounded-xl gap-2 transition-all duration-300"
              >
                <ShoppingCart className="w-4 h-4" />
                Ajouter au panier
              </Button>
            </motion.div>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {/* Category Tag */}
            {part.category_id && (
              <span className="text-xs font-medium text-mineral/80 tracking-wide uppercase mb-2 block">
                Pièce Premium
              </span>
            )}
            
            {/* Name */}
            <h3 className="font-display text-xl text-carbon tracking-wide mb-3 group-hover:text-mineral transition-colors duration-300 line-clamp-2">
              {part.name}
            </h3>
            
            {/* Description */}
            {part.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {part.description}
              </p>
            )}
            
            {/* Price - Monumental */}
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl text-mineral tracking-wide">
                {formatPrice(part.price || 0)}
              </span>
              <span className="text-xs text-muted-foreground">TTC</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default FeaturedPartCard;
