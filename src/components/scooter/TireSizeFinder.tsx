import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CircleDot, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCategories } from "@/hooks/useScooterData";
import PartCard from "@/components/parts/PartCard";

/**
 * « Lis la taille sur ton pneu » (17/10/2026).
 * Affiché sur une fiche trottinette qui n'a AUCUN pneu / chambre / pneu plein relié :
 * la taille est imprimée sur le flanc de chaque pneu (« 10x2.50-6.5 », « 60/70-6.5 »).
 * Le client choisit sa taille → on affiche nos pièces de cette taille.
 * Chaque choix est enregistré (tire_size_reports, insertion seule) : plusieurs clients
 * concordants = une compatibilité à corroborer, jamais écrite telle quelle.
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

type SizeGroup = { key: string; label: string; aliases: string[]; rim: string; section: string; parts: TirePart[] };

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

interface TireSizeFinderProps {
  scooterId?: string;
  scooterName: string;
}

const TireSizeFinder = ({ scooterId, scooterName }: TireSizeFinderProps) => {
  const { data: categories = [] } = useCategories();
  const categoryIds = categories.filter((c) => TIRE_CATEGORIES.includes(c.slug)).map((c) => c.id);
  const { data: parts = [], isLoading } = useTireParts(categoryIds);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

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
            g = { key, label: "", aliases: [], rim, section: classOf(sec), parts: [] };
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
    for (const g of map.values()) g.label = g.aliases.map((a) => sizeLabel(a, g.rim)).join(" · ");
    return [...map.values()].sort((a, b) => b.parts.length - a.parts.length);
  }, [parts]);

  const q = norm(query);
  const shown = q ? groups.filter((g) => norm(g.label).includes(q)) : groups;
  const current = groups.find((g) => g.key === selected) ?? null;

  if (isLoading || groups.length === 0) return null;

  return (
    <div className="mt-8 rounded-2xl border border-border bg-card p-4 md:p-6">
      <div className="flex items-start gap-3 mb-3">
        <CircleDot className="w-6 h-6 text-green-700 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-display text-xl md:text-2xl text-foreground uppercase">
            Lis la taille sur ton pneu
          </h3>
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
              onClick={() => {
                setSelected(active ? null : g.key);
                if (!active && scooterId) reportSize(scooterId, g.rim, g.section);
              }}
              className={`flex-shrink-0 min-h-[44px] px-4 rounded-full border text-sm font-semibold whitespace-nowrap transition-colors ${
                active
                  ? "bg-green-700 border-green-700 text-white"
                  : "bg-white border-border text-foreground hover:border-green-700"
              }`}
            >
              {g.label}
              <span className={`ml-2 font-normal ${active ? "text-white/80" : "text-muted-foreground"}`}>
                {g.parts.length}
              </span>
            </button>
          );
        })}
        {shown.length === 0 && (
          <p className="text-sm text-muted-foreground py-2">
            Aucune pièce à cette taille pour l'instant — écris-nous, on la trouve pour toi.
          </p>
        )}
      </div>

      {current && (
        <div className="mt-6">
          <p className="text-sm text-muted-foreground mb-4">
            {current.parts.length} pièce{current.parts.length > 1 ? "s" : ""} en {current.label} — vérifie que la
            taille correspond exactement à celle de ton pneu.
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
      )}
    </div>
  );
};

export default TireSizeFinder;
