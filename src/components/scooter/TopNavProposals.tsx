/* Navigation entre trottinettes EN HAUT de la fiche (24/10/2026, demande de Nolan :
   « un carrousel en haut pour naviguer, au moins par marque, au moins par modèle dans la marque »).
   Propositions derrière ?nav=1..5 ; sans paramètre : rien en haut (le carrousel du bas reste). */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bike, ChevronLeft, ChevronRight } from "lucide-react";
import { useBrands } from "@/hooks/useScooterData";
import { optimizedImage } from "@/lib/imageTransform";
import type { ShowroomCarouselScooter } from "@/hooks/useShowroomData";

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const LINE = "#E7E1D6";
const CHAMFER = "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)";

export type NavLook = 1 | 2 | 3 | 4 | 5;
export const navParam = (): NavLook | null => {
  if (typeof window === "undefined") return null;
  const n = Number(new URLSearchParams(window.location.search).get("nav"));
  return n >= 1 && n <= 5 ? (n as NavLook) : null;
};

const short = (m: ShowroomCarouselScooter) =>
  m.name.replace(new RegExp(`^${(m.brand_name ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`, "i"), "");
const Pic = ({ m, w = 260, cls = "" }: { m: ShowroomCarouselScooter; w?: number; cls?: string }) =>
  m.image_url ? <img src={optimizedImage(m.image_url, w)} alt="" loading="eager" className={`max-h-full max-w-full object-contain ${cls}`} />
    : <Bike className="w-8 h-8 text-gray-300" />;

/** Rail horizontal avec flèches sur ordinateur ; ramène la carte active en vue à l'ouverture. */
const Rail = ({ children, dark = false, deps }: { children: React.ReactNode; dark?: boolean; deps: unknown }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const on = el.querySelector<HTMLElement>("[data-on='1']");
    el.scrollLeft = on ? Math.max(0, on.offsetLeft - 24) : 0;
  }, [deps]);
  const go = (d: number) => ref.current?.scrollBy({ left: d * (ref.current.clientWidth * 0.8), behavior: "smooth" });
  const arrow = (d: number) => (
    <button type="button" aria-label={d < 0 ? "Modèles précédents" : "Modèles suivants"} onClick={() => go(d)}
      className="hidden lg:flex absolute top-1/2 -translate-y-1/2 z-10 w-11 h-11 items-center justify-center rounded-full shadow-md"
      style={{ [d < 0 ? "left" : "right"]: -18, background: dark ? "#fff" : CARBON, color: dark ? CARBON : "#fff" }}>
      {d < 0 ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
    </button>
  );
  return (
    <div className="relative">
      {arrow(-1)}
      <div ref={ref} className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</div>
      {arrow(1)}
    </div>
  );
};

const useBrandList = (all: ShowroomCarouselScooter[]) => {
  const { data: rows = [] } = useBrands();
  return useMemo(() => {
    const logos = new Map((rows as { name: string; logo_url: string | null }[]).map((b) => [b.name, b.logo_url]));
    const m = new Map<string, { name: string; n: number; logo: string | null; first: string }>();
    all.forEach((s) => {
      if (!s.brand_name) return;
      const e = m.get(s.brand_name) ?? { name: s.brand_name, n: 0, logo: logos.get(s.brand_name) ?? null, first: s.slug };
      e.n++; m.set(s.brand_name, e);
    });
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [all, rows]);
};

const Head = ({ brand, count, dark = false, right }: { brand: string; count: number; dark?: boolean; right?: React.ReactNode }) => (
  <div className="flex items-end justify-between gap-3 mb-3">
    <p className="text-lg lg:text-xl uppercase" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: dark ? "#fff" : CARBON }}>
      Gamme {brand} <span className="text-sm not-italic align-middle" style={{ fontFamily: FONT, fontWeight: 700, color: dark ? "rgba(255,255,255,0.6)" : "#6B7280" }}>{count} modèles</span>
    </p>
    <span className="hidden sm:inline">{right}</span>
  </div>
);

/** 1 · Plaques : grosses cartes photo + nom, la trottinette affichée encadrée en vert. */
const NavPlates = ({ models, current, brand }: { models: ShowroomCarouselScooter[]; current: string; brand: string }) => (
  <>
    <Head brand={brand} count={models.length} right={<Link to="/trottinettes" className="min-h-[44px] inline-flex items-center text-sm font-bold uppercase tracking-wider underline underline-offset-4" style={{ fontFamily: FONT, color: CARBON }}>Toutes les marques</Link>} />
    <Rail deps={current}>
      {models.map((m) => {
        const on = m.slug === current;
        return (
          <Link key={m.slug} to={`/scooter/${m.slug}`} data-on={on ? "1" : "0"} aria-current={on ? "page" : undefined}
            className="shrink-0 w-[44%] sm:w-48 lg:w-52 bg-white flex flex-col" style={{ clipPath: CHAMFER, boxShadow: on ? `inset 0 0 0 3px ${GREEN}` : `inset 0 0 0 1px ${LINE}` }}>
            <div className="h-28 lg:h-32 flex items-center justify-center p-3"><Pic m={m} /></div>
            <div className="px-3 pb-3 text-sm font-extrabold uppercase leading-tight" style={{ fontFamily: FONT, color: on ? GREEN : CARBON }}>{short(m)}</div>
          </Link>
        );
      })}
    </Rail>
  </>
);

/** 2 · Marque puis modèle : une rangée de logos de marques, puis la gamme de la marque choisie. */
const NavTwoLevel = ({ all, brand, current }: { all: ShowroomCarouselScooter[]; brand: string; current: string }) => {
  const brands = useBrandList(all);
  const [view, setView] = useState(brand);
  useEffect(() => setView(brand), [brand]);
  const models = all.filter((s) => s.brand_name === view).sort((a, b) => a.name.localeCompare(b.name, "fr"));
  return (
    <>
      <Rail deps={brand}>
        {brands.map((b) => {
          const on = b.name === view;
          return (
            <button key={b.name} type="button" onClick={() => setView(b.name)} data-on={on ? "1" : "0"}
              className="shrink-0 min-h-[48px] px-3 inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide"
              style={{ fontFamily: FONT, clipPath: CHAMFER, background: on ? CARBON : "#fff", color: on ? "#fff" : CARBON, boxShadow: on ? "none" : `inset 0 0 0 1px ${LINE}` }}>
              {b.logo && <img src={b.logo} alt="" className="w-6 h-6 object-contain rounded-sm bg-white" />}{b.name}
            </button>
          );
        })}
      </Rail>
      <div className="mt-3">
        <Rail deps={view + current}>
          {models.map((m) => {
            const on = m.slug === current;
            return (
              <Link key={m.slug} to={`/scooter/${m.slug}`} data-on={on ? "1" : "0"}
                className="shrink-0 w-36 lg:w-44 bg-white p-2 flex flex-col items-center text-center" style={{ clipPath: CHAMFER, boxShadow: on ? `inset 0 0 0 3px ${GREEN}` : `inset 0 0 0 1px ${LINE}` }}>
                <div className="h-20 lg:h-24 w-full flex items-center justify-center"><Pic m={m} w={200} /></div>
                <span className="mt-1 text-sm font-bold leading-tight" style={{ fontFamily: FONT, color: on ? GREEN : CARBON }}>{short(m)}</span>
              </Link>
            );
          })}
        </Rail>
      </div>
    </>
  );
};

/** 3 · Précédent / suivant : deux grosses cartes autour du compteur, pour feuilleter la gamme. */
const NavPrevNext = ({ models, current, brand }: { models: ShowroomCarouselScooter[]; current: string; brand: string }) => {
  const i = Math.max(0, models.findIndex((m) => m.slug === current));
  const prev = models[(i - 1 + models.length) % models.length];
  const next = models[(i + 1) % models.length];
  const card = (m: ShowroomCarouselScooter, dir: -1 | 1) => (
    <Link to={`/scooter/${m.slug}`} className={`flex items-center gap-3 bg-white p-3 min-h-[88px] ${dir > 0 ? "flex-row-reverse text-right" : ""}`} style={{ clipPath: CHAMFER, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
      <span className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-white" style={{ background: CARBON }}>{dir < 0 ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}</span>
      <div className="hidden sm:flex w-24 h-16 items-center justify-center"><Pic m={m} w={200} /></div>
      <div className="min-w-0">
        <div className="text-sm uppercase tracking-wider text-gray-500" style={{ fontFamily: FONT }}>{dir < 0 ? "Précédente" : "Suivante"}</div>
        <div className="text-sm lg:text-base font-extrabold uppercase leading-tight truncate" style={{ fontFamily: FONT, color: CARBON }}>{short(m)}</div>
      </div>
    </Link>
  );
  return (
    <div className="grid grid-cols-2 lg:grid-cols-[1fr_auto_1fr] gap-3 items-center">
      {card(prev, -1)}
      <div className="hidden lg:block text-center px-4">
        <div className="text-sm font-extrabold uppercase tracking-[0.14em]" style={{ fontFamily: FONT, color: GREEN }}>Gamme {brand}</div>
        <div className="text-2xl" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>{i + 1}<span className="text-gray-400"> / {models.length}</span></div>
      </div>
      {card(next, 1)}
    </div>
  );
};

/** 4 · Bandeau carbone : une bande sombre sous l'en-tête, vignettes et noms, la marque à gauche. */
const NavBand = ({ models, current, brand }: { models: ShowroomCarouselScooter[]; current: string; brand: string }) => (
  <>
    <Head brand={brand} count={models.length} dark />
    <Rail deps={current} dark>
      {models.map((m) => {
        const on = m.slug === current;
        return (
          <Link key={m.slug} to={`/scooter/${m.slug}`} data-on={on ? "1" : "0"} className="shrink-0 w-40 lg:w-48 flex flex-col"
            style={{ clipPath: CHAMFER, background: on ? GREEN : "#262626" }}>
            <div className="h-24 lg:h-28 flex items-center justify-center p-2 m-1.5" style={{ background: "#F5F0E8", clipPath: CHAMFER }}><Pic m={m} /></div>
            <div className="px-3 pb-3 pt-1 text-sm font-extrabold uppercase leading-tight text-white" style={{ fontFamily: FONT }}>{short(m)}</div>
          </Link>
        );
      })}
    </Rail>
  </>
);

export const TopGammeNav = ({ look, all, brand, current, bottomPlayer }: { look: NavLook; all: ShowroomCarouselScooter[]; brand: string; current: string; bottomPlayer: React.ReactNode }) => {
  const models = useMemo(() => all.filter((s) => s.brand_name === brand).sort((a, b) => a.name.localeCompare(b.name, "fr")), [all, brand]);
  if (models.length < 2 && look !== 2) return null;
  // 5 · Le carrousel du bas, remonté tel quel en haut (lecture littérale).
  if (look === 5) return <div className="pt-20 lg:pt-24" style={{ backgroundColor: "#F5F0E8" }}>{bottomPlayer}</div>;
  const dark = look === 4;
  return (
    <section aria-label={`Gamme ${brand}`} className="px-4 pt-20 lg:pt-24 pb-5" style={{ backgroundColor: "#F5F0E8" }}>
      {/* La bande carbone commence SOUS l'en-tête (logo noir illisible sur fond sombre). */}
      <div className={`mx-auto max-w-6xl ${dark ? "px-4 py-4 lg:px-6 lg:py-5 -mx-4 lg:mx-auto" : ""}`} style={dark ? { backgroundColor: CARBON, clipPath: "polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%)" } : undefined}>
        {look === 1 && <NavPlates models={models} current={current} brand={brand} />}
        {look === 2 && <NavTwoLevel all={all} brand={brand} current={current} />}
        {look === 3 && <NavPrevNext models={models} current={current} brand={brand} />}
        {look === 4 && <NavBand models={models} current={current} brand={brand} />}
      </div>
    </section>
  );
};
