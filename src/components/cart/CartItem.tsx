import { motion } from "framer-motion";
import { Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItem as CartItemType } from "@/types/cart";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/formatPrice";

interface CartItemProps {
  item: CartItemType;
  index: number;
}

const CartItem = ({ item, index }: CartItemProps) => {
  const { updateQuantity, removeItem } = useCart();
  const isMaxQuantity = item.quantity >= item.stock_quantity;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group relative flex gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-mineral/10 hover:border-mineral/25 transition-all duration-300"
    >
      {/* Product Image */}
      <div className="w-20 h-20 rounded-lg overflow-hidden bg-greige flex-shrink-0 flex items-center justify-center">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-contain p-2"
          />
        ) : (
          <span className="text-2xl opacity-40">🔧</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Name & Remove */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-medium text-carbon text-sm leading-tight line-clamp-2">
            {item.name}
          </h4>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeItem(item.id)}
            className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Unit Price */}
        <p className="text-xs text-muted-foreground mb-3">
          {formatPrice(item.price)} / unité
        </p>

        {/* Quantity & Subtotal */}
        <div className="flex items-center justify-between">
          {/* Quantity Selector */}
          <div className="flex items-center gap-1 bg-mineral/5 rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="h-7 w-7 text-mineral hover:bg-mineral/20"
            >
              <Minus className="w-3 h-3" />
            </Button>
            <span className="w-8 text-center text-sm font-medium text-carbon">
              {item.quantity}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              disabled={isMaxQuantity}
              className="h-7 w-7 text-mineral hover:bg-mineral/20 disabled:opacity-40"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          {/* Subtotal */}
          <span className="text-base font-semibold text-mineral">
            {formatPrice(item.price * item.quantity)}
          </span>
        </div>

        {/* Max quantity warning */}
        {isMaxQuantity && (
          <p className="text-xs text-amber-600 mt-1">
            Stock maximum atteint
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default CartItem;
