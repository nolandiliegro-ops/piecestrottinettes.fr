import {
  Disc,
  CircleDot,
  CircleDashed,
  Octagon,
  Plug,
  Battery,
  Backpack,
  LayoutGrid,
  Cog,
  Cpu,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";

/**
 * Registry nom Lucide -> composant. La BDD (categories.lucide_icon) stocke un NOM
 * (ex: "Disc"), jamais un composant. Miroir du pattern resolveCategoryColor
 * (src/lib/categoryColors.ts) : on privilégie la valeur BDD, sinon fallback legacy.
 */
export const ICON_REGISTRY: Record<string, LucideIcon> = {
  Disc,
  CircleDot,
  CircleDashed,
  Octagon,
  Plug,
  Battery,
  Backpack,
  LayoutGrid,
  Cog,
  Cpu,
  Lightbulb,
};

/**
 * Fallback LEGACY par slug — utilisé uniquement pour les catégories dont
 * categories.lucide_icon est encore NULL (nouvelles catégories non backfillées).
 * Reprend à l'identique la map historique de CategoryBentoGrid.
 */
export const LEGACY_SLUG_ICON: Record<string, LucideIcon> = {
  pneus: Disc,
  "chambres-air": CircleDot,
  "disques-plaquettes": Octagon,
  chargeurs: Plug,
  batteries: Battery,
  accessoires: Backpack,
};

const DEFAULT_ICON: LucideIcon = LayoutGrid;

/**
 * Icône d'une catégorie : privilégie le nom Lucide en BDD (categories.lucide_icon),
 * sinon retombe sur le mapping legacy par slug, sinon icône par défaut.
 */
export const resolveCategoryIcon = (
  lucideName: string | null | undefined,
  slug: string | null | undefined
): LucideIcon => {
  const name = lucideName?.trim();
  if (name && ICON_REGISTRY[name]) return ICON_REGISTRY[name];
  if (slug && LEGACY_SLUG_ICON[slug]) return LEGACY_SLUG_ICON[slug];
  return DEFAULT_ICON;
};
