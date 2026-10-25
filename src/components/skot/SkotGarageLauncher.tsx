// 25/10/2026 — SKOT dans le garage, ordinateur (Nolan : « le mettre ailleurs, à gauche, un peu plus gros, un peu plus animé.
// Juste pour le garage »). Ailleurs sur le site, SkotDesktopLauncher (bord droit) ne change pas.
// Il arrive en roulant depuis la gauche (pose « roule »), puis change de pose toutes les quelques secondes avec une
// phrase de garage (clé = entretien, colis = commande, loupe = pièce…). Tenue de saison d'abord si on est en saison.
// Toutes les poses regardent vers la droite, donc vers la page : aucun retournement.
// Ordinateur ≥ 1024 px (sous 1024 px le garage passe en colonne, le lanceur habituel reprend la main).
import { useEffect, useRef, useState } from "react";
import { skotSaison, SAISON_TEXTE } from "@/lib/skotSaison";

const CARBON = "#1A1A1A";
const JAK = "'Plus Jakarta Sans', sans-serif";
const cut = (n: number) => `polygon(0 0, calc(100% - ${n}px) 0, 100% ${n}px, 100% 100%, ${n}px 100%, 0 calc(100% - ${n}px))`;

type Pose = { img: string; titre: string; phrase: string };
const POSES: Pose[] = [
  { img: "/skot/p-salut.webp", titre: "Salut, c'est ton garage !", phrase: "Une question sur ta trott ? Clique-moi." },
  { img: "/skot/p-cle.webp", titre: "Un bruit, un jeu ?", phrase: "Dis-moi ce que fait ta trott, je trouve la pièce." },
  { img: "/skot/p-colis.webp", titre: "Ta commande ?", phrase: "Je te dis où elle en est." },
  { img: "/skot/p-loupe.webp", titre: "Une pièce à trouver ?", phrase: "Je ne te montre que ce qui va sur ta trott." },
  { img: "/skot/p-trouve.webp", titre: "L'entretien", phrase: "Je te dis quoi changer, et quand." },
];
const ROULE = "/skot/p-roule.webp";
const LABEL = "Ouvrir SKOT, l'assistant de l'atelier";

const CSS = `
@keyframes skg-in{0%{transform:translateX(-130%)}70%{transform:translateX(6%)}100%{transform:translateX(0)}}
@keyframes skg-ride{0%,100%{transform:translateY(0) rotate(-1.2deg)}50%{transform:translateY(-7px) rotate(1.2deg)}}
@keyframes skg-shadow{0%,100%{transform:scaleX(1);opacity:.42}50%{transform:scaleX(.86);opacity:.28}}
@keyframes skg-pop{0%{transform:scale(.92) translateY(6px);opacity:0}100%{transform:none;opacity:1}}
.skg-in{animation:skg-in 1.1s cubic-bezier(.2,.9,.3,1) both}
.skg-ride{animation:skg-ride 2.6s ease-in-out infinite}
.skg-shadow{animation:skg-shadow 2.6s ease-in-out infinite}
.skg-pop{animation:skg-pop .35s cubic-bezier(.2,.9,.3,1.2) both}
@media (prefers-reduced-motion:reduce){.skg-in,.skg-ride,.skg-shadow,.skg-pop{animation:none!important}}`;
let cssInjected = false;

const SkotGarageLauncher = ({ onOpen }: { onOpen: () => void }) => {
  if (!cssInjected && typeof document !== "undefined") {
    const el = document.createElement("style");
    el.textContent = CSS;
    document.head.appendChild(el);
    cssInjected = true;
  }
  const [poses] = useState<Pose[]>(() => {
    const s = skotSaison();
    if (!s) return POSES;
    const [titre, phrase] = SAISON_TEXTE[s];
    return [{ img: `/skot/p-${s}.webp`, titre, phrase }, ...POSES];
  });
  const [arrived, setArrived] = useState(false); // pendant l'entrée : pose « roule »
  const [i, setI] = useState(0);
  const [talk, setTalk] = useState(false);
  const [hover, setHover] = useState(false);
  const hoverRef = useRef(false);
  hoverRef.current = hover;

  // Images chargées d'avance : les changements de pose ne clignotent pas.
  useEffect(() => { [ROULE, ...poses.map((p) => p.img)].forEach((s) => { const im = new Image(); im.src = s; }); }, [poses]);

  // Arrivée (1,1 s) → première pose + bulle ; ensuite une pose toutes les 7 s, la bulle parle 4,5 s sur 7.
  useEffect(() => {
    const t1 = window.setTimeout(() => { setArrived(true); setTalk(true); }, 1100);
    return () => window.clearTimeout(t1);
  }, []);
  useEffect(() => {
    if (!arrived) return;
    const off = window.setTimeout(() => { if (!hoverRef.current) setTalk(false); }, 4500);
    const next = window.setTimeout(() => {
      if (hoverRef.current) return;
      setI((k) => (k + 1) % poses.length);
      setTalk(true);
    }, 7000);
    return () => { window.clearTimeout(off); window.clearTimeout(next); };
  }, [arrived, i, poses.length]);

  const pose = poses[i];
  const src = arrived ? pose.img : ROULE;
  const show = arrived && (talk || hover);
  // Taille : la colonne de gauche du garage (nav 220 px + marge du centrage max-w 1400), entre 210 et 320 px.
  const size = "clamp(210px, calc((100vw - 1400px) / 2 + 250px), 320px)";

  return (
    <div className="hidden lg:block fixed z-40 left-2 bottom-2 pointer-events-none" style={{ width: size }}>
      {/* Bulle : au-dessus, vers la page */}
      {show && (
        <span key={i} className="skg-pop absolute left-[38%] bottom-[92%] block p-[2px] w-[230px]" style={{ background: CARBON, clipPath: cut(10) }}>
          <span className="block bg-white px-4 py-3 text-left" style={{ clipPath: cut(9) }}>
            <span className="block text-[15px] font-extrabold italic leading-tight" style={{ fontFamily: JAK, color: CARBON }}>{pose.titre}</span>
            <span className="block text-[14px] leading-snug mt-0.5" style={{ fontFamily: JAK, color: "#4A4A4A" }}>{pose.phrase}</span>
          </span>
        </span>
      )}
      <div className="skg-in">
        <button
          type="button"
          onClick={onOpen}
          aria-label={LABEL}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onFocus={() => setHover(true)}
          onBlur={() => setHover(false)}
          className="relative block w-full pointer-events-auto transition-transform duration-300"
          style={{ transform: hover ? "scale(1.06) rotate(-2deg)" : "none", transformOrigin: "50% 100%" }}
        >
          {/* ombre au sol */}
          <span aria-hidden className="skg-shadow absolute left-[14%] right-[14%] bottom-[4%] h-[7%] rounded-[50%]" style={{ background: "radial-gradient(closest-side, rgba(0,0,0,0.55), transparent)" }} />
          <span className="skg-ride block" style={{ transformOrigin: "50% 100%" }}>
            <img
              key={src}
              src={src}
              alt=""
              draggable={false}
              className="block w-full h-auto select-none pointer-events-none animate-in fade-in duration-300"
              style={{ aspectRatio: "1 / 1", filter: "drop-shadow(0 14px 16px rgba(0,0,0,0.3))" }}
            />
          </span>
        </button>
      </div>
    </div>
  );
};

export default SkotGarageLauncher;
