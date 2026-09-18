import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.1.2";

// ============================================================================
// notify-admin — alertes vendeur (Telegram + email)
// Contrat : POST { "type": "order_paid", "data": { ... } }
// Auth    : header x-internal-secret (appels serveur-à-serveur uniquement)
// ============================================================================

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

// 34.8 -> "34,80 €" (virgule + espace insécable)
const formatPriceFR = (amount: number): string => {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `${safe.toFixed(2).replace(".", ",")} €`;
};

// Date/heure fuseau Europe/Paris : "18/09/2026 à 09:42"
const formatDateParis = (iso?: string | null): string => {
  const d = iso ? new Date(iso) : new Date();
  const valid = isNaN(d.getTime()) ? new Date() : d;
  const date = valid.toLocaleDateString("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const time = valid.toLocaleTimeString("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} à ${time}`;
};

interface OrderPaidItem {
  part_name?: string;
  name?: string;
  quantity?: number;
  unit_price?: number;
  price?: number;
}

interface OrderPaidData {
  orderNumber?: string;
  totalTTC?: number;
  customerFirstName?: string;
  customerLastName?: string;
  customerEmail?: string;
  customerPhone?: string | null;
  deliveryMethod?: string;
  deliveryPrice?: number;
  items?: OrderPaidItem[];
  paidAt?: string | null;
  notes?: string | null;
  address?: { street?: string; postalCode?: string; city?: string };
}

// ---------------------------------------------------------------------------
// Telegram
// ---------------------------------------------------------------------------
const sendTelegram = async (d: Required<OrderPaidData>): Promise<{ ok: boolean; error?: string }> => {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
  if (!token || !chatId) {
    return { ok: false, error: "TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID manquant" };
  }

  const itemsLines = d.items
    .map((it) => `• ${it.quantity}× ${escapeHtml(it.part_name || it.name || "Article")}`)
    .join("\n");

  const text = [
    `💰 <b>NOUVELLE VENTE</b>`,
    ``,
    `<b>${formatPriceFR(d.totalTTC)}</b>`,
    `Commande <code>${escapeHtml(d.orderNumber)}</code>`,
    `${escapeHtml(`${d.customerFirstName} ${d.customerLastName}`.trim() || "Client")} · ${escapeHtml(d.customerEmail)}`,
    ``,
    itemsLines,
    ``,
    `<i>${formatDateParis(d.paidAt)}</i>`,
  ].join("\n");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [[
            { text: "📦 Ouvrir la commande", url: "https://piecestrottinettes.fr/admin" },
          ]],
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body?.ok === false) {
      return { ok: false, error: `Telegram ${res.status}: ${JSON.stringify(body)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Telegram fetch failed" };
  }
};

// ---------------------------------------------------------------------------
// Email vendeur (Resend)
// ---------------------------------------------------------------------------
const buildSellerEmailHtml = (d: Required<OrderPaidData>): string => {
  const itemsRows = d.items
    .map((it) => {
      const name = escapeHtml(it.part_name || it.name || "Article");
      const qty = it.quantity;
      const pu = it.unit_price ?? it.price ?? 0;
      return `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e8e4e0;font-size:14px;color:#2C2C2C;">${name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e8e4e0;text-align:center;font-size:14px;color:#666;">x${qty}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e8e4e0;text-align:right;font-size:14px;color:#666;">${formatPriceFR(pu)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e8e4e0;text-align:right;font-size:14px;font-weight:600;color:#2C2C2C;">${formatPriceFR(pu * qty)}</td>
      </tr>`;
    })
    .join("");

  const notesBlock = d.notes && d.notes.trim().length > 0 ? `
    <tr><td style="padding:0 32px 24px;">
      <div style="background:#FFF8E1;border:2px solid #FFC107;border-radius:10px;padding:16px 20px;">
        <p style="margin:0 0 8px;font-size:11px;color:#B8860B;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">📝 Recommandations client</p>
        <p style="margin:0;font-size:14px;color:#2C2C2C;line-height:1.5;white-space:pre-wrap;">${escapeHtml(d.notes)}</p>
      </div>
    </td></tr>` : "";

  const phoneLine = d.customerPhone ? `<br>${escapeHtml(d.customerPhone)}` : "";
  const addressBlock = d.address?.street
    ? `<br>${escapeHtml(d.address.street)}<br>${escapeHtml(d.address.postalCode || "")} ${escapeHtml(d.address.city || "")}`
    : "";

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F5F0E8;">
    <tr><td align="center" style="padding:30px 20px;">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e0e0e0;">
        <tr><td style="background:#4A7C59;padding:24px 32px;">
          <h1 style="margin:0;color:#FFFFFF;font-size:18px;letter-spacing:2px;">💰 NOUVELLE VENTE</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">${formatDateParis(d.paidAt)}</p>
        </td></tr>
        <tr><td style="padding:24px 32px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="font-size:13px;color:#666;">Commande</td>
              <td style="text-align:right;font-family:'Courier New',monospace;font-size:18px;color:#FF6600;font-weight:bold;">#${escapeHtml(d.orderNumber)}</td>
            </tr>
            <tr>
              <td style="padding-top:8px;font-size:13px;color:#666;">Total</td>
              <td style="padding-top:8px;text-align:right;font-size:18px;color:#2C2C2C;font-weight:bold;">${formatPriceFR(d.totalTTC)}</td>
            </tr>
            <tr>
              <td style="padding-top:8px;font-size:13px;color:#666;">Livraison</td>
              <td style="padding-top:8px;text-align:right;font-size:14px;color:#2C2C2C;">${escapeHtml(d.deliveryMethod)} — ${d.deliveryPrice > 0 ? formatPriceFR(d.deliveryPrice) : "Gratuite"}</td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 32px;"><div style="height:1px;background:#e8e4e0;"></div></td></tr>
        <tr><td style="padding:24px 32px;">
          <h3 style="margin:0 0 12px;font-size:13px;color:#4A7C59;text-transform:uppercase;letter-spacing:1px;">Client</h3>
          <p style="margin:0;font-size:15px;color:#2C2C2C;line-height:1.6;">
            <strong>${escapeHtml(`${d.customerFirstName} ${d.customerLastName}`.trim())}</strong><br>
            ${escapeHtml(d.customerEmail)}${phoneLine}${addressBlock}
          </p>
        </td></tr>
        ${notesBlock}
        <tr><td style="padding:0 32px;"><div style="height:1px;background:#e8e4e0;"></div></td></tr>
        <tr><td style="padding:24px 32px;">
          <h3 style="margin:0 0 12px;font-size:13px;color:#4A7C59;text-transform:uppercase;letter-spacing:1px;">Articles commandés</h3>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e8e4e0;border-radius:8px;overflow:hidden;">
            <thead><tr style="background:#F5F0E8;">
              <th style="padding:8px 12px;text-align:left;font-size:11px;color:#999;text-transform:uppercase;">Article</th>
              <th style="padding:8px 12px;text-align:center;font-size:11px;color:#999;text-transform:uppercase;">Qté</th>
              <th style="padding:8px 12px;text-align:right;font-size:11px;color:#999;text-transform:uppercase;">P.U.</th>
              <th style="padding:8px 12px;text-align:right;font-size:11px;color:#999;text-transform:uppercase;">Total</th>
            </tr></thead>
            <tbody>${itemsRows}</tbody>
          </table>
        </td></tr>
        <tr><td style="padding:0 32px 24px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#4A7C59;border-radius:8px;">
            <tr>
              <td style="padding:16px;font-size:18px;color:#fff;font-weight:bold;">Total encaissé</td>
              <td style="padding:16px;text-align:right;font-size:22px;color:#FF6600;font-weight:bold;">${formatPriceFR(d.totalTTC)}</td>
            </tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
};

const sendSellerEmail = async (d: Required<OrderPaidData>): Promise<{ ok: boolean; error?: string }> => {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    return { ok: false, error: "RESEND_API_KEY manquant" };
  }
  const toEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || "contact@piecestrottinettes.fr";

  try {
    const resend = new Resend(resendKey);
    const result = await resend.emails.send({
      from: "piecestrottinettes.fr <noreply@piecestrottinettes.fr>",
      to: [toEmail],
      subject: `💰 Vente ${formatPriceFR(d.totalTTC)} — Commande #${d.orderNumber}`,
      html: buildSellerEmailHtml(d),
    });
    if (result.error) {
      return { ok: false, error: `Resend: ${JSON.stringify(result.error)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Resend failed" };
  }
};

// ---------------------------------------------------------------------------
// new_message — Telegram uniquement (l'email existe déjà côté fonctions appelantes)
// ---------------------------------------------------------------------------
interface NewMessageData {
  customerName?: string | null;
  customerEmail?: string | null;
  orderNumber?: string | null;
  messageText?: string | null;
  sentAt?: string | null;
}

const MESSAGE_MAX_LEN = 300;

// Troncature AVANT échappement pour ne jamais couper une entité HTML
const truncateMessage = (raw: string): string => {
  const s = raw.trim();
  if (s.length <= MESSAGE_MAX_LEN) return s;
  return `${s.slice(0, MESSAGE_MAX_LEN)}…`;
};

const sendTelegramNewMessage = async (
  d: NewMessageData,
): Promise<{ ok: boolean; error?: string }> => {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
  if (!token || !chatId) {
    return { ok: false, error: "TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID manquant" };
  }

  const name = String(d.customerName ?? "").trim() || "Client";
  const email = String(d.customerEmail ?? "").trim();
  const orderNumber = String(d.orderNumber ?? "").trim();
  const message = truncateMessage(String(d.messageText ?? ""));

  const identity = email
    ? `${escapeHtml(name)} · <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>`
    : escapeHtml(name);

  const lines: string[] = [`💬 <b>NOUVEAU MESSAGE</b>`, ``, identity];
  // La ligne "Commande" n'apparaît que si le message est rattaché à une commande
  if (orderNumber) {
    lines.push(`Commande <code>${escapeHtml(orderNumber)}</code>`);
  }
  lines.push(``, `« ${escapeHtml(message)} »`, ``, `<i>${formatDateParis(d.sentAt)}</i>`);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: lines.join("\n"),
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [[
            { text: "💬 Répondre dans l'admin", url: "https://piecestrottinettes.fr/admin" },
          ]],
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body?.ok === false) {
      return { ok: false, error: `Telegram ${res.status}: ${JSON.stringify(body)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Telegram fetch failed" };
  }
};

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    if (req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    // Auth interne obligatoire (jamais d'appel public)
    const internalSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET");
    const provided = req.headers.get("x-internal-secret");
    if (!internalSecret || !provided || provided !== internalSecret) {
      console.error("[notify-admin] Unauthorized call");
      return json({ error: "Unauthorized" }, 401);
    }

    let payload: { type?: string; data?: OrderPaidData };
    try {
      payload = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const type = payload?.type;
    if (!type || typeof type !== "string") {
      return json({ error: "Field 'type' is required" }, 400);
    }

    switch (type) {
      case "order_paid": {
        const raw = payload.data ?? {};

        // Normalisation défensive : la notification ne doit JAMAIS planter
        // sur une donnée manquante — mieux vaut une alerte partielle que rien.
        const items: OrderPaidItem[] = Array.isArray(raw.items) ? raw.items : [];
        const data: Required<OrderPaidData> = {
          orderNumber: String(raw.orderNumber ?? "???"),
          totalTTC: Number(raw.totalTTC) || 0,
          customerFirstName: String(raw.customerFirstName ?? ""),
          customerLastName: String(raw.customerLastName ?? ""),
          customerEmail: String(raw.customerEmail ?? "inconnu"),
          customerPhone: raw.customerPhone ? String(raw.customerPhone) : "",
          deliveryMethod: String(raw.deliveryMethod ?? "Standard"),
          deliveryPrice: Number(raw.deliveryPrice) || 0,
          items: items.map((it) => ({
            part_name: String(it.part_name ?? it.name ?? "Article"),
            quantity: Math.max(1, Number(it.quantity) || 1),
            unit_price: Number(it.unit_price ?? it.price) || 0,
          })),
          paidAt: raw.paidAt ?? new Date().toISOString(),
          notes: raw.notes ? String(raw.notes) : "",
          address: {
            street: raw.address?.street ? String(raw.address.street) : "",
            postalCode: raw.address?.postalCode ? String(raw.address.postalCode) : "",
            city: raw.address?.city ? String(raw.address.city) : "",
          },
        };

        console.log(`[notify-admin] order_paid ${data.orderNumber} — ${data.totalTTC}€`);

        // Telegram + email en parallèle, chacun isolé : l'échec de l'un
        // n'empêche jamais l'autre.
        const [telegram, email] = await Promise.all([
          sendTelegram(data).catch((e) => ({ ok: false, error: String(e) })),
          sendSellerEmail(data).catch((e) => ({ ok: false, error: String(e) })),
        ]);

        if (!telegram.ok) console.error(`[notify-admin] Telegram KO: ${telegram.error}`);
        if (!email.ok) console.error(`[notify-admin] Email KO: ${email.error}`);

        return json({
          success: telegram.ok || email.ok,
          channels: { telegram, email },
        });
      }

      default:
        // Type inconnu : extensible plus tard (messages clients, stock bas…)
        console.log(`[notify-admin] Unknown type "${type}" — skipped`);
        return json({ skipped: true });
    }
  } catch (err) {
    // Dernier filet : on log mais on répond 200 pour ne jamais déclencher
    // de retry en cascade depuis l'appelant.
    console.error("[notify-admin] Unexpected error:", err);
    return json({ error: err instanceof Error ? err.message : "Unknown error" });
  }
});
