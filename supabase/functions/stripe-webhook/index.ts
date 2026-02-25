import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@4.1.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const formatPrice = (amount: number): string => {
  return amount.toFixed(2).replace(".", ",") + " €";
};

interface OrderLineItem {
  part_name: string;
  quantity: number;
  unit_price: number;
  image_url: string | null;
}

interface OrderDetails {
  subtotalHT: number;
  tvaAmount: number;
  deliveryPrice: number;
  deliveryMethod: string;
  address: string;
  postalCode: string;
  city: string;
}

const generateConfirmationHTML = (
  customerName: string,
  orderNumber: string,
  totalTTC: number,
  items: OrderLineItem[],
  details: OrderDetails
): string => {
  const itemsHTML = items.map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0ede9;width:48px;vertical-align:middle;">
        ${item.image_url ? `<img src="${item.image_url}" alt="${item.part_name}" width="44" height="44" style="border-radius:8px;object-fit:cover;display:block;" />` : `<div style="width:44px;height:44px;background:#f0ede9;border-radius:8px;"></div>`}
      </td>
      <td style="padding:10px 0 10px 12px;border-bottom:1px solid #f0ede9;font-size:14px;color:#2C2C2C;vertical-align:middle;">${item.quantity} × ${item.part_name}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0ede9;font-size:14px;color:#2C2C2C;text-align:right;white-space:nowrap;vertical-align:middle;">${formatPrice(item.unit_price * item.quantity)}</td>
    </tr>
  `).join("");

  const deliveryLabel = details.deliveryMethod || "Standard";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Commande confirmée - piecestrottinettes.fr</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F3F0;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F5F3F0;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#93B5A1;padding:36px 32px;text-align:center;">
              <h1 style="margin:0;font-family:Georgia,serif;font-size:26px;color:#FFFFFF;letter-spacing:4px;font-weight:400;">PIECESTROTTINETTES.FR</h1>
              <p style="margin:10px 0 0;font-size:13px;color:rgba(255,255,255,0.9);letter-spacing:3px;">ROULE · RÉPARE · DURE</p>
            </td>
          </tr>

          <!-- Confirmation -->
          <tr>
            <td style="padding:40px 32px 16px;text-align:center;">
              <div style="width:64px;height:64px;margin:0 auto 16px;background:rgba(147,181,161,0.15);border-radius:50%;line-height:64px;font-size:32px;">✓</div>
              <h2 style="margin:0 0 8px;font-family:Georgia,serif;font-size:22px;color:#2C2C2C;letter-spacing:2px;font-weight:400;">PAIEMENT CONFIRMÉ</h2>
              <p style="margin:0;color:#666;font-size:15px;">Merci ${customerName} pour votre commande !</p>
            </td>
          </tr>

          <!-- Order number + Total -->
          <tr>
            <td style="padding:8px 32px 24px;text-align:center;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;background:rgba(147,181,161,0.08);border:1px solid rgba(147,181,161,0.25);border-radius:12px;">
                <tr>
                  <td style="padding:20px 40px;text-align:center;">
                    <p style="margin:0 0 4px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Commande</p>
                    <p style="margin:0;font-family:'Courier New',monospace;font-size:20px;color:#93B5A1;font-weight:bold;letter-spacing:2px;">${orderNumber}</p>
                  </td>
                  <td style="padding:20px 40px;text-align:center;border-left:1px solid rgba(147,181,161,0.2);">
                    <p style="margin:0 0 4px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;">Total TTC</p>
                    <p style="margin:0;font-family:'Courier New',monospace;font-size:20px;color:#2C2C2C;font-weight:bold;">${formatPrice(totalTTC)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items detail -->
          <tr>
            <td style="padding:0 32px 24px;">
              <p style="margin:0 0 12px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Détail de votre commande</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                ${itemsHTML}
              </table>
            </td>
          </tr>

          <!-- Separator -->
          <tr><td style="padding:0 32px;"><div style="height:1px;background:linear-gradient(to right,transparent,#e8e4e0,transparent);"></div></td></tr>

          <!-- XP / Gamification -->
          <tr>
            <td style="padding:28px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg,#93B5A1 0%,#7DA08D 100%);border-radius:12px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="width:48px;vertical-align:middle;">
                          <div style="width:44px;height:44px;background:rgba(255,255,255,0.2);border-radius:10px;text-align:center;line-height:44px;font-size:22px;">⚡</div>
                        </td>
                        <td style="padding-left:16px;vertical-align:middle;">
                          <p style="margin:0 0 4px;font-size:15px;color:#FFFFFF;font-weight:600;">Félicitations !</p>
                          <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.9);line-height:1.5;">Cet achat vous a rapporté des <strong>XP</strong> et des <strong>Points Cockpit</strong> !</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Separator -->
          <tr><td style="padding:0 32px;"><div style="height:1px;background:linear-gradient(to right,transparent,#e8e4e0,transparent);"></div></td></tr>

          <!-- Financial Details & Delivery -->
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 16px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Détails financiers</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#555;">Sous-total HT</td>
                  <td style="padding:6px 0;font-size:14px;color:#2C2C2C;text-align:right;font-weight:500;">${formatPrice(details.subtotalHT)}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#555;">TVA (20%)</td>
                  <td style="padding:6px 0;font-size:14px;color:#2C2C2C;text-align:right;font-weight:500;">${formatPrice(details.tvaAmount)}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#555;">Livraison (${deliveryLabel})</td>
                  <td style="padding:6px 0;font-size:14px;color:#2C2C2C;text-align:right;font-weight:500;">${details.deliveryPrice > 0 ? formatPrice(details.deliveryPrice) : "Gratuite"}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:12px 0 0;"><div style="height:1px;background:#f0ede9;"></div></td>
                </tr>
                <tr>
                  <td style="padding:12px 0 0;font-size:16px;color:#2C2C2C;font-weight:700;">Total TTC</td>
                  <td style="padding:12px 0 0;font-size:16px;color:#93B5A1;text-align:right;font-weight:700;">${formatPrice(totalTTC)}</td>
                </tr>
              </table>

              <!-- Delivery address -->
              <div style="margin-top:24px;padding:20px;background:rgba(147,181,161,0.06);border:1px solid rgba(147,181,161,0.15);border-radius:10px;">
                <p style="margin:0 0 8px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Adresse de livraison</p>
                <p style="margin:0;font-size:14px;color:#2C2C2C;line-height:1.6;">${details.address}<br>${details.postalCode} ${details.city}</p>
              </div>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding:4px 32px 36px;text-align:center;">
              <a href="https://piecestrottinettes.fr/garage" target="_blank" style="display:inline-block;background:#93B5A1;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:600;padding:16px 48px;border-radius:10px;letter-spacing:1px;">Voir mon Garage</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#2C2C2C;padding:28px 32px;text-align:center;">
              <p style="margin:0 0 6px;font-family:Georgia,serif;font-size:14px;color:#93B5A1;letter-spacing:3px;">ROULE · RÉPARE · DURE</p>
              <p style="margin:0;font-size:11px;color:#888;">piecestrottinettes.fr — Votre expert en pièces détachées pour trottinettes électriques</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

serve(async (req) => {
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

    if (order.status !== "awaiting_payment") {
      console.log(`[WEBHOOK] Order ${orderId} already processed (status: ${order.status})`);
      return new Response(
        JSON.stringify({ received: true, skipped: true, reason: "Already processed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "paid",
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

    // --- Fetch order items for the email ---
    const { data: emailItems } = await supabaseAdmin
      .from("order_items")
      .select("part_name, quantity, unit_price, part_image_url")
      .eq("order_id", orderId);

    const mappedItems: OrderLineItem[] = (emailItems || []).map((item: any) => ({
      part_name: item.part_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      image_url: item.part_image_url,
    }));

    // --- Send unified confirmation email via Resend ---
    try {
      const customerName = `${order.customer_first_name} ${order.customer_last_name}`;
      const html = generateConfirmationHTML(customerName, order.order_number, order.total_ttc, mappedItems, {
        subtotalHT: order.subtotal_ht,
        tvaAmount: order.tva_amount,
        deliveryPrice: order.delivery_price || 0,
        deliveryMethod: order.delivery_method || "Standard",
        address: order.address,
        postalCode: order.postal_code,
        city: order.city,
      });

      const emailResult = await resend.emails.send({
        from: "piecestrottinettes.fr <contact@piecestrottinettes.fr>",
        to: [order.customer_email],
        subject: `✓ Commande ${order.order_number} confirmée — piecestrottinettes.fr`,
        html,
      });
      console.log(`[WEBHOOK] Confirmation email sent to ${order.customer_email}:`, emailResult);
    } catch (emailErr) {
      console.error(`[WEBHOOK] Failed to send confirmation email:`, emailErr);
    }

    return new Response(
      JSON.stringify({ received: true, processed: true, orderId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    console.log(`[WEBHOOK] Payment failed for intent: ${paymentIntent.id}`);
    console.log(`[WEBHOOK] Failure message: ${paymentIntent.last_payment_error?.message}`);
  }

  return new Response(
    JSON.stringify({ received: true, type: event.type }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
