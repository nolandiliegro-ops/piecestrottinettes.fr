import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@4.1.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
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

interface PendingAlert {
  id: string;
  email: string;
  part_id: string;
  parts: {
    name: string;
    slug: string | null;
    stock_quantity: number | null;
    published: boolean | null;
  };
}

const generateBackInStockHTML = (partName: string, slug: string | null): string => {
  const url = slug
    ? `https://piecestrottinettes.fr/piece/${slug}`
    : "https://piecestrottinettes.fr/catalogue";

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(partName)} est de nouveau disponible</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F0E8; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F5F0E8;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);">

          <!-- Header -->
          <tr>
            <td style="background-color: #4A7C59; padding: 32px; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: rgba(255,255,255,0.85); letter-spacing: 2px; text-transform: uppercase;">
                🔔 Retour en stock
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 32px 24px; text-align: center;">
              <h1 style="margin: 0 0 12px; font-size: 22px; color: #1A1A1A; font-weight: 700;">
                Bonne nouvelle, c'est de retour !
              </h1>
              <p style="margin: 0 0 8px; font-size: 15px; color: #6B7280; line-height: 1.6;">
                La pièce que vous attendiez est de nouveau disponible :
              </p>
              <p style="margin: 16px 0 0; font-size: 18px; color: #1A1A1A; font-weight: 600;">
                ${escapeHtml(partName)}
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 8px 32px 40px; text-align: center;">
              <a href="${escapeHtml(url)}"
                 style="display: inline-block; background-color: #4A7C59; color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 12px;">
                Voir la pièce
              </a>
              <p style="margin: 16px 0 0; font-size: 12px; color: #9CA3AF;">
                Les stocks peuvent repartir vite — ne tardez pas.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F5F0E8; padding: 24px 32px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
                piecestrottinettes.fr — Votre expert en pièces détachées trottinettes électriques
              </p>
              <p style="margin: 8px 0 0; font-size: 11px; color: #B5AE9F;">
                Vous recevez cet email car vous avez demandé à être prévenu du retour de cette pièce.
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Server-to-server only: require shared admin secret
  const expectedSecret = Deno.env.get("STOCK_ALERTS_CRON_SECRET");
  if (!expectedSecret) {
    console.error("ADMIN_BULK_SECRET is not configured");
    return new Response(
      JSON.stringify({ success: false, error: "Server misconfiguration" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
  const providedSecret = req.headers.get("x-admin-secret");
  if (providedSecret !== expectedSecret) {
    console.warn("process-stock-alerts: unauthorized call (missing or invalid x-admin-secret)");
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    // Optional body { dry_run?: boolean } — default false
    let dryRun = false;
    try {
      const body = await req.json();
      dryRun = body?.dry_run === true;
    } catch {
      // no body / invalid JSON → dryRun stays false
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // 1. Pending alerts joined to parts that are back in stock & published
    const { data: alerts, error: selectError } = await supabase
      .from("stock_alerts")
      .select("id, email, part_id, parts!inner(name, slug, stock_quantity, published)")
      .is("notified_at", null)
      .gt("parts.stock_quantity", 0)
      .eq("parts.published", true);

    if (selectError) {
      throw new Error(`Select pending alerts failed: ${selectError.message}`);
    }

    const pending = (alerts ?? []) as unknown as PendingAlert[];
    const pendingFound = pending.length;

    // Idempotent no-op when nothing pending
    if (pendingFound === 0) {
      return new Response(
        JSON.stringify({ dry_run: dryRun, pending_found: 0, sent_ok: 0, send_failed: 0, ids_notified: [] }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // DRY RUN: report what would be sent, no Resend, no UPDATE
    if (dryRun) {
      const preview = pending.map((a) => ({ id: a.id, email: a.email, part: a.parts?.name, slug: a.parts?.slug }));
      console.log(`[dry_run] ${pendingFound} alert(s) would be sent`, preview);
      return new Response(
        JSON.stringify({
          dry_run: true,
          pending_found: pendingFound,
          sent_ok: 0,
          send_failed: 0,
          ids_notified: [],
          preview,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 2. Send one email per alert; collect only the ids that succeeded
    const idsNotified: string[] = [];
    let sendFailed = 0;

    for (const alert of pending) {
      const part = alert.parts;
      try {
        await resend.emails.send({
          from: "piecestrottinettes.fr <noreply@piecestrottinettes.fr>",
          to: [alert.email],
          subject: `🔔 ${part.name} est de nouveau disponible`,
          html: generateBackInStockHTML(part.name, part.slug),
        });
        idsNotified.push(alert.id);
      } catch (sendError) {
        sendFailed++;
        console.error(`Failed to send stock alert ${alert.id} to ${alert.email}:`, sendError);
        // Not marked → will be retried on next cron run
      }
    }

    // 3. Mark ONLY the alerts whose email went out
    if (idsNotified.length > 0) {
      const { error: updateError } = await supabase
        .from("stock_alerts")
        .update({ notified_at: new Date().toISOString() })
        .in("id", idsNotified);

      if (updateError) {
        // Emails already sent — surface but don't pretend they weren't notified
        console.error("Failed to mark alerts as notified:", updateError);
        throw new Error(`Update notified_at failed after sending: ${updateError.message}`);
      }
    }

    // 4. Recap
    return new Response(
      JSON.stringify({
        dry_run: false,
        pending_found: pendingFound,
        sent_ok: idsNotified.length,
        send_failed: sendFailed,
        ids_notified: idsNotified,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in process-stock-alerts function:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
