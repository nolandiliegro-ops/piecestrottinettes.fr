import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Delivery pricing (must match frontend)
const DELIVERY_PRICES: Record<string, number> = {
  standard: 4.90,
  express: 9.90,
  relay: 3.90,
};

const TVA_RATE = 0.20;

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
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Parse request body
    const { items, customerInfo, deliveryMethod, notes }: CheckoutRequest = await req.json();

    if (!items || items.length === 0) {
      throw new Error("Le panier est vide");
    }

    // Validate delivery method
    const deliveryPrice = DELIVERY_PRICES[deliveryMethod];
    if (deliveryPrice === undefined) {
      throw new Error("Mode de livraison invalide");
    }

    // Fetch parts from database to validate prices (anti-fraud)
    const partIds = items.map(item => item.id);
    const { data: parts, error: partsError } = await supabase
      .from("parts")
      .select("id, name, price, stock_quantity, image_url")
      .in("id", partIds);

    if (partsError) {
      throw new Error(`Erreur lors de la récupération des produits: ${partsError.message}`);
    }

    if (!parts || parts.length !== items.length) {
      throw new Error("Certains produits n'existent pas");
    }

    // Validate stock and build line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let subtotalHT = 0;

    for (const cartItem of items) {
      const part = parts.find(p => p.id === cartItem.id);
      if (!part) {
        throw new Error(`Produit introuvable: ${cartItem.id}`);
      }
      if (part.stock_quantity !== null && part.stock_quantity < cartItem.quantity) {
        throw new Error(`Stock insuffisant pour ${part.name}`);
      }
      if (!part.price) {
        throw new Error(`Prix non défini pour ${part.name}`);
      }

      subtotalHT += part.price * cartItem.quantity;

      // Create Stripe line item with price_data (dynamic pricing)
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: part.name,
            images: part.image_url ? [part.image_url] : [],
          },
          unit_amount: Math.round(part.price * 100), // Price in cents (HT)
        },
        quantity: cartItem.quantity,
      });
    }

    // Add delivery as a line item
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

    // Calculate totals
    const tvaAmount = subtotalHT * TVA_RATE;
    const totalTTC = subtotalHT + tvaAmount + deliveryPrice;
    const loyaltyPoints = Math.floor(totalTTC);

    // Generate order number
    const orderNumber = `PT-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Get user ID from auth header if present
    let userId = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabase.auth.getUser(token);
      userId = userData?.user?.id || null;
    }

    // Create order with status "awaiting_payment"
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
      })
      .select()
      .single();

    if (orderError) {
      throw new Error(`Erreur création commande: ${orderError.message}`);
    }

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

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      // Rollback: delete the order
      await supabase.from("orders").delete().eq("id", order.id);
      throw new Error(`Erreur création articles: ${itemsError.message}`);
    }

    // Check if Stripe customer exists
    let customerId: string | undefined;
    const customers = await stripe.customers.list({ 
      email: customerInfo.email, 
      limit: 1 
    });
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create Stripe Checkout session
    const origin = req.headers.get("origin") || "https://piecestrottinettes.fr";
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customerInfo.email,
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?canceled=true`,
      metadata: {
        order_id: order.id,
        order_number: orderNumber,
      },
      payment_intent_data: {
        metadata: {
          order_id: order.id,
          order_number: orderNumber,
        },
      },
      locale: "fr",
      billing_address_collection: "required",
      shipping_address_collection: {
        allowed_countries: ["FR", "BE", "CH", "LU", "MC"],
      },
    });

    // Update order with Stripe session ID
    await supabase
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order.id);

    console.log(`Checkout session created: ${session.id} for order ${orderNumber}`);

    return new Response(
      JSON.stringify({ 
        sessionUrl: session.url,
        orderNumber: orderNumber,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Checkout session error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
