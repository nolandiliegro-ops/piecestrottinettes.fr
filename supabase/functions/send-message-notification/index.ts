import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.1.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MessageNotificationRequest {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  messageText: string;
}

const generateEmailHTML = (data: MessageNotificationRequest): string => {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #F5F3F0; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F5F3F0;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #93B5A1 0%, #7DA08D 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; font-family: Georgia, serif; font-size: 22px; color: #FFFFFF; letter-spacing: 3px;">PIECESTROTTINETTES.FR</h1>
              <p style="margin: 8px 0 0; font-size: 12px; color: rgba(255,255,255,0.9); letter-spacing: 2px;">ROULE · RÉPARE · DURE</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 32px;">
              <h2 style="margin: 0 0 16px; font-family: Georgia, serif; font-size: 20px; color: #2C2C2C;">Nouveau message pour votre commande</h2>
              <div style="display: inline-block; background-color: rgba(147,181,161,0.1); border: 1px solid rgba(147,181,161,0.3); border-radius: 8px; padding: 8px 16px; margin-bottom: 24px;">
                <span style="font-family: 'Courier New', monospace; font-size: 16px; color: #93B5A1; font-weight: bold;">${data.orderNumber}</span>
              </div>
              <p style="margin: 0 0 8px; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Message du support :</p>
              <div style="background-color: #FAFAF8; border-radius: 12px; padding: 20px; border-left: 3px solid #93B5A1;">
                <p style="margin: 0; font-size: 15px; color: #2C2C2C; line-height: 1.6;">${data.messageText}</p>
              </div>
              <div style="margin-top: 32px; text-align: center;">
                <a href="https://piecestrottinettes.lovable.app/garage" style="display: inline-block; background-color: #93B5A1; color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px; font-weight: 600; letter-spacing: 1px;">RÉPONDRE SUR MON GARAGE</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #2C2C2C; padding: 24px 32px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #888;">piecestrottinettes.fr — Votre expert en pièces détachées</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: MessageNotificationRequest = await req.json();

    if (!data.customerEmail || !data.orderNumber || !data.messageText) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending message notification to ${data.customerEmail} for order ${data.orderNumber}`);

    const emailResponse = await resend.emails.send({
      from: "piecestrottinettes.fr <noreply@piecestrottinettes.fr>",
      to: [data.customerEmail],
      subject: `Nouveau message pour votre commande ${data.orderNumber}`,
      html: generateEmailHTML(data),
    });

    console.log("Message notification sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-message-notification:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
