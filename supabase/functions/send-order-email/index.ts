import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
          ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;" />` : ''}
          <span style="font-family: 'Helvetica Neue', sans-serif; color: #2C2C2C; font-size: 14px;">${item.name}</span>
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
  <title>Confirmation de commande - Pièces de Trot</title>
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
                PIÈCES DE TROT
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
                Merci ${data.customerName} pour votre confiance !
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
                  ${data.orderNumber}
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
                        <td style="font-size: 14px; color: #666;">Livraison (${data.deliveryMethod})</td>
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
                  ${data.customerName}<br>
                  ${data.address.street}<br>
                  ${data.address.postalCode} ${data.address.city}
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
                Pièces de Trot - Votre expert en pièces détachées pour trottinettes électriques
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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: OrderEmailRequest = await req.json();

    // Validate required fields
    if (!data.orderNumber || !data.customerEmail || !data.customerName) {
      throw new Error("Missing required fields: orderNumber, customerEmail, or customerName");
    }

    console.log(`Sending order confirmation email to ${data.customerEmail} for order ${data.orderNumber}`);

    const emailResponse = await resend.emails.send({
      from: "Pièces de Trot <noreply@piecestrottinettes.fr>",
      to: [data.customerEmail],
      subject: `Commande ${data.orderNumber} confirmée - Pièces de Trot`,
      html: generateEmailHTML(data),
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-order-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
