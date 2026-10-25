// Badge rider IA (25/10/2026) — doc : claude/PT-lot-avatar-ia.md
// Un rider connecté envoie un selfie (recadré carré par le site) → Google Gemini (Nano Banana 2) renvoie
// 2 propositions de badge dans le style « n0n0.ride ». Le pseudo est posé ensuite par le site (jamais par l'IA).
// - action "ping"     : version + clé branchée ou non. Rien n'est appelé chez Google.
// - action "generer"  : connexion requise ; quota 3 essais par compte (clé primaire user_id + n en base, admins
//                       illimités), plafond global AVATAR_IA_MAX_PAR_JOUR (60 par défaut). Le selfie n'est JAMAIS
//                       stocké : il part chez Google et les images reviennent en base64 au navigateur.
// Secret dédié : GEMINI_API_KEY_AVATAR (clé à plafond, réservée à cet usage). Modèle : AVATAR_IA_MODEL (défaut ci-dessous).
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const VERSION = "generate-rider-avatar@2026-10-25b";
const MODELE_DEFAUT = "gemini-3.1-flash-image";
const QUOTA = 3;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const STYLE = `Turn the person in this photo into a bold illustrated rider avatar badge for an electric kick scooter community.
Keep the person clearly recognizable: same face shape, skin tone, eye shape, eyebrows, nose, beard or no beard, and expression.
Illustration style: clean cartoon illustration with thick dark outlines, cel shading, saturated colors, crisp and sharp.
Framing: head and shoulders, centered, facing the viewer, filling the upper two thirds of the badge.
Badge: a perfect circle. Inside the circle, a white background with thin orange sunburst rays radiating from behind the head.
The circle is framed by a thick royal-blue ring, then a thin white ring, then an outer orange ring.
The lower part of the circle is a plain white band, left empty for a name to be added later.
Outside the circle the image is pure white. The badge contains only the illustration: no letters, no words, no logo.`;

const TENUE: Record<string, string> = {
  casque: "The person wears a modern open-face matte grey scooter helmet with a short peak, and dark sport sunglasses.",
  lunettes: "The person wears dark sport sunglasses and no helmet; their real hairstyle stays visible.",
  naturel: "The person wears no helmet and no sunglasses; their real hairstyle and eyes stay visible.",
};
const VARIANTES = [
  "Camera slightly from the left, confident half smile.",
  "Camera slightly from the right, relaxed cool expression.",
];

async function unBadge(cle: string, modele: string, mime: string, b64: string, tenue: string, variante: string) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modele}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": cle, "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ inlineData: { mimeType: mime, data: b64 } }, { text: `${STYLE}\n${tenue}\n${variante}` }] }],
      generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "1:1" } },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { erreur: String(data?.error?.message ?? `HTTP ${res.status}`).slice(0, 300) };
  // deno-lint-ignore no-explicit-any
  const parts: any[] = data?.candidates?.[0]?.content?.parts ?? [];
  const img = parts.find((p) => p?.inlineData?.data || p?.inline_data?.data);
  const d = img?.inlineData ?? img?.inline_data;
  if (!d?.data) return { erreur: `Aucune image renvoyée (${data?.candidates?.[0]?.finishReason ?? data?.promptFeedback?.blockReason ?? "raison inconnue"})` };
  return { image: `data:${d.mimeType ?? d.mime_type ?? "image/png"};base64,${d.data}` };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  // deno-lint-ignore no-explicit-any
  let body: any = {};
  try { body = await req.json(); } catch { return json({ error: "Corps JSON invalide" }, 400); }

  const cle = Deno.env.get("GEMINI_API_KEY_AVATAR") ?? "";
  const modele = Deno.env.get("AVATAR_IA_MODEL") || MODELE_DEFAUT;
  if (body.action === "ping") return json({ ok: true, version: VERSION, branche: !!cle, modele });
  if (body.action !== "generer") return json({ error: "Action inconnue" }, 400);

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Connexion requise" }, 401);
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: u } = await db.auth.getUser(token);
  const userId = u?.user?.id;
  if (!userId) return json({ error: "Session invalide" }, 401);

  if (!cle) return json({ error: "Le badge IA arrive bientôt.", code: "non_branche" }, 503);

  const m = String(body.image ?? "").match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return json({ error: "Photo invalide (JPG, PNG ou WEBP)" }, 400);
  if (m[2].length > 2_800_000) return json({ error: "Photo trop lourde" }, 400);
  if (body.accord !== true) return json({ error: "Accord requis pour traiter ta photo" }, 400);
  const tenue = TENUE[String(body.tenue)] ?? TENUE.casque;

  const { data: role } = await db.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  const admin = !!role;

  // Plafond global du jour (protège le budget même si le plafond Google n'est pas réglé).
  const maxJour = Number(Deno.env.get("AVATAR_IA_MAX_PAR_JOUR") ?? "60") || 60;
  const debutJour = new Date(); debutJour.setUTCHours(0, 0, 0, 0);
  const { count: duJour } = await db.from("avatar_ia_essais").select("*", { count: "exact", head: true }).gte("created_at", debutJour.toISOString());
  if ((duJour ?? 0) >= maxJour) return json({ error: "Beaucoup de demandes aujourd'hui : réessaie demain.", code: "plafond_jour" }, 429);

  // Réservation de l'essai AVANT l'appel payant : la clé primaire (user_id, n) empêche toute course.
  const { data: deja } = await db.from("avatar_ia_essais").select("n").eq("user_id", userId).order("n", { ascending: false }).limit(1);
  const n = (deja?.[0]?.n ?? 0) + 1;
  if (!admin && n > QUOTA) return json({ error: `Tu as utilisé tes ${QUOTA} essais.`, code: "quota", restants: 0 }, 429);
  const { error: errRes } = await db.from("avatar_ia_essais").insert({ user_id: userId, n, admin });
  if (errRes) return json({ error: "Une génération est déjà en cours, réessaie dans un instant." }, 409);

  const res = await Promise.all(VARIANTES.map((v) => unBadge(cle, modele, m[1], m[2], tenue, v)));
  const images = res.map((r) => r.image).filter(Boolean) as string[];
  const erreurs = res.map((r) => r.erreur).filter(Boolean);

  if (!images.length) {
    // Aucun badge : l'essai est rendu au rider (rien n'a été livré).
    await db.from("avatar_ia_essais").delete().eq("user_id", userId).eq("n", n);
    console.error("[generate-rider-avatar]", erreurs);
    // Refus côté compte Google (quota, facturation, clé) : ce n'est pas la faute de la photo du rider.
    if (erreurs.some((e) => /quota|billing|exhausted|api key|permission|denied|not available/i.test(String(e)))) {
      return json({ error: "Le badge IA est momentanément indisponible. Réessaie un peu plus tard.", code: "service", detail: erreurs[0] ?? null }, 503);
    }
    return json({ error: "La création n'a pas marché avec cette photo. Essaie une photo de face, bien éclairée.", detail: erreurs[0] ?? null }, 502);
  }
  await db.from("avatar_ia_essais").update({ images: images.length }).eq("user_id", userId).eq("n", n);
  return json({ ok: true, images, restants: admin ? null : Math.max(0, QUOTA - n) });
});
