import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.1.2";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

interface MessageNotificationRequest {
  recipient: 'client' | 'admin' | 'client-ack';
  customerEmail: string;
  customerName: string;
  orderNumber?: string;
  messageText: string;
  conversationId?: string;
  imageUrl?: string;
  userId?: string;
  contactId?: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildThreadingHeaders(conversationId?: string, isReply?: boolean) {
  if (!conversationId) return {};
  const messageId = `<conv-${conversationId}@piecestrottinettes.fr>`;
  if (isReply) {
    return {
      "In-Reply-To": messageId,
      "References": messageId,
    };
  }
  return {
    "Message-ID": messageId,
  };
}

function buildSubject(orderNumber?: string, isReply?: boolean): string {
  const tag = orderNumber ? `[${orderNumber}]` : '[Question]';
  const base = `💬 ${tag} Nouveau message — piecestrottinettes.fr`;
  return isReply ? `Re: ${base}` : base;
}

const generateHeader = (): string => `
  <tr>
    <td style="background: linear-gradient(135deg, #93B5A1 0%, #7DA08D 100%); padding: 32px; text-align: center;">
      <h1 style="margin: 0; font-family: Georgia, serif; font-size: 22px; color: #FFFFFF; letter-spacing: 3px;">PIECESTROTTINETTES.FR</h1>
      <p style="margin: 8px 0 0; font-size: 12px; color: rgba(255,255,255,0.9); letter-spacing: 2px;">ROULE · RÉPARE · DURE</p>
    </td>
  </tr>`;

const generateFooter = (): string => `
  <tr>
    <td style="background-color: #2C2C2C; padding: 24px 32px; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #888;">piecestrottinettes.fr — Votre expert en pièces détachées</p>
    </td>
  </tr>`;

const wrapEmail = (content: string): string => `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #F5F3F0; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F5F3F0;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          ${content}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const generateImageBlock = (imageUrl?: string): string => {
  if (!imageUrl) return '';
  return `
    <div style="margin-top: 16px;">
      <a href="${escapeHtml(imageUrl)}" target="_blank" style="display: inline-block;">
        <img src="${escapeHtml(imageUrl)}" alt="Image jointe" style="max-width: 300px; max-height: 200px; border-radius: 8px; border: 1px solid #e0e0e0;" />
      </a>
    </div>`;
};

const generateClientEmailHTML = (data: MessageNotificationRequest): string => {
  return wrapEmail(`
    ${generateHeader()}
    <tr>
      <td style="padding: 40px 32px;">
        <h2 style="margin: 0 0 20px; font-family: Georgia, serif; font-size: 22px; color: #2C2C2C;">💬 Nouveau message de notre équipe</h2>
        <p style="margin: 0 0 8px; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Message :</p>
        <div style="background-color: #FAFAF8; border-radius: 12px; padding: 20px; border-left: 3px solid #93B5A1; margin-bottom: 32px;">
          <p style="margin: 0; font-size: 15px; color: #2C2C2C; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(data.messageText)}</p>
          ${generateImageBlock(data.imageUrl)}
        </div>
        <div style="text-align: center;">
          <a href="https://piecestrottinettes.fr/garage?tab=messages" style="display: inline-block; background-color: #93B5A1; color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px; font-weight: 600; letter-spacing: 1px;">VOIR MA MESSAGERIE</a>
        </div>
      </td>
    </tr>
    ${generateFooter()}
  `);
};

const generateClientAckEmailHTML = (data: MessageNotificationRequest): string => {
  return wrapEmail(`
    ${generateHeader()}
    <tr>
      <td style="padding: 40px 32px;">
        <h2 style="margin: 0 0 20px; font-family: Georgia, serif; font-size: 22px; color: #2C2C2C;">✅ Votre message a bien été envoyé</h2>
        <p style="margin: 0 0 16px; font-size: 15px; color: #555; line-height: 1.5;">Bonjour ${escapeHtml(data.customerName)}, nous avons bien reçu votre message. Notre équipe vous répondra sous 48h.</p>
        <p style="margin: 0 0 8px; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Votre message :</p>
        <div style="background-color: #FAFAF8; border-radius: 12px; padding: 20px; border-left: 3px solid #93B5A1; margin-bottom: 32px;">
          <p style="margin: 0; font-size: 15px; color: #2C2C2C; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(data.messageText)}</p>
          ${generateImageBlock(data.imageUrl)}
        </div>
        <div style="text-align: center;">
          <a href="https://piecestrottinettes.fr/garage?tab=messages" style="display: inline-block; background-color: #93B5A1; color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px; font-weight: 600; letter-spacing: 1px;">VOIR MA MESSAGERIE</a>
        </div>
      </td>
    </tr>
    ${generateFooter()}
  `);
};

const generateAdminEmailHTML = (data: MessageNotificationRequest): string => {
  const adminUrl = data.contactId
    ? `https://piecestrottinettes.fr/admin?tab=messages&contactId=${data.contactId}`
    : data.userId
    ? `https://piecestrottinettes.fr/admin?tab=messages&garage=true&userId=${data.userId}`
    : `https://piecestrottinettes.fr/admin?tab=messages`;

  return wrapEmail(`
    ${generateHeader()}
    <tr>
      <td style="padding: 40px 32px;">
        <h2 style="margin: 0 0 20px; font-family: Georgia, serif; font-size: 22px; color: #2C2C2C;">💬 Nouveau message client</h2>
        <p style="margin: 0 0 8px; font-size: 14px; color: #2C2C2C;"><strong>Client :</strong> ${escapeHtml(data.customerName)}</p>
        <p style="margin: 0 0 16px; font-size: 14px; color: #2C2C2C;"><strong>Email :</strong> <a href="mailto:${escapeHtml(data.customerEmail)}" style="color: #93B5A1;">${escapeHtml(data.customerEmail)}</a></p>
        <p style="margin: 0 0 8px; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Message :</p>
        <div style="background-color: #FAFAF8; border-radius: 12px; padding: 20px; border-left: 3px solid #93B5A1; margin-bottom: 32px;">
          <p style="margin: 0; font-size: 15px; color: #2C2C2C; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(data.messageText)}</p>
          ${generateImageBlock(data.imageUrl)}
        </div>
        <div style="text-align: center;">
          <a href="${adminUrl}" style="display: inline-block; background-color: #93B5A1; color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px; font-weight: 600; letter-spacing: 1px;">RÉPONDRE DANS L'ADMIN</a>
        </div>
      </td>
    </tr>
    ${generateFooter()}
  `);
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: MessageNotificationRequest = await req.json();
    const recipient = data.recipient || 'client';

    if (!data.messageText) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // For threading: admin reply = isReply, client-ack = isReply (same thread as initial client message)
    const isReply = recipient === 'client' || recipient === 'client-ack';
    const threadingHeaders = buildThreadingHeaders(data.conversationId, isReply);
    const subject = buildSubject(data.orderNumber, isReply);

    let to: string;
    let html: string;

    if (recipient === 'admin') {
      to = 'contact@piecestrottinettes.fr';
      html = generateAdminEmailHTML(data);
    } else if (recipient === 'client-ack') {
      if (!data.customerEmail) {
        return new Response(
          JSON.stringify({ error: "Missing customerEmail for client-ack notification" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      to = data.customerEmail;
      html = generateClientAckEmailHTML(data);
    } else {
      if (!data.customerEmail) {
        return new Response(
          JSON.stringify({ error: "Missing customerEmail for client notification" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      to = data.customerEmail;
      html = generateClientEmailHTML(data);
    }

    console.log(`Sending message notification to ${to} (recipient: ${recipient})`);

    const emailResponse = await resend.emails.send({
      from: "piecestrottinettes.fr <noreply@piecestrottinettes.fr>",
      to: [to],
      subject,
      html,
      headers: threadingHeaders,
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
