import { motion } from "framer-motion";
import type { CategoryGroupV2 } from "@/hooks/useShopByCategoryDataV2";

interface Props {
  categories: CategoryGroupV2[];
  selectedSlugs: Set<string>;
  onToggle: (slug: string) => void;
}

/**
 * Cartes catégories sombres : accent vert unique, photo produit centrée,
 * label bas et badge décompte. Multi-sélection cumulable.
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
        className="pt-chips-scroll flex gap-3 overflow-x-auto pb-4 pr-4 sm:grid sm:grid-cols-4 lg:grid-cols-7 sm:overflow-visible sm:pr-0"
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
  const base =
    "relative h-24 sm:h-28 min-w-[110px] shrink-0 sm:min-w-0 rounded-2xl p-3 flex flex-col items-center justify-between transition-all cursor-pointer group";
  const state = active
    ? "bg-[#4A7C59]/20 border-2 border-[#4A7C59] shadow-[0_0_20px_rgba(74,124,89,0.3)] text-white"
    : "bg-neutral-900/80 border border-white/10 hover:border-white/25";

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
      {/* Badge décompte */}
      <span className="absolute top-2 right-2 bg-white/10 px-1.5 py-0.5 rounded-full text-[10px] text-white/70">
        {group.count}
      </span>

      {/* Visuel produit */}
      <span className="flex h-12 sm:h-14 w-full items-center justify-center pt-1">
        {group.image_url ? (
          <img
            src={group.image_url}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            className="h-12 sm:h-14 w-auto object-contain drop-shadow-md group-hover:scale-105 transition-transform"
          />
        ) : group.icon ? (
          <span className="text-2xl leading-none group-hover:scale-105 transition-transform">
            {group.icon}
          </span>
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
            {group.name.charAt(0).toUpperCase()}
          </span>
        )}
      </span>

      {/* Label */}
      <span className="w-full text-xs font-bold uppercase tracking-wider text-center text-white line-clamp-1">
        {group.name}
      </span>
    </motion.button>
  );
};

export default CategoryPills;
