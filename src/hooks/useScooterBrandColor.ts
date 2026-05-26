import { useMemo } from "react";
import { useSelectedScooter, getBrandColors } from "@/contexts/ScooterContext";

const DEFAULT_COLOR = "#4A7C59";
// Mineral fallback returned by getBrandColors when brand is unknown
const UNKNOWN_BRAND_ACCENT = "#6B8E89";

export interface ScooterBrandColor {
  color: string;
  isDefault: boolean;
}

/**
 * Returns the accent HEX color of the currently-selected scooter's brand.
 * Falls back to #4A7C59 (vert sauge) when there is no scooter selected
 * OR when the brand is not in the BRAND_COLORS palette.
 */
export const useScooterBrandColor = (): ScooterBrandColor => {
  const { selectedScooter } = useSelectedScooter();
  const brandName = selectedScooter?.brandName;

  return useMemo<ScooterBrandColor>(() => {
    if (!brandName) {
      return { color: DEFAULT_COLOR, isDefault: true };
    }
    const cfg = getBrandColors(brandName);
    if (cfg.accent === UNKNOWN_BRAND_ACCENT) {
      return { color: DEFAULT_COLOR, isDefault: true };
    }
    return { color: cfg.accent, isDefault: false };
  }, [brandName]);
};
