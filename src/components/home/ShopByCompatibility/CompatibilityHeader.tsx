import { ChevronDown, Eye, Target } from "lucide-react";
import { useState } from "react";

interface Props {
  mode: "config" | "discovery";
  scooterName: string | null;
  totalCount: number;
  categoriesCount: number;
  onTitleClick: () => void;
  onActionClick: () => void;
  /** Pre-computed subtitle from caller. If omitted, falls back to the legacy derivation. */
  subtitle?: string;
  /**
   * Optional brand accent color (HEX). When provided, eyebrow +
   * "Tout voir" button take this color. When undefined, fall back to the
   * legacy palette (config: #D74F00, discovery: #4A7C59).
   */
  accentColor?: string;
  /** Title first part — line 1. */
  titleFirstPart: string;
  /** Title second part (focal) — line 2, includes the period. */
  titleSecondPart: string;
  /** Accent color used for the second part of the bicolor title (HEX). */
  titleAccentColor: string;
  /**
   * When true, line 1 renders as a compact "context" line (22px) and
   * line 2 as the focal model name (36px). When false/undefined, both
   * lines render at clamp(32-44px).
   */
  modelFocalMode?: boolean;
}

// Hex → rgba helper for hover bg
const hexToRgba = (hex: string, alpha: number): string => {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

const TITLE_FONT_BASE: React.CSSProperties = {
  fontFamily: "'Anton', 'Druk Wide', Impact, sans-serif",
  fontWeight: 400,
  letterSpacing: "-0.02em",
  lineHeight: 0.92,
  textTransform: "uppercase",
};

const CompatibilityHeader = ({
  mode,
  scooterName,
  totalCount,
  categoriesCount,
  onTitleClick,
  onActionClick,
  subtitle: customSubtitle,
  accentColor,
  titleFirstPart,
  titleSecondPart,
  titleAccentColor,
  modelFocalMode,
}: Props) => {
  const isConfig = mode === "config";

  const eyebrowText = isConfig ? "— COMPATIBLE AVEC TA TROTTI" : "— TOUT LE CATALOGUE";
  const eyebrowColor = accentColor ?? (isConfig ? "#D74F00" : "#4A7C59");
  const chevronColor = titleAccentColor;

  const subtitle =
    customSubtitle ??
    (isConfig
      ? `${totalCount} pièce${totalCount > 1 ? "s" : ""} compatible${totalCount > 1 ? "s" : ""}`
      : `${totalCount} référence${totalCount > 1 ? "s" : ""} · ${categoriesCount} catégorie${categoriesCount > 1 ? "s" : ""}`);

  const titleAriaLabel = isConfig
    ? `Changer de trottinette (actuelle : ${scooterName ?? titleSecondPart})`
    : undefined;

  // D2: per-line sizing. In modelFocalMode, line 1 is compact (22px) and
  // line 2 is the focal (36px). Otherwise both lines share clamp(32-44px).
  const firstLineFont: React.CSSProperties = modelFocalMode
    ? { ...TITLE_FONT_BASE, fontSize: 22, color: "#1A1A1A" }
    : { ...TITLE_FONT_BASE, fontSize: "clamp(32px, 4vw, 44px)", color: "#1A1A1A" };
  const secondLineFont: React.CSSProperties = modelFocalMode
    ? { ...TITLE_FONT_BASE, fontSize: 36, color: titleAccentColor }
    : { ...TITLE_FONT_BASE, fontSize: "clamp(32px, 4vw, 44px)", color: titleAccentColor };

  return (
    <div className="flex items-start justify-between gap-3 mb-4 lg:mb-5">
      <div className="min-w-0">
        <p
          className="mb-2"
          style={{
            color: eyebrowColor,
            letterSpacing: "0.15em",
            fontWeight: 600,
            fontFamily: "'Inter', sans-serif",
            fontSize: 10.5,
            textTransform: "uppercase",
          }}
        >
          {eyebrowText}
        </p>

        {isConfig ? (
          <button
            type="button"
            onClick={onTitleClick}
            className="group inline-block text-left min-h-[44px] -my-1 py-1"
            aria-label={titleAriaLabel}
          >
            <span style={{ ...firstLineFont, display: "block" }}>
              {titleFirstPart}
            </span>
            <span className="inline-flex items-end gap-1.5" style={secondLineFont}>
              <span>{titleSecondPart}</span>
              <ChevronDown
                className="transition-transform group-hover:translate-y-0.5"
                style={{
                  width: "0.55em",
                  height: "0.55em",
                  color: chevronColor,
                  marginBottom: "0.18em",
                }}
                strokeWidth={2.5}
              />
            </span>
          </button>
        ) : (
          <h2 className="min-h-[44px]">
            <span style={{ ...firstLineFont, display: "block" }}>
              {titleFirstPart}
            </span>
            <span style={{ ...secondLineFont, display: "block" }}>
              {titleSecondPart}
            </span>
          </h2>
        )}

        <p
          className="mt-2.5"
          style={{
            color: "#6B7280",
            fontFamily: "'Inter', sans-serif",
            fontSize: 11,
            fontWeight: 400,
          }}
        >
          {subtitle}
        </p>
      </div>

      {isConfig ? (
        <ToutVoirButton onClick={onActionClick} accentColor={accentColor} />
      ) : (
        <FiltrerMaTrottiButton onClick={onActionClick} />
      )}
    </div>
  );
};

/* ── Buttons ─────────────────────────────────────────────────────────────── */

const FONT = "'Inter', sans-serif";

const BUTTON_BASE: React.CSSProperties = {
  padding: "10px 18px",
  borderRadius: 6,
  fontFamily: FONT,
  fontWeight: 500,
  fontSize: 11.5,
  transition: "background-color 150ms, color 150ms, border-color 150ms, transform 90ms",
};

const FiltrerMaTrottiButton = ({ onClick }: { onClick: () => void }) => {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setActive(false);
      }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      className="flex-shrink-0 inline-flex items-center gap-1.5 min-h-[44px]"
      style={{
        ...BUTTON_BASE,
        border: "1px solid #1A1A1A",
        backgroundColor: hover ? "rgba(26,26,26,0.06)" : "transparent",
        color: "#1A1A1A",
        transform: active ? "scale(0.97)" : "scale(1)",
      }}
    >
      <Target size={14} strokeWidth={2.2} />
      <span>Filtrer ma trotti</span>
    </button>
  );
};

const ToutVoirButton = ({
  onClick,
  accentColor,
}: {
  onClick: () => void;
  accentColor?: string;
}) => {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);
  const color = accentColor ?? "#1A1A1A";

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setActive(false);
      }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      className="flex-shrink-0 inline-flex items-center gap-1.5 min-h-[44px]"
      style={{
        ...BUTTON_BASE,
        border: `1px solid ${color}`,
        backgroundColor: hover ? hexToRgba(color, 0.06) : "transparent",
        color,
        transform: active ? "scale(0.97)" : "scale(1)",
      }}
    >
      <Eye size={14} strokeWidth={2.2} />
      <span>Tout voir</span>
    </button>
  );
};

export default CompatibilityHeader;
