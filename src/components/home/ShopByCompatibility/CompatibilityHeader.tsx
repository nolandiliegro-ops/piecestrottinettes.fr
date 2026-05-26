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
}

const CompatibilityHeader = ({
  mode,
  scooterName,
  totalCount,
  categoriesCount,
  onTitleClick,
  onActionClick,
  subtitle: customSubtitle,
}: Props) => {
  const isConfig = mode === "config";

  const eyebrowText = isConfig ? "— COMPATIBLE AVEC TA TROTTI" : "— TOUT LE CATALOGUE";
  const eyebrowColor = isConfig ? "#D74F00" : "#4A7C59";

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
          className="text-[11px] uppercase mb-1.5"
          style={{
            color: eyebrowColor,
            letterSpacing: "0.12em",
            fontWeight: 600,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
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
              className="text-[17px] sm:text-[19px] lg:text-[22px] uppercase tracking-tight"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 500,
                color: "#1A1A1A",
              }}
            >
              {titleText}
            </span>
            <ChevronDown
              className="w-4 h-4 transition-transform group-hover:translate-y-0.5"
              strokeWidth={2.5}
              style={{ color: "#1A1A1A" }}
            />
          </button>
        ) : (
          <h2
            className="text-[17px] sm:text-[19px] lg:text-[22px] uppercase tracking-tight"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 500,
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
          className="text-[11px] mt-1"
          style={{
            color: "#6B7280",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          {subtitle}
        </p>
      </div>

      {isConfig ? (
        <ToutVoirButton onClick={onActionClick} />
      ) : (
        <FiltrerMaTrottiButton onClick={onActionClick} />
      )}
    </div>
  );
};

/* ── Buttons ─────────────────────────────────────────────────────────────── */

const FONT = "'Plus Jakarta Sans', sans-serif";

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
        padding: "10px 18px",
        borderRadius: 9999,
        border: "1px solid #1A1A1A",
        backgroundColor: hover ? "#1A1A1A" : "transparent",
        color: hover ? "#FFFFFF" : "#1A1A1A",
        fontFamily: FONT,
        fontWeight: 500,
        fontSize: 13,
        transition: "background-color 150ms, color 150ms, transform 90ms",
        transform: active ? "scale(0.97)" : "scale(1)",
      }}
    >
      <Target size={14} strokeWidth={2.2} />
      <span>Filtrer ma trotti</span>
    </button>
  );
};

const ToutVoirButton = ({ onClick }: { onClick: () => void }) => {
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
        padding: "10px 18px",
        borderRadius: 9999,
        backgroundColor: hover ? "#2A2A2A" : "#1A1A1A",
        color: "#FFFFFF",
        fontFamily: FONT,
        fontWeight: 500,
        fontSize: 13,
        transition: "background-color 150ms, transform 90ms",
        transform: active ? "scale(0.97)" : "scale(1)",
      }}
    >
      <Eye size={14} strokeWidth={2.2} />
      <span>Tout voir</span>
    </button>
  );
};

export default CompatibilityHeader;
