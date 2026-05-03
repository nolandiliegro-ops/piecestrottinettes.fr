import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.1.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
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

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

interface OrderEmailRequest {
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  items: OrderItem[];
  totals: {
    subtotalHT: number;
    tva: number;
    totalTTC: number;
    deliveryPrice: number;
  };
  address: {
    street: string;
    postalCode: string;
    city: string;
  };
  deliveryMethod: string;
}

const formatPrice = (price: number): string => {
  return `${price.toFixed(2)}\u00A0€`;
};

const generateEmailHTML = (data: OrderEmailRequest): string => {
  const itemsHTML = data.items.map(item => `
    <tr>
      <td style="padding: 16px; border-bottom: 1px solid #e8e4e0;">
        <div style="display: flex; align-items: center; gap: 12px;">
          ${item.imageUrl ? `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.name)}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;" />` : ''}
          <span style="font-family: 'Helvetica Neue', sans-serif; color: #2C2C2C; font-size: 14px;">${escapeHtml(item.name)}</span>
        </div>
      </td>
      <td style="padding: 16px; border-bottom: 1px solid #e8e4e0; text-align: center; color: #666; font-size: 14px;">
        x${item.quantity}
      </td>
      <td style="padding: 16px; border-bottom: 1px solid #e8e4e0; text-align: right; font-family: 'Courier New', monospace; color: #2C2C2C; font-weight: 600;">
        ${formatPrice(item.price * item.quantity)}
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de commande - piecestrottinettes.fr</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F3F0; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F5F3F0;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #93B5A1 0%, #7DA08D 100%); padding: 40px 32px; text-align: center;">
              <h1 style="margin: 0; font-family: 'Georgia', serif; font-size: 28px; color: #FFFFFF; letter-spacing: 4px; font-weight: 400;">
                PIECESTROTTINETTES.FR
              </h1>
              <p style="margin: 12px 0 0; font-size: 14px; color: rgba(255, 255, 255, 0.9); letter-spacing: 2px;">
                ROULE · RÉPARE · DURE
              </p>
            </td>
          </tr>
          
          <!-- Order Confirmation -->
          <tr>
            <td style="padding: 40px 32px 24px; text-align: center;">
              <div style="width: 64px; height: 64px; margin: 0 auto 20px; background-color: rgba(147, 181, 161, 0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 32px;">✓</span>
              </div>
              <h2 style="margin: 0 0 8px; font-family: 'Georgia', serif; font-size: 24px; color: #2C2C2C; letter-spacing: 2px; font-weight: 400;">
                COMMANDE CONFIRMÉE
              </h2>
              <p style="margin: 0; color: #666; font-size: 15px;">
                Merci ${escapeHtml(data.customerName)} pour votre confiance !
              </p>
            </td>
          </tr>
          
          <!-- Order Number -->
          <tr>
            <td style="padding: 0 32px 32px; text-align: center;">
              <div style="display: inline-block; background-color: rgba(147, 181, 161, 0.1); border: 1px solid rgba(147, 181, 161, 0.3); border-radius: 12px; padding: 16px 32px;">
                <p style="margin: 0 0 4px; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px;">
                  Numéro de commande
                </p>
                <p style="margin: 0; font-family: 'Courier New', monospace; font-size: 22px; color: #93B5A1; font-weight: bold; letter-spacing: 3px;">
                  ${escapeHtml(data.orderNumber)}
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Separator -->
          <tr>
            <td style="padding: 0 32px;">
              <div style="height: 1px; background: linear-gradient(to right, transparent, #e8e4e0, transparent);"></div>
            </td>
          </tr>
          
          <!-- Items Table -->
          <tr>
            <td style="padding: 32px;">
              <h3 style="margin: 0 0 20px; font-family: 'Georgia', serif; font-size: 16px; color: #2C2C2C; letter-spacing: 2px; font-weight: 400;">
                RÉCAPITULATIF
              </h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #e8e4e0; border-radius: 12px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #FAFAF8;">
                    <th style="padding: 12px 16px; text-align: left; font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; font-weight: 500;">Article</th>
                    <th style="padding: 12px 16px; text-align: center; font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; font-weight: 500;">Qté</th>
                    <th style="padding: 12px 16px; text-align: right; font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; font-weight: 500;">Prix</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML}
                </tbody>
              </table>
            </td>
          </tr>
          
          <!-- Totals -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAFAF8; border-radius: 12px; padding: 20px;">
                <tr>
                  <td style="padding: 8px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size: 14px; color: #666;">Sous-total HT</td>
                        <td style="text-align: right; font-family: 'Courier New', monospace; font-size: 14px; color: #2C2C2C;">${formatPrice(data.totals.subtotalHT)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size: 14px; color: #666;">TVA (20%)</td>
                        <td style="text-align: right; font-family: 'Courier New', monospace; font-size: 14px; color: #2C2C2C;">${formatPrice(data.totals.tva)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size: 14px; color: #666;">Livraison (${escapeHtml(data.deliveryMethod)})</td>
                        <td style="text-align: right; font-family: 'Courier New', monospace; font-size: 14px; color: #2C2C2C;">${data.totals.deliveryPrice === 0 ? 'Gratuit' : formatPrice(data.totals.deliveryPrice)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px 8px;">
                    <div style="height: 1px; background-color: #e8e4e0;"></div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size: 16px; color: #2C2C2C; font-weight: 600;">Total TTC</td>
                        <td style="text-align: right; font-family: 'Courier New', monospace; font-size: 20px; color: #93B5A1; font-weight: bold;">${formatPrice(data.totals.totalTTC)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Delivery Address -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <div style="background-color: #FAFAF8; border-radius: 12px; padding: 20px;">
                <h4 style="margin: 0 0 12px; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; font-weight: 500;">
                  Adresse de livraison
                </h4>
                <p style="margin: 0; font-size: 15px; color: #2C2C2C; line-height: 1.6;">
                  ${escapeHtml(data.customerName)}<br>
                  ${escapeHtml(data.address.street)}<br>
                  ${escapeHtml(data.address.postalCode)} ${escapeHtml(data.address.city)}
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #2C2C2C; padding: 32px; text-align: center;">
              <p style="margin: 0 0 8px; font-family: 'Georgia', serif; font-size: 16px; color: #93B5A1; letter-spacing: 3px;">
                ROULE · RÉPARE · DURE
              </p>
              <p style="margin: 0; font-size: 12px; color: #888;">
                piecestrottinettes.fr - Votre expert en pièces détachées pour trottinettes électriques
              </p>
              <p style="margin: 16px 0 0; font-size: 11px; color: #666;">
                Vous recevez cet email car vous avez passé une commande sur notre site.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

const generateSellerNotificationHTML = (data: OrderEmailRequest): string => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const itemsRows = data.items.map(item => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e8e4e0; font-size: 14px; color: #2C2C2C;">${escapeHtml(item.name)}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e8e4e0; text-align: center; font-size: 14px; color: #666;">x${item.quantity}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e8e4e0; text-align: right; font-size: 14px; color: #666;">${formatPrice(item.price)}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e8e4e0; text-align: right; font-size: 14px; font-weight: 600; color: #2C2C2C;">${formatPrice(item.price * item.quantity)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding: 30px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e0e0e0;">
          
          <tr>
            <td style="background-color: #2C2C2C; padding: 24px 32px;">
              <h1 style="margin: 0; color: #93B5A1; font-size: 18px; letter-spacing: 2px;">🛒 NOUVELLE COMMANDE</h1>
              <p style="margin: 8px 0 0; color: #ccc; font-size: 13px;">${dateStr} à ${timeStr}</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size: 13px; color: #666;">Commande</td>
                  <td style="text-align: right; font-family: 'Courier New', monospace; font-size: 18px; color: #93B5A1; font-weight: bold;">#${escapeHtml(data.orderNumber)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 32px;">
              <div style="height: 1px; background-color: #e8e4e0;"></div>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 32px;">
              <h3 style="margin: 0 0 12px; font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Client</h3>
              <p style="margin: 0; font-size: 15px; color: #2C2C2C; line-height: 1.6;">
                <strong>${escapeHtml(data.customerName)}</strong><br>
                ${escapeHtml(data.customerEmail)}<br>
                ${escapeHtml(data.address.street)}<br>
                ${escapeHtml(data.address.postalCode)} ${escapeHtml(data.address.city)}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 32px;">
              <div style="height: 1px; background-color: #e8e4e0;"></div>
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 32px;">
              <h3 style="margin: 0 0 12px; font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Articles commandés</h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #e8e4e0; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #FAFAF8;">
                    <th style="padding: 8px 12px; text-align: left; font-size: 11px; color: #999; text-transform: uppercase;">Article</th>
                    <th style="padding: 8px 12px; text-align: center; font-size: 11px; color: #999; text-transform: uppercase;">Qté</th>
                    <th style="padding: 8px 12px; text-align: right; font-size: 11px; color: #999; text-transform: uppercase;">P.U.</th>
                    <th style="padding: 8px 12px; text-align: right; font-size: 11px; color: #999; text-transform: uppercase;">Total</th>
                  </tr>
                </thead>
                <tbody>${itemsRows}</tbody>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 32px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #2C2C2C; border-radius: 8px; padding: 16px;">
                <tr>
                  <td style="padding: 8px 16px; font-size: 14px; color: #ccc;">Livraison (${escapeHtml(data.deliveryMethod)})</td>
                  <td style="padding: 8px 16px; text-align: right; font-size: 14px; color: #fff;">${data.totals.deliveryPrice === 0 ? 'Gratuit' : formatPrice(data.totals.deliveryPrice)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 16px; font-size: 18px; color: #fff; font-weight: bold;">Total TTC</td>
                  <td style="padding: 8px 16px; text-align: right; font-size: 22px; color: #93B5A1; font-weight: bold;">${formatPrice(data.totals.totalTTC)}</td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Server-to-server only: require shared internal secret
  const expectedSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET");
  if (!expectedSecret) {
    console.error("INTERNAL_FUNCTION_SECRET is not configured");
    return new Response(
      JSON.stringify({ success: false, error: "Server misconfiguration" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
  const providedSecret = req.headers.get("x-internal-secret");
  if (providedSecret !== expectedSecret) {
    console.warn("send-order-email: unauthorized call (missing or invalid x-internal-secret)");
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const data: OrderEmailRequest = await req.json();

    if (!data.orderNumber || !data.customerEmail || !data.customerName) {
      throw new Error("Missing required fields: orderNumber, customerEmail, or customerName");
    }

    console.log(`Sending order confirmation email to ${data.customerEmail} for order ${data.orderNumber}`);

    const emailResponse = await resend.emails.send({
      from: "piecestrottinettes.fr <noreply@piecestrottinettes.fr>",
      to: [data.customerEmail],
      subject: `Commande ${data.orderNumber} confirmée - piecestrottinettes.fr`,
      html: generateEmailHTML(data),
    });

    console.log("Customer email sent successfully:", emailResponse);

    // Notification vendeur — try/catch séparé pour ne pas bloquer la réponse
    try {
      const sellerResponse = await resend.emails.send({
        from: "piecestrottinettes.fr <noreply@piecestrottinettes.fr>",
        to: ["contact@piecestrottinettes.fr"],
        subject: `[Nouvelle commande] #${data.orderNumber} — ${data.totals.totalTTC.toFixed(2)}€`,
        html: generateSellerNotificationHTML(data),
      });
      console.log("Seller notification sent successfully:", sellerResponse);
    } catch (sellerError) {
      console.error("Failed to send seller notification (non-blocking):", sellerError);
    }

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-order-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
