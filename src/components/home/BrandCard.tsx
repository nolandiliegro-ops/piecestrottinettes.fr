import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";
import { getBrandAmbiance, hexWithAlpha, type LogoBoxShape } from "@/lib/brandAmbiance";
import type { BrandListItem } from "@/hooks/useBrandsList";

const FONT = "'Plus Jakarta Sans', sans-serif";
const ANTON = "'Anton', sans-serif";
const HOVER_TRANSITION =
  "transition-[transform,box-shadow] duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)]";

interface BrandCardProps {
  brand: BrandListItem;
  isStar: boolean;
  isFavorite: boolean;
  onToggleFavorite: (slug: string) => void;
  /** Hero variant = dominant left card. Otherwise = horizontal mini-card. */
  isHero?: boolean;
}

// Mini logo box: shape + inner padding vary per pattern (hero is always rounded-2xl).
const logoBoxClass = (shape: LogoBoxShape): string => {
  switch (shape) {
    case "circle":
      return "rounded-full p-2";
    case "square":
      return "rounded-md p-1";
    case "rounded":
    default:
      return "rounded-xl p-1.5";
  }
};

const BrandCard = ({
  brand,
  isStar,
  isFavorite,
  onToggleFavorite,
  isHero = false,
}: BrandCardProps) => {
  const reduce = useReducedMotion();
  const amb = getBrandAmbiance(brand);
  const { accent, isLight } = amb;

  const modelsLabel =
    brand.count === 0
      ? "Bientôt dispo"
      : `${brand.count} modèle${brand.count > 1 ? "s" : ""}`;
  const metaLabel = brand.country ? `${modelsLabel} · ${brand.country}` : modelsLabel;

  const cardAria =
    brand.count > 0
      ? `Découvrir ${brand.name}, ${brand.count} modèle${brand.count > 1 ? "s" : ""}`
      : `Découvrir ${brand.name}`;

  // Contrast model flips for the single light pattern.
  const nameColor = isLight ? "#1A1A1A" : "#FFFFFF";
  const taglineColor = isLight ? "#525252" : "rgba(255,255,255,0.85)";
  const metaColor = isLight ? "#7C2D12" : "rgba(255,255,255,0.65)";

  // Layout radius is normalised per role (hero generous / mini compact); the rest
  // of the ambiance (gradient, border colour, glow, texture) stays per-pattern.
  const containerStyle = {
    ...amb.containerStyle,
    borderRadius: isHero ? "1.25rem" : "0.875rem",
  };
  const baseShadow = amb.containerStyle.boxShadow as string;
  const hoverShadow = `0 28px 72px ${hexWithAlpha(accent, 0.45)}, 0 10px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.12)`;

  const handleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onToggleFavorite(brand.slug);
  };
  const onEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (!reduce) e.currentTarget.style.boxShadow = hoverShadow;
  };
  const onLeave = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.boxShadow = baseShadow;
  };

  // Favourite button — adapts colour to light vs dark surface; size to role.
  const favStyle = isFavorite
    ? {
        backgroundColor: accent,
        border: `1px solid ${accent}`,
        color: "#FFFFFF",
        boxShadow: `0 4px 12px ${hexWithAlpha(accent, 0.5)}`,
      }
    : isLight
      ? {
          backgroundColor: "rgba(0,0,0,0.06)",
          border: "1px solid rgba(0,0,0,0.15)",
          color: "rgba(0,0,0,0.55)",
        }
      : {
          backgroundColor: "rgba(255,255,255,0.10)",
          border: "1px solid rgba(255,255,255,0.20)",
          color: "rgba(255,255,255,0.70)",
        };

  const favButton = (sizeClass: string, iconClass: string, posClass: string) => (
    <motion.button
      type="button"
      onClick={handleFav}
      aria-label={
        isFavorite
          ? `Retirer ${brand.name} des favoris`
          : `Ajouter ${brand.name} aux favoris`
      }
      aria-pressed={isFavorite}
      whileTap={reduce ? undefined : { scale: 0.9 }}
      transition={{ duration: 0.15 }}
      className={`${posClass} ${sizeClass} z-10 flex items-center justify-center rounded-full backdrop-blur-md transition-colors`}
      style={favStyle}
    >
      <Heart className={iconClass} fill={isFavorite ? "currentColor" : "none"} strokeWidth={2.2} />
    </motion.button>
  );

  const logo = (extraClass: string, fallbackClass: string) =>
    brand.logo_url ? (
      <img
        src={brand.logo_url}
        alt={`${brand.name} logo`}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-contain"
      />
    ) : (
      <span
        aria-hidden
        className={`leading-none ${fallbackClass}`}
        style={{ fontFamily: ANTON, color: "#1A1A1A" }}
      >
        {brand.name.charAt(0).toUpperCase()}
      </span>
    );

  // ── HERO ──────────────────────────────────────────────────────────────────
  if (isHero) {
    return (
      <Link
        to={`/marque/${brand.slug}`}
        aria-label={cardAria}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        className={`group relative flex flex-col justify-end h-[400px] lg:h-full w-full overflow-hidden p-6 lg:p-7 ${HOVER_TRANSITION} motion-safe:lg:hover:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F5F0E8] focus-visible:ring-[#1A1A1A]`}
        style={containerStyle}
      >
        <div aria-hidden className="absolute inset-0 z-0 pointer-events-none" style={amb.textureStyle} />
        <div
          aria-hidden
          className="absolute -top-16 -right-16 w-80 h-80 lg:w-96 lg:h-96 z-0 pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity duration-500"
          style={amb.glowStyle}
        />
        <span
          aria-hidden
          className="absolute -bottom-20 -right-12 z-[1] leading-[0.75] select-none pointer-events-none opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-500"
          style={{
            fontFamily: ANTON,
            color: accent,
            fontSize: "clamp(280px, 50vw, 500px)",
            fontWeight: 900,
            letterSpacing: "-0.05em",
            textTransform: "uppercase",
          }}
        >
          {brand.slug.charAt(0).toUpperCase()}
        </span>

        {/* STAR badge */}
        {isStar && (
          <span
            className="absolute top-4 left-4 z-10 inline-flex items-center gap-1 uppercase backdrop-blur-md"
            style={{
              backgroundColor: accent,
              color: "#FFFFFF",
              padding: "6px 14px",
              borderRadius: "100px",
              fontSize: "10px",
              letterSpacing: "0.15em",
              fontWeight: 500,
              fontFamily: FONT,
              boxShadow: `0 4px 16px ${hexWithAlpha(accent, 0.5)}`,
            }}
          >
            ★ Star de la maison
          </span>
        )}

        {favButton("w-[38px] h-[38px]", "w-[18px] h-[18px]", "absolute top-4 right-4")}

        {/* Bottom content */}
        <div className="relative z-10">
          <div
            className="flex items-center justify-center bg-white overflow-hidden rounded-2xl w-12 h-12 lg:w-16 lg:h-16 p-2 mb-4"
            style={{
              boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
              border: isLight ? `1px solid ${hexWithAlpha(accent, 0.3)}` : undefined,
            }}
          >
            {logo("", "text-3xl lg:text-4xl")}
          </div>

          <h3
            style={{
              fontFamily: ANTON,
              fontWeight: 900,
              color: nameColor,
              lineHeight: 0.85,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              fontSize: "clamp(40px, 6vw, 64px)",
            }}
          >
            {brand.name}
          </h3>

          {brand.tagline && (
            <p
              className="mt-3 italic max-w-[320px] text-xs lg:text-sm leading-snug"
              style={{ color: taglineColor, fontFamily: FONT }}
            >
              {brand.tagline}
            </p>
          )}

          <span
            className="block mt-3 text-[10px] font-semibold uppercase"
            style={{ color: metaColor, letterSpacing: "0.14em", fontFamily: FONT }}
          >
            {metaLabel}
          </span>
        </div>
      </Link>
    );
  }

  // ── MINI ──────────────────────────────────────────────────────────────────
  return (
    <Link
      to={`/marque/${brand.slug}`}
      aria-label={cardAria}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={`group relative flex flex-row items-center gap-3 h-full min-h-[64px] lg:min-h-[70px] w-full overflow-hidden p-2.5 lg:p-3 ${HOVER_TRANSITION} motion-safe:lg:hover:translate-x-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F5F0E8] focus-visible:ring-[#1A1A1A]`}
      style={containerStyle}
    >
      <div aria-hidden className="absolute inset-0 z-0 pointer-events-none" style={amb.textureStyle} />
      <div
        aria-hidden
        className="absolute -top-8 -right-8 w-32 h-32 z-0 pointer-events-none opacity-90"
        style={amb.glowStyle}
      />
      <span
        aria-hidden
        className="absolute -bottom-3 -right-2 z-[1] leading-[0.75] select-none pointer-events-none opacity-[0.08]"
        style={{
          fontFamily: ANTON,
          color: accent,
          fontSize: "100px",
          fontWeight: 900,
          letterSpacing: "-0.04em",
          textTransform: "uppercase",
        }}
      >
        {brand.slug.charAt(0).toUpperCase()}
      </span>

      {/* Logo box */}
      <div
        className={`relative z-10 flex items-center justify-center bg-white overflow-hidden flex-shrink-0 w-9 h-9 lg:w-10 lg:h-10 ${logoBoxClass(
          amb.logoBoxShape
        )}`}
        style={{
          boxShadow: "0 8px 24px rgba(0,0,0,0.30), 0 2px 4px rgba(0,0,0,0.15)",
          border: isLight ? `1px solid ${hexWithAlpha(accent, 0.3)}` : undefined,
        }}
      >
        {logo("", "text-xl")}
      </div>

      {/* Text */}
      <div className="relative z-10 min-w-0 flex flex-col gap-0.5">
        <h3
          className="text-[20px] truncate"
          style={{
            fontFamily: ANTON,
            fontWeight: 900,
            color: nameColor,
            lineHeight: 0.9,
            letterSpacing: "-0.01em",
            textTransform: "uppercase",
          }}
        >
          {brand.name}
        </h3>
        <span
          className="text-[9px] font-semibold uppercase truncate"
          style={{ color: metaColor, letterSpacing: "0.1em", fontFamily: FONT }}
        >
          {metaLabel}
        </span>
      </div>

      {favButton("w-[26px] h-[26px] flex-shrink-0", "w-3.5 h-3.5", "relative ml-auto")}
    </Link>
  );
};

export default BrandCard;
