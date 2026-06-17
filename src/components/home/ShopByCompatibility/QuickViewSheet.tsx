import { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  animate,
  useMotionValue,
  useTransform,
  useDragControls,
  useReducedMotion,
  type PanInfo,
} from "framer-motion";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useNavigate } from "react-router-dom";
import {
  X,
  ShoppingCart,
  Check,
  Truck,
  RotateCcw,
  Plus,
  Minus,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { useSelectedScooter, getBrandColors } from "@/contexts/ScooterContext";
import { getPrimaryImage, getAllImages } from "@/lib/entityImage";
import { optimizedImage } from "@/lib/imageTransform";
import { formatPrice } from "@/lib/formatPrice";
import {
  resolveCategoryColor,
  getCategoryTextColor,
  getShortLabel,
} from "@/lib/categoryColors";
import { cn } from "@/lib/utils";
import { usePartBySlug } from "@/hooks/usePartDetail";
import { stripHtml } from "@/lib/sanitizeHtml";
import type { CompatiblePartRich } from "@/hooks/useCompatiblePartsRich";

/* ── Charte (alignée sur le module + mockup) ─────────────────────────────── */
const C = {
  beige: "#FAFAF8",
  ink: "#1A1A1A",
  muted: "#6B7280",
  line: "#E7E2D8",
  sage: "#4A7C59",
  sageD: "#3A6449",
  orange: "#FF6600",
  orangeD: "#E85D00",
};
// NB: le projet charge Inter (pas Unbounded/Sora). On reste cohérent avec
// PartCardSlim et tout le module en utilisant 'Inter'.
const FONT = "'Inter', sans-serif";
const SPRING = [0.22, 1, 0.36, 1] as const;

const EMBLA_OPTIONS = {
  loop: false,
  align: "center" as const,
  containScroll: "trimSnaps" as const,
};

const hexToRgba = (hex: string, alpha: number): string => {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

/* ── Specs chips : allowlist curée (clé → label FR) ──────────────────────── */
const SPEC_LABELS: Record<string, { label: string; suffix?: string }> = {
  taille: { label: "Taille" },
  poids: { label: "Poids" },
  weight_g: { label: "Poids", suffix: " g" },
  materiau: { label: "Matériau" },
  durabilite: { label: "Durabilité" },
  pression_recommandee: { label: "Pression" },
  type: { label: "Type" },
  brand: { label: "Marque" },
  marque: { label: "Marque" },
  tension: { label: "Tension" },
  voltage: { label: "Tension" },
  intensite: { label: "Intensité" },
  courant: { label: "Intensité" },
  amperage: { label: "Intensité" },
  connecteur: { label: "Connecteur" },
  prise: { label: "Connecteur" },
  valve: { label: "Valve" },
  diametre: { label: "Diamètre" },
};

/* 🔒 Blackliste : tout fragment interdit dans une clé l'exclut, MÊME si elle est
   dans l'allowlist. Le prix fournisseur / la marge / les champs internes ne
   doivent JAMAIS sortir côté client. En cas de doute → on n'affiche pas. */
const SPEC_BLACKLIST = [
  "price", "prix", "cost", "cout", "coût", "marge", "achat", "wholesale",
  "ttc", "ht_", "public_price", "images", "image", "source", "airtable",
  "record_id", "dimensions", "features",
];

const isBlacklisted = (key: string): boolean => {
  const k = key.toLowerCase();
  return SPEC_BLACKLIST.some((bad) => k.includes(bad));
};

interface SpecChip {
  label: string;
  value: string;
}

interface SpecFallback {
  sku: string | null;
  category: string | null;
  difficulty: number | null;
  inStock: boolean;
}

const buildSpecChips = (
  meta: Record<string, unknown> | null | undefined,
  fallback: SpecFallback
): SpecChip[] => {
  const chips: SpecChip[] = [];
  if (meta && typeof meta === "object") {
    for (const [key, raw] of Object.entries(meta)) {
      if (chips.length >= 4) break;
      if (isBlacklisted(key)) continue; // 🔒 la blackliste gagne toujours
      const def = SPEC_LABELS[key.toLowerCase()];
      if (!def) continue; // clé inconnue → on n'affiche pas
      if (raw === null || raw === undefined) continue;
      if (typeof raw !== "string" && typeof raw !== "number") continue; // scalaire only
      const valStr = String(raw).trim();
      if (!valStr) continue;
      chips.push({ label: def.label, value: def.suffix ? `${valStr}${def.suffix}` : valStr });
    }
  }
  if (chips.length > 0) return chips.slice(0, 4);

  // Fallback propre (jamais vide).
  const fb: SpecChip[] = [];
  if (fallback.sku) fb.push({ label: "Réf", value: fallback.sku });
  if (fallback.category) fb.push({ label: "Catégorie", value: fallback.category });
  if (fallback.difficulty != null) fb.push({ label: "Difficulté", value: `${fallback.difficulty}/5` });
  fb.push({ label: "Dispo", value: fallback.inStock ? "En stock" : "Rupture" });
  return fb.slice(0, 4);
};

const ZOOM_FACTOR = 2;

interface ZoomableImageProps {
  src: string;
  alt: string;
  active: boolean;          // image actuellement visible (slide active / image unique)
  zoomed: boolean;          // état zoom partagé par le sheet
  onToggle: () => void;
  isMobile: boolean;
  reduceMotion: boolean;
}

/* Tap-to-zoom custom (clic desktop / double-tap mobile) + pan framer borné
   aux limites réelles de l'image. Aucune dépendance externe. */
const ZoomableImage = ({
  src,
  alt,
  active,
  zoomed,
  onToggle,
  isMobile,
  reduceMotion,
}: ZoomableImageProps) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const panX = useMotionValue(0);
  const panY = useMotionValue(0);
  const scale = useMotionValue(1);
  const draggedRef = useRef(false);
  const lastTapRef = useRef(0);
  const [bounds, setBounds] = useState({ x: 0, y: 0 });

  const isZoomed = active && zoomed;

  // Bornes du pan = débordement de l'image (×2) hors du cadre, jamais négatif.
  // clientWidth/Height ignorent le transform → mesure stable même zoomé.
  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    const im = imgRef.current;
    if (!wrap || !im) return;
    const ox = Math.max(0, (im.clientWidth * ZOOM_FACTOR - wrap.clientWidth) / 2);
    const oy = Math.max(0, (im.clientHeight * ZOOM_FACTOR - wrap.clientHeight) / 2);
    setBounds({ x: ox, y: oy });
  }, []);

  // Anime le scale au toggle ; au dézoom, ramène le pan à 0.
  useEffect(() => {
    if (isZoomed) measure();
    const dur = reduceMotion ? 0 : 0.28;
    const ease = [0.22, 1, 0.36, 1] as const;
    const ctrl = animate(scale, isZoomed ? ZOOM_FACTOR : 1, { duration: dur, ease });
    let cx: ReturnType<typeof animate> | undefined;
    let cy: ReturnType<typeof animate> | undefined;
    if (!isZoomed) {
      cx = animate(panX, 0, { duration: dur, ease });
      cy = animate(panY, 0, { duration: dur, ease });
    }
    return () => {
      ctrl.stop();
      cx?.stop();
      cy?.stop();
    };
  }, [isZoomed, reduceMotion, measure, scale, panX, panY]);

  // Recalcule les bornes au resize tant qu'on est zoomé (rotation / responsive).
  useEffect(() => {
    if (!isZoomed) return;
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [isZoomed, measure]);

  const handleClick = () => {
    if (!active) return;
    // Fin de pan → pas un tap : on absorbe le clic.
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    if (isMobile) {
      const now = Date.now();
      if (now - lastTapRef.current < 280) {
        lastTapRef.current = 0;
        onToggle();
      } else {
        lastTapRef.current = now;
      }
    } else {
      onToggle();
    }
  };

  return (
    <motion.div
      ref={wrapRef}
      className="absolute inset-0 flex items-center justify-center"
      style={{
        x: panX,
        y: panY,
        scale,
        cursor: !active ? "default" : isZoomed ? "grab" : "zoom-in",
        touchAction: isZoomed ? "none" : undefined,
        willChange: "transform",
      }}
      drag={isZoomed}
      dragConstraints={{ left: -bounds.x, right: bounds.x, top: -bounds.y, bottom: bounds.y }}
      dragElastic={0.12}
      dragMomentum={false}
      onDragStart={() => {
        draggedRef.current = true;
      }}
      onClick={handleClick}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        draggable={false}
        onLoad={measure}
        className="object-contain pointer-events-none"
        style={{
          maxWidth: "78%",
          maxHeight: "82%",
          filter: "drop-shadow(0 16px 24px rgba(0,0,0,0.18))",
        }}
      />
    </motion.div>
  );
};

interface Props {
  open: boolean;
  onClose: () => void;
  /** Données déjà en main côté carte. null quand rien n'est sélectionné. */
  part: CompatiblePartRich | null;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

const QuickViewSheet = ({ open, onClose, part }: Props) => {
  const navigate = useNavigate();
  // isMobile synchrone AU 1ER RENDU (évite le flash desktop→mobile sur iPhone).
  // Local au composant pour ne pas modifier le hook partagé use-mobile.tsx.
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 767px)").matches
      : false
  );
  const reduceMotion = useReducedMotion();
  const { addItem, setIsOpen } = useCart();
  const { selectedScooter } = useSelectedScooter();

  const [qty, setQty] = useState(1);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const rippleId = useRef(0);

  // Drag-to-close (mobile) : la poignée démarre le geste, le contenu reste scrollable.
  const dragControls = useDragControls();
  const y = useMotionValue(0);
  const overlayOpacity = useTransform(y, [0, 400], [1, 0]);

  // Détail produit (specs + description) — fetch LAZY : enabled seulement quand
  // le sheet est ouvert (slug undefined sinon → useQuery désactivé, zéro coût).
  const { data: detail, isLoading: detailLoading } = usePartBySlug(
    open && part ? part.slug : undefined
  );

  // Galerie embla (swipe mobile + clic miniatures desktop).
  const [emblaRef, emblaApi] = useEmblaCarousel(EMBLA_OPTIONS);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  // Synchronise l'index courant (swipe / flèches / miniatures).
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  // Re-init + retour à la 1ʳᵉ image à chaque (ré)ouverture / changement de pièce.
  useEffect(() => {
    if (open && emblaApi) {
      emblaApi.reInit();
      emblaApi.scrollTo(0, true);
      setSelectedIndex(0);
    }
  }, [open, part?.id, emblaApi]);

  // Reset quantité à chaque (ré)ouverture / changement de pièce.
  useEffect(() => {
    if (open) setQty(1);
  }, [open, part?.id]);

  // Reset zoom à la fermeture / au changement de pièce (rouvrir = 1x).
  useEffect(() => {
    setZoomed(false);
  }, [open, part?.id]);

  // Naviguer dans la galerie (miniatures / flèches) dézoome.
  useEffect(() => {
    setZoomed(false);
  }, [selectedIndex]);

  // Zoom actif → on coupe le swipe embla pour que le pan ne change pas de slide.
  // Re-tap → watchDrag rétabli. scrollTo(idx) garde la slide courante.
  useEffect(() => {
    if (!emblaApi) return;
    const idx = emblaApi.selectedScrollSnap();
    emblaApi.reInit({ ...EMBLA_OPTIONS, watchDrag: !zoomed });
    emblaApi.scrollTo(idx, true);
  }, [zoomed, emblaApi]);

  // Garde isMobile à jour (rotation / resize), en parité avec use-mobile.tsx.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 767px)");
    const onChange = () => setIsMobile(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  if (!part) return null;

  const img = getPrimaryImage(part.images, part.image_url, "");
  const heroImg = img ? optimizedImage(img, 800) : "";
  const toastImg = img ? optimizedImage(img, 200) : "";

  const stock = part.stock_quantity ?? 0;
  const isOut = part.stock_quantity === 0;
  const priceUnavailable = part.price === null;
  const canBuy = !isOut && !priceUnavailable;
  const maxQty = stock > 0 ? stock : 1;

  // Couleur catégorie (même source que le patch de la carte).
  const catSlug = part.category?.slug ?? null;
  const catName = part.category?.name ?? "";
  const catColor = resolveCategoryColor(part.category?.color ?? null, catSlug);
  const catText = getCategoryTextColor(catColor);
  const catShort = getShortLabel(catSlug, catName);

  // Badge compat : couleur de marque + glow, UNIQUEMENT si un scooter est actif.
  const brandCfg = selectedScooter ? getBrandColors(selectedScooter.brandName) : null;

  // Specs chips (allowlist + blackliste, max 4, fallback propre) + mini-description.
  const specChips = detailLoading
    ? []
    : buildSpecChips(detail?.technical_metadata, {
        sku: detail?.sku ?? null,
        category: part.category?.name ?? null,
        difficulty: detail?.difficulty_level ?? null,
        inStock: !isOut,
      });
  const descText = detail?.description ? stripHtml(detail.description) : "";

  // Galerie : toutes les images (triées primary→position) depuis les données carte.
  const galleryImages = getAllImages(part.images, part.image_url);
  const hasGallery = galleryImages.length > 1;

  const bump = (delta: number) =>
    setQty((q) => Math.min(maxQty, Math.max(1, q + delta)));

  const spawnRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (reduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const id = ++rippleId.current;
    setRipples((rs) => [
      ...rs,
      { id, x: e.clientX - rect.left - size / 2, y: e.clientY - rect.top - size / 2, size },
    ]);
    window.setTimeout(() => setRipples((rs) => rs.filter((r) => r.id !== id)), 560);
  };

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!canBuy || part.price === null) return;
    spawnRipple(e);

    // useCart.addItem ajoute 1 (merge +1, plafonné stock) → on boucle pour qty.
    for (let i = 0; i < qty; i++) {
      addItem({
        id: part.id,
        name: part.name,
        price: part.price,
        image_url: img || part.image_url,
        stock_quantity: stock,
      });
    }

    // Même toast sonner que PartCardSlim.
    toast.success(
      <div className="flex items-center gap-3">
        {img ? (
          <img
            src={toastImg}
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
          <p className="text-xs text-[#6B7280]">
            {qty > 1 ? `${qty} ajoutés au panier` : "Ajouté au panier"}
          </p>
        </div>
      </div>,
      {
        action: {
          label: "Voir",
          onClick: () => setIsOpen(true),
        },
      }
    );

    onClose();
  };

  const handleSeeProduct = () => {
    const slug = part.slug;
    onClose();
    window.setTimeout(() => navigate(`/piece/${slug}`), 120);
  };

  const handleDragEnd = (_e: PointerEvent, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose();
  };

  /* ── Animations conditionnelles mobile (bottom sheet) / desktop (modal) ── */
  const overlayMotion = isMobile
    ? { style: { opacity: overlayOpacity } }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.3 },
      };

  const sheetMotion = isMobile
    ? {
        style: { y },
        initial: { y: 800 },
        animate: { y: 0 },
        exit: { y: 800 },
        transition: reduceMotion
          ? { duration: 0.001 }
          : { type: "spring" as const, damping: 34, stiffness: 330 },
        drag: "y" as const,
        dragListener: false,
        dragControls,
        dragConstraints: { top: 0, bottom: 0 },
        dragElastic: { top: 0, bottom: 0.9 },
        onDragEnd: handleDragEnd,
      }
    : {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.96 },
        transition: reduceMotion ? { duration: 0.001 } : { duration: 0.32, ease: SPRING },
      };

  // Cascade reveal du contenu (stagger).
  const containerV = {
    hidden: {},
    visible: {
      transition: reduceMotion
        ? {}
        : { staggerChildren: 0.055, delayChildren: 0.12 },
    },
  };
  const itemV = {
    hidden: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: reduceMotion ? { duration: 0.001 } : { duration: 0.5, ease: SPRING },
    },
  };

  // outline-none : supprime le liseré bleu de focus que Radix pose sur le Content
  // (cible focus programmatique tabindex=-1). Les contrôles internes gardent
  // leur propre :focus-visible → accessibilité clavier préservée.
  const positioning = isMobile
    ? "fixed inset-x-0 bottom-0 z-[110] mx-auto w-full max-w-[430px] outline-none focus:outline-none focus-visible:outline-none"
    : "fixed left-1/2 top-1/2 z-[110] w-[92%] max-w-[440px] -translate-x-1/2 -translate-y-1/2 outline-none focus:outline-none focus-visible:outline-none";

  const totalPrice = part.price != null ? part.price * qty : null;

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            {/* Backdrop */}
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-[100]"
                style={{
                  background: "rgba(14,14,14,0.62)",
                  backdropFilter: "blur(3px)",
                  WebkitBackdropFilter: "blur(3px)",
                  ...(isMobile ? { opacity: overlayOpacity } : {}),
                }}
                onClick={onClose}
                {...overlayMotion}
              />
            </DialogPrimitive.Overlay>

            {/* Conteneur de positionnement (statique) — reçoit le rôle dialog */}
            <DialogPrimitive.Content
              asChild
              forceMount
              aria-describedby={undefined}
              onOpenAutoFocus={(e) => {
                // Évite le scroll-jump : pas d'autofocus agressif sur le 1er bouton.
                e.preventDefault();
              }}
            >
              <div className={positioning}>
                <motion.div
                  className="flex flex-col overflow-hidden"
                  style={{
                    background: C.beige,
                    borderRadius: isMobile ? "26px 26px 0 0" : "22px",
                    maxHeight: isMobile ? "93vh" : "88vh",
                    boxShadow: isMobile
                      ? "0 -20px 55px -10px rgba(0,0,0,0.42)"
                      : "0 32px 64px -16px rgba(26,26,26,0.32)",
                    ...(isMobile ? {} : { y: 0 }),
                  }}
                  {...sheetMotion}
                >
                  {/* Poignée drag (mobile) */}
                  {isMobile && (
                    <div
                      className="flex justify-center flex-none cursor-grab active:cursor-grabbing"
                      style={{ padding: "11px 0 4px", touchAction: "none" }}
                      onPointerDown={(e) => dragControls.start(e)}
                      aria-hidden
                    >
                      <span
                        className="block rounded-full"
                        style={{ width: 42, height: 5, background: "#D8D2C6" }}
                      />
                    </div>
                  )}

                  {/* Fermer */}
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fermer l'aperçu"
                    className="absolute z-[3] flex items-center justify-center rounded-full transition-transform duration-200 hover:rotate-90"
                    style={{
                      top: 12,
                      right: 12,
                      width: 36,
                      height: 36,
                      background: "#ECE7DD",
                      color: "#6B6457",
                    }}
                  >
                    <X size={17} strokeWidth={2.4} />
                  </button>

                  {/* Contenu scrollable + cascade */}
                  <motion.div
                    className="flex-auto min-h-0 overflow-y-auto overscroll-contain"
                    style={{ padding: "6px 20px 8px", WebkitOverflowScrolling: "touch", background: C.beige }}
                    variants={containerV}
                    initial="hidden"
                    animate="visible"
                  >
                    {/* Hero image / galerie */}
                    <motion.div
                      variants={itemV}
                      className="relative overflow-hidden"
                      style={{
                        borderRadius: 18,
                        marginTop: 6,
                        aspectRatio: "16 / 11",
                        background:
                          "radial-gradient(120% 110% at 50% 12%, #fff 0%, #f4f2ec 68%, #ece9e1 100%)",
                        border: `1px solid ${C.line}`,
                      }}
                    >
                      {catSlug && catShort && (
                        <span
                          className="absolute inline-flex items-center gap-1.5"
                          style={{
                            top: 12,
                            left: 12,
                            zIndex: 3,
                            padding: "5px 10px",
                            borderRadius: 99,
                            backgroundColor: hexToRgba(catColor, 0.14),
                            border: `0.5px solid ${hexToRgba(catColor, 0.28)}`,
                            color: catText,
                            fontFamily: FONT,
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                          }}
                        >
                          <span
                            aria-hidden
                            className="inline-block rounded-full"
                            style={{ width: 6, height: 6, background: catColor }}
                          />
                          {catShort}
                        </span>
                      )}

                      {hasGallery ? (
                        <div className="absolute inset-0 overflow-hidden" ref={emblaRef}>
                          <div className="flex h-full">
                            {galleryImages.map((im, i) => (
                              <div
                                key={`${im.url}-${i}`}
                                className="relative flex-[0_0_100%] h-full select-none"
                              >
                                <ZoomableImage
                                  src={optimizedImage(im.url, 800)}
                                  alt={im.alt || `${part.name} — vue ${i + 1}`}
                                  active={i === selectedIndex}
                                  zoomed={zoomed}
                                  onToggle={() => setZoomed((z) => !z)}
                                  isMobile={isMobile}
                                  reduceMotion={!!reduceMotion}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : heroImg ? (
                        <ZoomableImage
                          src={heroImg}
                          alt={part.name}
                          active
                          zoomed={zoomed}
                          onToggle={() => setZoomed((z) => !z)}
                          isMobile={isMobile}
                          reduceMotion={!!reduceMotion}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-25">
                          🔧
                        </div>
                      )}

                      {/* Flèches desktop (galerie multi-images) — masquées au zoom */}
                      {hasGallery && !isMobile && !zoomed && (
                        <>
                          <button
                            type="button"
                            onClick={() => emblaApi?.scrollPrev()}
                            aria-label="Photo précédente"
                            className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-transform hover:scale-105"
                            style={{ zIndex: 3, width: 34, height: 34, background: "rgba(255,255,255,0.92)", border: `1px solid ${C.line}`, color: C.ink }}
                          >
                            <ChevronLeft size={18} strokeWidth={2.4} />
                          </button>
                          <button
                            type="button"
                            onClick={() => emblaApi?.scrollNext()}
                            aria-label="Photo suivante"
                            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-transform hover:scale-105"
                            style={{ zIndex: 3, width: 34, height: 34, background: "rgba(255,255,255,0.92)", border: `1px solid ${C.line}`, color: C.ink }}
                          >
                            <ChevronRight size={18} strokeWidth={2.4} />
                          </button>
                        </>
                      )}

                      {/* Compteur d'images */}
                      {hasGallery && (
                        <div
                          className="absolute flex items-center"
                          style={{
                            zIndex: 3,
                            bottom: 10,
                            right: 10,
                            padding: "3px 9px",
                            borderRadius: 99,
                            background: "rgba(26,26,26,0.72)",
                            color: "#fff",
                            fontFamily: FONT,
                            fontSize: 11,
                            fontWeight: 600,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {selectedIndex + 1} / {galleryImages.length}
                        </div>
                      )}

                      {isOut && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/55 backdrop-blur-[2px]">
                          <span
                            className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
                            style={{ background: C.ink, color: "#fff" }}
                          >
                            Rupture de stock
                          </span>
                        </div>
                      )}
                    </motion.div>

                    {/* Miniatures interactives synchronisées embla */}
                    {hasGallery && (
                      <motion.div variants={itemV} className="flex gap-2" style={{ marginTop: 10 }}>
                        {galleryImages.map((im, i) => (
                          <button
                            type="button"
                            key={`${im.url}-${i}`}
                            onClick={() => emblaApi?.scrollTo(i)}
                            aria-label={`Voir la photo ${i + 1}`}
                            aria-current={i === selectedIndex}
                            className="flex items-center justify-center overflow-hidden transition-all duration-150"
                            style={{
                              flex: "0 0 auto",
                              width: 46,
                              height: 46,
                              borderRadius: 10,
                              background: "#fff",
                              border: `1px solid ${i === selectedIndex ? C.sage : C.line}`,
                              boxShadow: i === selectedIndex ? `0 0 0 2px ${hexToRgba(C.sage, 0.25)}` : "none",
                              opacity: i === selectedIndex ? 1 : 0.65,
                            }}
                          >
                            <img
                              src={optimizedImage(im.url, 200)}
                              alt=""
                              className="max-w-[80%] max-h-[80%] object-contain"
                            />
                          </button>
                        ))}
                      </motion.div>
                    )}

                    {/* Catégorie */}
                    {catName && (
                      <motion.div
                        variants={itemV}
                        style={{
                          marginTop: 16,
                          marginBottom: 5,
                          fontFamily: FONT,
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: C.muted,
                        }}
                      >
                        {catName}
                      </motion.div>
                    )}

                    {/* Nom (titre accessible) */}
                    <motion.div variants={itemV}>
                      <DialogPrimitive.Title asChild>
                        <h2
                          style={{
                            fontFamily: FONT,
                            fontWeight: 700,
                            fontSize: 21,
                            lineHeight: 1.18,
                            letterSpacing: "-0.01em",
                            color: C.ink,
                          }}
                        >
                          {part.name}
                        </h2>
                      </DialogPrimitive.Title>
                    </motion.div>

                    {/* Badge compat (couleur de marque + glow) */}
                    {brandCfg && selectedScooter && (
                      <motion.div variants={itemV}>
                        <span
                          className="inline-flex items-center gap-2"
                          style={{
                            marginTop: 12,
                            padding: "7px 12px",
                            borderRadius: 99,
                            background: hexToRgba(brandCfg.accent, 0.1),
                            border: `1px solid ${hexToRgba(brandCfg.accent, 0.28)}`,
                            boxShadow: `0 8px 22px -10px ${brandCfg.glowColor}`,
                            fontFamily: FONT,
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: brandCfg.accent,
                          }}
                        >
                          <span
                            className="inline-flex items-center justify-center rounded-full flex-shrink-0"
                            style={{ width: 16, height: 16, background: brandCfg.accent, color: "#fff" }}
                          >
                            <Check size={10} strokeWidth={3} />
                          </span>
                          Compatible avec ta {selectedScooter.name}
                        </span>
                      </motion.div>
                    )}

                    {/* Mini-description (lazy, stripHtml, clamp 4 lignes, masquée si vide) */}
                    {detailLoading ? (
                      <motion.div variants={itemV} style={{ marginTop: 14 }} aria-hidden>
                        <div className="qv-skel" style={{ height: 13, width: "92%", marginBottom: 7 }} />
                        <div className="qv-skel" style={{ height: 13, width: "98%", marginBottom: 7 }} />
                        <div className="qv-skel" style={{ height: 13, width: "68%" }} />
                      </motion.div>
                    ) : descText ? (
                      <motion.p
                        variants={itemV}
                        className="line-clamp-4"
                        style={{
                          marginTop: 14,
                          fontFamily: FONT,
                          fontSize: 14,
                          lineHeight: 1.55,
                          color: "#4A4A4A",
                        }}
                      >
                        {descText}
                      </motion.p>
                    ) : null}

                    {/* Chips specs (lazy : allowlist + blackliste, sinon fallback propre) */}
                    {detailLoading ? (
                      <motion.div
                        variants={itemV}
                        className="flex flex-wrap gap-2"
                        style={{ marginTop: 14 }}
                        aria-hidden
                      >
                        {[66, 90, 74].map((w, i) => (
                          <div key={i} className="qv-skel" style={{ height: 33, width: w, borderRadius: 10 }} />
                        ))}
                      </motion.div>
                    ) : specChips.length > 0 ? (
                      <motion.div variants={itemV} className="flex flex-wrap gap-2" style={{ marginTop: 14 }}>
                        {specChips.map((c, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5"
                            style={{
                              background: "#fff",
                              border: `1px solid ${C.line}`,
                              borderRadius: 10,
                              padding: "8px 11px",
                              fontFamily: FONT,
                              fontSize: 13,
                              fontWeight: 500,
                              color: "#3F3F3F",
                            }}
                          >
                            <b style={{ color: C.muted, fontWeight: 600, fontSize: 11.5 }}>{c.label}</b>
                            {c.value}
                          </span>
                        ))}
                      </motion.div>
                    ) : null}

                    {/* Réassurance */}
                    <motion.div
                      variants={itemV}
                      className="flex flex-wrap gap-x-4 gap-y-2"
                      style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.line}` }}
                    >
                      <span
                        className="inline-flex items-center gap-1.5"
                        style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: isOut ? "#B45309" : C.sageD }}
                      >
                        <span
                          className="inline-block rounded-full flex-shrink-0"
                          style={{ width: 8, height: 8, background: isOut ? "#DC2626" : C.sage }}
                        />
                        {isOut ? "Rupture de stock" : "En stock"}
                      </span>
                      <span
                        className="inline-flex items-center gap-1.5"
                        style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: "#454545" }}
                      >
                        <Truck size={14} strokeWidth={2} /> Expédié sous 24h
                      </span>
                      <span
                        className="inline-flex items-center gap-1.5"
                        style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: "#454545" }}
                      >
                        <RotateCcw size={13} strokeWidth={2} /> Retour 14j
                      </span>
                    </motion.div>
                  </motion.div>

                  {/* Footer collant : stepper + CTA + lien fiche */}
                  <div
                    className="flex-none"
                    style={{
                      padding: "14px 20px calc(16px + env(safe-area-inset-bottom))",
                      background: C.beige,
                      borderTop: `1px solid ${C.line}`,
                      boxShadow: "0 -8px 20px -14px rgba(0,0,0,0.18)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {/* Stepper quantité */}
                      <div
                        className="flex items-center overflow-hidden flex-none"
                        style={{ height: 52, border: `1px solid ${C.line}`, borderRadius: 12, background: "#fff" }}
                      >
                        <button
                          type="button"
                          onClick={() => bump(-1)}
                          disabled={qty <= 1}
                          aria-label="Diminuer la quantité"
                          className="flex items-center justify-center transition-colors disabled:opacity-30 hover:bg-[#F4F1EA]"
                          style={{ width: 44, height: 52, color: "#3F3F3F" }}
                        >
                          <Minus size={18} strokeWidth={2.4} />
                        </button>
                        <span
                          className="text-center tabular-nums"
                          style={{ minWidth: 26, fontFamily: FONT, fontWeight: 600, fontSize: 15, color: C.ink }}
                        >
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => bump(1)}
                          disabled={qty >= maxQty}
                          aria-label="Augmenter la quantité"
                          className="flex items-center justify-center transition-colors disabled:opacity-30 hover:bg-[#F4F1EA]"
                          style={{ width: 44, height: 52, color: "#3F3F3F" }}
                        >
                          <Plus size={18} strokeWidth={2.4} />
                        </button>
                      </div>

                      {/* CTA achat (orange — réservé à l'achat) */}
                      <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={!canBuy}
                        className={cn(
                          "relative flex-1 inline-flex items-center justify-center gap-2 overflow-hidden transition-all duration-200 active:scale-[0.98]",
                          !canBuy && "cursor-not-allowed opacity-60"
                        )}
                        style={{
                          height: 52,
                          borderRadius: 13,
                          background: canBuy ? C.orange : "#9A9A9A",
                          color: "#fff",
                          fontFamily: FONT,
                          fontWeight: 700,
                          fontSize: 15,
                          boxShadow: canBuy ? "0 10px 24px -8px rgba(255,102,0,0.6)" : "none",
                        }}
                        onMouseEnter={(e) => {
                          if (canBuy) e.currentTarget.style.background = C.orangeD;
                        }}
                        onMouseLeave={(e) => {
                          if (canBuy) e.currentTarget.style.background = C.orange;
                        }}
                      >
                        <ShoppingCart size={17} strokeWidth={2.2} />
                        {isOut ? (
                          <span>Indisponible</span>
                        ) : priceUnavailable ? (
                          <span>Prix sur demande</span>
                        ) : (
                          <span>Ajouter — {formatPrice(totalPrice!)}</span>
                        )}
                        {/* ripples */}
                        {ripples.map((r) => (
                          <span
                            key={r.id}
                            className="pointer-events-none absolute rounded-full qv-ripple"
                            style={{
                              left: r.x,
                              top: r.y,
                              width: r.size,
                              height: r.size,
                              background: "rgba(255,255,255,0.45)",
                            }}
                          />
                        ))}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleSeeProduct}
                      className="flex items-center justify-center gap-1.5 w-full transition-all hover:gap-2.5"
                      style={{
                        marginTop: 11,
                        minHeight: 44,
                        background: "none",
                        color: C.sageD,
                        fontFamily: FONT,
                        fontWeight: 600,
                        fontSize: 14,
                      }}
                    >
                      <span className="hover:underline underline-offset-4">Voir la fiche complète</span>
                      <ArrowRight size={15} strokeWidth={2.2} />
                    </button>
                  </div>
                </motion.div>
              </div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>

      {/* keyframes ripple (scopé) */}
      <style>{`
        @keyframes qvRipple { to { transform: scale(2.6); opacity: 0; } }
        .qv-ripple { transform: scale(0); animation: qvRipple 0.56s ease-out; }
        @keyframes qvPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
        .qv-skel { background: #ECE7DD; border-radius: 6px; animation: qvPulse 1.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .qv-ripple { animation: none; opacity: 0; }
          .qv-skel { animation: none; }
        }
      `}</style>
    </DialogPrimitive.Root>
  );
};

export default QuickViewSheet;
