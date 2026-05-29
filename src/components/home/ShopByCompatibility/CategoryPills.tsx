import { useState } from "react";
import { Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCategoryColor } from "@/lib/categoryColors";
import type { CategoryGroupV2 } from "@/hooks/useShopByCategoryDataV2";

interface Props {
  categories: CategoryGroupV2[];
  selectedSlugs: Set<string>;
  onToggle: (slug: string) => void;
  /** Brand accent color (HEX). When provided, active pills take this color. */
  accentColor?: string;
  /** True quand une trottinette est selectionnee (mode trotti actif). */
  hasScooter: boolean;
  /** Ouvre le selecteur de trottinette. */
  onSelectMyTrotti: () => void;
}

const FONT = "'Inter', sans-serif";
// Dark mode : orange par defaut pour visibilite sur fond dark.
const ACTIVE_DEFAULT = "#FF6600";

const hexToRgba = (hex: string, alpha: number): string => {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

const CategoryPills = ({
  categories,
  selectedSlugs,
  onToggle,
  accentColor,
  hasScooter,
  onSelectMyTrotti,
}: Props) => {
  if (categories.length === 0) return null;

  const activeColor = accentColor ?? ACTIVE_DEFAULT;

  return (
    <>
      <style>{`
        .pt-pills-scroll::-webkit-scrollbar { display: none; }
        .pt-pills-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="flex items-stretch gap-2">
        {/* Filtre modele "Pour ma trottinette" — ancre a gauche, distinct des categories */}
        <TrottiButton
          active={hasScooter}
          activeColor={activeColor}
          onClick={onSelectMyTrotti}
        />

        {/* Separateur visuel entre le filtre modele et les categories */}
        <div
          aria-hidden
          className="flex-shrink-0 self-stretch my-0.5"
          style={{ width: 1, backgroundColor: "rgba(255,255,255,0.14)" }}
        />

        <div
          className="pt-pills-scroll flex gap-2 overflow-x-auto pb-1 px-0.5 min-w-0"
          style={{
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
          }}
          role="group"
          aria-label="Filtrer par catégorie (multi-sélection)"
        >
          {categories.map((c) => (
            <PillButton
              key={c.slug}
              label={c.name}
              count={c.count}
              dotColor={getCategoryColor(c.slug).color}
              active={selectedSlugs.has(c.slug)}
              activeColor={activeColor}
              onClick={() => onToggle(c.slug)}
            />
          ))}
        </div>
      </div>
    </>
  );
};

const TrottiButton = ({
  active,
  activeColor,
  onClick,
}: {
  active: boolean;
  activeColor: string;
  onClick: () => void;
}) => {
  const [hover, setHover] = useState(false);

  const style: React.CSSProperties = active
    ? {
        backgroundColor: activeColor,
        color: "#FFFFFF",
        border: `1px solid ${activeColor}`,
        boxShadow: `0 2px 10px ${hexToRgba(activeColor, 0.3)}`,
      }
    : {
        backgroundColor: hover ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.10)",
        color: "#FFFFFF",
        border: "1px solid rgba(255,255,255,0.30)",
        boxShadow: hover ? "0 2px 8px rgba(0,0,0,0.20)" : "none",
      };

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-pressed={active}
      className="flex-shrink-0 inline-flex items-center gap-1.5 min-h-[44px] sm:min-h-[40px]"
      style={{
        fontFamily: FONT,
        fontSize: 12,
        fontWeight: 700,
        padding: "8px 14px",
        borderRadius: 999,
        transition: "all 200ms ease-out",
        ...style,
      }}
    >
      <Target size={14} strokeWidth={2.4} />
      <span>Pour ma trottinette</span>
    </button>
  );
};

const PillButton = ({
  label,
  count,
  dotColor,
  active,
  activeColor,
  onClick,
}: {
  label: string;
  count: number;
  dotColor: string;
  active: boolean;
  activeColor: string;
  onClick: () => void;
}) => {
  const [hover, setHover] = useState(false);

  const style: React.CSSProperties = active
    ? {
        backgroundColor: activeColor,
        color: "#FFFFFF",
        border: `0.5px solid ${activeColor}`,
        boxShadow: `0 2px 8px ${hexToRgba(activeColor, 0.2)}`,
      }
    : {
        // Contraste corrige : fond + texte plus clairs pour lisibilite sur dark.
        backgroundColor: hover ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.10)",
        color: "rgba(255,255,255,0.92)",
        border: hover
          ? "0.5px solid rgba(255,255,255,0.30)"
          : "0.5px solid rgba(255,255,255,0.20)",
        boxShadow: hover ? "0 2px 8px rgba(0,0,0,0.20)" : "none",
        transform: hover ? "translateY(-1px)" : "translateY(0)",
      };

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={active}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn(
        "flex-shrink-0 inline-flex items-center gap-1.5",
        "min-h-[44px] sm:min-h-[36px]"
      )}
      style={{
        scrollSnapAlign: "start",
        fontFamily: FONT,
        fontSize: 11.5,
        fontWeight: 500,
        padding: "7px 13px",
        borderRadius: 6,
        transition: "all 200ms ease-out",
        ...style,
      }}
    >
      <span
        aria-hidden
        className="inline-block rounded-full flex-shrink-0"
        style={{
          width: 6,
          height: 6,
          backgroundColor: dotColor,
          boxShadow: active ? `0 0 6px ${hexToRgba(dotColor, 0.5)}` : "none",
        }}
      />
      <span>{label}</span>
      <span
        className="inline-flex items-center justify-center"
        style={{
          fontSize: 10,
          fontWeight: 700,
          lineHeight: 1,
          padding: "1px 5px",
          borderRadius: 3,
          backgroundColor: active ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.16)",
          color: active ? "#FFFFFF" : "rgba(255,255,255,0.75)",
        }}
      >
        {count}
      </span>
    </button>
  );
};

export default CategoryPills;
