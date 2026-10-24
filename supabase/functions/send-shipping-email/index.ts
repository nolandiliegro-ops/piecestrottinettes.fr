// Mail d'expédition (lot livraison M4, 24/10/2026).
// Appelée par l'admin (OrderDetailSheet) après passage d'une commande en « Expédié ».
// - Réservée aux comptes admin (JWT → user_roles).
// - Lecture seule de la commande, sauf orders.shipping_email_sent_at (posé après envoi réussi).
// - Idempotente : un 2e appel ne renvoie rien sauf { force: true } (bouton « Renvoyer »).
// - action "ping" : lecture pure pour smoke-test (répond la version, n'envoie rien).
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@4.1.2";

const VERSION = "send-shipping-email@2026-10-24";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// ⚠️ DOUBLON de src/lib/tracking.ts — tenir en phase.
const CARRIER_LABELS: Record<string, string> = {
  colissimo: "Colissimo / La Poste",
  chronopost: "Chronopost",
  mondial_relay: "Mondial Relay",
  dpd: "DPD",
  ups: "UPS",
  gls: "GLS",
  autre: "Transporteur",
};
const TEMPLATES: Record<string, (n: string) => string> = {
  colissimo: (n) => `https://www.laposte.fr/outils/suivre-vos-envois?code=${n}`,
  chronopost: (n) => `https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT=${n}`,
  mondial_relay: (n) => `https://www.mondialrelay.fr/suivi-de-colis/?numeroExpedition=${n}`,
  dpd: (n) => `https://trace.dpd.fr/fr/trace/${n}`,
  ups: (n) => `https://www.ups.com/track?loc=fr_FR&tracknum=${n}`,
  gls: (n) => `https://gls-group.com/FR/fr/suivi-colis?match=${n}`,
};

function trackingLink(o: { carrier: string | null; tracking_number: string | null; tracking_url: string | null }): string | null {
  if (o.tracking_url && o.tracking_url.startsWith("https://")) return o.tracking_url;
  const n = o.tracking_number?.trim();
  const tpl = o.carrier ? TEMPLATES[o.carrier] : undefined;
  return n && tpl ? tpl(encodeURIComponent(n)) : null;
}

const esc = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function shippingHTML(o: {
  firstName: string; orderNumber: string; carrier: string; trackingNumber: string; link: string | null;
  address: string; postalCode: string; city: string;
}) {
  const btn = o.link
    ? `<a href="${esc(o.link)}" target="_blank" style="display:inline-block;background:#4A7C59;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:700;padding:16px 40px;border-radius:10px;">Suivre mon colis</a>`
    : "";
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1A1A1A;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F5F0E8;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#FFFFFF;border-radius:16px;overflow:hidden;">
  <tr><td style="background:#1A1A1A;padding:24px 32px;">
    <p style="margin:0;font-size:14px;color:#9BC4A6;letter-spacing:2px;font-weight:700;text-transform:uppercase;">piecestrottinettes.fr</p>
    <p style="margin:8px 0 0;font-size:26px;color:#FFFFFF;font-weight:900;text-transform:uppercase;">Ton colis est parti</p>
  </td></tr>
  <tr><td style="padding:28px 32px 8px;">
    <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">Salut ${esc(o.firstName)},</p>
    <p style="margin:0 0 20px;font-size:16px;line-height:1.6;">Ta commande <strong>${esc(o.orderNumber)}</strong> vient de quitter l'atelier.</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F5F0E8;border-radius:12px;">
      <tr><td style="padding:18px 20px;font-size:15px;line-height:1.7;">
        <span style="color:#6B7280;">Transporteur</span><br><strong>${esc(o.carrier)}</strong><br>
        <span style="color:#6B7280;">Numéro de suivi</span><br><strong style="font-family:Menlo,Consolas,monospace;">${esc(o.trackingNumber)}</strong>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:20px 32px 8px;text-align:center;">${btn}</td></tr>
  <tr><td style="padding:16px 32px 8px;font-size:14px;color:#6B7280;line-height:1.6;">
    Livraison à : ${esc(o.address)}, ${esc(o.postalCode)} ${esc(o.city)}<br>
    Le suivi est aussi dans ton Garage : <a href="https://piecestrottinettes.fr/garage?tab=orders" style="color:#4A7C59;font-weight:700;">Mes commandes</a>.
  </td></tr>
  <tr><td style="padding:24px 32px;font-size:14px;color:#6B7280;">Une question ? Réponds simplement à ce mail.</td></tr>
  <tr><td style="background:#1A1A1A;padding:18px 32px;text-align:center;font-size:14px;color:#9BC4A6;letter-spacing:3px;">ROULE · RÉPARE · DURE</td></tr>
</table></td></tr></table></body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "METHOD_NOT_ALLOWED", version: VERSION }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    if (body?.action === "ping") return json({ ok: true, version: VERSION });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Admin uniquement
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: userData } = token ? await supabase.auth.getUser(token) : { data: null };
    const userId = userData?.user?.id ?? null;
    if (!userId) return json({ ok: false, error: "UNAUTHORIZED", version: VERSION }, 401);
    const { data: adminRow } = await supabase
      .from("user_roles").select("id").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!adminRow) return json({ ok: false, error: "FORBIDDEN", version: VERSION }, 403);

    const orderId: string | undefined = body?.order_id;
    const force = body?.force === true;
    if (!orderId) return json({ ok: false, error: "ORDER_ID_REQUIRED" }, 400);

    const { data: order, error } = await supabase
      .from("orders")
      .select("id, order_number, status, customer_email, customer_first_name, address, postal_code, city, carrier, tracking_number, tracking_url, shipping_email_sent_at")
      .eq("id", orderId)
      .maybeSingle();
    if (error || !order) return json({ ok: false, error: "ORDER_NOT_FOUND" }, 404);

    if (order.status !== "shipped" && order.status !== "delivered") {
      return json({ ok: false, error: "NOT_SHIPPED", message: "La commande doit être au statut Expédié." }, 409);
    }
    if (!order.tracking_number?.trim()) {
      return json({ ok: false, error: "TRACKING_REQUIRED", message: "Numéro de suivi manquant." }, 409);
    }
    if (order.shipping_email_sent_at && !force) {
      return json({ ok: true, skipped: true, reason: "ALREADY_SENT", sent_at: order.shipping_email_sent_at });
    }

    const link = trackingLink(order);
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const result = await resend.emails.send({
      from: "piecestrottinettes.fr <contact@piecestrottinettes.fr>",
      to: [order.customer_email],
      subject: `📦 Ta commande ${order.order_number} est expédiée`,
      html: shippingHTML({
        firstName: order.customer_first_name || "",
        orderNumber: order.order_number,
        carrier: CARRIER_LABELS[order.carrier ?? ""] ?? "Transporteur",
        trackingNumber: order.tracking_number.trim(),
        link,
        address: order.address || "",
        postalCode: order.postal_code || "",
        city: order.city || "",
      }),
    });
    if (result.error) {
      console.error("[send-shipping-email] Resend error", result.error);
      return json({ ok: false, error: "RESEND_FAILED", message: result.error.message }, 502);
    }

    const sentAt = new Date().toISOString();
    await supabase.from("orders").update({ shipping_email_sent_at: sentAt }).eq("id", order.id);
    console.log(`[send-shipping-email] sent order=${order.order_number} resend_id=${result.data?.id}`);
    return json({ ok: true, sent_at: sentAt, resend_id: result.data?.id ?? null, link });
  } catch (e) {
    console.error("[send-shipping-email] error", e);
    return json({ ok: false, error: e instanceof Error ? e.message : "UNKNOWN" }, 500);
  }
});
