import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingCart, Shield, Sparkles, Star } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { getPrimaryImage } from "@/lib/entityImage";
import { optimizedImage } from "@/lib/imageTransform";
import { formatPrice } from "@/lib/formatPrice";
import { resolveCategoryColor, getCategoryTextColor, getShortLabel } from "@/lib/categoryColors";
import { cn } from "@/lib/utils";
import type { CompatiblePartRich } from "@/hooks/useCompatiblePartsRich";

interface Props {
  part: CompatiblePartRich;
  index: number;
  variant?: "grid" | "carousel";
  /**
   * Brand accent color (HEX). When provided, the cat-label patch on the card
   * uses this color (uniform with the rest of the module). When undefined,
   * falls back to the per-category color from categoryColors.
   */
  brandColor?: string;
  /**
   * Quand un filtre catégorie est actif, le fond de carte prend une teinte très
   * légère (7%) de la couleur de la catégorie du produit. Sinon : fond normal.
   */
  categoryFilterActive?: boolean;
  /**
   * Opt-in (module home uniquement) : si true, le clic sur la carte ouvre le
   * quick-view au lieu de naviguer vers la fiche. Absent/false → comportement
   * actuel intact (navigation /piece/:slug).
   */
  enableQuickView?: boolean;
  /** Callback d'ouverture du quick-view, fourni par PartsCarousel. */
  onQuickView?: (part: CompatiblePartRich) => void;
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

// Couleur du stamp promo (tampon discret icône+texte, hors orange).
const stampColor = (kind: BadgeKind): string => {
  switch (kind) {
    case "BEST":
      return "#D4AF37"; // doré
    case "SÉCU":
      return "#9AA6B4"; // ardoise
    case "NOUVEAU":
      return "#4A7C59"; // vert
    default:
      return "transparent";
  }
};

// Hex (#RRGGBB) → rgba(r,g,b,a)
const hexToRgba = (hex: string, alpha: number): string => {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

const PartCardSlim = ({ part, index, variant = "grid", brandColor, categoryFilterActive, enableQuickView, onQuickView }: Props) => {
  const { addItem, setIsOpen } = useCart();
  const { isFavorite, toggleFavorite, isToggling } = useFavorites();
  const img = getPrimaryImage(part.images, part.image_url, "");
  // Image affichée servie en WebP redimensionné (carte + miniature toast).
  const displayImg = optimizedImage(img, 400);
  const badge = pickBadge(part);
  const stampCol = stampColor(badge);
  const isOut = part.stock_quantity === 0;
  const isFav = isFavorite(part.id);

  const catSlug = part.category?.slug ?? null;
  const catName = part.category?.name ?? "";
  // D4: cat-label takes the brand color when a scooter is active, else the unified
  // category color (BDD via resolveCategoryColor, fallback mapping) — même source que les tuiles.
  const resolvedCatColor = resolveCategoryColor(part.category?.color ?? null, catSlug);
  const patchColor = brandColor ?? resolvedCatColor;
  const patchTextColor = brandColor ?? getCategoryTextColor(resolvedCatColor);
  // Filtre catégorie actif → fond de carte très légèrement teinté de la couleur catégorie.
  const cardBg = categoryFilterActive ? hexToRgba(resolvedCatColor, 0.07) : undefined;
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
            src={displayImg}
            alt={part.name}
            className="w-10 h-10 rounded-lg object-contain bg-[#F5F5F5] p-1"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-[#F5F5F5] flex items-center justify-center">
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

  // Opt-in quick-view : intercepte le clic carte (addbtn/fav font déjà
  // stopPropagation → ne déclenchent pas ce handler). Sinon : navigation Link.
  const handleCardClick = (e: React.MouseEvent) => {
    if (!enableQuickView) return;
    e.preventDefault();
    onQuickView?.(part);
  };

  const cardContent = (
    <Link
      to={`/piece/${part.slug}`}
      onClick={handleCardClick}
      className="pt-slim-card group relative block overflow-hidden transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(255,255,255,0.10)]"
      style={{ border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 8, backgroundColor: cardBg }}
    >
      {/* Image */}
      <div
        className="pt-slim-img relative aspect-square flex items-center justify-center overflow-hidden"
        style={{ background: "#FFFFFF" }}
      >
        {img ? (
          <img
            src={displayImg}
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
            className="absolute z-[3] inline-flex items-center gap-1"
            style={{
              top: 8,
              left: 8,
              padding: "3px 7px",
              borderRadius: 4,
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              backgroundColor: hexToRgba(patchColor, 0.13),
              border: `0.5px solid ${hexToRgba(patchColor, 0.25)}`,
              color: patchTextColor,
              fontFamily: "'Inter', sans-serif",
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
              style={{ width: 6, height: 6, backgroundColor: patchColor }}
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
        {/* Stamp promo — tampon discret icône+texte, hauteur fixe (alignement) */}
        <div className="flex items-center" style={{ height: 13, marginBottom: 6 }}>
          {badge && (
            <span
              className="inline-flex items-center gap-1 text-[9px] lg:text-[10px] font-bold uppercase"
              style={{
                color: stampCol,
                letterSpacing: "0.06em",
                lineHeight: "13px",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {badge === "BEST" && (
                <Star size={11} strokeWidth={2.4} fill="currentColor" aria-hidden />
              )}
              {badge === "SÉCU" && <Shield size={11} strokeWidth={2.4} aria-hidden />}
              {badge === "NOUVEAU" && <Sparkles size={11} strokeWidth={2.4} aria-hidden />}
              {badge}
            </span>
          )}
        </div>

        <h4
          className="text-[12px] lg:text-[13px] leading-tight line-clamp-2 mb-1.5 transition-colors"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            color: "rgba(255,255,255,0.92)",
            minHeight: "2.2em",
          }}
        >
          {part.name}
        </h4>

        <div
          className="mb-2.5"
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontWeight: 400,
            fontSize: 28,
            lineHeight: 1.05,
            letterSpacing: "0.01em",
            color: "#FFFFFF",
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
      "border-[1.5px] transition-all duration-150",
      disabled
        ? "cursor-not-allowed border-white/10 bg-white/[0.06] text-white/40"
        : "border-[#FF6600] bg-transparent text-[#FF6600] hover:bg-[#FF6600] hover:text-white active:bg-[#FF6600] active:text-white active:scale-[0.97]"
    )}
    style={{
      minHeight: 44,
      padding: "10px 12px",
      fontFamily: "'Inter', sans-serif",
      fontSize: 12,
      fontWeight: 600,
    }}
  >
    <ShoppingCart size={14} strokeWidth={2.2} />
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

    .pt-slim-card {
      background: rgba(255,255,255,0.06);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }
    @supports not ((backdrop-filter: blur(10px)) or (-webkit-backdrop-filter: blur(10px))) {
      .pt-slim-card {
        background: rgba(255,255,255,0.08);
      }
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
