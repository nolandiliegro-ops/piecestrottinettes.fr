// 25/10/2026 — SKOT sur ordinateur (Nolan : « on le voit pas beaucoup… j'ai envie qu'il sorte beaucoup de l'écran »).
// Nouvelle mascotte : la patinette des années 50 qui écoute, phares-yeux (Higgsfield, choix de Nolan du 25/10).
// Direction retenue : « Surgit du bord » — à moitié sorti du bord droit, il sort en entier au survol et parle.
// Tenue de saison (Noël, Halloween, soldes, été, fête) selon le calendrier de src/lib/skotSaison.ts, comme sur téléphone.
// Ordinateur seulement (≥ 768 px) ; le téléphone a SKOT dans la barre du bas.
import { useEffect, useState } from "react";
import { skotSaison, SAISON_TEXTE } from "@/lib/skotSaison";

const CARBON = "#1A1A1A";
const JAK = "'Plus Jakarta Sans', sans-serif";
const cut = (n: number) => `polygon(0 0, calc(100% - ${n}px) 0, 100% ${n}px, 100% 100%, ${n}px 100%, 0 calc(100% - ${n}px))`;
const IMG = { ecoute: "/skot/skot-ecoute.webp", clin: "/skot/skot-clin.webp" };
const LABEL = "Ouvrir SKOT, l'assistant de l'atelier";

const CSS = `
@keyframes skpc-in-right{from{transform:translateX(110%)}to{transform:translateX(0)}}
@media (prefers-reduced-motion:reduce){.skpc-in{animation:none!important}}`;
let cssInjected = false;

/* Bulle à angle coupé, contour carbone (deux clip-path imbriqués : un contour seul disparaît dans l'angle). */
const Bubble = ({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
  <span className={`block p-[2px] ${className}`} style={{ background: CARBON, clipPath: cut(10), ...style }}>
    <span className="block bg-white px-4 py-3 text-left" style={{ clipPath: cut(9) }}>{children}</span>
  </span>
);

const SkotDesktopLauncher = ({ onOpen }: { onOpen: () => void }) => {
  if (!cssInjected && typeof document !== "undefined") {
    const el = document.createElement("style");
    el.textContent = CSS;
    document.head.appendChild(el);
    cssInjected = true;
  }
  const [saison] = useState(() => skotSaison());
  const [hover, setHover] = useState(false);
  // En saison : la tenue au repos comme au survol (pas de clin d'œil, l'image d'origine n'a pas le costume).
  const rest = saison ? `/skot/p-${saison}.webp` : IMG.ecoute;
  const over = saison ? rest : IMG.clin;
  const [titre, phrase] = saison ? SAISON_TEXTE[saison] : ["Une pièce à trouver ?", "Demande-moi, je connais toutes les compatibilités."];
  // Les images sont chargées d'avance : le clin d'œil au survol ne clignote pas.
  useEffect(() => { [rest, over].forEach((s) => { const i = new Image(); i.src = s; }); }, [rest, over]);
  const hp = { onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false), onFocus: () => setHover(true), onBlur: () => setHover(false) };

  return (
    // Le conteneur ne capte aucun clic : seule la mascotte est un bouton (la bulle invisible ne doit pas bloquer la page).
    <div className="skpc-in hidden md:flex fixed z-40 right-0 bottom-6 items-end pointer-events-none" style={{ animation: "skpc-in-right .7s cubic-bezier(.2,.9,.3,1.15) both" }}>
      <Bubble className="mb-36 -mr-6 max-w-[230px] transition-all duration-300" style={{ opacity: hover ? 1 : 0, transform: hover ? "none" : "translateX(20px)" }}>
        <span className="block text-[15px] font-extrabold italic leading-tight" style={{ fontFamily: JAK, color: CARBON }}>{titre}</span>
        <span className="block text-[14px] leading-snug mt-0.5" style={{ fontFamily: JAK, color: "#4A4A4A" }}>{phrase}</span>
      </Bubble>
      <button
        type="button"
        onClick={onOpen}
        aria-label={LABEL}
        {...hp}
        className="block pointer-events-auto transition-transform duration-500"
        style={{ transform: hover ? "translateX(0)" : "translateX(38%)", transitionTimingFunction: "cubic-bezier(.2,.9,.3,1.2)" }}
      >
        {/* Le personnage regarde vers la page (l'image d'origine regarde à droite). */}
        <img
          src={hover ? over : rest}
          alt=""
          width={220}
          height={220}
          draggable={false}
          className="block select-none pointer-events-none drop-shadow-[0_14px_18px_rgba(0,0,0,0.22)]"
          style={{ width: 220, height: 220, transform: "scaleX(-1)" }}
        />
      </button>
    </div>
  );
};

export default SkotDesktopLauncher;
