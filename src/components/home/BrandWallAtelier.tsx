/**
 * Accueil — « Choisis ta marque » : propositions du 18/10/2026 (?mur=1..5). Sans paramètre, l'ancien mur reste servi.
 * Défaut constaté : le module est resté à l'ancienne identité (Sora, pastilles rondes à emoji, champ arrondi, titre centré)
 * alors que /marques est passée au gabarit « Atelier » le 17/10 ; et l'ordre (vedettes puis display_order 0 = alphabétique)
 * montrait Apollo/Aprilia/Beaster (4-6 modèles) avant Kaabo (19).
 * Correction commune aux 5 : identité Atelier (Unbounded 900 italique, Plus Jakarta Sans, chanfrein, aucun emoji),
 * photos de marque, marques triées par nombre de modèles, filtres d'usage = même règle que /marques.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Search } from "lucide-react";
import { useBrandWall, AXIS_UI, type BrandAxis, type BrandWallItem } from "@/hooks/useBrandWall";
import { useBrands } from "@/hooks/useScooterData";
import { PhotoTile, brandPhoto } from "@/components/listing/Atelier";
import { optimizedImage } from "@/lib/imageTransform";

export type MurVariant = 1 | 2 | 3 | 4 | 5;

/** ?mur=1..5 ; 0 = ancien mur. */
export const readMurVariant = (): 0 | MurVariant => {
  try {
    const n = Number(new URLSearchParams(window.location.search).get("mur"));
    return n >= 1 && n <= 5 ? (n as MurVariant) : 0;
  } catch {
    return 0;
  }
};

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const LINE = "#E2DCD0";
const BEIGE = "#FAFAF8";
const cut = (px: number) => `polygon(0 0, calc(100% - ${px}px) 0, 100% ${px}px, 100% 100%, 0 100%)`;
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const AXES = Object.keys(AXIS_UI) as BrandAxis[];
const RATIO = 0.5;

type Tone = "light" | "dark";

const UsagePlates = ({ axis, setAxis, tone }: { axis: BrandAxis | null; setAxis: (a: BrandAxis | null) => void; tone: Tone }) => (
  <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap" style={{ scrollbarWidth: "none" }} role="group" aria-label="Filtrer par usage">
    {AXES.map((k) => {
      const on = axis === k;
      const idle = tone === "light" ? { background: "#fff", color: CARBON, boxShadow: `inset 0 0 0 1px ${LINE}` } : { background: "#2A2A2A", color: "#fff" };
      return (
        <button key={k} type="button" onClick={() => setAxis(on ? null : k)} aria-pressed={on}
          className="shrink-0 inline-flex items-center h-11 px-4 text-sm font-extrabold uppercase tracking-wide whitespace-nowrap"
          style={{ fontFamily: FONT, clipPath: cut(8), ...(on ? { background: tone === "light" ? CARBON : GREEN, color: "#fff", boxShadow: tone === "light" ? `inset 0 -3px 0 ${GREEN}` : "none" } : idle) }}>
          {AXIS_UI[k].label}
        </button>
      );
    })}
  </div>
);

const Title = ({ tone, n, sub = true }: { tone: Tone; n: number | null; sub?: boolean }) => (
  <div className="flex items-end justify-between gap-4">
    <div>
      <h2 id="brand-wall-title" className="text-[30px] sm:text-5xl uppercase leading-[0.95]" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.03em", color: tone === "light" ? CARBON : "#fff" }}>
        Choisis ta <span style={{ color: tone === "light" ? GREEN : "#8FBF9C" }}>marque.</span>
      </h2>
      {sub && <p className="mt-2 text-base" style={{ fontFamily: FONT, color: tone === "light" ? "#4B5563" : "rgba(255,255,255,0.75)" }}>Chaque marque a son ADN. Trouve la tienne, puis ses pièces compatibles.</p>}
    </div>
    <span className="flex items-baseline gap-1.5 shrink-0" style={{ fontFamily: FONT }}>
      <span className="text-2xl sm:text-3xl" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: tone === "light" ? CARBON : "#fff" }}>{n ?? "…"}</span>
      <span className="text-sm font-bold uppercase tracking-wider" style={{ color: tone === "light" ? "#6B7280" : "rgba(255,255,255,0.7)" }}>marques</span>
    </span>
  </div>
);

const AllLink = ({ n, tone }: { n: number; tone: Tone }) => (
  <Link to="/marques" className="mt-6 inline-flex items-center gap-2 min-h-[44px] text-sm font-extrabold uppercase tracking-wider underline underline-offset-[6px] decoration-2" style={{ fontFamily: FONT, color: tone === "light" ? CARBON : "#fff" }}>
    Les {n} marques <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
  </Link>
);

/** Plaque logo (variante 4) : logo sur blanc, nom en repli si pas de logo, nombre de modèles. */
const LogoPlate = ({ b }: { b: BrandWallItem }) => (
  <Link to={`/marque/${b.slug}`} className="group relative flex flex-col items-center justify-center h-[96px] sm:h-[112px] px-3 bg-white transition-transform hover:-translate-y-0.5" style={{ clipPath: cut(10), boxShadow: `inset 0 0 0 1px ${LINE}` }}>
    {b.logo_url ? (
      <img src={b.logo_url} alt={b.name} loading="lazy" className="max-h-[40px] sm:max-h-[48px] max-w-[85%] object-contain" />
    ) : (
      <span className="text-base uppercase leading-none text-center" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>{b.name}</span>
    )}
    <span className="absolute left-2 bottom-1.5 text-sm" style={{ fontFamily: FONT, color: "#6B7280" }}>
      <b style={{ fontFamily: UNB, fontStyle: "italic", fontWeight: 900, color: CARBON }}>{b.models_count}</b> modèles
    </span>
    <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: b.signature_color || GREEN }} />
  </Link>
);

const BrandWallAtelier = ({ variant }: { variant: MurVariant }) => {
  const { data: wall = [], isLoading } = useBrandWall();
  const { data: rows = [] } = useBrands();
  const [q, setQ] = useState("");
  const [axis, setAxis] = useState<BrandAxis | null>(null);
  const hero = useMemo(() => new Map((rows as { slug: string; hero_image_url: string | null }[]).map((r) => [r.slug, r.hero_image_url])), [rows]);
  const base = useMemo(() => wall.filter((b) => b.models_count > 0), [wall]);

  const list = useMemo((): BrandWallItem[] => {
    const nq = norm(q.trim());
    const l = base.filter((b) => !nq || norm(b.name).includes(nq));
    if (axis) {
      const sc = (b: BrandWallItem) => b.champions[axis]?.score ?? null;
      const cmp = (a: BrandWallItem, c: BrandWallItem) => (sc(c) ?? -1) - (sc(a) ?? -1) || a.name.localeCompare(c.name, "fr");
      const organic = l.filter((b) => !b.sponsored && sc(b) !== null);
      const max = organic.length ? Math.max(...organic.map((b) => sc(b)!)) : 0;
      return [...l.filter((b) => b.sponsored).sort(cmp), ...organic.filter((b) => sc(b)! >= max * RATIO).sort(cmp)];
    }
    return [...l].sort((a, b) => b.models_count - a.models_count || a.name.localeCompare(b.name, "fr"));
  }, [base, q, axis]);

  const total = base.length;
  const photo = (b: BrandWallItem) => brandPhoto({ slug: b.slug, hero_image_url: hero.get(b.slug) });
  const sub = (b: BrandWallItem) => (axis && b.champions[axis] ? `Top : ${b.champions[axis]!.name}` : `${b.models_count} modèles`);
  const tile = (b: BrandWallItem, cls: string) => (
    <PhotoTile key={b.slug} to={`/marque/${b.slug}`} img={photo(b)} name={b.name} logo={b.logo_url} sub={sub(b)} className={cls} />
  );
  const empty = !isLoading && list.length === 0 && (
    <p className="py-8 text-base" style={{ fontFamily: FONT, color: "#6B7280" }}>Aucune marque avec ces critères.</p>
  );
  const search = () => (
    <form role="search" onSubmit={(e) => e.preventDefault()} className="mt-4 flex items-stretch h-14 max-w-2xl" style={{ filter: "drop-shadow(0 6px 14px rgba(26,26,26,0.10))" }}>
      <label className="flex-1 flex items-center gap-3 pl-4 pr-3 bg-white min-w-0" style={{ boxShadow: `inset 0 0 0 1px ${LINE}` }}>
        <Search className="w-5 h-5 shrink-0 text-gray-400" aria-hidden />
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ta marque : Xiaomi, Dualtron, Kaabo…" aria-label="Rechercher une marque"
          className="w-full h-full bg-transparent outline-none text-base placeholder:text-gray-400" style={{ fontFamily: FONT, color: CARBON }} />
      </label>
      <button type="submit" aria-label="Rechercher" className="flex items-center justify-center w-16 -ml-2 shrink-0" style={{ background: CARBON, clipPath: "polygon(12px 0, 100% 0, 100% 100%, 0 100%)" }}>
        <ArrowRight className="w-5 h-5 text-white" strokeWidth={2.5} />
      </button>
    </form>
  );

  // 1 — ATELIER : la lecture littérale, le gabarit de /marques en format accueil (8 marques).
  if (variant === 1) {
    return (
      <section className="py-12 lg:py-16" style={{ background: BEIGE }} aria-labelledby="brand-wall-title" data-mur-variant="1">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <Title tone="light" n={isLoading ? null : total} />
          {search()}
          <div className="mt-4"><UsagePlates axis={axis} setAxis={setAxis} tone="light" /></div>
          {empty || <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">{list.slice(0, 8).map((b) => tile(b, "w-full aspect-[4/3]"))}</div>}
          <AllLink n={total} tone="light" />
        </div>
      </section>
    );
  }

  // 2 — FRISE : une rangée de grandes photos qui défile au doigt, la suivante dépasse du bord.
  if (variant === 2) {
    return (
      <section className="py-12 lg:py-16" style={{ background: BEIGE }} aria-labelledby="brand-wall-title" data-mur-variant="2">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <Title tone="light" n={isLoading ? null : total} />
          <div className="mt-5"><UsagePlates axis={axis} setAxis={setAxis} tone="light" /></div>
          {empty || (
            <div className="mt-5 flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 scroll-px-4 lg:mx-0 lg:px-0 lg:scroll-px-0" style={{ scrollbarWidth: "none" }}>
              {list.slice(0, 16).map((b) => <div key={b.slug} className="snap-start shrink-0">{tile(b, "block w-[68vw] max-w-[260px] h-[300px] sm:h-[340px]")}</div>)}
            </div>
          )}
          <AllLink n={total} tone="light" />
        </div>
      </section>
    );
  }

  // 3 — CARBONE : un seul plan carbone à coin coupé, les photos de marque ressortent sur le noir.
  if (variant === 3) {
    return (
      <section className="py-10 lg:py-14" style={{ background: BEIGE }} aria-labelledby="brand-wall-title" data-mur-variant="3">
        <div style={{ background: CARBON, clipPath: "polygon(0 0, calc(100% - 48px) 0, 100% 48px, 100% 100%, 0 100%)" }}>
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 lg:py-16">
            <Title tone="dark" n={isLoading ? null : total} />
            <div className="mt-5"><UsagePlates axis={axis} setAxis={setAxis} tone="dark" /></div>
            {empty || <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">{list.slice(0, 8).map((b) => tile(b, "w-full aspect-[4/3]"))}</div>}
            <AllLink n={total} tone="dark" />
          </div>
        </div>
      </section>
    );
  }

  // 4 — LOGOS : un mur dense de plaques logo, 18 marques d'un coup d'œil, sans photo.
  if (variant === 4) {
    return (
      <section className="py-12 lg:py-16" style={{ background: BEIGE }} aria-labelledby="brand-wall-title" data-mur-variant="4">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <Title tone="light" n={isLoading ? null : total} />
          {search()}
          <div className="mt-4"><UsagePlates axis={axis} setAxis={setAxis} tone="light" /></div>
          {empty || <div className="mt-5 grid grid-cols-3 md:grid-cols-6 gap-2.5">{list.slice(0, 18).map((b) => <LogoPlate key={b.slug} b={b} />)}</div>}
          <AllLink n={total} tone="light" />
        </div>
      </section>
    );
  }

  // 5 — VEDETTE : la marque n°1 en grand (ou la n°1 de l'usage choisi), puis 6 marques.
  const [top, ...rest] = list;
  return (
    <section className="py-12 lg:py-16" style={{ background: BEIGE }} aria-labelledby="brand-wall-title" data-mur-variant="5">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <Title tone="light" n={isLoading ? null : total} sub={false} />
        <div className="mt-5"><UsagePlates axis={axis} setAxis={setAxis} tone="light" /></div>
        {empty || (top && (
          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link to={`/marque/${top.slug}`} className="group relative col-span-2 md:row-span-2 overflow-hidden h-[260px] md:h-auto" style={{ clipPath: cut(18), background: "#2A2A2A" }}>
              {photo(top) && <img src={optimizedImage(photo(top)!, 1200)} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]" />}
              <span aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(26,26,26,0.92), rgba(26,26,26,0) 65%)" }} />
              <span className="absolute left-4 right-4 bottom-4">
                <span className="block text-sm font-bold uppercase tracking-[0.16em] text-white/75" style={{ fontFamily: FONT }}>{axis ? `N°1 en ${AXIS_UI[axis].label.toLowerCase()}` : "La plus fournie"}</span>
                <span className="block text-3xl md:text-5xl uppercase leading-none mt-1" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: "#fff" }}>{top.name}</span>
                <span className="mt-2 inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-white" style={{ fontFamily: FONT }}>{sub(top)} · voir ses pièces <ArrowRight className="w-4 h-4" /></span>
              </span>
            </Link>
            {rest.slice(0, 4).map((b) => tile(b, "w-full aspect-[4/3]"))}
          </div>
        ))}
        <AllLink n={total} tone="light" />
      </div>
    </section>
  );
};

export default BrandWallAtelier;
