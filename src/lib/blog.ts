/**
 * Blog piecestrottinettes.fr (23/10/2026) — articles en JSON dans public/blog/, comme les fiches « Tout savoir ».
 * public/blog/index.json = liste des articles publiés ; public/blog/<slug>.json = un article.
 * Règles (claude/blog-affiliation-plan.md) : aucun prix, stock ni nombre de compatibilités figé dans le texte
 * (les cartes et le tableau les lisent en base), aucune affirmation de fiabilité inventée, sources citées,
 * liens partenaires rel="sponsored" (comptés par src/lib/affiliateClicks.ts).
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BlogCategory = "Guide d'achat" | "Comparatif" | "Choisir dans une gamme" | "Entretien";

export interface BlogSummary {
  slug: string;
  title: string;
  description: string;
  category: BlogCategory;
  updated: string; // AAAA-MM-JJ
  readMinutes: number;
}

export interface BlogSection {
  id: string;
  h2: string;
  paragraphs: string[];
  bullets?: string[];
  /** Carte modèle lue en base (photo, chiffres, lien partenaire s'il existe). */
  scooter?: string;
  /** Liens vers nos pièces d'usure, par famille. */
  parts?: { label: string; slugs: string[] }[];
  /** Observation d'atelier dictée par Nolan — jamais rédigée sans lui. */
  atelier?: string;
}

export interface BlogArticle extends BlogSummary {
  metaTitle: string;
  metaDescription: string;
  verdict: string[];
  compare?: { title: string; scooters: string[] };
  sections: BlogSection[];
  faq: { q: string; a: string }[];
  sources: { label: string; url: string }[];
}

const isJson = (r: Response) => r.ok && (r.headers.get("content-type") || "").includes("json");

export function useBlogIndex() {
  return useQuery({
    queryKey: ["blog-index"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<BlogSummary[]> => {
      const r = await fetch("/blog/index.json");
      if (!isJson(r)) throw new Error(`blog/index.json HTTP ${r.status}`);
      const list = (await r.json()) as BlogSummary[];
      return [...list].sort((a, b) => b.updated.localeCompare(a.updated));
    },
  });
}

export function useBlogArticle(slug?: string) {
  return useQuery({
    queryKey: ["blog-article", slug],
    enabled: !!slug,
    staleTime: 5 * 60_000,
    retry: false,
    queryFn: async (): Promise<BlogArticle | null> => {
      const r = await fetch(`/blog/${encodeURIComponent(slug as string)}.json`);
      if (!isJson(r)) return null;
      const j = (await r.json()) as BlogArticle;
      return j && j.slug === slug && Array.isArray(j.sections) ? j : null;
    },
  });
}

export interface BlogScooter {
  slug: string;
  name: string;
  image_url: string | null;
  power_watts: number | null;
  max_speed_kmh: number | null;
  range_km: number | null;
  weight_kg: number | null;
  voltage: number | null;
  tire_size: string | null;
  suspension: string | null;
  affiliate_link: string | null;
  brand: string | null;
}

/** Trottinettes citées par un article, lues en base (publiées seulement), dans l'ordre demandé. */
export function useBlogScooters(slugs: string[]) {
  const key = [...new Set(slugs)].sort();
  return useQuery({
    queryKey: ["blog-scooters", key],
    enabled: key.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Record<string, BlogScooter>> => {
      const { data, error } = await supabase
        .from("scooter_models")
        .select("slug,name,image_url,power_watts,max_speed_kmh,range_km,weight_kg,voltage,tire_size,suspension,affiliate_link,brands!scooter_models_brand_id_fkey(name)")
        .in("slug", key)
        .eq("published", true);
      if (error) throw error;
      const out: Record<string, BlogScooter> = {};
      for (const s of (data ?? []) as unknown as (Omit<BlogScooter, "brand"> & { brands: { name: string } | null })[]) {
        const { brands, ...rest } = s;
        out[s.slug] = { ...rest, brand: brands?.name ?? null };
      }
      return out;
    },
  });
}

export interface BlogPart { slug: string; name: string; image_url: string | null }

/** Pièces citées par un article (publiées seulement). */
export function useBlogParts(slugs: string[]) {
  const key = [...new Set(slugs)].sort();
  return useQuery({
    queryKey: ["blog-parts", key],
    enabled: key.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Record<string, BlogPart>> => {
      const { data, error } = await supabase
        .from("parts")
        .select("slug,name,image_url")
        .in("slug", key)
        .eq("published", true);
      if (error) throw error;
      const out: Record<string, BlogPart> = {};
      for (const p of (data ?? []) as unknown as BlogPart[]) out[p.slug] = p;
      return out;
    },
  });
}

export const formatBlogDate = (iso: string) => {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
};
