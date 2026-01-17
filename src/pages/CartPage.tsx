import { motion } from "framer-motion";
import { ArrowLeft, ShoppingBag, ArrowRight, Gem } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/formatPrice";
import CartItem from "@/components/cart/CartItem";
import EmptyCart from "@/components/cart/EmptyCart";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const CartPage = () => {
  const { items, totals } = useCart();
  const navigate = useNavigate();
  const isEmpty = items.length === 0;

  return (
    <div className="min-h-screen bg-greige">
      <Header />
      
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Back Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Link 
              to="/catalogue" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-carbon transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Continuer mes achats</span>
            </Link>
          </motion.div>

          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-4 mb-10"
          >
            <div className="w-14 h-14 rounded-2xl bg-mineral/10 flex items-center justify-center">
              <ShoppingBag className="w-7 h-7 text-mineral" />
            </div>
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-carbon tracking-wide">
                MON PANIER
              </h1>
              {!isEmpty && (
                <p className="text-muted-foreground">
                  {totals.itemCount} article{totals.itemCount > 1 ? 's' : ''} dans votre panier
                </p>
              )}
            </div>
          </motion.div>

          {isEmpty ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/20 p-12"
            >
              <EmptyCart />
            </motion.div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Items List */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2 space-y-4"
              >
                {items.map((item, index) => (
                  <CartItem key={item.id} item={item} index={index} />
                ))}
              </motion.div>

              {/* Summary - Sticky on Desktop */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="lg:col-span-1"
              >
                <div className="sticky top-28 bg-white/60 backdrop-blur-md rounded-2xl border border-white/20 p-6 space-y-6">
                  <h2 className="font-display text-xl text-carbon tracking-wide">
                    RÉCAPITULATIF
                  </h2>

                  {/* Totals */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sous-total HT</span>
                      <span className="text-carbon">{formatPrice(totals.subtotalHT)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">TVA (20%)</span>
                      <span className="text-carbon">{formatPrice(totals.tva)}</span>
                    </div>
                    <div className="h-px bg-mineral/15 my-4" />
                    <div className="flex justify-between items-baseline">
                      <span className="font-display text-lg text-carbon">TOTAL TTC</span>
                      <span className="font-display text-3xl text-mineral tracking-wide">
                        {formatPrice(totals.totalTTC)}
                      </span>
                    </div>
                  </div>

                  {/* Loyalty Points with Glow Animation */}
                  {totals.loyaltyPoints > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-center gap-2 py-3 px-4 bg-mineral/10 rounded-xl relative overflow-hidden"
                    >
                      {/* Subtle glow effect */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-mineral/0 via-mineral/20 to-mineral/0"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      />
                      <motion.div
                        animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Gem className="w-4 h-4 text-mineral drop-shadow-[0_0_6px_rgba(147,181,161,0.6)]" />
                      </motion.div>
                      <span className="relative z-10 text-sm font-medium text-mineral">
                        Gagnez {totals.loyaltyPoints} points avec cette commande
                      </span>
                    </motion.div>
                  )}

                  {/* CTA Button */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={() => navigate('/checkout')}
                      className="relative w-full h-14 bg-carbon text-white font-display text-lg tracking-widest rounded-xl overflow-hidden group transition-all duration-300"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-mineral/0 via-mineral/30 to-mineral/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        PASSER LA COMMANDE
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Button>
                  </motion.div>

                  {/* Security badge */}
                  <p className="text-xs text-center text-muted-foreground">
                    🔒 Paiement sécurisé · Livraison rapide
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CartPage;
