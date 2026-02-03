import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle, Package, Mail, ArrowRight, Loader2, AlertCircle, Home, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/formatPrice";
import { useExperiencePoints } from "@/hooks/useExperiencePoints";
import { useAuthContext } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface OrderDetails {
  orderNumber: string;
  status: string;
  totalTTC: number;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  deliveryMethod: string;
  deliveryPrice: number;
  items: Array<{
    part_name: string;
    quantity: number;
    unit_price: number;
    part_image_url?: string;
  }>;
  paidAt?: string;
}

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const { user } = useAuthContext();
  const { addPoints } = useExperiencePoints();
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const xpAwardedRef = useRef(false);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setError("Session de paiement manquante");
        setIsVerifying(false);
        return;
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke("verify-payment", {
          body: { session_id: sessionId },
        });

        if (fnError) {
          throw new Error(fnError.message);
        }

        if (data.success && data.order) {
          setOrder(data.order);
          // Clear cart after successful payment verification
          clearCart();
          
          // Award +100 XP for purchase (only once per session)
          if (user && !xpAwardedRef.current) {
            xpAwardedRef.current = true;
            addPoints({ pointsToAdd: 100, action: "Achat de pièce" });
          }
        } else {
          setError(data.error || "Le paiement n'a pas été confirmé");
        }
      } catch (err: any) {
        console.error("Payment verification error:", err);
        setError(err.message || "Erreur lors de la vérification du paiement");
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId, clearCart]);

  // Loading state
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-greige flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-4"
          >
            <Loader2 className="w-12 h-12 text-mineral animate-spin mx-auto" />
            <p className="font-display text-lg text-carbon tracking-wide">
              VÉRIFICATION DU PAIEMENT...
            </p>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="min-h-screen bg-greige flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center space-y-6"
          >
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <h1 className="font-display text-xl text-carbon tracking-wide mb-2">
                PROBLÈME DE PAIEMENT
              </h1>
              <p className="text-muted-foreground">
                {error || "Une erreur est survenue lors de la vérification de votre paiement."}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => navigate("/checkout")}
                className="bg-mineral hover:bg-mineral-dark text-white"
              >
                Réessayer le paiement
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                Retour à l'accueil
              </Button>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen bg-greige flex flex-col">
      <Header />
      
      <main className="flex-1 py-8 md:py-16 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Success Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", damping: 15 }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-mineral to-mineral-dark flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-display text-2xl md:text-3xl text-carbon tracking-wide mb-2"
            >
              PAIEMENT CONFIRMÉ
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground"
            >
              Merci {order.customerFirstName} ! Votre commande a été validée.
            </motion.p>
          </motion.div>

          {/* Order Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Order Number Header */}
            <div className="bg-gradient-to-r from-mineral to-mineral-dark p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Numéro de commande</p>
                  <p className="font-display text-2xl tracking-wider">{order.orderNumber}</p>
                </div>
                <Package className="w-10 h-10 opacity-80" />
              </div>
            </div>

            {/* Order Summary */}
            <div className="p-6 space-y-6">
              {/* Items */}
              <div>
                <h3 className="font-display text-sm text-carbon tracking-wide mb-3">
                  ARTICLES COMMANDÉS
                </h3>
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 bg-greige/30 rounded-xl p-3">
                      {item.part_image_url ? (
                        <img
                          src={item.part_image_url}
                          alt={item.part_name}
                          className="w-12 h-12 rounded-lg object-contain bg-white p-1"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-xl">
                          🔧
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-carbon truncate">{item.part_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Qté: {item.quantity} × {formatPrice(item.unit_price)}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-carbon">
                        {formatPrice(item.unit_price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery */}
              <div className="flex items-center justify-between py-3 border-t border-greige/50">
                <span className="text-sm text-muted-foreground">
                  Livraison ({order.deliveryMethod === "express" ? "Express" : order.deliveryMethod === "relay" ? "Point Relais" : "Standard"})
                </span>
                <span className="text-sm font-medium text-carbon">
                  {formatPrice(order.deliveryPrice)}
                </span>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between pt-3 border-t-2 border-mineral/20">
                <span className="font-display text-lg text-carbon">TOTAL PAYÉ</span>
                <span className="font-display text-2xl text-mineral">{formatPrice(order.totalTTC)}</span>
              </div>

              {/* Email Confirmation */}
              <div className="bg-mineral/5 rounded-xl p-4 flex items-start gap-3">
                <Mail className="w-5 h-5 text-mineral mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-carbon">Confirmation envoyée</p>
                  <p className="text-xs text-muted-foreground">
                    Un email de confirmation a été envoyé à {order.customerEmail}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-greige/50 p-6 flex flex-col sm:flex-row gap-3">
              <Button
                asChild
                className="flex-1 bg-mineral hover:bg-mineral-dark text-white font-display tracking-wide"
              >
                <Link to="/catalogue">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  CONTINUER MES ACHATS
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="flex-1 font-display tracking-wide"
              >
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  ACCUEIL
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Trust Badge */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center text-xs text-muted-foreground mt-6"
          >
            Paiement sécurisé par Stripe · Vos données sont protégées
          </motion.p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentSuccessPage;
