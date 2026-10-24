import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/* 24/10/2026 — « L'Atelier » (plan claude/PT-lot-atelier-hub.md).
   Questions des riders : envoi par la fonction ask_atelier, lecture publique par la vue
   rider_questions_publiques (questions répondues seulement, sans email). Vidéos : public/atelier/videos.json,
   généré au build depuis les fiches « Tout savoir » (scripts/gen-atelier-videos.mjs). */

export interface PublicQuestion {
  slug: string;
  titre: string;
  question: string;
  reponse: string;
  scooter_slug: string | null;
  scooter_name: string | null;
  repondu_par: string | null;
  repondu_le: string | null;
  created_at: string;
}

export interface AtelierVideo {
  id: string;
  title: string;
  channel: string;
  uploadDate?: string;
  slug: string; // fiche trottinette
  name: string; // nom affiché de la trottinette
  brand: string;
}

// Vue et fonction absentes des types générés : accès non typé.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (t: string) => any; rpc: (f: string, a: Record<string, unknown>) => any };

export function useAnsweredQuestions(opts: { scooterSlug?: string; limit?: number } = {}) {
  const { scooterSlug, limit = 50 } = opts;
  return useQuery({
    queryKey: ["atelier-questions", scooterSlug ?? "all", limit],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<PublicQuestion[]> => {
      let q = db.from("rider_questions_publiques").select("*").order("repondu_le", { ascending: false }).limit(limit);
      if (scooterSlug) q = q.eq("scooter_slug", scooterSlug);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as PublicQuestion[];
    },
  });
}

export function useAtelierQuestion(slug: string | undefined) {
  return useQuery({
    queryKey: ["atelier-question", slug],
    enabled: !!slug,
    queryFn: async (): Promise<PublicQuestion | null> => {
      const { data, error } = await db.from("rider_questions_publiques").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return (data as PublicQuestion) ?? null;
    },
  });
}

/** Envoie une question. Renvoie un message d'erreur lisible, ou null si c'est parti. */
export async function askAtelier(input: { question: string; scooterSlug?: string | null; scooterName?: string | null; email?: string | null }): Promise<string | null> {
  const { error } = await db.rpc("ask_atelier", {
    p_question: input.question,
    p_scooter_slug: input.scooterSlug ?? null,
    p_scooter_name: input.scooterName ?? null,
    p_email: input.email ?? null,
  });
  if (!error) return null;
  const m = String(error.message || "");
  if (m.includes("trop_rapide")) return "Une question vient déjà de partir de ta connexion : attends une minute avant la suivante.";
  if (m.includes("limite_jour")) return "Tu as déjà posé 5 questions aujourd'hui : on y répond d'abord, reviens demain.";
  if (m.includes("question_check") || m.includes("question")) return "Ta question doit faire entre 10 et 1 000 caractères.";
  if (m.includes("email")) return "L'adresse email n'a pas l'air valide (tu peux aussi la laisser vide).";
  return "L'envoi a échoué. Réessaie dans un instant ou écris-nous depuis la page Contact.";
}

export function useAtelierVideos() {
  return useQuery({
    queryKey: ["atelier-videos"],
    staleTime: 30 * 60_000,
    queryFn: async (): Promise<AtelierVideo[]> => {
      const r = await fetch("/atelier/videos.json");
      if (!r.ok || !(r.headers.get("content-type") || "").includes("json")) throw new Error(`atelier/videos.json HTTP ${r.status}`);
      return (await r.json()) as AtelierVideo[];
    },
  });
}

export const slugifyQuestion = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);

export const formatFrDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "";
