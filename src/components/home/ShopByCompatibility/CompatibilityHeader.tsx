import { ChevronDown, X } from "lucide-react";

// Silhouette de trottinette au trait (inline, plus soignée que l'icône lucide générique).
const ScooterGlyph = ({ size = 22, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <circle cx="4.8" cy="17.6" r="2.3" />
    <circle cx="19" cy="17.6" r="2.3" />
    <path d="M7.1 17.6h8.4L17.9 6h-3.4" />
    <path d="M2.6 17.6h2.2" />
  </svg>
);

interface Props {
  mode: "config" | "discovery";
  scooterName: string | null;
  /** Marque du scooter actif — affichée dans le trigger (état rempli). */
  brandName?: string | null;
  /** Scooter image URL (cutout) — mini-photo du trigger en état rempli. */
  scooterImageUrl?: string | null;
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
  brandName,
  scooterImageUrl,
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

  const eyebrowText = isConfig ? "— COMPATIBLE AVEC TA TROTTINETTE" : "— TOUT LE CATALOGUE";
  // Dark mode : fallback orange #FF6600 en mode trotti (config) pour visibilite sur fond dark.
  const eyebrowColor = accentColor ?? (isConfig ? "#FF6600" : "#4A7C59");
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
    ? { ...TITLE_FONT_BASE, fontSize: 22, color: "#FFFFFF" }
    : { ...TITLE_FONT_BASE, fontSize: "clamp(32px, 4vw, 44px)", color: "#FFFFFF" };
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
            color: "rgba(255,255,255,0.55)",
            fontFamily: "'Inter', sans-serif",
            fontSize: 11,
            fontWeight: 400,
          }}
        >
          {subtitle}
        </p>
      </div>

      <ScooterTrigger
        filled={isConfig && !!scooterName}
        brandName={brandName ?? null}
        scooterName={scooterName}
        imageUrl={scooterImageUrl ?? null}
        accentColor={accentColor}
        onOpen={onTitleClick}
        onClear={onActionClick}
      />
    </div>
  );
};

/* ── Trigger sélecteur (haut à droite) ───────────────────────────────────── */

const ScooterTrigger = ({
  filled,
  brandName,
  scooterName,
  imageUrl,
  accentColor,
  onOpen,
  onClear,
}: {
  filled: boolean;
  brandName: string | null;
  scooterName: string | null;
  imageUrl: string | null;
  accentColor?: string;
  onOpen: () => void;
  onClear: () => void;
}) => {
  const accent = accentColor ?? "#4A7C59";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      aria-label={
        filled ? `Changer de trottinette (actuelle : ${scooterName})` : "Choisis ta trottinette"
      }
      className="group flex-shrink-0 flex items-center gap-2.5 cursor-pointer transition-colors duration-150"
      style={{
        minHeight: 52,
        padding: filled ? "6px 8px" : "8px 14px",
        borderRadius: 14,
        // Glassmorphism teinté vert sauge (Variante B), identique vide/rempli.
        backgroundColor: "rgba(74,124,89,0.18)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(95,163,119,0.4)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)",
      }}
    >
      {/* Vignette mini-photo / silhouette */}
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: "rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}
      >
        {filled && imageUrl ? (
          <img
            src={imageUrl}
            alt={scooterName ?? ""}
            loading="lazy"
            decoding="async"
            style={{ width: 36, height: 36, objectFit: "contain" }}
          />
        ) : (
          <ScooterGlyph size={22} color="rgba(255,255,255,0.85)" />
        )}
      </div>

      {/* Texte */}
      <div className="min-w-0 flex flex-col" style={{ maxWidth: 150 }}>
        {filled ? (
          <>
            {brandName && (
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 9.5,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "rgba(255,255,255,0.55)",
                  lineHeight: 1.1,
                }}
              >
                {brandName}
              </span>
            )}
            <span
              className="truncate"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                color: "#FFFFFF",
                lineHeight: 1.15,
              }}
            >
              {scooterName}
            </span>
          </>
        ) : (
          <>
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                color: "#FFFFFF",
                lineHeight: 1.2,
              }}
            >
              Choisis ta trottinette
            </span>
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 10.5,
                fontWeight: 500,
                color: "rgba(255,255,255,0.65)",
                lineHeight: 1.2,
                marginTop: 1,
              }}
            >
              filtre les pièces compatibles
            </span>
          </>
        )}
      </div>

      {/* Chevron */}
      <ChevronDown
        size={18}
        strokeWidth={2.4}
        className="transition-transform group-hover:translate-y-0.5 flex-shrink-0"
        style={{ color: filled ? accent : "rgba(255,255,255,0.7)" }}
        aria-hidden
      />

      {/* ✕ — désélection (état rempli uniquement) */}
      {filled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          aria-label="Désélectionner ma trottinette"
          className="flex items-center justify-center flex-shrink-0 transition-colors duration-150"
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.85)",
          }}
        >
          <X size={14} strokeWidth={2.6} />
        </button>
      )}
    </div>
  );
};

export default CompatibilityHeader;
