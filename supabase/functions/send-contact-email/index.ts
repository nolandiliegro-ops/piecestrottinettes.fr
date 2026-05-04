import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.1.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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
  user_id: z.string().uuid().optional(),
});

const SHOP_EMAIL = "contact@piecestrottinettes.fr";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const body = await req.json();
    const parsed = ContactSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ success: false, error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { name, email, subject, message, user_id } = parsed.data;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Sauvegarde en base contact_messages
    let insertedContactId: string | null = null;
    try {
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from("contact_messages")
        .insert({ name, email, subject, message })
        .select("id")
        .single();

      if (insertError) {
        console.error("Failed to insert contact message:", insertError);
      } else {
        insertedContactId = inserted?.id || null;
        console.log("Contact message saved to database", insertedContactId);
      }
    } catch (dbErr) {
      console.error("Database insert error (non-blocking):", dbErr);
    }

    // Si utilisateur connecté, insérer aussi dans order_messages pour le garage
    if (user_id) {
      try {
        const { error: msgError } = await supabaseAdmin
          .from("order_messages")
          .insert({
            user_id,
            message: `[${subject}]\n${message}`,
            sender_type: 'client',
            order_id: null,
          });

        if (msgError) {
          console.error("Failed to insert order_message:", msgError);
        } else {
          console.log("Message also saved to order_messages for garage visibility");
        }
      } catch (e) {
        console.error("order_messages insert error (non-blocking):", e);
      }
    }

    // 1. Notification au propriétaire (admin) — template aligné sur send-message-notification
    const adminCtaUrl = insertedContactId
      ? `https://piecestrottinettes.fr/admin?tab=messages&contactId=${insertedContactId}`
      : `https://piecestrottinettes.fr/admin?tab=messages`;

    await resend.emails.send({
      from: "piecestrottinettes.fr <noreply@piecestrottinettes.fr>",
      to: [SHOP_EMAIL],
      reply_to: email,
      subject: `💬 [Contact] ${subject} — de ${escapeHtml(name)}`,
      html: `<!DOCTYPE html>
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
              <h2 style="margin: 0 0 20px; font-family: Georgia, serif; font-size: 22px; color: #2C2C2C;">📨 Nouveau message via le formulaire Contact</h2>
              <p style="margin: 0 0 8px; font-size: 14px; color: #2C2C2C;"><strong>Nom :</strong> ${escapeHtml(name)}</p>
              <p style="margin: 0 0 8px; font-size: 14px; color: #2C2C2C;"><strong>Email :</strong> <a href="mailto:${escapeHtml(email)}" style="color: #93B5A1;">${escapeHtml(email)}</a></p>
              <p style="margin: 0 0 16px; font-size: 14px; color: #2C2C2C;"><strong>Sujet :</strong> ${escapeHtml(subject)}</p>
              <p style="margin: 0 0 8px; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Message :</p>
              <div style="background-color: #FAFAF8; border-radius: 12px; padding: 20px; border-left: 3px solid #93B5A1; margin-bottom: 32px;">
                <p style="margin: 0; font-size: 15px; color: #2C2C2C; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(message)}</p>
              </div>
              <div style="text-align: center;">
                <a href="${adminCtaUrl}" style="display: inline-block; background-color: #93B5A1; color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px; font-weight: 600; letter-spacing: 1px;">RÉPONDRE DANS L'ADMIN</a>
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
</html>`,
    });

    // 2. Accusé de réception — pour TOUS les utilisateurs
    if (user_id) {
      // Utilisateur connecté → appel à send-message-notification avec le beau template
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const internalSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET") ?? "";

        await fetch(`${supabaseUrl}/functions/v1/send-message-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'x-internal-secret': internalSecret,
          },
          body: JSON.stringify({
            recipient: 'client-ack',
            customerEmail: email,
            customerName: name,
            messageText: `[${subject}]\n${message}`,
            conversationId: user_id,
          }),
        });
      } catch (ackErr) {
        console.warn("Client-ack notification failed:", ackErr);
      }
    } else {
      // Visiteur non connecté → accusé simple inline
      try {
        await resend.emails.send({
          from: "piecestrottinettes.fr <noreply@piecestrottinettes.fr>",
          to: [email],
          subject: "Votre message a bien été reçu — piecestrottinettes.fr",
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
        });
      } catch (ackErr) {
        console.warn("Acknowledgment email failed:", ackErr);
      }
    }

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

serve(handler);
