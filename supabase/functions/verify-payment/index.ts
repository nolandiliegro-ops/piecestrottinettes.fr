import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Get session_id from request
    const { session_id } = await req.json();

    if (!session_id) {
      throw new Error("session_id is required");
    }

    // Retrieve Stripe session with expanded data
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["payment_intent", "customer"],
    });

    console.log(`Verifying payment for session: ${session_id}, status: ${session.payment_status}`);

    // Get order from metadata
    const orderId = session.metadata?.order_id;
    const orderNumber = session.metadata?.order_number;

    if (!orderId) {
      throw new Error("Order ID not found in session metadata");
    }

    // Fetch current order status
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // If already paid, return order details
    if (order.status === "paid") {
      console.log(`Order ${orderNumber} already processed with status: ${order.status}`);
      return new Response(
        JSON.stringify({
          success: true,
          order: {
            orderNumber: order.order_number,
            status: order.status,
            totalTTC: order.total_ttc,
            customerEmail: order.customer_email,
            customerFirstName: order.customer_first_name,
            customerLastName: order.customer_last_name,
            deliveryMethod: order.delivery_method,
            deliveryPrice: order.delivery_price,
            items: order.order_items,
            paidAt: order.paid_at,
          },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Check if payment is successful
    if (session.payment_status === "paid") {
      const paymentIntent = session.payment_intent as Stripe.PaymentIntent;
      
      // Update order to paid status
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: "paid",
          stripe_payment_intent_id: paymentIntent?.id || null,
          paid_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (updateError) {
        console.error(`Failed to update order ${orderId}:`, updateError);
        throw new Error("Failed to update order status");
      }

      console.log(`Order ${orderNumber} marked as paid`);

      // Send confirmation email (non-blocking)
      const emailPayload = {
        orderNumber: order.order_number,
        customerEmail: order.customer_email,
        customerName: `${order.customer_first_name} ${order.customer_last_name}`,
        items: order.order_items.map((item: any) => ({
          name: item.part_name,
          quantity: item.quantity,
          price: item.unit_price,
          imageUrl: item.part_image_url,
        })),
        totals: {
          subtotalHT: order.subtotal_ht,
          tva: order.tva_amount,
          totalTTC: order.total_ttc,
          deliveryPrice: order.delivery_price,
        },
        address: {
          street: order.address,
          postalCode: order.postal_code,
          city: order.city,
        },
        deliveryMethod: order.delivery_method,
      };

      // Fire and forget email
      fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify(emailPayload),
      }).catch(err => {
        console.error("Failed to send confirmation email:", err);
      });

      return new Response(
        JSON.stringify({
          success: true,
          order: {
            orderNumber: order.order_number,
            status: "paid",
            totalTTC: order.total_ttc,
            customerEmail: order.customer_email,
            customerFirstName: order.customer_first_name,
            customerLastName: order.customer_last_name,
            deliveryMethod: order.delivery_method,
            deliveryPrice: order.delivery_price,
            items: order.order_items,
            paidAt: new Date().toISOString(),
          },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Payment not completed
    return new Response(
      JSON.stringify({
        success: false,
        error: "Payment not completed",
        paymentStatus: session.payment_status,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Payment verification error:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
