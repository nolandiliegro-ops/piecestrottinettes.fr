export interface CategoryColorConfig {
  color: string; // HEX accent color
  short: string; // short label for the color patch (e.g. "Pneus")
}

// Hardcoded palette per category slug.
// Includes alias slugs (e.g. "chambres-air" vs "chambres-a-air") so the dedup
// at the data layer doesn't need to know the canonical color.
export const CATEGORY_COLORS: Record<string, CategoryColorConfig> = {
  pneus: { color: "#FF6600", short: "Pneus" },
  "pneus-pleins": { color: "#0E7490", short: "Pneu plein" },
  plaquettes: { color: "#DC2626", short: "Plaq" },
  "disques-plaquettes": { color: "#DC2626", short: "Plaq" },
  "chambres-air": { color: "#4A7C59", short: "Chambre" },
  "chambres-a-air": { color: "#4A7C59", short: "Chambre" },
  chargeurs: { color: "#F59E0B", short: "Charg" },
  disques: { color: "#57534E", short: "Disq" },
  batteries: { color: "#7C3AED", short: "Batt" },
  eclairage: { color: "#FACC15", short: "Light" },
  guidon: { color: "#1A1A1A", short: "Guid" },
  accessoires: { color: "#6B7280", short: "Acc" },
  "accessoires-divers": { color: "#475569", short: "Acc" },
};

const DEFAULT: CategoryColorConfig = { color: "#6B7280", short: "" };

// Light yellow doesn't pass contrast on a near-white patch; swap for dark amber.
const TEXT_COLOR_FIX: Record<string, string> = {
  "#FACC15": "#7C5400",
};

export const getCategoryColor = (slug: string | null | undefined): CategoryColorConfig => {
  if (!slug) return DEFAULT;
  return CATEGORY_COLORS[slug] ?? DEFAULT;
};

/**
 * Couleur d'accent d'une catégorie : privilégie la valeur BDD (categories.color),
 * sinon retombe sur le mapping hardcodé par slug.
 */
export const resolveCategoryColor = (
  dbColor: string | null | undefined,
  slug: string | null | undefined
): string => {
  const trimmed = dbColor?.trim();
  return trimmed ? trimmed : getCategoryColor(slug).color;
};

/**
 * Returns the text color to use on a translucent patch background of this color.
 * For too-light hues (yellow), returns a dark variant to keep WCAG-readable contrast.
 */
export const getCategoryTextColor = (color: string): string =>
  TEXT_COLOR_FIX[color.toUpperCase()] ?? color;

/**
 * Builds a short label from a category name when no `short` is defined.
 * Takes the first word, capitalizes, truncates to 6 chars.
 */
export const buildShortLabel = (name: string): string => {
  const first = name.trim().split(/\s+/)[0] ?? "";
  const truncated = first.slice(0, 6);
  return truncated.charAt(0).toUpperCase() + truncated.slice(1);
};

export const getShortLabel = (slug: string | null | undefined, fallbackName: string): string => {
  const cfg = getCategoryColor(slug);
  return cfg.short || buildShortLabel(fallbackName);
};
