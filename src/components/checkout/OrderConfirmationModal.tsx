import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, MapPin, User, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/formatPrice";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
}

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address: string;
    postalCode: string;
    city: string;
  };
  items: CartItem[];
  totals: {
    subtotalHT: number;
    tva: number;
    totalTTC: number;
    loyaltyPoints: number;
  };
}

const OrderConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  formData,
  items,
  totals,
}: OrderConfirmationModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-carbon/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl z-50 mx-4"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-greige/50 p-6 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-mineral/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-mineral" />
                </div>
                <div>
                  <h2 className="font-display text-xl text-carbon tracking-wide">
                    CONFIRMER LA COMMANDE
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Vérifiez les informations avant de valider
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2 rounded-full hover:bg-greige/50 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-carbon" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-carbon">
                  <User className="w-4 h-4 text-mineral" />
                  <span>Informations client</span>
                </div>
                <div className="bg-greige/30 rounded-xl p-4 space-y-1">
                  <p className="font-medium text-carbon">
                    {formData.firstName} {formData.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{formData.email}</p>
                  {formData.phone && (
                    <p className="text-sm text-muted-foreground">{formData.phone}</p>
                  )}
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-carbon">
                  <MapPin className="w-4 h-4 text-mineral" />
                  <span>Adresse de livraison</span>
                </div>
                <div className="bg-greige/30 rounded-xl p-4">
                  <p className="text-carbon">{formData.address}</p>
                  <p className="text-carbon">
                    {formData.postalCode} {formData.city}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-carbon">
                  <ShoppingBag className="w-4 h-4 text-mineral" />
                  <span>Articles ({items.length})</span>
                </div>
                <div className="bg-greige/30 rounded-xl p-4 space-y-3 max-h-40 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-contain bg-white p-1"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-xl">
                          🔧
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-carbon truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Qté: {item.quantity} × {formatPrice(item.price)}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-carbon">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-greige/50 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total HT</span>
                  <span className="text-carbon">{formatPrice(totals.subtotalHT)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">TVA (20%)</span>
                  <span className="text-carbon">{formatPrice(totals.tva)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-greige/50">
                  <span className="font-display text-lg text-carbon">TOTAL TTC</span>
                  <span className="font-display text-2xl text-mineral tracking-wide">
                    {formatPrice(totals.totalTTC)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 h-12 font-display tracking-wide rounded-xl border-carbon/20"
                >
                  MODIFIER
                </Button>
                <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={onConfirm}
                    disabled={isSubmitting}
                    className="w-full h-12 bg-mineral hover:bg-mineral-dark text-white font-display tracking-wide rounded-xl"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        TRAITEMENT...
                      </span>
                    ) : (
                      "CONFIRMER"
                    )}
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OrderConfirmationModal;
