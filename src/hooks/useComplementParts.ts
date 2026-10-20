/**
 * « Vous pourriez aussi avoir besoin de » en VENTE CROISÉE (Nolan 20/10) : d'autres CATÉGORIES qui vont avec la pièce,
 * pas des sœurs de la même catégorie (celles-là sont déjà dans « Autres références en … »).
 *  - Pièce de roue (chambre, pneu, plein) : même cote de montage (fitment_specs.tire_sections) — clé exacte.
 *  - Sinon : pièces des catégories complémentaires reliées aux MÊMES trottinettes vérifiées.
 * Mélange les catégories (une de chaque à tour de rôle), 4 cartes. Liste vide → l'appelant garde l'ancienne.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PartDetail, CompatibleScooter } from "@/hooks/usePartDetail";
import { classifyCompat } from "@/lib/compatibilityStatus";

const COMPLEMENTS: Record<string, string[]> = {
  "chambres-a-air": ["pneus", "pneus-pleins"],
  pneus: ["chambres-a-air", "pneus-pleins"],
  "pneus-pleins": ["pneus", "plaquettes"],
  plaquettes: ["disques", "pneus", "chambres-a-air"],
  disques: ["plaquettes", "pneus"],
  chargeurs: ["plaquettes", "chambres-a-air", "pneus"],
};

const SELECT = "id, name, slug, price, image_url, images, stock_quantity, category:categories!inner(id, name, slug, color)";
type Row = { id: string; name: string; slug: string; price: number | null; image_url: string | null; images: unknown; stock_quantity: number | null; category: { id: string; name: string; slug: string; color: string | null } };

const mix = (rows: Row[], cats: string[], n: number): Row[] => {
  const by = cats.map((c) => rows.filter((r) => r.category?.slug === c));
  const out: Row[] = [];
  for (let i = 0; out.length < n && i < n; i++) for (const list of by) if (list[i] && out.length < n) out.push(list[i]);
  return out;
};

export const useComplementParts = (part: PartDetail, scooters: CompatibleScooter[], n = 4) => {
  const family = part.category?.slug ?? "";
  const cats = COMPLEMENTS[family] ?? [];
  const section = part.fitment_specs?.tire_sections?.[0];
  const byTire = !!section && ["chambres-a-air", "pneus", "pneus-pleins"].includes(family);
  const ids = scooters.filter((s) => s.status === "verified").map((s) => s.id).slice(0, 60);
  return useQuery({
    queryKey: ["complement-parts", part.id, byTire ? section : ids.length],
    enabled: cats.length > 0 && (byTire || ids.length > 0),
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Row[]> => {
      // Disponibles d'abord, puis du moins cher au plus cher : une vente croisée qui ne fait pas fuir.
      const base = () => supabase.from("parts").select(SELECT).eq("published", true).neq("id", part.id)
        .in("category.slug", cats).order("stock_quantity", { ascending: false }).order("price", { ascending: true });
      if (byTire) {
        const { data } = await base().contains("fitment_specs", { tire_sections: [section] }).limit(40);
        return mix((data ?? []) as unknown as Row[], cats, n);
      }
      const { data: links } = await supabase.from("part_compatibility").select("part_id, confidence_level, suggestion_reason").in("scooter_model_id", ids).limit(1000);
      // Même règle que l'affichage : seules les compatibilités vérifiées comptent.
      const partIds = [...new Set((links ?? []).filter((l) => classifyCompat(l) === "verified").map((l) => l.part_id))].filter((x) => x !== part.id).slice(0, 300);
      if (!partIds.length) return [];
      const { data } = await base().in("id", partIds).limit(40);
      return mix((data ?? []) as unknown as Row[], cats, n);
    },
  });
};
