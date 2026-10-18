/**
 * Logo du site — propositions du 18/10/2026 derrière ?logo=1..5. Sans paramètre : le PNG actuel, inchangé.
 * Défaut constaté sur l'actuel : PNG 669×373 dont l'écriture n'occupe que 28 % de la hauteur (le reste est du vide,
 * compensé par -my-5), lettres d'une grotesque étroite générique qui n'est plus celle du site (Unbounded italique),
 * vert sauge pâle (#94B8A2) au lieu du vert du site (#4A7C59), slogan gris ~8 px illisible sur téléphone,
 * aucun symbole (le favicon est le mot entier réduit à 32 px).
 * Commun aux 5 : logo codé (net à toutes tailles, 0 Ko d'image), Unbounded, vert #4A7C59, pas d'orange (réservé
 * à l'achat), deux lignes sur téléphone pour gagner en hauteur, une ligne dès l'ordinateur quand ça tient.
 */
export type LogoVariant = 1 | 2 | 3 | 4 | 5;

export const LOGO_NAMES: Record<LogoVariant, string> = {
  1: "Actuel repassé",
  2: "Plaque",
  3: "Écrou",
  4: "Vitesse",
  5: "Roue",
};

/** ?logo=1..5 → proposition ; sinon null (PNG actuel). */
export const readLogoVariant = (): LogoVariant | null => {
  try {
    const n = Number(new URLSearchParams(window.location.search).get("logo"));
    return n >= 1 && n <= 5 ? (n as LogoVariant) : null;
  } catch {
    return null;
  }
};

const UNB = "'Unbounded', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const SOFT_GREEN = "#8FBF9C";
const cut = (px: number) => `polygon(0 0, calc(100% - ${px}px) 0, 100% ${px}px, 100% 100%, 0 100%)`;

/* 1 — Actuel repassé : même disposition (pièces noir + trottinettes vert + .FR en exposant), en Unbounded italique, vert du site. */
const Actuel = () => (
  <span className="flex flex-col xl:flex-row xl:items-baseline leading-none" style={{ fontFamily: UNB, fontStyle: "italic" }}>
    <span className="text-[22px] lg:text-[24px] xl:text-[26px] font-extrabold tracking-[-0.03em]" style={{ color: CARBON }}>pièces</span>
    <span className="text-[22px] lg:text-[24px] xl:text-[26px] font-extrabold tracking-[-0.03em] -mt-0.5 xl:mt-0" style={{ color: GREEN }}>
      trottinettes<sup className="text-[10px] lg:text-[12px] font-bold ml-0.5 align-super" style={{ color: GREEN }}>.FR</sup>
    </span>
  </span>
);

/* 2 — Plaque : le nom sur une plaque carbone à coin coupé, comme les blocs du site. */
const Plaque = () => (
  <span className="relative inline-flex flex-col justify-center pl-2.5 pr-5 py-1.5 lg:pl-4 lg:pr-8 lg:py-2 leading-none" style={{ background: CARBON, clipPath: cut(14), fontFamily: UNB, fontStyle: "italic" }}>
    <span className="text-[15px] lg:text-[21px] font-black tracking-[-0.02em] text-white">PIÈCES</span>
    <span className="text-[15px] lg:text-[21px] font-black tracking-[-0.02em] mt-0.5" style={{ color: SOFT_GREEN }}>
      TROTTINETTES<span className="text-[10px] lg:text-[11px] font-bold text-white/70 ml-0.5">.FR</span>
    </span>
    <span aria-hidden className="absolute left-0 bottom-0 h-[3px] w-full" style={{ background: GREEN }} />
  </span>
);

/* 3 — Écrou : un symbole (écrou hexagonal vert, « pt » en creux) + le nom sur deux lignes. Le symbole seul = favicon / avatar. */
export const NutMark = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
    <polygon points="20,1.5 36.5,11 36.5,29 20,38.5 3.5,29 3.5,11" fill={GREEN} />
    <polygon points="20,6 32.6,13.3 32.6,26.7 20,34 7.4,26.7 7.4,13.3" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.2" />
    <text x="20.5" y="25.2" textAnchor="middle" fontFamily="Unbounded, sans-serif" fontStyle="italic" fontWeight={900} fontSize="14" fill="#fff" letterSpacing="-0.5">pt</text>
  </svg>
);
const Ecrou = () => (
  <span className="inline-flex items-center gap-2 lg:gap-2.5">
    <span className="lg:hidden"><NutMark size={36} /></span>
    <span className="hidden lg:inline"><NutMark size={48} /></span>
    <span className="flex flex-col leading-none" style={{ fontFamily: UNB, fontStyle: "italic" }}>
      <span className="text-[14px] lg:text-[19px] font-black tracking-[-0.02em]" style={{ color: CARBON }}>PIÈCES</span>
      <span className="text-[14px] lg:text-[19px] font-black tracking-[-0.02em] mt-0.5" style={{ color: GREEN }}>
        TROTTINETTES<span className="text-[10px] lg:text-[11px] font-bold ml-0.5" style={{ color: CARBON }}>.FR</span>
      </span>
    </span>
  </span>
);

/* 4 — Vitesse : capitales italiques, trois traits de vitesse, filet vert à bout coupé sous « trottinettes ». */
const Vitesse = () => (
  <span className="inline-flex items-center gap-1.5 lg:gap-2" style={{ fontFamily: UNB, fontStyle: "italic" }}>
    <svg width="22" height="30" viewBox="0 0 22 30" aria-hidden className="shrink-0 lg:w-[26px] lg:h-[34px]">
      <polygon points="9,4 22,4 19,9 6,9" fill={GREEN} />
      <polygon points="5,12.5 20,12.5 17,17.5 2,17.5" fill={GREEN} opacity="0.7" />
      <polygon points="3,21 14,21 11,26 0,26" fill={GREEN} opacity="0.45" />
    </svg>
    <span className="flex flex-col leading-none">
      <span className="text-[16px] lg:text-[20px] font-black tracking-[-0.03em]" style={{ color: CARBON }}>PIÈCES</span>
      <span className="relative pb-[5px] -mt-px">
        <span className="text-[16px] lg:text-[20px] font-black tracking-[-0.03em]" style={{ color: CARBON }}>TROTTINETTES</span>
        <span className="text-[10px] lg:text-[12px] font-bold ml-0.5" style={{ color: GREEN }}>.FR</span>
        <span aria-hidden className="absolute left-0 bottom-0 h-[4px] w-[78%]" style={{ background: GREEN, clipPath: "polygon(0 0, 100% 0, calc(100% - 4px) 100%, 0 100%)" }} />
      </span>
    </span>
  </span>
);

/* 5 — Roue : minuscules comme l'actuel, le « o » de trottinettes devient une roue (pneu + jante + rayons). */
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
  <span className="flex flex-col xl:flex-row xl:items-baseline leading-none" style={{ fontFamily: UNB }}>
    <span className="text-[23px] lg:text-[24px] xl:text-[26px] font-extrabold tracking-[-0.04em]" style={{ color: CARBON }}>pièces</span>
    <span className="text-[23px] lg:text-[24px] xl:text-[26px] font-extrabold tracking-[-0.04em] -mt-px xl:mt-0" style={{ color: GREEN }}>
      tr<span className="lg:hidden"><Wheel px={17} /></span><span className="hidden lg:inline"><Wheel px={19} /></span>ttinettes
      <span className="text-[10px] lg:text-[12px] font-bold ml-0.5" style={{ color: CARBON }}>.fr</span>
    </span>
  </span>
);

export const SiteLogo = ({ variant }: { variant: LogoVariant }) => {
  const C = { 1: Actuel, 2: Plaque, 3: Ecrou, 4: Vitesse, 5: Roue }[variant];
  return <C />;
};
