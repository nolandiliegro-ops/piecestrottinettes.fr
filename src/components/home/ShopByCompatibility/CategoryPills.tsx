import { useState } from "react";
import { cn } from "@/lib/utils";
import { getCategoryColor } from "@/lib/categoryColors";
import type { CategoryGroupV2 } from "@/hooks/useShopByCategoryDataV2";

interface Props {
  categories: CategoryGroupV2[];
  selectedSlugs: Set<string>;
  onToggle: (slug: string) => void;
}

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
            color={getCategoryColor(c.slug).color}
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
  color,
  active,
  onClick,
}: {
  label: string;
  count: number;
  color: string;
  active: boolean;
  onClick: () => void;
}) => {
  const [hover, setHover] = useState(false);

  const style: React.CSSProperties = active
    ? {
        backgroundColor: hover ? "#2A2A2A" : "#1A1A1A",
        color: "#FFFFFF",
        border: "1px solid #1A1A1A",
        boxShadow: hover
          ? "0 4px 16px rgba(0,0,0,0.16)"
          : "0 4px 12px rgba(0,0,0,0.12)",
      }
    : {
        backgroundColor: hover ? "#FAFAFA" : "#FFFFFF",
        color: "#1A1A1A",
        border: hover
          ? "1px solid rgba(0,0,0,0.18)"
          : "1px solid rgba(0,0,0,0.08)",
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
        "flex-shrink-0 inline-flex items-center gap-1.5 rounded-full",
        "min-h-[44px] sm:min-h-[40px]"
      )}
      style={{
        scrollSnapAlign: "start",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: 13,
        fontWeight: 500,
        // Mobile padding 10x14 for touch comfort; desktop slightly more horizontal
        padding: "10px 14px",
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
          backgroundColor: color,
          boxShadow: active ? `0 0 6px ${color}80` : "none",
        }}
      />
      <span>{label}</span>
      <span
        className="inline-flex items-center justify-center"
        style={{
          fontSize: 10,
          fontWeight: 700,
          lineHeight: 1,
          padding: "1px 6px",
          borderRadius: 4,
          backgroundColor: active ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.06)",
          color: active ? "#FFFFFF" : "#6B7280",
        }}
      >
        {count}
      </span>
    </button>
  );
};

export default CategoryPills;
