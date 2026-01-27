import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, MapPin, User, CreditCard, Loader2, Truck, MessageSquare, Gem } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatPrice } from "@/lib/formatPrice";
import { useState } from "react";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
}

type DeliveryMethod = "standard" | "express" | "relay";

interface DeliveryOption {
  id: DeliveryMethod;
  name: string;
  delay: string;
  price: number;
}

const DELIVERY_OPTIONS: DeliveryOption[] = [
  { id: "standard", name: "Livraison Standard", delay: "5-7 jours ouvrés", price: 4.90 },
  { id: "express", name: "Livraison Express", delay: "2-3 jours ouvrés", price: 9.90 },
  { id: "relay", name: "Point Relais", delay: "4-6 jours ouvrés", price: 3.90 },
];

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deliveryMethod: DeliveryMethod, deliveryPrice: number, recommendations: string) => void;
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
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("standard");
  const [recommendations, setRecommendations] = useState("");

  const selectedDelivery = DELIVERY_OPTIONS.find((d) => d.id === deliveryMethod)!;
  const finalTotalTTC = totals.totalTTC + selectedDelivery.price;
  const finalLoyaltyPoints = Math.floor(finalTotalTTC);

  const handleConfirm = () => {
    onConfirm(deliveryMethod, selectedDelivery.price, recommendations);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-carbon/60 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* Modal container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full md:max-w-xl flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Sticky */}
            <div className="shrink-0 bg-white/95 backdrop-blur-sm border-b border-greige/50 p-4 md:p-6 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-mineral/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-mineral" />
                </div>
                <div>
                  <h2 className="font-display text-lg md:text-xl text-carbon tracking-wide">
                    CONFIRMER LA COMMANDE
                  </h2>
                  <p className="text-xs md:text-sm text-muted-foreground">
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

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
              {/* Customer Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-carbon">
                  <User className="w-4 h-4 text-mineral" />
                  <span>Informations client</span>
                </div>
                <div className="bg-greige/30 rounded-xl p-3 space-y-0.5">
                  <p className="font-medium text-carbon text-sm">
                    {formData.firstName} {formData.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{formData.email}</p>
                  {formData.phone && (
                    <p className="text-xs text-muted-foreground">{formData.phone}</p>
                  )}
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-carbon">
                  <MapPin className="w-4 h-4 text-mineral" />
                  <span>Adresse de livraison</span>
                </div>
                <div className="bg-greige/30 rounded-xl p-3">
                  <p className="text-sm text-carbon">{formData.address}</p>
                  <p className="text-sm text-carbon">
                    {formData.postalCode} {formData.city}
                  </p>
                </div>
              </div>

              {/* Delivery Method */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-carbon">
                  <Truck className="w-4 h-4 text-mineral" />
                  <span>Mode de livraison</span>
                </div>
                <RadioGroup
                  value={deliveryMethod}
                  onValueChange={(v) => setDeliveryMethod(v as DeliveryMethod)}
                  className="space-y-2"
                >
                  {DELIVERY_OPTIONS.map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        deliveryMethod === option.id
                          ? "border-mineral bg-mineral/5"
                          : "border-greige/50 hover:border-greige"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={option.id} className="text-mineral" />
                        <div>
                          <p className="text-sm font-medium text-carbon">{option.name}</p>
                          <p className="text-xs text-muted-foreground">{option.delay}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-mineral">
                        {formatPrice(option.price)}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              {/* Order Items */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-carbon">
                  <ShoppingBag className="w-4 h-4 text-mineral" />
                  <span>Articles ({items.length})</span>
                </div>
                <div className="bg-greige/30 rounded-xl p-3 space-y-2 max-h-32 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-contain bg-white p-1"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-lg">
                          🔧
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-carbon truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Qté: {item.quantity} × {formatPrice(item.price)}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-carbon">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-carbon">
                  <MessageSquare className="w-4 h-4 text-mineral" />
                  <span>Recommandations spécifiques (optionnel)</span>
                </Label>
                <Textarea
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  placeholder="Instructions de livraison, demandes spéciales..."
                  className="resize-none h-20 text-sm border-greige/50 focus:ring-mineral rounded-xl"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {recommendations.length}/500
                </p>
              </div>

              {/* Totals */}
              <div className="border-t border-greige/50 pt-4 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Sous-total HT</span>
                  <span className="text-carbon">{formatPrice(totals.subtotalHT)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">TVA (20%)</span>
                  <span className="text-carbon">{formatPrice(totals.tva)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Livraison ({selectedDelivery.name})</span>
                  <span className="text-carbon">{formatPrice(selectedDelivery.price)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-greige/50">
                  <span className="font-display text-base text-carbon">TOTAL TTC</span>
                  <span className="font-display text-xl text-mineral tracking-wide">
                    {formatPrice(finalTotalTTC)}
                  </span>
                </div>
                {/* Loyalty Points */}
                <div className="flex items-center justify-end gap-2 text-xs text-mineral">
                  <Gem className="w-3.5 h-3.5" />
                  <span>+{finalLoyaltyPoints} points fidélité</span>
                </div>
              </div>
            </div>

            {/* Footer - Sticky */}
            <div className="shrink-0 border-t border-greige/50 p-4 md:p-6 bg-white rounded-b-2xl">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 h-11 font-display tracking-wide rounded-xl border-carbon/20"
                >
                  MODIFIER
                </Button>
                <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleConfirm}
                    disabled={isSubmitting}
                    className="w-full h-11 bg-mineral hover:bg-mineral-dark text-white font-display tracking-wide rounded-xl"
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
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OrderConfirmationModal;
