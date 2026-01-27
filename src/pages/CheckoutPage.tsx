import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, CreditCard, Package, FileText, Loader2, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/formatPrice";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OrderConfirmationModal from "@/components/checkout/OrderConfirmationModal";

// Zod Validation Schema - Updated with CGV
const checkoutSchema = z.object({
  firstName: z.string().trim().min(2, "Prénom requis (min 2 caractères)"),
  lastName: z.string().trim().min(2, "Nom requis (min 2 caractères)"),
  email: z.string().trim().email("Email invalide"),
  phone: z.string().optional(),
  address: z.string().trim().min(5, "Adresse requise (min 5 caractères)"),
  postalCode: z.string().trim().regex(/^\d{5}$/, "Code postal invalide (5 chiffres)"),
  city: z.string().trim().min(2, "Ville requise (min 2 caractères)"),
  acceptCGV: z.boolean().refine(val => val === true, {
    message: "Vous devez accepter les conditions générales de vente",
  }),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

const CheckoutPage = () => {
  const { items, totals, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<CheckoutFormData | null>(null);
  const isEmpty = items.length === 0;

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      postalCode: "",
      city: "",
      acceptCGV: false,
    },
  });

  // Pre-fill form from user profile
  useEffect(() => {
    const prefillUserData = async () => {
      if (!user) return;

      // Pre-fill email from auth
      form.setValue("email", user.email || "");

      // Try to get display_name from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();

      if (profile?.display_name) {
        // Try to split display_name into first/last name
        const nameParts = profile.display_name.trim().split(" ");
        if (nameParts.length >= 2) {
          form.setValue("firstName", nameParts[0]);
          form.setValue("lastName", nameParts.slice(1).join(" "));
        } else if (nameParts.length === 1) {
          form.setValue("firstName", nameParts[0]);
        }
      }

      // Check user metadata for name
      const metadata = user.user_metadata;
      if (metadata) {
        if (metadata.full_name) {
          const nameParts = metadata.full_name.trim().split(" ");
          if (nameParts.length >= 2) {
            form.setValue("firstName", nameParts[0]);
            form.setValue("lastName", nameParts.slice(1).join(" "));
          }
        }
        if (metadata.first_name) form.setValue("firstName", metadata.first_name);
        if (metadata.last_name) form.setValue("lastName", metadata.last_name);
      }
    };

    prefillUserData();
  }, [user, form]);

  // Open confirmation modal instead of direct submit
  const onSubmit = async (data: CheckoutFormData) => {
    setPendingFormData(data);
    setShowConfirmModal(true);
  };

  // Actual order submission with delivery info
  const handleConfirmOrder = async (deliveryMethod: string, deliveryPrice: number, recommendations: string) => {
    if (!pendingFormData) return;
    
    setIsSubmitting(true);
    const data = pendingFormData;
    
    try {
      // Generate order number
      const orderNumber = `PT-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      // Calculate final totals with delivery
      const finalTotalTTC = totals.totalTTC + deliveryPrice;
      const finalLoyaltyPoints = Math.floor(finalTotalTTC);
      
      // 1. Create the order in database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          user_id: user?.id || null,
          customer_first_name: data.firstName,
          customer_last_name: data.lastName,
          customer_email: data.email,
          customer_phone: data.phone || null,
          address: data.address,
          postal_code: data.postalCode,
          city: data.city,
          subtotal_ht: totals.subtotalHT,
          tva_amount: totals.tva,
          total_ttc: finalTotalTTC,
          loyalty_points_earned: finalLoyaltyPoints,
          status: 'pending'
        })
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // 2. Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        part_id: item.id,
        part_name: item.name,
        part_image_url: item.image_url,
        unit_price: item.price,
        quantity: item.quantity,
        line_total: item.price * item.quantity
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) throw itemsError;
      
      // 3. Show success toast with order number
      toast.success(
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-mineral/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-mineral" />
          </div>
          <div>
            <p className="font-display text-carbon tracking-wide">COMMANDE CONFIRMÉE</p>
            <p className="text-sm text-muted-foreground">N° {orderNumber}</p>
          </div>
        </div>,
        {
          duration: 5000,
        }
      );
      
      // 4. Send confirmation email (non-blocking)
      const emailPayload = {
        orderNumber,
        customerEmail: data.email,
        customerName: `${data.firstName} ${data.lastName}`,
        items: items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          imageUrl: item.image_url
        })),
        totals: {
          subtotalHT: totals.subtotalHT,
          tva: totals.tva,
          totalTTC: finalTotalTTC,
          deliveryPrice
        },
        address: {
          street: data.address,
          postalCode: data.postalCode,
          city: data.city
        },
        deliveryMethod
      };
      
      // Fire and forget - don't await
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-order-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify(emailPayload)
      }).then(res => {
        if (res.ok) {
          console.log('Order confirmation email sent successfully');
        } else {
          console.error('Failed to send order confirmation email');
        }
      }).catch(err => {
        console.error('Error sending order confirmation email:', err);
      });
      
      // 5. Clear cart and redirect with order details
      clearCart();
      setShowConfirmModal(false);
      navigate('/order-success', { 
        state: { 
          orderNumber,
          customerEmail: data.email,
          customerFirstName: data.firstName,
          customerLastName: data.lastName,
          deliveryMethod,
          deliveryPrice,
          recommendations,
          totalTTC: finalTotalTTC
        } 
      });
      
    } catch (error) {
      console.error('Order error:', error);
      toast.error('Erreur lors de la commande', {
        description: 'Veuillez réessayer ou nous contacter.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect if cart is empty
  if (isEmpty) {
    return (
      <div className="min-h-screen bg-greige">
        <Header />
        <main className="pt-24 pb-16 px-4">
          <div className="max-w-2xl mx-auto text-center py-20">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
            <h1 className="font-display text-2xl text-carbon mb-4">
              Votre panier est vide
            </h1>
            <p className="text-muted-foreground mb-8">
              Ajoutez des pièces à votre panier pour passer commande.
            </p>
            <Button asChild className="bg-carbon hover:bg-carbon/90">
              <Link to="/catalogue">Voir le catalogue</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-greige">
      <Header />
      
      {/* Confirmation Modal */}
      {pendingFormData && (
        <OrderConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmOrder}
          isSubmitting={isSubmitting}
          formData={{
            firstName: pendingFormData.firstName,
            lastName: pendingFormData.lastName,
            email: pendingFormData.email,
            phone: pendingFormData.phone,
            address: pendingFormData.address,
            postalCode: pendingFormData.postalCode,
            city: pendingFormData.city,
          }}
          items={items}
          totals={totals}
        />
      )}
      
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Back Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Link 
              to="/panier" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-carbon transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Retour au panier</span>
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
              <CreditCard className="w-7 h-7 text-mineral" />
            </div>
            <div>
              <h1 className="font-display text-3xl md:text-4xl text-carbon tracking-wide">
                FINALISER MA COMMANDE
              </h1>
              <p className="text-muted-foreground">
                Remplissez vos informations de livraison
              </p>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/20 p-6 md:p-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Personal Info */}
                    <div>
                      <h3 className="font-display text-lg text-carbon tracking-wide mb-4">
                        INFORMATIONS PERSONNELLES
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-carbon">Prénom *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Jean" 
                                  autoFocus
                                  className="bg-white/60 border-white/30 focus:border-mineral focus:ring-mineral/20 focus-visible:ring-mineral/20"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-carbon">Nom *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Dupont" 
                                  className="bg-white/60 border-white/30 focus:border-mineral focus:ring-mineral/20 focus-visible:ring-mineral/20"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-carbon">Email *</FormLabel>
                            <FormControl>
                              <Input 
                                type="email"
                                placeholder="jean@exemple.fr" 
                                className="bg-white/60 border-white/30 focus:border-mineral focus:ring-mineral/20 focus-visible:ring-mineral/20"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-carbon">Téléphone</FormLabel>
                            <FormControl>
                              <Input 
                                type="tel"
                                placeholder="06 12 34 56 78" 
                                className="bg-white/60 border-white/30 focus:border-mineral focus:ring-mineral/20 focus-visible:ring-mineral/20"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Delivery Address */}
                    <div>
                      <h3 className="font-display text-lg text-carbon tracking-wide mb-4">
                        ADRESSE DE LIVRAISON
                      </h3>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-carbon">Adresse *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="123 Rue de la Trottinette" 
                                  className="bg-white/60 border-white/30 focus:border-mineral focus:ring-mineral/20 focus-visible:ring-mineral/20"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="postalCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-carbon">Code postal *</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="75001" 
                                    maxLength={5}
                                    className="bg-white/60 border-white/30 focus:border-mineral focus:ring-mineral/20 focus-visible:ring-mineral/20"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-carbon">Ville *</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Paris" 
                                    className="bg-white/60 border-white/30 focus:border-mineral focus:ring-mineral/20 focus-visible:ring-mineral/20"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    {/* CGV Checkbox */}
                    <div className="border-t border-greige/50 pt-6">
                      <FormField
                        control={form.control}
                        name="acceptCGV"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="mt-1 data-[state=checked]:bg-mineral data-[state=checked]:border-mineral"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm text-carbon cursor-pointer">
                                J'accepte les{" "}
                                <Link 
                                  to="/cgv" 
                                  target="_blank"
                                  className="text-mineral hover:underline inline-flex items-center gap-1"
                                >
                                  <FileText className="w-3 h-3" />
                                  conditions générales de vente
                                </Link>
                                {" "}*
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Submit Button - Mobile */}
                    <div className="lg:hidden">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="relative w-full h-14 bg-carbon text-white font-display text-lg tracking-widest rounded-xl overflow-hidden group transition-all duration-300 disabled:opacity-50"
                        >
                          <span className="absolute inset-0 bg-gradient-to-r from-mineral/0 via-mineral/30 to-mineral/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            <Lock className="w-4 h-4" />
                            VÉRIFIER MA COMMANDE
                          </span>
                        </Button>
                      </motion.div>
                      {/* Reassurance message */}
                      <p className="text-xs text-center text-muted-foreground mt-3 italic font-light">
                        Vous pourrez vérifier votre commande avant validation
                      </p>
                    </div>
                  </form>
                </Form>
              </div>
            </motion.div>

            {/* Order Summary - Sticky on Desktop */}
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

                {/* Items */}
                <div className="space-y-3 max-h-[200px] overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate max-w-[180px]">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="text-carbon font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="h-px bg-mineral/15" />

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
                  <div className="h-px bg-mineral/15 my-2" />
                  <div className="flex justify-between items-baseline">
                    <span className="font-display text-lg text-carbon">TOTAL TTC</span>
                    <span className="font-display text-3xl text-mineral tracking-wide">
                      {formatPrice(totals.totalTTC)}
                    </span>
                  </div>
                </div>

                {/* Submit Button - Desktop */}
                <div className="hidden lg:block">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      onClick={form.handleSubmit(onSubmit)}
                      className="relative w-full h-14 bg-carbon text-white font-display text-lg tracking-widest rounded-xl overflow-hidden group transition-all duration-300 disabled:opacity-50"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-mineral/0 via-mineral/30 to-mineral/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <Lock className="w-4 h-4" />
                        VÉRIFIER MA COMMANDE
                      </span>
                    </Button>
                  </motion.div>
                  {/* Reassurance message */}
                  <p className="text-xs text-center text-muted-foreground mt-3 italic font-light">
                    Vous pourrez vérifier votre commande avant validation
                  </p>
                </div>

                {/* Security badge */}
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  <span>Vos données sont sécurisées</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CheckoutPage;
