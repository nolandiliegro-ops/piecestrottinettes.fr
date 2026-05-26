import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { getPrimaryImage } from "@/lib/entityImage";
import { formatPrice } from "@/lib/formatPrice";
import { getCategoryColor, getCategoryTextColor, getShortLabel } from "@/lib/categoryColors";
import { cn } from "@/lib/utils";
import type { CompatiblePartRich } from "@/hooks/useCompatiblePartsRich";

interface Props {
  part: CompatiblePartRich;
  index: number;
  variant?: "grid" | "carousel";
}

const SECU_SLUGS = new Set([
  "plaquettes",
  "disques-plaquettes",
  "casques",
  "eclairage",
]);

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

type BadgeKind = "BEST" | "SÉCU" | "NOUVEAU" | null;

const pickBadge = (part: CompatiblePartRich): BadgeKind => {
  if (part.is_featured === true) return "BEST";
  const catSlug = part.category?.slug ?? "";
  if (SECU_SLUGS.has(catSlug)) return "SÉCU";
  if (part.created_at) {
    const createdMs = new Date(part.created_at).getTime();
    if (!Number.isNaN(createdMs) && Date.now() - createdMs < THIRTY_DAYS_MS) {
      return "NOUVEAU";
    }
  }
  return null;
};

const badgeStyle = (kind: BadgeKind): { color: string; bg: string } => {
  switch (kind) {
    case "BEST":
      return { color: "#1A1A1A", bg: "rgba(255,102,0,0.14)" };
    case "SÉCU":
      return { color: "#FFFFFF", bg: "#D74F00" };
    case "NOUVEAU":
      return { color: "#FFFFFF", bg: "#4A7C59" };
    default:
      return { color: "transparent", bg: "transparent" };
  }
};

// Hex (#RRGGBB) → rgba(r,g,b,a)
const hexToRgba = (hex: string, alpha: number): string => {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

const PartCardSlim = ({ part, index, variant = "grid" }: Props) => {
  const { addItem, setIsOpen } = useCart();
  const { isFavorite, toggleFavorite, isToggling } = useFavorites();
  const img = getPrimaryImage(part.images, part.image_url, "");
  const badge = pickBadge(part);
  const badgeColors = badgeStyle(badge);
  const isOut = part.stock_quantity === 0;
  const isFav = isFavorite(part.id);

  const catSlug = part.category?.slug ?? null;
  const catName = part.category?.name ?? "";
  const catColor = getCategoryColor(catSlug).color;
  const catTextColor = getCategoryTextColor(catColor);
  const catShort = getShortLabel(catSlug, catName);
  const isCarousel = variant === "carousel";

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOut || part.price === null) return;

    addItem({
      id: part.id,
      name: part.name,
      price: part.price,
      image_url: img || part.image_url,
      stock_quantity: part.stock_quantity ?? 0,
    });

    toast.success(
      <div className="flex items-center gap-3">
        {img ? (
          <img
            src={img}
            alt={part.name}
            className="w-10 h-10 rounded-lg object-contain bg-[#F5F0E8] p-1"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-[#F5F0E8] flex items-center justify-center">
            🔧
          </div>
        )}
        <div>
          <p className="font-medium text-[#1A1A1A] text-sm">{part.name}</p>
          <p className="text-xs text-[#6B7280]">Ajouté au panier</p>
        </div>
      </div>,
      {
        action: {
          label: "Voir",
          onClick: () => setIsOpen(true),
        },
      }
    );
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(part.id, part.name);
  };

  const cardContent = (
    <Link
      to={`/piece/${part.slug}`}
      className="pt-slim-card group relative block rounded-2xl overflow-hidden bg-white transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_8px_22px_rgba(0,0,0,0.08)]"
      style={{ border: "0.5px solid rgba(0,0,0,0.05)" }}
    >
      {/* Image */}
      <div
        className="pt-slim-img relative aspect-square flex items-center justify-center overflow-hidden"
        style={{ background: "#FFFFFF" }}
      >
        {img ? (
          <img
            src={img}
            alt={part.name}
            loading="lazy"
            decoding="async"
            className="max-w-[80%] max-h-[80%] object-contain transition-transform duration-300 group-hover:scale-[1.04]"
            style={{ filter: "drop-shadow(0 8px 12px rgba(0,0,0,0.08))" }}
          />
        ) : (
          <div className="text-3xl opacity-30">🔧</div>
        )}

        {/* Shine sweep — pseudo-element on the img wrap */}
        <span aria-hidden className="pt-slim-shine" />

        {isOut && (
          <div className="absolute inset-0 bg-white/65 backdrop-blur-[2px] flex items-center justify-center z-[2]">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
              style={{ backgroundColor: "#1A1A1A", color: "white" }}
            >
              Rupture
            </span>
          </div>
        )}

        {/* Category color patch — top left */}
        {catSlug && catShort && (
          <div
            className="absolute z-[3] inline-flex items-center gap-1 rounded-full"
            style={{
              top: 8,
              left: 8,
              padding: "3px 7px",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              backgroundColor: hexToRgba(catColor, 0.13),
              border: `0.5px solid ${hexToRgba(catColor, 0.25)}`,
              color: catTextColor,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              lineHeight: 1,
            }}
          >
            <span
              aria-hidden
              className="inline-block rounded-full flex-shrink-0"
              style={{ width: 6, height: 6, backgroundColor: catColor }}
            />
            {catShort}
          </div>
        )}

        {/* Favorite button — top right */}
        <motion.button
          type="button"
          onClick={handleFavoriteClick}
          disabled={isToggling}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
          title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
          className={cn(
            "absolute z-[4] flex items-center justify-center rounded-full transition-colors duration-150",
            "w-9 h-9 lg:w-8 lg:h-8",
            isToggling && "opacity-50 cursor-not-allowed"
          )}
          style={{
            top: 8,
            right: 8,
            backgroundColor: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            border: "0.5px solid rgba(0,0,0,0.08)",
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={isFav ? "filled" : "empty"}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="inline-flex"
            >
              <Heart
                size={16}
                strokeWidth={2}
                className={cn(
                  "transition-colors",
                  isFav ? "fill-current" : "fill-none"
                )}
                style={{ color: isFav ? "#FF3B30" : "#6B7280" }}
              />
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Body */}
      <div className="px-3 pt-3 pb-3.5">
        {/* Badge slot — fixed height for alignment */}
        <div className="flex items-center" style={{ height: 13, marginBottom: 6 }}>
          {badge && (
            <span
              className="inline-flex items-center px-1.5 rounded-[4px] text-[9px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: badgeColors.bg,
                color: badgeColors.color,
                lineHeight: "13px",
                height: 13,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {badge === "BEST" && "★ "}
              {badge}
            </span>
          )}
        </div>

        <h4
          className="text-[12px] lg:text-[13px] leading-tight line-clamp-2 mb-1.5 transition-colors"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 500,
            color: "#1A1A1A",
            minHeight: "2.2em",
          }}
        >
          {part.name}
        </h4>

        <div
          className="text-[14px] lg:text-[15px] mb-2.5"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 500,
            color: "#4A7C59",
          }}
        >
          {part.price != null ? formatPrice(part.price) : "—"}
        </div>

        {/* Quick add to cart */}
        <QuickAddButton
          onClick={handleQuickAdd}
          disabled={isOut || part.price === null}
        />
      </div>
    </Link>
  );

  if (isCarousel) {
    // D9: no enter/exit framer-motion to avoid re-trigger inside marquee with 300+ nodes
    return (
      <>
        <CardStyles />
        {cardContent}
      </>
    );
  }

  return (
    <>
      <CardStyles />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.22, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      >
        {cardContent}
      </motion.div>
    </>
  );
};

const QuickAddButton = ({
  onClick,
  disabled,
}: {
  onClick: (e: React.MouseEvent) => void;
  disabled: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={disabled ? "Indisponible" : "Ajouter au panier"}
    className={cn(
      "w-full inline-flex items-center justify-center gap-1.5 rounded-lg",
      "transition-all duration-150 active:scale-[0.97]",
      "opacity-100 translate-y-0",
      "lg:opacity-0 lg:translate-y-1 lg:group-hover:opacity-100 lg:group-hover:translate-y-0",
      disabled && "cursor-not-allowed lg:group-hover:opacity-40"
    )}
    style={{
      backgroundColor: "#1A1A1A",
      color: "#FFFFFF",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: 11,
      fontWeight: 500,
      padding: "8px 12px",
      opacity: disabled ? 0.4 : undefined,
    }}
    onMouseEnter={(e) => {
      if (!disabled) e.currentTarget.style.backgroundColor = "#2A2A2A";
    }}
    onMouseLeave={(e) => {
      if (!disabled) e.currentTarget.style.backgroundColor = "#1A1A1A";
    }}
  >
    <ShoppingCart size={12} strokeWidth={2.2} />
    <span>{disabled ? "Indisponible" : "Ajouter"}</span>
  </button>
);

/* ── Shared CSS (rendered once per card; cheap, deduped by browser style cache) ── */
const CardStyles = () => (
  <style>{`
    @keyframes ptShine {
      0% { transform: translateX(-150%) skewX(-20deg); opacity: 0; }
      20% { opacity: 1; }
      80% { opacity: 1; }
      100% { transform: translateX(250%) skewX(-20deg); opacity: 0; }
    }
    @keyframes ptHoverPulse {
      0%, 100% { box-shadow: inset 0 0 0 0 rgba(74,124,89,0); }
      50%      { box-shadow: inset 0 0 24px 4px rgba(74,124,89,0.18); }
    }

    .pt-slim-shine {
      position: absolute;
      top: 0;
      left: 0;
      width: 55%;
      height: 100%;
      background: linear-gradient(
        90deg,
        rgba(255,255,255,0) 0%,
        rgba(255,255,255,0.55) 50%,
        rgba(255,255,255,0) 100%
      );
      transform: translateX(-150%) skewX(-20deg);
      animation: ptShine 4.5s ease-in-out infinite;
      pointer-events: none;
      z-index: 1;
    }

    .pt-slim-card:hover .pt-slim-img {
      animation: ptHoverPulse 1s ease-in-out;
    }

    @media (prefers-reduced-motion: reduce) {
      .pt-slim-shine { animation: none; opacity: 0; }
      .pt-slim-card:hover .pt-slim-img { animation: none; }
    }
  `}</style>
);

export default PartCardSlim;
