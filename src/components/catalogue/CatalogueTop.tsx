/**
 * Haut de la page /catalogue (Pièces détachées) — 5 propositions (17/10/2026, skill « cinq propositions rendues »).
 * Activées par ?vue=1..5 ; sans paramètre, la page actuelle ne change pas.
 *
 * Défaut corrigé dans les 5 : pas de recherche, pas de filtres, catégories en grosses cartes
 * arrondies génériques. Ici : recherche, catégories et filtres (prix, stock, tri, « ma trottinette »)
 * dans le même langage que /trottinettes (plaques à coin coupé, Unbounded italique, filet vert).
 *
 * 1 VITRINE      · titre à gauche, recherche, catégories en vignettes-photo à coin coupé (2 lignes)
 * 2 RAYON        · catégories en bandeau qui défile (photo + nom), comme un rayon d'atelier
 * 3 ONGLETS      · catégories en onglets texte soulignés, très compact, la grille de pièces remonte
 * 4 COCKPIT      · bandeau carbone : titre, recherche et catégories sur fond noir
 * 5 ÉTABLI       · colonne de gauche (catégories + filtres) sur ordinateur, grille à droite
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown, LayoutGrid, Search, ArrowRight, X, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { trigger, badge, sortCls, UNB, FONT, CARBON, GREEN, LINE } from "@/components/scooters/filterSkins";

export type CatalogueLook = 1 | 2 | 3 | 4 | 5;

export interface CatCategory { id: string; name: string; slug: string }
export const PRICE_OPTS = [
  { value: "15", label: "Moins de 15 €", min: 0, max: 15 },
  { value: "30", label: "15 à 30 €", min: 15, max: 30 },
  { value: "60", label: "30 à 60 €", min: 30, max: 60 },
  { value: "plus", label: "Plus de 60 €", min: 60, max: 1e9 },
];
export const PART_SORTS = [
  { value: "", label: "Mis en avant" },
  { value: "prix", label: "Prix croissant" },
  { value: "prix-desc", label: "Prix décroissant" },
  { value: "nom", label: "Nom (A → Z)" },
];

interface Props {
  look: CatalogueLook;
  total: number;
  resultCount: number;
  categories: CatCategory[];
  images: Record<string, string | undefined>;
  counts: Record<string, number>;
  activeCategory: string | null;
  onCategory: (id: string | null) => void;
  query: string;
  onQuery: (q: string) => void;
  prices: string[];
  onTogglePrice: (v: string) => void;
  inStock: boolean;
  onStock: (v: boolean) => void;
  sort: string;
  onSort: (v: string) => void;
  /** Trottinette du garage / sélecteur : « Ma trott » filtre ses pièces compatibles. */
  myScooter: { id: string; name: string } | null;
  scooterOn: boolean;
  onScooter: (on: boolean) => void;
}

const CHAMFER = "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)";

// ─── Recherche (champ local, envoyé à l'URL après 350 ms) ───
const SearchField = ({ value, onChange, dark = false, big = false }: { value: string; onChange: (v: string) => void; dark?: boolean; big?: boolean }) => {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  useEffect(() => {
    if (v === value) return;
    const t = setTimeout(() => onChange(v), 350);
    return () => clearTimeout(t);
  }, [v]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className={cn("flex items-stretch", big ? "h-16" : "h-14")} style={dark ? undefined : { filter: "drop-shadow(0 6px 14px rgba(26,26,26,0.10))" }}>
      <label className="flex-1 flex items-center gap-3 pl-4 pr-3" style={dark ? { background: "rgba(255,255,255,0.08)", borderRadius: 6 } : { background: "#fff", boxShadow: `inset 0 0 0 1px ${LINE}` }}>
        <Search className={cn("w-5 h-5 shrink-0", dark ? "text-white/60" : "text-gray-400")} />
        <input type="search" value={v} onChange={(e) => setV(e.target.value)} placeholder="Pneu 10x2.50, chargeur 42V, plaquettes…"
          aria-label="Rechercher une pièce" className={cn("w-full h-full bg-transparent outline-none text-base", dark ? "text-white placeholder:text-white/45" : "text-carbon placeholder:text-gray-400")} style={{ fontFamily: FONT }} />
        {v && <button type="button" onClick={() => { setV(""); onChange(""); }} aria-label="Effacer" className="w-9 h-9 flex items-center justify-center"><X className={cn("w-4 h-4", dark ? "text-white/70" : "text-gray-500")} /></button>}
      </label>
      {!dark && (
        <button type="button" onClick={() => onChange(v)} aria-label="Lancer la recherche" className="flex items-center justify-center w-16 -ml-2" style={{ background: CARBON, clipPath: "polygon(12px 0, 100% 0, 100% 100%, 0 100%)" }}>
          <ArrowRight className="w-5 h-5 text-white" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};

// ─── Barre de filtres (plaques) ───
const Filters = (p: Props & { dark?: boolean; stacked?: boolean }) => {
  const look = p.dark ? 2 : 1;
  const priceBtn = trigger(look, p.prices.length > 0);
  const stockBtn = trigger(look, p.inStock);
  const scootBtn = trigger(look, p.scooterOn);
  const sk = sortCls(look);
  const wrap = p.stacked ? "flex flex-col items-stretch gap-2" : "flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:overflow-visible";
  return (
    <div className={wrap} style={{ scrollbarWidth: "none" }}>
      {p.myScooter && (
        <button type="button" onClick={() => p.onScooter(!p.scooterOn)} className={cn(scootBtn.cls, "shrink-0")} style={scootBtn.style} aria-pressed={p.scooterOn}>
          {p.scooterOn && <Check className="w-4 h-4" strokeWidth={3} />} Ma {p.myScooter.name}
        </button>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className={cn(priceBtn.cls, "shrink-0")} style={priceBtn.style}>Prix{badge(look, p.prices.length)}<ChevronDown className="w-4 h-4 opacity-60" /></button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-2 rounded-lg">
          {PRICE_OPTS.map((o) => {
            const on = p.prices.includes(o.value);
            return (
              <button key={o.value} type="button" onClick={() => p.onTogglePrice(o.value)} className={cn("w-full flex items-center gap-3 min-h-[44px] px-3 rounded-md text-left text-sm", on ? "bg-[#4A7C59]/10" : "hover:bg-gray-100")}>
                <span className="w-5 h-5 rounded border flex items-center justify-center" style={on ? { background: GREEN, borderColor: GREEN } : { borderColor: "#D1D5DB" }}>{on && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}</span>
                {o.label}
              </button>
            );
          })}
        </PopoverContent>
      </Popover>
      <button type="button" onClick={() => p.onStock(!p.inStock)} className={cn(stockBtn.cls, "shrink-0")} style={stockBtn.style} aria-pressed={p.inStock}>
        {p.inStock && <Check className="w-4 h-4" strokeWidth={3} />} En stock
      </button>
      <label className={cn("relative flex items-center shrink-0", !p.stacked && "md:ml-auto")}>
        <span className="sr-only">Trier</span>
        <select value={p.sort} onChange={(e) => p.onSort(e.target.value)} className={cn(sk.cls, p.stacked && "w-full")} style={sk.style}>
          {PART_SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <ChevronDown className={cn("absolute right-3 w-4 h-4 pointer-events-none", p.dark ? "text-white/70" : "text-gray-500")} />
      </label>
    </div>
  );
};

const Count = ({ n, total, dark = false }: { n: number; total: number; dark?: boolean }) => (
  <span className="flex items-baseline gap-1.5" style={{ fontFamily: FONT }}>
    <span className="text-2xl md:text-3xl" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: dark ? "#fff" : CARBON }}>{n}</span>
    <span className={cn("text-sm font-bold uppercase tracking-wider", dark ? "text-white/60" : "text-gray-500")}>{n === total ? "pièces" : `sur ${total}`}</span>
  </span>
);

const Title = ({ dark = false, center = false }: { dark?: boolean; center?: boolean }) => (
  <h1 className={cn("text-3xl md:text-5xl uppercase leading-none", center && "text-center")} style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.03em", color: dark ? "#fff" : CARBON }}>
    Pièces détachées
  </h1>
);

// ─── Vignette catégorie : photo pleine bord à bord (17/10 : plus de « carré dans le carré »),
//     nom en blanc sur dégradé, nombre en haut à gauche, coin coupé ; active = cadre carbone + barre verte.
const CatTile = ({ c, img, n, on, onClick, size = "md" }: { c: CatCategory | null; img?: string; n: number; on: boolean; onClick: () => void; size?: "sm" | "md" }) => (
  <button type="button" onClick={onClick} aria-pressed={on}
    className={cn("relative shrink-0 overflow-hidden text-left transition-transform hover:-translate-y-0.5 group", size === "md" ? "h-[128px] md:h-[140px]" : "h-[112px] w-[118px]")}
    style={{ clipPath: CHAMFER, background: c ? "#EFE9DF" : CARBON }}>
    {c && img && (
      <img src={img} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover scale-[1.18] transition-transform duration-300 group-hover:scale-[1.26]" />
    )}
    {!c && <LayoutGrid className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-white" />}
    <span aria-hidden className="absolute inset-x-0 bottom-0 h-[62%]" style={{ background: c ? "linear-gradient(to top, rgba(26,26,26,0.88), rgba(26,26,26,0))" : "none" }} />
    <span className="absolute left-2 top-2 px-1.5 py-0.5 text-sm leading-none" style={{ fontFamily: UNB, fontStyle: "italic", fontWeight: 900, background: on ? GREEN : "rgba(255,255,255,0.92)", color: on ? "#fff" : CARBON, clipPath: "polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 0 100%)" }}>{n}</span>
    <span className="absolute left-2.5 right-2 bottom-2 text-sm leading-tight line-clamp-2" style={{ fontFamily: FONT, fontWeight: 800, color: "#fff", hyphens: "auto" }} lang="fr">{c ? c.name : "Toutes"}</span>
    {on && <span aria-hidden className="absolute inset-x-0 bottom-0 h-1" style={{ background: GREEN }} />}
    {on && <span aria-hidden className="absolute inset-0" style={{ boxShadow: `inset 0 0 0 3px ${CARBON}` }} />}
  </button>
);

/** 17/10 : accès visible à la page de la catégorie (/categorie/:slug : présentation + toutes les références).
 *  Avant, seul un petit bouton au survol des anciennes cartes y menait — invisible sur téléphone. */
const GuideLink = ({ cat, n }: { cat: CatCategory | undefined; n: number }) =>
  cat ? (
    <Link to={`/categorie/${cat.slug}`} className="mt-3 flex items-center gap-3 min-h-[52px] pl-4 pr-3 bg-white transition-transform hover:-translate-y-0.5"
      style={{ clipPath: CHAMFER, boxShadow: `inset 4px 0 0 ${GREEN}, inset 0 0 0 1px ${LINE}` }}>
      <BookOpen className="w-5 h-5 shrink-0" style={{ color: GREEN }} />
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-extrabold uppercase tracking-wide truncate" style={{ fontFamily: FONT, color: CARBON }}>Tout sur les {cat.name.toLowerCase()}</span>
        <span className="block text-sm text-gray-500 truncate" style={{ fontFamily: FONT }}>Les {n} références et comment choisir</span>
      </span>
      <ArrowRight className="w-5 h-5 shrink-0" style={{ color: CARBON }} />
    </Link>
  ) : null;

const CatalogueTop = (p: Props) => {
  const all = p.categories.reduce((n, c) => n + (p.counts[c.id] ?? 0), 0);
  const tiles = (size: "sm" | "md" = "md") => [
    <CatTile key="all" c={null} n={all} on={p.activeCategory === null} onClick={() => p.onCategory(null)} size={size} />,
    ...p.categories.map((c) => <CatTile key={c.id} c={c} img={p.images[c.id]} n={p.counts[c.id] ?? 0} on={p.activeCategory === c.id} onClick={() => p.onCategory(c.id)} size={size} />),
  ];

  // ── 1 · VITRINE ──
  if (p.look === 1) {
    return (
      <section className="container mx-auto px-4 pt-6 lg:pt-10 pb-4">
        <div className="flex items-end justify-between gap-4 flex-wrap"><Title /><Count n={p.resultCount} total={p.total} /></div>
        <div className="mt-5 max-w-2xl"><SearchField value={p.query} onChange={p.onQuery} /></div>
        <div className="mt-5 grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">{tiles()}</div>
        {p.activeCategory && <div className="max-w-2xl"><GuideLink cat={p.categories.find((c) => c.id === p.activeCategory)} n={p.counts[p.activeCategory] ?? 0} /></div>}
        <div className="mt-4"><Filters {...p} /></div>
      </section>
    );
  }
  // ── 2 · RAYON ──
  if (p.look === 2) {
    return (
      <section className="pt-6 lg:pt-10 pb-4">
        <div className="container mx-auto px-4">
          <Title />
          <div className="mt-4 grid md:grid-cols-[1fr_auto] gap-3 items-center">
            <SearchField value={p.query} onChange={p.onQuery} />
            <Count n={p.resultCount} total={p.total} />
          </div>
        </div>
        <div className="mt-5 border-y-2 py-3" style={{ borderColor: CARBON, background: "#F3EFE7" }}>
          <div className="container mx-auto px-4 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>{tiles("sm")}</div>
        </div>
        <div className="container mx-auto px-4 mt-4"><Filters {...p} /></div>
      </section>
    );
  }
  // ── 3 · ONGLETS ──
  if (p.look === 3) {
    const tab = (id: string | null, label: string, n: number) => {
      const on = p.activeCategory === id;
      return (
        <button key={id ?? "all"} type="button" onClick={() => p.onCategory(id)} aria-pressed={on}
          className="shrink-0 min-h-[48px] px-1 flex items-baseline gap-1.5 text-sm uppercase tracking-[0.12em] font-bold"
          style={{ fontFamily: FONT, color: on ? CARBON : "#6B7280", boxShadow: on ? `inset 0 -3px 0 ${GREEN}` : "none" }}>
          {label}<span style={{ fontFamily: UNB, fontStyle: "italic", fontWeight: 900, color: on ? GREEN : "#9CA3AF" }}>{n}</span>
        </button>
      );
    };
    return (
      <section className="container mx-auto px-4 pt-6 lg:pt-10 pb-2">
        <div className="grid md:grid-cols-[auto_1fr] gap-4 md:gap-8 items-center">
          <Title />
          <SearchField value={p.query} onChange={p.onQuery} />
        </div>
        <nav className="mt-5 flex gap-6 overflow-x-auto border-b" style={{ borderColor: "rgba(26,26,26,0.12)", scrollbarWidth: "none" }} aria-label="Catégories">
          {tab(null, "Toutes", all)}
          {p.categories.map((c) => tab(c.id, c.name, p.counts[c.id] ?? 0))}
        </nav>
        <div className="mt-4 flex items-center gap-4"><div className="flex-1 min-w-0"><Filters {...p} /></div><span className="hidden md:block"><Count n={p.resultCount} total={p.total} /></span></div>
      </section>
    );
  }
  // ── 4 · COCKPIT ──
  if (p.look === 4) {
    return (
      <section className="pt-4 lg:pt-6 pb-4">
        <div className="container mx-auto px-4">
          <div className="rounded-2xl p-4 md:p-6" style={{ background: CARBON }}>
            <div className="flex items-end justify-between gap-4 flex-wrap"><Title dark /><Count n={p.resultCount} total={p.total} dark /></div>
            <div className="mt-4"><SearchField value={p.query} onChange={p.onQuery} dark /></div>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {[{ id: null as string | null, name: "Toutes", n: all }, ...p.categories.map((c) => ({ id: c.id as string | null, name: c.name, n: p.counts[c.id] ?? 0 }))].map((c) => {
                const t = trigger(2, p.activeCategory === c.id);
                return <button key={c.id ?? "all"} type="button" onClick={() => p.onCategory(c.id)} className={cn(t.cls, "shrink-0")} style={t.style}>{c.name}{badge(2, c.n)}</button>;
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-white/10"><Filters {...p} dark /></div>
          </div>
        </div>
      </section>
    );
  }
  // ── 5 · ÉTABLI ── (colonne gauche ; la grille de pièces est rendue à droite par la page)
  return (
    <section className="container mx-auto px-4 pt-6 lg:pt-10 pb-2">
      <div className="flex items-end justify-between gap-4 flex-wrap"><Title /><Count n={p.resultCount} total={p.total} /></div>
      <div className="mt-4 max-w-2xl"><SearchField value={p.query} onChange={p.onQuery} /></div>
      <div className="mt-4 lg:hidden flex gap-2 overflow-x-auto -mx-4 px-4 pb-1" style={{ scrollbarWidth: "none" }}>{tiles("sm")}</div>
      <div className="mt-3 lg:hidden"><Filters {...p} /></div>
    </section>
  );
};

/** Colonne gauche de la vue 5 (ordinateur). */
export const EtabliSidebar = (p: Props) => {
  const all = p.categories.reduce((n, c) => n + (p.counts[c.id] ?? 0), 0);
  const row = (id: string | null, name: string, n: number, img?: string) => {
    const on = p.activeCategory === id;
    return (
      <button key={id ?? "all"} type="button" onClick={() => p.onCategory(id)} aria-pressed={on}
        className="w-full flex items-center gap-3 min-h-[48px] px-3 text-left transition-colors"
        style={{ fontFamily: FONT, background: on ? CARBON : "transparent", color: on ? "#fff" : CARBON, clipPath: on ? CHAMFER : undefined, boxShadow: on ? "none" : `inset 0 -1px 0 ${LINE}` }}>
        <span className="w-9 h-9 flex items-center justify-center shrink-0">{img ? <img src={img} alt="" className="max-w-full max-h-full object-contain" /> : <LayoutGrid className="w-5 h-5" />}</span>
        <span className="flex-1 text-sm font-extrabold uppercase">{name}</span>
        <span className="text-sm" style={{ fontFamily: UNB, fontStyle: "italic", fontWeight: 900, color: on ? "#9FD3AE" : GREEN }}>{n}</span>
      </button>
    );
  };
  return (
    <aside className="hidden lg:block sticky top-24 self-start">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-gray-500 mb-2" style={{ fontFamily: FONT }}>Catégories</p>
      {row(null, "Toutes", all)}
      {p.categories.map((c) => row(c.id, c.name, p.counts[c.id] ?? 0, p.images[c.id]))}
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-gray-500 mt-6 mb-2" style={{ fontFamily: FONT }}>Filtres</p>
      <Filters {...p} stacked />
    </aside>
  );
};

export default CatalogueTop;
