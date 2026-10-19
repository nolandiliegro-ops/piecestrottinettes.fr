import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Transition entre le hero (Top du moment) et le catalogue — 20/10/2026, demande Nolan :
 * « entre la hero section et la recherche de produits, surtout sur téléphone, il manque une transition jolie ».
 * Défaut constaté : deux aplats beige identiques (#FAFAF8) bout à bout, la frise de cartes s'arrête net, puis ~100 px de vide.
 * 5 propositions derrière ?pont=1..5 (sans paramètre : rien ne change).
 *   1 Défilé   — l'ancien fond « pièces en gris qui défilent », repassé dans la DA (la lecture littérale)
 *   2 Ruban    — bande carbone, les familles à forte marge défilent en Unbounded
 *   3 Pliage   — coupe en biais avec un liseré vert, le catalogue démarre sur un aplat plus soutenu
 *   4 Compteur — les vrais chiffres du site (lus en base) en grand
 *   5 Établi   — panneau perforé d'atelier, trois pièces accrochées
 */
export type PontVariant = 1 | 2 | 3 | 4 | 5;
export const PONT_NAMES: Record<PontVariant, string> = { 1: "Défilé", 2: "Ruban", 3: "Pliage", 4: "Compteur", 5: "Établi" };

export const readPontVariant = (): 0 | PontVariant => {
  try {
    const n = Number(new URLSearchParams(window.location.search).get("pont"));
    return n >= 1 && n <= 5 ? (n as PontVariant) : 0;
  } catch {
    return 0;
  }
};

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const BEIGE = "#FAFAF8";
const SAND = "#F1ECE2";
const cut = (px: number) => `polygon(0 0, calc(100% - ${px}px) 0, 100% ${px}px, 100% 100%, 0 100%)`;

const PACKS = ["pneus", "plaquettes", "chargeurs", "chambres", "disques", "pleins", "accessoires"];
const FAMILLES = ["Pneus", "Chambres à air", "Plaquettes", "Chargeurs", "Disques", "Pneus pleins"];

const KEYFRAMES = `
@keyframes pt-pont-gauche { from { transform: translateX(0) } to { transform: translateX(-50%) } }
@keyframes pt-pont-droite { from { transform: translateX(-50%) } to { transform: translateX(0) } }
.pt-pont-row { display: flex; width: max-content; will-change: transform; }
@media (prefers-reduced-motion: reduce) { .pt-pont-row { animation: none !important; } }
`;

/** 1 — Défilé : deux rangées de pièces en gris, très pâles, qui glissent en sens inverse. */
const Defile = () => {
  const row = (dir: "gauche" | "droite", s: "a" | "b", dur: number) => (
    <div className="pt-pont-row" style={{ animation: `pt-pont-${dir} ${dur}s linear infinite` }}>
      {[0, 1].map((k) => (
        <div key={k} className="flex shrink-0">
          {PACKS.map((p) => (
            <img key={p + k} src={`/categories/${p}-${s}.webp`} alt="" loading="lazy" decoding="async"
              className="h-[64px] lg:h-[84px] w-[96px] lg:w-[132px] object-contain mx-3 lg:mx-6" style={{ filter: "grayscale(1) contrast(0.9)", opacity: 0.16 }} />
          ))}
        </div>
      ))}
    </div>
  );
  return (
    <div aria-hidden className="relative overflow-hidden py-3 lg:py-5 select-none pointer-events-none"
      style={{ background: `linear-gradient(${BEIGE}, ${SAND} 30%, ${SAND} 70%, ${BEIGE})` }}>
      <div className="space-y-2 lg:space-y-3">
        {row("gauche", "a", 60)}
        {row("droite", "b", 75)}
      </div>
    </div>
  );
};

/** 2 — Ruban : bande carbone, familles à forte marge en défilement. */
const Ruban = () => {
  const items = (k: number) => (
    <div key={k} className="flex shrink-0 items-center">
      {FAMILLES.map((f) => (
        <span key={f + k} className="flex items-center">
          <span className="px-5 lg:px-8 text-[15px] lg:text-xl uppercase whitespace-nowrap" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: "#FFFFFF", letterSpacing: "-0.01em" }}>{f}</span>
          <span className="h-2 w-2 shrink-0" style={{ background: GREEN, clipPath: cut(2) }} />
        </span>
      ))}
    </div>
  );
  return (
    <div aria-hidden className="relative py-6 lg:py-8 select-none pointer-events-none" style={{ background: BEIGE }}>
      <div className="relative overflow-hidden py-3.5 lg:py-4" style={{ background: CARBON, transform: "rotate(-1.2deg)", marginInline: "-2%" }}>
        <div className="pt-pont-row" style={{ animation: "pt-pont-gauche 38s linear infinite" }}>{[0, 1].map(items)}</div>
      </div>
    </div>
  );
};

/** 3 — Pliage : une lame carbone en biais (fine à gauche, épaisse à droite) soulignée de vert, comme une bande pliée. */
const Pliage = () => (
  <div aria-hidden className="relative h-[72px] lg:h-[110px] select-none pointer-events-none" style={{ background: BEIGE }}>
    <svg className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-[44px] lg:h-[64px]" viewBox="0 0 100 10" preserveAspectRatio="none">
      <polygon points="0,7.5 100,0 100,6 0,9" fill={CARBON} />
      <polygon points="0,9 100,6 100,7.6 0,9.6" fill={GREEN} />
    </svg>
  </div>
);

/** 4 — Compteur : les chiffres réels du site, lus en base. */
const useChiffres = () =>
  useQuery({
    queryKey: ["home_pont_chiffres"],
    queryFn: async () => {
      const [p, s] = await Promise.all([
        supabase.from("parts").select("id", { count: "exact", head: true }).eq("published", true),
        supabase.from("scooter_models").select("brand_id").eq("published", true),
      ]);
      const rows = (s.data ?? []) as { brand_id: string | null }[];
      return { pieces: p.count ?? 0, trottinettes: rows.length, marques: new Set(rows.map((r) => r.brand_id).filter(Boolean)).size };
    },
    staleTime: 10 * 60 * 1000,
  });

const Compteur = () => {
  const { data } = useChiffres();
  const cells = [
    { n: data?.pieces, l: "pièces en ligne" },
    { n: data?.trottinettes, l: "modèles" },
    { n: data?.marques, l: "marques" },
  ];
  return (
    <div className="px-4 py-6 lg:py-10" style={{ background: BEIGE }}>
      <div className="max-w-7xl mx-auto lg:px-4 grid grid-cols-3 gap-2 lg:gap-4">
        {cells.map((c, i) => (
          <div key={c.l} className="px-3 py-4 lg:px-6 lg:py-6" style={{ background: i === 0 ? CARBON : "#FFFFFF", clipPath: cut(12), boxShadow: i === 0 ? undefined : "inset 0 0 0 1px #E2DCD0" }}>
            <span className="block text-[28px] sm:text-4xl lg:text-6xl leading-none" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.04em", color: i === 0 ? "#FFFFFF" : GREEN }}>
              {c.n ?? "—"}
            </span>
            <span className="block mt-2 text-sm font-bold uppercase leading-tight" style={{ fontFamily: FONT, color: i === 0 ? "rgba(255,255,255,0.75)" : "#4B5563" }}>{c.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/** 5 — Établi : panneau perforé d'atelier, trois pièces à forte marge accrochées. */
const Etabli = () => (
  <div aria-hidden className="relative overflow-hidden h-[150px] lg:h-[200px] select-none pointer-events-none"
    style={{
      backgroundColor: SAND,
      backgroundImage: "radial-gradient(circle, rgba(26,26,26,0.16) 2.2px, transparent 2.6px)",
      backgroundSize: "22px 22px",
      backgroundPosition: "11px 11px",
      WebkitMaskImage: "linear-gradient(transparent, #000 22%, #000 78%, transparent)",
      maskImage: "linear-gradient(transparent, #000 22%, #000 78%, transparent)",
    }}>
    <div className="absolute inset-0 flex items-center justify-center gap-6 sm:gap-14 lg:gap-24">
      {["pneus-a", "plaquettes-a", "chargeurs-a"].map((p, i) => (
        <div key={p} className="relative flex flex-col items-center" style={{ transform: `rotate(${[-4, 3, -2][i]}deg)` }}>
          <span className="block h-3 w-3 rounded-full mb-[-4px] z-10" style={{ background: CARBON }} />
          <span className="block w-px h-4" style={{ background: CARBON }} />
          <img src={`/categories/${p}.webp`} alt="" loading="lazy" decoding="async" className="h-[74px] w-[86px] lg:h-[104px] lg:w-[130px] object-contain" style={{ filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.18))" }} />
        </div>
      ))}
    </div>
  </div>
);

const HomeTransition = ({ variant }: { variant: 0 | PontVariant }) => {
  if (!variant) return null;
  return (
    <div data-pont={variant} className="relative -mt-8 -mb-8 lg:-mt-10 lg:-mb-10">
      <style>{KEYFRAMES}</style>
      {variant === 1 && <Defile />}
      {variant === 2 && <Ruban />}
      {variant === 3 && <Pliage />}
      {variant === 4 && <Compteur />}
      {variant === 5 && <Etabli />}
    </div>
  );
};

export default HomeTransition;
