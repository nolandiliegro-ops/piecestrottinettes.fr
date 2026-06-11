import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, MapPin, User, CreditCard, Loader2, Truck, MessageSquare, Gem, Lock, Tag, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatPrice } from "@/lib/formatPrice";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  originalPrice: number;
}

const BASE_DELIVERY_OPTIONS = [
  { id: "standard" as DeliveryMethod, name: "Livraison Standard", delay: "5-7 jours ouvrés", price: 4.90 },
  { id: "express" as DeliveryMethod, name: "Livraison Express", delay: "2-3 jours ouvrés", price: 9.90 },
  { id: "relay" as DeliveryMethod, name: "Point Relais", delay: "4-6 jours ouvrés", price: 3.90 },
];

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deliveryMethod: DeliveryMethod, deliveryPrice: number, recommendations: string, promoCode?: string) => void;
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
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<{ code: string; discount_type: string; discount_value: number } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number | null>(null);

  // Fetch free shipping threshold
  useEffect(() => {
    supabase
      .from("site_assets")
      .select("asset_url")
      .eq("asset_key", "shipping_free_threshold")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.asset_url) {
          const val = parseFloat(data.asset_url);
          if (!isNaN(val) && val > 0) setFreeShippingThreshold(val);
        }
      });
  }, []);

  const isFreeShippingByThreshold = freeShippingThreshold !== null && totals.subtotalHT >= freeShippingThreshold;
  const isFreeShippingByPromo = promoApplied?.discount_type === "shipping";

  // Build delivery options with dynamic pricing
  const deliveryOptions: DeliveryOption[] = BASE_DELIVERY_OPTIONS.map(opt => ({
    ...opt,
    originalPrice: opt.price,
    price: (isFreeShippingByThreshold || isFreeShippingByPromo) ? 0 : opt.price,
  }));

  const selectedDelivery = deliveryOptions.find((d) => d.id === deliveryMethod)!;
  const finalTotalTTC = totals.totalTTC + selectedDelivery.price;
  const finalLoyaltyPoints = Math.floor(finalTotalTTC);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError("");

    try {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("code, discount_type, discount_value, active, max_uses, current_uses, expires_at")
        .eq("code", promoCode.toUpperCase().trim())
        .eq("active", true)
        .maybeSingle();

      if (error || !data) {
        setPromoError("Code promo invalide");
        setPromoApplied(null);
        return;
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setPromoError("Ce code promo a expiré");
        setPromoApplied(null);
        return;
      }

      if (data.max_uses !== null && data.current_uses >= data.max_uses) {
        setPromoError("Ce code promo n'est plus disponible");
        setPromoApplied(null);
        return;
      }

      setPromoApplied({
        code: data.code,
        discount_type: data.discount_type,
        discount_value: Number(data.discount_value),
      });
      setPromoError("");
    } catch {
      setPromoError("Erreur de validation");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoApplied(null);
    setPromoCode("");
    setPromoError("");
  };

  const handleConfirm = () => {
    onConfirm(deliveryMethod, selectedDelivery.price, recommendations, promoApplied?.code);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-carbon/60 backdrop-blur-sm"
          onClick={isSubmitting ? undefined : onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full md:max-w-xl flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
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
              <button onClick={onClose} disabled={isSubmitting} className="p-2 rounded-full hover:bg-greige/50 transition-colors disabled:opacity-50">
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
                  <p className="font-medium text-carbon text-sm">{formData.firstName} {formData.lastName}</p>
                  <p className="text-xs text-muted-foreground">{formData.email}</p>
                  {formData.phone && <p className="text-xs text-muted-foreground">{formData.phone}</p>}
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
                  <p className="text-sm text-carbon">{formData.postalCode} {formData.city}</p>
                </div>
              </div>

              {/* Delivery Method */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-carbon">
                  <Truck className="w-4 h-4 text-mineral" />
                  <span>Mode de livraison</span>
                </div>
                {/* Free shipping banner */}
                {isFreeShippingByThreshold && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-700 font-medium flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5" />
                    🎉 Livraison gratuite dès {freeShippingThreshold}€ — Appliquée !
                  </div>
                )}
                <RadioGroup value={deliveryMethod} onValueChange={(v) => setDeliveryMethod(v as DeliveryMethod)} className="space-y-2">
                  {deliveryOptions.map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        deliveryMethod === option.id ? "border-mineral bg-mineral/5" : "border-greige/50 hover:border-greige"
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
                        {option.price === 0 ? (
                          <span className="flex items-center gap-1">
                            {option.originalPrice > 0 && (
                              <span className="line-through text-muted-foreground text-xs">{formatPrice(option.originalPrice)}</span>
                            )}
                            <span className="text-emerald-600">GRATUIT</span>
                          </span>
                        ) : formatPrice(option.price)}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              {/* Promo Code */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-carbon">
                  <Tag className="w-4 h-4 text-mineral" />
                  <span>Code promo</span>
                </div>
                {promoApplied ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-700">{promoApplied.code}</span>
                      <span className="text-xs text-emerald-600">
                        {promoApplied.discount_type === "shipping" && "— Livraison gratuite"}
                        {promoApplied.discount_type === "percent" && `— -${promoApplied.discount_value}%`}
                        {promoApplied.discount_type === "fixed" && `— -${formatPrice(promoApplied.discount_value)}`}
                      </span>
                    </div>
                    <button onClick={handleRemovePromo} className="text-xs text-red-500 hover:underline">Retirer</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Entrez votre code"
                      className="flex-1 text-sm h-9 uppercase"
                      onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleApplyPromo}
                      disabled={promoLoading || !promoCode.trim()}
                      className="h-9 px-4 text-xs border-mineral text-mineral hover:bg-mineral/5"
                    >
                      {promoLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Appliquer"}
                    </Button>
                  </div>
                )}
                {promoError && <p className="text-xs text-red-500">{promoError}</p>}
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
                        <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded-lg object-contain bg-white p-1" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-lg">🔧</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-carbon truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Qté: {item.quantity} × {formatPrice(item.price)}</p>
                      </div>
                      <span className="text-xs font-medium text-carbon">{formatPrice(item.price * item.quantity)}</span>
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
                <p className="text-xs text-muted-foreground text-right">{recommendations.length}/500</p>
              </div>

              {/* Totals */}
              <div className="border-t border-greige/50 pt-4 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span className="text-carbon">{formatPrice(totals.subtotalHT)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Livraison ({selectedDelivery.name})</span>
                  <span className="text-carbon">
                    {selectedDelivery.price === 0 ? (
                      <span className="text-emerald-600 font-medium">GRATUIT</span>
                    ) : formatPrice(selectedDelivery.price)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-greige/50">
                  <span className="font-display text-base text-carbon">TOTAL</span>
                  <span className="font-display text-xl text-mineral tracking-wide">{formatPrice(finalTotalTTC)}</span>
                </div>
                <p className="text-xs text-muted-foreground text-right">TVA non applicable, art. 293 B du CGI</p>
                <div className="flex items-center justify-end gap-2 text-xs text-mineral">
                  <Gem className="w-3.5 h-3.5" />
                  <span>+{finalLoyaltyPoints} points fidélité</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-greige/50 p-4 md:p-6 bg-white rounded-b-2xl">
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="flex-1 h-11 font-display tracking-wide rounded-xl border-carbon/20">
                  MODIFIER
                </Button>
                <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button onClick={handleConfirm} disabled={isSubmitting} className="w-full h-12 bg-mineral hover:bg-mineral-dark text-white font-display tracking-wide rounded-xl">
                    {isSubmitting ? (
                      <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />REDIRECTION...</span>
                    ) : (
                      <span className="flex items-center gap-2"><Lock className="w-4 h-4" />PAYER MAINTENANT</span>
                    )}
                  </Button>
                </motion.div>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-3">🔒 Paiement sécurisé par Stripe</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OrderConfirmationModal;
