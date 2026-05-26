import { useMemo } from "react";
import { motion } from "framer-motion";
import PartCardSlim from "./PartCardSlim";
import type { CompatiblePartRich } from "@/hooks/useCompatiblePartsRich";

interface Props {
  parts: CompatiblePartRich[];
  onReset?: () => void;
}

const PartsCarousel = ({ parts, onReset }: Props) => {
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
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          Aucune pièce dans cette combinaison.
        </p>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center min-h-[44px] px-5 rounded-full transition-colors duration-150 hover:bg-[#1A1A1A] hover:text-white"
            style={{
              border: "1px solid #1A1A1A",
              backgroundColor: "transparent",
              color: "#1A1A1A",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Réinitialiser les filtres
          </button>
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
              <PartCardSlim part={p} index={i} variant="carousel" />
            </div>
          ))}
          {/* Second copy for infinite loop */}
          {parts.map((p, i) => (
            <div
              key={`b-${p.id}`}
              className="pt-card-slot flex-shrink-0 w-[200px] sm:w-[220px]"
              aria-hidden="true"
            >
              <PartCardSlim part={p} index={i} variant="carousel" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default PartsCarousel;
