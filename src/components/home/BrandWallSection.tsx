import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { useBrandWall, type BrandAxis, type BrandWallItem } from "@/hooks/useBrandWall";
import { useIsMobile } from "@/hooks/use-mobile";
import BrandTile from "./BrandTile";

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const CHIPS: { key: BrandAxis; label: string; icon: string }[] = [
  { key: "performance", label: "Performance", icon: "⚡" },
  { key: "autonomy", label: "Autonomie", icon: "🔋" },
];

interface Props {
  /** When true (home preview), cap to 12 tiles and show the "voir toutes" CTA. */
  limited?: boolean;
}

interface Row {
  b: BrandWallItem;
  isNumberOne: boolean;
}

const BrandWallSection = ({ limited = true }: Props) => {
  const { data, isLoading, error } = useBrandWall();
  const isMobile = useIsMobile();
  const [q, setQ] = useState("");
  const [axis, setAxis] = useState<BrandAxis | null>(null);

  const searched = useMemo(() => {
    const list = data ?? [];
    const nq = normalize(q.trim());
    return nq ? list.filter((b) => normalize(b.name).includes(nq)) : list;
  }, [data, q]);

  // Inactive chip: current wall untouched. Active chip: sort by champion score,
  // sponsored brands pinned on top (never mixed into the organic ranking).
  const ordered: Row[] = useMemo(() => {
    if (!axis) {
      const base = limited ? searched.slice(0, 12) : searched;
      return base.map((b) => ({ b, isNumberOne: false }));
    }
    const rows = searched.map((b) => ({ b, score: b.champions[axis]?.score ?? null }));
    const cmp = (a: (typeof rows)[number], c: (typeof rows)[number]) => {
      const sa = a.score ?? -1;
      const sc = c.score ?? -1;
      if (sc !== sa) return sc - sa;
      return a.b.name.localeCompare(c.b.name);
    };
    const sponsored = rows.filter((r) => r.b.sponsored).sort(cmp);
    const organic = rows.filter((r) => !r.b.sponsored).sort(cmp);
    const merged = [...sponsored, ...organic];
    const capped = limited ? merged.slice(0, 12) : merged;
    const n1Id = organic.find((r) => r.score !== null)?.b.id ?? null;
    return capped.map((r) => ({ b: r.b, isNumberOne: r.b.id === n1Id }));
  }, [searched, axis, limited]);

  const gridStyle: React.CSSProperties = {
    gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)",
    gridAutoRows: isMobile ? "140px" : "150px",
    gap: 13,
    gridAutoFlow: axis ? "row" : "dense",
    perspective: "1300px",
  };

  return (
    <section
      className="relative py-16 md:py-24"
      style={{ backgroundColor: "#F5F0E8" }}
      aria-labelledby="brand-wall-title"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <header className="mb-8 md:mb-10 text-center">
          <h2
            id="brand-wall-title"
            className="text-3xl md:text-5xl"
            style={{
              fontFamily: "'Unbounded', sans-serif",
              fontWeight: 900,
              color: "#1A1A1A",
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            Choisis ta marque
          </h2>
          <p
            className="mt-3 text-base md:text-lg max-w-2xl mx-auto"
            style={{ fontFamily: "'Sora', sans-serif", color: "#4A4A4A" }}
          >
            Chaque marque a son ADN. Trouve la tienne, puis ses pièces 100 % compatibles.
          </p>
        </header>

        <div className="mb-6 md:mb-8 max-w-md mx-auto">
          <label htmlFor="brand-wall-search" className="sr-only">
            Rechercher une marque
          </label>
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
              style={{ color: "#6B7280" }}
              aria-hidden
            />
            <input
              id="brand-wall-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher une marque…"
              className="w-full h-12 pl-12 pr-4 rounded-xl border bg-white outline-none focus:ring-2 focus:ring-[#4A7C59]/40 transition"
              style={{
                borderColor: "rgba(26,26,26,0.12)",
                fontFamily: "'Sora', sans-serif",
                fontSize: 16,
                color: "#1A1A1A",
              }}
            />
          </div>
        </div>

        <div className="mb-6 md:mb-8 flex items-center justify-center gap-2">
          {CHIPS.map((c) => {
            const on = axis === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setAxis(on ? null : c.key)}
                aria-pressed={on}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-full border font-semibold transition-colors"
                style={{
                  backgroundColor: on ? "#4A7C59" : "#FFFFFF",
                  color: on ? "#FFFFFF" : "#1A1A1A",
                  borderColor: on ? "#4A7C59" : "rgba(26,26,26,0.12)",
                  fontFamily: "'Sora', sans-serif",
                  fontSize: 15,
                }}
              >
                <span aria-hidden>{c.icon}</span>
                {c.label}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="grid animate-pulse" style={gridStyle}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-black/5" />
            ))}
          </div>
        ) : error ? (
          <p className="text-center text-sm" style={{ color: "#B91C1C" }}>
            Impossible de charger les marques.
          </p>
        ) : ordered.length === 0 ? (
          <p
            className="text-center text-sm"
            style={{ color: "#6B7280", fontFamily: "'Sora',sans-serif" }}
          >
            Aucune marque ne correspond à "{q}".
          </p>
        ) : (
          <div className="grid" style={gridStyle}>
            {ordered.map(({ b, isNumberOne }) => (
              <BrandTile
                key={b.id}
                brand={b}
                axis={axis}
                champion={axis ? b.champions[axis] : null}
                isNumberOne={isNumberOne}
                isSponsored={!!axis && b.sponsored}
                forceBig={isNumberOne}
              />
            ))}
          </div>
        )}

        {limited && (
          <div className="mt-10 flex justify-center">
            <Link
              to="/marques"
              className="inline-flex items-center justify-center h-12 px-8 rounded-xl text-white font-semibold transition-colors"
              style={{
                backgroundColor: "#4A7C59",
                fontFamily: "'Sora', sans-serif",
                fontSize: 16,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#3A6449")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#4A7C59")}
            >
              Voir les 50 marques
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default BrandWallSection;
