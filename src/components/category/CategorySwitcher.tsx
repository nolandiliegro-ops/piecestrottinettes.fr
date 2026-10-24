import { Link } from "react-router-dom";
import { useCategoryPartsCount } from "@/hooks/useCategoryPartsCount";
import { resolveCategoryIcon } from "@/lib/categoryIcons";

interface CategorySwitcherProps {
  currentSlug: string;
}

// Barre horizontale de navigation entre catégories (façon /marque · /trottinettes).
// Source = useCategoryPartsCount (catégories parentes + count, déjà caché par TanStack, comme le Footer).
const CategorySwitcher = ({ currentSlug }: CategorySwitcherProps) => {
  const { data: categories = [], isLoading } = useCategoryPartsCount();

  // Pas de skeleton bruyant : on n'affiche rien tant que la liste n'est pas là.
  if (isLoading) return null;

  // On garde les catégories ayant des pièces (pas de cul-de-sac) + TOUJOURS la courante.
  const items = categories.filter((c) => c.parts_count > 0 || c.slug === currentSlug);

  // Une barre à 1 élément (juste la courante) n'a aucun intérêt → on n'affiche rien.
  if (items.length < 2) return null;

  return (
    <nav aria-label="Autres catégories" className="-mx-4 md:-mx-8 mt-5">
      <ul
        className="flex gap-2 overflow-x-auto px-4 md:px-8 py-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollSnapType: "x proximity" }}
      >
        {items.map((cat) => {
          const Icon = resolveCategoryIcon(cat.icon, cat.slug);
          const isActive = cat.slug === currentSlug;

          const base =
            "inline-flex items-center gap-2.5 min-h-[52px] shrink-0 pl-1.5 pr-4 text-sm font-extrabold whitespace-nowrap transition-colors";
  // 17/10 : plaques à coin coupé (identité du site), plus de pilules rondes.
  const CHAMFER = "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)";

          if (isActive) {
            return (
              <li key={cat.id} style={{ scrollSnapAlign: "start" }}>
                <span aria-current="page" className={base} style={{ backgroundColor: "#4A7C59", color: "#FFFFFF", clipPath: CHAMFER }}>
                  {cat.image_url
                    ? <img src={cat.image_url} alt="" loading="lazy" className="h-9 w-9 shrink-0 object-contain" style={{ background: isActive ? "#FFFFFF" : "#F5F0E8" }} />
                    : <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />}
                  {cat.name}
                </span>
              </li>
            );
          }

          return (
            <li key={cat.id} style={{ scrollSnapAlign: "start" }}>
              <Link
                to={`/categorie/${cat.slug}`}
                aria-label={`Voir la catégorie ${cat.name}`}
                className={`${base} bg-white hover:bg-[#1A1A1A]/[0.04]`}
                style={{ boxShadow: "inset 0 0 0 1px #E2DCD0", color: "#1A1A1A", clipPath: CHAMFER }}
              >
                {cat.image_url
                    ? <img src={cat.image_url} alt="" loading="lazy" className="h-9 w-9 shrink-0 object-contain" style={{ background: isActive ? "#FFFFFF" : "#F5F0E8" }} />
                    : <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden />}
                {cat.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default CategorySwitcher;
