import { motion } from "framer-motion";
import { ShoppingCart, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/formatPrice";

interface PurchaseBlockProps {
  id: string;
  name: string;
  price: number | null;
  stockQuantity: number | null;
  categoryName: string | null;
  categoryIcon: string | null;
  imageUrl: string | null;
}

const PurchaseBlock = ({
  id,
  name,
  price,
  stockQuantity,
  categoryName,
  imageUrl,
}: PurchaseBlockProps) => {
  const { addItem, setIsOpen } = useCart();
  const isInStock = stockQuantity !== null && stockQuantity > 0;

  const handleAddToCart = () => {
    if (!isInStock || price === null) return;

    addItem({
      id,
      name,
      price,
      image_url: imageUrl,
      stock_quantity: stockQuantity || 0,
    });

    // Premium toast with product image
    toast.success(
      <div className="flex items-center gap-3">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={name}
            className="w-12 h-12 rounded-lg object-contain bg-greige p-1"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-greige flex items-center justify-center text-xl">
            🔧
          </div>
        )}
        <div>
          <p className="font-medium text-carbon">{name}</p>
          <p className="text-sm text-muted-foreground">Ajouté au panier</p>
        </div>
      </div>,
      {
        action: {
          label: "Voir le panier",
          onClick: () => setIsOpen(true),
        },
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="h-full bg-white/40 backdrop-blur-md border border-white/20 rounded-2xl p-6 md:p-8 flex flex-col justify-between"
    >
      {/* Top section */}
      <div className="space-y-4">
        {/* Category badge */}
        {categoryName && (
          <Badge
            variant="secondary"
            className="bg-mineral/10 text-mineral border-mineral/20 font-montserrat text-xs uppercase tracking-wider"
          >
            {categoryName}
          </Badge>
        )}

        {/* Product name */}
        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-carbon leading-tight uppercase tracking-wide">
          {name}
        </h1>

        {/* Price */}
        {price !== null && (
          <div className="flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-light text-mineral tracking-wide">
              {formatPrice(price)}
            </span>
          </div>
        )}

        {/* Stock indicator */}
        <div className="flex items-center gap-2">
          {isInStock ? (
            <>
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700 font-medium">
                En stock ({stockQuantity})
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-700 font-medium">
                Rupture de stock
              </span>
            </>
          )}
        </div>
      </div>

      {/* CTA Button */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="mt-6"
      >
        <Button
          onClick={handleAddToCart}
          disabled={!isInStock}
          className="w-full h-14 bg-carbon hover:bg-carbon/90 text-white font-display text-lg uppercase tracking-widest rounded-xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(38,38,38,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="w-5 h-5 mr-3" />
          Ajouter au panier
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default PurchaseBlock;
