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
}) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={active}
    onClick={onClick}
    className={cn(
      "flex-shrink-0 inline-flex items-center gap-1.5 rounded-full transition-all duration-150",
      "min-h-[44px] sm:min-h-[36px] px-[14px]",
      active
        ? "bg-[#1A1A1A] text-white"
        : "bg-white text-[#1A1A1A] hover:border-[#1A1A1A]"
    )}
    style={{
      scrollSnapAlign: "start",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: 12,
      fontWeight: 500,
      border: active ? "0.5px solid #1A1A1A" : "0.5px solid rgba(0,0,0,0.12)",
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

export default CategoryPills;
