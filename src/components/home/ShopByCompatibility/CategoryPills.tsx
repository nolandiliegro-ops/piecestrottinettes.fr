import { motion } from "framer-motion";
import type { CategoryGroupV2 } from "@/hooks/useShopByCategoryDataV2";

interface Props {
  categories: CategoryGroupV2[];
  selectedSlugs: Set<string>;
  onToggle: (slug: string) => void;
}

/**
 * Filter Chips sombres (segmented pills) : avatar rond + nom + badge décompte.
 * Multi-sélection cumulable, scroll horizontal mobile, wrap dès sm.
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
        className="pt-chips-scroll flex gap-2 overflow-x-auto pr-4 pb-1 sm:flex-wrap sm:overflow-visible sm:pr-0"
        style={{ WebkitOverflowScrolling: "touch" }}
        role="group"
        aria-label="Filtrer par catégorie (multi-sélection)"
      >
        {categories.map((c) => (
          <CategoryChip
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

const CategoryChip = ({
  group,
  active,
  onClick,
}: {
  group: CategoryGroupV2;
  active: boolean;
  onClick: () => void;
}) => {
  const base =
    "flex-shrink-0 h-11 rounded-full px-4 py-2.5 flex items-center gap-2.5 transition-all border";
  const state = active
    ? "bg-[#4A7C59]/20 border-[#4A7C59] text-white font-medium shadow-[0_0_12px_rgba(74,124,89,0.3)]"
    : "bg-neutral-800/70 border-neutral-700/60 text-neutral-300 hover:bg-neutral-700/50";

  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={active}
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
      className={`${base} ${state}`}
    >
      {/* Avatar rond 28x28 */}
      <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-900/70">
        {group.image_url ? (
          <img
            src={group.image_url}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : group.icon ? (
          <span className="text-sm leading-none">{group.icon}</span>
        ) : (
          <span className="text-xs font-bold leading-none">
            {group.name.charAt(0).toUpperCase()}
          </span>
        )}
      </span>

      {/* Nom */}
      <span className="text-sm whitespace-nowrap">{group.name}</span>

      {/* Badge décompte */}
      <span className="bg-neutral-900/80 px-2 py-0.5 rounded-full text-xs text-neutral-300">
        {group.count}
      </span>
    </motion.button>
  );
};

export default CategoryPills;
