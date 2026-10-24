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

export type BarreBasVariant = 1 | 2 | 3 | 4 | 5;
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

const V5 = () => {
  if (!popInjected && typeof document !== "undefined") { const el = document.createElement("style"); el.textContent = POP_CSS; document.head.appendChild(el); popInjected = true; }
  const m = useNavModel();
  const { pieces, garage, trottes, cart } = m.items;
  // Tant que SKOT est caché au public (avant l'ouverture), le bouton retombe sur la recherche.
  const { pathname } = useLocation();
  // Panier, paiement, admin : SKOT y est masqué → le bouton central ouvre la recherche.
  const openSkot = () => { buzz(); if (skotEnabled() && !skotHiddenOn(pathname)) window.dispatchEvent(new Event("skot:open")); else m.openSpotlight(); };
  const tab = (it: Item) => <TabBtn key={it.key} it={it} on={m.active(it)} onGo={m.go} count={m.count} />;
  const out = useSkotOut();
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
            style={{ transform: out ? "translateY(0) scale(1)" : "translateY(22px) scale(0.82)", transition: "transform .38s cubic-bezier(.2,.9,.3,1.25)" }}
          >
            <span className="w-[64px] h-[64px] p-[2px]" style={{ background: CARBON, clipPath: cut(12) }}>
              <span className="w-full h-full grid place-items-center overflow-hidden" style={{ background: "#FFFFFF", clipPath: cut(11) }}><span className={out ? "skl-pop block" : "block"}><SkotAvatar size={54} /></span></span>
            </span>
            <span className="-mt-2 px-2 py-0.5 text-white italic uppercase" style={{ background: GREEN, fontFamily: UNB, fontWeight: 800, fontSize: 11, clipPath: cutTR(6), opacity: out ? 1 : 0, transition: "opacity .2s" }}>SKOT</span>
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
