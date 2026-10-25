// 25/10/2026 — SKOT Étage 2 « il arrive au bon moment » (claude/skot-ambition-24-10.md, règles actées) :
// UNE intervention par visite, toujours refermable, jamais au panier ni au paiement (SkotWidget ne s'affiche pas là),
// refermée 3 fois en 14 jours → plus rien pendant 14 jours, chaque affichage / ouverture / fermeture mesuré (table skot_nudges).
// Aucun appel à l'IA tant que le client n'a pas cliqué : les signaux sont lus en base.
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSelectedScooter } from "@/contexts/ScooterContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { classifyCompat } from "@/lib/compatibilityStatus";
import {
  NUDGE_TEXT, SKOT_NUDGES_ON, markNudgeUsed, nudgeMuted, nudgeUsed, rememberNudgeClosed, skotPageContext, trackNudge, type SkotNudgeKind,
} from "@/lib/skot";

const CARBON = "#1A1A1A";
const JAK = "'Plus Jakarta Sans', sans-serif";
const cutTR = (n: number) => `polygon(0 0, calc(100% - ${n}px) 0, 100% ${n}px, 100% 100%, 0 100%)`;

export type NudgeAccept = { kind: SkotNudgeKind; /** question envoyée tout de suite au nom du client (sinon SKOT pose la question et attend) */ autoSend?: string };
type Candidate = NudgeAccept & { delay: number; slug?: string };

const SIX_MONTHS = 183 * 86_400_000;

function useCandidate(pathname: string): Candidate | null {
  const page = skotPageContext(pathname);
  const { selectedScooter } = useSelectedScooter();
  const { user } = useAuthContext();

  // Fiche pièce + trottinette choisie : la compat est-elle seulement « à confirmer » (🟡) ?
  const part = useQuery({
    queryKey: ["skot-nudge-part", page.slug, selectedScooter?.id],
    enabled: SKOT_NUDGES_ON && page.type === "piece" && !!page.slug && !!selectedScooter,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data: p } = await supabase.from("parts").select("id").eq("slug", page.slug!).eq("published", true).maybeSingle();
      if (!p) return "none" as const;
      const { data } = await supabase.from("part_compatibility").select("confidence_level, suggestion_reason").eq("part_id", p.id).eq("scooter_model_id", selectedScooter!.id);
      const st = (data ?? []).map((r) => classifyCompat(r));
      return st.includes("verified") ? ("verified" as const) : st.includes("unverified") ? ("unverified" as const) : ("none" as const);
    },
  });

  // Fiche trottinette : aucune pièce listée ?
  const scooter = useQuery({
    queryKey: ["skot-nudge-scooter", page.slug],
    enabled: SKOT_NUDGES_ON && page.type === "scooter" && !!page.slug,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase.from("scooter_models").select("compatible_parts_count").eq("slug", page.slug!).eq("published", true).maybeSingle();
      return data ? Number(data.compatible_parts_count ?? 0) : null;
    },
  });

  // Garage : entretien dû (km atteints ou dernier entretien de plus de 6 mois).
  const garage = useQuery({
    queryKey: ["skot-nudge-garage", user?.id],
    enabled: SKOT_NUDGES_ON && page.type === "garage" && !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase.from("user_garage").select("current_km, next_maintenance_km, last_maintenance_date, scooter_models(name)").eq("user_id", user!.id).order("is_featured", { ascending: false }).limit(3);
      const due = (data ?? []).find((g) => (g.next_maintenance_km && g.current_km && g.current_km >= g.next_maintenance_km)
        || (g.last_maintenance_date && Date.now() - new Date(g.last_maintenance_date).getTime() > SIX_MONTHS));
      return due ? ((due.scooter_models as { name?: string } | null)?.name ?? "ma trottinette") : null;
    },
  });

  if (!SKOT_NUDGES_ON) return null;
  if (page.type === "piece") {
    if (!selectedScooter) return { kind: "piece_sans_trott", delay: 25_000, slug: page.slug };
    if (part.data === "unverified") return { kind: "piece_a_confirmer", delay: 4_000, slug: page.slug, autoSend: `Est-ce que cette pièce monte sur ma ${selectedScooter.name} ? Qu'est-ce qui reste à vérifier ?` };
    return null;
  }
  if (page.type === "scooter" && scooter.data === 0) return { kind: "trott_sans_pieces", delay: 3_000, slug: page.slug };
  if (page.type === "garage" && garage.data) return { kind: "garage_entretien", delay: 5_000, autoSend: `Montre-moi les plaquettes et les pneus qui montent sur ma ${garage.data}.` };
  return null;
}

/** Bulle d'intervention, au-dessus du bouton SKOT (téléphone) ou de la mascotte (ordinateur). */
const SkotNudge = ({ pathname, inNav, onAccept }: { pathname: string; inNav: boolean; onAccept: (a: NudgeAccept) => void }) => {
  const cand = useCandidate(pathname);
  const [shown, setShown] = useState<Candidate | null>(null);
  const key = cand ? `${cand.kind}|${cand.slug ?? ""}` : "";

  useEffect(() => {
    setShown(null);
    if (!cand || nudgeUsed() || nudgeMuted()) return;
    const t = window.setTimeout(() => {
      if (nudgeUsed() || nudgeMuted()) return; // SKOT ouvert entre-temps
      markNudgeUsed();
      trackNudge(cand.kind, "shown", cand.slug);
      setShown(cand);
    }, cand.delay);
    return () => window.clearTimeout(t);
  }, [key, pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!shown) return null;
  const close = () => { rememberNudgeClosed(); trackNudge(shown.kind, "closed", shown.slug); setShown(null); };
  const accept = () => { trackNudge(shown.kind, "opened", shown.slug); setShown(null); onAccept({ kind: shown.kind, autoSend: shown.autoSend }); };

  return (
    <div
      role="status"
      className={`fixed z-40 right-3 left-3 sm:left-auto sm:w-[340px] md:right-6 ${inNav ? "bottom-[calc(96px+env(safe-area-inset-bottom))]" : "bottom-[calc(148px+env(safe-area-inset-bottom))]"} md:bottom-[250px]`}
    >
      <span className="block p-[2px] shadow-lg" style={{ background: CARBON, clipPath: cutTR(12) }}>
        <span className="flex items-start gap-2 bg-white" style={{ clipPath: cutTR(11) }}>
          <button type="button" onClick={accept} className="flex-1 min-w-0 flex items-start gap-3 text-left p-3 min-h-[44px]">
            <span className="bg-[#F5F0E8] rounded-full w-10 h-10 shrink-0 overflow-hidden grid place-items-center">
              <img src="/skot/tete-ecoute.webp" alt="" className="w-full h-full object-cover" style={{ transform: "scale(1.15) translateY(6%)" }} />
            </span>
            <span className="min-w-0">
              <span className="block text-[14.5px] leading-snug" style={{ fontFamily: JAK, color: CARBON }}>{NUDGE_TEXT[shown.kind]}</span>
              <span className="block mt-1 text-[14px] font-extrabold uppercase italic" style={{ fontFamily: JAK, color: "#4A7C59" }}>Répondre à SKOT</span>
            </span>
          </button>
          <button type="button" onClick={close} aria-label="Fermer" className="w-11 h-11 grid place-items-center shrink-0 text-[#1A1A1A]/70 hover:text-[#1A1A1A]">
            <X className="w-5 h-5" />
          </button>
        </span>
      </span>
    </div>
  );
};

export default SkotNudge;
