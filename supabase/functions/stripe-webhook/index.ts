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

const escapeHtml = (input: unknown): string => {
  const s = String(input ?? "");
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const generateSellerNotificationHTML = (
  orderNumber: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string | null,
  items: OrderLineItem[],
  details: OrderDetails,
  totalTTC: number,
  notes: string | null
): string => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const itemsRows = items.map(item => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e8e4e0;font-size:14px;color:#2C2C2C;">${escapeHtml(item.part_name)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e8e4e0;text-align:center;font-size:14px;color:#666;">x${item.quantity}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e8e4e0;text-align:right;font-size:14px;color:#666;">${formatPrice(item.unit_price)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e8e4e0;text-align:right;font-size:14px;font-weight:600;color:#2C2C2C;">${formatPrice(item.unit_price * item.quantity)}</td>
    </tr>
  `).join('');

  const notesBlock = notes && notes.trim().length > 0 ? `
    <tr>
      <td style="padding:0 32px 24px;">
        <div style="background:#FFF8E1;border:2px solid #FFC107;border-radius:10px;padding:16px 20px;">
          <p style="margin:0 0 8px;font-size:11px;color:#B8860B;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">📝 Recommandations client</p>
          <p style="margin:0;font-size:14px;color:#2C2C2C;line-height:1.5;white-space:pre-wrap;">${escapeHtml(notes)}</p>
        </div>
      </td>
    </tr>` : '';

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr><td align="center" style="padding:30px 20px;">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e0e0e0;">
        <tr><td style="background:#2C2C2C;padding:24px 32px;">
          <h1 style="margin:0;color:#93B5A1;font-size:18px;letter-spacing:2px;">🛒 NOUVELLE COMMANDE</h1>
          <p style="margin:8px 0 0;color:#ccc;font-size:13px;">${dateStr} à ${timeStr}</p>
        </td></tr>
        <tr><td style="padding:24px 32px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="font-size:13px;color:#666;">Commande</td>
              <td style="text-align:right;font-family:'Courier New',monospace;font-size:18px;color:#93B5A1;font-weight:bold;">#${escapeHtml(orderNumber)}</td>
            </tr>
            <tr>
              <td style="padding-top:8px;font-size:13px;color:#666;">Total TTC</td>
              <td style="padding-top:8px;text-align:right;font-size:18px;color:#2C2C2C;font-weight:bold;">${formatPrice(totalTTC)}</td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 32px;"><div style="height:1px;background:#e8e4e0;"></div></td></tr>
        <tr><td style="padding:24px 32px;">
          <h3 style="margin:0 0 12px;font-size:13px;color:#666;text-transform:uppercase;letter-spacing:1px;">Client</h3>
          <p style="margin:0;font-size:15px;color:#2C2C2C;line-height:1.6;">
            <strong>${escapeHtml(customerName)}</strong><br>
            ${escapeHtml(customerEmail)}${customerPhone ? `<br>${escapeHtml(customerPhone)}` : ''}<br>
            ${escapeHtml(details.address)}<br>
            ${escapeHtml(details.postalCode)} ${escapeHtml(details.city)}
          </p>
        </td></tr>
        ${notesBlock}
        <tr><td style="padding:0 32px;"><div style="height:1px;background:#e8e4e0;"></div></td></tr>
        <tr><td style="padding:24px 32px;">
          <h3 style="margin:0 0 12px;font-size:13px;color:#666;text-transform:uppercase;letter-spacing:1px;">Articles commandés</h3>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e8e4e0;border-radius:8px;overflow:hidden;">
            <thead><tr style="background:#FAFAF8;">
              <th style="padding:8px 12px;text-align:left;font-size:11px;color:#999;text-transform:uppercase;">Article</th>
              <th style="padding:8px 12px;text-align:center;font-size:11px;color:#999;text-transform:uppercase;">Qté</th>
              <th style="padding:8px 12px;text-align:right;font-size:11px;color:#999;text-transform:uppercase;">P.U.</th>
              <th style="padding:8px 12px;text-align:right;font-size:11px;color:#999;text-transform:uppercase;">Total</th>
            </tr></thead>
            <tbody>${itemsRows}</tbody>
          </table>
        </td></tr>
        <tr><td style="padding:0 32px 24px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#2C2C2C;border-radius:8px;padding:16px;">
            <tr>
              <td style="padding:8px 16px;font-size:14px;color:#ccc;">Livraison (${escapeHtml(details.deliveryMethod)})</td>
              <td style="padding:8px 16px;text-align:right;font-size:14px;color:#fff;">${details.deliveryPrice === 0 ? 'Gratuit' : formatPrice(details.deliveryPrice)}</td>
            </tr>
            <tr>
              <td style="padding:8px 16px;font-size:18px;color:#fff;font-weight:bold;">Total TTC</td>
              <td style="padding:8px 16px;text-align:right;font-size:22px;color:#93B5A1;font-weight:bold;">${formatPrice(totalTTC)}</td>
            </tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
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
  details: OrderDetails,
  cockpitPoints: number
): string => {
  const discountValue = (cockpitPoints * 0.05).toFixed(2).replace(".", ",");
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

          ${cockpitPoints > 0 ? `
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
                          <p style="margin:0 0 4px;font-size:15px;color:#FFFFFF;font-weight:600;">Félicitations ! Cet achat vous a rapporté <strong>${cockpitPoints} Points Cockpit</strong> !</p>
                          <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.85);line-height:1.5;">Ces points vous offrent une remise de <strong>${discountValue} €</strong> sur votre prochaine commande.</p>
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
          ` : ''}

          <!-- Financial Details & Delivery -->
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 16px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Détails financiers</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#555;">Sous-total</td>
                  <td style="padding:6px 0;font-size:14px;color:#2C2C2C;text-align:right;font-weight:500;">${formatPrice(details.subtotalHT)}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#555;">Livraison (${deliveryLabel})</td>
                  <td style="padding:6px 0;font-size:14px;color:#2C2C2C;text-align:right;font-weight:500;">${details.deliveryPrice > 0 ? formatPrice(details.deliveryPrice) : "Gratuite"}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:12px 0 0;"><div style="height:1px;background:#f0ede9;"></div></td>
                </tr>
                <tr>
                  <td style="padding:12px 0 0;font-size:16px;color:#2C2C2C;font-weight:700;">Total</td>
                  <td style="padding:12px 0 0;font-size:16px;color:#93B5A1;text-align:right;font-weight:700;">${formatPrice(totalTTC)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:6px 0 0;font-size:11px;color:#999;">TVA non applicable, art. 293 B du CGI</td>
                </tr>
              </table>

              <!-- Delivery address -->
              <div style="margin-top:24px;padding:20px;background:rgba(147,181,161,0.06);border:1px solid rgba(147,181,161,0.15);border-radius:10px;">
                <p style="margin:0 0 8px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Adresse de livraison</p>
                <p style="margin:0;font-size:14px;color:#2C2C2C;line-height:1.6;">${details.address}<br>${details.postalCode} ${details.city}</p>
              </div>
            </td>
          </tr>

          <!-- Logistics / Next Step -->
          <tr>
            <td style="padding:0 32px 28px;">
              <div style="background:rgba(44,44,44,0.04);border:1px solid rgba(44,44,44,0.1);border-radius:12px;padding:24px 28px;">
                <p style="margin:0 0 10px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px;font-weight:600;">📦 Étape suivante</p>
                <p style="margin:0 0 20px;font-size:14px;color:#555;line-height:1.7;">Nos mécanos préparent votre colis avec soin. Un numéro de suivi vous sera envoyé par email dès que votre commande sera expédiée.</p>
                <a href="https://piecestrottinettes.fr/garage?tab=orders" target="_blank" style="display:inline-block;background:transparent;color:#2C2C2C;text-decoration:none;font-size:14px;font-weight:600;padding:12px 32px;border-radius:10px;border:2px solid #2C2C2C;letter-spacing:0.5px;">Suivre ma commande</a>
              </div>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding:4px 32px 36px;text-align:center;">
              <a href="https://piecestrottinettes.fr/garage?tab=messages" target="_blank" style="display:inline-block;background:#93B5A1;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:600;padding:16px 48px;border-radius:10px;letter-spacing:1px;">Voir mon Garage</a>
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
      const cockpitPoints = order.loyalty_points_earned ?? Math.floor(order.total_ttc);
      const html = generateConfirmationHTML(customerName, order.order_number, order.total_ttc, mappedItems, {
        subtotalHT: order.subtotal_ht,
        tvaAmount: order.tva_amount,
        deliveryPrice: order.delivery_price || 0,
        deliveryMethod: order.delivery_method || "Standard",
        address: order.address,
        postalCode: order.postal_code,
        city: order.city,
      }, cockpitPoints);

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

    // --- Send seller notification email (non-blocking) ---
    try {
      const customerName = `${order.customer_first_name} ${order.customer_last_name}`;
      const sellerHtml = generateSellerNotificationHTML(
        order.order_number,
        customerName,
        order.customer_email,
        order.customer_phone,
        mappedItems,
        {
          subtotalHT: order.subtotal_ht,
          tvaAmount: order.tva_amount,
          deliveryPrice: order.delivery_price || 0,
          deliveryMethod: order.delivery_method || "Standard",
          address: order.address,
          postalCode: order.postal_code,
          city: order.city,
        },
        order.total_ttc,
        order.notes ?? null,
      );

      const sellerResult = await resend.emails.send({
        from: "piecestrottinettes.fr <noreply@piecestrottinettes.fr>",
        to: ["contact@piecestrottinettes.fr"],
        subject: `[Nouvelle commande] #${order.order_number} — ${Number(order.total_ttc).toFixed(2)}€`,
        html: sellerHtml,
      });
      console.log(`[WEBHOOK] Seller notification sent:`, sellerResult);
    } catch (sellerErr) {
      console.error(`[WEBHOOK] Failed to send seller notification (non-blocking):`, sellerErr);
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
