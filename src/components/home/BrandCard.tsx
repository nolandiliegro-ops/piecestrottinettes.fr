import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";
import { getBrandAmbiance, hexWithAlpha, type LogoBoxShape } from "@/lib/brandAmbiance";
import type { BrandListItem } from "@/hooks/useBrandsList";

const FONT = "'Plus Jakarta Sans', sans-serif";
const ANTON = "'Anton', sans-serif";
const HOVER_TRANSITION =
  "transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]";

interface BrandCardProps {
  brand: BrandListItem;
  isStar: boolean;
  isFavorite: boolean;
  onToggleFavorite: (slug: string) => void;
}

// Compact logo box: shape varies per ambiance pattern.
const logoBoxClass = (shape: LogoBoxShape): string => {
  switch (shape) {
    case "circle":
      return "rounded-full p-1.5";
    case "square":
      return "rounded-md p-1";
    case "rounded":
    default:
      return "rounded-lg p-1";
  }
};

/**
 * Compact portrait (3:4) brand card for the horizontal BrandCarousel.
 * Single dense variant — the per-brand "drama" (gradient / border / glow /
 * texture / ghost letter) is fully derived from brandAmbiance, the layout is
 * normalised to a small collectible-card footprint.
 */
const BrandCard = ({ brand, isStar, isFavorite, onToggleFavorite }: BrandCardProps) => {
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

  // Contrast model flips for the single light pattern (soft-light).
  const nameColor = isLight ? "#1A1A1A" : "#FFFFFF";
  const taglineColor = isLight ? "#525252" : "rgba(255,255,255,0.85)";
  const metaColor = isLight ? "#7C2D12" : "rgba(255,255,255,0.65)";

  // Compact radius normalised across patterns; ambiance keeps its gradient,
  // border colour, glow and texture.
  const containerStyle = {
    ...amb.containerStyle,
    borderRadius: "1rem",
  };
  const baseShadow = amb.containerStyle.boxShadow as string;
  const hoverShadow = `0 24px 60px ${hexWithAlpha(accent, 0.5)}, 0 10px 24px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.12)`;

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

  // Favourite button — adapts colour to light vs dark surface.
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

  return (
    <Link
      to={`/marque/${brand.slug}`}
      aria-label={cardAria}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={`group relative flex flex-col justify-end w-full aspect-[3/4] overflow-hidden p-3 ${HOVER_TRANSITION} motion-safe:lg:hover:-translate-y-1.5 motion-safe:lg:hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F5F0E8] focus-visible:ring-[#1A1A1A]`}
      style={containerStyle}
    >
      {/* Texture overlay */}
      <div aria-hidden className="absolute inset-0 z-0 pointer-events-none" style={amb.textureStyle} />

      {/* Color-matched glow */}
      <div
        aria-hidden
        className="absolute -top-10 -right-10 w-40 h-40 z-0 pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity duration-500"
        style={amb.glowStyle}
      />

      {/* Giant ghost letter */}
      <span
        aria-hidden
        className="absolute -bottom-8 -right-3 z-[1] leading-[0.75] select-none pointer-events-none opacity-20"
        style={{
          fontFamily: ANTON,
          color: accent,
          fontSize: "clamp(140px, 30vw, 200px)",
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
          className="absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1 uppercase backdrop-blur-md"
          style={{
            backgroundColor: accent,
            color: "#FFFFFF",
            padding: "4px 10px",
            borderRadius: "100px",
            fontSize: "8px",
            letterSpacing: "0.14em",
            fontWeight: 600,
            fontFamily: FONT,
            boxShadow: `0 4px 12px ${hexWithAlpha(accent, 0.5)}`,
          }}
        >
          ★ Star
        </span>
      )}

      {/* Favourite button */}
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
        className="absolute top-2.5 right-2.5 z-10 flex items-center justify-center rounded-full backdrop-blur-md transition-colors w-7 h-7"
        style={favStyle}
      >
        <Heart className="w-3.5 h-3.5" fill={isFavorite ? "currentColor" : "none"} strokeWidth={2.2} />
      </motion.button>

      {/* Bottom content */}
      <div className="relative z-10 min-w-0">
        {/* Logo box */}
        <div
          className={`flex items-center justify-center bg-white overflow-hidden w-8 h-8 lg:w-9 lg:h-9 mb-2 ${logoBoxClass(
            amb.logoBoxShape
          )}`}
          style={{
            boxShadow: "0 8px 22px rgba(0,0,0,0.4)",
            border: isLight ? `1px solid ${hexWithAlpha(accent, 0.3)}` : undefined,
          }}
        >
          {brand.logo_url ? (
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
              className="leading-none text-lg"
              style={{ fontFamily: ANTON, color: "#1A1A1A" }}
            >
              {brand.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <h3
          className="text-[16px] lg:text-[18px] truncate"
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

        {brand.tagline && (
          <p
            className="mt-1 italic text-[10px] leading-snug line-clamp-1"
            style={{ color: taglineColor, fontFamily: FONT }}
          >
            {brand.tagline}
          </p>
        )}

        <span
          className="block mt-1 text-[9px] font-semibold uppercase truncate"
          style={{ color: metaColor, letterSpacing: "0.12em", fontFamily: FONT }}
        >
          {metaLabel}
        </span>
      </div>
    </Link>
  );
};

export default BrandCard;
