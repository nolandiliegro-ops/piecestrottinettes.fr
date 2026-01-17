import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, CreditCard, Package } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Zod Validation Schema
const checkoutSchema = z.object({
  firstName: z.string().trim().min(2, "Prénom requis (min 2 caractères)"),
  lastName: z.string().trim().min(2, "Nom requis (min 2 caractères)"),
  email: z.string().trim().email("Email invalide"),
  phone: z.string().optional(),
  address: z.string().trim().min(5, "Adresse requise (min 5 caractères)"),
  postalCode: z.string().trim().regex(/^\d{5}$/, "Code postal invalide (5 chiffres)"),
  city: z.string().trim().min(2, "Ville requise (min 2 caractères)"),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

const CheckoutPage = () => {
  const { items, totals, clearCart } = useCart();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    },
  });

  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    // Generate order number
    const orderNumber = `PT-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    // Clear cart BEFORE redirect
    clearCart();
    
    // Navigate to success with order number
    navigate('/order-success', { state: { orderNumber } });
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
                        {isSubmitting ? (
                              <span className="animate-pulse">TRAITEMENT...</span>
                            ) : (
                              <>
                                <Lock className="w-4 h-4" />
                                PROCÉDER AU PAIEMENT
                              </>
                            )}
                          </span>
                        </Button>
                      </motion.div>
                      {/* Reassurance message */}
                      <p className="text-xs text-center text-muted-foreground mt-3 italic font-light">
                        Vous allez être redirigé vers notre interface de paiement sécurisée
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
                        {isSubmitting ? (
                          <span className="animate-pulse">TRAITEMENT...</span>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            PROCÉDER AU PAIEMENT
                          </>
                        )}
                      </span>
                    </Button>
                  </motion.div>
                  {/* Reassurance message */}
                  <p className="text-xs text-center text-muted-foreground mt-3 italic font-light">
                    Vous allez être redirigé vers notre interface de paiement sécurisée
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
