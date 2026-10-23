import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { ArrowRight, ChevronDown, CircleDot, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCategories } from "@/hooks/useScooterData";
import PartCard from "@/components/parts/PartCard";
import { inchLabel, inchOfScooter, inchOfSize, isMakerSection } from "@/lib/tireSize";

/**
 * « Lis la taille sur ton pneu » (17/10/2026).
 * Affiché sur une fiche trottinette qui n'a AUCUN pneu / chambre / pneu plein relié :
 * la taille est imprimée sur le flanc de chaque pneu (« 10x2.50-6.5 », « 60/70-6.5 »).
 * Le client choisit sa taille → on affiche nos pièces de cette taille.
 * Chaque choix est enregistré (tire_size_reports, insertion seule) : plusieurs clients
 * concordants = une compatibilité à corroborer, jamais écrite telle quelle.
 *
 * 23/10/2026 — propositions de mise en page (?taille=1..5, 0 ou absent = rendu d'origine) :
 * le pouce lu dans scooter_models.tire_size ne montre que les tailles de CE diamètre,
 * le reste est replié. 1 Repassé · 2 Ses tailles · 3 Deux temps · 4 Flanc · 5 Recherche.
 */

const TIRE_CATEGORIES = ["pneus", "chambres-a-air", "pneus-pleins"];

// Même pneu, deux écritures : on regroupe (cf. skill chercheur-compat-concurrents).
const EQUIV: string[][] = [
  ["10x2.50", "60/70", "250x64"],
  ["10x3.00", "80/65"],
  ["8.5x3", "70/50"],
];
const classOf = (sec: string) => EQUIV.find((g) => g.includes(sec))?.[0] ?? sec;
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "").replace(/,/g, ".").replace(/×/g, "x");
const CHAMFER = "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)";
const CHAMFER_S = "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)";
const LINE = "inset 0 0 0 1px #E2DCD0";

type TirePart = {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  image_url: string | null;
  images: unknown;
  stock_quantity: number | null;
  difficulty_level: number | null;
  technical_metadata: Record<string, unknown> | null;
  fitment_specs: { rim_diameters?: string[]; tire_sections?: string[] } | null;
  category: { id: string; name: string; icon: string | null; slug: string } | null;
};

type SizeGroup = {
  key: string;
  label: string;
  primary: string;
  others: string[];
  aliases: string[];
  rim: string;
  section: string;
  inch: number | null;
  maker: boolean;
  parts: TirePart[];
};

const rimLabel = (rim: string) => (rim.endsWith("mm") ? ` (jante ${rim})` : `-${rim}`);

const useTireParts = (categoryIds: string[]) =>
  useQuery({
    queryKey: ["tire-size-finder-parts", categoryIds],
    enabled: categoryIds.length > 0,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parts")
        .select(
          "id, name, slug, price, image_url, images, stock_quantity, difficulty_level, technical_metadata, fitment_specs, category:categories(id, name, icon, slug)",
        )
        .eq("published", true)
        .in("category_id", categoryIds);
      if (error) throw error;
      return (data || []) as unknown as TirePart[];
    },
  });

const reportSize = (scooterId: string, rim: string, section: string) => {
  const flag = `pt-tire-size-${scooterId}-${rim}-${section}`;
  try {
    if (sessionStorage.getItem(flag)) return;
    sessionStorage.setItem(flag, "1");
  } catch {
    /* stockage indisponible : on enregistre quand même */
  }
  const client = supabase as unknown as {
    from: (t: string) => { insert: (v: unknown) => Promise<unknown> };
  };
  void Promise.resolve(client.from("tire_size_reports").insert({ scooter_model_id: scooterId, rim, section })).catch(() => undefined);
};

/** Variante d'affichage lue dans l'URL (?taille=1..5). 0 = rendu d'origine. */
export const useTailleVariant = () => {
  const [params] = useSearchParams();
  const n = Number(params.get("taille"));
  return n >= 1 && n <= 5 ? n : 0;
};

interface TireSizeFinderProps {
  scooterId?: string;
  scooterName: string;
  /** Texte libre scooter_models.tire_size (« 10 pouces tubeless ») : sert au pré-filtre par pouce. */
  tireSize?: string | null;
}

const inchTxtOf = (n: number | null) => (n != null ? ` en ${inchLabel(n)}` : "");
const pieces = (n: number) => `${n} pièce${n > 1 ? "s" : ""}`;

const TireSizeFinder = ({ scooterId, scooterName, tireSize }: TireSizeFinderProps) => {
  const variant = useTailleVariant();
  const { data: categories = [] } = useCategories();
  const categoryIds = categories.filter((c) => TIRE_CATEGORIES.includes(c.slug)).map((c) => c.id);
  const { data: parts = [], isLoading } = useTireParts(categoryIds);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [moreMine, setMoreMine] = useState(false);
  const scooterInch = inchOfScooter(tireSize);
  const [pickedInch, setPickedInch] = useState<number | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, SizeGroup>();
    for (const p of parts) {
      const rims = p.fitment_specs?.rim_diameters ?? [];
      const secs = p.fitment_specs?.tire_sections ?? [];
      for (const rim of rims) {
        const seen = new Set<string>();
        for (const sec of secs) {
          const key = `${classOf(sec)}|${rim}`;
          if (seen.has(key)) continue;
          seen.add(key);
          let g = map.get(key);
          if (!g) {
            g = { key, label: "", primary: "", others: [], aliases: [], rim, section: classOf(sec), inch: null, maker: false, parts: [] };
            map.set(key, g);
          }
          if (!g.aliases.includes(sec)) g.aliases.push(sec);
          if (!g.parts.some((x) => x.id === p.id)) g.parts.push(p);
        }
      }
    }
    // Convention maison : les pneus 8" (200x50, 200x60, 200x90, 8x2…) portent la jante « 8 » = la taille du pneu,
    // pas le Ø de jante → on n'affiche pas « -8 », on écrit la taille telle qu'elle est sur le flanc.
    const sizeLabel = (sec: string, rim: string) =>
      rim === "8" && /^(8x|200x)/.test(sec) ? (sec === "8x2" ? "8x2 (200x50)" : sec) : `${sec}${rimLabel(rim)}`;
    for (const g of map.values()) {
      g.label = g.aliases.map((a) => sizeLabel(a, g.rim)).join(" · ");
      // Écriture principale : celle en pouces (10x2.50) si elle existe, la plus lue sur les flancs.
      const main = g.aliases.find((a) => /^\d{1,2}(\.\d+)?x/.test(a)) ?? g.aliases[0];
      g.primary = sizeLabel(main, g.rim);
      g.others = g.aliases.filter((a) => a !== main).map((a) => sizeLabel(a, g.rim));
      g.inch = g.rim === "8" && /^(8x|200x)/.test(g.section) ? 8 : inchOfSize(g.section, g.rim);
      g.maker = g.aliases.some((a) => isMakerSection(a, tireSize));
    }
    return [...map.values()].sort((a, b) => Number(b.maker) - Number(a.maker) || b.parts.length - a.parts.length);
  }, [parts, tireSize]);

  const inches = useMemo(
    () => [...new Set(groups.map((g) => g.inch).filter((n): n is number => n != null && n >= 6 && n <= 14))].sort((a, b) => a - b),
    [groups],
  );

  const q = norm(query);
  const current = groups.find((g) => g.key === selected) ?? null;

  if (isLoading || groups.length === 0) return null;

  const pick = (g: SizeGroup) => {
    const active = g.key === selected;
    setSelected(active ? null : g.key);
    if (!active && scooterId) reportSize(scooterId, g.rim, g.section);
  };

  const results = current && (
    <div className="mt-6">
      <p className="text-sm text-muted-foreground mb-4">
        {pieces(current.parts.length)} en {current.label} — vérifie que la taille correspond exactement à celle de ton pneu.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-7">
        {current.parts.map((part, index) => (
          <PartCard
            key={part.id}
            part={{ ...(part as unknown as Parameters<typeof PartCard>[0]["part"]), description: null }}
            index={index}
          />
        ))}
      </div>
    </div>
  );

  /* ───────────── 0 · rendu d'origine (inchangé) ───────────── */
  if (variant === 0) {
    const shown = q ? groups.filter((g) => norm(g.label).includes(q)) : groups;
    return (
      <div className="mt-8 rounded-2xl border border-border bg-card p-4 md:p-6">
        <div className="flex items-start gap-3 mb-3">
          <CircleDot className="w-6 h-6 text-green-700 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-display text-xl md:text-2xl text-foreground uppercase">Lis la taille sur ton pneu</h3>
            <p className="text-sm text-muted-foreground mt-1 leading-snug">
              On n'a pas encore relié de pneu à ta {scooterName}. La taille est imprimée sur le flanc
              du pneu, par exemple « 10x2.50-6.5 », « 60/70-6.5 » ou « 8 1/2x2 ». Choisis-la : on te
              montre les pneus et chambres à air qui vont avec.
            </p>
          </div>
        </div>
        <label className="relative block mb-3">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            inputMode="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tape ta taille, ex. 10x2.50-6.5"
            className="w-full min-h-[44px] pl-9 pr-3 rounded-lg border border-gray-300 bg-white text-base focus:outline-none focus:ring-2 focus:ring-green-600"
            aria-label="Taille écrite sur le flanc du pneu"
          />
        </label>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 md:flex-wrap md:overflow-visible">
          {shown.map((g) => {
            const active = g.key === selected;
            return (
              <button
                key={g.key}
                type="button"
                onClick={() => pick(g)}
                className={`flex-shrink-0 min-h-[44px] px-4 rounded-full border text-sm font-semibold whitespace-nowrap transition-colors ${
                  active ? "bg-green-700 border-green-700 text-white" : "bg-white border-border text-foreground hover:border-green-700"
                }`}
              >
                {g.label}
                <span className={`ml-2 font-normal ${active ? "text-white/80" : "text-muted-foreground"}`}>{g.parts.length}</span>
              </button>
            );
          })}
          {shown.length === 0 && (
            <p className="text-sm text-muted-foreground py-2">Aucune pièce à cette taille pour l'instant — écris-nous, on la trouve pour toi.</p>
          )}
        </div>
        {results}
      </div>
    );
  }

  /* ───────────── éléments communs aux propositions 1-5 ───────────── */
  const inchNow = variant === 3 ? pickedInch ?? scooterInch : scooterInch;
  const mine = inchNow != null ? groups.filter((g) => g.inch === inchNow) : groups.slice(0, 8);
  const rest = groups.filter((g) => !mine.includes(g));
  // Les tailles les plus vendues d'abord ; la queue (jantes rares) reste à un clic.
  const LIMIT = 6;
  const mineShown = moreMine ? mine : mine.slice(0, LIMIT);
  const moreBtn = (light = false) =>
    mine.length > LIMIT && !moreMine ? (
      <button
        type="button"
        onClick={() => setMoreMine(true)}
        className={`shrink-0 min-h-[44px] px-4 text-sm font-bold whitespace-nowrap ${light ? "text-white" : "text-[#1A1A1A]"}`}
        style={{ clipPath: CHAMFER_S, boxShadow: light ? "inset 0 0 0 1px rgba(255,255,255,.25)" : LINE }}
      >
        + {mine.length - LIMIT} autres{inchTxtOf(inchNow)}
      </button>
    ) : null;
  const matchQ = (g: SizeGroup) => norm(g.label).includes(q);
  const inchTxt = inchNow != null ? inchLabel(inchNow) : null;

  const chip = (g: SizeGroup, dark = false) => {
    const active = g.key === selected;
    return (
      <button
        key={g.key}
        type="button"
        onClick={() => pick(g)}
        aria-pressed={active}
        className="shrink-0 min-h-[44px] px-4 py-2 text-left transition-colors"
        style={{
          clipPath: CHAMFER_S,
          background: active ? "#4A7C59" : dark ? "#1A1A1A" : "#fff",
          color: active || dark ? "#fff" : "#1A1A1A",
          boxShadow: active || dark ? "none" : LINE,
        }}
      >
        <span className="block text-[15px] font-extrabold tracking-wide whitespace-nowrap">{g.primary}</span>
        {g.others.length > 0 && (
          <span className={`block text-sm leading-tight whitespace-nowrap ${active || dark ? "text-white/70" : "text-gray-500"}`}>
            {g.others.join(" · ")}
          </span>
        )}
      </button>
    );
  };

  const searchBox = (big = false) => (
    <label className="relative block">
      <Search className={`${big ? "w-5 h-5 left-4" : "w-4 h-4 left-3"} text-gray-500 absolute top-1/2 -translate-y-1/2`} />
      <input
        type="text"
        inputMode="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Tape ta taille, ex. 10x2.50-6.5"
        className={`w-full bg-white text-base focus:outline-none focus:ring-2 focus:ring-green-600 ${big ? "min-h-[56px] pl-12 pr-4 text-lg" : "min-h-[44px] pl-9 pr-3"}`}
        style={{ clipPath: CHAMFER_S, boxShadow: LINE }}
        aria-label="Taille écrite sur le flanc du pneu"
      />
    </label>
  );

  const allToggle = rest.length > 0 && (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setShowAll((v) => !v)}
        aria-expanded={showAll}
        className="inline-flex items-center gap-2 min-h-[44px] text-left text-sm font-bold text-[#1A1A1A] underline underline-offset-4 decoration-[#E2DCD0]"
      >
        {showAll ? "Masquer les autres tailles" : `Ta taille n'est pas là ? Voir les ${rest.length} autres tailles`}
        <ChevronDown className={`w-4 h-4 transition-transform ${showAll ? "rotate-180" : ""}`} />
      </button>
      {showAll && (
        <div className="mt-3">
          {searchBox()}
          <div className="mt-3 flex flex-wrap gap-2">
            {rest.filter(matchQ).map((g) => chip(g))}
            {rest.filter(matchQ).length === 0 && (
              <p className="text-sm text-gray-500 py-2">Aucune pièce à cette taille pour l'instant — écris-nous, on la trouve pour toi.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const shell = (children: React.ReactNode, dark = false) => (
    <div
      className="mt-8 p-4 md:p-6"
      style={{ clipPath: CHAMFER, background: dark ? "#1A1A1A" : "#fff", boxShadow: dark ? "none" : LINE }}
    >
      {children}
    </div>
  );

  const title = (txt: string, sub: React.ReactNode, light = false) => (
    <div className="mb-4">
      <h3 className={`font-display text-2xl md:text-3xl uppercase leading-none ${light ? "text-white" : "text-[#1A1A1A]"}`}>{txt}</h3>
      <p className={`text-sm mt-2 leading-snug max-w-2xl ${light ? "text-white/70" : "text-gray-500"}`}>{sub}</p>
    </div>
  );

  const intro = inchTxt
    ? <>Ta {scooterName} roule en {inchTxt}. Regarde le flanc de ton pneu : la taille y est imprimée, choisis la même ci-dessous.</>
    : <>La taille est imprimée sur le flanc de ton pneu, par exemple « 10x2.50-6.5 » ou « 60/70-6.5 ». Choisis la même ci-dessous.</>;

  /* ───────────── 1 · Repassé ───────────── */
  if (variant === 1) {
    return shell(
      <>
        <div className="flex items-start gap-3">
          <CircleDot className="w-6 h-6 text-green-700 flex-shrink-0 mt-1" />
          {title("Lis la taille sur ton pneu", intro)}
        </div>
        <div className="-mx-4 px-4 md:mx-0 md:px-0 flex gap-2 overflow-x-auto pb-1 md:flex-wrap [scrollbar-width:none]">
          {mineShown.map((g) => chip(g))}
          {moreBtn()}
        </div>
        {allToggle}
        {results}
      </>,
    );
  }

  /* ───────────── 2 · Ses tailles, rien d'autre ───────────── */
  if (variant === 2) {
    return shell(
      <>
        {title(inchTxt ? `Les tailles ${inchTxt}` : "Ta taille de pneu", intro)}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {mineShown.map((g) => {
            const active = g.key === selected;
            return (
              <button
                key={g.key}
                type="button"
                onClick={() => pick(g)}
                aria-pressed={active}
                className="flex items-center justify-between gap-3 min-h-[64px] px-4 py-3 text-left"
                style={{ clipPath: CHAMFER_S, background: active ? "#4A7C59" : "#FAFAF8", color: active ? "#fff" : "#1A1A1A", boxShadow: active ? "none" : LINE }}
              >
                <span>
                  <span className="block text-[22px] font-extrabold leading-none tracking-wide">{g.primary}</span>
                  {g.others.length > 0 && (
                    <span className={`block text-sm mt-1 ${active ? "text-white/75" : "text-gray-500"}`}>aussi écrit {g.others.join(" · ")}</span>
                  )}
                </span>
                <span className={`shrink-0 inline-flex items-center gap-1 text-sm font-bold ${active ? "text-white" : "text-[#4A7C59]"}`}>
                  {pieces(g.parts.length)} <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            );
          })}
        </div>
        {moreBtn() && <div className="mt-2">{moreBtn()}</div>}
        {allToggle}
        {results}
      </>,
    );
  }

  /* ───────────── 3 · Deux temps ───────────── */
  if (variant === 3) {
    return shell(
      <>
        {title("Trouve ta taille en 2 gestes", <>La taille est imprimée sur le flanc de ton pneu. Commence par le diamètre de la roue.</>)}
        <p className="text-sm font-extrabold uppercase tracking-wider text-[#1A1A1A] mb-2">1 · Ta roue fait</p>
        <div className="flex flex-wrap gap-2">
          {inches.map((n) => {
            const active = n === inchNow;
            return (
              <button
                key={n}
                type="button"
                onClick={() => { setPickedInch(n); setSelected(null); setMoreMine(false); }}
                aria-pressed={active}
                className="shrink-0 min-h-[48px] min-w-[64px] px-4 text-xl font-extrabold leading-none"
                style={{ clipPath: CHAMFER_S, background: active ? "#1A1A1A" : "#fff", color: active ? "#fff" : "#1A1A1A", boxShadow: active ? "none" : LINE }}
              >
                {inchLabel(n)}
              </button>
            );
          })}
        </div>
        {scooterInch != null && inchNow === scooterInch && (
          <p className="text-sm text-gray-500 mt-2">{inchLabel(scooterInch)} d'après le constructeur de ta {scooterName}.</p>
        )}
        <p className="text-sm font-extrabold uppercase tracking-wider text-[#1A1A1A] mt-5 mb-2">2 · Ce qui est écrit sur le flanc</p>
        {inchNow == null ? (
          <p className="text-sm text-gray-500">Choisis d'abord le diamètre.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {mineShown.map((g) => chip(g))}
            {moreBtn()}
          </div>
        )}
        {results}
      </>,
    );
  }

  /* ───────────── 4 · Flanc ───────────── */
  if (variant === 4) {
    const sample = mine[0]?.primary ?? "10x2.50-6.5";
    return shell(
      <>
        <div className="grid md:grid-cols-[220px_1fr] gap-5 items-center mb-5">
          <svg viewBox="0 0 220 140" className="w-full max-w-[260px] mx-auto md:mx-0" role="img" aria-label={`La taille est écrite sur le flanc, par exemple ${sample}`}>
            <defs>
              <path id="pt-flanc-arc" d="M 30 132 A 80 80 0 0 1 190 132" />
            </defs>
            <path d="M 10 140 A 100 100 0 0 1 210 140" fill="none" stroke="#3A3A3A" strokeWidth="34" />
            <path d="M 52 140 A 58 58 0 0 1 168 140" fill="none" stroke="#2A2A2A" strokeWidth="10" />
            <circle cx="110" cy="140" r="40" fill="#5A5A5A" />
            <text fontSize="15" fontWeight="800" letterSpacing="2.5" fill="#F5F0E8">
              <textPath href="#pt-flanc-arc" startOffset="50%" textAnchor="middle">{sample}</textPath>
            </text>
          </svg>
          {title(
            "C'est écrit sur ton pneu",
            <>{inchTxt ? <>Ta {scooterName} roule en {inchTxt}. </> : null}Cherche ces chiffres en relief sur le flanc, puis touche la même taille.</>,
            true,
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {mineShown.map((g) => {
            const active = g.key === selected;
            return (
              <button
                key={g.key}
                type="button"
                onClick={() => pick(g)}
                aria-pressed={active}
                className="min-h-[72px] px-3 py-3 text-left"
                style={{ clipPath: CHAMFER_S, background: active ? "#4A7C59" : "#2A2A2A", color: "#F5F0E8" }}
              >
                <span className="block text-[17px] font-extrabold tracking-[0.12em]">{g.primary}</span>
                <span className="block text-sm text-white/60 mt-1">{pieces(g.parts.length)}</span>
              </button>
            );
          })}
        </div>
        {moreBtn(true) && <div className="mt-2">{moreBtn(true)}</div>}
        {rest.length > 0 && (
          <div className="mt-4 [&_button]:!text-white [&_button]:decoration-white/30">
            {allToggle}
          </div>
        )}
        {current && <div className="mt-6 -mx-4 md:-mx-6 -mb-4 md:-mb-6 p-4 md:p-6 bg-white">{results}</div>}
      </>,
      true,
    );
  }

  /* ───────────── 5 · Recherche ───────────── */
  const found = q ? groups.filter(matchQ).slice(0, 12) : [];
  return shell(
    <>
      {title("Quelle taille est écrite sur ton pneu ?", intro)}
      {searchBox(true)}
      {!q && mine.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-gray-500 mb-2">{inchTxt ? `Les plus courantes en ${inchTxt} :` : "Les plus courantes :"}</p>
          <div className="flex flex-wrap gap-2">
            {mine.slice(0, 4).map((g) => chip(g))}
          </div>
        </div>
      )}
      {q && (
        <div className="mt-4 flex flex-wrap gap-2">
          {found.map((g) => chip(g))}
          {found.length === 0 && <p className="text-sm text-gray-500 py-2">Aucune pièce à cette taille pour l'instant — écris-nous, on la trouve pour toi.</p>}
        </div>
      )}
      {results}
    </>,
  );
};

export default TireSizeFinder;
