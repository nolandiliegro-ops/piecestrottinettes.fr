// 25/10/2026 — SKOT sur ordinateur (Nolan : « on le voit pas beaucoup… j'ai envie qu'il sorte beaucoup de l'écran »).
// Nouvelle mascotte : la patinette des années 50 qui écoute, phares-yeux (Higgsfield, choix de Nolan du 25/10).
// Défaut = 1 « Surgit du bord » ; ?skotpc=0 = ancien bouton vert ; 2..5 = autres mises en scène (ordinateur ≥ 768 px). Téléphone : inchangé.
import { useEffect, useState } from "react";

export type SkotPcVariant = 1 | 2 | 3 | 4 | 5;
export const readSkotPcVariant = (): SkotPcVariant | null => {
  try {
    // 25/10 : Nolan choisit la 1 « Surgit du bord » = défaut ; ?skotpc=0 = ancien bouton vert, 2..5 = autres propositions.
    const raw = new URLSearchParams(window.location.search).get("skotpc");
    if (raw === null) return 1;
    const n = Number(raw);
    return n >= 1 && n <= 5 ? (n as SkotPcVariant) : n === 0 ? null : 1;
  } catch {
    return 1;
  }
};

const GREEN = "#4A7C59";
const CARBON = "#1A1A1A";
const UNB = "'Unbounded', sans-serif";
const JAK = "'Plus Jakarta Sans', sans-serif";
const cut = (n: number) => `polygon(0 0, calc(100% - ${n}px) 0, 100% ${n}px, 100% 100%, ${n}px 100%, 0 calc(100% - ${n}px))`;
const IMG = { ecoute: "/skot/skot-ecoute.webp", clin: "/skot/skot-clin.webp" };
const LABEL = "Ouvrir SKOT, l'assistant de l'atelier";

const CSS = `
@keyframes skpc-in-right{from{transform:translateX(110%)}to{transform:translateX(0)}}
@keyframes skpc-bob{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-4px) rotate(-1.5deg)}}
@keyframes skpc-peek{0%,70%,100%{transform:translateY(0)}78%,90%{transform:translateY(-70px)}}
@keyframes skpc-bubble{0%,100%{opacity:0;transform:translateY(6px) scale(.96)}10%,85%{opacity:1;transform:none}}
.skpc-bob{animation:skpc-bob 3.2s ease-in-out infinite}
.skpc-peek{animation:skpc-peek 9s 2s ease-in-out infinite}
.skpc-hello{animation:skpc-bubble 7s 1.2s ease-in-out both}
@media (prefers-reduced-motion:reduce){.skpc-bob,.skpc-peek,.skpc-hello{animation:none!important}}`;
let cssInjected = false;

/* Bulle à angle coupé, contour carbone (deux clip-path imbriqués : un contour seul disparaît dans l'angle). */
const Bubble = ({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
  <span className={`block p-[2px] ${className}`} style={{ background: CARBON, clipPath: cut(10), ...style }}>
    <span className="block bg-white px-4 py-3 text-left" style={{ clipPath: cut(9) }}>{children}</span>
  </span>
);
const Hello = () => (
  <>
    <span className="block text-[15px] font-extrabold italic leading-tight" style={{ fontFamily: JAK, color: CARBON }}>Une pièce à trouver ?</span>
    <span className="block text-[14px] leading-snug mt-0.5" style={{ fontFamily: JAK, color: "#4A4A4A" }}>Demande-moi, je connais toutes les compatibilités.</span>
  </>
);

/* Le personnage regarde vers la page (l'image d'origine regarde à droite). */
const Skot = ({ size, wink }: { size: number; wink: boolean }) => (
  <img
    src={wink ? IMG.clin : IMG.ecoute}
    alt=""
    width={size}
    height={size}
    draggable={false}
    className="block select-none pointer-events-none drop-shadow-[0_14px_18px_rgba(0,0,0,0.22)]"
    style={{ width: size, height: size, transform: "scaleX(-1)" }}
  />
);

const SkotDesktopLauncher = ({ variant, onOpen }: { variant: SkotPcVariant; onOpen: () => void }) => {
  if (!cssInjected && typeof document !== "undefined") {
    const el = document.createElement("style");
    el.textContent = CSS;
    document.head.appendChild(el);
    cssInjected = true;
  }
  const [hover, setHover] = useState(false);
  // Les deux images sont chargées d'avance : le clin d'œil au survol ne clignote pas.
  useEffect(() => { [IMG.ecoute, IMG.clin].forEach((s) => { const i = new Image(); i.src = s; }); }, []);
  const hp = { onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false), onFocus: () => setHover(true), onBlur: () => setHover(false) };

  /* 1 · Surgit du bord — à moitié sorti du bord droit de l'écran ; au survol il sort en entier et parle. */
  if (variant === 1)
    return (
      // Le conteneur ne capte aucun clic : seule la mascotte est un bouton (la bulle invisible ne doit pas bloquer la page).
      <div className="hidden md:flex fixed z-40 right-0 bottom-6 items-end pointer-events-none" style={{ animation: "skpc-in-right .7s cubic-bezier(.2,.9,.3,1.15) both" }}>
        <Bubble className="mb-36 -mr-6 max-w-[230px] transition-all duration-300" style={{ opacity: hover ? 1 : 0, transform: hover ? "none" : "translateX(20px)" }}><Hello /></Bubble>
        <button
          type="button"
          onClick={onOpen}
          aria-label={LABEL}
          {...hp}
          className="block pointer-events-auto transition-transform duration-500"
          style={{ transform: hover ? "translateX(0)" : "translateX(38%)", transitionTimingFunction: "cubic-bezier(.2,.9,.3,1.2)" }}
        >
          <Skot size={220} wink={hover} />
        </button>
      </div>
    );

  /* 2 · Debout dans le coin — en entier, qui se balance ; il dit bonjour à l'arrivée, puis au survol. */
  if (variant === 2)
    return (
      <button type="button" onClick={onOpen} aria-label={LABEL} {...hp} className="hidden md:flex fixed z-40 right-4 bottom-2 items-end gap-0" style={{ animation: "skpc-in-right .9s cubic-bezier(.2,.9,.3,1.1) both" }}>
        <Bubble className={`mb-40 -mr-8 max-w-[230px] transition-opacity duration-300 ${hover ? "" : "skpc-hello"}`} style={hover ? { opacity: 1 } : undefined}><Hello /></Bubble>
        <span className="block skpc-bob"><Skot size={230} wink={hover} /></span>
      </button>
    );

  /* 3 · Passe la tête — seuls les phares et le guidon dépassent du bas de l'écran ; il jette un œil de temps en temps, sort au survol. */
  if (variant === 3)
    return (
      <button type="button" onClick={onOpen} aria-label={LABEL} {...hp} className="hidden md:flex fixed z-40 right-10 bottom-0 items-end overflow-visible">
        <Bubble className="mb-16 -mr-4 max-w-[230px] transition-all duration-300" style={{ opacity: hover ? 1 : 0, transform: hover ? "translateY(-110px)" : "translateY(0)" }}><Hello /></Bubble>
        <span className="block h-[110px] overflow-visible">
          <span className={`block transition-transform duration-500 ${hover ? "" : "skpc-peek"}`} style={{ transform: hover ? "translateY(-150px)" : undefined, transitionTimingFunction: "cubic-bezier(.2,.9,.3,1.2)" }}>
            <Skot size={250} wink={hover} />
          </span>
        </span>
      </button>
    );

  /* 4 · Sur son socle — debout sur un socle vert à angle coupé « SKOT · L'ATELIER », comme une pièce de vitrine. */
  if (variant === 4)
    return (
      <button type="button" onClick={onOpen} aria-label={LABEL} {...hp} className="hidden md:flex fixed z-40 right-6 bottom-6 items-end" style={{ animation: "skpc-in-right .8s cubic-bezier(.2,.9,.3,1.1) both" }}>
        <Bubble className="mb-48 -mr-6 max-w-[230px] transition-all duration-300" style={{ opacity: hover ? 1 : 0, transform: hover ? "none" : "translateY(8px)" }}><Hello /></Bubble>
        <span className="flex flex-col items-center">
          <span className="block -mb-5 transition-transform duration-300" style={{ transform: hover ? "translateY(-6px)" : "none" }}><Skot size={210} wink={hover} /></span>
          <span className="block w-[190px] py-2.5 text-center text-white italic uppercase" style={{ background: GREEN, clipPath: cut(12), fontFamily: UNB, fontWeight: 900, fontSize: 15, letterSpacing: "0.02em" }}>
            SKOT <span style={{ color: "#CFE3D4" }}>· L'atelier</span>
          </span>
        </span>
      </button>
    );

  /* 5 · Carte atelier — une carte qui invite à poser la question tout de suite, SKOT jaillit par-dessus. */
  return (
    <button type="button" onClick={onOpen} aria-label={LABEL} {...hp} className="hidden md:block fixed z-40 right-6 bottom-6 text-left" style={{ animation: "skpc-in-right .8s cubic-bezier(.2,.9,.3,1.1) both" }}>
      <span className="absolute -top-[150px] right-2 block transition-transform duration-300" style={{ transform: hover ? "translateY(-8px) rotate(-2deg)" : "none" }}><Skot size={190} wink={hover} /></span>
      <span className="block p-[2px] w-[320px]" style={{ background: CARBON, clipPath: cut(14) }}>
        <span className="block bg-white px-5 pt-5 pb-4" style={{ clipPath: cut(13) }}>
          <span className="block italic uppercase" style={{ fontFamily: UNB, fontWeight: 900, fontSize: 18, color: CARBON }}>SKOT <span style={{ color: GREEN }}>· L'atelier</span></span>
          <span className="block mt-1 pr-16 text-[14px] leading-snug" style={{ fontFamily: JAK, color: "#4A4A4A" }}>Une pièce, une compat, ta commande : demande-moi.</span>
          <span className="mt-3 flex items-center justify-between gap-2 border-2 px-3 min-h-[44px] text-[14px]" style={{ borderColor: CARBON, fontFamily: JAK, color: "#6B6B6B" }}>
            Pose ta question…
            <span className="text-white text-[13px] font-extrabold italic uppercase px-2.5 py-1" style={{ background: GREEN }}>Go</span>
          </span>
        </span>
      </span>
    </button>
  );
};

export default SkotDesktopLauncher;
