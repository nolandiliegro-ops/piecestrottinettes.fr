import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PartCardSlim from "./PartCardSlim";
import QuickViewSheet from "./QuickViewSheet";
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
  /** Filtre catégorie actif → fond des cartes teinté par catégorie. */
  categoryFilterActive?: boolean;
  /** Opt-in : active le quick-view au clic carte (module home uniquement). */
  enableQuickView?: boolean;
}

/** Flèche de navigation desktop (masquée mobile, visible au survol). */
const Arrow = ({
  dir,
  disabled,
  onClick,
}: {
  dir: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    aria-label={dir === "left" ? "Précédent" : "Suivant"}
    disabled={disabled}
    onClick={onClick}
    className={[
      "hidden lg:flex absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full items-center justify-center",
      "bg-white shadow-md border border-black/5 text-[#1A1A1A]",
      "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
      "disabled:opacity-0 disabled:cursor-default hover:scale-105 motion-safe:transition-transform",
      dir === "left" ? "left-1" : "right-1",
    ].join(" ")}
  >
    {dir === "left" ? (
      <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
    ) : (
      <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
    )}
  </button>
);

const PartsCarousel = ({ parts, onReset, accentColor, categoryFilterActive, enableQuickView }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [arrows, setArrows] = useState({ left: false, right: false });

  // Quick-view (opt-in). L'ouverture passe par onQuickView ; la garde justDragged
  // (onClickCapture) empêche déjà le clic — donc l'ouverture — après un drag.
  const [qvOpen, setQvOpen] = useState(false);
  const [qvPart, setQvPart] = useState<CompatiblePartRich | null>(null);
  const handleQuickView = useCallback((p: CompatiblePartRich) => {
    setQvPart(p);
    setQvOpen(true);
  }, []);

  // État de drag dans des refs (pas de re-render pendant le geste).
  const drag = useRef({
    active: false,
    moved: false,
    captured: false,
    startX: 0,
    startScroll: 0,
    lastX: 0,
    lastT: 0,
    velocity: 0,
    raf: 0,
  });
  const justDragged = useRef(false);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setArrows({ left: el.scrollLeft > 4, right: el.scrollLeft < max - 4 });
  }, []);

  useEffect(() => {
    updateArrows();
  }, [updateArrows, parts.length]);

  useEffect(() => {
    const onResize = () => updateArrows();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [updateArrows]);

  const stopMomentum = () => {
    if (drag.current.raf) {
      cancelAnimationFrame(drag.current.raf);
      drag.current.raf = 0;
    }
  };

  const momentum = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const d = drag.current;
    d.velocity *= 0.95; // friction
    el.scrollLeft -= d.velocity;
    updateArrows();
    if (Math.abs(d.velocity) > 0.5) {
      d.raf = requestAnimationFrame(momentum);
    } else {
      d.raf = 0;
    }
  }, [updateArrows]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return; // tactile = scroll natif
    const el = scrollRef.current;
    if (!el) return;
    stopMomentum();
    const d = drag.current;
    d.active = true;
    d.moved = false;
    d.startX = e.clientX;
    d.startScroll = el.scrollLeft;
    d.lastX = e.clientX;
    d.lastT = performance.now();
    d.velocity = 0;
    d.captured = false;
    el.style.cursor = "grabbing";
    el.style.userSelect = "none";
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;
    const el = scrollRef.current;
    if (!el) return;
    const dx = e.clientX - d.startX;
    if (!d.moved && Math.abs(dx) < 5) return; // seuil clic vs drag
    if (!d.moved) {
      // Drag réel confirmé (seuil franchi) : on capture le pointeur SEULEMENT
      // maintenant. Capturer dès le pointerdown redirige le `click` vers ce
      // conteneur (spec Pointer Events) et empêchait la navigation du <Link>
      // sur un simple clic souris.
      el.setPointerCapture?.(e.pointerId);
      d.captured = true;
    }
    d.moved = true;
    el.scrollLeft = d.startScroll - dx;
    const now = performance.now();
    const dt = now - d.lastT;
    if (dt > 0) d.velocity = ((e.clientX - d.lastX) / dt) * 16; // px / frame
    d.lastX = e.clientX;
    d.lastT = now;
    updateArrows();
  };

  const endDrag = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    const el = scrollRef.current;
    if (el && d.captured) {
      el.releasePointerCapture?.(e.pointerId);
      d.captured = false;
    }
    if (el) {
      el.style.cursor = "grab";
      el.style.userSelect = "";
    }
    if (d.moved) {
      justDragged.current = true; // supprime le clic qui suit
      setTimeout(() => {
        justDragged.current = false;
      }, 0);
      if (Math.abs(d.velocity) > 0.5) {
        d.raf = requestAnimationFrame(momentum);
      }
    }
  };

  // Annule la navigation du <Link> si un drag vient d'avoir lieu (phase capture).
  const onClickCapture = (e: React.MouseEvent) => {
    if (justDragged.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

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
          style={{ color: "#6B7280", fontFamily: "'Inter', sans-serif" }}
        >
          Aucune pièce dans cette combinaison.
        </p>
        {onReset && <ResetButton onClick={onReset} accentColor={accentColor} />}
      </motion.div>
    );
  }

  return (
    <div className="relative group">
      <style>{`
        .pt-products-scroll::-webkit-scrollbar { display: none; }
        .pt-products-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <Arrow dir="left" disabled={!arrows.left} onClick={() => {
        scrollRef.current?.scrollBy({ left: -(scrollRef.current.clientWidth * 0.9), behavior: "smooth" });
      }} />
      <Arrow dir="right" disabled={!arrows.right} onClick={() => {
        scrollRef.current?.scrollBy({ left: scrollRef.current.clientWidth * 0.9, behavior: "smooth" });
      }} />

      <div
        ref={scrollRef}
        className="pt-products-scroll flex gap-3.5 overflow-x-auto pb-3"
        style={{ cursor: "grab", WebkitOverflowScrolling: "touch" }}
        aria-label="Liste produits"
        onScroll={updateArrows}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
      >
        {parts.map((p, i) => (
          <div key={p.id} className="flex-shrink-0 w-[200px] sm:w-[220px]">
            <PartCardSlim
              part={p}
              index={i}
              variant="carousel"
              brandColor={accentColor}
              categoryFilterActive={categoryFilterActive}
              enableQuickView={enableQuickView}
              onQuickView={handleQuickView}
            />
          </div>
        ))}
      </div>

      {enableQuickView && (
        <QuickViewSheet open={qvOpen} onClose={() => setQvOpen(false)} part={qvPart} />
      )}
    </div>
  );
};

export default PartsCarousel;
