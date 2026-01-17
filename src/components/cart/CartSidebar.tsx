import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/formatPrice";
import CartItem from "./CartItem";
import EmptyCart from "./EmptyCart";
import { ScrollArea } from "@/components/ui/scroll-area";

const CartSidebar = () => {
  const { items, isOpen, setIsOpen, totals, clearCart } = useCart();
  const isEmpty = items.length === 0;

  const handleCheckout = () => {
    // TODO: Implement checkout logic
    console.log("Proceeding to checkout...", items);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg p-0 bg-white/40 backdrop-blur-xl border-l border-mineral/20 z-[100]"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b border-mineral/10 bg-white/60">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-mineral/10 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-mineral" />
              </div>
              <div>
                <span className="font-display text-xl text-carbon tracking-wide">MON PANIER</span>
                {!isEmpty && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({totals.itemCount} article{totals.itemCount > 1 ? 's' : ''})
                  </span>
                )}
              </div>
            </SheetTitle>
            {!isEmpty && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Vider
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* Content */}
        {isEmpty ? (
          <EmptyCart />
        ) : (
          <div className="flex flex-col h-[calc(100vh-180px)]">
            {/* Items List */}
            <ScrollArea className="flex-1 px-4 py-4">
              <AnimatePresence mode="popLayout">
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <CartItem key={item.id} item={item} index={index} />
                  ))}
                </div>
              </AnimatePresence>
            </ScrollArea>

            {/* Footer - Sticky */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="sticky bottom-0 p-6 border-t border-mineral/10 bg-white/80 backdrop-blur-md space-y-4"
            >
              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total HT</span>
                  <span className="text-carbon">{formatPrice(totals.subtotalHT)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">TVA (20%)</span>
                  <span className="text-carbon">{formatPrice(totals.tva)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-3 border-t border-mineral/15">
                  <span className="font-display text-lg text-carbon">TOTAL TTC</span>
                  <span className="font-display text-3xl text-mineral tracking-wide">
                    {formatPrice(totals.totalTTC)}
                  </span>
                </div>
              </div>

              {/* CTA Button - Luxury Hover Effect */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleCheckout}
                  className="relative w-full h-14 bg-carbon text-white font-display text-lg tracking-widest rounded-xl overflow-hidden group transition-all duration-300"
                >
                  {/* Luxury Glow Effect on Hover */}
                  <span className="absolute inset-0 bg-gradient-to-r from-mineral/0 via-mineral/30 to-mineral/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
                    boxShadow: 'inset 0 0 30px rgba(147, 181, 161, 0.3)'
                  }} />
                  <span className="relative z-10">COMMANDER</span>
                </Button>
              </motion.div>

              {/* Security badge */}
              <p className="text-xs text-center text-muted-foreground">
                🔒 Paiement sécurisé · Livraison rapide
              </p>
            </motion.div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartSidebar;
