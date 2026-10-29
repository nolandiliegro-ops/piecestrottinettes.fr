// Barre du bas téléphone (24-25/10/2026).
// Défaut : 1 « Repassé » (loupe au centre) tant que SKOT est caché au public, 5 « SKOT dans la barre » dès que SKOT_PUBLIC passe à vrai.
// ?barrebas=0 = ancienne barre (MobileNav), ?barrebas=1|5 = forcer l'une des deux. Les propositions 2, 3, 4 ont été retirées du code (25/10).
// DA : angles coupés, Unbounded italique, Plus Jakarta, vert #4A7C59, carbone #1A1A1A. Aucun halo qui pulse.
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Package, ShoppingBag, Search, Warehouse } from "lucide-react";
import { ScooterIcon } from "@/components/Header";
import { useSelectedScooter } from "@/contexts/ScooterContext";
import { useCart } from "@/hooks/useCart";
import { useSpotlight } from "@/contexts/SpotlightContext";
import { skotEnabled, skotHiddenOn } from "@/lib/skot";
import { skotSaison } from "@/lib/skotSaison";
import { useKeyboardOpen } from "@/hooks/useKeyboardOpen";

export type BarreBasVariant = 1 | 5;
export const readBarreBasVariant = (): BarreBasVariant | null => {
  try {
    // Tant que SKOT est caché au public (avant l'ouverture), la loupe (1) ; SKOT dans la barre (5) dès que SKOT_PUBLIC passe à vrai.
    // ?barrebas=0 = ancienne barre ; 2, 3, 4 (propositions retirées) retombent sur 1.
    const raw = new URLSearchParams(window.location.search).get("barrebas");
    if (raw === null) return skotEnabled() ? 5 : 1;
    const n = Number(raw);
    return n === 5 ? 5 : n === 0 ? null : 1;
  } catch {
    return 1;
  }
};

const GREEN = "#4A7C59";
const CARBON = "#1A1A1A";
const STONE = "#FAFAF8";
const MUTED = "#6B6B6B";
const UNB = "'Unbounded', sans-serif";
const JAK = "'Plus Jakarta Sans', sans-serif";
const cut = (n: number) => `polygon(0 0, calc(100% - ${n}px) 0, 100% ${n}px, 100% 100%, ${n}px 100%, 0 calc(100% - ${n}px))`;
const cutTR = (n: number) => `polygon(0 0, calc(100% - ${n}px) 0, 100% ${n}px, 100% 100%, 0 100%)`;

const buzz = () => { try { if ("vibrate" in navigator) navigator.vibrate(10); } catch { /* rien */ } };

type Item = { key: string; icon: React.ElementType; label: string; path?: string; run?: () => void };

const useNavModel = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { selectedScooter } = useSelectedScooter();
  const { setIsOpen: openCart, totals } = useCart();
  const { openSpotlight } = useSpotlight();
  const go = (it: Item) => { buzz(); if (it.run) it.run(); else if (it.path) navigate(it.path); };
  const active = (it: Item) => !!it.path && (pathname === it.path || (it.path !== "/" && pathname.startsWith(it.path + "/")));
  const items = {
    pieces: { key: "pieces", icon: Package, label: "Pièces", path: "/catalogue" } as Item,
    garage: { key: "garage", icon: Warehouse, label: "Garage", path: "/garage" } as Item,
    trottes: { key: "trottes", icon: ScooterIcon, label: "Trottes", path: "/trottinettes" } as Item,
    search: { key: "search", icon: Search, label: "Chercher", run: () => openSpotlight() } as Item,
    cart: { key: "cart", icon: ShoppingBag, label: "Panier", run: () => openCart(true) } as Item,
  };
  return { items, go, active, count: totals.itemCount, scooter: selectedScooter, navigate, openSpotlight };
};

const CartCount = ({ n, dark = false }: { n: number; dark?: boolean }) =>
  n > 0 ? (
    <span
      className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 grid place-items-center text-[11px] font-extrabold"
      style={{ background: dark ? "#FFFFFF" : GREEN, color: dark ? CARBON : "#FFFFFF", clipPath: cutTR(5), fontFamily: JAK }}
    >
      {n > 99 ? "99+" : n}
    </span>
  ) : null;

// 25/10 soir : clavier ouvert, la barre restait collée au-dessus du clavier et mangeait la place des résultats → rangée.
const Shell = ({ children, floating = false, dark = false }: { children: React.ReactNode; floating?: boolean; dark?: boolean }) => {
  const kb = useKeyboardOpen();
  if (kb) return null;
  return (
  <nav
    aria-label="Navigation principale"
    className={floating ? "fixed z-50 left-3 right-3 md:hidden" : "fixed z-50 bottom-0 left-0 right-0 md:hidden"}
    style={
      floating
        ? { bottom: "calc(max(env(safe-area-inset-bottom), 8px) + 6px - var(--pt-vv-gap, 0px))" }
        : {
            // 29/10 : suit le bas réellement visible quand la barre de Chrome/Safari se replie (useIosViewportFix).
            bottom: "calc(0px - var(--pt-vv-gap, 0px))",
            paddingBottom: "max(env(safe-area-inset-bottom), 6px)",
            background: dark ? CARBON : STONE,
            borderTop: dark ? "none" : "1px solid rgba(26,26,26,0.12)",
            // 24/10 (Nolan : « elle bouge quand je navigue ») : calque propre, jamais recalculé avec la page (Safari iPhone).
            transform: "translate3d(0,0,0)",
            WebkitTransform: "translate3d(0,0,0)",
            backfaceVisibility: "hidden",
            willChange: "transform",
          }
    }
  >
    {children}
    {/* 29/10 : filet de sécurité — si Chrome/Safari iPhone laisse quand même un écart sous la barre, il est rempli par
        la couleur de la barre (le contenu ne se voit plus dessous). Hors écran quand tout va bien. */}
    {!floating && <span aria-hidden className="absolute left-0 right-0 top-full h-[240px] pointer-events-auto" style={{ background: dark ? CARBON : STONE }} />}
  </nav>
  );
};

/* Onglet partagé, défini hors des barres : un composant recréé à chaque rendu se remonte à chaque changement de page (clignement). */
const TabBtn = ({ it, on, onGo, count, bar = false }: { it: Item; on: boolean; onGo: (it: Item) => void; count: number; bar?: boolean }) => {
  const I = it.icon;
  return (
    <button type="button" onClick={() => onGo(it)} className="relative flex-1 min-h-[56px] flex flex-col items-center justify-center gap-1">
      {bar && <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] transition-[width] duration-200" style={{ width: on ? 28 : 0, background: GREEN }} />}
      <span className="relative"><I className="w-[22px] h-[22px]" strokeWidth={on ? 2.4 : 1.9} style={{ color: on ? GREEN : CARBON }} />{it.key === "cart" && <CartCount n={count} />}</span>
      <span className="text-[14px] leading-none italic" style={{ fontFamily: JAK, fontWeight: on ? 800 : 600, color: on ? GREEN : MUTED }}>{it.label}</span>
    </button>
  );
};

/* 1 · Repassé — même disposition, nouvelle DA : filet vert sur l'onglet actif, bouton central à angle coupé. */
const V1 = () => {
  const m = useNavModel();
  const { pieces, garage, search, trottes, cart } = m.items;
  const tab = (it: Item) => <TabBtn key={it.key} it={it} on={m.active(it)} onGo={m.go} count={m.count} bar />;
  return (
    <Shell>
      <div className="flex items-end px-1">
        {tab(pieces)}{tab(garage)}
        <div className="flex-1 flex justify-center">
          <button type="button" onClick={() => m.go(search)} aria-label="Chercher" className="-mt-5 w-[58px] h-[58px] grid place-items-center shadow-[0_6px_14px_rgba(74,124,89,0.35)]" style={{ background: GREEN, clipPath: cut(12) }}>
            <Search className="w-6 h-6 text-white" strokeWidth={2.6} />
          </button>
        </div>
        {tab(trottes)}{tab(cart)}
      </div>
    </Shell>
  );
};

/* SKOT rentre dans la barre quand on fait défiler vers le bas, ressort à l'arrêt (0,9 s) ou en remontant. */
const useSkotOut = () => {
  const [out, setOut] = useState(true);
  const last = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const { pathname } = useLocation();
  useEffect(() => { setOut(true); }, [pathname]);
  useEffect(() => {
    last.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - last.current;
      last.current = y;
      if (dy > 4 && y > 40) setOut(false);
      else if (dy < -4) setOut(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setOut(true), 900);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); if (timer.current) clearTimeout(timer.current); };
  }, []);
  return out;
};

const TEL_CSS = `@keyframes skt-wink{0%,86%,100%{opacity:0}88%,96%{opacity:1}}
.skt-wink{animation:skt-wink 4.5s 1.5s infinite}
@keyframes skx-coucou{0%{transform:translateY(0)}18%{transform:translateY(-28px)}26%{transform:translateY(-24px) rotate(-6deg)}34%,70%{transform:translateY(-26px) rotate(0)}100%{transform:translateY(0)}}
@keyframes skx-clin{0%,30%{opacity:0}34%,62%{opacity:1}66%,100%{opacity:0}}
@keyframes skx-bond{0%{transform:translateY(0) scale(1,1)}12%{transform:translateY(2px) scale(1.15,.8)}32%{transform:translateY(-34px) scale(.9,1.12) rotate(-8deg)}50%{transform:translateY(0) scale(1.12,.86)}64%{transform:translateY(-12px) scale(.96,1.05) rotate(4deg)}80%{transform:translateY(0) scale(1.04,.96)}100%{transform:none}}
@keyframes skx-curieux{0%{transform:none}22%{transform:translate(14px,-16px) rotate(14deg)}30%{transform:translate(16px,-18px) rotate(10deg)}38%{transform:translate(14px,-16px) rotate(16deg)}70%{transform:translate(15px,-17px) rotate(13deg)}100%{transform:none}}
@keyframes skx-dring{0%,100%{transform:none}10%,30%,50%,70%{transform:translateY(-6px) rotate(-7deg)}20%,40%,60%,80%{transform:translateY(-6px) rotate(7deg)}}
@keyframes skx-dring-txt{0%{opacity:0;transform:translateY(4px) scale(.8)}15%,70%{opacity:1;transform:translateY(-10px) scale(1)}100%{opacity:0;transform:translateY(-20px) scale(1)}}
@keyframes skx-question{0%{transform:none}15%,85%{transform:translateY(-14px)}100%{transform:none}}
@keyframes skx-bulle{0%,10%{opacity:0;transform:translateY(6px) scale(.85)}20%,80%{opacity:1;transform:none}92%,100%{opacity:0;transform:translateY(4px) scale(.9)}}
.skx-coucou{animation:skx-coucou 2.2s cubic-bezier(.3,1.4,.5,1) both}
.skx-coucou .skx-clin{animation:skx-clin 2.2s both}
.skx-bond{transform-origin:50% 100%;animation:skx-bond 1.3s ease-out both}
.skx-curieux{transform-origin:30% 100%;animation:skx-curieux 2.4s ease-in-out both}
.skx-dring{transform-origin:50% 90%;animation:skx-dring 1.2s ease-in-out both}
.skx-dring-txt{animation:skx-dring-txt 1.6s ease-out both}
.skx-question{animation:skx-question 3.2s cubic-bezier(.3,1.3,.5,1) both}
.skx-bulle{animation:skx-bulle 3.2s ease-out both}
@media (prefers-reduced-motion:reduce){.skt-wink,.skx-coucou,.skx-coucou .skx-clin,.skx-bond,.skx-curieux,.skx-dring,.skx-dring-txt,.skx-question,.skx-bulle{animation:none}}`;

/* 25/10 (Nolan : « on le laisse dans la barre… parfois tu l'animes, il sort un peu, d'un coup ») :
   de temps en temps (16 à 26 s, jamais pendant qu'on fait défiler), SKOT joue une de ses 5 animations.
   ?skotanim=coucou|bond|curieux|dring|question = la rejouer en boucle (aperçu). */
type SkotAnim = "coucou" | "bond" | "curieux" | "dring" | "question";
const SKOT_ANIMS: SkotAnim[] = ["coucou", "bond", "curieux", "dring", "question"];
const SKOT_ANIM_MS: Record<SkotAnim, number> = { coucou: 2200, bond: 1300, curieux: 2400, dring: 1600, question: 3200 };
const useSkotPlay = (out: boolean) => {
  const [play, setPlay] = useState<{ a: SkotAnim; n: number } | null>(null);
  const outRef = useRef(out);
  outRef.current = out;
  useEffect(() => {
    let forced: SkotAnim | null = null;
    try { const q = new URLSearchParams(window.location.search).get("skotanim"); if (q && (SKOT_ANIMS as string[]).includes(q)) forced = q as SkotAnim; } catch { /* rien */ }
    let n = 0;
    let t: ReturnType<typeof setTimeout>;
    let last: SkotAnim | null = null;
    const next = (ms: number) => { t = setTimeout(go, ms); };
    const go = () => {
      if (!outRef.current || document.hidden) return next(4000);
      let a = forced ?? SKOT_ANIMS[Math.floor(Math.random() * SKOT_ANIMS.length)];
      if (!forced && a === last) a = SKOT_ANIMS[(SKOT_ANIMS.indexOf(a) + 1) % SKOT_ANIMS.length];
      last = a;
      n += 1;
      setPlay({ a, n });
      t = setTimeout(() => { setPlay(null); next(forced ? 1200 : 16000 + Math.random() * 10000); }, SKOT_ANIM_MS[a]);
    };
    next(forced ? 800 : 6000);
    return () => clearTimeout(t);
  }, []);
  return play;
};
let telInjected = false;

/* 5 · SKOT dans la barre (choix de Nolan 25/10 : « tu le ranges dans la barre, mais parfois tu l'animes, il sort un peu ») —
   la tête de la mascotte (tenue de saison incluse) en première case avec son nom, puis Pièces, Garage, Trottes, Panier ;
   la loupe reste dans la barre du haut. Panier, paiement, admin : SKOT y est masqué → la case ouvre la recherche. */
const V5 = () => {
  if (!telInjected && typeof document !== "undefined") { const el = document.createElement("style"); el.textContent = TEL_CSS; document.head.appendChild(el); telInjected = true; }
  const m = useNavModel();
  const { pieces, garage, trottes, cart } = m.items;
  const { pathname } = useLocation();
  const skotHere = skotEnabled() && !skotHiddenOn(pathname);
  const openSkot = () => { buzz(); if (skotHere) window.dispatchEvent(new Event("skot:open")); else m.openSpotlight(); };
  const tab = (it: Item) => <TabBtn key={it.key} it={it} on={m.active(it)} onGo={m.go} count={m.count} />;
  const out = useSkotOut();
  const [saison] = useState(() => skotSaison());
  const play = useSkotPlay(out);

  /* Tête seule (bandeau phares + guidon), tenue de saison incluse ; clin d'œil de temps en temps hors saison.
     Une fonction et pas un composant : un composant défini ici se remonterait à chaque rendu. */
  const yeuxEl = (h: number) => (
    <span className="relative block" style={{ height: h, width: Math.round(h * (saison === "fete" ? 2.6 : 1.9)) }}>
      <img src={`/skot/yeux-${saison ?? "ecoute"}.webp`} alt="" draggable={false} className="absolute inset-0 w-full h-full object-contain select-none" />
      {!saison && <img src="/skot/yeux-clin.webp" alt="" draggable={false} className="absolute inset-0 w-full h-full object-contain select-none skt-wink" style={{ opacity: 0 }} />}
    </span>
  );

  return (
    <Shell>
      <div className="flex items-end pr-1">
        <button type="button" onClick={openSkot} aria-label="Demander à SKOT" className="relative flex-none w-[84px] min-h-[56px] flex flex-col items-center justify-center gap-0.5">
          {play?.a === "dring" && <span key={`d${play.n}`} className="absolute left-1/2 -ml-6 bottom-[46px] skx-dring-txt pointer-events-none text-[14px] font-extrabold italic uppercase whitespace-nowrap" style={{ fontFamily: UNB, color: GREEN }}>Dring !</span>}
          {play?.a === "question" && skotHere && (
            <span key={`q${play.n}`} className="absolute left-2 bottom-[62px] skx-bulle p-[1.5px] pointer-events-none" style={{ background: CARBON, clipPath: cutTR(8) }}>
              <span className="block bg-white px-2.5 py-1 text-[14px] font-extrabold italic whitespace-nowrap" style={{ fontFamily: JAK, color: CARBON, clipPath: cutTR(7.5) }}>Une question ?</span>
            </span>
          )}
          <span key={play ? `a${play.n}` : "repos"} className={`relative block ${play ? `skx-${play.a}` : ""}`}>
            {yeuxEl(30)}
            {play?.a === "coucou" && !saison && <img src="/skot/yeux-clin.webp" alt="" draggable={false} className="skx-clin absolute inset-0 w-full h-full object-contain select-none" style={{ opacity: 0 }} />}
          </span>
          <span className="text-[14px] leading-none italic" style={{ fontFamily: JAK, fontWeight: 800, color: GREEN }}>SKOT</span>
        </button>
        {tab(pieces)}{tab(garage)}{tab(trottes)}{tab(cart)}
      </div>
    </Shell>
  );
};

const MobileNavProposals = ({ variant }: { variant: BarreBasVariant }) => (variant === 5 ? <V5 /> : <V1 />);

export default MobileNavProposals;
