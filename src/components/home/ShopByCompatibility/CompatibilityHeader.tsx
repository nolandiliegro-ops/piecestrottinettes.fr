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
   * Optional brand accent color (HEX). When provided, eyebrow + chevron +
   * "Tout voir" button take this color. When undefined, fall back to the
   * legacy palette (config: #D74F00, discovery: #4A7C59).
   */
  accentColor?: string;
}

// Hex → rgba helper for hover bg
const hexToRgba = (hex: string, alpha: number): string => {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
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
}: Props) => {
  const isConfig = mode === "config";

  const eyebrowText = isConfig ? "— COMPATIBLE AVEC TA TROTTI" : "— TOUT LE CATALOGUE";
  const eyebrowColor = accentColor ?? (isConfig ? "#D74F00" : "#4A7C59");
  const chevronColor = accentColor ?? "#1A1A1A";

  const titleText = isConfig ? scooterName ?? "Ma trotti" : "Tous les produits";

  const subtitle =
    customSubtitle ??
    (isConfig
      ? `${totalCount} pièce${totalCount > 1 ? "s" : ""} compatible${totalCount > 1 ? "s" : ""}`
      : `${totalCount} référence${totalCount > 1 ? "s" : ""} · ${categoriesCount} catégorie${categoriesCount > 1 ? "s" : ""}`);

  return (
    <div className="flex items-start justify-between gap-3 mb-4 lg:mb-5">
      <div className="min-w-0">
        <p
          className="mb-1.5"
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
            className="inline-flex items-center gap-1 group min-h-[44px] -my-2 py-2"
            aria-label={`Changer de trottinette (actuel : ${titleText})`}
          >
            <span
              className="text-[22px] sm:text-[24px] lg:text-[26px]"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                color: "#1A1A1A",
              }}
            >
              {titleText}
            </span>
            <ChevronDown
              className="w-4 h-4 transition-transform group-hover:translate-y-0.5"
              strokeWidth={2.5}
              style={{ color: chevronColor }}
            />
          </button>
        ) : (
          <h2
            className="text-[22px] sm:text-[24px] lg:text-[26px]"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              color: "#1A1A1A",
              minHeight: "44px",
              display: "flex",
              alignItems: "center",
            }}
          >
            {titleText}
          </h2>
        )}

        <p
          className="mt-1"
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
