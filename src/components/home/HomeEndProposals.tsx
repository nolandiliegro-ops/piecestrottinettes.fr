/* Fin de l'accueil (24/10/2026, retour de Nolan : « les trucs pour rassurer, c'est vraiment pas beau ; ça se répète
   avec les favoris ; L'Atelier est dans le menu mais l'accueil n'en parle pas »).
   Propositions derrière ?fin=1..5 (remplacent Favoris + bande de réassurance) ; sans paramètre : inchangé.
   Promesses reprises telles qu'affichées aujourd'hui (Sous 24h, Méca pro, Retour 14j) + faits de L'Atelier
   (réponse d'un réparateur sous 48 h, vidéos vérifiées, guides) — rien d'inventé. */
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, MessageCircleQuestion, PlayCircle, RotateCcw, Truck, Wrench } from "lucide-react";
import FavoritesSection from "@/components/home/FavoritesSection";

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const SOFT = "#8FBF9C";
const PAPER = "#FAFAF8";
const LINE = "#E7E1D6";
const cut = (px: number) => `polygon(0 0, calc(100% - ${px}px) 0, 100% ${px}px, 100% 100%, 0 100%)`;

export type EndLook = 1 | 2 | 3 | 4 | 5;
// 24/10 (choix de Nolan, reco) : « L'Atelier en vitrine » (2) par défaut ; ?fin=0 = favoris + ancienne bande.
export const finParam = (): EndLook | null => {
  if (typeof window === "undefined") return 2;
  const sp = new URLSearchParams(window.location.search);
  if (!sp.has("fin")) return 2;
  const n = Number(sp.get("fin"));
  return n >= 1 && n <= 5 ? (n as EndLook) : null;
};

const PROMISES = [
  { icon: Truck, t: "Sous 24h", d: "Ta commande part vite." },
  { icon: Wrench, t: "Méca pro", d: "Des pièces choisies par un atelier." },
  { icon: RotateCcw, t: "Retour 14j", d: "Pas la bonne pièce ? Tu la renvoies." },
];
const DOORS = [
  { to: "/atelier#question", icon: MessageCircleQuestion, t: "Pose ta question", d: "Un réparateur te répond sous 48 h.", img: "/categories/plaquettes-a.webp" },
  { to: "/atelier/videos", icon: PlayCircle, t: "Vidéos", d: "Les meilleurs tests, rangés par trottinette.", img: "/brand-heroes/dualtron.webp" },
  { to: "/blog", icon: BookOpen, t: "Guides", d: "Choisir, comparer, entretenir.", img: "/brand-heroes/navee.webp" },
];
const H2 = ({ children, light = false }: { children: React.ReactNode; light?: boolean }) => (
  <h2 className="text-[28px] lg:text-[40px] uppercase leading-[0.95]" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.03em", color: light ? "#fff" : CARBON }}>{children}</h2>
);
const Wrap = ({ children, bg = PAPER, py = "py-12 lg:py-16" }: { children: React.ReactNode; bg?: string; py?: string }) => (
  <section className={`px-4 ${py}`} style={{ backgroundColor: bg }}><div className="mx-auto max-w-6xl">{children}</div></section>
);
const PromiseTiles = ({ dark = false }: { dark?: boolean }) => (
  <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
    {PROMISES.map(({ icon: I, t, d }) => (
      <li key={t} className="flex items-center gap-3 p-4" style={{ background: dark ? "#242424" : "#fff", clipPath: cut(12), boxShadow: dark ? "none" : `inset 0 0 0 1px ${LINE}` }}>
        <span className="w-11 h-11 shrink-0 flex items-center justify-center text-white" style={{ background: GREEN, clipPath: cut(8) }}><I className="w-5 h-5" /></span>
        <span className="min-w-0"><b className="block text-base uppercase" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: dark ? "#fff" : CARBON }}>{t}</b>
          <span className="text-sm" style={{ fontFamily: FONT, color: dark ? "rgba(255,255,255,0.7)" : "#4B5563" }}>{d}</span></span>
      </li>
    ))}
  </ul>
);
const DoorCards = () => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
    {DOORS.map(({ to, icon: I, t, d, img }) => (
      <Link key={t} to={to} className="group bg-white flex flex-col" style={{ clipPath: cut(14), boxShadow: `inset 0 0 0 1px ${LINE}` }}>
        <div className="h-36 lg:h-40 overflow-hidden"><img src={img} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" /></div>
        <div className="p-4">
          <p className="flex items-center gap-2 text-base font-extrabold uppercase" style={{ fontFamily: FONT, color: CARBON }}><I className="w-5 h-5" style={{ color: GREEN }} />{t}</p>
          <p className="mt-1 text-sm text-[#4B5563]" style={{ fontFamily: FONT }}>{d}</p>
        </div>
      </Link>
    ))}
  </div>
);
const AtelierCta = ({ light = false }: { light?: boolean }) => (
  <Link to="/atelier" className="inline-flex items-center gap-3 min-h-[52px] px-6 text-[15px] font-extrabold uppercase tracking-wide"
    style={{ fontFamily: FONT, background: light ? "#fff" : CARBON, color: light ? CARBON : "#fff", clipPath: cut(10) }}>
    Entrer dans L'Atelier <ArrowRight className="w-5 h-5" />
  </Link>
);

export const HomeEnd = ({ look }: { look: EndLook }) => {
  // 1 · Repassé : mêmes blocs (favoris compris), promesses refaites en tuiles, une ligne vers L'Atelier.
  if (look === 1) return (
    <>
      <FavoritesSection />
      <Wrap>
        <PromiseTiles />
        <Link to="/atelier" className="mt-4 flex items-center justify-between gap-3 min-h-[56px] px-5 bg-white" style={{ clipPath: cut(12), boxShadow: `inset 0 0 0 1px ${LINE}`, fontFamily: FONT }}>
          <span className="text-[15px] font-bold" style={{ color: CARBON }}>Une question sur ta trott ? <span className="text-[#4B5563] font-semibold">Un réparateur te répond sous 48 h.</span></span>
          <ArrowRight className="w-5 h-5 shrink-0" style={{ color: GREEN }} />
        </Link>
      </Wrap>
    </>
  );

  // 2 · L'Atelier en vitrine : trois portes photo (question, vidéos, guides), les promesses dessous. Favoris retirés.
  if (look === 2) return (
    <Wrap>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.16em]" style={{ fontFamily: FONT, color: GREEN }}>L'Atelier</p>
          <H2>On répare tous les jours à Marseille.</H2>
          <p className="mt-2 text-base text-[#4B5563] max-w-xl" style={{ fontFamily: FONT }}>Guides, vidéos, et les réponses des réparateurs aux questions des riders.</p>
        </div>
        <AtelierCta />
      </div>
      <DoorCards />
      <div className="mt-8"><PromiseTiles /></div>
    </Wrap>
  );

  // 3 · Bande carbone : une seule bande sombre « boutique tenue par un atelier », promesses + accès à L'Atelier.
  if (look === 3) return (
    <Wrap bg={CARBON}>
      <div className="grid lg:grid-cols-[1fr_minmax(0,520px)] gap-8 items-center">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.16em]" style={{ fontFamily: FONT, color: SOFT }}>Pourquoi nous</p>
          <H2 light>Une boutique tenue par un atelier.</H2>
          <p className="mt-3 text-base text-white/75 max-w-lg" style={{ fontFamily: FONT }}>On répare des trottinettes tous les jours. Une question sur ta trott ? Un réparateur te répond sous 48 h.</p>
          <div className="mt-6"><AtelierCta light /></div>
        </div>
        <PromiseTilesStack />
      </div>
    </Wrap>
  );

  // 4 · Question d'abord : à gauche « une question sur ta trott ? », à droite les promesses. Favoris retirés.
  if (look === 4) return (
    <Wrap>
      <div className="grid lg:grid-cols-2 gap-4">
        <Link to="/atelier#question" className="relative overflow-hidden flex flex-col justify-end min-h-[280px] p-6 text-white" style={{ clipPath: cut(18), background: CARBON }}>
          <img src="/categories/plaquettes-a.webp" alt="" className="absolute inset-0 w-full h-full object-cover opacity-45" />
          <div className="relative">
            <p className="text-sm font-extrabold uppercase tracking-[0.16em]" style={{ fontFamily: FONT, color: SOFT }}>L'Atelier</p>
            <p className="mt-1 text-[28px] lg:text-[36px] uppercase leading-[0.95]" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic" }}>Une question sur ta trott ?</p>
            <p className="mt-2 text-base text-white/85" style={{ fontFamily: FONT }}>Pneu, frein qui couine, pièce compatible ou pas : un réparateur te répond sous 48 h.</p>
            <span className="mt-4 inline-flex items-center gap-2 min-h-[48px] px-5 text-[15px] font-extrabold uppercase bg-white text-[#1A1A1A]" style={{ fontFamily: FONT, clipPath: cut(10) }}>Pose ta question <ArrowRight className="w-5 h-5" /></span>
          </div>
        </Link>
        <div className="flex flex-col gap-3 justify-between">
          <PromiseTilesStack light />
          <Link to="/atelier/videos" className="flex items-center justify-between min-h-[56px] px-5 bg-white text-[15px] font-bold" style={{ fontFamily: FONT, color: CARBON, clipPath: cut(12), boxShadow: `inset 0 0 0 1px ${LINE}` }}>
            Les vidéos et les guides de l'atelier <ArrowRight className="w-5 h-5" style={{ color: GREEN }} />
          </Link>
        </div>
      </div>
    </Wrap>
  );

  // 5 · Sobre : une ligne de promesses, une ligne vers L'Atelier. Rien d'autre.
  return (
    <Wrap py="py-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-t-2 pt-6" style={{ borderColor: CARBON }}>
        <ul className="flex flex-wrap gap-x-8 gap-y-3">
          {PROMISES.map(({ icon: I, t }) => (
            <li key={t} className="flex items-center gap-2 text-base font-extrabold uppercase" style={{ fontFamily: FONT, color: CARBON }}><I className="w-5 h-5" style={{ color: GREEN }} />{t}</li>
          ))}
        </ul>
        <Link to="/atelier" className="inline-flex items-center gap-2 min-h-[44px] text-base font-extrabold uppercase underline underline-offset-4" style={{ fontFamily: FONT, color: CARBON }}>
          Une question ? L'Atelier répond <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </Wrap>
  );
};

const PromiseTilesStack = ({ light = false }: { light?: boolean }) => (
  <ul className="grid gap-3">
    {PROMISES.map(({ icon: I, t, d }) => (
      <li key={t} className="flex items-center gap-4 p-4" style={{ background: light ? "#fff" : "#242424", clipPath: cut(12), boxShadow: light ? `inset 0 0 0 1px ${LINE}` : "none" }}>
        <span className="w-12 h-12 shrink-0 flex items-center justify-center text-white" style={{ background: GREEN, clipPath: cut(8) }}><I className="w-6 h-6" /></span>
        <span><b className="block text-lg uppercase" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: light ? CARBON : "#fff" }}>{t}</b>
          <span className="text-sm" style={{ fontFamily: FONT, color: light ? "#4B5563" : "rgba(255,255,255,0.7)" }}>{d}</span></span>
      </li>
    ))}
  </ul>
);
