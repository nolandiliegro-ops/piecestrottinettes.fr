// 24/10/2026 — Lanceur SKOT sur téléphone : 5 propositions (Nolan : « j'aime pas ce bouton vert, qu'il sorte de la barre »).
// ?skotbtn=1..4 = SKOT qui sort de la barre du bas ; la 5 = SKOT au centre de la barre (?barrebas=5).
// Sans paramètre : bouton vert actuel. Ordinateur : inchangé (bouton vert).
import { useEffect, useState } from "react";
import SkotAvatar from "./SkotAvatar";

// Animations légères (transform/opacity uniquement), coupées si « réduire les animations ».
const CSS = `
@keyframes skl-hop{0%,72%,100%{transform:translateY(0) rotate(0)}78%{transform:translateY(-14px) rotate(-6deg)}86%{transform:translateY(0) rotate(3deg)}92%{transform:translateY(-4px) rotate(0)}}
@keyframes skl-in-up{0%{transform:translateY(60px) scale(.6);opacity:0}60%{transform:translateY(-8px) scale(1.05);opacity:1}100%{transform:translateY(0) scale(1)}}
@keyframes skl-peek{0%,8%{transform:translateY(46px)}16%,62%{transform:translateY(-6px)}66%{transform:translateY(-2px) rotate(-4deg)}70%{transform:translateY(-6px) rotate(4deg)}74%,86%{transform:translateY(-6px) rotate(0)}94%,100%{transform:translateY(46px)}}
@keyframes skl-bubble{0%,14%{opacity:0;transform:scale(.6) translateY(8px)}20%,84%{opacity:1;transform:scale(1) translateY(0)}92%,100%{opacity:0;transform:scale(.6) translateY(8px)}}
@keyframes skl-tab{0%{transform:translateX(110%)}100%{transform:translateX(0)}}
@keyframes skl-jump{0%,40%{transform:translateY(40px) scale(.7);opacity:0}62%{transform:translateY(-16px) scale(1.06);opacity:1}76%{transform:translateY(0) scale(1)}100%{transform:translateY(0)}}
@keyframes skl-wiggle{0%,80%,100%{transform:rotate(0)}84%{transform:rotate(-8deg)}88%{transform:rotate(7deg)}92%{transform:rotate(-4deg)}96%{transform:rotate(2deg)}}
@keyframes skl-roll{0%{transform:translateX(-140px) rotate(-6deg)}70%{transform:translateX(8px) rotate(-10deg)}85%{transform:translateX(-3px) rotate(-4deg)}100%{transform:translateX(0) rotate(-6deg)}}
@keyframes skl-bob{0%,100%{transform:translateY(0) rotate(-6deg)}50%{transform:translateY(-3px) rotate(-8deg)}}
@keyframes skl-lines{0%,100%{opacity:0;transform:translateX(6px)}30%,60%{opacity:.7;transform:translateX(0)}}
.skl-hop{animation:skl-in-up .7s cubic-bezier(.2,.9,.3,1.3) both, skl-hop 4.5s 1.2s ease-in-out infinite}
.skl-peek{animation:skl-peek 7s .4s ease-in-out infinite}
.skl-bubble{transform-origin:right bottom;animation:skl-bubble 7s .4s ease-in-out infinite}
.skl-tab{animation:skl-tab .45s .2s cubic-bezier(.2,.9,.3,1) both}
.skl-jump{animation:skl-jump 1.1s .2s cubic-bezier(.2,.9,.3,1.3) both}
.skl-jump > span{display:block;transform-origin:50% 90%;animation:skl-wiggle 5s 2s ease-in-out infinite}
.skl-roll{animation:skl-roll 1.2s .3s cubic-bezier(.2,.8,.3,1) both}
.skl-roll > span{display:block;animation:skl-bob 1.6s 1.5s ease-in-out infinite}
.skl-lines{animation:skl-lines 1.6s 1.5s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.skl-hop,.skl-peek,.skl-bubble,.skl-tab,.skl-jump,.skl-jump>span,.skl-roll,.skl-roll>span,.skl-lines{animation:none!important;opacity:1!important}}
`;
let cssInjected = false;
const useSklCss = () => {
  if (!cssInjected && typeof document !== "undefined") {
    const el = document.createElement("style");
    el.textContent = CSS;
    document.head.appendChild(el);
    cssInjected = true;
  }
};

export type SkotBtnVariant = 1 | 2 | 3 | 4;
export const readSkotBtnVariant = (): SkotBtnVariant | null => {
  try {
    const n = Number(new URLSearchParams(window.location.search).get("skotbtn"));
    return n >= 1 && n <= 4 ? (n as SkotBtnVariant) : null;
  } catch {
    return null;
  }
};

const GREEN = "#4A7C59";
const CARBON = "#1A1A1A";
const UNB = "'Unbounded', sans-serif";
const JAK = "'Plus Jakarta Sans', sans-serif";
// Haut de la barre du bas (barre « Repassé » : 56 px + marge de sécurité).
const BAR_TOP = "calc(max(env(safe-area-inset-bottom), 6px) + 56px)";
const cutTR = (n: number) => `polygon(0 0, calc(100% - ${n}px) 0, 100% ${n}px, 100% 100%, 0 100%)`;
const cutTL = (n: number) => `polygon(${n}px 0, 100% 0, 100% 100%, 0 100%, 0 ${n}px)`;

const LABEL = "Ouvrir SKOT, l'assistant de l'atelier";

const SkotLauncher = ({ variant, onOpen }: { variant: SkotBtnVariant; onOpen: () => void }) => {
  useSklCss();
  // La roue tourne pendant l'arrivée (roue libre) puis s'arrête.
  const [rolling, setRolling] = useState(variant === 4);
  useEffect(() => { if (variant !== 4) return; const t = setTimeout(() => setRolling(false), 1500); return () => clearTimeout(t); }, [variant]);
  /* 1 · Perché — SKOT debout sur le bord de la barre, à droite, sans boîte ; ombre au sol sur la barre. */
  if (variant === 1)
    return (
      <button type="button" onClick={onOpen} aria-label={LABEL} className="md:hidden fixed z-[51] right-2 flex flex-col items-center" style={{ bottom: `calc(${BAR_TOP} - 10px)` }}>
        <span className="mb-0.5 px-2 py-0.5 text-white italic uppercase leading-none" style={{ background: CARBON, fontFamily: UNB, fontWeight: 800, fontSize: 11, clipPath: cutTR(6) }}>Une question ?</span>
        <span className="skl-hop relative drop-shadow-[0_6px_6px_rgba(0,0,0,0.25)]"><SkotAvatar size={88} /></span>
      </button>
    );

  /* 2 · Coucou — seule la tête dépasse de derrière la barre, bulle de BD à côté. */
  if (variant === 2)
    return (
      <button type="button" onClick={onOpen} aria-label={LABEL} className="md:hidden fixed z-[49] right-3 flex items-end gap-1.5" style={{ bottom: BAR_TOP }}>
        <span className="skl-bubble relative mb-6 px-3 py-2 bg-white border-2 text-[14px] italic font-extrabold leading-tight" style={{ borderColor: CARBON, color: CARBON, fontFamily: JAK, clipPath: cutTL(8) }}>
          Une pièce&nbsp;? Demande-moi.
        </span>
        <span className="block overflow-hidden" style={{ height: 60, width: 96 }}>
          <span className="skl-peek block"><SkotAvatar size={96} /></span>
        </span>
      </button>
    );

  /* 3 · Languette — une languette carbone à angle coupé pousse hors de la barre, SKOT en sort par le haut. */
  if (variant === 3)
    return (
      <button type="button" onClick={onOpen} aria-label={LABEL} className="md:hidden fixed z-[51] right-0 flex items-end" style={{ bottom: `calc(${BAR_TOP} - 1px)` }}>
        <span className="skl-tab relative flex items-center gap-1 pl-1 pr-3 h-[38px]" style={{ background: CARBON, clipPath: cutTL(14) }}>
          <span className="w-[58px]" />
          <span className="text-white italic uppercase leading-none" style={{ fontFamily: UNB, fontWeight: 900, fontSize: 15 }}>SKOT</span>
          <span className="w-2 h-2 ml-1" style={{ background: GREEN, transform: "skewX(-20deg)" }} />
        </span>
        <span className="skl-jump absolute left-1 bottom-1"><span><SkotAvatar size={72} /></span></span>
      </button>
    );

  /* 4 · En roue libre — SKOT roule sur le bord gauche de la barre, penché, traits de vitesse. */
  return (
    <button type="button" onClick={onOpen} aria-label={LABEL} className="md:hidden fixed z-[51] left-2 flex items-end gap-1" style={{ bottom: `calc(${BAR_TOP} - 8px)` }}>
      <span className="skl-roll drop-shadow-[0_6px_6px_rgba(0,0,0,0.22)]"><span><SkotAvatar size={82} thinking={rolling} /></span></span>
      <span className="mb-4 px-2 py-1 text-white italic uppercase leading-none" style={{ background: GREEN, fontFamily: UNB, fontWeight: 800, fontSize: 11, clipPath: cutTR(6) }}>SKOT</span>
    </button>
  );
};

export default SkotLauncher;
