/**
 * Refonte du module « Pièces pour ta trott » de l'accueil — propositions du 18/10/2026 (?home=1..5).
 * Défaut constaté : deux cadres sombres emboîtés (bande anthracite + capsule #2A2A2A), polices
 * Anton/Inter hors identité Atelier, bords ronds. Correction commune aux 5 : un seul plan,
 * titres Unbounded 900 italique, texte Plus Jakarta Sans, coins coupés (chanfrein), orange absent.
 * Depuis le 18/10 : la 1 (Sans cadre) est servie par défaut ; ?home=0 rend l'ancien module.
 */
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown, Search, X } from "lucide-react";
import type { CategoryGroupV2 } from "@/hooks/useShopByCategoryDataV2";
import { optimizedImage } from "@/lib/imageTransform";

export type HomeVariant = 1 | 2 | 3 | 4 | 5;

/** Choix de Nolan du 18/10 : « 1 Sans cadre » par défaut. ?home=2..5 = autres propositions, ?home=0 = ancien module. */
export const readHomeVariant = (): 0 | HomeVariant => {
  try {
    const raw = new URLSearchParams(window.location.search).get("home");
    if (raw === null) return 1;
    const n = Number(raw);
    return n >= 1 && n <= 5 ? (n as HomeVariant) : n === 0 ? 0 : 1;
  } catch {
    return 1;
  }
};

const UNB = "'Unbounded', sans-serif";
const FONT = "'Plus Jakarta Sans', sans-serif";
const CARBON = "#1A1A1A";
const GREEN = "#4A7C59";
const LINE = "#E2DCD0";
const BEIGE = "#FAFAF8";
const cut = (px: number) => `polygon(0 0, calc(100% - ${px}px) 0, 100% ${px}px, 100% 100%, 0 100%)`;

interface Props {
  variant: HomeVariant;
  scooterName: string | null;
  brandName: string | null;
  brandColor: string | null;
  totalCount: number;
  categories: CategoryGroupV2[];
  selectedSlugs: Set<string>;
  onToggle: (slug: string) => void;
  query: string;
  onQuery: (v: string) => void;
  onPickScooter: () => void;
  onClearScooter: () => void;
  catalogueHref: string;
  ctaLabel: string | null;
  grid: ReactNode;
  productsRef: React.RefObject<HTMLDivElement>;
}

type Tone = "light" | "dark" | "green";

const Title = ({ scooterName, brandName, accent, tone, size = "lg" }: { scooterName: string | null; brandName: string | null; accent: string; tone: Tone; size?: "lg" | "md" }) => {
  const ink = tone === "light" ? CARBON : "#FFFFFF";
  const big = size === "lg" ? "text-[30px] sm:text-5xl lg:text-6xl" : "text-[26px] sm:text-4xl";
  return (
    <h2 className={`${big} uppercase leading-[0.95]`} style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.03em", color: ink }}>
      {scooterName ? (
        <>
          <span className="block text-base sm:text-xl mb-1" style={{ color: tone === "light" ? "#6B7280" : "rgba(255,255,255,0.7)", letterSpacing: "0" }}>
            Pour ta {brandName && brandName !== scooterName ? brandName : ""}
          </span>
          <span style={{ color: tone === "green" ? "#FFFFFF" : accent }}>{scooterName}</span>
        </>
      ) : (
        <>
          Tout le <span style={{ color: tone === "green" ? CARBON : tone === "dark" ? "#8FBF9C" : GREEN }}>catalogue.</span>
        </>
      )}
    </h2>
  );
};

const Counter = ({ n, scooter, tone }: { n: number; scooter: boolean; tone: Tone }) => (
  <span className="flex items-baseline gap-1.5 shrink-0" style={{ fontFamily: FONT }}>
    <span className="text-2xl sm:text-3xl" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: tone === "light" ? CARBON : "#FFFFFF" }}>{n}</span>
    <span className="text-sm font-bold uppercase tracking-wider" style={{ color: tone === "light" ? "#6B7280" : "rgba(255,255,255,0.7)" }}>
      {scooter ? (n > 1 ? "compatibles" : "compatible") : n > 1 ? "pièces" : "pièce"}
    </span>
  </span>
);

const SearchBar = ({ query, onQuery, tone, arrow = CARBON }: { query: string; onQuery: (v: string) => void; tone: Tone; arrow?: string }) => (
  <form role="search" onSubmit={(e) => e.preventDefault()} className="flex items-stretch h-14 w-full" style={{ filter: tone === "light" ? "drop-shadow(0 6px 14px rgba(26,26,26,0.10))" : "none" }}>
    <label className="flex-1 flex items-center gap-3 pl-4 pr-2 bg-white min-w-0" style={{ boxShadow: tone === "light" ? `inset 0 0 0 1px ${LINE}` : "none" }}>
      <Search className="w-5 h-5 shrink-0 text-gray-400" aria-hidden />
      <input
        type="search"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder="Pneu 10x2.5, plaquettes, chargeur 48V…"
        aria-label="Rechercher une pièce dans le catalogue"
        className="w-full h-full bg-transparent outline-none text-base placeholder:text-gray-400"
        style={{ fontFamily: FONT, color: CARBON }}
      />
      {query && (
        <button type="button" onClick={() => onQuery("")} aria-label="Effacer la recherche" className="w-11 h-11 flex items-center justify-center shrink-0">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      )}
    </label>
    <button type="submit" aria-label="Rechercher" className="flex items-center justify-center w-16 -ml-2 shrink-0" style={{ background: arrow, clipPath: "polygon(12px 0, 100% 0, 100% 100%, 0 100%)" }}>
      <ArrowRight className="w-5 h-5 text-white" strokeWidth={2.5} />
    </button>
  </form>
);

/** Plaques texte chanfreinées (nom + nombre), frise horizontale sur téléphone. */
const Plates = ({ categories, selectedSlugs, onToggle, tone }: { categories: CategoryGroupV2[]; selectedSlugs: Set<string>; onToggle: (s: string) => void; tone: Tone }) => (
  <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap" style={{ scrollbarWidth: "none" }} role="group" aria-label="Filtrer par catégorie">
    {categories.map((c) => {
      const on = selectedSlugs.has(c.slug);
      const idle = tone === "light" ? { background: "#FFFFFF", color: CARBON, boxShadow: `inset 0 0 0 1px ${LINE}` } : tone === "dark" ? { background: "#2A2A2A", color: "#FFFFFF" } : { background: "rgba(255,255,255,0.14)", color: "#FFFFFF" };
      const active = tone === "green" ? { background: "#FFFFFF", color: CARBON } : { background: tone === "dark" ? GREEN : CARBON, color: "#FFFFFF" };
      return (
        <button
          key={c.slug}
          type="button"
          onClick={() => onToggle(c.slug)}
          aria-pressed={on}
          className="shrink-0 min-h-[44px] pl-3.5 pr-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide whitespace-nowrap"
          style={{ fontFamily: FONT, clipPath: cut(8), ...(on ? active : idle) }}
        >
          {c.name}
          <span style={{ fontFamily: UNB, fontStyle: "italic", fontWeight: 900, opacity: on ? 1 : 0.55 }}>{c.count}</span>
        </button>
      );
    })}
  </div>
);

/** Vignettes photo bord à bord (même dessin que /catalogue). */
const PhotoPlates = ({ categories, selectedSlugs, onToggle }: { categories: CategoryGroupV2[]; selectedSlugs: Set<string>; onToggle: (s: string) => void }) => (
  <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0" style={{ scrollbarWidth: "none" }} role="group" aria-label="Filtrer par catégorie">
    {categories.map((c) => {
      const on = selectedSlugs.has(c.slug);
      return (
        <button key={c.slug} type="button" onClick={() => onToggle(c.slug)} aria-pressed={on} className="relative shrink-0 h-[112px] w-[132px] sm:h-[128px] sm:w-[150px] overflow-hidden text-left bg-white" style={{ clipPath: cut(12), boxShadow: on ? `inset 0 0 0 3px ${GREEN}` : `inset 0 0 0 1px ${LINE}` }}>
          {c.image_url && <img src={optimizedImage(c.image_url, 320)} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-contain p-4 pb-9" />}
          <span className="absolute left-2 top-2 px-1.5 py-0.5 text-sm leading-none" style={{ fontFamily: UNB, fontStyle: "italic", fontWeight: 900, background: on ? GREEN : CARBON, color: "#fff", clipPath: cut(5) }}>{c.count}</span>
          <span className="absolute left-0 right-0 bottom-0 px-2.5 py-2 text-sm font-extrabold uppercase leading-tight truncate" style={{ fontFamily: FONT, background: on ? GREEN : CARBON, color: "#fff" }}>{c.name}</span>
        </button>
      );
    })}
  </div>
);

/** Onglets texte numérotés, soulignés vert (variante « Sélecteur d'abord »). */
const Tabs = ({ categories, selectedSlugs, onToggle }: { categories: CategoryGroupV2[]; selectedSlugs: Set<string>; onToggle: (s: string) => void }) => (
  <div className="flex gap-5 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0" style={{ scrollbarWidth: "none", boxShadow: `inset 0 -1px 0 ${LINE}` }} role="group" aria-label="Filtrer par catégorie">
    {categories.map((c) => {
      const on = selectedSlugs.has(c.slug);
      return (
        <button key={c.slug} type="button" onClick={() => onToggle(c.slug)} aria-pressed={on} className="shrink-0 min-h-[48px] flex items-center gap-1.5 text-sm font-extrabold uppercase tracking-wide whitespace-nowrap" style={{ fontFamily: FONT, color: on ? CARBON : "#6B7280", boxShadow: on ? `inset 0 -3px 0 ${GREEN}` : "none" }}>
          {c.name}
          <sup className="text-sm" style={{ fontFamily: UNB, fontStyle: "italic", fontWeight: 900, color: on ? GREEN : "#9CA3AF" }}>{c.count}</sup>
        </button>
      );
    })}
  </div>
);

const ScooterPicker = ({ scooterName, brandName, onPick, onClear, tone }: { scooterName: string | null; brandName: string | null; onPick: () => void; onClear: () => void; tone: Tone }) => {
  const dark = tone !== "light";
  return (
    <div className="flex items-stretch min-h-[56px]">
      <button type="button" onClick={onPick} className="flex-1 flex items-center justify-between gap-3 px-4 text-left min-w-0" style={{ background: dark ? "rgba(255,255,255,0.10)" : CARBON, color: "#FFFFFF", clipPath: scooterName ? undefined : cut(10) }}>
        <span className="min-w-0">
          <span className="block text-sm font-bold uppercase tracking-[0.12em] opacity-70" style={{ fontFamily: FONT }}>{scooterName ? "Compatible avec" : "Compatibilité · facultatif"}</span>
          <span className="block text-base truncate" style={{ fontFamily: UNB, fontWeight: 800, fontStyle: "italic" }}>{scooterName ? `${brandName && brandName !== scooterName ? brandName + " " : ""}${scooterName}` : "Ma trottinette"}</span>
        </span>
        <ChevronDown className="w-5 h-5 shrink-0" />
      </button>
      {scooterName && (
        <button type="button" onClick={onClear} aria-label="Retirer la trottinette" className="w-14 flex items-center justify-center shrink-0" style={{ background: dark ? "rgba(255,255,255,0.18)" : "#2A2A2A", color: "#fff", clipPath: cut(10) }}>
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

/** Sur fond clair, les cartes pièces (texte blanc) reçoivent un fond carbone : plaques sombres sur l'établi clair. */
const CarbonCards = ({ children }: { children: ReactNode }) => (
  <div className="pt-cards-carbon">
    <style>{`.pt-cards-carbon .pt-slim-card{background-color:${CARBON}!important}`}</style>
    {children}
  </div>
);

const FootLink = ({ href, label, tone }: { href: string; label: string; tone: Tone }) => (
  <Link to={href} className="mt-6 inline-flex items-center gap-2 min-h-[44px] text-sm font-extrabold uppercase tracking-wider underline underline-offset-[6px] decoration-2" style={{ fontFamily: FONT, color: tone === "light" ? CARBON : "#FFFFFF" }}>
    {label}
    <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
  </Link>
);

const AtelierShell = (p: Props) => {
  const accent = p.brandColor ?? GREEN;
  const hasScooter = !!p.scooterName;
  const footLabel = p.ctaLabel || (hasScooter && p.brandName ? `Tout le catalogue ${p.brandName}` : "Voir tout le catalogue");

  // 1 — SANS CADRE : la lecture littérale. Même module, le cadre sombre en moins, en identité Atelier.
  if (p.variant === 1) {
    return (
      <section className="w-full" style={{ background: BEIGE }} data-home-variant="1">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 lg:py-16">
          <div className="flex items-end justify-between gap-4">
            <Title scooterName={p.scooterName} brandName={p.brandName} accent={accent} tone="light" />
            <Counter n={p.totalCount} scooter={hasScooter} tone="light" />
          </div>
          {!hasScooter && (
            <p className="mt-3 text-base max-w-2xl" style={{ fontFamily: FONT, color: "#4B5563", lineHeight: 1.5 }}>
              Cherche directement le produit. Ta trott en tête ? Filtre pour ne voir que ce qui va dessus.
            </p>
          )}
          <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="min-w-0"><SearchBar query={p.query} onQuery={p.onQuery} tone="light" /></div>
            <div className="min-w-0 order-last lg:order-none">
              <ScooterPicker scooterName={p.scooterName} brandName={p.brandName} onPick={p.onPickScooter} onClear={p.onClearScooter} tone="light" />
            </div>
            <div ref={p.productsRef} className="min-w-0 scroll-mt-4 lg:col-span-2 lg:mt-2">
              <Plates categories={p.categories} selectedSlugs={p.selectedSlugs} onToggle={p.onToggle} tone="light" />
            </div>
          </div>
          <div className="mt-5" />
          <CarbonCards>{p.grid}</CarbonCards>
          <FootLink href={p.catalogueHref} label={footLabel} tone="light" />
        </div>
      </section>
    );
  }

  // 2 — ÉTABLI : on garde le sombre, mais UN seul plan carbone, coin coupé, sans capsule.
  if (p.variant === 2) {
    return (
      <section className="w-full" style={{ background: BEIGE }} data-home-variant="2">
        <div className="w-full" style={{ background: CARBON, clipPath: "polygon(0 0, calc(100% - 48px) 0, 100% 48px, 100% 100%, 0 100%)" }}>
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 lg:py-16">
            <div className="flex items-end justify-between gap-4">
              <Title scooterName={p.scooterName} brandName={p.brandName} accent={accent} tone="dark" />
              <Counter n={p.totalCount} scooter={hasScooter} tone="dark" />
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <SearchBar query={p.query} onQuery={p.onQuery} tone="dark" arrow={GREEN} />
              <ScooterPicker scooterName={p.scooterName} brandName={p.brandName} onPick={p.onPickScooter} onClear={p.onClearScooter} tone="dark" />
            </div>
            <div ref={p.productsRef} className="scroll-mt-4 mt-5 mb-5">
              <Plates categories={p.categories} selectedSlugs={p.selectedSlugs} onToggle={p.onToggle} tone="dark" />
            </div>
            {p.grid}
            <FootLink href={p.catalogueHref} label={footLabel} tone="dark" />
          </div>
        </div>
      </section>
    );
  }

  // 3 — PLAQUE : beige, une grande plaque blanche à coin coupé, catégories en photos bord à bord.
  if (p.variant === 3) {
    return (
      <section className="w-full" style={{ background: BEIGE }} data-home-variant="3">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 lg:py-16">
          <div className="bg-white px-4 py-6 sm:p-8 lg:p-10" style={{ clipPath: cut(28), boxShadow: `inset 0 0 0 1px ${LINE}` }}>
            <div className="flex items-end justify-between gap-4">
              <Title scooterName={p.scooterName} brandName={p.brandName} accent={accent} tone="light" size="md" />
              <Counter n={p.totalCount} scooter={hasScooter} tone="light" />
            </div>
            <div className="mt-5 max-w-2xl">
              <SearchBar query={p.query} onQuery={p.onQuery} tone="light" />
            </div>
            <div ref={p.productsRef} className="scroll-mt-4 mt-5 mb-5">
              <PhotoPlates categories={p.categories} selectedSlugs={p.selectedSlugs} onToggle={p.onToggle} />
            </div>
            <CarbonCards>{p.grid}</CarbonCards>
            <FootLink href={p.catalogueHref} label={footLabel} tone="light" />
          </div>
        </div>
      </section>
    );
  }

  // 4 — SÉLECTEUR D'ABORD : la trott avant tout, recherche à côté, catégories en onglets.
  if (p.variant === 4) {
    return (
      <section className="w-full" style={{ background: BEIGE }} data-home-variant="4">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 lg:py-16">
          <p className="text-sm font-bold uppercase tracking-[0.14em] mb-2" style={{ fontFamily: FONT, color: GREEN }}>Étape 1 · ta trott — étape 2 · ta pièce</p>
          <Title scooterName={p.scooterName} brandName={p.brandName} accent={accent} tone="light" />
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            <ScooterPicker scooterName={p.scooterName} brandName={p.brandName} onPick={p.onPickScooter} onClear={p.onClearScooter} tone="light" />
            <SearchBar query={p.query} onQuery={p.onQuery} tone="light" arrow={GREEN} />
          </div>
          <div ref={p.productsRef} className="scroll-mt-4 mt-6 mb-5 flex items-end justify-between gap-4">
            <div className="min-w-0 flex-1"><Tabs categories={p.categories} selectedSlugs={p.selectedSlugs} onToggle={p.onToggle} /></div>
            <span className="hidden sm:block pb-3"><Counter n={p.totalCount} scooter={hasScooter} tone="light" /></span>
          </div>
          <CarbonCards>{p.grid}</CarbonCards>
          <FootLink href={p.catalogueHref} label={footLabel} tone="light" />
        </div>
      </section>
    );
  }

  // 5 — VERT ATELIER : un seul plan vert de la marque, plaques claires, flèche carbone.
  return (
    <section className="w-full" style={{ background: BEIGE }} data-home-variant="5">
      <div className="w-full" style={{ background: GREEN }}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 lg:py-16">
          <div className="flex items-end justify-between gap-4">
            <Title scooterName={p.scooterName} brandName={p.brandName} accent={accent} tone="green" />
            <Counter n={p.totalCount} scooter={hasScooter} tone="green" />
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <SearchBar query={p.query} onQuery={p.onQuery} tone="green" arrow={CARBON} />
            <ScooterPicker scooterName={p.scooterName} brandName={p.brandName} onPick={p.onPickScooter} onClear={p.onClearScooter} tone="green" />
          </div>
          <div ref={p.productsRef} className="scroll-mt-4 mt-5 mb-5">
            <Plates categories={p.categories} selectedSlugs={p.selectedSlugs} onToggle={p.onToggle} tone="green" />
          </div>
          {p.grid}
          <FootLink href={p.catalogueHref} label={footLabel} tone="green" />
        </div>
      </div>
    </section>
  );
};

export default AtelierShell;
