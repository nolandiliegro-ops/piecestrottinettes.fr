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
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type React from "react";
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
  /** 24/10 sélecteur de trott (?selecteur=) : bloc sous le titre, et plaque en tête des filtres (remplace « Ma trott »). */
  pickerBlock?: React.ReactNode;
  filtersLead?: React.ReactNode;
  /** 24/10 tour 2 : sélecteur discret à côté du compteur, ou sous la barre de filtres. */
  countAside?: React.ReactNode;
  afterFilters?: React.ReactNode;
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
        <input type="search" value={v} onChange={(e) => setV(e.target.value)} placeholder="Pneu 10x2.5, 42V…"
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
      {p.filtersLead}
      {!p.filtersLead && p.myScooter && (
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

// ─── Vignette catégorie ───
// 19/10 (Nolan : « le "Toutes" noir n'est pas joli », images de catégorie d'époque hétérogènes) :
// packshots Higgsfield détourés (public/categories/<clé>-a|b.webp) + 5 habillages via ?tuile=1..5.
// 19/10 : « 1 Pierre » choisie par Nolan = défaut ; ?tuile=0 = vignette du 17/10 (photo pleine, « Toutes » carbone).
type TuileLook = 1 | 2 | 3 | 4 | 5;
const TUILE: TuileLook | null = (() => {
  try { const r = new URLSearchParams(window.location.search).get("tuile"); if (r === null) return 1; const n = Number(r); return n >= 1 && n <= 5 ? (n as TuileLook) : null; } catch { return null; }
})();
const PACK_SET = (() => { try { return new URLSearchParams(window.location.search).get("img") === "b" ? "b" : "a"; } catch { return "a"; } })();
const PACK_KEY: Record<string, string> = { pneus: "pneus", "pneus-pleins": "pleins", "chambres-a-air": "chambres", plaquettes: "plaquettes", disques: "disques", chargeurs: "chargeurs", "accessoires-divers": "accessoires" };
const pack = (slug?: string) => (slug && PACK_KEY[slug] ? `/categories/${PACK_KEY[slug]}-${PACK_SET}.webp` : undefined);
const STONE = "#EFE9DF";
/** « Toutes » sans pavé noir : trois pièces qui se chevauchent. */
const AllCollage = ({ big = false }: { big?: boolean }) => (
  <span aria-hidden className={cn("absolute inset-x-0 flex items-center justify-center", big ? "top-[8%] bottom-[34%]" : "top-[6%] bottom-[36%]")}>
    <img src={pack("pneus")} alt="" className="absolute h-[92%] w-auto -translate-x-[34%] -rotate-6 object-contain drop-shadow-[0_6px_8px_rgba(0,0,0,0.18)]" />
    <img src={pack("chargeurs")} alt="" className="absolute h-[62%] w-auto translate-x-[42%] translate-y-[14%] object-contain drop-shadow-[0_6px_8px_rgba(0,0,0,0.18)]" />
    <img src={pack("plaquettes")} alt="" className="absolute h-[58%] w-auto translate-x-[4%] translate-y-[22%] rotate-6 object-contain drop-shadow-[0_6px_8px_rgba(0,0,0,0.2)]" />
  </span>
);

const CatTileNew = ({ c, n, on, onClick, size = "md", look }: { c: CatCategory | null; n: number; on: boolean; onClick: () => void; size?: "sm" | "md"; look: TuileLook }) => {
  const src = pack(c?.slug);
  const label = c ? c.name : "Toutes";
  const h = size === "md" ? "h-[128px] md:h-[140px]" : "h-[112px] w-[118px]";
  const num = (color: string) => <span style={{ fontFamily: UNB, fontStyle: "italic", fontWeight: 900, color }}>{n}</span>;
  const img = (cls: string) => (c ? (src ? <img src={src} alt="" loading="lazy" className={cn("absolute object-contain transition-transform duration-300 drop-shadow-[0_8px_10px_rgba(0,0,0,0.18)]", cls)} /> : null) : <AllCollage />);
  const ring = on ? { boxShadow: `inset 0 0 0 2px ${GREEN}` } : { boxShadow: `inset 0 0 0 1px ${LINE}` };

  // 1 PIERRE — la vignette du 17/10 à l'identique (photo, nombre en haut, nom en bas), repassée en clair
  if (look === 1) return (
    <button type="button" onClick={onClick} aria-pressed={on} className={cn("relative shrink-0 overflow-hidden text-left group transition-transform hover:-translate-y-0.5", h)}
      style={{ clipPath: CHAMFER, background: STONE, ...ring }}>
      {img("left-1/2 top-[8%] -translate-x-1/2 h-[62%] w-auto group-hover:scale-[1.08]")}
      <span className="absolute left-2 top-2 px-1.5 py-0.5 text-sm leading-none" style={{ fontFamily: UNB, fontStyle: "italic", fontWeight: 900, background: on ? GREEN : "#fff", color: on ? "#fff" : CARBON, clipPath: "polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 0 100%)" }}>{n}</span>
      <span className="absolute left-2.5 right-2 bottom-2 text-sm leading-tight line-clamp-2" style={{ fontFamily: FONT, fontWeight: 800, color: CARBON, hyphens: "auto" }} lang="fr">{label}</span>
      {on && <span aria-hidden className="absolute inset-x-0 bottom-0 h-1" style={{ background: GREEN }} />}
    </button>
  );
  // 2 ÇA DÉPASSE — plaque blanche basse, la pièce sort par le haut (comme les cartes de l'accueil)
  if (look === 2) return (
    <button type="button" onClick={onClick} aria-pressed={on} className={cn("relative shrink-0 text-left group", h)}>
      <span aria-hidden className="absolute inset-x-0 bottom-0 top-[38%]" style={{ background: on ? "#EEF4EF" : "#fff", clipPath: CHAMFER, ...ring }} />
      {img("left-1/2 top-0 -translate-x-1/2 h-[54%] w-auto origin-bottom group-hover:-translate-y-1 group-hover:scale-[1.06]")}
      <span className="absolute left-2.5 right-2 bottom-2 flex flex-col" style={{ fontFamily: FONT }}>
        <span className="text-sm font-extrabold leading-tight line-clamp-2" style={{ color: CARBON }}>{label} <span style={{ fontFamily: UNB, fontStyle: "italic", fontWeight: 900, color: GREEN }}>{n}</span></span>
      </span>
    </button>
  );
  // 3 ÉTIQUETTE — fond pierre, nom sur étiquette blanche à filet vert
  if (look === 3) return (
    <button type="button" onClick={onClick} aria-pressed={on} className={cn("relative shrink-0 overflow-hidden text-left group transition-transform hover:-translate-y-0.5", h)}
      style={{ clipPath: CHAMFER, background: on ? "#E4EDE6" : STONE }}>
      {img("left-1/2 top-[6%] -translate-x-1/2 h-[52%] w-auto group-hover:scale-[1.08]")}
      <span className="absolute right-2 top-2 text-sm leading-none">{num(GREEN)}</span>
      <span className="absolute left-1.5 right-1.5 bottom-1.5 pl-2 pr-1.5 py-1 bg-white" style={{ boxShadow: `inset 3px 0 0 ${GREEN}`, clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)", fontFamily: FONT }}>
        <span className="block text-sm font-extrabold leading-tight line-clamp-2" style={{ color: CARBON }}>{label}</span>
      </span>
    </button>
  );
  // 4 RAYON — vignette courte : pièce à gauche, nom + nombre à droite (rangée plus basse, la grille remonte)
  if (look === 4) return (
    <button type="button" onClick={onClick} aria-pressed={on} className={cn("relative shrink-0 flex items-center gap-2 pl-1.5 pr-3 h-[64px] text-left group", size === "sm" && "min-w-[176px]")}
      style={{ clipPath: CHAMFER, background: on ? "#EEF4EF" : "#fff", ...ring }}>
      <span className="relative w-[52px] h-[52px] shrink-0 overflow-hidden" style={{ background: STONE, clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)" }}>
        {c ? (src && <img src={src} alt="" loading="lazy" className="absolute inset-[6%] w-[88%] h-[88%] object-contain transition-transform duration-300 group-hover:scale-110" />) : <AllCollage />}
      </span>
      <span className="min-w-0 flex flex-col" style={{ fontFamily: FONT }}>
        <span className="text-sm font-extrabold leading-tight line-clamp-2" style={{ color: CARBON }}>{label}</span>
        <span className="text-sm leading-tight">{num(on ? GREEN : "#6B7280")}</span>
      </span>
    </button>
  );
  // 5 VEDETTE — « Toutes » en grande plaque claire (2 colonnes), les autres en pierre avec le nombre en gros
  return (
    <button type="button" onClick={onClick} aria-pressed={on} className={cn("relative shrink-0 overflow-hidden text-left group transition-transform hover:-translate-y-0.5", h, !c && size === "md" && "col-span-2", !c && size === "sm" && "w-[200px]")}
      style={{ clipPath: CHAMFER, background: c ? STONE : "#fff", ...ring }}>
      {c ? img("right-[-8%] top-[22%] h-[48%] w-auto group-hover:scale-[1.08]") : (
        <span aria-hidden className="absolute right-0 top-0 bottom-0 w-[58%]"><AllCollage big /></span>
      )}
      <span className="absolute left-2.5 top-2 leading-none" style={{ fontFamily: UNB, fontStyle: "italic", fontWeight: 900, fontSize: c ? 22 : 30, color: on ? GREEN : CARBON }}>{n}</span>
      {!c && <span className="absolute left-2.5 top-10 text-sm font-bold uppercase tracking-wide text-gray-500" style={{ fontFamily: FONT }}>pièces</span>}
      <span className="absolute left-2.5 right-2 bottom-2 text-sm font-extrabold leading-tight line-clamp-2" style={{ fontFamily: FONT, color: CARBON }}>{label}</span>
      {on && <span aria-hidden className="absolute inset-x-0 bottom-0 h-1" style={{ background: GREEN }} />}
    </button>
  );
};

/* ─── 25/10 : familles sur TÉLÉPHONE — 5 systèmes (?familles=1..5), l'ordinateur garde la grille ───
 * Nolan : « le listing des catégories sur téléphone, pas assez classe, pas assez wow ; si j'ajoute 5 ou 6 catégories
 * ça devient trop long ». Les 5 tiennent sur UNE hauteur fixe, quel que soit le nombre de familles.
 * 1 DÉFILÉ   · les vignettes Pierre d'aujourd'hui, sur une seule rangée qui glisse au pouce
 * 2 FRISE XL · grandes cartes qui glissent une à une, pièce détourée en grand, nom en italique, barre de progression
 * 3 ROULEAU  · pastilles compactes (mini-photo + nom + nombre) sur une rangée : le plus bas, la grille remonte
 * 4 TIROIR   · un seul bouton « Famille · Toutes 564 » qui ouvre un panneau avec toutes les familles en grand
 * 5 VEDETTE  · la famille active en grande carte, les autres en ronds photo dessous (façon stories) */
type FamillesLook = 1 | 2 | 3 | 4 | 5;
const readFamilles = (): FamillesLook | null => {
  // RETENU (Nolan, 25/10) : 5 VEDETTE par défaut ; ?familles=0 rend l'ancienne grille, ?familles=1..4 les autres
  try { const r = new URLSearchParams(window.location.search).get("familles"); if (r === null) return 5; const n = Number(r); return n >= 1 && n <= 5 ? (n as FamillesLook) : null; } catch { return 5; }
};
type Fam = { c: CatCategory | null; n: number; on: boolean; go: () => void };
/* 25/10 ~03h : Vedette + bandeau guide = deux blocs noirs avec la MÊME photo (capture iPhone de Nolan, Chargeurs).
 * ?vedette=1..5 (téléphone) — un seul noir au plus, une seule photo :
 * 1 FUSION      · une seule carte carbone ; le guide devient sa bande du bas
 * 2 CLAIRE      · carte vedette en pierre avec la photo ; le guide reste carbone, sans photo (icône livre)
 * 3 RONDS       · plus de grande carte : les ronds grossissent ; le guide Affiche porte le seul noir et la photo
 * 4 TOUT CLAIR  · carte blanche avec photo, guide en lien vert dans la carte : zéro noir
 * 5 NOIR + LIGNE· carte carbone gardée ; le guide devient une ligne claire sans photo */
export type VedetteLook = 0 | 1 | 2 | 3 | 4 | 5;
export const readVedette = (): VedetteLook => {
  // RETENU (Nolan, 25/10) : 1 FUSION par défaut ; ?vedette=0 = deux blocs (avant), 2..5 = autres propositions
  try { const v = new URLSearchParams(window.location.search).get("vedette"); if (v === null) return 1; const n = Number(v); return n >= 0 && n <= 5 ? (n as VedetteLook) : 1; } catch { return 1; }
};
type GuideInfo = { title: string; sub: string; to: string } | null;
const guideInfo = (cat: CatCategory | undefined | null, n: number): GuideInfo =>
  cat ? { title: `Tout sur les ${cat.name.toLowerCase()}`, sub: n > 1 ? `Les ${n} références et comment choisir` : n === 1 ? "1 référence et comment choisir" : "Comment choisir", to: `/categorie/${cat.slug}` } : null;
const famImg = (c: CatCategory | null, cls: string) => (c && pack(c.slug) ? <img src={pack(c.slug)} alt="" loading="lazy" className={cls} /> : null);
const CUT6 = "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)";
const ITAL = { fontFamily: UNB, fontStyle: "italic" as const, fontWeight: 900 };

const FamillesMobile = ({ look, fams, vd = 0 }: { look: FamillesLook; fams: Fam[]; vd?: VedetteLook }) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [prog, setProg] = useState(0);
  const [open, setOpen] = useState(false);
  const onKey = fams.map((f) => (f.on ? 1 : 0)).join("");
  // la famille active est ramenée au centre de la rangée
  useEffect(() => {
    const row = rowRef.current; if (!row) return;
    const el = row.querySelector<HTMLElement>("[data-on='1']"); if (!el) return;
    const rr = row.getBoundingClientRect(), er = el.getBoundingClientRect();
    row.scrollLeft += er.left - rr.left - (rr.width - er.width) / 2;
  }, [onKey]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  const row = "flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 snap-x snap-proximity"; // proximity : mandatory re-cale la rangée au début quand la fenêtre change de hauteur (barre d’adresse du téléphone)
  const noBar = { scrollbarWidth: "none" as const };
  const active = fams.find((f) => f.on) ?? fams[0];

  if (look === 1) return (
    <div ref={rowRef} className={cn(row, "mt-5")} style={noBar}>
      {fams.map((f) => (
        <span key={f.c?.id ?? "all"} data-on={f.on ? "1" : "0"} className="snap-start shrink-0 w-[118px]">
          <CatTileNew c={f.c} n={f.n} on={f.on} onClick={f.go} look={1} size="sm" />
        </span>
      ))}
    </div>
  );

  if (look === 2) return (
    <div className="mt-5">
      <div ref={rowRef} className={cn(row, "gap-3")} style={noBar} onScroll={(e) => { const t = e.currentTarget; setProg(t.scrollLeft / Math.max(1, t.scrollWidth - t.clientWidth)); }}>
        {fams.map((f) => (
          <button key={f.c?.id ?? "all"} type="button" data-on={f.on ? "1" : "0"} onClick={f.go} aria-pressed={f.on}
            className="snap-center shrink-0 relative w-[72%] max-w-[300px] h-[150px] overflow-hidden text-left"
            style={{ clipPath: CHAMFER, background: f.on ? CARBON : STONE }}>
            {f.c ? famImg(f.c, "absolute right-[-6%] top-1/2 -translate-y-1/2 h-[112%] w-auto max-w-[70%] object-contain drop-shadow-[0_10px_14px_rgba(0,0,0,0.25)]")
              : <span className="absolute right-0 top-0 bottom-0 w-[62%]"><AllCollage big /></span>}
            <span className="absolute left-4 top-3 leading-none" style={{ ...ITAL, fontSize: 30, color: f.on ? "#8FC79E" : GREEN }}>{f.n}</span>
            <span className="absolute left-4 bottom-3 max-w-[58%] text-lg uppercase leading-[1.05]" style={{ ...ITAL, color: f.on ? "#fff" : CARBON }}>{f.c ? f.c.name : "Toutes"}</span>
          </button>
        ))}
      </div>
      <div className="mt-2 h-1 bg-[#E2DCD0] relative overflow-hidden" aria-hidden><span className="absolute top-0 bottom-0 w-1/4" style={{ left: `${prog * 75}%`, background: CARBON }} /></div>
    </div>
  );

  if (look === 3) return (
    <div ref={rowRef} className={cn(row, "mt-4")} style={noBar}>
      {fams.map((f) => (
        <button key={f.c?.id ?? "all"} type="button" data-on={f.on ? "1" : "0"} onClick={f.go} aria-pressed={f.on}
          className="snap-start shrink-0 inline-flex items-center gap-2 h-12 pl-1 pr-3"
          style={{ clipPath: CUT6, background: f.on ? CARBON : "#fff", boxShadow: f.on ? undefined : `inset 0 0 0 1px ${LINE}`, fontFamily: FONT }}>
          <span className="relative w-10 h-10 shrink-0 overflow-hidden" style={{ background: f.on ? "rgba(255,255,255,0.12)" : STONE, clipPath: CUT6 }}>
            {f.c ? famImg(f.c, "absolute inset-[8%] w-[84%] h-[84%] object-contain") : <AllCollage />}
          </span>
          <span className="text-sm font-extrabold whitespace-nowrap" style={{ color: f.on ? "#fff" : CARBON }}>{f.c ? f.c.name : "Toutes"}</span>
          <span className="text-sm" style={{ ...ITAL, color: f.on ? "#8FC79E" : GREEN }}>{f.n}</span>
        </button>
      ))}
    </div>
  );

  if (look === 4) return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="mt-4 w-full flex items-center gap-3 h-16 pl-2 pr-4 bg-white text-left"
        style={{ clipPath: CHAMFER, boxShadow: `inset 0 0 0 1px ${LINE}`, fontFamily: FONT }}>
        <span className="relative w-12 h-12 shrink-0 overflow-hidden" style={{ background: STONE, clipPath: CUT6 }}>
          {active.c ? famImg(active.c, "absolute inset-[8%] w-[84%] h-[84%] object-contain") : <AllCollage />}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-bold uppercase tracking-wider text-gray-500">Famille · {fams.length - 1}</span>
          <span className="block text-base font-extrabold truncate" style={{ color: CARBON }}>{active.c ? active.c.name : "Toutes les pièces"} <span style={{ ...ITAL, color: GREEN }}>{active.n}</span></span>
        </span>
        <ChevronDown className="w-5 h-5 text-gray-500" />
      </button>
      {open && createPortal(
        <div className="fixed inset-0 z-[80] flex items-end" role="dialog" aria-modal="true" aria-label="Choisir une famille">
          <button type="button" aria-label="Fermer" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/50" />
          <div className="relative w-full max-h-[85vh] overflow-y-auto bg-[#FAFAF8] px-4 pt-4 pb-8" style={{ clipPath: "polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xl uppercase" style={{ ...ITAL, color: CARBON }}>Les familles</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fermer" className="w-11 h-11 flex items-center justify-center -mr-2"><X className="w-6 h-6" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {fams.map((f) => (
                <button key={f.c?.id ?? "all"} type="button" onClick={() => { f.go(); setOpen(false); }} aria-pressed={f.on}
                  className="relative h-[132px] overflow-hidden text-left" style={{ clipPath: CHAMFER, background: f.on ? CARBON : STONE }}>
                  {f.c ? famImg(f.c, "absolute left-1/2 top-[8%] -translate-x-1/2 h-[60%] w-auto max-w-[80%] object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.2)]") : <AllCollage />}
                  <span className="absolute left-3 right-3 bottom-2.5 flex items-end justify-between gap-2" style={{ fontFamily: FONT }}>
                    <span className="text-sm font-extrabold leading-tight" style={{ color: f.on ? "#fff" : CARBON }}>{f.c ? f.c.name : "Toutes"}</span>
                    <span className="text-base leading-none" style={{ ...ITAL, color: f.on ? "#8FC79E" : GREEN }}>{f.n}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>, document.body)}
    </>
  );

  // 5 · VEDETTE (+ variantes ?vedette=1..5 qui règlent le doublon avec le bandeau guide)
  const g = guideInfo(active.c, active.n);
  const dark = vd === 0 || vd === 1 || vd === 5;
  const stone = vd === 2;
  const big = vd === 3; // ronds seuls, plus grands
  const heroBg = dark ? CARBON : stone ? STONE : "#fff";
  const heroInk = dark ? "#fff" : CARBON;
  const heroAccent = dark ? "#8FC79E" : GREEN;
  const rd = big ? 76 : 64;
  return (
    <div className="mt-5">
      {!big && (
        <div className="relative overflow-hidden" style={{ clipPath: CHAMFER, background: heroBg, boxShadow: vd === 4 ? `inset 0 0 0 1px ${LINE}` : undefined }}>
          <div className="relative h-[150px]">
            {active.c ? famImg(active.c, cn("absolute right-[-4%] top-1/2 -translate-y-1/2 h-[118%] w-auto max-w-[66%] object-contain", dark ? "drop-shadow-[0_12px_16px_rgba(0,0,0,0.45)]" : "drop-shadow-[0_12px_14px_rgba(0,0,0,0.18)]"))
              : <span className="absolute right-0 top-0 bottom-0 w-[60%]"><AllCollage big /></span>}
            <span className="absolute left-4 top-3 text-sm font-bold uppercase tracking-wider" style={{ fontFamily: FONT, color: heroAccent }}>{active.n} pièce{active.n > 1 ? "s" : ""}</span>
            <span className="absolute left-4 bottom-3 max-w-[60%] text-2xl uppercase leading-[1.02]" style={{ ...ITAL, color: heroInk }}>{active.c ? active.c.name : "Toutes les pièces"}</span>
          </div>
          {g && vd === 1 && (
            // 25/10 : Nolan garde la FUSION, « sans l'emoji vert à gauche, plus classe, plus simple »
            <Link to={g.to} aria-label={`Le guide de l'atelier : ${g.title}`} className="group flex items-center gap-3 min-h-[56px] mx-4 py-2.5 border-t border-white/15" style={{ fontFamily: FONT }}>
              <span className="flex-1 min-w-0 leading-tight">
                <span className="block text-sm font-bold uppercase tracking-[0.12em] text-white/55">Le guide de l'atelier</span>
                <span className="block text-base font-extrabold text-white">{g.title}</span>
              </span>
              <ArrowRight className="w-5 h-5 shrink-0 text-white transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
          {g && vd === 4 && (
            <Link to={g.to} className="flex items-center gap-2 min-h-[48px] px-4" style={{ fontFamily: FONT, borderTop: `1px solid ${LINE}` }}>
              <BookOpen className="w-4 h-4 shrink-0" style={{ color: GREEN }} />
              <span className="flex-1 min-w-0 py-2 leading-tight"><span className="block text-sm font-extrabold" style={{ color: CARBON }}>{g.title}</span><span className="block text-sm" style={{ color: GREEN }}>Le guide de l'atelier</span></span>
              <ArrowRight className="w-5 h-5 shrink-0" style={{ color: GREEN }} />
            </Link>
          )}
        </div>
      )}
      <div ref={rowRef} className={cn(row, "pt-1.5 gap-3", big ? "" : "mt-1.5")} style={noBar}>{/* pt : l'anneau vert de la famille active (5 px hors du rond) était coupé par le défilement */}
        {fams.map((f) => (
          <button key={f.c?.id ?? "all"} type="button" data-on={f.on ? "1" : "0"} onClick={f.go} aria-pressed={f.on} className="snap-start shrink-0 flex flex-col items-center gap-1" style={{ width: rd + 8 }}>
            <span className="relative rounded-full overflow-hidden" style={{ width: rd, height: rd, background: STONE, boxShadow: f.on ? `0 0 0 3px #FAFAF8, 0 0 0 5px ${GREEN}` : `inset 0 0 0 1px ${LINE}` }}>
              {f.c ? famImg(f.c, "absolute inset-[10%] w-[80%] h-[80%] object-contain") : <AllCollage />}
            </span>
            <span className="text-sm leading-tight text-center line-clamp-2" style={{ fontFamily: FONT, fontWeight: f.on ? 800 : 700, color: f.on ? GREEN : CARBON }}>{f.c ? f.c.name : "Toutes"}</span>
            {big && <span className="text-sm leading-none" style={{ ...ITAL, color: f.on ? GREEN : "#8A8478" }}>{f.n}</span>}
          </button>
        ))}
      </div>
    </div>
  );
};

/* Bandeau guide côté TÉLÉPHONE selon ?vedette (l'ordinateur garde GuideLink tel quel). */
const GuideMobile = ({ vd, cat, n, img }: { vd: VedetteLook; cat: CatCategory | undefined; n: number; img?: string }) => {
  const g = guideInfo(cat, n);
  if (!g || vd === 1 || vd === 4) return null; // intégré à la carte vedette
  if (vd === 0 || vd === 3) return <GuideLink cat={cat} n={n} img={img} />;
  if (vd === 2) return (
    <Link to={g.to} className="relative mt-3 flex items-center gap-3 min-h-[72px] pl-4 pr-12 py-3" style={{ background: CARBON, clipPath: CHAMFER }}>
      <span className="w-10 h-10 shrink-0 flex items-center justify-center" style={{ background: "rgba(143,199,158,0.14)", clipPath: CUT6 }}><BookOpen className="w-5 h-5" style={{ color: "#8FC79E" }} /></span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-bold uppercase tracking-wider" style={{ fontFamily: FONT, color: "#8FC79E" }}>Le guide de l'atelier</span>
        <span className="block text-base uppercase leading-tight text-white" style={ITAL}>{g.title}</span>
      </span>
      <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white" />
    </Link>
  );
  // 5 · ligne claire
  return (
    <Link to={g.to} className="mt-3 flex items-center gap-3 min-h-[52px] px-4" style={{ background: "#EDE7DB", clipPath: CHAMFER, fontFamily: FONT }}>
      <BookOpen className="w-5 h-5 shrink-0" style={{ color: GREEN }} />
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-extrabold truncate" style={{ color: CARBON }}>{g.title}</span>
        <span className="block text-sm text-gray-500 truncate">Le guide de l'atelier · {g.sub.toLowerCase()}</span>
      </span>
      <ArrowRight className="w-5 h-5 shrink-0" style={{ color: CARBON }} />
    </Link>
  );
};

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
/* 25/10 (Nolan : « le bouton Tout sur les chambres à air, un peu light, pas très joli ») : 5 propositions ?guide=1..5.
 * 0 = bandeau d'origine (défaut tant que Nolan n'a pas choisi).
 * 1 AFFICHE   · bandeau carbone à coin coupé, photo de la famille qui dépasse à droite, titre Unbounded italique blanc
 * 2 FICHE     · carte blanche, photo détourée à gauche, « Le guide de l'atelier » + titre + flèche dans un carré noir
 * 3 TICKET    · carte beige foncé à bord pointillé, étiquette « GUIDE » noire, 3 repères en puces
 * 4 PLEIN     · grande carte photo pleine largeur (famille détourée sur fond pierre), titre en gros dessous
 * 5 LIGNE     · titre Unbounded italique souligné vert + flèche, sans cadre (le plus littéral : plus gros, pas plus chargé) */
// 25/10 : Nolan a retenu la 1 « Affiche » = défaut ; ?guide=0 = ancien bandeau blanc, 2..5 = autres propositions.
const readGuideLook = (): number => {
  try { const v = new URLSearchParams(window.location.search).get("guide"); if (v === null) return 1; const n = Number(v); return n >= 0 && n <= 5 ? n : 1; } catch { return 1; }
};
const TIPS: Record<string, string[]> = {
  pneus: ["La taille sur le flanc", "Gonflable, tubeless ou plein", "La valve droite ou coudée"],
  "pneus-pleins": ["Même taille que l'origine", "Plus de crevaison", "Un peu plus ferme"],
  "chambres-a-air": ["La taille du pneu", "La forme de la valve", "Renforcée ou standard"],
  plaquettes: ["La forme de l'étrier", "Organique ou fritté", "Par paire"],
  disques: ["Le diamètre", "L'entraxe des trous", "L'épaisseur"],
  chargeurs: ["La tension de la batterie", "La prise", "L'ampérage"],
};
const GuideLink = ({ cat, n, img }: { cat: CatCategory | undefined; n: number; img?: string }) => {
  if (!cat) return null;
  const look = readGuideLook();
  const title = `Tout sur les ${cat.name.toLowerCase()}`;
  const sub = n > 1 ? `Les ${n} références et comment choisir` : n === 1 ? "1 référence et comment choisir" : "Comment choisir";
  const to = `/categorie/${cat.slug}`;
  const tips = TIPS[cat.slug] ?? ["Comment choisir", "Les tailles", "Les erreurs à éviter"];
  if (look === 1) return (
    <Link to={to} className="relative mt-3 flex items-center gap-3 min-h-[76px] pl-5 pr-28 sm:pr-36 py-3 transition-transform hover:-translate-y-0.5" style={{ background: CARBON, clipPath: CHAMFER }}>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-bold uppercase tracking-wider" style={{ fontFamily: FONT, color: "#8FC79E" }}>Le guide de l'atelier</span>
        <span className="block text-base sm:text-lg uppercase leading-tight text-white" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic" }}>{title}</span>
        <span className="block text-sm text-white/70" style={{ fontFamily: FONT }}>{sub}</span>
      </span>
      {img && <img src={img} alt="" className="absolute right-10 sm:right-12 top-1/2 -translate-y-1/2 h-[84px] sm:h-[96px] w-auto max-w-[110px] object-contain pointer-events-none" style={{ filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.45))" }} />}
      <ArrowRight className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white" />
    </Link>
  );
  if (look === 2) return (
    <Link to={to} className="mt-3 flex items-stretch min-h-[84px] bg-white transition-transform hover:-translate-y-0.5" style={{ clipPath: CHAMFER, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
      <span className="shrink-0 w-[84px] sm:w-[104px] flex items-center justify-center" style={{ background: "#F2EFE8" }}>
        {img ? <img src={img} alt="" className="max-w-[80%] max-h-[72px] object-contain" /> : <BookOpen className="w-7 h-7" style={{ color: GREEN }} />}
      </span>
      <span className="flex-1 min-w-0 px-4 py-3 flex flex-col justify-center">
        <span className="text-sm font-bold uppercase tracking-wider" style={{ fontFamily: FONT, color: GREEN }}>Le guide de l'atelier</span>
        <span className="text-base sm:text-lg font-extrabold leading-tight" style={{ fontFamily: FONT, color: CARBON }}>{title}</span>
        <span className="text-sm text-gray-500 truncate" style={{ fontFamily: FONT }}>{sub}</span>
      </span>
      <span className="shrink-0 w-14 flex items-center justify-center" style={{ background: CARBON }}><ArrowRight className="w-5 h-5 text-white" /></span>
    </Link>
  );
  if (look === 3) return (
    <Link to={to} className="mt-3 block px-4 py-3 transition-transform hover:-translate-y-0.5" style={{ background: "#EDE7DB", border: `1.5px dashed #B8AE9C`, fontFamily: FONT }}>
      <span className="flex items-center gap-2">
        <span className="px-2 leading-6 text-sm font-extrabold uppercase tracking-wider text-white" style={{ background: CARBON, clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)" }}>Guide</span>
        <span className="flex-1 min-w-0 text-base font-extrabold leading-tight truncate" style={{ color: CARBON }}>{title}</span>
        <ArrowRight className="w-5 h-5 shrink-0" style={{ color: CARBON }} />
      </span>
      <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {tips.map((t) => <span key={t} className="inline-flex items-center gap-1.5 text-sm text-gray-700"><Check className="w-3.5 h-3.5" strokeWidth={3} style={{ color: GREEN }} />{t}</span>)}
      </span>
    </Link>
  );
  if (look === 4) return (
    <Link to={to} className="mt-3 grid grid-cols-[1fr_auto] sm:grid-cols-[auto_1fr_auto] items-center gap-x-4 bg-white transition-transform hover:-translate-y-0.5" style={{ clipPath: CHAMFER, boxShadow: `inset 0 0 0 1px ${LINE}` }}>
      <span className="col-span-2 sm:col-span-1 sm:row-span-1 h-[120px] sm:h-[112px] sm:w-[180px] flex items-center justify-center" style={{ background: "#F2EFE8" }}>
        {img ? <img src={img} alt="" className="max-h-[96px] max-w-[70%] sm:max-w-[85%] object-contain" style={{ filter: "drop-shadow(0 10px 12px rgba(0,0,0,0.18))" }} /> : null}
      </span>
      <span className="min-w-0 px-4 sm:px-0 py-3">
        <span className="block text-lg sm:text-xl uppercase leading-tight" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON }}>{title}</span>
        <span className="block mt-1 text-sm text-gray-500" style={{ fontFamily: FONT }}>{tips.join(" · ")}</span>
      </span>
      <span className="pr-4 py-3"><span className="w-11 h-11 flex items-center justify-center" style={{ background: CARBON, clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)" }}><ArrowRight className="w-5 h-5 text-white" /></span></span>
    </Link>
  );
  if (look === 5) return (
    <Link to={to} className="mt-4 group inline-flex items-center gap-2 min-h-[44px]">
      <BookOpen className="w-5 h-5 shrink-0" style={{ color: GREEN }} />
      <span className="text-base sm:text-lg uppercase leading-tight underline decoration-[3px] underline-offset-[6px]" style={{ fontFamily: UNB, fontWeight: 900, fontStyle: "italic", color: CARBON, textDecorationColor: GREEN }}>{title}</span>
      <ArrowRight className="w-5 h-5 shrink-0 transition-transform group-hover:translate-x-1" style={{ color: CARBON }} />
    </Link>
  );
  return (
    <Link to={to} className="mt-3 flex items-center gap-3 min-h-[52px] pl-4 pr-3 bg-white transition-transform hover:-translate-y-0.5"
      style={{ clipPath: CHAMFER, boxShadow: `inset 4px 0 0 ${GREEN}, inset 0 0 0 1px ${LINE}` }}>
      <BookOpen className="w-5 h-5 shrink-0" style={{ color: GREEN }} />
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-extrabold uppercase tracking-wide truncate" style={{ fontFamily: FONT, color: CARBON }}>{title}</span>
        <span className="block text-sm text-gray-500 truncate" style={{ fontFamily: FONT }}>{sub}</span>
      </span>
      <ArrowRight className="w-5 h-5 shrink-0" style={{ color: CARBON }} />
    </Link>
  );
};

const CatalogueTop = (p: Props) => {
  const all = p.categories.reduce((n, c) => n + (p.counts[c.id] ?? 0), 0);
  const FAMILLES = readFamilles();
  const VEDETTE = readVedette();
  const fams: Fam[] = [
    { c: null, n: all, on: p.activeCategory === null, go: () => p.onCategory(null) },
    ...p.categories.map((c) => ({ c, n: p.counts[c.id] ?? 0, on: p.activeCategory === c.id, go: () => p.onCategory(c.id) })),
  ];
  const tiles = (size: "sm" | "md" = "md") => [
    TUILE ? <CatTileNew key="all" c={null} n={all} on={p.activeCategory === null} onClick={() => p.onCategory(null)} size={size} look={TUILE} />
      : <CatTile key="all" c={null} n={all} on={p.activeCategory === null} onClick={() => p.onCategory(null)} size={size} />,
    ...p.categories.map((c) => TUILE
      ? <CatTileNew key={c.id} c={c} n={p.counts[c.id] ?? 0} on={p.activeCategory === c.id} onClick={() => p.onCategory(c.id)} size={size} look={TUILE} />
      : <CatTile key={c.id} c={c} img={p.images[c.id]} n={p.counts[c.id] ?? 0} on={p.activeCategory === c.id} onClick={() => p.onCategory(c.id)} size={size} />),
  ];

  // ── 1 · VITRINE ──
  if (p.look === 1) {
    return (
      <section className="container mx-auto px-4 pt-6 lg:pt-10 pb-4">
        <div className="flex items-end justify-between gap-4 flex-wrap"><Title /><span className="flex items-baseline gap-3 flex-wrap"><Count n={p.resultCount} total={p.total} />{p.countAside}</span></div>
        {p.pickerBlock && <div className="max-w-2xl">{p.pickerBlock}</div>}
        <div className="mt-5 max-w-2xl"><SearchField value={p.query} onChange={p.onQuery} /></div>
        {FAMILLES && <div className="lg:hidden"><FamillesMobile look={FAMILLES} fams={fams} vd={VEDETTE} /></div>}
        <div className={cn(TUILE === 4 ? "mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-2" : TUILE === 2 ? "mt-5 grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-x-2 gap-y-3" : "mt-5 grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2", FAMILLES && "hidden lg:grid")}>{tiles()}</div>
        {p.activeCategory && (FAMILLES === 5
          ? <>
              <div className="lg:hidden"><GuideMobile vd={VEDETTE} cat={p.categories.find((c) => c.id === p.activeCategory)} n={p.counts[p.activeCategory] ?? 0} img={p.images[p.activeCategory]} /></div>
              <div className="hidden lg:block max-w-2xl"><GuideLink cat={p.categories.find((c) => c.id === p.activeCategory)} n={p.counts[p.activeCategory] ?? 0} img={p.images[p.activeCategory]} /></div>
            </>
          : <div className="max-w-2xl"><GuideLink cat={p.categories.find((c) => c.id === p.activeCategory)} n={p.counts[p.activeCategory] ?? 0} img={p.images[p.activeCategory]} /></div>)}
        <div className="mt-4"><Filters {...p} /></div>
        {p.afterFilters && <div className="mt-3">{p.afterFilters}</div>}
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
