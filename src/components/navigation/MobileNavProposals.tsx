// 24/10/2026 — Barre du bas téléphone : 5 propositions (Nolan : « ça fait trop site classique »).
// ?barrebas=1..5 = propositions, ?barrebas=0 ou sans paramètre = barre actuelle (MobileNav).
// DA : angles coupés, Unbounded italique, Plus Jakarta, vert #4A7C59, carbone #1A1A1A. Aucun halo qui pulse.
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Package, ShoppingBag, Search, Warehouse, Plus } from "lucide-react";
import { ScooterIcon } from "@/components/Header";
import { useSelectedScooter } from "@/contexts/ScooterContext";
import { useCart } from "@/hooks/useCart";
import { useSpotlight } from "@/contexts/SpotlightContext";
import SkotAvatar from "@/components/skot/SkotAvatar";
import { skotEnabled, skotHiddenOn } from "@/lib/skot";
import { skotSaison } from "@/lib/skotSaison";

export type BarreBasVariant = 1 | 2 | 3 | 4 | 5;

// 25/10/2026 — SKOT dans la barre téléphone avec la nouvelle mascotte (Nolan : « il y a toujours l'ancien au milieu…
// on peut pas le mettre sur le côté ? cinq propositions »). ?skottel=1..5 ; sans paramètre = case actuelle (« Le pilote »).
export type SkotTelVariant = 1 | 2 | 3 | 4 | 5;
// 25/10 (Nolan : « centré comme ça, ça fait bizarre, c'est trop symétrique ») : position de « Phares au centre ».
// ?skotpos=1..5 ; ?skotpos=0 = au centre.
export type SkotPosVariant = 1 | 2 | 3 | 4 | 5;
// 25/10 (Nolan : « il sort trop… je pensais qu'il n'y aurait que ses yeux… qu'il serait dans la barre blanche ») :
// SKOT à gauche, sans cadre, tête seule. ?skotyeux=1..5 ; sans paramètre = position choisie par ?skotpos.
export type SkotYeuxVariant = 1 | 2 | 3 | 4 | 5;
export const readSkotYeuxVariant = (): SkotYeuxVariant | null => {
  try {
    // 25/10 : Nolan choisit la 2 « Rangé dans la barre » (+ animations de temps en temps) = défaut ;
    // ?skotyeux=0 = position ?skotpos (coin gauche détouré), 1..5 = les autres propositions.
    const raw = new URLSearchParams(window.location.search).get("skotyeux");
    if (raw === null) return 2;
    const n = Number(raw);
    return n >= 1 && n <= 5 ? (n as SkotYeuxVariant) : n === 0 ? null : 2;
  } catch {
    return 2;
  }
};
export const readSkotPosVariant = (): SkotPosVariant | null => {
  try {
    // 25/10 : Nolan choisit la 3 « Coin gauche », sans cadre = défaut ; ?skotpos=0 = au centre, 1..5 = les autres positions.
    const raw = new URLSearchParams(window.location.search).get("skotpos");
    if (raw === null) return 3;
    const n = Number(raw);
    return n >= 1 && n <= 5 ? (n as SkotPosVariant) : n === 0 ? null : 3;
  } catch {
    return 3;
  }
};
export const readSkotTelVariant = (): SkotTelVariant | null => {
  try {
    // 25/10 : Nolan choisit la 1 « Phares au centre » = défaut ; ?skottel=0 = ancien avatar « Le pilote », 2..5 = autres propositions.
    const raw = new URLSearchParams(window.location.search).get("skottel");
    if (raw === null) return 1;
    const n = Number(raw);
    return n >= 1 && n <= 5 ? (n as SkotTelVariant) : n === 0 ? null : 1;
  } catch {
    return 1;
  }
};
export const readBarreBasVariant = (): BarreBasVariant | null => {
  try {
    // 24/10 : Nolan valide « Repassé » avec SKOT AU CENTRE (5) = barre par défaut. Tant que SKOT est caché au public
    // (avant l'ouverture), le centre garde la loupe (1) ; il bascule seul quand SKOT_PUBLIC passe à vrai.
    // ?barrebas=0 = ancienne barre, 1..5 = forcer une proposition.
    const raw = new URLSearchParams(window.location.search).get("barrebas");
    if (raw === null) return skotEnabled() ? 5 : 1;
    const n = Number(raw);
    return n >= 1 && n <= 5 ? (n as BarreBasVariant) : n === 0 ? null : 1;
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

const Shell = ({ children, floating = false, dark = false }: { children: React.ReactNode; floating?: boolean; dark?: boolean }) => (
  <nav
    aria-label="Navigation principale"
    className={floating ? "fixed z-50 left-3 right-3 md:hidden" : "fixed z-50 bottom-0 left-0 right-0 md:hidden"}
    style={
      floating
        ? { bottom: "calc(max(env(safe-area-inset-bottom), 8px) + 6px)" }
        : {
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
  </nav>
);

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

/* 2 · Plaque — icônes seules ; l'onglet actif devient une plaque verte à angle coupé qui affiche son nom. */
const V2 = () => {
  const m = useNavModel();
  const { pieces, garage, search, trottes, cart } = m.items;
  const list = [pieces, garage, search, trottes, cart];
  const current = list.find((it) => m.active(it))?.key;
  return (
    <Shell>
      <div className="flex items-center justify-between gap-1 px-3 py-2">
        {list.map((it) => {
          const on = current === it.key;
          const I = it.icon;
          return (
            <button
              key={it.key}
              type="button"
              onClick={() => m.go(it)}
              aria-label={it.label}
              className="relative h-12 flex items-center justify-center gap-2 transition-all duration-200"
              style={{ minWidth: 48, padding: on ? "0 16px" : "0 8px", background: on ? GREEN : it.key === "search" ? CARBON : "transparent", clipPath: on || it.key === "search" ? cut(10) : undefined }}
            >
              <span className="relative"><I className="w-[22px] h-[22px]" strokeWidth={2.2} style={{ color: on || it.key === "search" ? "#FFFFFF" : CARBON }} />{it.key === "cart" && <CartCount n={m.count} />}</span>
              {on && <span className="text-[14px] italic font-extrabold text-white whitespace-nowrap" style={{ fontFamily: JAK }}>{it.label}</span>}
            </button>
          );
        })}
      </div>
    </Shell>
  );
};

/* 3 · Flottante — barre carbone détachée des bords, angles coupés, encoche verte sous l'onglet actif. */
const V3 = () => {
  const m = useNavModel();
  const { pieces, garage, search, trottes, cart } = m.items;
  const list = [pieces, garage, search, trottes, cart];
  return (
    <Shell floating>
      <div className="flex items-stretch shadow-[0_14px_30px_rgba(0,0,0,0.28)]" style={{ background: CARBON, clipPath: cut(14) }}>
        {list.map((it) => {
          const on = m.active(it);
          const I = it.icon;
          if (it.key === "search")
            return (
              <button key={it.key} type="button" onClick={() => m.go(it)} aria-label="Chercher" className="flex-1 grid place-items-center">
                <span className="w-12 h-12 grid place-items-center" style={{ background: GREEN, clipPath: cut(10) }}><Search className="w-[22px] h-[22px] text-white" strokeWidth={2.6} /></span>
              </button>
            );
          return (
            <button key={it.key} type="button" onClick={() => m.go(it)} className="relative flex-1 min-h-[64px] flex flex-col items-center justify-center gap-1">
              <span className="relative"><I className="w-[22px] h-[22px]" strokeWidth={on ? 2.4 : 1.8} style={{ color: on ? "#FFFFFF" : "rgba(255,255,255,0.55)" }} />{it.key === "cart" && <CartCount n={m.count} dark />}</span>
              <span className="text-[12px] leading-none italic" style={{ fontFamily: JAK, fontWeight: 800, color: on ? "#FFFFFF" : "rgba(255,255,255,0.55)" }}>{it.label}</span>
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[4px] transition-all duration-200" style={{ width: on ? 22 : 0, background: GREEN, transform: "translateX(-50%) skewX(-20deg)" }} />
            </button>
          );
        })}
      </div>
    </Shell>
  );
};

/* 4 · Compteur — au centre, TA trottinette détourée (ou « Ma trott + ») qui ouvre ses pièces ; recherche gardée en haut du site. */
const V4 = () => {
  const m = useNavModel();
  const { pieces, garage, trottes, cart } = m.items;
  const s = m.scooter;
  const Tab = ({ it }: { it: Item }) => {
    const on = m.active(it);
    const I = it.icon;
    return (
      <button type="button" onClick={() => m.go(it)} className="relative flex-1 min-h-[58px] flex flex-col items-center justify-center gap-1">
        <span className="relative"><I className="w-[22px] h-[22px]" strokeWidth={on ? 2.4 : 1.9} style={{ color: CARBON }} />{it.key === "cart" && <CartCount n={m.count} />}</span>
        <span className="leading-none uppercase italic tracking-tight" style={{ fontFamily: UNB, fontWeight: on ? 800 : 500, color: on ? CARBON : MUTED, fontSize: 12 }}>{it.label}</span>
        <span className="h-[3px] mt-0.5" style={{ width: on ? 18 : 0, background: GREEN, transform: "skewX(-24deg)" }} />
      </button>
    );
  };
  return (
    <Shell>
      <div className="flex items-end px-1">
        <Tab it={pieces} /><Tab it={garage} />
        <div className="flex-[1.35] flex justify-center">
          <button
            type="button"
            onClick={() => { buzz(); m.navigate(s ? `/scooter/${s.slug}` : "/trottinettes"); }}
            aria-label={s ? `Pièces pour ${s.name}` : "Choisir ma trottinette"}
            className="-mt-7 w-[92px] flex flex-col items-center"
          >
            <span className="w-[92px] h-[62px] p-[2px]" style={{ background: GREEN, clipPath: cut(12) }}>
              <span className="w-full h-full grid place-items-center" style={{ background: "#FFFFFF", clipPath: cut(11) }}>
                {s?.imageUrl ? <img src={s.imageUrl} alt="" className="h-[52px] w-auto object-contain" /> : <span className="flex items-center gap-1" style={{ color: GREEN }}><ScooterIcon className="w-7 h-7" strokeWidth={2.2} /><Plus className="w-4 h-4" strokeWidth={3} /></span>}
              </span>
            </span>
            <span className="mt-1 max-w-[92px] truncate italic uppercase" style={{ fontFamily: UNB, fontWeight: 800, fontSize: 11, color: GREEN }}>{s ? s.name : "Ma trott"}</span>
          </button>
        </div>
        <Tab it={trottes} /><Tab it={cart} />
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

/* 5 · SKOT au centre — l'avatar « Le pilote » remplace la loupe (la recherche reste dans la barre du haut) ; la bulle flottante disparaît. */
const POP_CSS = `@keyframes skl-pop{0%,70%,100%{transform:translateY(0) scale(1)}76%{transform:translateY(-10px) scale(1.12) rotate(-5deg)}84%{transform:translateY(0) scale(.96) rotate(3deg)}90%{transform:translateY(-3px) scale(1) rotate(0)}}
.skl-pop{animation:skl-pop 3.8s 1s ease-in-out infinite}@media (prefers-reduced-motion:reduce){.skl-pop{animation:none}}`;
let popInjected = false;

const TEL_CSS = `@keyframes skt-wink{0%,86%,100%{opacity:0}88%,96%{opacity:1}}
@keyframes skt-peek{0%{transform:translateX(70%)}100%{transform:translateX(0)}}
@keyframes skt-tab{0%,100%{transform:translateX(0)}50%{transform:translateX(-4px)}}
@keyframes skt-bubble{0%,8%{opacity:0;transform:translateY(6px) scale(.9)}14%,40%{opacity:1;transform:none}46%,100%{opacity:0;transform:translateY(6px) scale(.9)}}
.skt-wink{animation:skt-wink 4.5s 1.5s infinite}
.skt-peek{animation:skt-peek .7s .3s cubic-bezier(.2,.9,.3,1.2) both}
.skt-tab{animation:skt-tab 2.8s ease-in-out infinite}
.skt-bubble{animation:skt-bubble 11s 2s ease-in-out infinite}
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
@media (prefers-reduced-motion:reduce){.skt-wink,.skt-peek,.skt-tab,.skt-bubble,.skx-coucou,.skx-coucou .skx-clin,.skx-bond,.skx-curieux,.skx-dring,.skx-dring-txt,.skx-question,.skx-bulle{animation:none}}`;

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
const BAR_TOP = "calc(max(env(safe-area-inset-bottom), 6px) + 58px)";
const restBody = () => { const s = skotSaison(); return s ? `/skot/p-${s}.webp` : "/skot/skot-ecoute.webp"; };

/* Tête de la mascotte (phares), avec un clin d'œil de temps en temps. */
const TeteSkot = ({ size }: { size: number }) => (
  <span className="relative block" style={{ width: size, height: size }}>
    <img src="/skot/tete-ecoute.webp" alt="" draggable={false} className="absolute inset-0 w-full h-full object-cover select-none" style={{ transform: "scale(1.15) translateY(6%)" }} />
    <img src="/skot/tete-clin.webp" alt="" draggable={false} className="absolute inset-0 w-full h-full object-cover select-none skt-wink" style={{ transform: "scale(1.15) translateY(6%)", opacity: 0 }} />
  </span>
);

const V5 = () => {
  if (!popInjected && typeof document !== "undefined") { const el = document.createElement("style"); el.textContent = POP_CSS; document.head.appendChild(el); popInjected = true; }
  if (!telInjected && typeof document !== "undefined") { const el = document.createElement("style"); el.textContent = TEL_CSS; document.head.appendChild(el); telInjected = true; }
  const m = useNavModel();
  const { pieces, garage, trottes, cart, search } = m.items;
  // Tant que SKOT est caché au public (avant l'ouverture), le bouton retombe sur la recherche.
  const { pathname } = useLocation();
  // Panier, paiement, admin : SKOT y est masqué → le bouton central ouvre la recherche.
  const skotHere = skotEnabled() && !skotHiddenOn(pathname);
  const openSkot = () => { buzz(); if (skotHere) window.dispatchEvent(new Event("skot:open")); else m.openSpotlight(); };
  const tab = (it: Item) => <TabBtn key={it.key} it={it} on={m.active(it)} onGo={m.go} count={m.count} />;
  const out = useSkotOut();
  const [tel] = useState(readSkotTelVariant);
  const [pos] = useState(readSkotPosVariant);
  const [yeux] = useState(readSkotYeuxVariant);
  const [saison] = useState(() => skotSaison());
  const play = useSkotPlay(out);
  const [body] = useState(restBody);
  const lift = { transform: out ? "translateY(0) scale(1)" : "translateY(22px) scale(0.82)", transition: "transform .38s cubic-bezier(.2,.9,.3,1.25)" };
  const label = <span className="-mt-2 relative px-2 py-0.5 text-white italic uppercase" style={{ background: GREEN, fontFamily: UNB, fontWeight: 800, fontSize: 11, clipPath: cutTR(6), opacity: out ? 1 : 0, transition: "opacity .2s" }}>SKOT</span>;
  const loupe = (
    <div className="flex-1 flex justify-center">
      <button type="button" onClick={() => m.go(search)} aria-label="Chercher" className="-mt-5 w-[58px] h-[58px] grid place-items-center shadow-[0_6px_14px_rgba(74,124,89,0.35)]" style={{ background: GREEN, clipPath: cut(12) }}>
        <Search className="w-6 h-6 text-white" strokeWidth={2.6} />
      </button>
    </div>
  );

  /* 1 · Phares au centre — même case qu'aujourd'hui, la tête de la nouvelle mascotte (phares) qui fait des clins d'œil. */
  /* Bouton SKOT « phares » partagé par les positions. */
  const skotBtn = (size = 66, cls = "-mt-8") => (
    <button type="button" onClick={openSkot} aria-label="Demander à SKOT" className={`${cls} flex flex-col items-center`} style={lift}>
      <span className="p-[2px]" style={{ width: size, height: size, background: CARBON, clipPath: cut(12) }}>
        <span className="w-full h-full grid place-items-center overflow-hidden" style={{ background: "#F5F0E8", clipPath: cut(11) }}><TeteSkot size={size - 4} /></span>
      </span>
      {label}
    </button>
  );

  /* Tête seule (bandeau phares + guidon), tenue de saison incluse ; clin d'œil de temps en temps hors saison. */
  const yeuxEl = (h: number) => (
    <span className="relative block" style={{ height: h, width: Math.round(h * (saison === "fete" ? 2.6 : 1.9)) }}>
      <img src={`/skot/yeux-${saison ?? "ecoute"}.webp`} alt="" draggable={false} className="absolute inset-0 w-full h-full object-contain select-none" />
      {!saison && <img src="/skot/yeux-clin.webp" alt="" draggable={false} className="absolute inset-0 w-full h-full object-contain select-none skt-wink" style={{ opacity: 0 }} />}
    </span>
  );
  const tag = <span className="px-1.5 py-[1px] text-white italic uppercase leading-none" style={{ background: GREEN, fontFamily: UNB, fontWeight: 800, fontSize: 10, clipPath: cutTR(5) }}>SKOT</span>;

  if (tel === 1 && yeux) {
    const rest = <>{tab(pieces)}{tab(garage)}{tab(trottes)}{tab(cart)}</>;
    /* 1 · Que les yeux — la tête est dans la case de gauche, seuls les phares dépassent un peu du haut de la barre. */
    if (yeux === 1)
      return (
        <Shell>
          <div className="flex items-end pr-1">
            <button type="button" onClick={openSkot} aria-label="Demander à SKOT" className="flex-none w-[96px] h-[58px] flex flex-col items-center justify-end pb-1">
              <span className="-mt-4 block transition-transform duration-300" style={{ transform: out ? "translateY(-10px)" : "translateY(0)" }}>{yeuxEl(44)}</span>
              <span className="mt-0.5">{tag}</span>
            </button>
            {rest}
          </div>
        </Shell>
      );
    /* 2 · Rangé dans la barre — la tête tient entière dans la barre, comme un onglet, avec son nom dessous. */
    if (yeux === 2)
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
            {rest}
          </div>
        </Shell>
      );
    /* 3 · Derrière le mur — la tête est derrière la barre : on ne voit que les phares qui regardent par-dessus. Elle se cache en défilant. */
    if (yeux === 3)
      return (
        <>
          {skotHere && (
            <button type="button" onClick={openSkot} aria-label="Demander à SKOT" className="md:hidden fixed z-[49] left-2"
              style={{ bottom: "calc(max(env(safe-area-inset-bottom), 6px) + 38px)", transform: out ? "translateY(0)" : "translateY(30px)", transition: "transform .4s cubic-bezier(.2,.9,.3,1.25)" }}>
              {yeuxEl(50)}
            </button>
          )}
          <Shell>
            <div className="flex items-end pr-1">
              <button type="button" onClick={openSkot} aria-label="Demander à SKOT" tabIndex={-1} className="flex-none w-[96px] min-h-[56px] flex items-end justify-center pb-2">{tag}</button>
              {rest}
            </div>
          </Shell>
        </>
      );
    /* 4 · Phare rond — la tête dans un rond crème, sans cadre noir, qui dépasse à peine de la barre. */
    if (yeux === 4)
      return (
        <Shell>
          <div className="flex items-end pr-1">
            <button type="button" onClick={openSkot} aria-label="Demander à SKOT" className="flex-none w-[84px] flex flex-col items-center pb-1" style={lift}>
              <span className="-mt-3 grid place-items-center w-[56px] h-[56px] rounded-full overflow-hidden" style={{ background: "#F5F0E8", boxShadow: `inset 0 0 0 2px ${GREEN}` }}>{yeuxEl(34)}</span>
              <span className="-mt-1.5 relative">{tag}</span>
            </button>
            {rest}
          </div>
        </Shell>
      );
    /* 5 · Il parle — la tête dans la barre, et une petite bulle « Une question ? » qui apparaît de temps en temps au-dessus. */
    return (
      <Shell>
        <div className="flex items-end pr-1">
          <button type="button" onClick={openSkot} aria-label="Demander à SKOT" className="relative flex-none w-[84px] min-h-[56px] flex flex-col items-center justify-center gap-0.5">
            {skotHere && (
              <span className="absolute left-2 bottom-[60px] skt-bubble p-[1.5px] pointer-events-none" style={{ background: CARBON, clipPath: cutTR(8) }}>
                <span className="block bg-white px-2.5 py-1 text-[14px] font-extrabold italic whitespace-nowrap" style={{ fontFamily: JAK, color: CARBON, clipPath: cutTR(7.5) }}>Une question ?</span>
              </span>
            )}
            {yeuxEl(30)}
            <span className="text-[14px] leading-none italic" style={{ fontFamily: JAK, fontWeight: 800, color: GREEN }}>SKOT</span>
          </button>
          {rest}
        </div>
      </Shell>
    );
  }

  if (tel === 1) {
    /* Position 1 · À gauche — SKOT en première case, puis les 4 onglets ; la loupe reste dans la barre du haut. */
    if (pos === 1)
      return (
        <Shell>
          <div className="flex items-end pl-2 pr-1">
            <div className="flex-none w-[76px] flex justify-start">{skotBtn()}</div>
            {tab(pieces)}{tab(garage)}{tab(trottes)}{tab(cart)}
          </div>
        </Shell>
      );
    /* Position 2 · À gauche + loupe — SKOT en première case, la loupe revient au milieu des onglets. */
    if (pos === 2)
      return (
        <Shell>
          <div className="flex items-end pl-2 pr-1">
            <div className="flex-none w-[76px] flex justify-start">{skotBtn()}</div>
            {tab(pieces)}{tab(garage)}{tab(search)}{tab(trottes)}{tab(cart)}
          </div>
        </Shell>
      );
    /* Position 3 · Coin gauche (choix de Nolan 25/10, sans cadre « comme sur le site ») — SKOT lui-même, détouré,
       sort du coin gauche de la barre : le bas de la patinette reste caché derrière la barre, il rentre quand on
       fait défiler vers le bas et ressort à l'arrêt. Tenue de saison incluse. */
    if (pos === 3)
      return (
        <>
          {skotHere && (
            <button
              type="button"
              onClick={openSkot}
              aria-label="Demander à SKOT"
              className="md:hidden fixed z-[49] -left-3 w-[150px] h-[150px]"
              style={{
                bottom: "calc(max(env(safe-area-inset-bottom), 6px) + 4px)",
                transform: out ? "translateY(0)" : "translateY(84px)",
                transition: "transform .45s cubic-bezier(.2,.9,.3,1.25)",
              }}
            >
              <img src={body} alt="" draggable={false} className={`block w-full h-full select-none ${out ? "skl-pop" : ""}`} style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,.18))" }} />
            </button>
          )}
          <Shell>
            <div className="flex items-end pr-1">
              <div className="flex-none w-[84px] h-[58px] flex items-end justify-start pl-2 pb-1.5">
                {skotHere && (
                  <button type="button" onClick={openSkot} aria-label="Demander à SKOT" tabIndex={-1} className="px-2 py-0.5 text-white italic uppercase" style={{ background: GREEN, fontFamily: UNB, fontWeight: 800, fontSize: 11, clipPath: cutTR(6) }}>SKOT</button>
                )}
              </div>
              {tab(pieces)}{tab(garage)}{tab(trottes)}{tab(cart)}
            </div>
          </Shell>
        </>
      );
    /* Position 4 · Îlot à gauche — SKOT dans sa propre plaque carbone à gauche, la barre des 4 onglets à côté : deux blocs, pas un. */
    if (pos === 4)
      return (
        <Shell>
          <div className="flex items-end gap-2 pl-2 pr-1">
            <button type="button" onClick={openSkot} aria-label="Demander à SKOT" className="flex-none -mt-3 mb-1 flex items-center gap-2 pl-1 pr-3 h-[56px]" style={{ background: CARBON, clipPath: cutTR(12) }}>
              <span className="block overflow-hidden" style={{ width: 48, height: 48, background: "#F5F0E8", clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)" }}><TeteSkot size={48} /></span>
              <span className="text-white italic uppercase leading-none text-left" style={{ fontFamily: UNB, fontWeight: 900, fontSize: 14 }}>SKOT<span className="block mt-0.5 normal-case not-italic font-semibold text-[11px] text-white/70" style={{ fontFamily: JAK }}>Une question ?</span></span>
            </button>
            {tab(pieces)}{tab(garage)}{tab(trottes)}{tab(cart)}
          </div>
        </Shell>
      );
    /* Position 5 · À droite — SKOT en dernière case, sous le pouce droit ; Pièces, Garage, Trottes, Panier à gauche. */
    if (pos === 5)
      return (
        <Shell>
          <div className="flex items-end pl-1 pr-2">
            {tab(pieces)}{tab(garage)}{tab(trottes)}{tab(cart)}
            <div className="flex-none w-[76px] flex justify-end">{skotBtn()}</div>
          </div>
        </Shell>
      );
    /* 1 · Phares au centre — même case qu'aujourd'hui, la tête de la nouvelle mascotte (phares) qui fait des clins d'œil. */
    return (
      <Shell>
        <div className="flex items-end px-1">
          {tab(pieces)}{tab(garage)}
          <div className="flex-1 flex justify-center">{skotBtn()}</div>
          {tab(trottes)}{tab(cart)}
        </div>
      </Shell>
    );
  }

  /* 2 · Debout au centre — SKOT en entier, sans cadre, debout sur la barre (tenue de saison incluse). */
  if (tel === 2)
    return (
      <Shell>
        <div className="flex items-end px-1">
          {tab(pieces)}{tab(garage)}
          <div className="flex-1 flex justify-center">
            <button type="button" onClick={openSkot} aria-label="Demander à SKOT" className="-mt-14 flex flex-col items-center" style={lift}>
              <img src={body} alt="" draggable={false} className={`w-[92px] h-[92px] select-none ${out ? "skl-pop" : ""}`} style={{ filter: "drop-shadow(0 6px 6px rgba(0,0,0,.2))" }} />
              <span className="-mt-3">{label}</span>
            </button>
          </div>
          {tab(trottes)}{tab(cart)}
        </div>
      </Shell>
    );

  /* 3 · Loupe au centre, SKOT au bord — la loupe revient au milieu ; SKOT sort à moitié du bord droit, posé sur la barre. */
  if (tel === 3)
    return (
      <>
        <Shell>
          <div className="flex items-end px-1">{tab(pieces)}{tab(garage)}{loupe}{tab(trottes)}{tab(cart)}</div>
        </Shell>
        {skotHere && (
          <button type="button" onClick={openSkot} aria-label="Demander à SKOT" className="md:hidden fixed z-[49] right-0 skt-peek" style={{ bottom: `calc(${BAR_TOP} - 14px)` }}>
            <span className="block transition-transform duration-300" style={{ transform: out ? "translateX(18%)" : "translateX(70%)" }}>
              <img src={body} alt="" draggable={false} className="w-[104px] h-[104px] select-none" style={{ transform: "scaleX(-1)", filter: "drop-shadow(0 6px 8px rgba(0,0,0,.22))" }} />
            </span>
          </button>
        )}
      </>
    );

  /* 4 · Duo au centre — une seule plaque au milieu : la loupe à gauche, SKOT à droite. Les deux à un toucher. */
  if (tel === 4)
    return (
      <Shell>
        <div className="flex items-end px-1">
          {tab(pieces)}{tab(garage)}
          <div className="flex-[1.6] flex justify-center">
            <span className="-mt-6 p-[2px] flex" style={{ background: CARBON, clipPath: cut(12), ...lift }}>
              <button type="button" onClick={() => m.go(search)} aria-label="Chercher" className="w-[54px] h-[58px] grid place-items-center" style={{ background: GREEN }}>
                <Search className="w-6 h-6 text-white" strokeWidth={2.6} />
              </button>
              <button type="button" onClick={openSkot} aria-label="Demander à SKOT" className="w-[58px] h-[58px] grid place-items-center overflow-hidden" style={{ background: "#F5F0E8", clipPath: "polygon(0 0, calc(100% - 11px) 0, 100% 11px, 100% 100%, 0 100%)" }}>
                <TeteSkot size={58} />
              </button>
            </span>
          </div>
          {tab(trottes)}{tab(cart)}
        </div>
      </Shell>
    );

  /* 5 · Languette sur le côté — la loupe revient au milieu ; SKOT vit dans une languette collée au bord droit de l'écran,
     à mi-hauteur, et dit « Une question ? » de temps en temps. */
  if (tel === 5)
    return (
      <>
        <Shell>
          <div className="flex items-end px-1">{tab(pieces)}{tab(garage)}{loupe}{tab(trottes)}{tab(cart)}</div>
        </Shell>
        {skotHere && (
          <div className="md:hidden fixed z-[49] right-0 flex items-center pointer-events-none" style={{ bottom: "calc(max(env(safe-area-inset-bottom), 6px) + 150px)" }}>
            <span className="skt-bubble mr-1.5 p-[1.5px]" style={{ background: CARBON, clipPath: cutTR(8) }}>
              <span className="block bg-white px-2.5 py-1.5 text-[14px] font-extrabold italic whitespace-nowrap" style={{ fontFamily: JAK, color: CARBON, clipPath: cutTR(7.5) }}>Une question ?</span>
            </span>
            <button type="button" onClick={openSkot} aria-label="Demander à SKOT" className="pointer-events-auto skt-tab flex flex-col items-center pl-1.5 pr-1 pt-1.5 pb-1" style={{ background: GREEN, clipPath: "polygon(12px 0, 100% 0, 100% 100%, 0 100%, 0 12px)", opacity: out ? 1 : 0.55, transition: "opacity .3s" }}>
              <span className="block bg-[#F5F0E8] overflow-hidden" style={{ clipPath: "polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px)" }}><TeteSkot size={52} /></span>
              <span className="mt-1 text-white italic uppercase leading-none" style={{ fontFamily: UNB, fontWeight: 800, fontSize: 11 }}>SKOT</span>
            </button>
          </div>
        )}
      </>
    );

  return (
    <Shell>
      <div className="flex items-end px-1">
        {tab(pieces)}{tab(garage)}
        <div className="flex-1 flex justify-center">
          <button
            type="button"
            onClick={openSkot}
            aria-label="Demander à SKOT"
            className="-mt-8 flex flex-col items-center"
            style={lift}
          >
            <span className="w-[64px] h-[64px] p-[2px]" style={{ background: CARBON, clipPath: cut(12) }}>
              <span className="w-full h-full grid place-items-center overflow-hidden" style={{ background: "#FFFFFF", clipPath: cut(11) }}><span className={out ? "skl-pop block" : "block"}><SkotAvatar size={54} /></span></span>
            </span>
            {label}
          </button>
        </div>
        {tab(trottes)}{tab(cart)}
      </div>
    </Shell>
  );
};

const MobileNavProposals = ({ variant }: { variant: BarreBasVariant }) => {
  if (variant === 1) return <V1 />;
  if (variant === 2) return <V2 />;
  if (variant === 3) return <V3 />;
  if (variant === 4) return <V4 />;
  return <V5 />;
};

export default MobileNavProposals;
