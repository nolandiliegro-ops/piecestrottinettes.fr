import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// telegram-webhook — boutons de statut sous les alertes de vente
// Contrat : POST Telegram update (callback_query uniquement)
// callback_data : "s:<action>:<order_number>"  (≤ 64 octets)
// Sécurité : X-Telegram-Bot-Api-Secret-Token == TELEGRAM_WEBHOOK_SECRET
//            ET callback_query.from.id == TELEGRAM_CHAT_ID
// Jamais de throw : toute erreur est loggée, la réponse est toujours 200.
// AUCUN appel à l'API Stripe : l'annulation = remboursement manuel.
// ============================================================================

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-telegram-bot-api-secret-token",
};

const escapeHtml = (input: unknown): string =>
  String(input ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatDateParis = (): string => {
  const now = new Date();
  const date = now.toLocaleDateString("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
  });
  const time = now.toLocaleTimeString("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} ${time}`;
};

// Comparaison en temps constant (jamais de court-circuit sur la longueur
// avant d'avoir balayé toute la chaîne).
const safeEqual = (a: string, b: string): boolean => {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  const max = Math.max(ea.length, eb.length);
  let diff = ea.length === eb.length ? 0 : 1;
  for (let i = 0; i < max; i++) {
    diff |= (ea[i % Math.max(ea.length, 1)] ?? 0) ^ (eb[i % Math.max(eb.length, 1)] ?? 0);
  }
  return diff === 0;
};

// ---------------------------------------------------------------------------
// Appels Bot API
// ---------------------------------------------------------------------------
const tgCall = async (
  method: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string }> => {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (!token) return { ok: false, error: "TELEGRAM_BOT_TOKEN manquant" };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body?.ok === false) {
      return { ok: false, error: `Telegram ${method} ${res.status}: ${JSON.stringify(body)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : `${method} fetch failed` };
  }
};

// ---------------------------------------------------------------------------
// Actions autorisées : transitions + libellés
// ---------------------------------------------------------------------------
type Action = "processing" | "shipped" | "cancelled";

const TRANSITIONS: Record<Action, string[]> = {
  processing: ["paid"],
  shipped: ["processing", "paid"],
  cancelled: ["paid", "processing"],
};

const STATUS_LABEL: Record<Action, string> = {
  processing: "En préparation",
  shipped: "Expédié",
  cancelled: "Annulé",
};

const TOAST_OK: Record<Action, string> = {
  processing: "✅ Commande passée en préparation",
  shipped: "✅ Commande passée en expédié",
  cancelled: "❌ Annulé en base — REMBOURSE sur Stripe",
};

const ADMIN_URL = "https://piecestrottinettes.fr/admin";
const STRIPE_URL = "https://dashboard.stripe.com/payments";

// Construit un callback_data et garantit la limite de 64 octets de Telegram.
const mkCallbackData = (action: Action, orderNumber: string): string | null => {
  const cb = `s:${action}:${orderNumber}`;
  return new TextEncoder().encode(cb).length <= 64 ? cb : null;
};

// Clavier à laisser après un changement de statut réussi.
const keyboardAfter = (action: Action, orderNumber: string): Record<string, unknown> => {
  const urlRow = [{ text: "📦 Ouvrir la commande", url: ADMIN_URL }];
  if (action === "cancelled") {
    return { inline_keyboard: [urlRow, [{ text: "💳 Ouvrir Stripe", url: STRIPE_URL }]] };
  }
  if (action === "shipped") {
    return { inline_keyboard: [urlRow] };
  }
  // processing : expédier ou annuler restent pertinents
  const row: Array<Record<string, unknown>> = [];
  const shipped = mkCallbackData("shipped", orderNumber);
  const cancelled = mkCallbackData("cancelled", orderNumber);
  if (shipped) row.push({ text: "🚚 Expédié", callback_data: shipped });
  if (cancelled) row.push({ text: "❌ Annulé", callback_data: cancelled });
  return { inline_keyboard: row.length > 0 ? [urlRow, row] : [urlRow] };
};

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
serve(async (req) => {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  try {
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    // Contrôle 1 : token secret du webhook
    const expectedSecret = Deno.env.get("TELEGRAM_WEBHOOK_SECRET") ?? "";
    const providedSecret = req.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
    if (!expectedSecret || !providedSecret || !safeEqual(providedSecret, expectedSecret)) {
      console.error("[telegram-webhook] Bad secret token");
      return json({ error: "Unauthorized" }, 401);
    }

    let update: Record<string, unknown>;
    try {
      update = await req.json();
    } catch {
      return json({ skipped: true });
    }

    // Seuls les callback_query nous intéressent (boutons)
    const callback = update?.callback_query as
      | {
          id?: string;
          from?: { id?: number };
          data?: string;
          message?: { chat?: { id?: number }; message_id?: number; text?: string };
        }
      | undefined;
    if (!callback?.id || !callback.data || !callback.message?.chat?.id) {
      return json({ skipped: true });
    }

    // Contrôle 2 : l'émetteur doit être le vendeur
    const expectedChatId = Deno.env.get("TELEGRAM_CHAT_ID") ?? "";
    if (!expectedChatId || String(callback.from?.id ?? "") !== expectedChatId) {
      console.error(`[telegram-webhook] Callback from unknown user ${callback.from?.id ?? "?"}`);
      return json({ ignored: true });
    }

    const chatId = callback.message.chat.id;
    const messageId = callback.message.message_id as number;
    const answer = (text: string) =>
      tgCall("answerCallbackQuery", { callback_query_id: callback.id, text, show_alert: true });

    // Parsing du callback_data : "s:<action>:<order_number>"
    const m = /^s:(processing|shipped|cancelled):(.+)$/.exec(callback.data);
    if (!m) {
      await answer("❌ Action inconnue");
      return json({ ok: true, result: "unknown_action" });
    }
    const action = m[1] as Action;
    const orderNumber = m[2];

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) {
      console.error("[telegram-webhook] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants");
      await answer("❌ Erreur configuration");
      return json({ error: "missing env" });
    }
    const supabase = createClient(supabaseUrl, serviceKey);

    // Lecture du statut actuel
    const { data: order, error: readErr } = await supabase
      .from("orders")
      .select("id, status")
      .eq("order_number", orderNumber)
      .maybeSingle();
    if (readErr) {
      console.error(`[telegram-webhook] Read error ${orderNumber}: ${readErr.message}`);
      await answer("❌ Erreur lecture commande");
      return json({ error: "db read failed" });
    }
    if (!order) {
      await answer("❌ Commande introuvable");
      return json({ ok: true, result: "not_found" });
    }

    // Garde atomique : la transition ne s'applique que depuis les statuts attendus
    const expectedFrom = TRANSITIONS[action];
    const { data: updated, error: upErr } = await supabase
      .from("orders")
      .update({ status: action })
      .eq("id", order.id)
      .in("status", expectedFrom)
      .select("id");
    if (upErr) {
      console.error(`[telegram-webhook] Update error ${orderNumber}: ${upErr.message}`);
      await answer("❌ Erreur mise à jour");
      return json({ error: "db update failed" });
    }
    if (!updated || updated.length === 0) {
      await answer("⚠️ Déjà traité");
      return json({ ok: true, result: "already_processed", currentStatus: order.status });
    }

    // Succès : UN SEUL answerCallbackQuery, portant le résultat réel
    await answer(TOAST_OK[action]);

    // Réécriture du message d'origine
    const original = String(callback.message.text ?? "");
    const statusLines: string[] = [
      ``,
      `✅ Statut : ${escapeHtml(STATUS_LABEL[action])} · ${formatDateParis()}`,
    ];
    if (action === "cancelled") {
      statusLines.push(`⚠️ Remboursement Stripe à faire à la main`);
    }
    const edited = `${escapeHtml(original)}${statusLines.join("\n")}`;

    const edit = await tgCall("editMessageText", {
      chat_id: chatId,
      message_id: messageId,
      text: edited,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: keyboardAfter(action, orderNumber),
    });
    if (!edit.ok) {
      console.error(`[telegram-webhook] editMessageText KO: ${edit.error}`);
      // Filet : retirer au moins les boutons devenus obsolètes
      const mk = await tgCall("editMessageReplyMarkup", {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: keyboardAfter(action, orderNumber),
      });
      if (!mk.ok) console.error(`[telegram-webhook] editMessageReplyMarkup KO: ${mk.error}`);
    }

    console.log(`[telegram-webhook] ${orderNumber} -> ${action}`);
    return json({ ok: true, result: "updated", status: action });
  } catch (err) {
    // Dernier filet : jamais de throw, jamais de rejeu Telegram.
    console.error("[telegram-webhook] Unexpected error:", err);
    return json({ error: err instanceof Error ? err.message : "Unknown error" });
  }
});
