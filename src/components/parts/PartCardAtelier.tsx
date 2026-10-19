/**
 * 19/10/2026 — Cartes produits du catalogue en DA Atelier (skill « cinq propositions rendues »).
 * Retour Nolan sur /catalogue : « les cartes des produits ne respectent pas la nouvelle DA ».
 * Défaut commun corrigé dans les 5 : ancien PartCard = coins ronds, Inter + Bebas, textes de 9 à 13 px,
 * pastilles « verre », zoom framer sur toute la carte. Ici : coins coupés, Plus Jakarta + Unbounded italique,
 * rien sous 14 px, orange réservé au bouton d'achat, aucun bloc noir.
 *
 * Activées par ?carte=1..5 (sans paramètre : carte actuelle inchangée).
 * 1 ÇA DÉPASSE  · la carte de l'accueil à l'identique (la pièce sort du haut de la plaque, halo vert au survol)
 * 2 ÉTABLI      · plaque blanche, photo sur fond pierre, une ligne de caractéristiques, prix + panier carré
 * 3 ÉTIQUETTE   · sans cadre, photo sur pierre, prix sur étiquette pierre à filet vert
 * 4 FICHE       · carte horizontale (photo à gauche), une colonne sur téléphone : plus d'infos lisibles
 * 5 VITRINE     · photo plein cadre sur pierre, bandeau blanc en bas, panier orange accroché au coin
 */
import { Link } from "react-router-dom";
import { MouseEvent } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { getPrimaryImage } from "@/lib/entityImage";
import { optimizedImage } from "@/lib/imageTransform";
import { useSelectedCompatIds } from "@/hooks/useSelectedCompatIds";
import { useSelectedScooter } from "@/contexts/ScooterContext";
import { SHOP_OPEN, openPrelaunch } from "@/config/launch";
import type { CompatiblePart } from "@/hooks/useScooterData";
import type { FitmentPosition } from "@/lib/compatibilityStatus";
import PartFavoriteButton from "./PartFavoriteButton";
import StockAlertInline from "./StockAlertInline";

export type CarteLook = 1 | 2 | 3 | 4 | 5;

/** Lecture du paramètre ?carte (null = carte actuelle). Figé au chargement, comme ?pcarte sur l'accueil. */
export const CARTE: CarteLook | null = (() => {
  try {
    const raw = new URLSearchParams(window.location.search).get("carte");
    if (raw === null) return null;
    const n = Number(raw);
    return n >= 1 && n <= 5 ? (n as CarteLook) : null;
  } catch { return null; }
})();

/** La vue 4 (horizontale) demande une colonne sur téléphone. */
export const carteGridClass = (fallback: string) =>
  CARTE === 4 ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5" : CARTE === 1 ? fallback.replace(/gap-5 md:gap-7/, "gap-x-4 gap-y-6 md:gap-x-6 md:gap-y-8") : fallback;

const FONT = "'Plus Jakarta Sans', sans-serif";
const UNB = "'Unbounded', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const ORANGE = "#FF6600";
const STONE = "#F2EFE8";
const LINE = "#E2DCD0";
const CUT = (px: number) => `polygon(0 0, calc(100% - ${px}px) 0, 100% ${px}px, 100% 100%, 0 100%)`;
const BOOST: Record<string, number> = { plaquettes: 1.2, "disques-plaquettes": 1.15, disques: 1.15, chargeurs: 1.1, "chambres-a-air": 1.05 };
const POS: Partial<Record<FitmentPosition, string>> = { avant: "Avant", arriere: "Arrière" };

interface Props {
  part: CompatiblePart & { slug?: string; is_featured?: boolean };
  look: CarteLook;
  position?: FitmentPosition | null;
  hideCompat?: boolean;
  className?: string;
}

const PartCardAtelier = ({ part, look, position, hideCompat = false, className }: Props) => {
  const { addItem, setIsOpen } = useCart();
  const img = getPrimaryImage(part.images, part.image_url, "");
  const display = optimizedImage(img, 400);
  const isOut = part.stock_quantity !== null && part.stock_quantity === 0;
  const low = part.stock_quantity !== null && part.stock_quantity > 0 && part.stock_quantity <= 3;
  const catSlug = part.category?.slug ?? "";
  const catName = part.category?.name ?? "";
  const { selectedScooter, selectedBrandColors } = useSelectedScooter();
  const compatIds = useSelectedCompatIds();
  const showCompat = !hideCompat && !!selectedScooter && !!compatIds?.has(part.id);
  const brand = (selectedScooter?.brandName ?? "").trim();
  const sName = selectedScooter?.name ?? "";
  const model = brand && sName.toLowerCase().startsWith(brand.toLowerCase() + " ") ? sName.slice(brand.length + 1) : sName;
  const specs = (part.attributes ?? []).slice(0, 2).map((a) => `${a.value}${a.unit ?? ""}`).filter(Boolean).join(" · ");
  // Virgule française (formatPrice global sort « 11.90 € »).
  const price = part.price != null ? `${part.price.toFixed(2).replace(".", ",")}\u00A0€` : "—";

  const add = (e: MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!SHOP_OPEN) { openPrelaunch(); return; }
    if (isOut || part.price === null) return;
    addItem({ id: part.id, name: part.name, price: part.price, image_url: img || part.image_url, stock_quantity: part.stock_quantity || 0 });
    toast.success(`${part.name} ajouté au panier`, { action: { label: "Voir", onClick: () => setIsOpen(true) } });
  };

  // ── Éléments communs ──
  const stretched = part.slug ? (
    <Link to={`/piece/${part.slug}`} aria-label={part.name} className="absolute inset-0 z-[5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A7C59]" />
  ) : null;
  const eyebrow = (catName || (position && POS[position])) ? (
    <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide truncate" style={{ fontFamily: FONT, color: GREEN }}>
      {position && POS[position] && <span className="px-1.5 leading-6 text-white shrink-0" style={{ background: CARBON, clipPath: CUT(5) }}>{POS[position]}</span>}
      <span className="truncate">{catName}</span>
    </p>
  ) : null;
  const name = (
    <h4 className="text-[15px] font-extrabold leading-snug line-clamp-2" style={{ fontFamily: FONT, letterSpacing: "-0.01em", color: CARBON, minHeight: "2.6em" }}>{part.name}</h4>
  );
  const priceEl = (size = 24) => (
    <span className="leading-none whitespace-nowrap" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", fontSize: size, color: CARBON }}>{price}</span>
  );
  const stock = isOut ? null : (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap" style={{ fontFamily: FONT, color: low ? ORANGE : GREEN }}>
      <span className="w-2 h-2" style={{ background: low ? ORANGE : GREEN, clipPath: CUT(2) }} />
      {low ? `Plus que ${part.stock_quantity}` : "En stock"}
    </span>
  );
  const compat = showCompat ? (
    <span title={`Compatible avec ta ${sName}`} className="inline-flex items-center gap-1 max-w-full min-w-0 pl-1.5 pr-2 leading-7 text-sm font-bold text-white"
      style={{ background: selectedBrandColors.accent, clipPath: CUT(6), fontFamily: FONT }}>
      <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={3} /><span className="truncate">{model}</span>
    </span>
  ) : null;
  const fav = (
    <span className="absolute z-10 top-2 right-2"><PartFavoriteButton partId={part.id} partName={part.name} size="sm" /></span>
  );
  const wideBtn = isOut ? <div className="relative z-10 mt-3"><StockAlertInline part={part} /></div> : (
    <button type="button" onClick={add} disabled={part.price === null}
      className="relative z-10 mt-3 w-full min-h-[44px] inline-flex items-center justify-center gap-2 text-sm font-extrabold uppercase tracking-wide text-white disabled:opacity-40 transition-colors hover:brightness-95"
      style={{ background: ORANGE, clipPath: CUT(8), fontFamily: FONT }}>
      <ShoppingCart size={16} strokeWidth={2.4} /> Ajouter
    </button>
  );
  const squareBtn = isOut ? null : (
    <button type="button" onClick={add} disabled={part.price === null} aria-label={`Ajouter ${part.name} au panier`}
      className="relative z-10 shrink-0 w-12 h-12 inline-flex items-center justify-center text-white disabled:opacity-40 hover:brightness-95"
      style={{ background: ORANGE, clipPath: CUT(8) }}>
      <ShoppingCart size={19} strokeWidth={2.4} />
    </button>
  );
  const photo = (cls = "max-w-[80%] max-h-[80%]") => img ? (
    <img src={display} alt={part.name} loading="lazy" decoding="async"
      className={cn("relative object-contain transition-transform duration-300 ease-out group-hover/pa:-translate-y-1 group-hover/pa:scale-[1.04]", cls, isOut && "grayscale-[60%] opacity-70")}
      style={{ filter: "drop-shadow(0 12px 14px rgba(0,0,0,0.16))", scale: String(BOOST[catSlug] ?? 1) }} />
  ) : <span className="text-3xl opacity-30">🔧</span>;
  const outTag = isOut ? (
    <span className="absolute left-2 bottom-2 z-[2] px-2 leading-7 text-sm font-bold" style={{ background: "#fff", color: CARBON, clipPath: CUT(6), boxShadow: `inset 0 0 0 1px ${LINE}` }}>Rupture</span>
  ) : null;

  // ── 1 · ÇA DÉPASSE (accueil à l'identique) ──
  if (look === 1) {
    return (
      <div className={cn("group/pa relative pt-16 md:pt-20", className)} data-carte={1}>
        <div className="absolute inset-x-0 top-0 h-[180px] md:h-[210px] z-[2] pointer-events-none flex items-center justify-center">
          {img && <span aria-hidden className="absolute -inset-x-[4%] top-0 bottom-[-6%] opacity-0 scale-75 transition-all duration-300 group-hover/pa:opacity-100 group-hover/pa:scale-100"
            style={{ background: "radial-gradient(closest-side, rgba(143,191,156,0.85), rgba(143,191,156,0.35) 55%, transparent 100%)" }} />}
          {img ? (
            <img src={display} alt={part.name} loading="lazy" decoding="async"
              className={cn("relative h-full w-auto max-w-[94%] object-contain origin-bottom transition-transform duration-300 ease-out group-hover/pa:-translate-y-1.5 group-hover/pa:scale-[1.08] group-hover/pa:brightness-110", isOut && "grayscale-[60%] opacity-70")}
              style={{ filter: "drop-shadow(0 12px 14px rgba(0,0,0,0.16))", scale: String(BOOST[catSlug] ?? 1) }} />
          ) : <span className="text-3xl opacity-30">🔧</span>}
        </div>
        <div className="relative pt-[124px] md:pt-[140px] transition-shadow duration-300 group-hover/pa:shadow-[0_14px_30px_rgba(26,26,26,0.12)]"
          style={{ background: "#fff", boxShadow: `inset 0 0 0 1px ${LINE}`, clipPath: CUT(14) }}>
          {stretched}
          {fav}
          <div className="px-3 pb-3">
            {compat && <div className="mb-2 relative z-10">{compat}</div>}
            {eyebrow}
            <div className="mt-1">{name}</div>
            <div className="mt-1.5 flex items-end justify-between gap-2 flex-wrap">{priceEl()}{stock}</div>
            {wideBtn}
          </div>
        </div>
      </div>
    );
  }

  // ── 2 · ÉTABLI ──
  if (look === 2) {
    return (
      <div className={cn("group/pa relative flex flex-col transition-shadow duration-300 hover:shadow-[0_14px_30px_rgba(26,26,26,0.10)]", className)} data-carte={2}
        style={{ background: "#fff", boxShadow: `inset 0 0 0 1px ${LINE}`, clipPath: CUT(14) }}>
        {stretched}
        <div className="relative m-2 mb-0 aspect-[5/4] flex items-center justify-center overflow-hidden" style={{ background: STONE, clipPath: CUT(10) }}>
          {photo()}
          {outTag}
          {compat && <span className="absolute left-2 bottom-2 z-10 max-w-[85%]">{compat}</span>}
        </div>
        {fav}
        <div className="flex-1 flex flex-col px-3 pt-2.5 pb-3">
          {eyebrow}
          <div className="mt-1">{name}</div>
          {specs && <p className="mt-1 text-sm text-gray-500 truncate" style={{ fontFamily: FONT }}>{specs}</p>}
          <div className="mt-auto pt-3 flex items-end justify-between gap-2" style={{ borderTop: `1px dashed ${LINE}`, marginTop: 12 }}>
            <span className="flex flex-col gap-1 min-w-0">{priceEl(22)}{stock}</span>
            {squareBtn}
          </div>
          {isOut && <div className="relative z-10 mt-2"><StockAlertInline part={part} /></div>}
        </div>
      </div>
    );
  }

  // ── 3 · ÉTIQUETTE ──
  if (look === 3) {
    return (
      <div className={cn("group/pa relative flex flex-col", className)} data-carte={3}>
        {stretched}
        <div className="relative aspect-square flex items-center justify-center overflow-hidden transition-colors duration-300 group-hover/pa:bg-[#EAE5DA]" style={{ background: STONE, clipPath: CUT(16) }}>
          {photo("max-w-[78%] max-h-[78%]")}
          {outTag}
          {compat && <span className="absolute left-2 top-2 z-10 max-w-[80%]">{compat}</span>}
        </div>
        {fav}
        <div className="pt-3 flex-1 flex flex-col">
          {eyebrow}
          <div className="mt-1">{name}</div>
          <div className="mt-2 flex items-stretch gap-2">
            <span className="flex-1 min-w-0 flex flex-col justify-center gap-1 pl-3 pr-2 py-1.5" style={{ background: "#fff", boxShadow: `inset 3px 0 0 ${GREEN}, inset 0 0 0 1px ${LINE}`, clipPath: CUT(8) }}>
              {priceEl(20)}{stock}
            </span>
            {squareBtn}
          </div>
          {isOut && <div className="relative z-10 mt-2"><StockAlertInline part={part} /></div>}
        </div>
      </div>
    );
  }

  // ── 4 · FICHE (horizontale) ──
  if (look === 4) {
    return (
      <div className={cn("group/pa relative flex items-stretch gap-3 p-2 transition-shadow duration-300 hover:shadow-[0_14px_30px_rgba(26,26,26,0.10)]", className)} data-carte={4}
        style={{ background: "#fff", boxShadow: `inset 0 0 0 1px ${LINE}`, clipPath: CUT(14) }}>
        {stretched}
        <div className="relative w-[38%] max-w-[170px] shrink-0 aspect-square self-center flex items-center justify-center overflow-hidden" style={{ background: STONE, clipPath: CUT(10) }}>
          {photo()}
          {outTag}
        </div>
        <div className="flex-1 min-w-0 flex flex-col py-1 pr-11">
          {eyebrow}
          <div className="mt-0.5">{name}</div>
          {specs && <p className="text-sm text-gray-500 truncate" style={{ fontFamily: FONT }}>{specs}</p>}
          {compat && <div className="mt-1.5 relative z-10">{compat}</div>}
          <div className="mt-auto pt-2 flex items-end justify-between gap-2">
            <span className="flex flex-col gap-1">{priceEl(22)}{stock}</span>
          </div>
          {isOut && <div className="relative z-10 mt-2"><StockAlertInline part={part} /></div>}
        </div>
        {fav}
        {!isOut && <span className="absolute right-2 bottom-2 z-10">{squareBtn}</span>}
      </div>
    );
  }

  // ── 5 · VITRINE ──
  return (
    <div className={cn("group/pa relative flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-[0_14px_30px_rgba(26,26,26,0.12)]", className)} data-carte={5}
      style={{ background: STONE, clipPath: CUT(16) }}>
      {stretched}
      <div className="relative aspect-square flex items-center justify-center">
        {photo("max-w-[82%] max-h-[82%]")}
        {outTag}
        {catName && <span className="absolute left-2 top-2 z-[2] px-2 leading-7 text-sm font-bold uppercase tracking-wide max-w-[70%] truncate" style={{ background: "#fff", color: GREEN, clipPath: CUT(6), fontFamily: FONT }}>{catName}</span>}
        {compat && <span className="absolute left-2 bottom-2 z-10 max-w-[70%]">{compat}</span>}
      </div>
      {fav}
      <div className="relative flex-1 flex flex-col bg-white px-3 pt-2.5 pb-3" style={{ boxShadow: `inset 0 1px 0 ${LINE}` }}>
        {position && POS[position] && <div className="mb-1">{eyebrow}</div>}
        {name}
        <div className="mt-2 flex items-end justify-between gap-2 pr-12">
          <span className="flex flex-col gap-1">{priceEl(22)}{stock}</span>
        </div>
        {isOut && <div className="relative z-10 mt-2"><StockAlertInline part={part} /></div>}
        {!isOut && <span className="absolute right-0 bottom-0 z-10">{squareBtn}</span>}
      </div>
    </div>
  );
};

export default PartCardAtelier;
