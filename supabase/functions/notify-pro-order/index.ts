import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.1.2";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// notify-pro-order — alerte Nolan quand un magasin pro valide son panier
// Appelée par la base (pro_t_commander, via pg_net) : POST { "order_id": "<uuid>" }
// Pas de secret : la fonction ne reçoit qu'un identifiant, relit la commande avec
// ses propres droits, n'accepte qu'une commande PRO de moins de 15 minutes et
// n'envoie qu'UNE fois (orders.pro_notified_at posé avant l'envoi).
// Canaux : Telegram (bot du site) + mail (ADMIN_NOTIFICATION_EMAIL).
// L'admin, lui, lit la commande directement en base.
// ============================================================================

const VERSION = "notify-pro-order@2026-10-25";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const esc = (v: unknown) =>
  String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const eur = (n: number) => `${(Number.isFinite(n) ? n : 0).toFixed(2).replace(".", ",")} €`;

const dateFR = (d: string | null) =>
  d ? new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" }) : "à fixer";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { order_id?: string; ping?: boolean };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (body?.ping) return json({ ok: true, version: VERSION });

  const orderId = String(body?.order_id ?? "");
  if (!UUID_RE.test(orderId)) return json({ error: "order_id invalide" }, 400);

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return json({ error: "config manquante" }, 500);
  const db = createClient(url, key);

  // Réservation atomique : une seule alerte par commande, uniquement pour une commande pro récente.
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { data: order, error } = await db
    .from("orders")
    .update({ pro_notified_at: new Date().toISOString() })
    .eq("id", orderId)
    .not("pro_account_id", "is", null)
    .is("pro_notified_at", null)
    .gte("created_at", since)
    .select("id, order_number, customer_first_name, customer_phone, subtotal_ht, total_ttc, notes, retrait_prevu, pro_account_id")
    .maybeSingle();
  if (error) {
    console.error(`[${VERSION}] lecture commande: ${error.message}`);
    return json({ error: "lecture impossible" }, 500);
  }
  if (!order) return json({ ok: true, skipped: "deja notifiee, trop ancienne ou pas une commande pro" });

  const [{ data: items }, { data: pro }] = await Promise.all([
    db.from("order_items").select("part_id, part_name, quantity, unit_price").eq("order_id", order.id),
    db.from("pro_accounts").select("nom_magasin, contact_nom, telephone").eq("id", order.pro_account_id).maybeSingle(),
  ]);

  // Pièces à commander au fournisseur : quantité commandée au-delà du stock magasin.
  const partIds = (items ?? []).map((i) => i.part_id).filter(Boolean) as string[];
  const { data: stocks } = partIds.length
    ? await db.from("parts").select("id, stock_quantity").in("id", partIds)
    : { data: [] as { id: string; stock_quantity: number | null }[] };
  const stockOf = new Map((stocks ?? []).map((s) => [s.id, s.stock_quantity ?? 0]));

  const lignes = (items ?? []).map((i) => {
    const manque = Math.max(0, i.quantity - (i.part_id ? stockOf.get(i.part_id) ?? 0 : 0));
    return { ...i, manque };
  });
  const aCommander = lignes.filter((l) => l.manque > 0);
  const magasin = pro?.nom_magasin ?? order.customer_first_name ?? "Magasin";
  const tel = pro?.telephone ?? order.customer_phone ?? "";

  const text = [
    `🏪 <b>COMMANDE PRO</b> — ${esc(magasin)}`,
    ``,
    `<b>${eur(order.subtotal_ht)} HT</b> · ${eur(order.total_ttc)} TTC`,
    `Commande <code>${esc(order.order_number)}</code> · à régler au retrait`,
    `Retrait prévu : ${esc(dateFR(order.retrait_prevu))}`,
    tel ? `📞 ${esc(tel)}` : "",
    ``,
    ...lignes.map((l) => `• ${l.quantity}× ${esc(l.part_name)}${l.manque > 0 ? ` — <b>manque ${l.manque}</b>` : ""}`),
    ``,
    aCommander.length
      ? `🛒 <b>${aCommander.length} pièce(s) à commander au fournisseur</b>`
      : `✅ Tout est en stock au magasin`,
    order.notes ? `📝 ${esc(order.notes)}` : "",
  ].filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n");

  const sendTelegram = async () => {
    const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
    if (!token || !chatId) return { ok: false, error: "TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID manquant" };
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: [[{ text: "📦 Commandes pro", url: "https://piecestrottinettes.fr/admin" }]] },
      }),
    });
    return res.ok ? { ok: true } : { ok: false, error: `Telegram ${res.status}` };
  };

  const sendEmail = async () => {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) return { ok: false, error: "RESEND_API_KEY manquant" };
    const to = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || "contact@piecestrottinettes.fr";
    const rows = lignes
      .map((l) => `<tr><td style="padding:6px 8px">${l.quantity}×</td><td style="padding:6px 8px">${esc(l.part_name)}</td><td style="padding:6px 8px;text-align:right">${eur(l.unit_price * l.quantity)} HT</td><td style="padding:6px 8px;color:#DC2626">${l.manque > 0 ? `manque ${l.manque}` : ""}</td></tr>`)
      .join("");
    const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1A1A1A;max-width:560px">
      <h2 style="margin:0 0 4px">Commande pro — ${esc(magasin)}</h2>
      <p style="margin:0 0 12px">${esc(order.order_number)} · <b>${eur(order.subtotal_ht)} HT</b> (${eur(order.total_ttc)} TTC) · à régler au retrait<br>Retrait prévu : ${esc(dateFR(order.retrait_prevu))}${tel ? ` · ${esc(tel)}` : ""}</p>
      <table style="border-collapse:collapse;width:100%;background:#FAFAF8">${rows}</table>
      <p style="margin:12px 0 0">${aCommander.length ? `<b>${aCommander.length} pièce(s) à commander au fournisseur.</b>` : "Tout est en stock au magasin."}</p>
      ${order.notes ? `<p>Note du magasin : ${esc(order.notes)}</p>` : ""}
      <p><a href="https://piecestrottinettes.fr/admin" style="color:#4A7C59">Ouvrir l'admin</a></p></div>`;
    const r = await new Resend(resendKey).emails.send({
      from: "piecestrottinettes.fr <noreply@piecestrottinettes.fr>",
      to: [to],
      subject: `🏪 Commande pro ${eur(order.subtotal_ht)} HT — ${magasin} (${order.order_number})`,
      html,
    });
    return r.error ? { ok: false, error: JSON.stringify(r.error) } : { ok: true };
  };

  const [telegram, email] = await Promise.all([
    sendTelegram().catch((e) => ({ ok: false, error: String(e) })),
    sendEmail().catch((e) => ({ ok: false, error: String(e) })),
  ]);
  if (!telegram.ok) console.error(`[${VERSION}] Telegram KO: ${telegram.error}`);
  if (!email.ok) console.error(`[${VERSION}] Email KO: ${email.error}`);
  console.log(`[${VERSION}] ${order.order_number} — telegram ${telegram.ok} · email ${email.ok}`);

  return json({ ok: telegram.ok || email.ok, order_number: order.order_number, channels: { telegram, email } });
});
