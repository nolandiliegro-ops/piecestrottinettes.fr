import { motion } from "framer-motion";
import { resolveCategoryColor } from "@/lib/categoryColors";
import type { CategoryGroupV2 } from "@/hooks/useShopByCategoryDataV2";

interface Props {
  categories: CategoryGroupV2[];
  selectedSlugs: Set<string>;
  onToggle: (slug: string) => void;
}

/**
 * Convertit un HEX #RGB ou #RRGGBB en rgba().
 * Fallback vert signature si le format est inattendu.
 */
const hexToRgba = (hex: string, alpha: number): string => {
  const trimmed = hex.trim();
  if (!trimmed.startsWith("#")) return `rgba(74, 124, 89, ${alpha})`;

  let normalized = trimmed.slice(1);
  if (normalized.length === 3) {
    normalized = normalized
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (normalized.length !== 6) return `rgba(74, 124, 89, ${alpha})`;

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);

  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return `rgba(74, 124, 89, ${alpha})`;
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Cartes catégories sombres : couleur signature dynamique en actif,
 * photo produit centrée, label bas et badge décompte.
 * Multi-sélection cumulable.
 */
const CategoryPills = ({ categories, selectedSlugs, onToggle }: Props) => {
  if (categories.length === 0) return null;

  return (
    <>
      <style>{`
        .pt-chips-scroll::-webkit-scrollbar { display: none; }
        .pt-chips-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div
        className="pt-chips-scroll flex gap-3 overflow-x-auto pb-4 scrollbar-none sm:grid sm:grid-cols-4 lg:grid-cols-7 sm:overflow-visible"
        style={{ WebkitOverflowScrolling: "touch" }}
        role="group"
        aria-label="Filtrer par catégorie (multi-sélection)"
      >
        {categories.map((c) => (
          <CategoryCard
            key={c.slug}
            group={c}
            active={selectedSlugs.has(c.slug)}
            onClick={() => onToggle(c.slug)}
          />
        ))}
      </div>
    </>
  );
};

const CategoryCard = ({
  group,
  active,
  onClick,
}: {
  group: CategoryGroupV2;
  active: boolean;
  onClick: () => void;
}) => {
  const hexColor = resolveCategoryColor(group.color, group.slug);

  const base =
    "relative h-28 sm:h-32 min-w-[115px] shrink-0 sm:min-w-0 rounded-2xl p-3 flex flex-col items-center justify-between transition-all cursor-pointer group";
  const state = active
    ? "bg-neutral-900/95 text-white border-2"
    : "bg-neutral-900/70 backdrop-blur-md border border-white/10 hover:border-white/25 hover:-translate-y-1";

  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={active}
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
      className={`${base} ${state}`}
      style={
        active
          ? {
              borderColor: hexColor,
              boxShadow: `0 0 20px ${hexToRgba(hexColor, 0.35)}`,
            }
          : undefined
      }
    >
      {/* Badge décompte */}
      <span className="absolute top-2 right-2 bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-white/90">
        {group.count}
      </span>

      {/* Visuel produit */}
      <span className="flex h-14 sm:h-16 w-full items-center justify-center pt-1">
        {group.image_url ? (
          <img
            src={group.image_url}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            className="h-14 sm:h-16 w-auto object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-200"
          />
        ) : group.icon ? (
          <span className="text-3xl leading-none group-hover:scale-105 transition-transform duration-200">
            {group.icon}
          </span>
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
            {group.name.charAt(0).toUpperCase()}
          </span>
        )}
      </span>

      {/* Label */}
      <span className="w-full text-xs font-black uppercase tracking-wider text-center text-white line-clamp-1">
        {group.name}
      </span>
    </motion.button>
  );
};

export default CategoryPills;
