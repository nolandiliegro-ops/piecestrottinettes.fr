/**
 * Cartes trottinette de /trottinettes en DA Atelier (18/10/2026, retour Nolan : « on reconnaît pas les marques,
 * pas le nombre de pièces, je veux que ce soit beau à naviguer dans les 430 modèles »).
 * 5 propositions derrière ?cartes=1..5 ; sans paramètre la carte actuelle reste (en attendant son choix).
 * Communs : vrai logo de la marque, nombre de pièces compatibles, la trott sort de sa plaque (comme l'accueil),
 * coin coupé, aplats francs, texte ≥ 14 px, carte entière cliquable (≥ 44 px).
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { getPrimaryImage } from "@/lib/entityImage";
import { optimizedImage } from "@/lib/imageTransform";

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const SOFT = "#8FBF9C";
const PAPER = "#FAFAF8";
const LINE = "#E2DCD0";
const cut = (px: number) => `polygon(0 0, calc(100% - ${px}px) 0, 100% ${px}px, 100% 100%, 0 100%)`;

export type CarteLook = 1 | 2 | 3 | 4 | 5;
/** 18/10 soir : « Fiche technique » (4) choisie par Nolan = défaut ; ?cartes=0 = ancienne carte, 1..5 = propositions. */
export const readCartesLook = (p: URLSearchParams): CarteLook | null => {
  if (p.get("cartes") === null) return 4;
  const n = Number(p.get("cartes"));
  return n >= 1 && n <= 5 ? (n as CarteLook) : null;
};

export interface AtelierScooter {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  images?: unknown;
  compatible_parts_count: number | null;
  voltage?: number | null;
  power_watts?: number | null;
  wheel_inches?: number | null;
  brand?: { id: string; name: string; slug: string; logo_url?: string | null; signature_color?: string | null } | null;
}

/** Nom du modèle sans la marque devant (« Xiaomi Mi 3 » → « Mi 3 »), la marque est déjà portée par le logo. */
const modelName = (s: AtelierScooter) => {
  const b = s.brand?.name ?? "";
  return b && s.name.toLowerCase().startsWith(b.toLowerCase() + " ") ? s.name.slice(b.length + 1) : s.name;
};

/** Logo de la marque. Si le logo n'est qu'un symbole (carré, ex. le « A » d'Apollo), on écrit le nom à côté :
 *  la marque doit se lire sans la connaître. */
const Logo = ({ s, dark }: { s: AtelierScooter; dark?: boolean }) => {
  const [symbol, setSymbol] = useState(false);
  const name = <span className="text-sm font-extrabold uppercase tracking-wide truncate" style={{ fontFamily: FONT, color: dark ? "#FFFFFF" : CARBON }}>{s.brand?.name}</span>;
  if (!s.brand?.logo_url) return name;
  return (
    <span className="inline-flex items-center gap-1.5 min-w-0 max-w-full">
      <span className="inline-flex items-center h-7 px-2 shrink-0 max-w-[110px]" style={{ background: "#FFFFFF", clipPath: cut(6), boxShadow: dark ? undefined : `inset 0 0 0 1px ${LINE}` }}>
        <img src={s.brand.logo_url} alt={s.brand.name} loading="lazy" className="max-h-[18px] max-w-full object-contain"
          onLoad={(e) => { const i = e.currentTarget; if (i.naturalWidth && i.naturalWidth / i.naturalHeight < 2.2) setSymbol(true); }} />
      </span>
      {symbol && name}
    </span>
  );
};

const Count = ({ n, tone }: { n: number; tone: "light" | "dark" | "green" }) => {
  const c = tone === "light" ? GREEN : tone === "dark" ? SOFT : "#FFFFFF";
  return n > 0 ? (
    <span className="text-sm font-bold" style={{ fontFamily: FONT, color: c }}>
      <b style={{ fontFamily: UNB, fontStyle: "italic", fontWeight: 900 }}>{n}</b> pièce{n > 1 ? "s" : ""} compatible{n > 1 ? "s" : ""}
    </span>
  ) : (
    <span className="text-sm font-semibold" style={{ fontFamily: FONT, color: tone === "light" ? "#6B7280" : "rgba(255,255,255,0.7)" }}>Fiche + pièces →</span>
  );
};

const Img = ({ s, eager, className }: { s: AtelierScooter; eager: boolean; className: string }) => {
  const src = getPrimaryImage(s.images, s.image_url, "");
  return src ? (
    <img src={optimizedImage(src, 700)} alt={s.name} loading={eager ? "eager" : "lazy"} decoding="async" className={className} style={{ filter: "drop-shadow(0 10px 12px rgba(0,0,0,0.18))" }} />
  ) : (
    <span className={`${className} flex items-center justify-center text-5xl opacity-20`}>🛴</span>
  );
};

const Name = ({ s, color = CARBON, size = "text-[15px]" }: { s: AtelierScooter; color?: string; size?: string }) => (
  <h3 className={`${size} uppercase leading-[1.1] line-clamp-2`} style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.02em", color }}>{modelName(s)}</h3>
);

const spec = (s: AtelierScooter) => [s.voltage ? `${s.voltage} V` : null, s.power_watts ? `${s.power_watts} W` : null, s.wheel_inches ? `${s.wheel_inches}"` : null].filter(Boolean).join(" · ");

export const ScooterCardAtelier = ({ s, look, index }: { s: AtelierScooter; look: CarteLook; index: number }) => {
  const n = s.compatible_parts_count ?? 0;
  const eager = index < 6;
  const to = `/scooter/${s.slug}`;

  // 5 — LIGNE : une carte large par ligne sur téléphone (photo à gauche qui déborde, infos à droite) ; dense pour 437 modèles.
  if (look === 5) {
    return (
      <Link to={to} className="group relative flex items-center gap-3 min-h-[112px] pl-2 pr-4 mt-3 bg-white" style={{ clipPath: cut(12), boxShadow: `inset 0 0 0 1px ${LINE}, inset 4px 0 0 ${s.brand?.signature_color || CARBON}` }}>
        <span className="relative shrink-0 w-[128px] h-[112px]">
          <Img s={s} eager={eager} className="absolute left-0 -top-3 w-[128px] h-[124px] object-contain transition-transform group-hover:-translate-y-1" />
        </span>
        <span className="min-w-0 flex-1 py-3 flex flex-col gap-1.5">
          <Logo s={s} />
          <Name s={s} />
          <Count n={n} tone="light" />
        </span>
        <span aria-hidden className="text-xl" style={{ color: CARBON }}>→</span>
      </Link>
    );
  }

  const tone = look === 2 ? "dark" : "light";
  const plateBg = look === 2 ? CARBON : look === 4 ? "#FFFFFF" : PAPER;
  const band = look === 3 ? s.brand?.signature_color || "#E9E4DA" : null;

  return (
    <Link to={to} className="group block relative pt-12 md:pt-16">
      {/* La trott sort de sa plaque — 24/10 (Nolan : « plus grosses, plus imposantes ») : photo agrandie, 3 colonnes sur ordinateur. */}
      <Img s={s} eager={eager} className={`absolute z-10 left-1/2 -translate-x-1/2 top-0 object-contain transition-transform duration-300 group-hover:-translate-y-1.5 ${look === 4 ? "w-[112%] h-[190px] md:h-[260px] lg:h-[320px]" : "w-[96%] h-[160px] md:h-[190px]"}`} />
      <div className="relative" style={{ background: plateBg, clipPath: cut(16), boxShadow: look === 2 ? undefined : `inset 0 0 0 1px ${LINE}` }}>
        {band && <div className="absolute inset-x-0 top-0 h-[96px] md:h-[116px]" style={{ background: band }} />}
        {look === 2 && <div className="absolute inset-x-0 top-0 h-[110px]" style={{ background: "radial-gradient(60% 70% at 50% 40%, rgba(255,255,255,0.16), transparent 70%)" }} />}
        <div className={`relative px-3 pb-3 flex flex-col gap-1.5 ${look === 4 ? "pt-[146px] md:pt-[206px] lg:pt-[262px]" : "pt-[118px] md:pt-[148px]"}`}>
          <div className="flex items-center justify-between gap-2"><Logo s={s} dark={look === 2} /></div>
          <Name s={s} color={look === 2 ? "#FFFFFF" : CARBON} />
          {look === 4 && spec(s) && <p className="text-sm" style={{ fontFamily: FONT, color: "#6B7280" }}>{spec(s)}</p>}
          {look === 4 ? (
            <div className="mt-1 flex items-end justify-between" style={{ borderTop: `1px solid ${LINE}`, paddingTop: 8 }}>
              <span className="leading-none" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", fontSize: 26, color: n ? GREEN : "#9CA3AF" }}>{n || "—"}</span>
              <span className="text-sm font-bold uppercase" style={{ fontFamily: FONT, color: CARBON }}>pièces →</span>
            </div>
          ) : (
            <Count n={n} tone={tone} />
          )}
        </div>
      </div>
    </Link>
  );
};

/** Grille adaptée : 2 colonnes (1 en « Ligne ») sur téléphone, plus d'air vertical pour laisser sortir les trotts. */
export const cartesGridClass = (look: CarteLook) =>
  look === 5 ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2" : look === 4 ? "grid grid-cols-2 lg:grid-cols-3 gap-x-3 md:gap-x-6 gap-y-6 md:gap-y-10" : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 md:gap-x-5 gap-y-4 md:gap-y-6";

export default ScooterCardAtelier;
