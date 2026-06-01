import { motion } from "framer-motion";
import { resolveCategoryColor } from "@/lib/categoryColors";
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

/**
 * Tuiles catégories "Style 4" (gamification) : image + label + compteur,
 * couleur d'accent issue de la BDD (fallback mapping). Multi-sélection cumulable,
 * scroll horizontal au débordement (swipe natif mobile).
 */
const CategoryPills = ({ categories, selectedSlugs, onToggle }: Props) => {
  if (categories.length === 0) return null;

  return (
    <>
      <style>{`
        .pt-tiles-scroll::-webkit-scrollbar { display: none; }
        .pt-tiles-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div
        className="pt-tiles-scroll flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1"
        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
        role="group"
        aria-label="Filtrer par catégorie (multi-sélection)"
      >
        {categories.map((c) => (
          <CategoryTile
            key={c.slug}
            group={c}
            accent={resolveCategoryColor(c.color, c.slug)}
            active={selectedSlugs.has(c.slug)}
            onClick={() => onToggle(c.slug)}
          />
        ))}
      </div>
    </>
  );
};

const CategoryTile = ({
  group,
  accent,
  active,
  onClick,
}: {
  group: CategoryGroupV2;
  accent: string;
  active: boolean;
  onClick: () => void;
}) => {
  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={active}
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
      className="relative flex-shrink-0 flex flex-col items-center text-center"
      style={{
        scrollSnapAlign: "start",
        width: 96,
        minHeight: 116,
        padding: "10px 8px 8px",
        borderRadius: 14,
        backgroundColor: active ? hexToRgba(accent, 0.18) : "rgba(255,255,255,0.06)",
        border: active
          ? `2px solid ${accent}`
          : "1px solid rgba(255,255,255,0.12)",
        boxShadow: active ? `0 4px 16px ${hexToRgba(accent, 0.35)}` : "none",
        transition: "background-color 180ms ease-out, border-color 180ms ease-out, box-shadow 180ms ease-out",
      }}
    >
      {/* Check état sélectionné */}
      {active && (
        <span
          aria-hidden
          className="absolute top-1.5 right-1.5 flex items-center justify-center"
          style={{ width: 18, height: 18, borderRadius: 999, backgroundColor: accent }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}

      {/* Vignette image / fallback icône */}
      <span
        className="flex items-center justify-center"
        style={{
          width: 56,
          height: 56,
          borderRadius: 12,
          marginBottom: 7,
          backgroundColor: group.image_url ? "rgba(255,255,255,0.92)" : hexToRgba(accent, 0.22),
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {group.image_url ? (
          <img
            src={group.image_url}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            style={{ width: 48, height: 48, objectFit: "contain" }}
          />
        ) : group.icon ? (
          <span style={{ fontSize: 26, lineHeight: 1 }}>{group.icon}</span>
        ) : (
          <span
            aria-hidden
            style={{ width: 14, height: 14, borderRadius: 999, backgroundColor: accent }}
          />
        )}
      </span>

      {/* Label */}
      <span
        className="line-clamp-2"
        style={{
          fontFamily: FONT,
          fontSize: 11,
          fontWeight: 600,
          lineHeight: 1.15,
          color: active ? "#FFFFFF" : "rgba(255,255,255,0.92)",
          marginBottom: 4,
        }}
      >
        {group.name}
      </span>

      {/* Compteur produits */}
      <span
        className="inline-flex items-center justify-center"
        style={{
          fontFamily: FONT,
          fontSize: 10,
          fontWeight: 700,
          lineHeight: 1,
          padding: "2px 7px",
          borderRadius: 999,
          backgroundColor: active ? accent : "rgba(255,255,255,0.14)",
          color: active ? "#FFFFFF" : "rgba(255,255,255,0.7)",
        }}
      >
        {group.count}
      </span>
    </motion.button>
  );
};

export default CategoryPills;
