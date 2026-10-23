/**
 * Barre du haut — 5 propositions (24/10/2026), UNIQUEMENT avec ?barre=1..5 (sans paramètre : Header actuel inchangé).
 * Retours Nolan : logo trop gras (→ lettrage affiné, /brand/logo-pt-2026-fin.svg), « Ma trottinette » pas clair,
 * « ? » sur le badge garage quand on n'est pas inscrit, « garage » pas compris comme un profil.
 * 1 Repassé · 2 Logo au centre · 3 Deux étages · 4 Tout dans la recherche · 5 Barre noire
 */
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, Menu, Search, ShoppingCart, UserRound, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useSelectedScooter } from "@/contexts/ScooterContext";
import { useSpotlight } from "@/contexts/SpotlightContext";
import ScooterSelectorSheet from "@/components/scooter/ScooterSelectorSheet";

export type BarreVariant = 1 | 2 | 3 | 4 | 5;
export const readBarreVariant = (): BarreVariant | null => {
  try {
    const n = Number(new URLSearchParams(window.location.search).get("barre"));
    return n >= 1 && n <= 5 ? (n as BarreVariant) : null;
  } catch {
    return null;
  }
};

const FONT = "'Plus Jakarta Sans', sans-serif";
const CUT = "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const LINE = "#E2DCD0";
const LOGO_FIN = "/brand/logo-pt-2026-fin.svg";
const LOGO_FIN_NEG = "/brand/logo-pt-2026-fin-negatif.svg";

const LINKS = [
  { label: "Pièces", href: "/catalogue" },
  { label: "Trottinettes", href: "/trottinettes" },
  { label: "Marques", href: "/marques" },
];

const ScooterGlyph = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <circle cx="5" cy="18" r="2.5" /><circle cx="19" cy="18" r="2.5" /><path d="M7.5 18H15l2.6-12" /><path d="M15.5 6h4" />
  </svg>
);

const HeaderProposals = ({ variant }: { variant: BarreVariant }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { setIsOpen: openCart, totals } = useCart();
  const { selectedScooter } = useSelectedScooter();
  const { openSpotlight } = useSpotlight();
  const [sheet, setSheet] = useState(false);
  const [menu, setMenu] = useState(false);
  const dark = variant === 5;
  const ink = dark ? "#FFFFFF" : CARBON;
  const on = (href: string) => pathname.startsWith(href);
  const goProfile = () => navigate(user ? "/garage" : "/login");
  const firstName = profile?.display_name?.split(" ")[0];
  const scooterName = selectedScooter?.name;

  const logo = (h = "h-[40px] lg:h-[48px]") => (
    <Link to="/" aria-label="piecestrottinettes.fr — accueil" className="shrink-0 flex items-center">
      <img src={dark ? LOGO_FIN_NEG : LOGO_FIN} alt="piecestrottinettes.fr" width={937} height={268} className={`block w-auto ${h}`} />
    </Link>
  );

  const links = (cls = "") => (
    <nav className={`hidden lg:flex items-center gap-6 xl:gap-8 ${cls}`}>
      {LINKS.map((l) => (
        <Link key={l.href} to={l.href} className="py-2 text-sm font-extrabold uppercase tracking-[0.06em] transition-colors"
          style={{ fontFamily: FONT, color: on(l.href) ? ink : dark ? "rgba(255,255,255,0.7)" : "#57534E", boxShadow: on(l.href) ? `inset 0 -2.5px 0 ${GREEN}` : "none" }}>
          {l.label}
        </Link>
      ))}
    </nav>
  );

  const cart = (
    <button type="button" onClick={() => openCart(true)} aria-label="Panier" className="relative hidden md:inline-flex w-11 h-11 items-center justify-center" style={{ color: ink }}>
      <ShoppingCart className="w-5 h-5" />
      {totals.itemCount > 0 && <span className="absolute top-1 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-white text-xs font-bold flex items-center justify-center" style={{ background: GREEN }}>{totals.itemCount > 99 ? "99+" : totals.itemCount}</span>}
    </button>
  );

  const burger = (
    <button type="button" onClick={() => setMenu((v) => !v)} aria-label="Menu" aria-expanded={menu} className="lg:hidden w-11 h-11 inline-flex items-center justify-center shrink-0" style={{ color: ink }}>
      {menu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
    </button>
  );

  /** Profil : plus de « ? » ni de « MON / GARAGE » empilé — un libellé qui dit ce qu'on y trouve. */
  const profileBtn = (label: { in: string; out: string }, style: "pill" | "text" | "green" | "icon" = "pill") => {
    const avatar = user && profile?.avatar_url
      ? <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
      : user
        ? <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-extrabold text-white" style={{ background: GREEN }}>{(firstName || user.email || "R").charAt(0).toUpperCase()}</span>
        : <UserRound className="w-5 h-5" />;
    const txt = user ? label.in : label.out;
    if (style === "icon") {
      return (
        <button type="button" onClick={goProfile} aria-label={txt} className="w-11 h-11 inline-flex items-center justify-center shrink-0" style={{ color: ink }}>
          {avatar}
        </button>
      );
    }
    if (style === "text") {
      return (
        <button type="button" onClick={goProfile} className="inline-flex items-center gap-2 min-h-[44px] px-1 shrink-0 text-sm font-extrabold uppercase tracking-[0.05em]" style={{ fontFamily: FONT, color: ink }}>
          {avatar}<span className="hidden sm:inline whitespace-nowrap">{txt}</span>
        </button>
      );
    }
    const green = style === "green";
    return (
      <button type="button" onClick={goProfile} className="inline-flex items-center gap-2 min-h-[44px] pl-2 pr-3 sm:pr-4 shrink-0 text-sm font-extrabold uppercase tracking-[0.05em]"
        style={{ fontFamily: FONT, clipPath: CUT, background: green ? GREEN : CARBON, color: "#fff" }}>
        <span className="w-7 h-7 flex items-center justify-center">{avatar}</span>
        <span className="hidden sm:inline whitespace-nowrap">{txt}</span>
      </button>
    );
  };

  /** Sélecteur de trottinette : dit ce qu'il fait (« Choisir ma trott ») et affiche la trott une fois choisie. */
  const scooterBtn = (mode: "full" | "icon" | "chip" = "full") => {
    const label = scooterName ?? "Choisir ma trott";
    if (mode === "icon") {
      return (
        <button type="button" onClick={() => setSheet(true)} aria-label={scooterName ? `Ma trottinette : ${scooterName}` : "Choisir ma trottinette"} className="relative w-11 h-11 inline-flex items-center justify-center shrink-0" style={{ color: ink }}>
          <ScooterGlyph className="w-6 h-6" />
          {scooterName && <span className="absolute top-2 right-1.5 w-2.5 h-2.5 rounded-full" style={{ background: GREEN }} />}
        </button>
      );
    }
    return (
      <button type="button" onClick={() => setSheet(true)} className="inline-flex items-center gap-2 min-h-[44px] px-3 shrink-0 text-sm font-bold max-w-[220px]"
        style={{ fontFamily: FONT, clipPath: CUT, background: dark ? "rgba(255,255,255,0.08)" : "#fff", color: ink, boxShadow: `inset 0 0 0 1px ${dark ? "rgba(255,255,255,0.25)" : scooterName ? GREEN : LINE}` }}>
        <ScooterGlyph className="w-5 h-5 shrink-0" />
        <span className="truncate">{label}</span>
        <ChevronDown className="w-4 h-4 shrink-0 opacity-60" />
      </button>
    );
  };

  const searchBox = (w = "w-[240px] xl:w-[300px]") => (
    <button type="button" onClick={openSpotlight} className={`hidden xl:inline-flex h-11 ${w} items-center gap-2.5 px-3.5 text-[15px] text-left bg-white whitespace-nowrap overflow-hidden`}
      style={{ fontFamily: FONT, color: "#9CA3AF", boxShadow: `inset 0 0 0 1px ${LINE}`, clipPath: CUT }}>
      <Search className="w-4 h-4 shrink-0" style={{ color: CARBON }} /> Pneu, Dualtron, chargeur…
    </button>
  );
  const searchIcon = (cls = "xl:hidden") => (
    <button type="button" onClick={openSpotlight} aria-label="Rechercher" className={`w-11 h-11 inline-flex items-center justify-center shrink-0 ${cls}`} style={{ color: ink }}>
      <Search className="w-5 h-5" />
    </button>
  );

  const mobileMenu = menu && (
    <nav className="lg:hidden pb-4 pt-2 border-t" style={{ borderColor: dark ? "rgba(255,255,255,0.12)" : LINE }}>
      {LINKS.map((l) => (
        <Link key={l.href} to={l.href} onClick={() => setMenu(false)} className="flex items-center min-h-[48px] px-1 text-base font-extrabold uppercase tracking-[0.05em]" style={{ fontFamily: FONT, color: ink }}>
          {l.label}
        </Link>
      ))}
      <button type="button" onClick={() => { setMenu(false); goProfile(); }} className="mt-2 w-full min-h-[48px] text-sm font-extrabold uppercase tracking-[0.06em] text-white" style={{ fontFamily: FONT, background: GREEN, clipPath: CUT }}>
        {user ? "Mon profil rider" : "Se connecter / créer mon profil"}
      </button>
    </nav>
  );

  const shell = (row: React.ReactNode, extra?: React.ReactNode) => (
    <header className="fixed top-0 left-0 right-0 z-50 border-b" data-barre={variant}
      style={{ background: dark ? CARBON : "rgba(250,250,248,0.96)", borderColor: dark ? "#000" : LINE, backdropFilter: dark ? undefined : "blur(6px)" }}>
      <div className="container mx-auto px-4 lg:px-8">
        {row}
        {extra}
        {mobileMenu}
      </div>
      <ScooterSelectorSheet open={sheet} onOpenChange={setSheet} />
    </header>
  );

  /* 1 · Repassé : même disposition, chaque élément repassé. */
  if (variant === 1) {
    return shell(
      <div className="flex items-center h-16 lg:h-20 gap-2">
        {logo()}
        {links("ml-8")}
        <div className="ml-auto flex items-center gap-1.5 lg:gap-3">
          {searchBox()}
          <span className="hidden md:inline-flex">{scooterBtn("full")}</span>
          <span className="md:hidden">{scooterBtn("icon")}</span>
          {cart}
          {profileBtn({ in: firstName ? `Garage de ${firstName}` : "Mon garage", out: "Connexion" })}
          {burger}
        </div>
      </div>,
    );
  }

  /* 2 · Logo au centre : menu à gauche, logo au milieu, actions à droite. */
  if (variant === 2) {
    return shell(
      <div className="grid grid-cols-[1fr_auto_1fr] items-center h-16 lg:h-20">
        <div className="flex items-center gap-1">{burger}{links()}</div>
        {logo("h-[38px] lg:h-[50px]")}
        <div className="flex items-center justify-end gap-0.5 lg:gap-2">
          {searchIcon("")}
          {scooterBtn("icon")}
          {cart}
          <span className="hidden lg:inline-flex">{profileBtn({ in: "Profil rider", out: "Connexion" }, "text")}</span>
          <span className="lg:hidden">{profileBtn({ in: "Profil rider", out: "Connexion" }, "icon")}</span>
        </div>
      </div>,
    );
  }

  /* 3 · Deux étages (ordinateur) : marque + recherche en haut, menu + trottinette dessous. */
  if (variant === 3) {
    return shell(
      <>
        <div className="flex items-center h-16 lg:h-[52px] gap-2">
          {logo("h-[40px] lg:h-[40px]")}
          <div className="hidden lg:flex flex-1 justify-center">{searchBox("w-[360px] xl:w-[420px] !inline-flex")}</div>
          <div className="ml-auto flex items-center gap-1 lg:gap-2">
            <span className="lg:hidden">{searchIcon("")}</span>
            <span className="lg:hidden">{scooterBtn("icon")}</span>
            {cart}
            {profileBtn({ in: "Mon profil rider", out: "Connexion" }, "text")}
            {burger}
          </div>
        </div>
        <div className="hidden lg:flex items-center justify-between h-7 -mt-px">
          {links("!gap-7")}
          <button type="button" onClick={() => setSheet(true)} className="inline-flex items-center gap-2 text-sm font-bold" style={{ fontFamily: FONT, color: CARBON }}>
            <ScooterGlyph className="w-4 h-4" />
            {scooterName ? <>Ta trott : <span style={{ color: GREEN }}>{scooterName}</span></> : <>Ta trott ? <span className="underline underline-offset-4" style={{ color: GREEN }}>Choisis-la, on filtre les pièces</span></>}
          </button>
        </div>
      </>,
    );
  }

  /* 4 · Tout dans la recherche : la trottinette devient le filtre de la barre de recherche. */
  if (variant === 4) {
    return shell(
      <div className="flex items-center h-16 lg:h-20 gap-2">
        {logo()}
        {links("ml-8")}
        <div className="hidden xl:flex ml-auto h-11 items-stretch bg-white" style={{ boxShadow: `inset 0 0 0 1px ${LINE}`, clipPath: CUT }}>
          <button type="button" onClick={() => setSheet(true)} className="inline-flex items-center gap-1.5 px-3 text-sm font-bold max-w-[170px]" style={{ fontFamily: FONT, color: scooterName ? GREEN : CARBON, boxShadow: `inset -1px 0 0 ${LINE}` }}>
            <ScooterGlyph className="w-4 h-4 shrink-0" /><span className="truncate">{scooterName ?? "Ma trott"}</span><ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-60" />
          </button>
          <button type="button" onClick={openSpotlight} className="inline-flex items-center gap-2 px-3 w-[220px] text-[15px] text-left" style={{ fontFamily: FONT, color: "#9CA3AF" }}>
            <Search className="w-4 h-4 shrink-0" style={{ color: CARBON }} /> {scooterName ? "Une pièce pour elle…" : "Pneu, chargeur…"}
          </button>
        </div>
        <div className="ml-auto xl:ml-3 flex items-center gap-1 lg:gap-2">
          <span className="xl:hidden">{searchIcon("")}</span>
          <span className="xl:hidden">{scooterBtn("icon")}</span>
          {cart}
          {profileBtn({ in: "Profil rider", out: "Se connecter" }, "text")}
          {burger}
        </div>
      </div>,
    );
  }

  /* 5 · Barre noire : la marque en négatif, le profil en vert. */
  return shell(
    <div className="flex items-center h-16 lg:h-20 gap-2">
      {logo()}
      {links("ml-8")}
      <div className="ml-auto flex items-center gap-1.5 lg:gap-3">
        <span className="hidden md:inline-flex">{scooterBtn("chip")}</span>
        <span className="md:hidden">{scooterBtn("icon")}</span>
        {searchIcon("")}
        {cart}
        {profileBtn({ in: "Mon garage", out: "Connexion" }, "green")}
        {burger}
      </div>
    </div>,
  );
};

export default HeaderProposals;
