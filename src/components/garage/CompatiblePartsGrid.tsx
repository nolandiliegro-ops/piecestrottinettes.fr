import { useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Package, ShoppingCart, ArrowRight, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
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

const categories = ["Tous", "Freinage", "Pneus", "Chambres à Air", "Batteries", "Chargeurs", "Accessoires"];

const CompatiblePartsGrid = ({ 
  scooterId, 
  scooterName, 
  parts, 
  loading 
}: CompatiblePartsGridProps) => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [activeFilter, setActiveFilter] = useState("Tous");
  const [sortBy, setSortBy] = useState("default");
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' });
  };

  // Filtering and sorting logic
  const filteredParts = useMemo(() => {
    let result = [...parts];
    
    // Filter by category
    if (activeFilter !== "Tous") {
      result = result.filter(part => part.category.name === activeFilter);
    }
    
    // Sort
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "stock":
        result.sort((a, b) => b.stock_quantity - a.stock_quantity);
        break;
      case "difficulty":
        result.sort((a, b) => (a.difficulty_level || 0) - (b.difficulty_level || 0));
        break;
    }
    
    return result;
  }, [parts, activeFilter, sortBy]);

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
            {filteredParts.length}
          </span>
        </div>
        <motion.div 
          whileHover={{ scale: 1.1 }} 
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <Link 
            to={`/catalogue?scooter=${scooterId}`}
            className="text-xs md:text-sm text-mineral hover:text-mineral/80 flex items-center gap-1.5 
                       px-3 py-1.5 bg-mineral/10 hover:bg-mineral/15 rounded-full transition-colors"
          >
            Voir tout
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-xs font-semibold text-carbon/60 uppercase tracking-wide">Filtrer :</span>
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map(cat => (
            <motion.button
              key={cat}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveFilter(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                activeFilter === cat
                  ? "bg-mineral text-white shadow-md"
                  : "bg-white/60 backdrop-blur-sm text-carbon/70 hover:bg-white/80 border border-carbon/10"
              )}
            >
              {cat}
            </motion.button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="ml-auto px-3 py-1.5 bg-white/60 backdrop-blur-sm rounded-lg text-xs 
                     border-[0.5px] border-mineral/20 text-carbon/70
                     focus:outline-none focus:ring-2 focus:ring-mineral/30 cursor-pointer"
        >
          <option value="default">Trier par</option>
          <option value="price-asc">Prix croissant</option>
          <option value="price-desc">Prix décroissant</option>
          <option value="stock">Stock disponible</option>
          <option value="difficulty">Difficulté</option>
        </select>
      </div>

      {/* Horizontal Carousel */}
      <div className="relative group/carousel">
        {/* Navigation Arrows - Desktop only */}
        <button
          onClick={scrollLeft}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 
                     w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg 
                     items-center justify-center hover:bg-white transition-all
                     opacity-0 group-hover/carousel:opacity-100 -translate-x-4
                     hover:scale-110"
        >
          <ChevronLeft className="w-5 h-5 text-carbon" />
        </button>
        
        <button
          onClick={scrollRight}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 
                     w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg 
                     items-center justify-center hover:bg-white transition-all
                     opacity-0 group-hover/carousel:opacity-100 translate-x-4
                     hover:scale-110"
        >
          <ChevronRight className="w-5 h-5 text-carbon" />
        </button>

        {/* Scroll Container */}
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide scroll-smooth px-1"
        >
          {filteredParts.map((part, index) => (
            <motion.div
              key={part.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ 
                scale: 1.03, 
                y: -6,
                transition: { type: "spring", stiffness: 400, damping: 25 }
              }}
              whileTap={{ scale: 0.98 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              onClick={() => handleViewPart(part)}
              className="flex-none w-[280px] snap-start cursor-pointer group relative bg-white/80 backdrop-blur-sm border border-carbon/10 rounded-xl p-4 hover:shadow-2xl hover:border-mineral/40 transition-shadow"
            >
              {/* Stock Badge */}
              <div className={cn(
                "absolute top-2 right-2 px-2 py-1 rounded-full text-[10px] font-bold",
                "bg-white/95 backdrop-blur-sm shadow-md z-10 border-2",
                part.stock_quantity > 10 
                  ? "text-emerald-600 border-emerald-500" 
                  : part.stock_quantity > 0
                    ? "text-orange-600 border-orange-500"
                    : "text-red-600 border-red-500"
              )}>
                {part.stock_quantity > 10 
                  ? "En stock" 
                  : part.stock_quantity > 0 
                    ? `Stock: ${part.stock_quantity}` 
                    : "Rupture"}
              </div>

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

              {/* Price */}
              <span className="text-lg font-bold text-mineral block mb-2">
                {formatPrice(part.price)}
              </span>

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

      {/* Empty filtered state */}
      {filteredParts.length === 0 && parts.length > 0 && (
        <div className="h-32 flex flex-col items-center justify-center bg-white/40 border border-mineral/20 rounded-xl gap-2">
          <Package className="w-6 h-6 text-carbon/30" />
          <p className="text-carbon/50 text-sm">Aucune pièce dans cette catégorie</p>
          <button 
            onClick={() => setActiveFilter("Tous")}
            className="text-xs text-mineral hover:underline"
          >
            Réinitialiser le filtre
          </button>
        </div>
      )}
    </div>
  );
};

export default CompatiblePartsGrid;
