import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Package, ShoppingCart, ArrowRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import DifficultyIndicator from "@/components/parts/DifficultyIndicator";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/formatPrice";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";

interface Part {
  id: string;
  name: string;
  price: number;
  image?: string;
  stock_quantity: number;
  difficulty_level?: number | null;
  slug?: string | null;
  category: { name: string };
}

interface CompatiblePartsGridProps {
  scooterId: string;
  scooterName: string;
  parts: Part[];
  loading: boolean;
}

const CompatiblePartsGrid = ({ 
  scooterId, 
  scooterName, 
  parts, 
  loading 
}: CompatiblePartsGridProps) => {
  const navigate = useNavigate();
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent, part: Part) => {
    e.stopPropagation();
    if (part.stock_quantity <= 0) {
      toast.error("Ce produit est en rupture de stock");
      return;
    }
    addItem({
      id: part.id,
      name: part.name,
      price: part.price,
      image_url: part.image,
      stock_quantity: part.stock_quantity
    });
    toast.success(`${part.name} ajouté au panier`);
  };

  const handleViewPart = (part: Part) => {
    if (part.slug) {
      navigate(`/piece/${part.slug}`);
    } else {
      navigate(`/part/${part.id}`);
    }
  };

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center bg-white/40 rounded-xl">
        <Loader2 className="w-6 h-6 animate-spin text-mineral" />
      </div>
    );
  }

  if (!parts || parts.length === 0) {
    return (
      <div className="h-48 flex flex-col items-center justify-center bg-white/40 border border-mineral/20 rounded-xl gap-2">
        <Package className="w-8 h-8 text-carbon/20" />
        <p className="text-carbon/40 text-sm">Aucune pièce compatible</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-mineral" />
          <h3 className="font-display text-sm md:text-base text-carbon uppercase tracking-wide">
            Pièces compatibles
          </h3>
          <span className="px-2 py-0.5 bg-mineral/10 text-mineral text-xs font-semibold rounded-full">
            {parts.length}
          </span>
        </div>
        <Link 
          to={`/catalogue?scooter=${scooterId}`}
          className="text-xs md:text-sm text-mineral hover:underline flex items-center gap-1"
        >
          Voir tout
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {parts.slice(0, 6).map((part, index) => (
          <motion.div
            key={part.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            onClick={() => handleViewPart(part)}
            className={cn(
              "group relative bg-white/80 backdrop-blur-sm border border-carbon/10 rounded-xl p-4",
              "hover:shadow-lg hover:border-mineral/40 transition-all cursor-pointer"
            )}
          >
            {/* Image */}
            <div className="aspect-square rounded-lg bg-greige overflow-hidden mb-3">
              {part.image ? (
                <img 
                  src={part.image} 
                  alt={part.name} 
                  className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-300" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-10 h-10 text-carbon/20" />
                </div>
              )}
            </div>

            {/* Category */}
            <p className="text-[10px] text-mineral font-semibold uppercase tracking-wider mb-1">
              {part.category.name}
            </p>

            {/* Name */}
            <h4 className="font-medium text-carbon line-clamp-2 text-sm mb-2 min-h-[2.5rem]">
              {part.name}
            </h4>

            {/* Price + Stock */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-bold text-mineral">
                {formatPrice(part.price)}
              </span>
              <Badge 
                variant="secondary"
                className={cn(
                  "text-[10px] border",
                  part.stock_quantity > 10 
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                    : part.stock_quantity > 0
                      ? "bg-amber-100 text-amber-700 border-amber-200"
                      : "bg-red-100 text-red-700 border-red-200"
                )}
              >
                {part.stock_quantity > 10 
                  ? "En stock" 
                  : part.stock_quantity > 0 
                    ? "Stock limité" 
                    : "Rupture"}
              </Badge>
            </div>

            {/* Difficulty */}
            {part.difficulty_level && (
              <div className="flex items-center justify-between pt-2 border-t border-carbon/10">
                <span className="text-xs text-carbon/50">Installation</span>
                <DifficultyIndicator level={part.difficulty_level} variant="dots" />
              </div>
            )}

            {/* Cart button on hover */}
            <button 
              onClick={(e) => handleAddToCart(e, part)}
              className={cn(
                "absolute bottom-3 right-3 w-9 h-9 rounded-full bg-mineral text-white",
                "flex items-center justify-center opacity-0 group-hover:opacity-100",
                "transition-all hover:scale-110 shadow-lg",
                part.stock_quantity <= 0 && "bg-carbon/30 cursor-not-allowed"
              )}
              disabled={part.stock_quantity <= 0}
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CompatiblePartsGrid;
