import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ContactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(5000),
});

const SHOP_EMAIL = "contact@piecestrottinettes.fr";

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const body = await req.json();
    const parsed = ContactSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ success: false, error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { name, email, subject, message } = parsed.data;

    // 1. Send notification to shop owner
    const notifResponse = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: `piecestrottinettes.fr <noreply@piecestrottinettes.fr>`,
        to: [SHOP_EMAIL],
        reply_to: email,
        subject: `[Contact] ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2C2C2C;">Nouveau message de contact</h2>
            <p><strong>Nom :</strong> ${escapeHtml(name)}</p>
            <p><strong>Email :</strong> ${escapeHtml(email)}</p>
            <p><strong>Sujet :</strong> ${escapeHtml(subject)}</p>
            <hr style="border: 1px solid #e8e4e0; margin: 20px 0;" />
            <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
          </div>
        `,
      }),
    });

    if (!notifResponse.ok) {
      const err = await notifResponse.text();
      throw new Error(`Failed to send notification email [${notifResponse.status}]: ${err}`);
    }
    await notifResponse.json();

    // 2. Send acknowledgment to the visitor
    const ackResponse = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: `piecestrottinettes.fr <noreply@piecestrottinettes.fr>`,
        to: [email],
        subject: `Votre message a bien été reçu — piecestrottinettes.fr`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2C2C2C; font-family: Georgia, serif; letter-spacing: 2px;">
              PIECESTROTTINETTES.FR
            </h2>
            <p>Bonjour ${escapeHtml(name)},</p>
            <p>Nous avons bien reçu votre message concernant <strong>"${escapeHtml(subject)}"</strong>.</p>
            <p>Notre équipe vous répondra sous 48h.</p>
            <hr style="border: 1px solid #e8e4e0; margin: 24px 0;" />
            <p style="color: #888; font-size: 12px;">
              Ceci est un accusé de réception automatique. Merci de ne pas répondre à cet email.
            </p>
          </div>
        `,
      }),
    });

    if (!ackResponse.ok) {
      console.warn("Acknowledgment email failed, but notification was sent.");
    }
    await ackResponse.json().catch(() => {});

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-contact-email:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

serve(handler);
