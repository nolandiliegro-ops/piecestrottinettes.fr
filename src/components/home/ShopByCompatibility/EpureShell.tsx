/**
 * Section 2 de l'accueil — 2e tour du 18/10/2026 (?home=6..10).
 * Retour Nolan : « j'aime pas le vert… le but c'était de faire quelque chose d'épuré… change le titre, la disposition ».
 * Défaut nommé : la section reprenait le haut de page à l'identique (beige + gros titre Unbounded italique + barre à
 * flèche noire) → on lit deux fois la même chose. Correction commune aux 5 : AUCUN fond de couleur, plus de gros titre
 * Unbounded italique ni de barre à flèche noire (réservés au haut de page), titre en Plus Jakarta droit, rayons en
 * texte, filtre trott réduit à un lien. Cartes produits inchangées.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { readPontVariant } from "@/components/home/HomeTransition";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, Search, X } from "lucide-react";
import type { CategoryGroupV2 } from "@/hooks/useShopByCategoryDataV2";
import { scooterFullName } from "@/lib/scooterName";

const FONT = "'Plus Jakarta Sans', sans-serif";
const UNB = "'Unbounded', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const LINE = "#E2DCD0";
const PAPER = "#FAFAF8";
const MUTED = "#6B7280";

export type EpureVariant = 6 | 7 | 8 | 9 | 10;

export interface EpureProps {
  variant: EpureVariant;
  scooterName: string | null;
  brandName: string | null;
  totalCount: number;
  categories: CategoryGroupV2[];
  selectedSlugs: Set<string>;
  onToggle: (slug: string) => void;
  query: string;
  onQuery: (v: string) => void;
  onPickScooter: () => void;
  onClearScooter: () => void;
  catalogueHref: string;
  footLabel: string;
  grid: ReactNode;
  productsRef: React.RefObject<HTMLDivElement>;
}

const Cards = ({ children }: { children: ReactNode }) => (
  <div className="pt-cards-carbon">
    <style>{`.pt-cards-carbon .pt-slim-card{background-color:${CARBON}!important}`}</style>
    {children}
  </div>
);

// 25/10 : « Teverun Teverun Fighter Mini Pro » — le nom du modèle contient déjà la marque : ne pas la répéter.
const scooterLabel = (p: EpureProps) => scooterFullName(p.brandName, p.scooterName);

/** Filtre trott : un simple lien texte (plus de gros bloc). */
const TrottLink = (p: EpureProps) =>
  p.scooterName ? (
    <span className="inline-flex items-center gap-1 min-h-[44px] text-sm" style={{ fontFamily: FONT, color: CARBON }}>
      <span>Pour ta <b>{scooterLabel(p)}</b></span>
      <button type="button" onClick={p.onClearScooter} aria-label="Retirer le filtre trottinette" className="w-11 h-11 inline-flex items-center justify-center"><X className="w-4 h-4" /></button>
    </span>
  ) : (
    <button type="button" onClick={p.onPickScooter} className="inline-flex items-center gap-1 min-h-[44px] text-sm font-semibold underline underline-offset-4 decoration-1" style={{ fontFamily: FONT, color: CARBON }}>
      Filtrer pour ma trott <ChevronRight className="w-4 h-4" />
    </button>
  );

/** Champ de recherche : « ligne » (souligné seul) ou « boîte » (fine bordure, loupe dedans, pas de flèche noire). */
const Field = ({ p, kind = "line" }: { p: EpureProps; kind?: "line" | "box" }) => (
  <form role="search" onSubmit={(e) => e.preventDefault()} className="w-full">
    <label className={`flex items-center gap-3 h-12 min-w-0 ${kind === "box" ? "bg-white px-3.5" : ""}`}
      style={kind === "box" ? { boxShadow: `inset 0 0 0 1px ${LINE}` } : { borderBottom: `2px solid ${CARBON}` }}>
      <Search className="w-5 h-5 shrink-0" style={{ color: kind === "box" ? "#9CA3AF" : CARBON }} aria-hidden />
      <input type="search" value={p.query} onChange={(e) => p.onQuery(e.target.value)} placeholder="Pneu 10x2.5, plaquettes…"
        aria-label="Rechercher une pièce dans le catalogue" className="w-full h-full bg-transparent outline-none text-base placeholder:text-gray-400" style={{ fontFamily: FONT, color: CARBON }} />
      {p.query && <button type="button" onClick={() => p.onQuery("")} aria-label="Effacer" className="w-11 h-11 -mr-2 flex items-center justify-center shrink-0"><X className="w-4 h-4 text-gray-500" /></button>}
    </label>
  </form>
);

const clearAll = (p: EpureProps) => [...p.selectedSlugs].forEach((s) => p.onToggle(s));

/** Rayons en onglets texte soulignés (« Tout » + chaque rayon et son nombre). */
const TextTabs = ({ p, big }: { p: EpureProps; big?: boolean }) => {
  const none = p.selectedSlugs.size === 0;
  const tab = (key: string, label: string, n: number | null, on: boolean, click: () => void) => (
    <button key={key} type="button" onClick={click} aria-pressed={on}
      className={`shrink-0 min-h-[44px] flex items-baseline gap-1.5 whitespace-nowrap ${big ? "text-[20px] sm:text-[24px] font-extrabold" : "text-[15px] font-bold"}`}
      style={{ fontFamily: FONT, color: on ? CARBON : big ? "#A8A29E" : MUTED, borderBottom: `2px solid ${on ? CARBON : "transparent"}` }}>
      {label}{n !== null && <span className={big ? "text-sm font-bold" : "text-sm font-semibold"} style={{ color: on ? GREEN : "#A8A29E" }}>{n}</span>}
    </button>
  );
  return (
    <div className={`flex ${big ? "gap-5 sm:gap-7" : "gap-5"} overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0`} style={{ scrollbarWidth: "none" }} role="group" aria-label="Rayons">
      {tab("tout", "Tout", null, none, () => clearAll(p))}
      {p.categories.map((c) => tab(c.slug, c.name, c.count, p.selectedSlugs.has(c.slug), () => p.onToggle(c.slug)))}
    </div>
  );
};

/** Rayons (retour Nolan 19/10, 2e passe) : retour aux plaques d'avant — blanches, coin coupé, nom en capitales,
 *  nombre en italique ; plaque noire quand choisie. UN rayon à la fois (toucher un 2e rayon le remplace, retoucher
 *  le même revient à « Tout ») ; ordre figé au premier affichage pour que rien ne saute sous le doigt. */
const CleanTabs = ({ p, fade = PAPER }: { p: EpureProps; fade?: string }) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState(false);
  const measure = () => { const r = rowRef.current; if (r) setMore(r.scrollWidth - r.clientWidth - r.scrollLeft > 12); };
  useEffect(() => { measure(); window.addEventListener("resize", measure); return () => window.removeEventListener("resize", measure); });
  const order = useRef<string[]>([]);
  if (order.current.length === 0 && p.categories.length) order.current = p.categories.map((c) => c.slug);
  const rank = (slug: string) => { const i = order.current.indexOf(slug); return i === -1 ? 999 : i; };
  const cats = [...p.categories].sort((a, b) => rank(a.slug) - rank(b.slug));
  const none = p.selectedSlugs.size === 0;
  const pick = (slug: string) => {
    const was = p.selectedSlugs.has(slug) && p.selectedSlugs.size === 1;
    clearAll(p);
    if (!was) p.onToggle(slug);
  };
  // Le rayon touché glisse au centre de la frise (sans faire bouger la page).
  const center = (el: HTMLElement) => {
    const row = el.parentElement;
    if (row) row.scrollTo({ left: el.offsetLeft - (row.clientWidth - el.offsetWidth) / 2, behavior: "smooth" });
  };
  const plate = (key: string, label: string, n: number | null, on: boolean, click: () => void) => (
    <button key={key} type="button" onClick={(e) => { center(e.currentTarget); click(); }} aria-pressed={on}
      className="shrink-0 min-h-[44px] pl-3.5 pr-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide whitespace-nowrap"
      style={{ fontFamily: FONT, clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)",
        ...(on ? { background: CARBON, color: "#FFFFFF" } : { background: "#FFFFFF", color: CARBON, boxShadow: `inset 0 0 0 1px ${LINE}` }) }}>
      {label}
      {n !== null && <span style={{ fontFamily: UNB, fontStyle: "italic", fontWeight: 900, opacity: on ? 1 : 0.55 }}>{n}</span>}
    </button>
  );
  return (
    <div className="relative">
      <div ref={rowRef} onScroll={measure} className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap" style={{ scrollbarWidth: "none", overscrollBehaviorX: "contain" }} role="group" aria-label="Rayons">
        {plate("tout", "Tout", null, none, () => clearAll(p))}
        {cats.map((c) => plate(c.slug, c.name, c.count, p.selectedSlugs.has(c.slug), () => pick(c.slug)))}
      </div>
      {/* 20/10 (Nolan) : sur téléphone, montrer qu'on peut glisser — fondu à droite + flèche, disparaît en bout de frise. */}
      {more && (
        <button type="button" aria-label="Voir les autres rayons" onClick={() => rowRef.current?.scrollBy({ left: 220, behavior: "smooth" })}
          className="sm:hidden absolute -right-4 top-0 bottom-1 w-16 flex items-center justify-end pr-3"
          style={{ background: `linear-gradient(90deg, rgba(255,255,255,0), ${fade} 55%)` }}>
          <span className="h-9 w-9 inline-flex items-center justify-center text-white" style={{ background: CARBON, clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)" }}>
            <ChevronRight className="w-5 h-5" />
          </span>
        </button>
      )}
    </div>
  );
};

const Foot = ({ p }: { p: EpureProps }) => (
  <Link to={p.catalogueHref} className="mt-6 inline-flex items-center gap-2 min-h-[44px] text-sm font-bold" style={{ fontFamily: FONT, color: CARBON }}>
    {p.footLabel} <ArrowRight className="w-4 h-4" />
  </Link>
);

const count = (p: EpureProps) => `${p.totalCount} pièce${p.totalCount > 1 ? "s" : ""}${p.scooterName ? ` pour ta ${scooterLabel(p)}` : " au catalogue"}`;

const EpureShell = (p: EpureProps) => {
  const v = p.variant;
  const [open, setOpen] = useState(false);
  const [plateau] = useState(() => readPontVariant() === 9);

  // 7 — INDEX : sur ordinateur, sommaire à gauche (rayons en liste) et produits à droite ; sur téléphone, sommaire en ligne.
  if (v === 7) {
    return (
      <section className="w-full" style={{ background: PAPER }} data-home-variant="7">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 lg:py-16 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
          <aside className="min-w-0">
            <h2 className="text-[26px] font-extrabold leading-tight" style={{ fontFamily: FONT, color: CARBON, letterSpacing: "-0.02em" }}>Catalogue</h2>
            <p className="mt-1 text-sm" style={{ fontFamily: FONT, color: MUTED }}>{count(p)}</p>
            <div className="mt-4"><Field p={p} /></div>
            <div className="mt-2"><TrottLink {...p} /></div>
            <div className="mt-3 lg:hidden"><TextTabs p={p} /></div>
            <ul className="hidden lg:block mt-4" style={{ borderTop: `1px solid ${LINE}` }}>
              {[{ slug: "", name: "Tout", count: p.totalCount }, ...p.categories].map((c) => {
                const on = c.slug ? p.selectedSlugs.has(c.slug) : p.selectedSlugs.size === 0;
                return (
                  <li key={c.slug || "tout"} style={{ borderBottom: `1px solid ${LINE}` }}>
                    <button type="button" onClick={() => (c.slug ? p.onToggle(c.slug) : clearAll(p))} aria-pressed={on}
                      className="w-full min-h-[44px] flex items-center justify-between text-[15px]" style={{ fontFamily: FONT, color: CARBON, fontWeight: on ? 800 : 500 }}>
                      <span className="flex items-center gap-2">{on && <span className="w-1.5 h-4" style={{ background: CARBON }} />}{c.name}</span>
                      <span className="text-sm" style={{ color: MUTED }}>{c.count}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>
          <div ref={p.productsRef} className="min-w-0 scroll-mt-4 mt-6 lg:mt-1"><Cards>{p.grid}</Cards><Foot p={p} /></div>
        </div>
      </section>
    );
  }

  // 8 — ONGLETS-TITRE : les rayons SONT le titre (grands mots, l'actif en noir) ; loupe qui ouvre le champ.
  if (v === 8) {
    return (
      <section className="w-full" style={{ background: PAPER }} data-home-variant="8">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 lg:py-16">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold uppercase tracking-[0.14em]" style={{ fontFamily: FONT, color: MUTED }}>Le catalogue · {p.totalCount}</p>
            <button type="button" onClick={() => setOpen((o) => !o)} aria-label="Rechercher" aria-expanded={open} className="w-11 h-11 flex items-center justify-center" style={{ boxShadow: `inset 0 0 0 1px ${LINE}`, background: "#FFFFFF" }}>
              {open ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>
          </div>
          <div className="mt-2"><TextTabs p={p} big /></div>
          {(open || p.query) && <div className="mt-3"><Field p={p} kind="box" /></div>}
          <div className="mt-1"><TrottLink {...p} /></div>
          <div ref={p.productsRef} className="min-w-0 scroll-mt-4 mt-4"><Cards>{p.grid}</Cards></div>
          <Foot p={p} />
        </div>
      </section>
    );
  }

  // 9 — FEUILLE : une feuille blanche à fine bordure, titre à gauche et nombre à droite sur un filet ; champ en boîte fine.
  if (v === 9) {
    return (
      <section className="w-full" style={{ background: PAPER }} data-home-variant="9">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 lg:py-14">
          <div className="bg-white px-4 py-6 sm:px-8 sm:py-8" style={{ boxShadow: `inset 0 0 0 1px ${LINE}` }}>
            <div className="flex items-baseline justify-between gap-3 pb-3" style={{ borderBottom: `1px solid ${CARBON}` }}>
              <h2 className="text-[22px] sm:text-[28px] font-extrabold" style={{ fontFamily: FONT, color: CARBON, letterSpacing: "-0.02em" }}>Le catalogue</h2>
              <span className="text-sm font-semibold" style={{ fontFamily: FONT, color: MUTED }}>{p.totalCount} pièces</span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-1 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-4">
              <div className="min-w-0"><Field p={p} kind="box" /></div>
              <div><TrottLink {...p} /></div>
            </div>
            <div className="mt-3"><TextTabs p={p} /></div>
            <div ref={p.productsRef} className="min-w-0 scroll-mt-4 mt-4"><Cards>{p.grid}</Cards></div>
            <Foot p={p} />
          </div>
        </div>
      </section>
    );
  }

  // 10 — PHRASE : le titre est une phrase avec le vrai nombre (« 721 pièces. Trouve la tienne. »), rayons en liste à 2 colonnes.
  if (v === 10) {
    return (
      <section className="w-full" style={{ background: PAPER }} data-home-variant="10">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 lg:py-16">
          <h2 className="text-[28px] sm:text-[40px] font-extrabold leading-[1.1]" style={{ fontFamily: FONT, color: CARBON, letterSpacing: "-0.03em" }}>
            {p.scooterName ? <>{p.totalCount} pièces pour ta {scooterLabel(p)}.</> : <>{p.totalCount} pièces.<br className="sm:hidden" /> <span style={{ color: MUTED }}>Trouve la tienne.</span></>}
          </h2>
          <div className="mt-5 max-w-2xl"><Field p={p} /></div>
          <div className="mt-1"><TrottLink {...p} /></div>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-x-4" style={{ borderTop: `1px solid ${LINE}` }}>
            {p.categories.map((c) => {
              const on = p.selectedSlugs.has(c.slug);
              return (
                <button key={c.slug} type="button" onClick={() => p.onToggle(c.slug)} aria-pressed={on}
                  className="min-h-[48px] flex items-center justify-between gap-2 text-left text-[15px]" style={{ fontFamily: FONT, color: CARBON, fontWeight: on ? 800 : 600, borderBottom: `1px solid ${on ? CARBON : LINE}` }}>
                  <span className="truncate">{c.name}</span><span className="text-sm" style={{ color: on ? GREEN : "#A8A29E" }}>{c.count}</span>
                </button>
              );
            })}
          </div>
          <div ref={p.productsRef} className="min-w-0 scroll-mt-4 mt-6"><Cards>{p.grid}</Cards></div>
          <Foot p={p} />
        </div>
      </section>
    );
  }

  // 6 — ÉTIQUETTE (choisie le 19/10) : petite étiquette à gauche, le nombre de pièces bien écrit à droite,
  // champ souligné, onglets propres.
  return (
    <section className="w-full" style={{ background: PAPER, scrollMarginTop: 40 }} data-home-variant="6">
      {/* 20/10 « Plateau blanc » (choix Nolan, ?pont=9 par défaut) : le catalogue se pose sur un plateau blanc chanfreiné. */}
      <div style={plateau ? { background: "#FFFFFF", clipPath: "polygon(0 0, calc(100% - 40px) 0, 100% 40px, 100% 100%, 0 100%)", boxShadow: "inset 0 1px 0 #E2DCD0" } : undefined}>
      <div className={`max-w-7xl mx-auto px-4 lg:px-8 ${plateau ? "pt-10 pb-12 lg:pt-14 lg:pb-16" : "py-12 lg:py-16"}`}>
        <div className="flex items-end justify-between gap-4">
          <Link to="/catalogue?tout=1" className="text-sm font-bold uppercase tracking-[0.14em] pb-1 min-h-[44px] inline-flex items-end hover:underline underline-offset-4" style={{ fontFamily: FONT, color: MUTED }}>Le catalogue</Link>
          <p className="text-right leading-none" style={{ fontFamily: FONT }}>
            <span className="text-[32px] sm:text-[40px]" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: GREEN, letterSpacing: "-0.03em" }}>{p.totalCount}</span>
            <span className="ml-1.5 text-[15px] font-semibold" style={{ color: MUTED }}>{p.totalCount > 1 ? "pièces" : "pièce"}</span>
          </p>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-1 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-6">
          <div className="min-w-0"><Field p={p} /></div>
          <div><TrottLink {...p} /></div>
        </div>
        <div className="mt-4"><CleanTabs p={p} fade={plateau ? "#FFFFFF" : PAPER} /></div>
        <div ref={p.productsRef} className="min-w-0 scroll-mt-4 mt-5"><Cards>{p.grid}</Cards></div>
        {/* 25/10 : « il manque un bouton Voir tout le catalogue, en bas c'est trop petit » */}
        <div className="mt-8 flex flex-col items-stretch sm:items-start gap-1">
          <Link to="/catalogue?tout=1" className="group inline-flex items-center justify-center gap-3 h-14 px-8 bg-white text-base font-extrabold uppercase tracking-[0.06em] transition-transform hover:-translate-y-0.5"
            style={{ fontFamily: FONT, color: CARBON, boxShadow: `inset 0 0 0 2px ${CARBON}`, clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%)" }}>
            Voir tout le catalogue <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
          {p.catalogueHref !== "/catalogue" && p.totalCount > 0 && (
            <Link to={p.catalogueHref} className="inline-flex items-center justify-center sm:justify-start gap-1.5 min-h-[44px] text-sm font-semibold underline underline-offset-4 decoration-1" style={{ fontFamily: FONT, color: CARBON }}>
              {p.totalCount === 1 ? (p.scooterName ? `Seulement la pièce de ta ${scooterLabel(p)}` : "Voir cette pièce") : p.scooterName ? `Seulement les ${p.totalCount} pièces de ta ${scooterLabel(p)}` : `Voir ces ${p.totalCount} pièces`}
            </Link>
          )}
        </div>
      </div>
      </div>
    </section>
  );
};

export default EpureShell;
