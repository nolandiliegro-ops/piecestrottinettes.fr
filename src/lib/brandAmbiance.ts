import type { CSSProperties } from "react";

/**
 * Brand ambiance design-system — "drama premium" edition.
 *
 * Everything is DERIVED from a single `accent_color` (hex) + `display_order`.
 * No per-slug hardcoding — a brand inherits one of 6 modular ambiance "patterns"
 * via `display_order % 6`, then each pattern is tinted by the brand's accent.
 * Scales cleanly from 2 to 50+ brands.
 *
 * Visual target: dark, collectible-card depth floating on the beige page, with a
 * single LIGHT pattern ("soft-light") breaking the rhythm. Mirrors the
 * accent+alpha technique already used in BrandHero.tsx (`${accent}1f`).
 */

const NEUTRAL_FALLBACK = "#6b7280"; // gris neutre — décision GO BUILD #5
const DARK_BASE = "#0a0a0a";
const DARK_MID = "#18181b";
const LIGHT_BASE = "#fff7ed"; // blanc cassé chaud (soft-light)

export type TexturePattern =
  | "diagonal-lines"
  | "grid"
  | "hatch"
  | "soft"
  | "none";

export type BorderStyle = "solid" | "dashed" | "double";
export type GlowIntensity = "subtle" | "medium" | "strong";
export type LogoBoxShape = "rounded" | "circle" | "square";

export interface BrandAmbianceInput {
  accent_color: string | null;
  display_order: number | null;
  slug: string;
}

export interface BrandAmbiance {
  accent: string;
  isLight: boolean;
  containerStyle: CSSProperties;
  textureStyle: CSSProperties;
  glowStyle: CSSProperties;
  logoBoxShape: LogoBoxShape;
  ghostColor: string;
  patternName: string;
}

/**
 * Normalise a hex string to a 6-digit lowercase `#rrggbb`.
 * Accepts `#rgb`, `rgb`, `#rrggbb`, `rrggbb`. Returns null when invalid.
 */
export function normalizeHex(hex: string | null | undefined): string | null {
  if (!hex) return null;
  let h = hex.trim().toLowerCase();
  if (h.startsWith("#")) h = h.slice(1);
  if (/^[0-9a-f]{3}$/.test(h)) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (/^[0-9a-f]{6}$/.test(h)) return `#${h}`;
  return null;
}

/**
 * Append an alpha channel (0..1) to a hex colour → 8-digit `#rrggbbaa`.
 * Invalid input falls back to the neutral grey so callers never crash.
 */
export function hexWithAlpha(hex: string | null | undefined, alpha: number): string {
  const base = normalizeHex(hex) ?? NEUTRAL_FALLBACK;
  const a = Math.max(0, Math.min(1, alpha));
  const aa = Math.round(a * 255)
    .toString(16)
    .padStart(2, "0");
  return `${base}${aa}`;
}

/**
 * Deterministic non-negative hash from a slug — fallback ambiance index when
 * `display_order` is null.
 */
export function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 31 + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * CSS texture overlay derived from the accent. Amplified vs the first pass so it
 * actually reads on a dark card, while staying tasteful.
 */
export function textureCss(pattern: TexturePattern, accent: string): CSSProperties {
  // Softened vs the first pass to kill the aliasing/"pixelisé" look:
  // thicker, fainter lines + slightly wider spacing.
  const line = hexWithAlpha(accent, 0.1);
  const gridLine = hexWithAlpha(accent, 0.07);
  const dot = hexWithAlpha(accent, 0.15);

  switch (pattern) {
    case "diagonal-lines":
      return {
        backgroundImage: `repeating-linear-gradient(45deg, ${line} 0, ${line} 1.5px, transparent 1.5px, transparent 14px)`,
      };
    case "hatch":
      return {
        backgroundImage: `repeating-linear-gradient(135deg, ${line} 0, ${line} 1.5px, transparent 1.5px, transparent 13px)`,
      };
    case "grid":
      return {
        backgroundImage: `repeating-linear-gradient(0deg, ${gridLine} 0, ${gridLine} 1px, transparent 1px, transparent 26px), repeating-linear-gradient(90deg, ${gridLine} 0, ${gridLine} 1px, transparent 1px, transparent 26px)`,
      };
    case "soft":
      return {
        backgroundImage: `radial-gradient(${dot} 1.2px, transparent 2px)`,
        backgroundSize: "16px 16px",
      };
    case "none":
    default:
      return {};
  }
}

interface Pattern {
  name: string;
  isLight: boolean;
  angle: number; // gradient angle (deg)
  g1: number; // accent alpha — vivid corner stop (dark patterns)
  g2: number; // accent alpha — mid fade stop (dark patterns)
  borderStyle: BorderStyle;
  borderWidth: number;
  borderAlpha: number;
  texture: TexturePattern;
  glow: GlowIntensity;
  logoBoxShape: LogoBoxShape;
  radius: string;
}

/**
 * The 6 ambiance patterns — selected by `display_order % 6`.
 *
 * Order matters: with the live data (display_order 1..6), this places the single
 * LIGHT pattern (`soft-light`, index 4) on Xiaomi (display_order 4), as intended.
 *   idx 0 → d.o. 6 (Ninebot)   idx 3 → d.o. 3 (Segway)
 *   idx 1 → d.o. 1 (Dualtron)  idx 4 → d.o. 4 (Xiaomi) ← LIGHT
 *   idx 2 → d.o. 2 (Kaabo)     idx 5 → d.o. 5 (Kukirin)
 */
export const PATTERNS: Pattern[] = [
  {
    name: "performance",
    isLight: false,
    angle: 135,
    g1: 0.6,
    g2: 0.25,
    borderStyle: "solid",
    borderWidth: 2,
    borderAlpha: 0.7,
    texture: "diagonal-lines",
    glow: "strong",
    logoBoxShape: "rounded",
    radius: "1.5rem",
  },
  {
    name: "tech-grid",
    isLight: false,
    angle: 160,
    g1: 0.5,
    g2: 0.18,
    borderStyle: "solid",
    borderWidth: 1,
    borderAlpha: 0.5,
    texture: "grid",
    glow: "medium",
    logoBoxShape: "square",
    radius: "1rem",
  },
  {
    name: "warrior-hatch",
    isLight: false,
    angle: 145,
    g1: 0.55,
    g2: 0.22,
    borderStyle: "dashed",
    borderWidth: 2,
    borderAlpha: 0.7,
    texture: "hatch",
    glow: "medium",
    logoBoxShape: "rounded",
    radius: "1.25rem",
  },
  {
    name: "mono-double",
    isLight: false,
    angle: 150,
    g1: 0.45,
    g2: 0.16,
    borderStyle: "double",
    borderWidth: 3,
    borderAlpha: 0.6,
    texture: "diagonal-lines",
    glow: "subtle",
    logoBoxShape: "square",
    radius: "0.75rem",
  },
  {
    name: "soft-light",
    isLight: true,
    angle: 120,
    g1: 0.3,
    g2: 0.5,
    borderStyle: "solid",
    borderWidth: 1,
    borderAlpha: 0.4,
    texture: "none",
    glow: "subtle",
    logoBoxShape: "circle",
    radius: "2rem",
  },
  {
    name: "compact-glow",
    isLight: false,
    angle: 135,
    g1: 0.5,
    g2: 0.2,
    borderStyle: "solid",
    borderWidth: 3,
    borderAlpha: 0.6,
    texture: "none",
    glow: "strong",
    logoBoxShape: "circle",
    radius: "1.75rem",
  },
];

const GLOW_ALPHA: Record<GlowIntensity, number> = {
  subtle: 0.25,
  medium: 0.4,
  strong: 0.55,
};

/**
 * Build the full visual ambiance for one brand. Pure — safe to call in render.
 */
export function getBrandAmbiance(brand: BrandAmbianceInput): BrandAmbiance {
  const accent = normalizeHex(brand.accent_color) ?? NEUTRAL_FALLBACK;

  const seed =
    brand.display_order != null && Number.isFinite(brand.display_order)
      ? brand.display_order
      : hashSlug(brand.slug);
  const idx = ((seed % PATTERNS.length) + PATTERNS.length) % PATTERNS.length;
  const p = PATTERNS[idx];

  // Background: dark drama by default, one light exception (soft-light).
  // A solid base colour guarantees opacity so the beige page never bleeds through.
  const backgroundColor = p.isLight ? LIGHT_BASE : DARK_BASE;
  const backgroundImage = p.isLight
    ? `linear-gradient(${p.angle}deg, ${LIGHT_BASE} 0%, ${hexWithAlpha(accent, p.g1)} 50%, ${hexWithAlpha(
        accent,
        p.g2
      )} 100%)`
    : `linear-gradient(${p.angle}deg, ${hexWithAlpha(accent, p.g1)} 0%, ${hexWithAlpha(
        accent,
        p.g2
      )} 30%, ${DARK_MID} 65%, ${DARK_BASE} 100%)`;

  // Depth: coloured aura + neutral drop + inner top highlight.
  const boxShadow = `0 16px 48px ${hexWithAlpha(accent, 0.3)}, 0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.10)`;

  const containerStyle: CSSProperties = {
    backgroundColor,
    backgroundImage,
    border: `${p.borderWidth}px ${p.borderStyle} ${hexWithAlpha(accent, p.borderAlpha)}`,
    borderRadius: p.radius,
    boxShadow,
  };

  const glowStyle: CSSProperties = {
    background: `radial-gradient(closest-side, ${hexWithAlpha(accent, GLOW_ALPHA[p.glow])} 0%, transparent 70%)`,
  };

  return {
    accent,
    isLight: p.isLight,
    containerStyle,
    textureStyle: textureCss(p.texture, accent),
    glowStyle,
    logoBoxShape: p.logoBoxShape,
    ghostColor: hexWithAlpha(accent, 0.25),
    patternName: p.name,
  };
}
