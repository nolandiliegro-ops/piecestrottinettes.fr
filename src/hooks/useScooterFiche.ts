import { useQuery } from "@tanstack/react-query";
import { SCOOTER_SEO, type ScooterSeo } from "@/data/scooterSeo";

/**
 * Fiche « Tout savoir » d'un modèle (19/10/2026).
 * Priorité : fiche écrite à la main dans src/data/scooterSeo.ts, sinon public/fiches/<slug>.json
 * (produite par la passe « fiches », relue avant d'être versée dans main). Chargée à la demande :
 * zéro poids dans le bundle, rien en base, retour arrière = git revert du fichier.
 * Un slug sans fiche renvoie index.html (fallback SPA) : rejeté par le contrôle du type de contenu.
 */
const isFiche = (j: unknown): j is ScooterSeo => {
  const f = j as ScooterSeo;
  return !!f && typeof f.displayName === "string" && Array.isArray(f.intro) && f.intro.length > 0
    && Array.isArray(f.specs) && Array.isArray(f.pros) && Array.isArray(f.cons) && Array.isArray(f.parts)
    && Array.isArray(f.care) && Array.isArray(f.faq) && Array.isArray(f.sources) && f.sources.length > 0;
};

export function useScooterFiche(slug?: string | null): ScooterSeo | undefined {
  const local = slug ? SCOOTER_SEO[slug] : undefined;
  const { data } = useQuery({
    queryKey: ["scooter-fiche", slug],
    enabled: !!slug && !local,
    staleTime: Infinity,
    retry: false,
    queryFn: async (): Promise<ScooterSeo | null> => {
      try {
        const r = await fetch(`/fiches/${encodeURIComponent(slug as string)}.json`);
        if (!r.ok || !(r.headers.get("content-type") || "").includes("json")) return null;
        const j = await r.json();
        return isFiche(j) ? j : null;
      } catch {
        return null;
      }
    },
  });
  return local ?? data ?? undefined;
}
