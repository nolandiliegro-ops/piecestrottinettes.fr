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
import { SHOP_OPEN, openPrelaunch } from '@/config/launch';

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

/** 19/10 : cartes produits en DA Atelier, propositions ?pcarte=1..5 (retour Nolan : « pas belles »).
 *  Défauts corrigés dans les 5 : polices Inter/Bebas hors DA, textes de 9 à 13 px, verre + coins ronds,
 *  reflet animé en boucle, « CHARG » tronqué, « NOUVEAU » sur presque tout. Sans paramètre : carte actuelle. */
type PCard = 1 | 2 | 3 | 4 | 5;
const PCARD: PCard | null = (() => {
  // 19/10 : « 4 Ça dépasse » choisi par Nolan = défaut ; ?pcarte=0 = ancienne carte
  try { const raw = new URLSearchParams(window.location.search).get("pcarte"); if (raw === null) return 4; const n = Number(raw); return n >= 1 && n <= 5 ? (n as PCard) : null; } catch { return 4; }
})();
const A_FONT = "'Plus Jakarta Sans', sans-serif";
const A_UNB = "'Unbounded', sans-serif";
const A_CUT = (px: number) => `polygon(0 0, calc(100% - ${px}px) 0, 100% ${px}px, 100% 100%, 0 100%)`;
const A_LINE = "#E2DCD0";
/** 19/10 : virgule française sur les cartes Atelier (formatPrice sort « 11.90 € »). */
const frPrice = (n: number) => `${n.toFixed(2).replace(".", ",")}\u00A0€`;
/** Pièces plates (plaquettes, disques…) : la photo a beaucoup de vide autour → on les grossit pour qu'elles sortent autant qu'un pneu. */

const BOOST: Record<string, number> = { plaquettes: 0.9, "disques-plaquettes": 0.9, disques: 0.85, chargeurs: 0.85, "chambres-a-air": 1.05 }; // 25/10 : alignée sur PartCardAtelier — la plaquette ×1.2 sortait de la carte jusque sur les onglets (capture iPhone, accueil Mi 3) // 20/10 Nolan : disques et chargeurs « un chouïa gros », l'effet qui dépasse est gardé

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
    if (!SHOP_OPEN) { e.preventDefault(); e.stopPropagation(); openPrelaunch(); return; }
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

  const atelier = PCARD ? (
    <Link to={`/piece/${part.slug}`} onClick={handleCardClick} data-pcard={PCARD}
      className={cn("group group/pc relative block", PCARD === 4 && "pt-12 md:pt-16")}
      style={{ fontFamily: A_FONT }}>
      {/* Image */}
      <div className={cn("relative flex items-center justify-center", PCARD === 4 ? "absolute inset-x-0 top-0 h-[150px] md:h-[178px] z-[2] pointer-events-none" : "aspect-square")}
        style={PCARD === 4 ? undefined : { background: PCARD === 2 || PCARD === 5 ? "#F2EFE8" : "#FFFFFF", clipPath: PCARD === 1 ? undefined : A_CUT(14) }}>
        {/* 19/10 (Nolan) : halo lumineux derrière le produit au survol */}
        {PCARD === 4 && img && (
          <span aria-hidden className="absolute -inset-x-[4%] top-0 bottom-[-6%] opacity-0 scale-75 transition-all duration-300 group-hover/pc:opacity-100 group-hover/pc:scale-100"
            style={{ background: "radial-gradient(closest-side, rgba(143,191,156,0.85), rgba(143,191,156,0.35) 55%, transparent 100%)" }} />
        )}
        {img ? (
          <img src={displayImg} alt={part.name} loading="lazy" decoding="async"
            className={cn("relative object-contain transition-transform duration-300 ease-out", PCARD === 4 ? "h-full w-auto max-w-[88%] origin-bottom group-hover/pc:-translate-y-1.5 group-hover/pc:scale-[1.08] group-hover/pc:brightness-110" : "max-w-[78%] max-h-[78%] group-hover:-translate-y-1")}
            style={{ filter: "drop-shadow(0 12px 14px rgba(0,0,0,0.16))", scale: PCARD === 4 ? String(BOOST[catSlug ?? ""] ?? 1) : undefined }} />
        ) : <div className="text-3xl opacity-30">🔧</div>}
        {isOut && (
          <span className="absolute left-2 bottom-2 px-2 py-1 text-sm font-bold text-white" style={{ background: "#1A1A1A", clipPath: A_CUT(6) }}>Rupture</span>
        )}
        {PCARD === 5 && (
          <button type="button" onClick={handleQuickAdd} disabled={isOut || part.price === null} aria-label="Ajouter au panier"
            className="absolute right-2 bottom-2 w-12 h-12 inline-flex items-center justify-center text-white disabled:opacity-40 z-[3]" style={{ background: "#FF6600", clipPath: A_CUT(8) }}>
            <ShoppingCart size={19} strokeWidth={2.4} />
          </button>
        )}
      </div>
      {PCARD !== 4 && (
        <button type="button" onClick={handleFavoriteClick} disabled={isToggling} aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
          className="absolute z-[4] top-1.5 right-1.5 w-11 h-11 flex items-center justify-center">
          <span className="w-8 h-8 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.92)", boxShadow: `inset 0 0 0 1px ${A_LINE}`, clipPath: A_CUT(6) }}>
            <Heart size={16} strokeWidth={2.2} className={isFav ? "fill-current" : "fill-none"} style={{ color: isFav ? "#DC2626" : "#1A1A1A" }} />
          </span>
        </button>
      )}
      {/* Corps */}
      <div className={cn("relative transition-shadow duration-300", PCARD === 4 && "pt-[106px] md:pt-[120px] group-hover/pc:shadow-[0_14px_30px_rgba(26,26,26,0.12)]")}
        style={{ background: PCARD === 1 ? "#1A1A1A" : "#FFFFFF", boxShadow: PCARD === 1 ? undefined : `inset 0 0 0 1px ${A_LINE}`, clipPath: PCARD === 1 ? undefined : PCARD === 4 ? A_CUT(14) : undefined }}>
        <div className="px-3 pt-3 pb-3">
          {catName && (
            <p className="text-sm font-bold uppercase tracking-wide truncate" style={{ color: PCARD === 1 ? "#8FBF9C" : "#4A7C59" }}>{catName}</p>
          )}
          <h4 className="mt-1 text-[15px] font-extrabold leading-snug line-clamp-2" style={{ fontFamily: A_FONT, letterSpacing: "-0.01em", color: PCARD === 1 ? "#FFFFFF" : "#1A1A1A", minHeight: "2.6em" }}>{part.name}</h4>
          {PCARD === 3 ? (
            <div className="mt-3 flex items-stretch justify-between gap-2">
              <span className="inline-flex items-center px-3 min-h-[44px] text-[20px] text-white" style={{ background: "#1A1A1A", fontFamily: A_UNB, fontWeight: 900, fontStyle: "italic", clipPath: A_CUT(8) }}>
                {part.price != null ? frPrice(part.price) : "—"}
              </span>
              <button type="button" onClick={handleQuickAdd} disabled={isOut || part.price === null} aria-label="Ajouter au panier"
                className="w-12 min-h-[44px] inline-flex items-center justify-center text-white disabled:opacity-40" style={{ background: "#FF6600", clipPath: A_CUT(8) }}>
                <ShoppingCart size={18} strokeWidth={2.4} />
              </button>
            </div>
          ) : PCARD === 5 ? (
            <p className="mt-2 text-[22px] leading-none" style={{ fontFamily: A_UNB, fontWeight: 900, fontStyle: "italic", color: "#1A1A1A" }}>{part.price != null ? frPrice(part.price) : "—"}</p>
          ) : (
            <>
              <p className="mt-1.5 text-[24px] leading-none" style={{ fontFamily: A_UNB, fontWeight: 900, fontStyle: "italic", color: PCARD === 1 ? "#FFFFFF" : "#1A1A1A" }}>
                {part.price != null ? frPrice(part.price) : "—"}
              </p>
              <button type="button" onClick={handleQuickAdd} disabled={isOut || part.price === null}
                className="mt-3 w-full min-h-[44px] inline-flex items-center justify-center gap-2 text-sm font-extrabold uppercase tracking-wide text-white disabled:opacity-40"
                style={{ background: "#FF6600", clipPath: A_CUT(8) }}>
                <ShoppingCart size={16} strokeWidth={2.4} /> {isOut ? "Indisponible" : "Ajouter"}
              </button>
            </>
          )}
        </div>
      </div>
    </Link>
  ) : null;

  if (atelier) return atelier;

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
          className="text-[13px] lg:text-[14px] leading-tight line-clamp-2 mb-1.5 transition-colors"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            color: "rgba(255,255,255,0.97)",
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
        : "bg-[#FF6600] text-white border-[#FF6600] hover:bg-[#E85D00] hover:border-[#E85D00] active:scale-[0.97]"
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
