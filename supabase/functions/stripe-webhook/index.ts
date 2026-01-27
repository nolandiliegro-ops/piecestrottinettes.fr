import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    console.error("[WEBHOOK] Missing signature or webhook secret");
    return new Response(
      JSON.stringify({ error: "Missing signature or webhook secret" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    console.log(`[WEBHOOK] Received event: ${event.type}`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`[WEBHOOK] Signature verification failed: ${errorMessage}`);
    return new Response(
      JSON.stringify({ error: `Webhook signature verification failed: ${errorMessage}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Handle checkout.session.completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;

    if (!orderId) {
      console.error("[WEBHOOK] No order_id in session metadata");
      return new Response(
        JSON.stringify({ received: true, error: "No order_id in metadata" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[WEBHOOK] Processing order ${orderId}`);

    // Fetch the order
    const { data: order, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      console.error(`[WEBHOOK] Order not found: ${orderId}`, fetchError);
      return new Response(
        JSON.stringify({ received: true, error: "Order not found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Idempotence: skip if already processed
    if (order.status !== "awaiting_payment") {
      console.log(`[WEBHOOK] Order ${orderId} already processed (status: ${order.status})`);
      return new Response(
        JSON.stringify({ received: true, skipped: true, reason: "Already processed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update order status
    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "pending",
        stripe_payment_intent_id: session.payment_intent as string,
        paid_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      console.error(`[WEBHOOK] Failed to update order ${orderId}:`, updateError);
      return new Response(
        JSON.stringify({ received: true, error: "Failed to update order" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[WEBHOOK] Order ${orderId} marked as paid`);

    // Fetch order items for email
    const { data: orderItems } = await supabaseAdmin
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    // Send confirmation email
    try {
      const emailPayload = {
        orderNumber: order.order_number,
        customerEmail: order.customer_email,
        customerName: `${order.customer_first_name} ${order.customer_last_name}`,
        items: (orderItems || []).map((item) => ({
          name: item.part_name,
          quantity: item.quantity,
          price: item.unit_price,
          imageUrl: item.part_image_url,
        })),
        totals: {
          subtotalHT: order.subtotal_ht,
          tva: order.tva_amount,
          totalTTC: order.total_ttc,
          deliveryPrice: order.delivery_price || 0,
        },
        address: {
          street: order.address,
          postalCode: order.postal_code,
          city: order.city,
        },
        deliveryMethod: order.delivery_method || "Standard",
      };

      const emailResponse = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-order-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          },
          body: JSON.stringify(emailPayload),
        }
      );

      if (!emailResponse.ok) {
        console.error(`[WEBHOOK] Email sending failed:`, await emailResponse.text());
      } else {
        console.log(`[WEBHOOK] Confirmation email sent for order ${orderId}`);
      }
    } catch (emailError) {
      console.error(`[WEBHOOK] Error sending email:`, emailError);
    }

    return new Response(
      JSON.stringify({ received: true, processed: true, orderId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Handle payment_intent.payment_failed (optional logging)
  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    console.log(`[WEBHOOK] Payment failed for intent: ${paymentIntent.id}`);
    console.log(`[WEBHOOK] Failure message: ${paymentIntent.last_payment_error?.message}`);
  }

  // Return 200 for unhandled events
  return new Response(
    JSON.stringify({ received: true, type: event.type }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
