import { useState } from "react";
import { cn } from "@/lib/utils";
import { getCategoryColor } from "@/lib/categoryColors";
import type { CategoryGroupV2 } from "@/hooks/useShopByCategoryDataV2";

interface Props {
  categories: CategoryGroupV2[];
  selectedSlugs: Set<string>;
  onToggle: (slug: string) => void;
}

const FONT = "'Inter', sans-serif";

const hexToRgba = (hex: string, alpha: number): string => {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

const CategoryPills = ({ categories, selectedSlugs, onToggle }: Props) => {
  if (categories.length === 0) return null;

  return (
    <>
      <style>{`
        .pt-pills-scroll::-webkit-scrollbar { display: none; }
        .pt-pills-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div
        className="pt-pills-scroll flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
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
            onClick={() => onToggle(c.slug)}
          />
        ))}
      </div>
    </>
  );
};

const PillButton = ({
  label,
  count,
  dotColor,
  active,
  onClick,
}: {
  label: string;
  count: number;
  dotColor: string;
  active: boolean;
  onClick: () => void;
}) => {
  const [hover, setHover] = useState(false);

  const style: React.CSSProperties = active
    ? {
        // Actif : fond blanc + texte fonce (systeme couleur passe 2, plus d'orange).
        backgroundColor: "#FFFFFF",
        color: "#1A1A1A",
        border: "0.5px solid #FFFFFF",
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
      }
    : {
        // Inactif : surface grise lisible sur fond dark.
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
          backgroundColor: active ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.16)",
          color: active ? "#1A1A1A" : "rgba(255,255,255,0.75)",
        }}
      >
        {count}
      </span>
    </button>
  );
};

export default CategoryPills;
