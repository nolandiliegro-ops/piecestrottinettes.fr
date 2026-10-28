// SKOT — interrupteur, contexte de page et appel serveur (24/10/2026).
// Spec : documents projet claude/skot-bot-passation-24-10.md + claude/skot-ambition-24-10.md.
import { supabase } from "@/integrations/supabase/client";

/** Ouverture publique du widget. Tant que false : visible seulement avec ?skot=1 (par onglet), ?skot=0 le referme. */
export const SKOT_PUBLIC = true; // 24/10 : Nolan met SKOT en public (banc 24/26 vert à 16h30).

export function skotEnabled(): boolean {
  if (SKOT_PUBLIC) return true;
  if (typeof window === "undefined") return false;
  try {
    const flag = new URLSearchParams(window.location.search).get("skot");
    if (flag === "1") window.sessionStorage.setItem("pt-skot", "1");
    if (flag === "0") window.sessionStorage.removeItem("pt-skot");
    return window.sessionStorage.getItem("pt-skot") === "1";
  } catch {
    return false;
  }
}

/** Pages où SKOT ne s'affiche jamais : on ne distrait pas au moment de payer, ni dans l'admin. */
export function skotHiddenOn(pathname: string): boolean {
  return /^\/(panier|checkout|payment-success|admin|pro)(\/|$)/.test(pathname);
}

export type SkotPage = { type: "piece" | "scooter" | "garage" | "autre"; slug?: string };

export function skotPageContext(pathname: string): SkotPage {
  const piece = /^\/piece\/([^/?#]+)/.exec(pathname);
  if (piece) return { type: "piece", slug: decodeURIComponent(piece[1]) };
  const scooter = /^\/scooter\/([^/?#]+)/.exec(pathname);
  if (scooter) return { type: "scooter", slug: decodeURIComponent(scooter[1]) };
  if (/^\/garage/.test(pathname)) return { type: "garage" };
  return { type: "autre" };
}

export interface SkotCard {
  /** part = pièce du catalogue ; scooter = trottinette conseillée (conseil d'achat, 25/10) */
  type: "part" | "scooter";
  id?: string;
  slug: string;
  name: string;
  price: number | null;
  image_url: string | null;
  in_stock?: boolean;
  stock_quantity?: number;
  delay?: string;
  url: string;
  compat?: "verified" | "unverified";
  // trottinette conseillée
  range_km?: number | null;
  max_speed_kmh?: number | null;
  weight_kg?: number | null;
  offer_url?: string | null;
  offer_host?: string | null;
}

export interface SkotReply {
  ok: boolean;
  reply: string;
  cards: SkotCard[];
  conversation_id?: string;
  /** Id de la réponse en base (sert au 👍/👎). */
  message_id?: string | null;
  error?: string;
}

const CONV_KEY = "pt-skot-conv";
export const getConversationId = () => { try { return window.sessionStorage.getItem(CONV_KEY); } catch { return null; } };
const setConversationId = (id: string) => { try { window.sessionStorage.setItem(CONV_KEY, id); } catch { /* sans effet */ } };

export async function askSkot(message: string, page: SkotPage, image?: { media_type: string; data: string }, nudge?: SkotNudgeKind): Promise<SkotReply> {
  const { data, error } = await supabase.functions.invoke("chat-skot", {
    body: { message, page_context: page, conversation_id: getConversationId(), image, nudge },
  });
  let payload: SkotReply | null = data ?? null;
  if (error) {
    // Réponse non-2xx (limite, photo trop lourde…) : le serveur renvoie quand même une phrase de SKOT
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.json === "function") payload = await ctx.json();
    } catch { /* corps illisible */ }
  }
  if (payload?.conversation_id) setConversationId(payload.conversation_id);
  return {
    ok: !!payload?.ok,
    reply: payload?.reply || "Petite crevaison de mon côté… Réessaie dans un instant.",
    cards: Array.isArray(payload?.cards) ? payload!.cards : [],
    conversation_id: payload?.conversation_id,
    message_id: payload?.message_id ?? null,
    error: payload?.error,
  };
}

/** 👍 / 👎 sur une réponse de SKOT : un 👎 crée un signal que la boucle d'amélioration traite (skill skot-amelioration-continue). */
export async function sendSkotFeedback(messageId: string, conversationId: string, value: 1 | -1): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke("chat-skot", {
    body: { action: "feedback", message_id: messageId, conversation_id: conversationId, value },
  });
  return !error && !!data?.ok;
}

/** 28/10 : réaction emoji (👍 ❤️ 😂 🔥 😕) et/ou commentaire sur une réponse de SKOT — 😕 et commentaires remontent à l'atelier. */
export async function sendSkotReaction(messageId: string, conversationId: string, opts: { reaction?: string; comment?: string }): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke("chat-skot", {
    body: { action: "feedback", message_id: messageId, conversation_id: conversationId, ...opts },
  });
  return !error && !!data?.ok;
}

/** Réduit une photo à 1024 px max en JPEG avant envoi (poids et coût). */
export function compressImage(file: File, max = 1024, quality = 0.82): Promise<{ media_type: string; data: string; preview: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const g = canvas.getContext("2d");
      if (!g) { URL.revokeObjectURL(url); reject(new Error("canvas")); return; }
      g.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      URL.revokeObjectURL(url);
      resolve({ media_type: "image/jpeg", data: dataUrl.split(",")[1], preview: dataUrl });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image")); };
    img.src = url;
  });
}

// ───────────── Étage 2 : SKOT arrive au bon moment (25/10/2026, skot-ambition-24-10.md) ─────────────
// Règles actées : une seule intervention par visite, toujours refermable, jamais au panier ni au paiement, mesurée.
// Les phrases vivent côté serveur (supabase/functions/chat-skot/nudges.ts) ; elles sont recopiées ici pour l'affichage.
export const SKOT_NUDGES_ON = true;
export type SkotNudgeKind = "piece_sans_trott" | "piece_a_confirmer" | "trott_sans_pieces" | "recherche_vide" | "garage_entretien";
export const NUDGE_TEXT: Record<SkotNudgeKind, string> = {
  piece_sans_trott: "C'est pour quelle trott ? Dis-moi le modèle, je te dis si cette pièce monte.",
  piece_a_confirmer: "Cette pièce n'est pas encore confirmée pour ta trottinette. Je t'explique ce qui reste à vérifier ?",
  trott_sans_pieces: "Je n'ai pas encore les pièces de cette trottinette en ligne. Dis-moi ce qu'il te faut, l'atelier te le trouve.",
  recherche_vide: "Ta recherche n'a rien donné : dis-moi ce que tu cherches avec tes mots, je fouille l'atelier.",
  garage_entretien: "Entretien à prévoir sur ta trottinette : je te montre les plaquettes et les pneus qui montent ?",
};

const ss = { get: (k: string) => { try { return window.sessionStorage.getItem(k); } catch { return null; } }, set: (k: string, v: string) => { try { window.sessionStorage.setItem(k, v); } catch { /* sans effet */ } } };
const ls = { get: (k: string) => { try { return window.localStorage.getItem(k); } catch { return null; } }, set: (k: string, v: string) => { try { window.localStorage.setItem(k, v); } catch { /* sans effet */ } } };

/** Identifiant de visite (onglet) : sert à la mesure et à « une intervention par visite ». */
export function skotVisitId(): string {
  let id = ss.get("pt-skot-visit");
  if (!id) { id = crypto.randomUUID(); ss.set("pt-skot-visit", id); }
  return id;
}
/** Une intervention a déjà eu lieu (ou SKOT a déjà été ouvert) pendant cette visite. */
export const nudgeUsed = () => ss.get("pt-skot-nudged") === "1";
export const markNudgeUsed = () => ss.set("pt-skot-nudged", "1");
/** Refermée 3 fois en 14 jours → plus d'intervention pendant 14 jours. */
export function nudgeMuted(): boolean {
  const list = (ls.get("pt-skot-nudge-closed") ?? "").split(",").map(Number).filter((t) => t > Date.now() - 14 * 86_400_000);
  return list.length >= 3;
}
export function rememberNudgeClosed() {
  const list = (ls.get("pt-skot-nudge-closed") ?? "").split(",").map(Number).filter((t) => t > Date.now() - 14 * 86_400_000);
  ls.set("pt-skot-nudge-closed", [...list, Date.now()].join(","));
}
export function trackNudge(kind: SkotNudgeKind, event: "shown" | "opened" | "closed" | "replied", slug?: string) {
  void supabase.functions.invoke("chat-skot", { body: { action: "nudge", kind, event, session: skotVisitId(), slug } }).catch(() => undefined);
}
