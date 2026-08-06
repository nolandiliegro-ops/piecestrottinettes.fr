import { motion } from "framer-motion";
import type { CategoryGroupV2 } from "@/hooks/useShopByCategoryDataV2";
import { resolveCategoryColor } from "@/lib/categoryColors";

interface Props {
  categories: CategoryGroupV2[];
  selectedSlugs: Set<string>;
  onToggle: (slug: string) => void;
}

/** HEX -> rgba() (Tailwind ne peut pas interpoler une couleur dynamique). */
const hexToRgba = (hex: string, alpha: number): string => {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const int = parseInt(full, 16);
  if (Number.isNaN(int)) return `rgba(74,124,89,${alpha})`;
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r},${g},${b},${alpha})`;
};

/**
 * Cartes glassmorphic 3D : photo produit centrée, label bas, badge décompte.
 * Multi-sélection cumulable, scroll horizontal mobile, grille dès sm.
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
  const accent = resolveCategoryColor((group as { color?: string | null }).color, group.slug);

  const base =
    "relative h-24 sm:h-28 min-w-[104px] shrink-0 sm:min-w-0 rounded-2xl bg-neutral-900/60 backdrop-blur-md border border-white/10 p-3 flex flex-col items-center justify-between transition-all cursor-pointer hover:-translate-y-1";
  const state = active
    ? "border-2 bg-neutral-900/90 text-white"
    : "text-neutral-300 hover:border-white/20";

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
          ? { borderColor: accent, boxShadow: `0 0 20px ${hexToRgba(accent, 0.35)}` }
          : undefined
      }
    >
      {/* Badge décompte */}
      <span className="absolute top-2 right-2 bg-white/10 backdrop-blur px-1.5 py-0.5 rounded-full text-[10px] text-white/80">
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
            className="h-12 sm:h-14 w-auto object-contain drop-shadow-md"
          />
        ) : group.icon ? (
          <span className="text-2xl leading-none">{group.icon}</span>
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
            {group.name.charAt(0).toUpperCase()}
          </span>
        )}
      </span>

      {/* Label */}
      <span className="text-xs font-bold text-white uppercase tracking-wider text-center line-clamp-1 w-full">
        {group.name}
      </span>
    </motion.button>
  );
};

export default CategoryPills;
