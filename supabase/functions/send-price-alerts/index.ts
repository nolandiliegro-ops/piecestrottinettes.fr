// Alertes de prix des trottinettes (24/10/2026, robot de prix — claude/robot-prix-plan.md).
// Appelée chaque nuit par pg_cron (job « pt-prix-alertes », 02:47 UTC) juste après la collecte des prix.
// - Lit les alertes dues via public.price_alerts_due() (service_role) : premier prix relevé, ou baisse
//   d'au moins 5 € ET 1 % sous le dernier prix connu de l'inscrit. Rien d'autre n'est lisible.
// - Idempotente : chaque mail envoyé pose last_price_notified / last_notified_at (price_alert_mark_sent) ;
//   un 2e appel ne renvoie rien. Sans secret : un appel extérieur ne peut que déclencher ce même envoi.
// - action "ping" : version, rien n'est lu ni envoyé. action "apercu" : nombre d'alertes dues, rien n'est envoyé.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@4.1.2";

const VERSION = "send-price-alerts@2026-10-24";
const SITE = "https://piecestrottinettes.fr";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const eur = (n: number) => `${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(n)} €`;

// Nom lisible de la boutique (doublon volontaire et minimal de src/config/partners.ts).
const SHOPS: Record<string, string> = {
  "teverunshop.com": "Teverun Europe", "naveetech.fr": "NAVEE France", "www.iscooter.fr": "iScooter France",
  "www.isinwheel.fr": "isinwheel France", "o-otd.com": "OOTD", "www.haloknights.com": "HALO KNIGHT Europe",
  "fr.engwe.com": "ENGWE France", "dualtron-store.com": "Dualtron Store", "www.mi.com": "Xiaomi France",
};

interface Due {
  alert_id: string; email: string; unsubscribe_token: string; scooter_name: string; scooter_slug: string;
  old_price: number | null; new_price: number; merchant: string | null; kind: "premier_prix" | "baisse";
}

function alertHTML(d: Due) {
  const ficheUrl = `${SITE}/scooter/${encodeURIComponent(d.scooter_slug)}#ou-acheter`;
  const stopUrl = `${SITE}/alerte-prix/stop?t=${d.unsubscribe_token}`;
  const shop = d.merchant ? SHOPS[d.merchant] ?? d.merchant : null;
  const drop = d.kind === "baisse" && d.old_price != null ? Number(d.old_price) - Number(d.new_price) : 0;
  const headline = d.kind === "baisse" ? `Le prix baisse de ${eur(drop)}` : "Un prix vient d'être relevé";
  const priceLine = d.kind === "baisse" && d.old_price != null
    ? `<span style="text-decoration:line-through;color:#6B7280;font-size:18px;">${eur(Number(d.old_price))}</span>&nbsp;&nbsp;<span style="font-size:32px;font-weight:900;font-style:italic;">${eur(Number(d.new_price))}</span>`
    : `<span style="font-size:32px;font-weight:900;font-style:italic;">${eur(Number(d.new_price))}</span>`;
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1A1A1A;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F5F0E8;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#FFFFFF;border-radius:16px;overflow:hidden;">
<tr><td style="padding:28px 28px 8px;">
  <p style="margin:0;font-size:14px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#4A7C59;">Alerte de prix</p>
  <h1 style="margin:8px 0 0;font-size:24px;line-height:1.2;font-weight:900;text-transform:uppercase;">${esc(headline)}</h1>
  <p style="margin:12px 0 0;font-size:16px;">${esc(d.scooter_name)}${shop ? ` chez ${esc(shop)}` : ""}</p>
  <p style="margin:16px 0 0;">${priceLine}</p>
  <p style="margin:6px 0 0;font-size:14px;color:#6B7280;">Prix relevé cette nuit sur la boutique. Il peut changer : vérifie-le avant d'acheter.</p>
</td></tr>
<tr><td style="padding:20px 28px 28px;">
  <a href="${esc(ficheUrl)}" target="_blank" style="display:inline-block;background:#1A1A1A;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:700;padding:16px 32px;border-radius:10px;">Voir l'offre</a>
</td></tr>
<tr><td style="padding:16px 28px 24px;border-top:1px solid #E7E1D6;font-size:14px;color:#6B7280;">
  Tu reçois ce mail parce que tu as demandé une alerte de prix sur piecestrottinettes.fr.
  <a href="${esc(stopUrl)}" style="color:#4A7C59;">Ne plus recevoir d'alerte pour cette trottinette</a>.
</td></tr>
</table></td></tr></table></body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  let action = "envoi";
  try { action = ((await req.json())?.action ?? "envoi") as string; } catch { /* corps vide = envoi */ }
  if (action === "ping") return json({ ok: true, version: VERSION });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data, error } = await supabase.rpc("price_alerts_due");
  if (error) return json({ ok: false, version: VERSION, error: error.message }, 500);
  const due = (data ?? []) as Due[];
  if (action === "apercu") return json({ ok: true, version: VERSION, dues: due.length });
  if (action !== "envoi") return json({ ok: false, error: "ACTION_INCONNUE" }, 400);

  const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
  let sent = 0, failed = 0;
  for (const d of due) {
    const subject = d.kind === "baisse"
      ? `${d.scooter_name} : le prix baisse à ${eur(Number(d.new_price))}`
      : `${d.scooter_name} : prix relevé, ${eur(Number(d.new_price))}`;
    const stopUrl = `${SITE}/alerte-prix/stop?t=${d.unsubscribe_token}`;
    const result = await resend.emails.send({
      from: "piecestrottinettes.fr <contact@piecestrottinettes.fr>",
      to: [d.email],
      subject,
      html: alertHTML(d),
      headers: { "List-Unsubscribe": `<${stopUrl}>` },
    });
    if (result.error) { failed++; continue; }
    const { error: markErr } = await supabase.rpc("price_alert_mark_sent", { p_alert_id: d.alert_id, p_price: d.new_price });
    if (markErr) failed++; else sent++;
  }
  return json({ ok: true, version: VERSION, dues: due.length, sent, failed });
});
