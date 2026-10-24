// Programme ambassadeurs (24/10/2026) — mails aux créateurs. Doc : claude/PT-lot-plateforme-createurs.md
// - action "ping"        : version, rien n'est lu ni envoyé.
// - action "envoyer"     : ADMIN seulement (jeton + rôle admin) ; { ambassador_id, sujet, corps } → mail au créateur,
//                          réponse dans contact@ (reply_to), trace dans public.ambassador_events (type "mail").
// - action "apercu"      : nombre de relevés du mois précédent encore à envoyer, rien n'est envoyé.
// - action "releves"     : appelée par pg_cron le 2 du mois ; envoie à chaque créateur (email renseigné, commission > 0)
//                          son relevé du mois précédent. Rejouable sans risque : un relevé par créateur et par mois
//                          (clé primaire public.ambassador_statements).
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const VERSION = "send-ambassador-email@2026-10-24";
const SITE = "https://piecestrottinettes.fr";
const FROM = "Nolan · piecestrottinettes.fr <contact@piecestrottinettes.fr>";
const REPLY_TO = "contact@piecestrottinettes.fr";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const eur = (n: number) => `${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0)} €`;
const lienAuto = (s: string) => s.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#4A7C59">$1</a>');

function gabarit(titre: string, contenuHTML: string) {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#F5F0E8;font-family:Arial,Helvetica,sans-serif;color:#1A1A1A">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#1A1A1A;padding:18px 24px;color:#ffffff;font-weight:900;font-size:18px;letter-spacing:.5px;text-transform:uppercase">piecestrottinettes<span style="color:#FF6600">.fr</span> · Ambassadeurs</td></tr>
<tr><td style="padding:24px;font-size:16px;line-height:1.55">
<p style="margin:0 0 14px;font-size:20px;font-weight:900;text-transform:uppercase">${esc(titre)}</p>
${contenuHTML}
</td></tr>
<tr><td style="padding:16px 24px;background:#FAFAF8;color:#5E625C;font-size:14px">Ton espace créateur : <a href="${SITE}/ambassadeur" style="color:#4A7C59">${SITE.replace("https://", "")}/ambassadeur</a> · Une question : réponds simplement à ce mail.</td></tr>
</table></td></tr></table></body></html>`;
}

// API REST Resend (champ reply_to documenté) : pas de dépendance au nom d'option du SDK.
async function envoyerMail(key: string, msg: { to: string; subject: string; html: string; text?: string }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, reply_to: REPLY_TO, ...msg }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { id: null as string | null, error: String(data?.message ?? `HTTP ${res.status}`) };
  return { id: (data?.id ?? null) as string | null, error: null as string | null };
}

const texteEnHTML = (corps: string) =>
  corps.split(/\n{2,}/).map((p) => `<p style="margin:0 0 12px">${lienAuto(esc(p)).replace(/\n/g, "<br>")}</p>`).join("");

const moisPrecedent = () => {
  const d = new Date();
  const p = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1));
  return { periode: p.toISOString().slice(0, 7), debut: p.toISOString(), fin: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString(),
    libelle: p.toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }) };
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* corps vide */ }
  const action = String(body.action ?? "ping");
  if (action === "ping") return json({ ok: true, version: VERSION });

  const url = Deno.env.get("SUPABASE_URL")!;
  const db = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const resendKey = Deno.env.get("RESEND_API_KEY");

  /* ── Envoi d'un mail par l'admin ── */
  if (action === "envoyer") {
    const auth = req.headers.get("Authorization") ?? "";
    const token = auth.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Connexion requise" }, 401);
    const { data: u } = await db.auth.getUser(token);
    const userId = u?.user?.id;
    if (!userId) return json({ error: "Session invalide" }, 401);
    const { data: role } = await db.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!role) return json({ error: "Réservé aux admins" }, 403);

    const ambassadorId = String(body.ambassador_id ?? "");
    const sujet = String(body.sujet ?? "").trim().slice(0, 150);
    const corps = String(body.corps ?? "").trim().slice(0, 5000);
    if (!ambassadorId || !sujet || !corps) return json({ error: "Sujet et message obligatoires" }, 400);

    const { data: a, error: aErr } = await db.from("ambassadors").select("id, nom, email").eq("id", ambassadorId).maybeSingle();
    if (aErr || !a) return json({ error: "Créateur introuvable" }, 404);
    if (!a.email) return json({ error: "Ce créateur n'a pas d'email : renseigne-le dans sa fiche" }, 400);
    if (!resendKey) return json({ error: "Clé d'envoi absente côté serveur" }, 500);

    const r = await envoyerMail(resendKey, { to: a.email, subject: sujet, html: gabarit(sujet, texteEnHTML(corps)), text: corps });
    if (r.error) return json({ error: `Envoi refusé : ${r.error}` }, 502);

    await db.from("ambassador_events").insert({ ambassador_id: a.id, type: "mail", titre: `Mail envoyé : ${sujet}`, detail: corps.slice(0, 2000), auteur: "admin" });
    return json({ ok: true, id: r.id });
  }

  /* ── Relevés mensuels ── */
  if (action === "apercu" || action === "releves") {
    const m = moisPrecedent();
    const { data: stats, error } = await db.from("ambassador_stats").select("*");
    if (error) return json({ error: error.message }, 500);
    const { data: deja } = await db.from("ambassador_statements").select("ambassador_id").eq("periode", m.periode);
    const dejaIds = new Set((deja ?? []).map((d: { ambassador_id: string }) => d.ambassador_id));
    // deno-lint-ignore no-explicit-any
    const dus = (stats ?? []).filter((s: any) => s.email && Number(s.taux_commission) > 0 && ["test", "actif", "pause"].includes(s.statut) && !dejaIds.has(s.ambassador_id));
    if (action === "apercu") return json({ ok: true, version: VERSION, periode: m.periode, a_envoyer: dus.length });
    if (!resendKey) return json({ error: "Clé d'envoi absente côté serveur" }, 500);

    let envoyes = 0; const erreurs: string[] = [];
    for (const s of dus) {
      const { data: codesRows } = await db.from("promo_codes").select("code").eq("ambassador_id", s.ambassador_id);
      const codes = (codesRows ?? []).map((c: { code: string }) => c.code);
      const [{ count: clics }, { count: ventes }] = await Promise.all([
        db.from("ref_visits").select("id", { count: "exact", head: true }).in("code", codes.length ? codes : ["-"]).gte("created_at", m.debut).lt("created_at", m.fin),
        db.from("orders").select("id", { count: "exact", head: true }).in("promo_code", codes.length ? codes : ["-"])
          .in("status", ["paid", "processing", "shipped", "delivered"]).gte("created_at", m.debut).lt("created_at", m.fin),
      ]);
      const aVerser = Math.max(0, Number(s.commission_acquise) - Number(s.deja_paye));
      // Réserve la ligne AVANT l'envoi : un second appel concurrent échoue sur la clé primaire.
      const { error: insErr } = await db.from("ambassador_statements").insert({ ambassador_id: s.ambassador_id, periode: m.periode });
      if (insErr) continue;
      const html = gabarit(`Ton relevé de ${m.libelle}`, `
<p style="margin:0 0 14px">Salut ${esc(s.nom)}, voici ce que ton code a donné en ${esc(m.libelle)}.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 16px">
<tr><td style="padding:10px 0;border-bottom:1px solid #eee">Clics sur ton lien</td><td align="right" style="font-weight:900">${clics ?? 0}</td></tr>
<tr><td style="padding:10px 0;border-bottom:1px solid #eee">Commandes avec ton code</td><td align="right" style="font-weight:900">${ventes ?? 0}</td></tr>
<tr><td style="padding:10px 0;border-bottom:1px solid #eee">Commission en attente (moins de 30 jours)</td><td align="right" style="font-weight:900">${eur(Number(s.commission_en_attente))}</td></tr>
<tr><td style="padding:10px 0">Commission à te verser</td><td align="right" style="font-weight:900;color:#4A7C59">${eur(aVerser)}</td></tr>
</table>
<p style="margin:0 0 12px">${aVerser >= 20 ? "Le versement part ce mois-ci sur ton PayPal." : "Le versement part dès que tu atteins 20 €."}</p>
<p style="margin:0">Ton code : <b>${esc(String(s.codes_actifs ?? "").split(",")[0] || "—")}</b> · ton lien : <a href="${SITE}/?ref=${encodeURIComponent(String(s.codes_actifs ?? "").split(",")[0]?.trim() || "")}" style="color:#4A7C59">${SITE.replace("https://", "")}/?ref=${esc(String(s.codes_actifs ?? "").split(",")[0]?.trim() || "")}</a></p>`);
      const r = await envoyerMail(resendKey, { to: s.email, subject: `Ton relevé ambassadeur — ${m.libelle}`, html });
      if (r.error) {
        await db.from("ambassador_statements").delete().eq("ambassador_id", s.ambassador_id).eq("periode", m.periode);
        erreurs.push(`${s.nom} : ${r.error}`);
        continue;
      }
      await db.from("ambassador_statements").update({ resend_id: r.id }).eq("ambassador_id", s.ambassador_id).eq("periode", m.periode);
      await db.from("ambassador_events").insert({ ambassador_id: s.ambassador_id, type: "releve", titre: `Relevé ${m.periode} envoyé`, detail: `Clics ${clics ?? 0} · commandes ${ventes ?? 0} · à verser ${eur(aVerser)}`, auteur: "systeme" });
      envoyes++;
    }
    return json({ ok: true, periode: m.periode, envoyes, erreurs });
  }

  return json({ error: "Action inconnue" }, 400);
});
