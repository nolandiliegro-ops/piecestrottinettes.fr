import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import PartCardSlim from "./PartCardSlim";
import type { CompatiblePartRich } from "@/hooks/useCompatiblePartsRich";

const DEFAULT_RESET_COLOR = "#1A1A1A";

const hexToRgba = (hex: string, alpha: number): string => {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

const ResetButton = ({
  onClick,
  accentColor,
}: {
  onClick: () => void;
  accentColor?: string;
}) => {
  const [hover, setHover] = useState(false);
  const color = accentColor ?? DEFAULT_RESET_COLOR;
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="inline-flex items-center min-h-[44px] transition-colors duration-150"
      style={{
        padding: "10px 18px",
        borderRadius: 6,
        border: `1px solid ${color}`,
        backgroundColor: hover ? hexToRgba(color, 0.06) : "transparent",
        color,
        fontFamily: "'Inter', sans-serif",
        fontSize: 11.5,
        fontWeight: 500,
      }}
    >
      Réinitialiser les filtres
    </button>
  );
};

interface Props {
  parts: CompatiblePartRich[];
  onReset?: () => void;
  /** Brand accent color (HEX) for the "Réinitialiser" button. Optional. */
  accentColor?: string;
}

const PartsCarousel = ({ parts, onReset, accentColor }: Props) => {
  // D3: duration proportional to count, min 40s
  const durationSeconds = useMemo(
    () => Math.max(40, parts.length * 1.5),
    [parts.length]
  );

  if (parts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col items-center justify-center text-center"
        style={{ padding: "60px 16px" }}
      >
        <p
          className="text-sm mb-4"
          style={{
            color: "#6B7280",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Aucune pièce dans cette combinaison.
        </p>
        {onReset && (
          <ResetButton onClick={onReset} accentColor={accentColor} />
        )}
      </motion.div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes ptMarquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        .pt-carousel-mask {
          mask-image: linear-gradient(
            to right,
            transparent 0%,
            black 3%,
            black 97%,
            transparent 100%
          );
          -webkit-mask-image: linear-gradient(
            to right,
            transparent 0%,
            black 3%,
            black 97%,
            transparent 100%
          );
        }

        /* Desktop: animated marquee */
        .pt-carousel-track {
          display: flex;
          gap: 14px;
          width: max-content;
          animation: ptMarquee var(--pt-marquee-duration, 50s) linear infinite;
          will-change: transform;
        }
        .pt-carousel-wrap:hover .pt-carousel-track {
          animation-play-state: paused;
        }

        /* Mobile / coarse pointer: disable marquee, enable touch scroll-snap */
        @media (pointer: coarse) {
          .pt-carousel-wrap {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scroll-snap-type: x mandatory;
            scrollbar-width: none;
          }
          .pt-carousel-wrap::-webkit-scrollbar {
            display: none;
          }
          .pt-carousel-track {
            animation: none !important;
            width: max-content;
          }
          .pt-carousel-track > .pt-card-slot {
            scroll-snap-align: start;
          }
          .pt-carousel-mask {
            mask-image: none;
            -webkit-mask-image: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .pt-carousel-track {
            animation: none !important;
          }
        }
      `}</style>

      <div
        className="pt-carousel-wrap pt-carousel-mask overflow-hidden"
        aria-label="Carrousel produits"
      >
        <div
          className="pt-carousel-track"
          style={
            {
              "--pt-marquee-duration": `${durationSeconds}s`,
            } as React.CSSProperties
          }
        >
          {/* First copy */}
          {parts.map((p, i) => (
            <div
              key={`a-${p.id}`}
              className="pt-card-slot flex-shrink-0 w-[200px] sm:w-[220px]"
            >
              <PartCardSlim part={p} index={i} variant="carousel" brandColor={accentColor} />
            </div>
          ))}
          {/* Second copy for infinite loop */}
          {parts.map((p, i) => (
            <div
              key={`b-${p.id}`}
              className="pt-card-slot flex-shrink-0 w-[200px] sm:w-[220px]"
              aria-hidden="true"
            >
              <PartCardSlim part={p} index={i} variant="carousel" brandColor={accentColor} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default PartsCarousel;
