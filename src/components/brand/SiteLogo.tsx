/**
 * Logo du site — propositions du 18/10/2026 derrière ?logo=1..5. Sans paramètre : le PNG actuel, inchangé.
 * Actuel (brand_assets.logo_main_light) : « piecestrottinettes » au marqueur + trait pinceau orange brûlé et point.
 * Défauts mesurés : l'écriture n'occupe qu'environ 30 % de la hauteur du PNG (≈ 116 × 41 px affichés sur ordinateur,
 * encore moins sur téléphone), écriture fine et serrée qui ne tient pas face aux titres Unbounded 900 du site,
 * même PNG de 600 Ko servi en favicon (illisible à 32 px), aucun symbole.
 * Les 5 gardent l'ADN de l'actuel (minuscules manuscrites et/ou le trait + point) ; 2 à 5 sont codés (nets à toutes
 * tailles, 0 Ko d'image) ; vert du site pour le trait (l'orange reste réservé à l'achat), sauf la 1 qui reste à l'identique.
 */
import { useEffect } from "react";
import { useBrandAsset } from "@/hooks/useBrandAssets";

export type LogoVariant = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;

export const LOGO_NAMES: Record<LogoVariant, string> = {
  1: "Actuel repassé",
  2: "Signature",
  3: "Plaque",
  4: "Écrou",
  5: "Roue",
  // 2e tour (18/10, retour Nolan sur « Signature ») : même composition, plus de vert, nom déclinable.
  6: "Orange brûlé",
  7: "Carbone",
  8: "Étiquette",
  9: "Empilé",
  10: "Encre orange",
  // 3e tour (18/10, Nolan préfère la 10, veut le VRAI orange de son logo) : composition 10, l'orange varie.
  11: "Orange du logo",
  12: "Rouille",
  13: "Brique",
  14: "Mandarine",
  15: "Geste orange",
  // Choix de Nolan (18/10, 5e tour Higgsfield, déclinaison n°2) : marqueur noir + trait orange, .fr orange au bout.
  16: "Marqueur 2026",
};

/** Sans paramètre → 16 (logo en prod) ; ?logo=1..15 → anciennes propositions ; ?logo=0 → ancien PNG. */
export const readLogoVariant = (): LogoVariant | null => {
  try {
    const raw = new URLSearchParams(window.location.search).get("logo");
    // Go de Nolan du 18/10 : le « Marqueur 2026 » (16) est le logo par défaut ; ?logo=0 = ancien PNG.
    if (raw === null) return 16;
    const n = Number(raw);
    return n >= 1 && n <= 16 ? (n as LogoVariant) : n === 0 ? null : 16;
  } catch {
    return 16;
  }
};

const UNB = "'Unbounded', sans-serif";
const BRUSH = "'Caveat Brush', 'Permanent Marker', cursive";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const SOFT_GREEN = "#8FBF9C";
const BURNT = "#C95F2B"; // orange brûlé de la marque (≠ orange achat #FF6600)
const cut = (px: number) => `polygon(0 0, calc(100% - ${px}px) 0, 100% ${px}px, 100% 100%, 0 100%)`;

/** Le geste de l'actuel : un point puis un trait qui s'effile en montant. */
const Swoosh = ({ color = GREEN, className = "", h = 8 }: { color?: string; className?: string; h?: number }) => (
  <span aria-hidden className={`flex items-end ${className}`} style={{ height: h }}>
    <span className="shrink-0 rounded-full" style={{ width: h, height: h, background: color }} />
    <svg viewBox="0 0 120 10" preserveAspectRatio="none" className="flex-1 ml-[3px]" style={{ height: h * 0.9, display: "block" }}>
      <path d="M0,6.5 C40,6 80,3.6 120,0 C82,6.6 42,9.4 0,10 Z" fill={color} />
    </svg>
  </span>
);

/* 1 — Actuel repassé : le même fichier, simplement recadré sur l'écriture (le PNG est vide à ~70 %) et agrandi ×1,5. */
const Actuel = () => {
  const logo = useBrandAsset("logo_main_light");
  return (
    <span className="relative block overflow-hidden h-[56px] w-[162px] lg:h-[68px] lg:w-[196px]">
      <img
        src={logo.url}
        alt={logo.alt || "piecestrottinettes.fr"}
        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-[calc(50%+9px)] lg:top-[calc(50%+11px)] h-[180px] lg:h-[220px] w-auto max-w-none"
      />
    </span>
  );
};

/* 2 — Signature : « pièces » en capitales Unbounded, « trottinettes » au pinceau, le trait + point en vert. */
const Signature = () => (
  <span className="inline-flex flex-col leading-none">
    <span className="flex items-end gap-1.5">
      <span className="text-[12px] xl:text-[15px] font-black italic tracking-[0.02em] pb-[4px]" style={{ fontFamily: UNB, color: CARBON }}>PIÈCES</span>
      <span className="text-[29px] xl:text-[40px] leading-[0.8] -rotate-2 origin-bottom-left" style={{ fontFamily: BRUSH, color: CARBON }}>trottinettes</span>
      <span className="text-[11px] xl:text-[12px] font-bold italic pb-[4px]" style={{ fontFamily: UNB, color: GREEN }}>.fr</span>
    </span>
    <Swoosh className="-mt-0.5 ml-1 w-[92%]" h={9} />
  </span>
);

/* 3 — Plaque : le nom sur une plaque carbone à coin coupé (comme les blocs du site), le trait + point dessous. */
const Plaque = () => (
  <span className="relative inline-flex flex-col justify-center pl-2.5 pr-5 pt-1.5 pb-1 xl:pl-4 xl:pr-8 xl:pt-2 leading-none" style={{ background: CARBON, clipPath: cut(14), fontFamily: UNB, fontStyle: "italic" }}>
    <span className="text-[15px] xl:text-[19px] font-black tracking-[-0.02em] text-white">PIÈCES</span>
    <span className="text-[15px] xl:text-[19px] font-black tracking-[-0.02em] mt-0.5" style={{ color: SOFT_GREEN }}>
      TROTTINETTES<span className="text-[10px] xl:text-[11px] font-bold text-white/70 ml-0.5">.FR</span>
    </span>
    <Swoosh color={SOFT_GREEN} className="mt-1 w-[85%]" h={6} />
  </span>
);

/* 4 — Écrou : un symbole (écrou vert, « pt » au pinceau) + le nom sur deux lignes. Le symbole seul = favicon / avatar. */
export const NutMark = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
    <polygon points="20,1.5 36.5,11 36.5,29 20,38.5 3.5,29 3.5,11" fill={GREEN} />
    <polygon points="20,6 32.6,13.3 32.6,26.7 20,34 7.4,26.7 7.4,13.3" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.2" />
    <text x="19.5" y="26.5" textAnchor="middle" fontFamily="'Caveat Brush', cursive" fontSize="21" fill="#fff">pt</text>
  </svg>
);
const Ecrou = () => (
  <span className="inline-flex items-center gap-2 xl:gap-2.5">
    <span className="xl:hidden"><NutMark size={38} /></span>
    <span className="hidden xl:inline"><NutMark size={46} /></span>
    <span className="flex flex-col leading-none" style={{ fontFamily: UNB, fontStyle: "italic" }}>
      <span className="text-[14px] xl:text-[18px] font-black tracking-[-0.02em]" style={{ color: CARBON }}>PIÈCES</span>
      <span className="text-[14px] xl:text-[18px] font-black tracking-[-0.02em] mt-0.5" style={{ color: CARBON }}>
        TROTTINETTES<span className="text-[10px] xl:text-[11px] font-bold ml-0.5" style={{ color: GREEN }}>.FR</span>
      </span>
      <Swoosh className="mt-1 w-[80%]" h={6} />
    </span>
  </span>
);

/* 5 — Roue : minuscules comme l'actuel, le « o » de trottinettes devient une roue, le trait + point dessous. */
const Wheel = ({ px }: { px: number }) => (
  <svg width={px} height={px} viewBox="0 0 20 20" aria-hidden className="inline-block align-baseline" style={{ marginBottom: -1 }}>
    <circle cx="10" cy="10" r="8.6" fill="none" stroke={CARBON} strokeWidth="2.8" strokeDasharray="2.4 1.1" />
    <circle cx="10" cy="10" r="5.4" fill="none" stroke={GREEN} strokeWidth="1.6" />
    <g stroke={GREEN} strokeWidth="1.2">
      <line x1="10" y1="5" x2="10" y2="15" /><line x1="5.7" y1="7.5" x2="14.3" y2="12.5" /><line x1="5.7" y1="12.5" x2="14.3" y2="7.5" />
    </g>
    <circle cx="10" cy="10" r="1.7" fill={CARBON} />
  </svg>
);
const Roue = () => (
  <span className="inline-flex flex-col leading-none" style={{ fontFamily: UNB }}>
    <span className="flex flex-col xl:flex-row xl:items-baseline">
      <span className="text-[22px] lg:text-[23px] xl:text-[25px] font-extrabold tracking-[-0.04em]" style={{ color: CARBON }}>pièces</span>
      <span className="text-[22px] lg:text-[23px] xl:text-[25px] font-extrabold tracking-[-0.04em] -mt-px xl:mt-0" style={{ color: CARBON }}>
        tr<span className="lg:hidden"><Wheel px={16} /></span><span className="hidden lg:inline"><Wheel px={18} /></span>ttinettes
        <span className="text-[10px] lg:text-[12px] font-bold ml-0.5" style={{ color: GREEN }}>.fr</span>
      </span>
    </span>
    <Swoosh className="mt-0.5 w-[88%]" h={7} />
  </span>
);


/* ---------- 2e tour : « Signature » sans vert, pensé pour se décliner (pièces vélo, pièces scooter…) ---------- */
/** ?mot=velo|scooter|trottinettes : aperçu de la déclinaison sur la vraie page. */
const readWord = () => {
  try {
    const m = new URLSearchParams(window.location.search).get("mot");
    return m === "velo" ? "vélo" : m === "scooter" ? "scooter" : "trottinettes";
  } catch {
    return "trottinettes";
  }
};
const Pieces = ({ className = "", color = CARBON }: { className?: string; color?: string }) => (
  <span className={`font-black italic tracking-[0.02em] ${className}`} style={{ fontFamily: UNB, color }}>PIÈCES</span>
);
const Word = ({ w, className = "", color = CARBON }: { w: string; className?: string; color?: string }) => (
  <span className={`leading-[0.8] -rotate-2 origin-bottom-left ${className}`} style={{ fontFamily: BRUSH, color }}>{w}</span>
);
const Dot = ({ className = "", color = CARBON }: { className?: string; color?: string }) => (
  <span className={`font-bold italic ${className}`} style={{ fontFamily: UNB, color }}>.fr</span>
);

/* 6 — Orange brûlé : la Signature telle que tu l'as aimée, le vert remplacé par l'orange brûlé de l'actuel. */
const SigOrange = () => {
  const w = readWord();
  return (
    <span className="inline-flex flex-col leading-none">
      <span className="flex items-end gap-1.5">
        <Pieces className="text-[12px] xl:text-[15px] pb-[4px]" />
        <Word w={w} className="text-[29px] xl:text-[40px]" />
        <Dot className="text-[11px] xl:text-[12px] pb-[4px]" color={BURNT} />
      </span>
      <Swoosh color={BURNT} className="-mt-0.5 ml-1 w-[92%]" h={9} />
    </span>
  );
};

/* 7 — Carbone : tout noir, zéro couleur ; le site garde son vert, le logo devient neutre et passe partout. */
const SigCarbone = () => {
  const w = readWord();
  return (
    <span className="inline-flex flex-col leading-none">
      <span className="flex items-end gap-1.5">
        <Pieces className="text-[12px] xl:text-[15px] pb-[4px]" />
        <Word w={w} className="text-[29px] xl:text-[40px]" />
        <Dot className="text-[11px] xl:text-[12px] pb-[4px]" color="#6B7280" />
      </span>
      <Swoosh color={CARBON} className="-mt-0.5 ml-1 w-[92%]" h={9} />
    </span>
  );
};

/* 8 — Étiquette : « PIÈCES » sur une petite étiquette carbone à coin coupé (fixe), le mot au pinceau change. */
const SigEtiquette = () => {
  const w = readWord();
  return (
    <span className="inline-flex flex-col leading-none">
      <span className="flex items-end gap-1.5">
        <span className="inline-flex items-center px-1.5 py-[3px] mb-[3px]" style={{ background: CARBON, clipPath: cut(6) }}>
          <Pieces className="text-[11px] xl:text-[13px]" color="#fff" />
        </span>
        <Word w={w} className="text-[26px] xl:text-[40px]" />
        <Dot className="text-[11px] xl:text-[12px] pb-[4px]" color={BURNT} />
      </span>
      <Swoosh color={BURNT} className="mt-0.5 ml-[54px] xl:ml-[62px] w-[70%]" h={8} />
    </span>
  );
};

/* 9 — Empilé : « PIÈCES » au-dessus, le mot au pinceau dessous, en grand : la forme la plus haute pour un téléphone. */
const SigEmpile = () => {
  const w = readWord();
  return (
    <span className="inline-flex flex-col leading-none">
      <Pieces className="text-[11px] xl:text-[13px] tracking-[0.18em] ml-0.5" />
      <span className="flex items-end gap-1 -mt-0.5">
        <Word w={w} className="text-[34px] xl:text-[44px]" />
        <Dot className="text-[11px] xl:text-[12px] pb-[3px]" color={BURNT} />
      </span>
      <Swoosh color={BURNT} className="mt-0.5 w-[80%]" h={8} />
    </span>
  );
};

/* 10 — Encre orange : le mot au pinceau en orange brûlé, « PIÈCES » et le trait en noir. */
const SigEncre = () => {
  const w = readWord();
  return (
    <span className="inline-flex flex-col leading-none">
      <span className="flex items-end gap-1.5">
        <Pieces className="text-[12px] xl:text-[15px] pb-[4px]" />
        <Word w={w} className="text-[29px] xl:text-[40px]" color={BURNT} />
        <Dot className="text-[11px] xl:text-[12px] pb-[4px]" />
      </span>
      <Swoosh color={CARBON} className="-mt-0.5 ml-1 w-[92%]" h={9} />
    </span>
  );
};

/* ---------- 3e tour : la 10 (le mot au pinceau en orange), seul l'orange change ---------- */
// Orange mesuré sur le logo en ligne (pixels du trait, capture Lovable sous voile noir 80 % → ×5) : ≈ #BC5D30.
const LOGO_ORANGE = "#BC5D30";
const Encre = ({ ink, trait = CARBON, dot = CARBON }: { ink: string; trait?: string; dot?: string }) => {
  const w = readWord();
  return (
    <span className="inline-flex flex-col leading-none">
      <span className="flex items-end gap-1.5">
        <Pieces className="text-[12px] xl:text-[15px] pb-[4px]" />
        <Word w={w} className="text-[29px] xl:text-[40px]" color={ink} />
        <Dot className="text-[11px] xl:text-[12px] pb-[4px]" color={dot} />
      </span>
      <Swoosh color={trait} className="-mt-0.5 ml-1 w-[92%]" h={9} />
    </span>
  );
};
/* 11 — Orange du logo : la 10, avec l'orange mesuré sur ton logo actuel. */
const E11 = () => <Encre ink={LOGO_ORANGE} />;
/* 12 — Rouille : plus sombre, plus « atelier ». */
const E12 = () => <Encre ink="#A3461F" />;
/* 13 — Brique : tire vers le rouge. */
const E13 = () => <Encre ink="#B23A26" />;
/* 14 — Mandarine : plus vif, sans rejoindre l'orange des boutons d'achat (#FF6600). */
const E14 = () => <Encre ink="#DD6420" />;
/* 15 — Geste orange : orange du logo sur le mot ET le trait, « PIÈCES » seul en noir. */
const E15 = () => <Encre ink={LOGO_ORANGE} trait={LOGO_ORANGE} dot={LOGO_ORANGE} />;

/* 16 — Marqueur 2026 : le logo choisi, en vectoriel (net à toutes les tailles, 19/10). */
export const LOGO_2026_SRC = "/brand/logo-pt-2026.svg";
const Marqueur2026 = () => (
  <img src={LOGO_2026_SRC} alt="piecestrottinettes.fr" width={937} height={268} className="block h-[46px] lg:h-[54px] w-auto" />
);

/** Police pinceau chargée seulement quand une proposition est affichée (rien ne change pour les autres visiteurs). */
const useBrushFont = () => {
  useEffect(() => {
    const id = "pt-logo-brush-font";
    if (document.getElementById(id)) return;
    const l = document.createElement("link");
    l.id = id;
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Caveat+Brush&display=swap";
    document.head.appendChild(l);
  }, []);
};

export const SiteLogo = ({ variant }: { variant: LogoVariant }) => {
  useBrushFont();
  const C = { 1: Actuel, 2: Signature, 3: Plaque, 4: Ecrou, 5: Roue, 6: SigOrange, 7: SigCarbone, 8: SigEtiquette, 9: SigEmpile, 10: SigEncre, 11: E11, 12: E12, 13: E13, 14: E14, 15: E15, 16: Marqueur2026 }[variant];
  return <C />;
};
