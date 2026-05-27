import { useState } from "react";
import { cn } from "@/lib/utils";
import { getCategoryColor } from "@/lib/categoryColors";
import type { CategoryGroupV2 } from "@/hooks/useShopByCategoryDataV2";

interface Props {
  categories: CategoryGroupV2[];
  selectedSlugs: Set<string>;
  onToggle: (slug: string) => void;
  /** Brand accent color (HEX). When provided, active pills take this color. */
  accentColor?: string;
}

const FONT = "'Inter', sans-serif";
const ACTIVE_DEFAULT = "#1A1A1A";

const hexToRgba = (hex: string, alpha: number): string => {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

const CategoryPills = ({ categories, selectedSlugs, onToggle, accentColor }: Props) => {
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
            activeColor={accentColor ?? ACTIVE_DEFAULT}
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
        backgroundColor: "#FFFFFF",
        color: "#1A1A1A",
        border: hover
          ? "0.5px solid rgba(0,0,0,0.18)"
          : "0.5px solid rgba(0,0,0,0.10)",
        boxShadow: hover ? "0 2px 8px rgba(0,0,0,0.04)" : "none",
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
          backgroundColor: active ? "rgba(255,255,255,0.20)" : "rgba(0,0,0,0.06)",
          color: active ? "#FFFFFF" : "#6B7280",
        }}
      >
        {count}
      </span>
    </button>
  );
};

export default CategoryPills;
