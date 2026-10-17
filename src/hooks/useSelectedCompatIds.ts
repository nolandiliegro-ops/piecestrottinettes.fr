import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSelectedScooter } from "@/contexts/ScooterContext";
import { classifyCompat } from "@/lib/compatibilityStatus";
import { isVerdictSafe } from "@/lib/batteryVoltage";

/**
 * 18/10 (Nolan) : « les pièces compatibles avec la trottinette choisie en haut doivent remonter en premier, partout ».
 * UNE requête pour toute la page : ids des pièces ✅ vérifiées pour la trottinette sélectionnée
 * (même règle que la coche des cartes : classifyCompat === 'verified' + garde-fou tension batterie).
 */
const readVoltages = (embedded: unknown): number[] | null => {
  const row = Array.isArray(embedded) ? embedded[0] : embedded;
  const v = (row as { electrical_specs?: { voltages?: unknown } } | null | undefined)?.electrical_specs?.voltages;
  return Array.isArray(v) && v.every((x) => typeof x === "number") ? (v as number[]) : null;
};

const useCompatSets = () => {
  const { selectedScooter } = useSelectedScooter();
  const { data } = useQuery({
    queryKey: ["selected-compat-ids-v2", selectedScooter?.id],
    queryFn: async (): Promise<{ ids: Set<string>; slugs: Set<string> }> => {
      const { data, error } = await supabase
        .from("part_compatibility")
        .select("part_id, confidence_level, suggestion_reason, parts(slug, electrical_specs)")
        .eq("scooter_model_id", selectedScooter!.id);
      if (error) throw error;
      const ok = (data || []).filter((r) => isVerdictSafe(readVoltages(r.parts)) && classifyCompat(r) === "verified");
      const slugOf = (r: (typeof ok)[number]) => ((Array.isArray(r.parts) ? r.parts[0] : r.parts) as { slug?: string } | null)?.slug;
      return {
        ids: new Set(ok.map((r) => r.part_id as string)),
        slugs: new Set(ok.map(slugOf).filter((x): x is string => !!x)),
      };
    },
    enabled: !!selectedScooter?.id,
    staleTime: 5 * 60 * 1000,
  });
  return selectedScooter ? data ?? null : null;
};

export const useSelectedCompatIds = (): Set<string> | null => useCompatSets()?.ids ?? null;
/** Même chose par slug (résultats de recherche, qui n'ont pas l'id). */
export const useSelectedCompatSlugs = (): Set<string> | null => useCompatSets()?.slugs ?? null;

/** Tri stable : pièces compatibles d'abord, l'ordre choisi (prix, nom…) est gardé dans chaque groupe. */
export const compatFirst = <T,>(list: T[], ids: Set<string> | null, idOf: (x: T) => string): T[] => {
  if (!ids || ids.size === 0) return list;
  const yes: T[] = [], no: T[] = [];
  for (const x of list) (ids.has(idOf(x)) ? yes : no).push(x);
  return yes.length && no.length ? [...yes, ...no] : list;
};
