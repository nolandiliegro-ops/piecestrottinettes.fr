import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShoppingCart, Check, Star, Shield, Sparkles, Bell } from "lucide-react";
import { forwardRef, MouseEvent, useId } from "react";
import PartFavoriteButton from "./PartFavoriteButton";
import { CompatiblePart } from "@/hooks/useScooterData";
import { getPrimaryImage } from "@/lib/entityImage";
import { optimizedImage } from "@/lib/imageTransform";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { pickBadge, STAMP_META, hexToRgba } from "@/lib/partStamps";
import { resolveCategoryColor } from "@/lib/categoryColors";
import { toast } from "sonner";
import { useIsCompatibleWithSelected } from "@/hooks/useIsCompatibleWithSelected";
import { useSelectedScooter } from "@/contexts/ScooterContext";

interface PartCardProps {
  part: CompatiblePart & { slug?: string; torque_nm?: number | null; is_featured?: boolean };
  index: number;
  className?: string;
}

// Extract key specs from technical_metadata JSONB
const extractSpecs = (metadata: Record<string, unknown> | null): { torque?: string; other?: string } => {
  if (!metadata) return {};
  
  const result: { torque?: string; other?: string } = {};
  
  // Extract torque specifically
  if (metadata.torque_nm !== undefined && metadata.torque_nm !== null) {
    result.torque = `${metadata.torque_nm} Nm`;
  }
  
  // Get first other spec
  const keyMapping: Record<string, string> = {
    weight_g: "g",
    diameter_mm: "mm",
    capacity_ah: "Ah",
    voltage: "V",
    wattage: "W",
  };

  for (const [key, suffix] of Object.entries(keyMapping)) {
    if (metadata[key] !== undefined && metadata[key] !== null && !result.other) {
      const value = metadata[key];
      if (typeof value === "number" || typeof value === "string") {
        result.other = `${value}${suffix}`;
      }
    }
  }

  return result;
};

// Assombrit une couleur hex (#RRGGBB) pour rester lisible sur fond blanc (eyebrow catégorie).
function darkenForLight(hex: string): string {
  const h = hex.replace("#", ""); if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  const f = 0.55;
  const d = (c: number) => Math.round(c * f).toString(16).padStart(2, "0");
  return `#${d(r)}${d(g)}${d(b)}`;
}

function DifficultyKey({ level }: { level: number | null }) {
  const lvl = Math.min(Math.max(level ?? 1, 1), 5);
  const color = ["#6BAA7A", "#4A7C59", "#EAB308", "#F97316", "#DC2626"][lvl - 1];
  const keyPath ="M19.4 3.6a5 5 0 0 0-6.7 6.5L3.5 19.3a1.6 1.6 0 0 0 0 2.3l-.1-.1a1.6 1.6 0 0 0 2.3 0l9.2-9.2a5 5 0 0 0 6.5-6.7l-3 3-2.6-.5-.5-2.6z";
  const uid = useId();
  const clipId = `diffkey-${lvl}-${uid}`;
  const labels = ["très facile", "facile", "moyenne", "difficile", "expert"];
  const aria = `Difficulté de pose : ${labels[lvl - 1]} (${lvl}/5)`;
  return (
    <svg width={30} height={30} viewBox="0 0 24 24" role="img" aria-label={aria}>
      <title>{aria}</title>
      <defs><clipPath id={clipId}><path d={keyPath} /></clipPath></defs>
      <g clipPath={`url(#${clipId})`}>
        <rect x="0" y="0" width="24" height="24" fill={color} />
      </g>
      <path d={keyPath} fill="none" stroke="rgba(0,0,0,0.38)" strokeWidth={1.2} />
    </svg>
  );
}

const PartCard = forwardRef<HTMLDivElement, PartCardProps>(
  function PartCardInner({ part, index, className }, ref) {
  const { addItem, setIsOpen } = useCart();
  const specs = extractSpecs(part.technical_metadata);
  const isOutOfStock = part.stock_quantity !== null && part.stock_quantity === 0;
  // Stamp ATELIER (BEST / SÉCU / NOUVEAU) — logique partagée. created_at absent du
  // type catalogue ⇒ NOUVEAU jamais déclenché ici (voulu).
  const badge = pickBadge(part);
  // Couleur d'accent catégorie : valeur BDD (categories.color) sinon mapping slug.
  // Garde undefined : sur le chemin scooter/Garage (useCompatibleParts), category n'a ni
  // color ni attributs ⇒ resolveCategoryColor retombe proprement sur le slug.
  const categoryColor = part.category
    ? resolveCategoryColor(part.category.color, part.category.slug)
    : null;
  // Prix splitté (entier gros + centimes + virgule FR), sans toucher au helper partagé formatPrice.
  const priceParts = part.price !== null
    ? (() => {
        const [int, dec] = part.price.toFixed(2).split(".");
        return { int, dec };
      })()
    : null;
  const primaryImage = getPrimaryImage(part.images, part.image_url, "");
  // Image affichée (grille ~250px) servie en WebP redimensionné, ratio préservé, sans rognage.
  const displayImage = optimizedImage(primaryImage, 400);
  
  // Compatibility check with selected scooter
  const { isCompatible, selectedScooter } = useIsCompatibleWithSelected(part.id);
  
  // Get dynamic brand colors
  const { selectedBrandColors } = useSelectedScooter();
  
  // Use torque_nm from part directly if available, otherwise from metadata
  const torqueValue = part.torque_nm ?? (part.technical_metadata?.torque_nm as number | undefined);
  const displayTorque = torqueValue ? `${torqueValue} Nm` : specs.torque;

  // Quick-add to cart handler
  const handleQuickAdd = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isOutOfStock || part.price === null) return;

    addItem({
      id: part.id,
      name: part.name,
      price: part.price,
      image_url: primaryImage || part.image_url,
      stock_quantity: part.stock_quantity || 0,
    });

    toast.success(
      <div className="flex items-center gap-3">
        {primaryImage ? (
          <img 
            src={displayImage}
            alt={part.name}
            className="w-10 h-10 rounded-lg object-contain bg-greige p-1"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-greige flex items-center justify-center">
            🔧
          </div>
        )}
        <div>
          <p className="font-medium text-carbon text-sm">{part.name}</p>
          <p className="text-xs text-muted-foreground">Ajouté au panier</p>
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

  const cardContent = (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      whileHover={{ 
        scale: 1.02, 
        y: -8,
        transition: { duration: 0.4, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.98 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={cn(
        "group relative rounded-xl p-5 cursor-pointer",
        "bg-white",
        "border border-[#ECE7DD]",
        "shadow-[0_6px_18px_-12px_rgba(26,26,26,0.25)]",
        "hover:shadow-[0_16px_34px_-16px_rgba(26,26,26,0.30)]",
        "hover:border-[#dcd3c2]",
        "transition-all duration-300 ease-out",
        className
      )}
    >
      {/* Subtle Gradient Overlay */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-mineral/3 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* COMPATIBLE Badge - Dynamic Neon LED Effect */}
      {selectedScooter && isCompatible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -10 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0,
          }}
          transition={{ 
            duration: 0.4, 
            delay: index * 0.05,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
          className="absolute top-3 right-3 z-20"
          style={{
            filter: `drop-shadow(0 0 10px ${selectedBrandColors.glowColor})`,
          }}
        >
          <motion.div 
            animate={{ 
              boxShadow: [
                `0 0 8px ${selectedBrandColors.glowColor}`,
                `0 0 16px ${selectedBrandColors.glowColor}`,
                `0 0 8px ${selectedBrandColors.glowColor}`,
              ]
            }}
            whileHover={{ scale: 1.05 }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-semibold tracking-wide uppercase text-white"
            style={{
              background: "rgba(147, 181, 161, 0.8)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
            }}
          >
            {/* Pulsing dot */}
            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [1, 0.7, 1]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: selectedBrandColors.accent }}
            />
            <span>Compatible</span>
          </motion.div>
        </motion.div>
      )}

      {/* Image Container - Luxury Studio Style */}
      <div className="relative aspect-square rounded-lg overflow-hidden bg-[#F9F8F6] mb-3 flex items-center justify-center">
        {/* Pastilles top-left empilées : catégorie (glass, requise) + stamp ATELIER (conditionnel) */}
        <div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-1.5">
          {/* Pastille catégorie GLASS — couleur réelle (BDD ou slug), lisible sur fond clair */}
          {part.category?.name && categoryColor && (
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 + 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="inline-flex items-center uppercase text-[9.5px] lg:text-[10px]"
              style={{
                padding: "4px 8px",
                borderRadius: 999,
                fontFamily: "'Inter', sans-serif",
                fontWeight: 800,
                letterSpacing: "0.06em",
                lineHeight: 1,
                color: darkenForLight(categoryColor),
                backgroundColor: hexToRgba(categoryColor, 0.14),
                border: `1px solid ${hexToRgba(categoryColor, 0.4)}`,
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
              }}
            >
              {part.category.name}
            </motion.span>
          )}

          {/* Stamp ATELIER — rendu cloné de PartCardSlim (home) : tampon plat icône + texte coloré
              (couleurs via STAMP_META[badge].full = stampColor home), à la place du rendu glass. */}
          {badge && (
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 + 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="inline-flex items-center gap-1 text-[9px] lg:text-[10px] font-bold uppercase"
              style={{
                color: STAMP_META[badge].full,
                letterSpacing: "0.06em",
                lineHeight: "13px",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {badge === "BEST" && <Star size={11} strokeWidth={2.4} fill="currentColor" aria-hidden />}
              {badge === "SÉCU" && <Shield size={11} strokeWidth={2.4} aria-hidden />}
              {badge === "NOUVEAU" && <Sparkles size={11} strokeWidth={2.4} aria-hidden />}
              {badge}
            </motion.span>
          )}
        </div>

        {/* Halo studio PERMANENT — lumière douce derrière le produit (amplifiée au hover) */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(58% 52% at 50% 42%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0) 62%)",
          }}
        />

        {/* Ombre portée "au sol" PERMANENTE — sous le produit, élargie/assombrie au hover */}
        <div
          aria-hidden
          className="absolute left-1/2 bottom-4 -translate-x-1/2 w-1/2 h-3 rounded-[50%] bg-black/20 blur-md pointer-events-none transition-all duration-500 group-hover:w-[58%] group-hover:bottom-3 group-hover:bg-black/25"
        />

        {primaryImage ? (
          <img
            src={displayImage}
            alt={part.name}
            loading="lazy"
            decoding="async"
            className={cn(
              "relative z-[1] w-full h-full object-contain p-4 drop-shadow-[0_12px_16px_rgba(26,26,26,0.16)] transition-all duration-500 group-hover:scale-[1.08] group-hover:drop-shadow-[0_22px_26px_rgba(26,26,26,0.22)]",
              // Rupture : photo "voilée/dormante" — devinée derrière un léger flou,
              // désaturée partiellement et adoucie (pas de gris mort, pas d'overlay masquant).
              isOutOfStock && "blur-[2px] grayscale-[60%] opacity-70"
            )}
          />
        ) : (
          <div className="relative z-[1] text-4xl opacity-30 drop-shadow-[0_10px_14px_rgba(26,26,26,0.14)]">🔧</div>
        )}
        
        {/* Subtle Hover Effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-mineral/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Favorite Button - Top Right (when no compatibility badge) */}
        {!selectedScooter && (
          <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <PartFavoriteButton partId={part.id} partName={part.name} size="sm" />
          </div>
        )}

        {/* Favorite Button - Bottom Left (alternative position) */}
        {selectedScooter && (
          <div className="absolute bottom-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <PartFavoriteButton partId={part.id} partName={part.name} size="sm" />
          </div>
        )}

        {/* Rupture : tag sobre posé en BAS de la photo voilée (évite la pastille catégorie en haut-gauche) */}
        {isOutOfStock && (
          <div className="absolute bottom-3 left-0 right-0 z-[2] flex justify-center pointer-events-none">
            <span className="rounded bg-white/75 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#1A1A1A]/80">
              Rupture de stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative space-y-2">
        {/* Titre (l'eyebrow catégorie est désormais une pastille glass sur l'image — Diff 1) */}
        <h4
          className="text-[13px] lg:text-[14px] leading-tight line-clamp-2 mb-1.5 transition-colors"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            color: "#1A1A1A",
            minHeight: "2.2em",
          }}
        >
          {part.name}
        </h4>

        {/* Ligne prix + stock — prix Bebas split à GAUCHE, indicateur stock discret à DROITE */}
        {priceParts && (
          <div className="flex items-baseline justify-between gap-2">
            <motion.div
              whileHover={{ scale: 1.04 }}
              transition={{ duration: 0.2 }}
              className="inline-flex items-baseline"
              style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#1A1A1A", lineHeight: 0.9 }}
            >
              <span style={{ fontSize: 36, letterSpacing: "0.01em" }}>{priceParts.int}</span>
              <span style={{ fontSize: 20 }}>,{priceParts.dec}</span>
              <span style={{ fontSize: 18, marginLeft: 3 }}>€</span>
            </motion.div>

            {/* Stock discret : point coloré + texte court. Rupture (0) → rien ici (géré au Diff 6). */}
            {part.stock_quantity !== null && part.stock_quantity > 0 && (
              <span
                className="inline-flex items-center gap-1.5 shrink-0 text-xs font-medium"
                style={{ color: part.stock_quantity <= 3 ? "#FF6600" : "#4A7C59" }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: part.stock_quantity <= 3 ? "#FF6600" : "#4A7C59" }}
                />
                {part.stock_quantity <= 3 ? `Plus que ${part.stock_quantity}` : "En stock"}
              </span>
            )}
          </div>
        )}

        {/* Ligne specs — GAUCHE : jusqu'à 3 chips attributs (Direction B). DROITE : clé difficulté.
            Sans attributs (scooter/Garage, useCompatibleParts ne sélectionne pas `attributes`,
            ou pièce non remplie) : la clé reste calée à droite via ml-auto, pas de trou béant. */}
        <div className="flex items-center gap-2 pt-3 border-t border-[#ECE7DD]">
          {part.attributes?.length ? (
            <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
              {part.attributes.slice(0, 3).map((attr, i) => (
                <span
                  key={`${attr.label}-${i}`}
                  className="inline-flex items-baseline gap-1 rounded-md border border-[#E5DFD3] px-2 py-0.5 text-[10px] leading-none whitespace-nowrap"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {attr.label && <span style={{ color: "#1A1A1A" }}>{attr.label}</span>}
                  <span style={{ color: categoryColor ?? "#1A1A1A", fontWeight: 600 }}>{attr.value}</span>
                  {attr.unit && <span style={{ color: "#1A1A1A" }}>{attr.unit}</span>}
                </span>
              ))}
            </div>
          ) : null}
          <div className="ml-auto shrink-0">
            <DifficultyKey level={part.difficulty_level} />
          </div>
        </div>

        {/* CTA — rupture : bouton SECONDAIRE "Me prévenir du retour" (l'orange est réservé à l'achat).
            Purement visuel pour l'instant ; la capture email sera câblée en SB4. */}
        {isOutOfStock ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // TODO [SB4] : ouvrir la capture email "alerte retour stock". Aucun effet data ici.
              console.log("[PartCard] Me prévenir du retour (placeholder SB4)", part.id);
            }}
            className="mt-3 min-h-[44px] w-full flex items-center justify-center gap-2 rounded-xl bg-[#4A7C59]/10 hover:bg-[#4A7C59]/15 text-[#4A7C59] border border-[#4A7C59]/30 font-bold text-sm transition-all duration-200 active:scale-[0.97]"
          >
            <Bell className="w-4 h-4" />
            <span>Me prévenir du retour</span>
          </button>
        ) : (
          /* Quick-Add Button - ATELIER orange, toujours visible (canon RelatedProducts) */
          <button
            onClick={handleQuickAdd}
            disabled={part.price === null}
            className="mt-3 min-h-[44px] w-full flex items-center justify-center gap-2 rounded-xl bg-[#FF6600] hover:bg-[#E55C00] text-white font-bold text-sm transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{part.price === null ? "Indisponible" : "Ajouter"}</span>
          </button>
        )}
      </div>

      {/* Subtle Corner Accent */}
      <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden rounded-tr-xl pointer-events-none">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-mineral/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </motion.div>
  );

  // Wrap with Link if slug is available
  if (part.slug) {
    return (
      <Link to={`/piece/${part.slug}`} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
  }
);

export default PartCard;
