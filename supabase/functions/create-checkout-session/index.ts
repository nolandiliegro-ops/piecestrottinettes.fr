import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CartItem {
  id: string;
  quantity: number;
}

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address: string;
  postalCode: string;
  city: string;
}

interface CheckoutRequest {
  items: CartItem[];
  customerInfo: CustomerInfo;
  deliveryMethod: "standard" | "express" | "relay";
  notes?: string;
  promoCode?: string;
}

// Default delivery pricing (used as fallback)
const DEFAULT_DELIVERY_PRICES: Record<string, number> = {
  standard: 4.90,
  express: 9.90,
  relay: 3.90,
};

interface PromoResult {
  valid: boolean;
  discount_type?: string;
  discount_value?: number;
  code?: string;
}

async function validatePromoCode(supabase: any, code: string): Promise<PromoResult> {
  const { data, error } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("code", code.toUpperCase().trim())
    .eq("active", true)
    .single();

  if (error || !data) return { valid: false };

  // Check expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false };
  }

  // Check max uses
  if (data.max_uses !== null && data.current_uses >= data.max_uses) {
    return { valid: false };
  }

  return {
    valid: true,
    discount_type: data.discount_type,
    discount_value: data.discount_value,
    code: data.code,
  };
}

async function getFreeShippingThreshold(supabase: any): Promise<number | null> {
  const { data } = await supabase
    .from("site_assets")
    .select("asset_url")
    .eq("asset_key", "shipping_free_threshold")
    .maybeSingle();

  if (data?.asset_url) {
    const val = parseFloat(data.asset_url);
    if (!isNaN(val) && val > 0) return val;
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const { items, customerInfo, deliveryMethod, notes, promoCode }: CheckoutRequest = await req.json();

    if (!items || items.length === 0) throw new Error("Le panier est vide");

    let deliveryPrice = DEFAULT_DELIVERY_PRICES[deliveryMethod];
    if (deliveryPrice === undefined) throw new Error("Mode de livraison invalide");

    // Fetch parts from database
    const partIds = items.map(item => item.id);
    const { data: parts, error: partsError } = await supabase
      .from("parts")
      .select("id, name, price, stock_quantity, image_url")
      .in("id", partIds);

    if (partsError) throw new Error(`Erreur récupération produits: ${partsError.message}`);
    if (!parts || parts.length !== items.length) throw new Error("Certains produits n'existent pas");

    // Calculate subtotal and validate stock
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let subtotalHT = 0;

    for (const cartItem of items) {
      const part = parts.find(p => p.id === cartItem.id);
      if (!part) throw new Error(`Produit introuvable: ${cartItem.id}`);
      if (part.stock_quantity !== null && part.stock_quantity < cartItem.quantity) {
        throw new Error(`Stock insuffisant pour ${part.name}`);
      }
      if (!part.price) throw new Error(`Prix non défini pour ${part.name}`);

      subtotalHT += part.price * cartItem.quantity;

      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: part.name,
            images: part.image_url ? [part.image_url] : [],
          },
          unit_amount: Math.round(part.price * 100),
        },
        quantity: cartItem.quantity,
      });
    }

    // Check free shipping threshold
    const freeShippingThreshold = await getFreeShippingThreshold(supabase);
    if (freeShippingThreshold !== null && subtotalHT >= freeShippingThreshold) {
      deliveryPrice = 0;
    }

    // Validate promo code
    let appliedPromoCode: string | null = null;
    if (promoCode) {
      const promo = await validatePromoCode(supabase, promoCode);
      if (promo.valid) {
        appliedPromoCode = promo.code!;
        if (promo.discount_type === "shipping") {
          deliveryPrice = 0;
        } else if (promo.discount_type === "percent") {
          const discount = subtotalHT * (promo.discount_value! / 100);
          subtotalHT -= discount;
        } else if (promo.discount_type === "fixed") {
          subtotalHT = Math.max(0, subtotalHT - promo.discount_value!);
        }

        // Increment promo usage
        const { data: currentPromo } = await supabase
          .from("promo_codes")
          .select("current_uses")
          .eq("code", promo.code)
          .single();
        if (currentPromo) {
          await supabase
            .from("promo_codes")
            .update({ current_uses: (currentPromo.current_uses || 0) + 1 })
            .eq("code", promo.code);
        }
      }
    }

    // Add delivery line item (even if 0€ to show it)
    if (deliveryPrice > 0) {
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: `Livraison ${deliveryMethod === "express" ? "Express" : deliveryMethod === "relay" ? "Point Relais" : "Standard"}`,
          },
          unit_amount: Math.round(deliveryPrice * 100),
        },
        quantity: 1,
      });
    }

    // Calculate totals
    const tvaAmount = 0; // Franchise en base de TVA (art. 293 B CGI) — aucune TVA facturée
    const totalTTC = subtotalHT + deliveryPrice;
    const loyaltyPoints = Math.floor(totalTTC);

    // Stripe minimum charge guard (0.50 EUR). Triggered mainly when a promo
    // reduces the cart below the threshold. Fail fast before creating the order.
    if (totalTTC < 0.5) {
      console.warn(
        `[checkout] Aborted: totalTTC=${totalTTC.toFixed(2)}€ below Stripe minimum (0.50€). promoCode=${appliedPromoCode ?? "none"} subtotalHT=${subtotalHT.toFixed(2)} delivery=${deliveryPrice.toFixed(2)}`
      );
      return new Response(
        JSON.stringify({
          error: "AMOUNT_TOO_SMALL",
          message: "Le montant après application du code promo est inférieur au minimum Stripe de 0,50 €. Ajoutez un produit ou retirez le code promo.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const orderNumber = `PT-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Get user ID
    let userId = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabase.auth.getUser(token);
      userId = userData?.user?.id || null;
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: userId,
        customer_first_name: customerInfo.firstName,
        customer_last_name: customerInfo.lastName,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone || null,
        address: customerInfo.address,
        postal_code: customerInfo.postalCode,
        city: customerInfo.city,
        subtotal_ht: subtotalHT,
        tva_amount: tvaAmount,
        total_ttc: totalTTC,
        loyalty_points_earned: loyaltyPoints,
        status: "awaiting_payment",
        delivery_method: deliveryMethod,
        delivery_price: deliveryPrice,
        notes: notes || null,
        promo_code: appliedPromoCode,
      })
      .select()
      .single();

    if (orderError) throw new Error(`Erreur création commande: ${orderError.message}`);

    // Create order items
    const orderItems = items.map(cartItem => {
      const part = parts.find(p => p.id === cartItem.id)!;
      return {
        order_id: order.id,
        part_id: cartItem.id,
        part_name: part.name,
        part_image_url: part.image_url,
        unit_price: part.price,
        quantity: cartItem.quantity,
        line_total: part.price! * cartItem.quantity,
      };
    });

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
    if (itemsError) {
      await supabase.from("orders").delete().eq("id", order.id);
      throw new Error(`Erreur création articles: ${itemsError.message}`);
    }

    // Stripe customer
    let customerId: string | undefined;
    const customers = await stripe.customers.list({ email: customerInfo.email, limit: 1 });
    if (customers.data.length > 0) customerId = customers.data[0].id;

    // Create Stripe session
    const origin = req.headers.get("origin") || "https://piecestrottinettes.fr";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customerInfo.email,
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?canceled=true`,
      metadata: { order_id: order.id, order_number: orderNumber },
      payment_intent_data: {
        metadata: { order_id: order.id, order_number: orderNumber },
      },
      locale: "fr",
      billing_address_collection: "required",
      shipping_address_collection: {
        allowed_countries: ["FR", "BE", "CH", "LU", "MC"],
      },
    });

    await supabase
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order.id);

    console.log(`Checkout session created: ${session.id} for order ${orderNumber}`);

    return new Response(
      JSON.stringify({ sessionUrl: session.url, orderNumber }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Checkout session error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
