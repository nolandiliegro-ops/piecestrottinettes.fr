// SKOT — interrupteur, contexte de page et appel serveur (24/10/2026).
// Spec : documents projet claude/skot-bot-passation-24-10.md + claude/skot-ambition-24-10.md.
import { supabase } from "@/integrations/supabase/client";

/** Ouverture publique du widget. Tant que false : visible seulement avec ?skot=1 (par onglet), ?skot=0 le referme. */
export const SKOT_PUBLIC = false;

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
  return /^\/(panier|checkout|payment-success|admin)(\/|$)/.test(pathname);
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
  type: "part";
  id: string;
  slug: string;
  name: string;
  price: number;
  image_url: string | null;
  in_stock: boolean;
  stock_quantity?: number;
  delay: string;
  url: string;
  compat?: "verified" | "unverified";
}

export interface SkotReply {
  ok: boolean;
  reply: string;
  cards: SkotCard[];
  conversation_id?: string;
  error?: string;
}

const CONV_KEY = "pt-skot-conv";
export const getConversationId = () => { try { return window.sessionStorage.getItem(CONV_KEY); } catch { return null; } };
const setConversationId = (id: string) => { try { window.sessionStorage.setItem(CONV_KEY, id); } catch { /* sans effet */ } };

export async function askSkot(message: string, page: SkotPage, image?: { media_type: string; data: string }): Promise<SkotReply> {
  const { data, error } = await supabase.functions.invoke("chat-skot", {
    body: { message, page_context: page, conversation_id: getConversationId(), image },
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
    error: payload?.error,
  };
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
